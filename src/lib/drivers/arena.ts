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
    const rank = sortedPlayers.findIndex((p) => p.name === name) + 1;

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

interface DriverRank {
  driver: Driver;
  elo: number;
}

async function rankDrivers(
  driversToRank: Driver[],
  gamesToPlay: number,
): Promise<DriverRank[]> {
  const drivers: DriverRank[] = driversToRank.map((driver) => ({
    driver,
    elo: 1200,
  }));

  const rng = mulberry32(9);

  const GAME_SIZE = 6;

  for (let i = 0; i < gamesToPlay; i++) {
    const seed = rng();

    const driverCombo: { originalIndex: number; driver: Driver }[] = Array.from(
      { length: GAME_SIZE },
    ).map(() => {
      const index = Math.floor(rng() * driversToRank.length);
      return {
        originalIndex: index,
        driver: driversToRank[index],
      };
    });

    const rankings = await evaluateDriverCombo(
      seed,
      driverCombo.map((dc) => dc.driver),
    );

    driverCombo.forEach(({ originalIndex }, rankingIndex) => {
      const ranking = rankings[rankingIndex];

      // only increment elo if the player actually won
      if (ranking === driverCombo.length - 1) {
        drivers[originalIndex].elo += 1;
      }
    });
  }

  return drivers;
}

async function demo() {
  const driverIDs = ["prng", "ev", "mimick", "kingslayer", "charm"];

  const elos = await rankDrivers(
    driverIDs.map((id) => getDriver(id)),
    500,
  );

  console.log(
    elos.map((elo, index) => `${driverIDs[index]}: ${elo.elo}`).join("\n"),
  );
}

if (import.meta.main) {
  await demo();
}
