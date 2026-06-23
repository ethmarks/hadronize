import { Hadronize, type Result } from "../Hadronize.ts";

import sl from "./styledLog.ts";
import { getEndgameChunks, getStateChunks, type CliOptions } from "./print.ts";

export async function main(
  opt: CliOptions,
  gameParams: ConstructorParameters<typeof Hadronize>,
) {
  const game = new Hadronize(...gameParams);

  const preDriverFunc = async () => sl(getStateChunks(game.state!, opt));

  let result: Result = undefined;

  while (result === undefined) {
    result = await game.executeTurn(preDriverFunc);
  }

  sl(getEndgameChunks(game, result, opt));
}

export default main;
