export const FLAVORS = [
  "up",
  "down",
  "strange",
  "charm",
  "bottom",
  "top",
] as const;

export type Flavor = (typeof FLAVORS)[number];
export type Superposition = [Flavor, Flavor, Flavor];

export interface SuperposedQuarkInfo {
  id: number;
  superposition: Superposition;
}

export interface CollapsedQuarkInfo {
  id: number;
  flavor: Flavor;
  isHadronized: boolean;
}

/**
 * Gets a pseudorandom flavor.
 *
 * Converts a number between 0 and 1 (e.g. the output of Math.random()) into
 * one of the six flavors, with a uniform distribution.
 */
export function prngFlavor(seed: number): Flavor {
  // validate input
  if (seed < 0 || seed >= 1) {
    throw new Error(
      `PrngFlavor only accepts seeds between 0 and 1, got ${seed}`,
    );
  }

  // convert the float to an integer between 0 and 5
  const int = Math.floor(seed * FLAVORS.length);

  return FLAVORS[int];
}

export class Quark {
  public isCollapsed: boolean = false;
  public isHadronized: boolean = false;

  constructor(
    /** The quarks's index in the game's quark list. */
    public readonly index: number,
    public flavor: Flavor,
    public superposition: Superposition,
  ) {}

  collapse() {
    this.isCollapsed = true;
  }

  hadronize() {
    this.isHadronized = true;
  }

  /**
   * Gets the publicly-available information about the quark. Throws an error if the quark is not superposed.
   */
  public get superposedInfo(): SuperposedQuarkInfo {
    if (this.isCollapsed) {
      throw new Error(
        "Tried to access collapsed info of a non-collapsed quark!",
      );
    }

    return {
      id: this.index,
      superposition: this.superposition,
    };
  }

  /**
   * Gets the publicly-available information about the quark. Throws an error if the quark is not collapsed.
   */
  public get collapsedInfo(): CollapsedQuarkInfo {
    if (!this.isCollapsed) {
      throw new Error(
        "Tried to access collapsed info of a non-collapsed quark!",
      );
    }

    return {
      id: this.index,
      flavor: this.flavor,
      isHadronized: this.isHadronized,
    };
  }
}
/**
 * 2, 3, 4, and 5 are the real scientific terms for those types of hadrons.
 *
 * The rest are just made up by continuing the pattern with Greek numeral
 * prefixes.
 *
 * Conveniently, all of them can be pluralized just be appending an 's' to the
 * end.
 */
const HADRON_TERMS: Record<number, string> = {
  2: "meson",
  3: "baryon",
  4: "tetraquark",
  5: "pentaquark",
  6: "hexaquark",
  7: "heptaquark",
  8: "octaquark",
  9: "enneaquark",
  10: "decaquark",
  11: "hendecaquark",
  12: "dodecaquark",
  13: "tridecaquark",
  14: "tetradecaquark",
  15: "pentadecaquark",
  16: "hexadecaquark",
  17: "heptadecaquark",
  18: "octadecaquark",
  19: "enneadecaquark",
  20: "icosaquark",
};

/**
 * If a hadron with more than 20 quarks is ever formed, we just fall back to a
 * term for a hadron with an indefinite amount of quarks.
 */
const DEFAULT_QUARK_TERM: string = "hadronic condensate";

export class Hadron {
  /**
   * The indices of the quarks in the hadron
   */
  public readonly indices: number[];

  constructor(indices: number[]) {
    if (indices.length < 2) {
      throw new Error(`Cannot create a hadron with ${indices.length} quarks!`);
    }
    this.indices = indices;
  }

  /**
   * The term for this type of hadron in English.
   */
  get term(): string {
    const count = this.indices.length;
    if (Object.hasOwn(HADRON_TERMS, count)) {
      return HADRON_TERMS[count];
    } else {
      return DEFAULT_QUARK_TERM;
    }
  }
}
