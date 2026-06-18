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
    public readonly id: number,
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
      id: this.id,
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
      id: this.id,
      flavor: this.flavor,
      isHadronized: this.isHadronized,
    };
  }
}
