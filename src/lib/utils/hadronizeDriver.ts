import type { CurrentGameState } from "$lib/Hadronize";
import type { Scratchpad, Driver } from "$lib/Player";

/**
 * A placeholder driver that's fully autonomous and does nothing by try to
 * hadronize.
 */
export const hadronizeDriver: Driver = async (
  s: CurrentGameState,
  p: Scratchpad,
): Promise<number> => s.activePlayer;
