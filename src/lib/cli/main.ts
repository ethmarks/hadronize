import { Hadronize, type Result } from "../Hadronize.ts";

import sl, { type slChunk } from "./styledLog.ts";
import {
  getEndgameChunks,
  getObservationChunks,
  getStateChunks,
  type CliOptions,
} from "./print.ts";

export async function main(
  opt: CliOptions,
  gameParams: ConstructorParameters<typeof Hadronize>,
  storeResult?: (result: Result) => void,
): Promise<slChunk[]> {
  const game = new Hadronize(...gameParams);

  const preDriverFunc = async () => sl(getStateChunks(game.state!, opt));

  let result: Result = undefined;

  while (result === undefined) {
    result = await game.executeTurn(preDriverFunc);
    if (typeof storeResult !== "undefined") storeResult(result);
  }

  // Log final observation
  const observation = game.mostRecentObservation!;
  const active = game.state!.players[game.state!.activePlayer];
  const observer = game.state!.players[observation.observer];
  sl(getObservationChunks(active, observer, observation, opt));
  sl(["\n---\n"]);

  // Log endgame chunks
  const endgameChunks = getEndgameChunks(game, result, opt);
  sl(endgameChunks);

  return endgameChunks;
}

export default main;
