import { Hadronize, type Result } from "../Hadronize.ts";

import sl, { type slChunk } from "./styledLog.ts";
import {
  getStateChunks,
  logFinalObservation,
  type CliOptions,
} from "./print.ts";

export async function main(
  opt: CliOptions,
  gameParams: ConstructorParameters<typeof Hadronize>,
  storeResult?: (result: Result) => void,
): Promise<slChunk[]> {
  const game = new Hadronize(...gameParams);

  let result: Result = undefined;

  while (result === undefined) {
    result = await game.executeTurn({
      preDriver: async (ctx: { game: Hadronize }) => {
        sl(getStateChunks(ctx.game.state!, opt));
      },
    });
    if (typeof storeResult !== "undefined") storeResult(result);
  }

  return logFinalObservation(game, result, opt);
}

export default main;
