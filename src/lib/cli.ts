/**
 * This file provides utilities to interface with Hadronize as a CLI game.
 */

import {
  Hadronize,
  type CurrentGameState,
  type Observation,
  type PastGameState,
  type PlayerState,
  type Result,
} from "./Hadronize";
import { FLAVORS, type Flavor } from "./Quark";
import { hadronizeDriver } from "./utils/hadronizeDriver";

import sl, { type slChunk, type Style } from "./utils/styledLog";
import { consoleDriver } from "./utils/consoleDriver";

const QUARK_MAPPING: Record<Flavor, Style> = {
  up: "blue",
  down: "yellow",
  charm: "cyan",
  strange: "green",
  top: "magenta",
  bottom: "red",
};

export interface Options {
  abbreviate: boolean;
  showEmpty: boolean;
  showPlayerOrder: boolean;
  showPreviousObservation: boolean;
}

function getChamberChunks(
  chamber: PlayerState["chamber"],
  opt: Options,
): slChunk[] {
  // Count the quarks of each flavor
  let quarkCounts: { flavor: Flavor; count: number }[] = FLAVORS.map(
    (flavor) => {
      return { flavor, count: 0 };
    },
  );
  chamber.forEach((quark) => {
    quarkCounts.find((dto) => dto.flavor === quark)!.count++;
  });

  // Construct the chunks
  const chunks: slChunk[] = [];
  quarkCounts.forEach(({ count, flavor }) => {
    if (count > 0 || opt.showEmpty) {
      const flavorString = opt.abbreviate
        ? flavor.slice(0, 1)
        : ` ${flavor}${count === 1 ? "" : "s"}`;
      chunks.push([`${count}${flavorString}`, QUARK_MAPPING[flavor]]);

      chunks.push([opt.abbreviate ? "," : ", ", "gray"]);
    }
  });

  // Remove the trailing ", "
  chunks.pop();

  return chunks;
}

function getPlayerNameChunks(
  player: PlayerState,
  opt: Options,
  highlight?: boolean,
): slChunk[] {
  const chunks: slChunk[] = [];

  // Name
  chunks.push([player.name, highlight ? "bold" : "white"]);

  // Order
  if (opt.showPlayerOrder) {
    if (highlight) {
      // Use square brackets instead of parenthesis so that the active player is
      // identifiable even if the colors aren't displaying.
      chunks.push([" [", "gray"]);
      chunks.push([player.order.toString(), "bold"]);
      chunks.push(["]", "gray"]);
    } else {
      chunks.push([` (${player.order})`, "gray"]);
    }
  }

  return chunks;
}

function getPlayerChunks(
  player: PlayerState,
  opt: Options,
  highlight?: boolean,
): slChunk[] {
  const chunks: slChunk[] = [];

  // Add name and possibly order
  chunks.push(...getPlayerNameChunks(player, opt, highlight));

  // Separator
  chunks.push([": ", "gray"]);

  // Chamber
  const chamberChunks = getChamberChunks(player.chamber, opt);
  chunks.push(...chamberChunks);

  // Hadrons
  if (player.score > 0 || opt.showEmpty) {
    // Only add a separator if the chamber chunks actually existed.
    if (chamberChunks.length > 0) {
      chunks.push([opt.abbreviate ? "," : ", ", "gray"]);
    }

    if (!opt.abbreviate) {
      chunks.push(["and ", "gray"]);
    }

    chunks.push([`${player.score}${opt.abbreviate ? "h" : " hadron"}`, "bold"]);
  }

  return chunks;
}

function getObservationChunks(
  active: PlayerState,
  observer: PlayerState,
  observation: Observation,
  opt: Options,
): slChunk[] {
  const chunks: slChunk[] = [];

  const pastCollapsedFlavor = observation.activeFlavor;

  if (observation.reaction === "hadronized") {
    // bob [1] 2s -> h
    // bob [1]'s 2 strange quarks hadronized!

    chunks.push(...getPlayerNameChunks(observer, opt, true));
    chunks.push([opt.abbreviate ? " " : "'s ", "gray"]);

    // +1 for the new quark
    const count =
      active.chamber.filter((q) => q === pastCollapsedFlavor).length + 1;
    const flavorString = opt.abbreviate
      ? pastCollapsedFlavor.slice(0, 1)
      : ` ${pastCollapsedFlavor}`;
    chunks.push([
      `${count}${flavorString}`,
      QUARK_MAPPING[pastCollapsedFlavor],
    ]);

    if (opt.abbreviate) {
      chunks.push([" -> ", "gray"]);
      chunks.push(["h", "bold"]);
    } else {
      chunks.push([" quarks ", "gray"]);
      chunks.push(["hadronized", "bold"]);
      chunks.push(["!", "gray"]);
    }
  } else if (observation.reaction === "tunneled") {
    // alice (0) 2s -> bob (1)
    // alice (0)'s 2 strange quarks tunneled to bob (1)

    chunks.push(...getPlayerNameChunks(observer, opt, false));
    chunks.push([opt.abbreviate ? " " : "'s ", "gray"]);

    // +1 for the new quark
    const count =
      observer.chamber.filter((q) => q === pastCollapsedFlavor).length + 1;
    const flavorString = opt.abbreviate
      ? pastCollapsedFlavor.slice(0, 1)
      : ` ${pastCollapsedFlavor}`;
    chunks.push([
      `${count}${flavorString}`,
      QUARK_MAPPING[pastCollapsedFlavor],
    ]);

    if (opt.abbreviate) {
      chunks.push([" -> ", "gray"]);
      chunks.push(...getPlayerNameChunks(active, opt, true));
    } else {
      chunks.push([" quarks ", "gray"]);
      chunks.push(["tunneled", "italic"]);
      chunks.push([" to ", "gray"]);
      chunks.push(...getPlayerNameChunks(active, opt, true));
    }
  } else {
    // alice (0) +s
    // alice (0) added a strange quark to their chamber.

    chunks.push(
      ...getPlayerNameChunks(observer, opt, active.order === observer.order),
    );
    chunks.push([
      opt.abbreviate
        ? " +"
        : ` added a${pastCollapsedFlavor === "up" ? "n" : ""} `,
      "gray",
    ]);

    chunks.push([
      opt.abbreviate ? pastCollapsedFlavor.slice(0, 1) : pastCollapsedFlavor,
      QUARK_MAPPING[pastCollapsedFlavor],
    ]);

    if (!opt.abbreviate) {
      chunks.push([" quark to their chamber.", "gray"]);
    }
  }

  return chunks;
}

