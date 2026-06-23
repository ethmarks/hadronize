import { Hadronize, type Result } from "../Hadronize";

import sl from "./styledLog";
import { getEndgameChunks, getStateChunks, type CliOptions } from "./print";

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
