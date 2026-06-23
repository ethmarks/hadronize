import type { CurrentGameState } from "../Hadronize";
import type { Scratchpad, Driver } from "../Player";

/**
 * An extremely similar driver that just dogpiles on the player who goes
 * first. Should only be used when extreme predictability is required, not in
 * actual play.
 */
export const dogpileDriver: Driver = async (
  state: CurrentGameState,
  pad: Scratchpad,
): Promise<number> => 0;
