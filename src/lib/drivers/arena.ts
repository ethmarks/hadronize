import { Hadronize, type Result } from "../Hadronize.ts";
import type { Driver, PlayerInit } from "../Player.ts";
import { getDriver } from "./stockDrivers.ts";

export async function evaluateDriverCombo(
  seed: number,
  drivers: Driver[],
): Promise<number[]> {
  const inits: PlayerInit[] = drivers.map((driver, index) => ({
    name: `p${index}`,
    driver,
  }));

  const game = new Hadronize(seed, inits);

  let result: Result = undefined;

  while (result === undefined) {
    result = await game.executeTurn();
  }

  const sortedPlayers = game.state!.players.sort((b, a) => b.score - a.score);

  return inits.map(({ name }) => {
    const rank = sortedPlayers.findIndex((p) => p.name === name);

    if (rank === undefined) throw new Error("unreachable state");

    return rank;
  });
}

async function demo() {
  const prngDriver = getDriver("prng");

  const drivers = [prngDriver, prngDriver, prngDriver, prngDriver];

  const ranking = await evaluateDriverCombo(1, drivers);

  console.log(ranking);
}

if (import.meta.main) {
  await demo();
}
