import { expect, describe, it } from "vitest";
import { Hadronize } from "../Hadronize.ts";
import { evDriver } from "./ev.ts";
import { dogpileDriver } from "./dogpile.ts";
import type { PlayerInit } from "../Player.ts";
import { getRigging } from "../utils/rigging.ts";

const getPlayers: (count: number) => PlayerInit[] = (count: number) =>
  Array.from({ length: count }).map((_, index) => {
    return { name: `dogpile${index}`, driver: dogpileDriver };
  });

const getGame: (seed: number, playerCount?: number) => Hadronize = (
  seed: number,
  playerCount: number = 6,
) => {
  const game = new Hadronize(seed, [
    { name: "ev", driver: evDriver },
    ...getPlayers(playerCount - 1),
  ]);

  // Because the ev player is first in the list, it should be the active
  // player, but we check just to be sure.
  const evPlayer = game.activePlayer;
  if (evPlayer.name !== "ev")
    throw new Error("getGame did not initialize players correctly");

  return game;
};

const runEVDriver: (seed: number) => Promise<number> = async (
  seed: number = 1,
) => {
  const game = getGame(seed);

  game.produceQuark();
  const state = game.updateState();

  const result = await game.activePlayer.driver(
    state,
    game.activePlayer.scratchpad,
  );

  return result;
};

describe("EV Driver", () => {
  it("should run without errors", () => {
    expect(runEVDriver).not.toThrow();
  });

  it.each([1, 639172, 538191])(
    "should behave deterministically with seed $0",
    async (seed: number) => {
      const result1 = await runEVDriver(seed);
      const result2 = await runEVDriver(seed);

      expect(result1).toBe(result2);
    },
  );

  it.each([1, 72891, 9183])(
    "should try to hadronize when clearly beneficial with seed $0",
    async (seed: number) => {
      const game = getGame(seed);
      const rig = getRigging(game);

      game.produceQuark();
      const superposedQuark = game.quarks[game.superposedIndex!];

      rig.quark.good(superposedQuark);
      rig.all.players.bad();
      rig.player.good(game.activePlayer);

      const state = game.updateState();

      const result = await game.activePlayer.driver(
        state,
        game.activePlayer.scratchpad,
      );

      expect(result).toBe(game.activePlayer.order);
    },
  );
});
