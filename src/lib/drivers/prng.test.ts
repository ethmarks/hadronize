import { expect, describe, it } from "vitest";
import { Hadronize } from "../Hadronize.ts";
import { prngDriver } from "./prng.ts";
import { dogpileDriver } from "./dogpile.ts";

const runPrngDriver: (seed?: number) => Promise<number> = async (
  seed: number = 1,
) => {
  const game = new Hadronize(seed, [
    { name: "prng", driver: prngDriver },
    { name: "dogpile1", driver: dogpileDriver },
    { name: "dogpile2", driver: dogpileDriver },
    { name: "dogpile3", driver: dogpileDriver },
    { name: "dogpile4", driver: dogpileDriver },
    { name: "dogpile5", driver: dogpileDriver },
  ]);

  game.produceQuark();
  const state = game.updateState();

  // Because the prng player is first in the list, it should be the active
  // player, but we check just to be sure.
  const prngPlayer = game.activePlayer;
  if (prngPlayer.name !== "prng")
    throw new Error("runPrngDriver did not initialize players correctly");

  const result = await prngPlayer.driver(state, prngPlayer.scratchpad);

  return result;
};

describe("PRNG Driver", () => {
  it("should run without errors", () => {
    expect(runPrngDriver).not.toThrow();
  });

  it.each([1, 639172, 538191])(
    "should behave deterministically with seed $0",
    async (seed: number) => {
      const result1 = await runPrngDriver(seed);
      const result2 = await runPrngDriver(seed);

      expect(result1).toBe(result2);
    },
  );

  it("should have a fair distribution", async () => {
    const INCREMENT_LIMIT = 600;

    const counters: { result: number; count: number }[] = [];

    // Using sequential seeds is fine because they're passed through Mulberry32
    // anyways.
    for (let seed = 0; seed < INCREMENT_LIMIT; seed++) {
      const res = await runPrngDriver(seed);
      const counter = counters.find((c) => c.result === res);
      if (counter === undefined) {
        counters.push({ result: res, count: 1 });
      } else {
        counter.count++;
      }
    }

    const expected = INCREMENT_LIMIT / counters.length;
    let chiSquare = 0;

    counters.forEach((counter) => {
      const squareDiff = (counter.count - expected) ** 2;
      const contribution = squareDiff / expected;
      chiSquare += contribution;
    });

    // For 5 degress of freedom at 95% confidence
    const criticalValue = 11.07;

    expect(chiSquare).toBeLessThan(criticalValue);
  });
});
