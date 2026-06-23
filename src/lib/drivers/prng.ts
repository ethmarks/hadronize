import type { CurrentGameState } from "../Hadronize";
import type { Scratchpad, Driver } from "../Player";

/**
 * Modified version of mulberry32 that's stateless and doesn't use side effects.
 */
function mulberry32(seed: number): { newSeed: number; prngNum: number } {
  const newSeed = (seed + 0x6d2b79f5) >>> 0;
  let t = newSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const prngNum = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { newSeed, prngNum };
}

/**
 * Simple hash for converting strings into 32-bit integers (the format that
 * mulberry32 takes as its seed)
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return hash >>> 0; // Force hash num into a 32-bit unsigned integer
}

/**
 * A driver that uses a pseudorandom number generator to deterministically
 * select a pseudorandom player.
 *
 * Scratchpad format: just a single number in string representation.
 */
export const prngDriver: Driver = async (
  state: CurrentGameState,
  pad: Scratchpad,
): Promise<number> => {
  let scratch: string = pad.read();

  const seed: number =
    !scratch || scratch.trim() === ""
      ? djb2Hash(JSON.stringify(state))
      : Number(scratch);

  const { newSeed, prngNum } = mulberry32(seed);

  pad.write(newSeed.toString());

  const observerOrder = Math.floor(prngNum * state.players.length);
  return observerOrder;
};
