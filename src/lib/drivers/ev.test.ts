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

  describe.each([1, 639172, 538191])(
    "Behavior with seed $0",
    (seed: number) => {
      it("should behave deterministically", async () => {
        const result1 = await runEVDriver(seed);
        const result2 = await runEVDriver(seed);

        expect(result1).toBe(result2);
      });

      it("should try to hadronize when clearly beneficial", async () => {
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
      });

      it("should try to tunnel when clearly beneficial", async () => {
        const game = getGame(seed);
        const rig = getRigging(game);

        game.produceQuark();
        const superposedQuark = game.quarks[game.superposedIndex!];

        const nonActivePlayer = game.players[1];
        if (nonActivePlayer.order === game.activePlayer.order)
          throw new Error("nonActivePlayer shouldn't be the active player!");

        rig.quark.good(superposedQuark);
        rig.all.players.bad();
        rig.player.good(nonActivePlayer);

        const state = game.updateState();

        const result = await game.activePlayer.driver(
          state,
          game.activePlayer.scratchpad,
        );

        expect(result).toBe(nonActivePlayer.order);
      });

      it("should prefer hadronizing over tunneling", async () => {
        const game = getGame(seed);
        const rig = getRigging(game);

        game.produceQuark();
        const superposedQuark = game.quarks[game.superposedIndex!];

        rig.quark.good(superposedQuark);
        rig.all.players.good();

        const state = game.updateState();

        const result = await game.activePlayer.driver(
          state,
          game.activePlayer.scratchpad,
        );

        expect(result).toBe(game.activePlayer.order);
      });

      it("should prefer self over others when no reactions possible", async () => {
        const game = getGame(seed);
        const rig = getRigging(game);

        game.produceQuark();
        const superposedQuark = game.quarks[game.superposedIndex!];

        rig.quark.good(superposedQuark);
        rig.all.players.bad();

        const state = game.updateState();

        const result = await game.activePlayer.driver(
          state,
          game.activePlayer.scratchpad,
        );

        expect(result).toBe(game.activePlayer.order);
      });

      it("should prefer high-volume tunneling over low-volume hadronizing", async () => {
        const game = getGame(seed);
        const rig = getRigging(game);

        const LOW_VOL = 1;
        const HIGH_VOL = 10;

        const nonActivePlayer = game.players[1];

        rig.player.count(game.activePlayer, LOW_VOL);
        rig.player.count(nonActivePlayer, HIGH_VOL);

        const superposedQuark =
          game.quarks[game.superposedIndex ?? game.produceQuark()];

        rig.quark.good(superposedQuark);
        rig.all.players.bad();
        rig.player.good(game.activePlayer);
        rig.player.good(nonActivePlayer);

        expect(game.activePlayer.chamber.indices.length).toBe(LOW_VOL);
        expect(nonActivePlayer.chamber.indices.length).toBe(HIGH_VOL);

        const state = game.updateState();

        const result = await game.activePlayer.driver(
          state,
          game.activePlayer.scratchpad,
        );

        expect(result).toBe(nonActivePlayer.order);
      });
    },
  );
});
