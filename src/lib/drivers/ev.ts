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
  const expectedValues: { player: number; ev: number }[] = state.players.map(
    (player) => {
      let ev: number = 0;

      state.superposedQuark.forEach((superposedFlavor) => {
        ev += player.chamber.filter(
          (flavor) => flavor === superposedFlavor,
        ).length;
      });

      return {
        player: player.order,
        ev,
      };
    },
  );

  expectedValues.sort((valA, valB) => valA.ev - valB.ev);

  return expectedValues[0].player;
};
