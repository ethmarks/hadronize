import { sl, type slChunk } from "./styledLog";

/**
 * Get input function of Non-browser runtimes (Node, Deno, and Bun).
 */
export function getNbrInputFunc(): (message: string) => Promise<string> {
  if ("Deno" in globalThis || "Bun" in globalThis) {
    // Deno and Bun both expose globalThis.prompt
    return async (message: string): Promise<string> => {
      const response = globalThis.prompt(message)!;

      // In Deno, if you CTRL+C during a prompt(), it returns null rather than
      // throwing.
      if (response === null) {
        throw new DOMException("aborted", "AbortError");
      }

      return response;
    };
  } else if ("process" in globalThis) {
    // Node needs a readline polyfill
    return async (message: string) => {
      const readline = await import("node:readline/promises");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await rl.question(message);
      rl.close();
      return answer;
    };
  } else {
    throw new Error(
      "Running in an unspported NBR; cannot get user input function. Try running this in Node or Deno instead.",
    );
  }
}
