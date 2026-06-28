import type { Hadronize } from "../Hadronize.ts";
import type { Player } from "../Player.ts";
import { Quark, type Flavor, type Superposition } from "../Quark.ts";

/**
 * utilities to assist in easily rigging games for tests.
 */
export function getRigging(game: Hadronize) {
  // Use consistent flavors and superpositions for rigging players to be good
  // matches or bad matches.
  const flavor: { good: Flavor; bad: Flavor } = {
    good: "up",
    bad: "down",
  };
  const superposition: { good: Superposition; bad: Superposition } = {
    good: ["up", "charm", "strange"],
    bad: ["down", "charm", "strange"],
  };

  if (superposition.good.includes(flavor.bad))
    throw new Error("good superposition shouldn't contain bad flavor!");
  if (superposition.bad.includes(flavor.good))
    throw new Error("bad superposition shouldn't contain good flavor!");

  const quark = {
    good: (quark: Quark) => {
      quark.flavor = flavor.good;
      quark.superposition = superposition.good;
    },
    bad: (quark: Quark) => {
      quark.flavor = flavor.bad;
      quark.superposition = superposition.bad;
    },
  };
  const player = {
    good: (player: Player) => {
      player.chamber.indices.forEach((index) => {
        quark.good(game.quarks[index]);
      });
    },
    bad: (player: Player) => {
      player.chamber.indices.forEach((index) => {
        quark.bad(game.quarks[index]);
      });
    },
  };
  const all = {
    players: {
      good: () => {
        game.players.forEach((p) => {
          player.good(p);
        });
      },
      bad: () => {
        game.players.forEach((p) => {
          player.bad(p);
        });
      },
    },
  };

  return {
    quark,
    player,
    all,
  };
}
