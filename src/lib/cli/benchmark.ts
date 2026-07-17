import { Hadronize, type Result } from "../Hadronize.ts";
import type { Driver, PlayerInit } from "../Player.ts";
import { getDriver } from "../drivers/stockDrivers.ts";

import { parseArgs, type ParseArgsConfig } from "node:util";

const DEFAULT_COUNT = 10000;
const DEFAULT_DRIVER = "prng";

export async function runGame(
  seed: number,
  inits: PlayerInit[],
): Promise<Exclude<Result, undefined>> {
  const game = new Hadronize(seed, inits);

  let result: Result = undefined;

  while (result === undefined) {
    result = await game.executeTurn();
  }

  return result;
}

export async function runBenchmark(
  count: number,
  driver: Driver,
): Promise<void> {
  const inits: PlayerInit[] = [
    { name: "p0", driver },
    { name: "p1", driver },
    { name: "p2", driver },
    { name: "p3", driver },
    { name: "p4", driver },
    { name: "p5", driver },
  ];

  console.log("Starting benchmark...");
  const start = new Date().getTime();

  const statusReposIntervals = Math.round(Math.min(count / 30, 100));

  let results: Result[] = [];

  // run games sequentially
  for (let i = 0; i < count; i++) {
    if (i % statusReposIntervals === 0) {
      console.log(`${Math.round((i / count) * 100)}%`);
    }

    const result = await runGame(i, inits);
    results.push(result);
  }

  console.log("100%");
  const fin = new Date().getTime();

  const ms = fin - start;
  const seconds = ms / 1000;

  console.log(results);

  console.log(
    `Took ${ms}ms (${seconds}s). Speed is ${count / seconds} games per second`,
  );
}

if (import.meta.main) {
  const argConf: ParseArgsConfig = {
    options: {
      count: {
        type: "string",
        default: DEFAULT_COUNT.toString(),
        short: "c",
      },
      driver: {
        type: "string",
        default: DEFAULT_DRIVER,
        short: "d",
      },
    },
  };

  const { values } = parseArgs(argConf);

  if (typeof values.count !== "string" || typeof values.driver !== "string")
    throw new Error("invalid args");

  const count = Number(values.count);
  const driver = getDriver(values.driver);

  await runBenchmark(count, driver);
}
