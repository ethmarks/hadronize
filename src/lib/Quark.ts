export const FLAVORS = [
  "up",
  "down",
  "strange",
  "charm",
  "top",
  "bottom",
] as const;

export const SUPERPOSITION_SIZE = 3 as const;

export type Flavor = (typeof FLAVORS)[number];

// Helper for creating a tuple of a specific length
type TupleOf<
  T,
  N extends number,
  R extends unknown[] = [],
> = R["length"] extends N ? R : TupleOf<T, N, [T, ...R]>;

export type Superposition = TupleOf<Flavor, typeof SUPERPOSITION_SIZE>;

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

export type QuarkStatus = "latent" | "superposed" | "collapsed" | "hadronized";

export class Quark {
  public status: QuarkStatus = "latent";

  constructor(
    /** The quarks's index in the game's quark list. */
    public readonly index: number,
    public flavor: Flavor,
    public superposition: Superposition,
  ) {}

  public get isProduced(): boolean {
    return this.status !== "latent";
  }

  public get isCollapsed(): boolean {
    return this.status === "collapsed" || this.status === "hadronized";
  }

  public get isHadronized(): boolean {
    return this.status === "hadronized";
  }

  produce() {
    if (this.status !== "latent")
      throw new Error(
        `tried to collapse a ${this.status} quark! Only latent quarks can be produced.`,
      );
    this.status = "superposed";
  }

  collapse() {
    if (this.status !== "superposed")
      throw new Error(
        `tried to collapse a ${this.status} quark! Only superposed quarks can be collapsed.`,
      );
    this.status = "collapsed";
  }

  hadronize() {
    if (this.status !== "collapsed")
      throw new Error(
        `tried to collapse a ${this.status} quark! Only collapsed quarks can be hadronized.`,
      );
    this.status = "hadronized";
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

export function getHadronTerm(size: number): string {
  if (Object.hasOwn(HADRON_TERMS, size)) {
    return HADRON_TERMS[size];
  } else {
    return DEFAULT_QUARK_TERM;
  }
}

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
    return getHadronTerm(this.indices.length);
  }
}
