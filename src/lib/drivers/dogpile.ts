import type { CurrentGameState } from "../Hadronize.ts";
import type { Driver } from "../Player.ts";

/**
 * An extremely similar driver that just dogpiles on the player who goes
 * first. Should only be used when extreme predictability is required, not in
 * actual play.
 */
export const dogpileDriver: Driver = async (
  state: CurrentGameState,
): Promise<number> => 0;
