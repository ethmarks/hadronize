/**
 * This file provides utilities to interface with Hadronize as a CLI game.
 */

import type { CurrentGameState, PastGameState, PlayerState } from "./Hadronize";
import { FLAVORS, SUPERPOSITION_SIZE, type Flavor } from "./Quark";

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
      chunks.push({
        text: `${count}${flavorString}`,
        style: QUARK_MAPPING[flavor],
      });

      chunks.push({ text: opt.abbreviate ? "," : ", ", style: "gray" });
    }
  });

  // Remove the trailing ", "
  chunks.pop();

  return chunks;
}

function getPlayerChunks(
  player: PlayerState,
  opt: Options,
  highlight?: boolean,
): slChunk[] {
  const chunks: slChunk[] = [];

  // Name
  chunks.push({ text: player.name, style: highlight ? "bold" : "white" });

  // Order
  if (opt.showPlayerOrder) {
    if (highlight) {
      // Use square brackets instead of parenthesis so that the active player is
      // identifiable even if the colors aren't displaying.
      chunks.push({ text: " [", style: "gray" });
      chunks.push({ text: player.order.toString(), style: "bold" });
      chunks.push({ text: "]", style: "gray" });
    } else {
      chunks.push({ text: ` (${player.order})`, style: "gray" });
    }
  }

  // Separator
  chunks.push({ text: ": ", style: "gray" });

  // Chamber
  const chamberChunks = getChamberChunks(player.chamber, opt);
  chunks.push(...chamberChunks);

  // Hadrons
  if (player.score > 0 || opt.showEmpty) {
    // Only add a separator if the chamber chunks actually existed.
    if (chamberChunks.length > 0) {
      chunks.push({ text: opt.abbreviate ? "," : ", ", style: "gray" });
    }

    if (!opt.abbreviate) {
      chunks.push({ text: "and ", style: "gray" });
    }

    chunks.push({
      text: `${player.score}${opt.abbreviate ? "h" : " hadrons"}`,
      style: "bold",
    });
  }

  return chunks;
}

function getStateChunks(
  state: CurrentGameState | PastGameState,
  opt: Options,
): slChunk[] {
  const chunks: slChunk[] = [];

  // Log the current turn
  chunks.push({ text: "Turn #", style: "white" });
  chunks.push({ text: state.turn.toString(), style: "bold" });

  // Log the current superposition
  chunks.push({ text: ": ", style: "gray" });
  state.activeQuark.forEach((flavor, index, superposition) => {
    const flavorString = opt.abbreviate ? flavor.slice(0, 1) : flavor;
    chunks.push({
      text: flavorString,
      style: QUARK_MAPPING[flavor],
    });

    // Add 1 to normalize from zero-indexed to one-indexed.
    const isNotLastElement = index + 1 < superposition.length;

    // We only add separators if there's more than one element and if this
    // isn't the last element in the list.
    if (superposition.length > 1 && isNotLastElement) {
      if (opt.abbreviate) {
        chunks.push({ text: ",", style: "gray" });
      } else {
        // If this is the second-to-last element, add an "or"
        if (index + 2 === superposition.length) {
          chunks.push({ text: `, or `, style: "gray" });
        } else {
          chunks.push({ text: ", ", style: "gray" });
        }
      }
    }
  });

  // Next line
  chunks.push({ text: opt.abbreviate ? "\n" : "\n\n" });

  // Players
  state.players.forEach((player) => {
    chunks.push(
      ...getPlayerChunks(player, opt, player.order === state.activePlayer),
    );
    chunks.push({ text: "\n" });
  });

  return chunks;
}

// function main() {
//   // Copied from the final state of seed 83
//   //
//   // prettier-ignore
//   const state: CurrentGameState = { "turn": 11, "activePlayer": 0, "activeQuark": ["up", "top", "charm"], "players": [{ "order": 0, "name": "alice", "chamber": ["charm"], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "bottom", "strange"], "score": 4 }], "timeline": [{ "turn": 1, "activePlayer": 0, "activeQuark": ["down", "up", "bottom"], "players": [{ "order": 0, "name": "alice", "chamber": ["down", "strange", "charm", "up"], "score": 0 }, { "order": 1, "name": "bob", "chamber": ["charm", "down", "up", "up"], "score": 0 }], "observation": { "activeFlavor": "down", "reaction": "hadronized", "observer": 0 } }, { "turn": 2, "activePlayer": 1, "activeQuark": ["strange", "bottom", "down"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "charm", "up"], "score": 2 }, { "order": 1, "name": "bob", "chamber": ["charm", "down", "up", "up"], "score": 0 }], "observation": { "activeFlavor": "down", "reaction": "hadronized", "observer": 1 } }, { "turn": 3, "activePlayer": 0, "activeQuark": ["strange", "up", "charm"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "charm", "up"], "score": 2 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 2 }], "observation": { "activeFlavor": "charm", "reaction": "hadronized", "observer": 0 } }, { "turn": 4, "activePlayer": 1, "activeQuark": ["down", "top", "strange"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "up"], "score": 4 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 2 }], "observation": { "activeFlavor": "strange", "reaction": "no reaction", "observer": 1 } }, { "turn": 5, "activePlayer": 0, "activeQuark": ["charm", "up", "strange"], "players": [{ "order": 0, "name": "alice", "chamber": ["strange", "up"], "score": 4 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "strange"], "score": 2 }], "observation": { "activeFlavor": "strange", "reaction": "hadronized", "observer": 0 } }, { "turn": 6, "activePlayer": 1, "activeQuark": ["strange", "down", "top"], "players": [{ "order": 0, "name": "alice", "chamber": ["up"], "score": 6 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "strange"], "score": 2 }], "observation": { "activeFlavor": "strange", "reaction": "hadronized", "observer": 1 } }, { "turn": 7, "activePlayer": 0, "activeQuark": ["up", "bottom", "top"], "players": [{ "order": 0, "name": "alice", "chamber": ["up"], "score": 6 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 4 }], "observation": { "activeFlavor": "up", "reaction": "hadronized", "observer": 0 } }, { "turn": 8, "activePlayer": 1, "activeQuark": ["down", "top", "bottom"], "players": [{ "order": 0, "name": "alice", "chamber": [], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up"], "score": 4 }], "observation": { "activeFlavor": "bottom", "reaction": "no reaction", "observer": 1 } }, { "turn": 9, "activePlayer": 0, "activeQuark": ["charm", "top", "bottom"], "players": [{ "order": 0, "name": "alice", "chamber": [], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "bottom"], "score": 4 }], "observation": { "activeFlavor": "charm", "reaction": "no reaction", "observer": 0 } }, { "turn": 10, "activePlayer": 1, "activeQuark": ["strange", "bottom", "charm"], "players": [{ "order": 0, "name": "alice", "chamber": ["charm"], "score": 8 }, { "order": 1, "name": "bob", "chamber": ["charm", "up", "up", "bottom"], "score": 4 }], "observation": { "activeFlavor": "strange", "reaction": "no reaction", "observer": 1 } }] };

//   const options: Options = {
//     abbreviate: false,
//     showEmpty: false,
//     showPlayerOrder: true,
//   };

//   sl(getStateChunks(state, options));
// }

// main();
