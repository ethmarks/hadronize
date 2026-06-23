import { expect, describe, it } from "vitest";
import { Hadronize, STARTING_QUARK_COUNT } from "./Hadronize";
import { dogpileDriver } from "./drivers";

import type { PlayerInit } from "./Player";

// To sate typescript's strictness
import { FLAVORS as _STRICT_FLAVORS } from "./Quark";
const FLAVORS = _STRICT_FLAVORS.map((f) => f);

// We run every constructor test with multiple seeds to ensure that none of
// the tests pass by coincidence or hardcoding.
describe.each([1, 3752815185, 1042408937])(
  "Constructor with seed $0",
  (seed: number) => {
    // We're only testing the constructor, so the player drivers don't matter
    // at all, so we use dogpile drivers.
    const getPlayers: (count: number) => PlayerInit[] = (count: number) =>
      Array.from({ length: count }).map((_, index) => {
        return { name: `p${index}`, driver: dogpileDriver };
      });

    it("should construct without errors", () => {
      expect(() => new Hadronize(seed, getPlayers(2))).not.toThrow();
    });

    it.each([50, 200, 29, 74, 178])(
      "should initialize unused quark #$0 properly",
      (index: number) => {
        const game = new Hadronize(seed, getPlayers(2));

        const quark = game.quarks[index];
        expect(quark.index).toEqual(index);
        expect(quark.isCollapsed).toEqual(false);
        expect(quark.isHadronized).toEqual(false);
        expect(quark.flavor).toBeOneOf(FLAVORS);
        expect(quark.superposition).toContainEqual(expect.toBeOneOf(FLAVORS));
        expect(quark.superposedInfo).toEqual({
          id: quark.index,
          superposition: quark.superposition,
        });
        expect(() => quark.collapsedInfo).toThrow(
          "Tried to access collapsed info of a non-collapsed quark!",
        );
      },
    );

    it.each([0, 1, 2, 3])(
      "should initialize used quark #$0 properly",
      (index: number) => {
        const game = new Hadronize(seed, getPlayers(2));

        const quark = game.quarks[index];
        expect(quark.index).toEqual(index);
        expect(quark.isCollapsed).toEqual(true);
        expect(quark.isHadronized).toEqual(false);
        expect(quark.flavor).toBeOneOf(FLAVORS);
        expect(quark.superposition).toContainEqual(expect.toBeOneOf(FLAVORS));
        expect(() => quark.superposedInfo).toThrow(
          "Tried to access superposed info of a collapsed quark!",
        );
        expect(quark.collapsedInfo).toEqual({
          id: quark.index,
          flavor: quark.flavor,
          isHadronized: quark.isHadronized,
        });
      },
    );

    it.each([2, 4, 6])(
      "should initialize $0 players properly",
      (count: number) => {
        const game = new Hadronize(seed, getPlayers(count));

        expect(game.players).toHaveLength(count);
      },
    );

    it.each([0, 3, 5])(
      "should initialize player #$0 properly",
      (order: number) => {
        const game = new Hadronize(seed, getPlayers(6));
        const player = game.players[order];

        expect(player.order).toBe(order);
        expect(player.score).toBe(0);
        expect(player.chamber.hadrons).toHaveLength(0);
        expect(player.chamber.indices).toHaveLength(STARTING_QUARK_COUNT);
      },
    );

    it.each([1, 7, 0, -1])(
      "should throw with invalid player count of $0",
      (count: number) => {
        expect(() => new Hadronize(seed, getPlayers(count))).toThrow();
      },
    );

    it("should throw on duplicate player names", () => {
      expect(
        () =>
          new Hadronize(seed, [
            { name: "john", driver: dogpileDriver },
            { name: "john", driver: dogpileDriver },
          ]),
      ).toThrow("Player inits have duplicate names");
    });

    it("should behave deterministically", () => {
      const game1 = new Hadronize(seed, getPlayers(3));
      const game2 = new Hadronize(seed, getPlayers(3));

      expect(game1).toEqual(game2);
    });
  },
);
