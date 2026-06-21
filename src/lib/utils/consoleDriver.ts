import type { Driver, Scratchpad } from "$lib/Player";
import type { CurrentGameState, PlayerState } from "$lib/Hadronize";

/**
 * Get input function of Non-browser runtimes (Node or Deno).
 */
function getNbrInputFunc(): (message: string) => Promise<string> {
  if ("Deno" in globalThis) {
    // Deno
    return (globalThis as any).prompt as (message: string) => Promise<string>;
  } else if ("process" in globalThis) {
    // Node
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

async function getUserInput(message: string): Promise<string> {
  const isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined";

  if (isBrowser) {
    // We're in the browser
    throw new Error("Browser support is WIP");
  } else {
    // We're in Node or Deno
    const prompt = getNbrInputFunc();

    const input = await prompt(message);

    return input;
  }
}

/**
 * Manual driver that uses the console to query the user for input in the
 * browser, Node, or Deno.
 */
export const consoleDriver: Driver = async (
  state: CurrentGameState,
  _scratchpad: Scratchpad,
): Promise<number> => {
  let userInput: string = "";

  let player: PlayerState | undefined = undefined;

  while (player === undefined) {
    if (userInput !== "") {
      console.log("Invalid input. Please try again.");
    }

    const message = `${state.players[state.activePlayer].name}'s turn: (${state.players.map((p) => p.name).join(", ")}) `;

    userInput = await getUserInput(message);

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
