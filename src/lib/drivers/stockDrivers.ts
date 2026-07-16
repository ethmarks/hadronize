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
