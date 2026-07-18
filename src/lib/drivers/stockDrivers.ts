import type { Driver } from "../Player.ts";
import { quickjsDriverFactory } from "./quickjs.ts";

export interface DriverProgram {
  id: string;
  name: string;
  description: string;
  code: string;
}

/** Doesn't do anything, just makes my IDE do syntax highlighting */
const js = (strings: TemplateStringsArray): string => strings[0];

export const STOCK_DRIVER_PROGRAMS: DriverProgram[] = [
  {
    id: "prng",
    name: "Bogo",
    description:
      "Chooses a completely random player each time. Not very smart.",
    code: js`
return Math.floor(Math.random() * state.players.length);
  `,
  },
  {
    id: "ev",
    name: "EVan",
    description:
      "Evaluates each available move using a simple formula and chooses the one with the highest expected value. Pretty smart.",
    code: js`
// Hadronizing 2 quarks is preferable to tunneling 2 quarks because the
// former permenantly increases your score while the latter is only an
// intermediate step.
//
// So we add an arbitrary weight to represent the preference for hadronizing
// over simply gaining quarks.
const HADRONIZE_WEIGHT = 1.5;

const expectedValues = state.players.map(
  (player) => {
    let ev = 0;

    const isSelf = player.order === state.activePlayer;

    state.superposedQuark.forEach((superposedFlavor) => {
      const matchCount = player.chamber.filter(
        (flavor) => flavor === superposedFlavor,
      ).length;

      if (matchCount > 0) {
        // Will be reactive

        // The reaction will involve the matching quarks AND the new quark,
        // so +1 to the match count.
        const totalQuarks = matchCount + 1;

        const mult = isSelf ? HADRONIZE_WEIGHT : 1;

        ev += (totalQuarks * mult) / 3;
      } else {
        // Will be non-reactive.

        // A non-reactive self-observe gains one extra quark but doesn't
        // hadronize, so it is worth 1 point.
        // A non-reactive other-observe gives an extra quark to an opponent,
        // so it is worth -1 points.
        ev += (isSelf ? 1 : -1) / 3;
      }
    });

    return {
      player: player.order,
      ev,
    };
  },
);

// Sort in descending order
expectedValues.sort((valA, valB) => valB.ev - valA.ev);

return expectedValues[0].player;
`,
  },
  {
    name: "Tit for tat",
    id: "mimick",
    description:
      "Replicates the previous player's action. Apparently tit for tat strategies are supposed to be very effective in game theory, but I guess they don't work very well in Hadronize because this bot sucks.",
    code: js`
const timeline = state.timeline;

if (timeline === undefined || timeline.length === 0) {
  // If it's the first turn, we just default to random.
  return Math.floor(Math.random() * state.players.length);
}

const lastTurn = timeline.at(-1);

return lastTurn.observation.observer;
`,
  },
  {
    name: "Kingslayer",
    id: "kingslayer",
    description: "Chooses the player with the highest score.",
    code: js`
const highestScore = state.players.reduce(
  (highest, player) => (player.score > highest ? player.score : highest),
  0,
);

const highestScoringPlayers = state.players.filter(
  (player) => player.score === highestScore,
);

const highscoreMe = highestScoringPlayers.find(
  (player) => player.order === state.activePlayer,
);

if (highscoreMe !== undefined) {
  return highscoreMe.order
} else {
  const index = Math.floor(Math.random() * highestScoringPlayers.length);
  return highestScoringPlayers[index].order;
}
      `,
  },
  {
    name: "Gentleman",
    id: "charm",
    description: "Collects as many charm quarks as possible.",
    code: js`
if (!state.superposedQuark.includes("charm")) {
  // If charm isn't even a possibility, what's the point? I'll just do a
  // self-observe I guess.
  return state.activePlayer;
}

// Helper for determining how charming a given player is
const charmingness = (player) =>
  player.chamber.filter((quark) => quark === "charm").length;

const mostCharm = state.players.reduce((most, player) => {
  const charm = charmingness(player);
  return charm > most ? charm : most;
}, 0);

const mostCharmingPlayers = state.players.filter(
  (player) => charmingness(player) === mostCharm,
);

const charmingMe = mostCharmingPlayers.find(
  (player) => player.order === state.activePlayer,
);

if (charmingMe !== undefined) {
  // Prefer self-observes to lock in charm so others can't steal charm
  return charmingMe.order;
} else {
  // Try to steal charm from others
  const index = Math.floor(Math.random() * mostCharmingPlayers.length);
  return mostCharmingPlayers[index].order;
}
`,
  },
];

export function getProgram(id: string): DriverProgram {
  const program = STOCK_DRIVER_PROGRAMS.find((program) => program.id === id);
  if (program === undefined)
    throw new Error(`${id} is not a valid stock driver`);
  return program;
}

export function getDriver(id: string): Driver {
  return quickjsDriverFactory(getProgram(id).code);
}
