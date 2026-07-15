import { getQuickJS, shouldInterruptAfterDeadline } from "quickjs-emscripten";

import type { CurrentGameState } from "../Hadronize.ts";
import type { Driver, Scratchpad } from "../Player.ts";

const QuickJS = await getQuickJS();

class QuickJSError {
  constructor(public message: string) {}
}

/**
 * From one of my earlier projects
 *
 * https://github.com/ethmarks/nolet/blob/main/src/lib/runSnippet.ts
 */
function runSnippet(
  userCode: string,
  inputString: string,
  iife: boolean = true,
): unknown {
  const vm = QuickJS.newContext();

  // Remove non-deterministic functions from the global object.
  vm.evalCode("delete Math.random;");
  vm.evalCode("delete Date;");
  vm.evalCode("delete performance;");

  const snippet = iife ? `(() => {\n${userCode}\n})();` : userCode;

  const code = `
${inputString}

${snippet}
`;

  vm.runtime.setInterruptHandler(
    shouldInterruptAfterDeadline(Date.now() + 1000),
  );

  let result;

  try {
    result = vm.evalCode(code);
  } catch (err) {
    const errMsg =
      err instanceof Error
        ? err.message
        : "Unknown error while executing code.";

    if (errMsg.includes("too much recursion")) {
      return new QuickJSError(
        "Your code uses more recursion that the engine can execute. This probably means that you have an infinite loop.",
      );
    }

    return new QuickJSError(errMsg);
  }

  const output = (() => {
    if (typeof result === "undefined") {
      return new QuickJSError("Unknown error while executing code.");
    }

    if (result.error) {
      const error = vm.dump(result.error);
      result.error.dispose();

      if (!(
        typeof error.name === "string" && typeof error.message === "string"
      )) {
        return new QuickJSError("Unknown error while executing code.");
      }

      const errName = error.name as string;
      const errMsg = error.message as string;

      if (errName === "InternalError" && errMsg.includes("interrupted")) {
        return new QuickJSError(
          "Your code took too long to execute, so it was terminated early to prevent crashing the page. You might have an infinite loop in your code, or maybe you're just using a very inefficient algorithm.",
        );
      }

      if (
        (errName === "TypeError" && errMsg.includes("not a function")) ||
        (errName === "ReferenceError" && errMsg.includes("is not defined"))
      ) {
        // The user might have tried to use one of the built-in functions that
        // we removed.
        if (code.includes("Math.random")) {
          return new QuickJSError(
            "It looks like you tried to use `Math.random()`. `Math.random()` is unavailable because it produces non-deterministic outputs, which are disallowed in pure functional programming. Find another way to approach the problem.",
          );
        }
        if (code.includes("Date")) {
          return new QuickJSError(
            "It looks like you tried to use `Date`. `Date` is unavailable because it can produce non-deterministic outputs, which are disallowed in pure functional programming. Find another way to approach the problem.",
          );
        }
        if (code.includes("performance")) {
          return new QuickJSError(
            "It looks like you tried to use `performance`. `performance` is unavailable because it produces non-deterministic outputs, which are disallowed in pure functional programming. Find another way to approach the problem.",
          );
        }

        if (code.includes("console")) {
          return new QuickJSError(
            "It looks like you tried to use `console`. `console` is unavailable in QuickJS. Try doing an early return instead and reading the error output.",
          );
        }
      }

      return new QuickJSError(`${errName}: ${errMsg}`);
    } else {
      const value = vm.dump(result.value);
      result.value.dispose();

      return value;
    }
  })();

  vm.dispose();

  return output;
}

export function quickjsDriverFactory(code: string): Driver {
  return async (
    state: CurrentGameState,
    pad: Scratchpad,
  ): Promise<number | undefined> => {
    const inputString = `const state = ${JSON.stringify(state)};`;

    const me = state.players[state.activePlayer];

    const res = runSnippet(code, inputString);

    if (res instanceof QuickJSError) {
      console.error(`Error from QuickJS driver (${me.name}): ${res.message}`);
      return;
    }

    if (typeof res !== "number") {
      console.error(
        `QuickJS driver (${me.name}) returned a ${typeof res} instead of a number.`,
      );
      return;
    }

    return res;
  };
}

export const js = (strings: TemplateStringsArray): Driver =>
  quickjsDriverFactory(strings[0]);
