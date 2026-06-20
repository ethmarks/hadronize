/**
 * This file provides utilities to interface with Hadronize as a CLI game.
 */

import type { CurrentGameState, PastGameState, PlayerState } from "./Hadronize";
import { FLAVORS, type Flavor } from "./Quark";

import sl, { type slChunk, type Style } from "./utils/styledLog";

const QUARK_MAPPING: Record<Flavor, Style> = {
  up: "blue",
  down: "yellow",
  charm: "cyan",
  strange: "green",
  top: "magenta",
  bottom: "red",
};

interface Options {
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
      const flavorString = opt.abbreviate ? flavor.slice(0, 1) : ` ${flavor}`;
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

function getObservationChunks(state: PastGameState, opt: Options): slChunk[] {
  const chunks: slChunk[] = [];

  const pastActive = state.players[state.activePlayer];
  const pastObserver = state.players[state.observation.observer];
  const pastCollapsedFlavor = state.observation.activeFlavor;

  if (state.observation.reaction === "hadronized") {
    // bob [1] 2s -> h
    // bob [1]'s 2 strange quarks hadronized!

    chunks.push(...getPlayerNameChunks(pastObserver, opt, true));
    chunks.push([opt.abbreviate ? " " : "'s ", "gray"]);

    // +1 for the new quark
    const count =
      pastActive.chamber.filter((q) => q === pastCollapsedFlavor).length + 1;
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
  } else if (state.observation.reaction === "tunneled") {
    // alice (0) 2s -> bob (1)
    // alice (0)'s 2 strange quarks tunneled to bob (1)

    chunks.push(...getPlayerNameChunks(pastObserver, opt, false));
    chunks.push([opt.abbreviate ? " " : "'s ", "gray"]);

    // +1 for the new quark
    const count =
      pastActive.chamber.filter((q) => q === pastCollapsedFlavor).length + 1;
    const flavorString = opt.abbreviate
      ? pastCollapsedFlavor.slice(0, 1)
      : ` ${pastCollapsedFlavor}`;
    chunks.push([
      `${count}${flavorString}`,
      QUARK_MAPPING[pastCollapsedFlavor],
    ]);

    if (opt.abbreviate) {
      chunks.push([" -> ", "gray"]);
      chunks.push(...getPlayerNameChunks(pastActive, opt, false));
    } else {
      chunks.push([" quarks ", "gray"]);
      chunks.push(["tunneled", "italic"]);
      chunks.push([" to ", "gray"]);
      chunks.push(...getPlayerNameChunks(pastActive, opt, false));
    }
  } else {
    // alice (0) +s
    // alice (0) added a strange quark to their chamber.

    chunks.push(
      ...getPlayerNameChunks(
        pastObserver,
        opt,
        pastActive.order === pastObserver.order,
      ),
    );
    chunks.push([opt.abbreviate ? " +" : " added a ", "gray"]);

    chunks.push([
      opt.abbreviate ? pastCollapsedFlavor.slice(0, 1) : pastCollapsedFlavor,
      QUARK_MAPPING[pastCollapsedFlavor],
    ]);

    if (!opt.abbreviate) {
      chunks.push([" quark to their chamber.", "gray"]);
    }
  }

  chunks.push("\n\n");

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

    chunks.push(...getObservationChunks(pastState, opt));
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

// function main() {
//   const options: Options = {
//     abbreviate: true,
//     showEmpty: false,
//     showPlayerOrder: true,
//     showPreviousObservation: true,
//   };

//   // Copied from the final state of seed 83
//   //
//   // prettier-ignore
//   const state: CurrentGameState = { "turn": 11, "activePlayer": 0, "activeQuark": ["up", "top", "charm"], "players": [{ "order": 0, "name": "alice", "chamber": ["charm"], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "bottom", "strange"], "score": 4 }], "timeline": [{ "turn": 1, "activePlayer": 0, "activeQuark": ["down", "up", "bottom"], "players": [{ "order": 0, "name": "alice", "chamber": ["down", "strange", "charm", "up"], "score": 0 }, { "order": 1, "name": "bob", "chamber": ["charm", "down", "up", "up"], "score": 0 }], "observation": { "activeFlavor": "down", "reaction": "hadronized", "observer": 0 } }, { "turn": 2, "activePlayer": 1, "activeQuark": ["strange", "bottom", "down"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "charm", "up"], "score": 2 }, { "order": 1, "name": "bob", "chamber": ["charm", "down", "up", "up"], "score": 0 }], "observation": { "activeFlavor": "down", "reaction": "hadronized", "observer": 1 } }, { "turn": 3, "activePlayer": 0, "activeQuark": ["strange", "up", "charm"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "charm", "up"], "score": 2 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 2 }], "observation": { "activeFlavor": "charm", "reaction": "hadronized", "observer": 0 } }, { "turn": 4, "activePlayer": 1, "activeQuark": ["down", "top", "strange"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "up"], "score": 4 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 2 }], "observation": { "activeFlavor": "strange", "reaction": "no reaction", "observer": 1 } }, { "turn": 5, "activePlayer": 0, "activeQuark": ["charm", "up", "strange"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "up"], "score": 4 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "strange"], "score": 2 }], "observation": { "activeFlavor": "strange", "reaction": "hadronized", "observer": 0 } }, { "turn": 6, "activePlayer": 1, "activeQuark": ["strange", "down", "top"], "players": [{ "order": 0, "name": "alice", "chamber": ["up"], "score": 6 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "strange"], "score": 2 }], "observation": { "activeFlavor": "strange", "reaction": "hadronized", "observer": 1 } }, { "turn": 7, "activePlayer": 0, "activeQuark": ["up", "bottom", "top"], "players": [{ "order": 0, "name": "alice", "chamber": ["up"], "score": 6 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 4 }], "observation": { "activeFlavor": "up", "reaction": "hadronized", "observer": 0 } }, { "turn": 8, "activePlayer": 1, "activeQuark": ["down", "top", "bottom"], "players": [{ "order": 0, "name": "alice", "chamber": [], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 4 }], "observation": { "activeFlavor": "bottom", "reaction": "no reaction", "observer": 1 } }, { "turn": 9, "activePlayer": 0, "activeQuark": ["charm", "top", "bottom"], "players": [{ "order": 0, "name": "alice", "chamber": [], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "bottom"], "score": 4 }], "observation": { "activeFlavor": "charm", "reaction": "no reaction", "observer": 0 } }, { "turn": 10, "activePlayer": 1, "activeQuark": ["strange", "bottom", "charm"], "players": [{ "order": 0, "name": "alice", "chamber": ["charm"], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "bottom"], "score": 4 }], "observation": { "activeFlavor": "strange", "reaction": "no reaction", "observer": 1 } }] };

//   sl(getStateChunks(state, options));
// }

// main();