function getStateChunks(
  state: CurrentGameState | PastGameState,
  opt: Options,
): slChunk[] {
  const chunks: slChunk[] = [];

  // Log the previous observation
  if (
    opt.showPreviousObservation &&
    Object.hasOwn(state, "timeline") &&
    (state as CurrentGameState).timeline.length > 0
  ) {
    // We know that state is a CurrentGameState because it has the "timeline"
    // property.
    const timeline = (state as CurrentGameState).timeline;

    // We subtract 2 from the current turn to get the previous state's index in
    // the timeline. -1 to normalize from 1-indexed to 0-indexed, and another
    // -1 to get the previous one.
    const pastState = timeline[state.turn - 2];

    const observation = pastState.observation;
    const active = pastState.players[pastState.activePlayer];
    const observer = pastState.players[observation.observer];

    chunks.push(...getObservationChunks(active, observer, observation, opt));

    // add dashes to visually separate the past game from the current one.
    chunks.push("\n\n---\n\n");
  }

  // Log the current turn
  chunks.push(["Turn #", "white"]);
  chunks.push([state.turn.toString(), "bold"]);

  // Log the current superposition
  chunks.push([": ", "gray"]);
  state.activeQuark.forEach((flavor, index, superposition) => {
    const flavorString = opt.abbreviate ? flavor.slice(0, 1) : flavor;
    chunks.push([flavorString, QUARK_MAPPING[flavor]]);

    // Add 1 to normalize from zero-indexed to one-indexed.
    const isNotLastElement = index + 1 < superposition.length;

    // We only add separators if there's more than one element and if this
    // isn't the last element in the list.
    if (superposition.length > 1 && isNotLastElement) {
      if (opt.abbreviate) {
        chunks.push([",", "gray"]);
      } else {
        // If this is the second-to-last element, add an "or"
        if (index + 2 === superposition.length) {
          chunks.push([`, or `, "gray"]);
        } else {
          chunks.push([", ", "gray"]);
        }
      }
    }
  });

  // Next line
  chunks.push(opt.abbreviate ? "\n" : "\n\n");

  // Players
  state.players.forEach((player) => {
    chunks.push(
      ...getPlayerChunks(player, opt, player.order === state.activePlayer),
    );
    chunks.push("\n");
  });

  return chunks;
}

function getEndgameChunks(
  game: Hadronize,
  result: Exclude<Result, undefined>,
  opt: Options,
): slChunk[] {
  const chunks: slChunk[] = [];

  // Log final obseravtion
  const observation = game.mostRecentObservation!;
  const active = game.state!.players[game.state!.activePlayer];
  const observer = game.state!.players[observation.observer];
  chunks.push(...getObservationChunks(active, observer, observation, opt));
  chunks.push("\n\n---\n\n");

  // Log game summary
  if (result === "too many turns") {
    chunks.push(["Too many turns!", "red"]);
    chunks.push(
      " The vacuum has stopped fluctuating and nobody hadronized enough quarks to win.\n",
    );
  } else {
    // The game ended normally after someone hadronized enough quarks.
    const winner = game.players[result];

    chunks.push([winner.name, "bold"]);
    chunks.push(" has won with ");
    chunks.push([winner.score.toString(), "bold"]);
    chunks.push(" hadrons!");
  }

  return chunks;
}

export async function main(
  opt: Options,
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

/**
 * Basically Python's `__name__ == "__main__"`, but for JS.
 *
 * Work with Node, Deno, Bun, and browsers.
 */
function isMainScript(importMeta: ImportMeta): boolean {
  // Check for Deno and Bun's native flag
  if (importMeta.main) {
    return true;
  }

  // Fallback for Node.js
  if (typeof process !== "undefined" && process.argv?.[1]) {
    try {
      const entryPath = import.meta.resolve(process.argv[1]);
      return importMeta.url === entryPath;
    } catch {
      const entryUrl = new URL(process.argv[1], "file://").href;
      return importMeta.url === entryUrl;
    }
  }

  return false;
}

if (isMainScript(import.meta)) {
  // If cli.ts is being run as a direct script, run a demo of main().
  await main(
    {
      abbreviate: false,
      showEmpty: false,
      showPlayerOrder: true,
      showPreviousObservation: true,
    },
    [
      1,
      [
        { name: "alice", driver: consoleDriver },
        { name: "bob", driver: consoleDriver },
      ],
    ],
  );
}
