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

// https://github.com/cprosche/mulberry32
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Elo = number;

async function rankDrivers(
  driversToRank: Driver[],
  gamesToPlay: number,
): Promise<Elo[]> {
  const elos: Elo[] = driversToRank.map(() => 0);

  const rng = mulberry32(9);

  const GAME_SIZE = 6;

  for (let i = 0; i < gamesToPlay; i++) {
    const seed = rng();

    const indices = Array.from({ length: GAME_SIZE }).map(() =>
      Math.floor(rng() * driversToRank.length),
    );

    const drivers = indices.map((index) => driversToRank[index]);

    const rankings = await evaluateDriverCombo(seed, drivers);

    indices.forEach((eloIndex, rankingIndex) => {
      elos[eloIndex] += rankings[rankingIndex];
    });
  }

  return elos;
}

async function demo() {
  const driverIDs = ["prng", "ev", "mimick"];

  const elos = await rankDrivers(
    driverIDs.map((id) => getDriver(id)),
    500,
  );

  console.log(
    elos.map((elo, index) => `${driverIDs[index]}: ${elo}`).join("\n"),
  );
}

if (import.meta.main) {
  await demo();
}
