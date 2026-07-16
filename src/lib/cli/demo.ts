import { MAX_PLAYERS, MIN_PLAYERS } from "../Hadronize.ts";

import sl from "./styledLog.ts";
import { getNbrInputFunc, getValidatedUserInput } from "./input.ts";
import {
  validatePlayerInits,
  type Driver,
  type PlayerInit,
} from "../Player.ts";
import { type CliOptions } from "./print.ts";
import { main } from "./main.ts";

import { manualDriver } from "../drivers/manual.ts";
import { STOCK_DRIVER_PROGRAMS, getDriver } from "../drivers/stockDrivers.ts";

/** Subject to change */
const DEFAULT_BOT_DRIVER = getDriver("prng");

interface PlayerType {
  id: string;
  name: string;
  driver: Driver;
}

const PLAYER_TYPES: PlayerType[] = [
  { id: "manual", name: "Human", driver: manualDriver },
  { id: "bot", name: "Bot", driver: DEFAULT_BOT_DRIVER },
  ...STOCK_DRIVER_PROGRAMS.map((program) => ({
    id: program.id,
    name: program.name,
    driver: getDriver(program.id),
  })),
];

const PLAYER_IDS = PLAYER_TYPES.map((t) => `'${t.id}'`).join(", ");

const findPlayerType = (input: string): PlayerType | undefined =>
  PLAYER_TYPES.find(
    (t) =>
      t.id.toLowerCase() === input.toLowerCase() ||
      t.name.toLowerCase() === input.toLowerCase(),
  );

const VALIDATORS: Record<"seed" | "playerType", (input: string) => boolean> = {
  seed: (input: string): boolean => {
    if (input === "") return true;
    const num = Number(input);
    if (Number.isNaN(num)) return false;
    if (num < 1) return false;
    return true;
  },
  playerType: (input: string): boolean => findPlayerType(input) !== undefined,
};

// Trigger Deno's Node compatibility layer by explicitly importing from node
import { parseArgs, type ParseArgsConfig } from "node:util";

async function getSetupViaInput(): Promise<[number, PlayerInit[]]> {
  const nbrInput: () => Promise<string> = () => getNbrInputFunc()("");

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
    VALIDATORS.seed,
  );
  const seed: number =
    seedInput === "" ? Math.floor(Math.random() * 2 ** 32) : Number(seedInput);

  sl([
    ["Using seed ", "gray"],
    [seed.toString(), "yellow"],
    [".\n", "gray"],
  ]);

  const playerCountInput: string = await getValidatedUserInput(
    nbrInput,
    [
      "How many players?",
      [` (enter an integer between ${MIN_PLAYERS} and ${MAX_PLAYERS})`, "gray"],
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

  const players: PlayerInit[] = [];

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
        if (players.some((p) => p.name === input)) return false;
        return true;
      },
    );

    const playerTypeInput: string = await getValidatedUserInput(
      nbrInput,
      [
        `What player type is `,
        [playerName, "magenta"],
        "?",
        [` (enter one of ${PLAYER_IDS})`, "gray"],
      ],
      [["Invalid player type!", "red"], ` Enter one of ${PLAYER_IDS}.`],
      VALIDATORS.playerType,
    );

    const playerType: PlayerType = findPlayerType(playerTypeInput)!;

    sl([
      [`Player ${i} is named `, "gray"],
      [playerName, "yellow"],
      [" and is a ", "gray"],
      [playerType.name, "yellow"],
      [".\n", "gray"],
    ]);

    players.push({
      name: playerName,
      driver: playerType.driver,
    });
  }

  return [seed, players];
}

/**
 * Parses args to attempt to get the game setup.
 *
 * If no args are passed, returns undefined.
 *
 * Expects a seed arg and between 2 and 6 player args.
 *
 * Seed arg format is just a number.
 * Player arg format is NAME:TYPE
 *
 * @example pnpm run cli --seed 5 --player alice:human --player Bob:bot
 */
function getSetupViaArgs(): [number, PlayerInit[]] | undefined {
  const config: ParseArgsConfig = {
    options: {
      seed: {
        type: "string",
        short: "s",
      },
      player: {
        type: "string",
        short: "p",
        multiple: true,
      },
    },
  } as const;

  const { values } = parseArgs(config);

  // Only return undefined if no args were passed
  if (Object.keys(values).length <= 0) return;

  let seed: number;

  if (typeof values.seed === "undefined") {
    seed = Math.floor(Math.random() * 2 ** 32);
  } else {
    if (typeof values.seed !== "string" || !VALIDATORS.seed(values.seed))
      throw new Error("Invalid arg for seed!");

    seed = Number(values.seed);
  }

  /**
   * Helper for checking if a value is an array composed entirely of strings.
   */
  function isStringArray(arr: unknown): arr is string[] {
    if (!Array.isArray(arr)) return false;
    if (!arr.every((item) => typeof item === "string")) return false;
    return true;
  }

  if (typeof values.player === "undefined")
    throw new Error("Must provide player args!");
  if (!isStringArray(values.player))
    throw new Error("Invalid args for players");
  if (values.player.length < MIN_PLAYERS)
    throw new Error("Not enough player args!");
  if (values.player.length > MAX_PLAYERS)
    throw new Error("Too many player args!");

  const playerArgs = values.player;

  const players: PlayerInit[] = playerArgs.map((arg) => {
    const parts = arg.split(":");
    if (parts.length !== 2)
      throw new Error(
        "Invalid args for players! Format for player args is NAME:TYPE.",
      );

    const [name, rawType] = parts;

    const parsedType = rawType.toLowerCase();

    const playerType = findPlayerType(parsedType);

    if (playerType === undefined)
      throw new Error(
        `Invalid args for players! Player type must be one of ${PLAYER_IDS}`,
      );

    const driver = playerType.driver;

    return {
      name,
      driver,
    };
  });

  // Will throw errors if players are invalid
  validatePlayerInits(players);

  return [seed, players];
}

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

    const setupFromArgs = getSetupViaArgs();

    const setup =
      setupFromArgs === undefined ? await getSetupViaInput() : setupFromArgs;

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

    await main(opt, setup);
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
