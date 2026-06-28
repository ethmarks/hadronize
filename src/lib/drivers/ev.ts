import type { CurrentGameState } from "../Hadronize.ts";
import type { Scratchpad, Driver } from "../Player.ts";

/**
 * A driver that evaluates the expected value of choosing each player and
 * maximizes that value.
 *
 */
export const evDriver: Driver = async (
  state: CurrentGameState,
  pad: Scratchpad,
): Promise<number> => {
  // Hadronizing 2 quarks is preferable to tunneling 2 quarks because the
  // former permenantly increases your score while the latter is only an
  // intermediate step.
  //
  // So we add an arbitrary weight to represent the preference for hadronizing
  // over simply gaining quarks.
  const HADRONIZE_WEIGHT: number = 1.5;

  const expectedValues: { player: number; ev: number }[] = state.players.map(
    (player) => {
      let ev = 0;

      const isSelf = player.order === state.activePlayer;

      state.superposedQuark.forEach((superposedFlavor) => {
        const matchCount = player.chamber.filter(
          (flavor) => flavor === superposedFlavor,
        ).length;

        if (matchCount > 0) {
          // Will be reactive

          // The reaction will involve the matching quarks AND the new quark,
          // so +1 to the match count.
          const totalQuarks = matchCount + 1;

          const mult = isSelf ? HADRONIZE_WEIGHT : 1;

          ev += (totalQuarks * mult) / 3;
        } else {
          // Will be non-reactive.

          // A non-reactive self-observe gains one extra quark but doesn't
          // hadronize, so it is worth 1 point.
          // A non-reactive other-observe gives an extra quark to an opponent,
          // so it is worth -1 points.
          ev += (isSelf ? 1 : -1) / 3;
        }
      });

      return {
        player: player.order,
        ev,
      };
    },
  );

  // Sort in descending order
  expectedValues.sort((valA, valB) => valB.ev - valA.ev);

  return expectedValues[0].player;
};
