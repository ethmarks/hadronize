import type { Driver } from "../Player.ts";
import { js } from "./quickjs.ts";

/**
 * A driver that selects random players
 */
export const prngDriver: Driver = js`
  return Math.floor(Math.random() * state.players.length);
`;
