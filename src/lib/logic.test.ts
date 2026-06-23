import { expect, describe, it } from "vitest";
import { Hadronize, STARTING_QUARK_COUNT, type Result } from "./Hadronize";
import { dogpileDriver } from "./drivers";

import type { Chamber, PlayerInit } from "./Player";

// To sate typescript's strictness
import { FLAVORS as _STRICT_FLAVORS, Hadron, type Flavor } from "./Quark";
const FLAVORS = _STRICT_FLAVORS.map((f) => f);

/**
 * The driver we use should not matter for any tests, so long as it isn't one
 * that _never_ tries to hadronize, which would make a legitimate win
 * impossible.
 */
const getPlayers: (count: number) => PlayerInit[] = (count: number) =>
  Array.from({ length: count }).map((_, index) => {
    return { name: `p${index}`, driver: dogpileDriver };
  });

// We run every constructor test with multiple seeds to ensure that none of
// the tests pass by coincidence or hardcoding.
describe.each([1, 3752815185, 1042408937])(
  "Game logic with seed $0",
  (seed: number) => {
    /**
     * Helper for getting a game using the seed from the current describe.each
     * iteration and the default players.
     *
     * Defaults to a 2-player game because player count doesn't matter for most
     * tests.
     */
    const getGame: (playerCount?: number) => Hadronize = (
      playerCount: number = 2,
    ) => new Hadronize(seed, getPlayers(playerCount));

    describe("Constructor", () => {
      it("should construct without errors", () => {
        expect(() => getGame()).not.toThrow();
      });

      it.each([50, 200, 29, 74, 178])(
        "should initialize unused quark #$0 properly",
        (index: number) => {
          const game = getGame();

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
          const game = getGame();

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
          const game = getGame(count);

          expect(game.players).toHaveLength(count);
        },
      );

      it.each([0, 3, 5])(
        "should initialize player #$0 properly",
        (order: number) => {
          const game = getGame(6);
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
          expect(() => getGame(count)).toThrow();
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
        const game1 = getGame();
        const game2 = getGame();

        // This is fragile and breaks for stored references and promises
        // whatnot.
        //
        // expect(game1).toEqual(game2);

        [game1, game2].forEach((game) => {
          game.produceQuark();
          game.updateState();
        });

        expect(JSON.stringify(game1.state)).toBe(JSON.stringify(game2.state));
      });
    });

    describe("Gameplay", () => {
      it("should end in finite turns", async () => {
        const game = getGame();

        let result: Result = undefined;

        /**
         * Games should terminate after no more than 300 turns due to the
         * TURN_LIMIT check which is 300, but we add an extra 50 just to be
         * safe. Testing that the turn limit works properly is out of scope for
         * this test.
         */
        const MAX_ITERATIONS = 350;

        while (result === undefined && game.turn < MAX_ITERATIONS) {
          result = await game.executeTurn();
        }

        // If result is still undefined after 350 turns, the game probably
        // isn't going to end.
        expect(result).not.toBeUndefined();
      });

      /**
       * It's not possible for a player to win in a single turn, even with
       * perfect luck and play, so if that happens it must be due to a game
       * logic bug.
       */
      it("should not end in one turn", async () => {
        const game = getGame();

        const result = await game.executeTurn();

        expect(result).toBeUndefined();
      });

      it.each([0, 3, 5])(
        "should end when player #$0 has 10 or more hadronized quarks",
        async (order: number) => {
          const game = getGame(6);

          // We can't just set score directly because it's a getter, so we have
          // to do a bunch of other stuff.
          //
          // game.players[0].score = 10;

          // Create a 10-quark hadron
          const decaquark: Hadron = new Hadron(
            Array.from({
              length: 10,
            }).map(() => {
              const quark = game.quarks[game.nextQuarkIndex()];
              quark.collapse();
              quark.hadronize();
              return quark.index;
            }),
          );

          const player = game.players[order];

          // Add the decaquark to the player
          player.chamber.hadrons.push(decaquark);

          // Execute a game turn that the player should immediately win.
          const result = await game.executeTurn();

          expect(player.score).toBeGreaterThanOrEqual(10);
          expect(result).toBe(order);
        },
      );

      it("should trigger the turn limit if players never form hadrons", async () => {
        const game = getGame();

        let result: Result = undefined;

        while (result === undefined) {
          result = await game.executeTurn();

          // Remove any and all hadrons that the players may have formed
          game.players.forEach((player) => {
            player.chamber.hadrons = [];
          });
        }

        expect(result).toBe("too many turns");
      });

      it("should form hadron under hadron-forming circumstance", async () => {
        const game = getGame();

        // To ensure that our actions actually changed the player's score.
        // Player should have zeroed scores at the start of games anyways.
        expect(game.activePlayer.score).toBe(0);

        // Set game.activeQuark so that we can rig it
        game.produceQuark();

        // To sate typescript
        const activeQuark = game.quarks[game.activeQuark as number];

        // Which quark we choose doesn't matter, so long as it's in the
        // activePlayer's chamber and therefore able to react with the
        // collapsed quark.
        const playerQuark = game.quarks[game.activePlayer.chamber.indices[0]];

        // Rig the activeQuark to force hadronization
        activeQuark.flavor = playerQuark.flavor;
        // Rigging the superposition isn't strictly necessary, but we don't
        // want to create an invalid quark where the flavor isn't in the
        // superposition.
        activeQuark.superposition = playerQuark.superposition;

        // Force the active player to observe the quark
        game.observeQuark(game.activePlayer, game.activePlayer);

        expect(game.activePlayer.score).toBeGreaterThan(0);
      });

      it("should quantum tunnel under quantum-tunneling circumstance", async () => {
        const game = getGame();

        // Any non-active player will do.
        const nonActivePlayer = game.players[game.activePlayer.order + 1];

        // Set game.activeQuark so that we can rig it
        game.produceQuark();

        // To sate typescript
        const activeQuark = game.quarks[game.activeQuark as number];

        // Which quark we choose doesn't matter, so long as it's in the
        // nonActivePlayer's chamber and therefore able to react with the
        // collapsed quark.
        const playerQuark = game.quarks[nonActivePlayer.chamber.indices[0]];

        // Rig the activeQuark to force tunneling
        activeQuark.flavor = playerQuark.flavor;
        // Rigging the superposition isn't strictly necessary, but we don't
        // want to create an invalid quark where the flavor isn't in the
        // superposition.
        activeQuark.superposition = playerQuark.superposition;

        // Store the active flavor so we can reference it after the observation
        const activeFlavor = activeQuark.flavor;

        /**
         * Helper to count the number of quarks of a specific flavor in a
         * chamber.
         */
        function countQuarks(chamber: Chamber, flavor: Flavor): number {
          return chamber.indices.filter(
            (index) => game.quarks[index].flavor === flavor,
          ).length;
        }

        const activePlayerBeforeCount = countQuarks(
          game.activePlayer.chamber,
          activeFlavor,
        );
        const nonActivePlayerBeforeCount = countQuarks(
          nonActivePlayer.chamber,
          activeFlavor,
        );

        // Force the non-active player to observe the quark
        game.observeQuark(nonActivePlayer, game.activePlayer);

        const activePlayerAfterCount = countQuarks(
          game.activePlayer.chamber,
          activeFlavor,
        );
        const nonActivePlayerAfterCount = countQuarks(
          nonActivePlayer.chamber,
          activeFlavor,
        );

        expect(game.mostRecentObservation).toEqual({
          observer: nonActivePlayer.order,
          reaction: "tunneled",
          activeFlavor: activeFlavor,
        });

        // We rigged the nonActivePlayer to have at least one quark of the active flavor earlier, so this must be > 0
        expect(nonActivePlayerBeforeCount).toBeGreaterThan(0);

        // The quantum tunneling should have removed all of the active flavor
        // from the non-active player
        expect(nonActivePlayerAfterCount).toBe(0);

        // The quantum tunneling should have added the non-active player's
        // quarks and the collapsed quark to the active player.
        expect(activePlayerAfterCount).toBe(
          activePlayerBeforeCount + nonActivePlayerBeforeCount + 1,
        );
      });
    });
  },
);
