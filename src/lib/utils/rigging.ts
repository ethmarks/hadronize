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
    bad: ["down", "top", "bottom"],
  };

  if (!superposition.good.includes(flavor.good))
    throw new Error("good superposition must contain good flavor!");
  if (!superposition.bad.includes(flavor.bad))
    throw new Error("bad superposition must contain bad flavor!");

  if (superposition.good.some((f) => superposition.bad.includes(f)))
    throw new Error("superpositions cannot overlap!");

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
    count: (player: Player, count: number) => {
      let currentCount = player.chamber.indices.length;

      if (currentCount === count) return;

      while (currentCount > count) {
        player.chamber.indices.pop();
        currentCount--;
      }

      while (currentCount < count) {
        const quarkIndex = game.superposedIndex ?? game.produceQuark();
        game.quarks[quarkIndex].collapse();
        player.chamber.indices.push(quarkIndex);
        game.superposedIndex = undefined;
        game.produceQuark();
        currentCount++;
      }
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
      count: (count: number) => {
        game.players.forEach((p) => {
          player.count(p, count);
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
