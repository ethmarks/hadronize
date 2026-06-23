import { MAX_PLAYERS, MIN_PLAYERS } from "../Hadronize";
import { prngDriver, manualDriver } from "../drivers";

import sl from "./styledLog";
import { getNbrInputFunc, getValidatedUserInput } from "./input";
import type { PlayerInit } from "../Player";
import { type CliOptions } from "./print";
import { main } from "./main";

/**
 * Runs a demo of main()
 */
export async function demo() {
  // It shouldn't be possible for this to run in the browser, but we check just
  // in case.
  const isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined";
  if (isBrowser) {
    throw new Error("Cannot run cli demo directly in browser.");
  }

  try {
    sl([["Welcome to Hadronize!\n", "blue"]]);

    const nbrInput: () => Promise<string> = async () => getNbrInputFunc()("");

    const seedInput: string = await getValidatedUserInput(
      nbrInput,
      [
        "What seed to use?",
        [" (enter an integer or leave blank for random)", "gray"],
      ],
      [
        ["Invalid seed!", "red"],
        " Enter a positive integer to use as the seed or leave blank for a random seed.",
      ],
      (input: string): boolean => {
        if (input === "") return true;
        const num = Number(input);
        if (Number.isNaN(num)) return false;
        if (num < 1) return false;
        return true;
      },
    );
    const seed: number =
      seedInput === ""
        ? Math.floor(Math.random() * 2 ** 32)
        : Number(seedInput);

    sl([
      ["Using seed ", "gray"],
      [seed.toString(), "yellow"],
      [".\n", "gray"],
    ]);

    const playerCountInput: string = await getValidatedUserInput(
      nbrInput,
      [
        "How many players?",
        [
          ` (enter an integer between ${MIN_PLAYERS} and ${MAX_PLAYERS})`,
          "gray",
        ],
      ],
      [
        ["Invalid player count!", "red"],
        ` Enter an integer between ${MIN_PLAYERS} and ${MAX_PLAYERS})`,
      ],
      (input: string): boolean => {
        const num = Number(input);
        if (Number.isNaN(num)) return false;
        if (num < MIN_PLAYERS) return false;
        if (num > MAX_PLAYERS) return false;
        return true;
      },
    );
    const playerCount: number = Number(playerCountInput);

    // Print a newline
    sl([""]);

    const playerInputs: { name: string; type: "human" | "bot" }[] = [];
    for (let i: number = 0; i < playerCount; i++) {
      const playerName: string = await getValidatedUserInput(
        nbrInput,
        [
          `What is the name of `,
          [`player ${i}`, "magenta"],
          "?",
          [` (enter an string)`, "gray"],
        ],
        [
          ["Invalid player name!", "red"],
          ` Try only using letters, and ensure that there isn't already a player with that name.`,
        ],
        (input: string): boolean => {
          if (playerInputs.some((p) => p.name === input)) return false;
          return true;
        },
      );

      const playerType: string = await getValidatedUserInput(
        nbrInput,
        [
          `What player type is `,
          [playerName, "magenta"],
          "?",
          [` (enter either "human" or "bot")`, "gray"],
        ],
        [["Invalid player type!", "red"], ` Enter either "human" or "bot".`],
        (input: string): boolean => {
          if (input.toLowerCase() === "human") return true;
          if (input.toLowerCase() === "bot") return true;
          return false;
        },
      );

      sl([
        [`Player ${i} is named `, "gray"],
        [playerName, "yellow"],
        [" and is a ", "gray"],
        [playerType.toLowerCase(), "yellow"],
        [".\n", "gray"],
      ]);

      playerInputs.push({
        name: playerName,
        type: playerType.toLowerCase() as "human" | "bot",
      });
    }

    const players: PlayerInit[] = playerInputs.map((p) => {
      return {
        name: p.name,
        driver: p.type === "human" ? manualDriver : prngDriver,
      };
    });

    const opt: CliOptions = {
      abbreviate: false,
      showEmpty: false,
      showPlayerOrder: true,
      showPreviousObservation: true,
    };

    sl([
      "Starting Hadronize...",
      ["\n\n---\n\n", "gray"],
      ["Have fun!\n", "green"],
    ]);

    await main(opt, [seed, players]);
  } catch (err) {
    if (err instanceof Error && (err as Error).name === "AbortError") {
      sl([["\nShutting down...", "red"]]);
    } else {
      throw err;
    }
  }
}

export default demo;

if (import.meta.main) {
  demo();
}
