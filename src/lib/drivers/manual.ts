import type { Driver, Scratchpad } from "$lib/Player";
import type { CurrentGameState, PlayerState } from "$lib/Hadronize";
import sl, { type slChunk } from "../utils/styledLog";
import { getNbrInputFunc } from "../utils/nbrInput";

async function getUserInput(state: CurrentGameState): Promise<string> {
  const isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined";

  if (isBrowser) {
    // We're in the browser
    let resumeExecution: () => void;
    let userInput: string = "";

    function takeTurn(input: string) {
      userInput = input;
      resumeExecution();
    }

    // Function containing all of the window properties to clean up after
    // they're used.
    const cleanup: string[] = ["turn"];

    // Fallback function. Called like `turn("alice")`. Inelegant syntax but
    // reliable.
    (window as any).turn = takeTurn;

    // Main interface. Called like `alice`. Very elegant syntax, but unreliable due to the possibility of overriding properties.
    state.players.forEach((player) => {
      try {
        Object.defineProperty(window, player.name, {
          get: function () {
            takeTurn(player.name);
          },
          configurable: true,
        });
        cleanup.push(player.name);
      } catch {
        // window already had a property with the same name as the player, and
        // it wasn't configurable. This probably means that the player was
        // named something like "localStorage" or any other already-existant
        // property of window. They can just use the fallback function.
      }
    });

    // Pause execution until takeTurn() is run
    await new Promise<void>((resolve) => {
      resumeExecution = resolve;
    });

    // Clean up the window properties
    cleanup.forEach((prop) => {
      delete (window as any)[prop];
    });

    return userInput;
  } else {
    // We're in Node, Deno, or Bun
    const nbrInput = getNbrInputFunc();

    const userInput = await nbrInput("");

    return userInput;
  }
}

/**
 * Manual driver that uses the console to query the user for input in the
 * browser, Node, Deno, or Bun.
 */
export const manualDriver: Driver = async (
  state: CurrentGameState,
  _pad: Scratchpad,
): Promise<number> => {
  let userInput: string = "";

  let player: PlayerState | undefined = undefined;

  while (player === undefined) {
    if (userInput !== "") {
      // Create chunks for error message
      const chunks: slChunk[] = [];

      chunks.push(["Invalid input! ", "red"]);
      chunks.push([
        "Please type the name or order number of the player who you want to observe the superposed quark.",
        "white",
      ]);

      sl(chunks);
    }

    // Create chunks for message
    const chunks: slChunk[] = [];
    chunks.push([state.players[state.activePlayer].name, "white"]);
    chunks.push(["'s turn", "gray"]);
    chunks.push([":", "white"]);
    chunks.push([" (", "gray"]);
    state.players.forEach((p, index, arr) => {
      chunks.push([p.name, "italic"]);
      if (index < arr.length - 1) {
        chunks.push([", ", "gray"]);
      }
    });
    chunks.push([") ", "gray"]);

    // Print message
    sl(chunks);

    userInput = await getUserInput(state);

    const num = Number(userInput);

    if (Number.isNaN(num)) {
      // User gave a string
      const match = state.players.find(
        (p) => p.name.toLowerCase() === userInput.toLowerCase(),
      );
      if (match !== undefined) {
        player = match;
      }
    } else {
      // User gave a number
      const match = state.players.find((p) => p.order === num);
      if (match !== undefined) {
        player = match;
      }
    }
  }

  return player.order;
};
