import type { CurrentGameState } from "./Hadronize";
import { Hadron, Quark } from "./Quark";

export interface PlayerInit {
  name: string;
  driver: Driver;
}

export interface Scratchpad {
  read: () => string;
  write: (content: string) => void;
}

export type Driver = (
  state: CurrentGameState,
  scratchpad: Scratchpad,
) => Promise<number>;

export function validatePlayerInits(inits: PlayerInit[]): void {
  // check for duplicate names
  const names = inits.map((i) => i.name);
  const duplicates = names.filter(
    (item, index) => names.indexOf(item) !== index,
  );
  if (duplicates.length > 0) {
    throw new Error(`Player inits have duplicate names: ${duplicates}`);
  }
}

export class Chamber {
  /** Stores the IDs of the quarks in the chamber */
  public indices: number[] = [];

  /**
   * Stores the hadrons in the chamber.
   *
   * Each hadron is an array of the IDs of the quarks in that hadron.
   */
  public hadrons: Hadron[] = [];

  constructor() {}
}

export class Player {
  /**
   * Stores all the non-hadronized quarks.
   */
  public chamber: Chamber = new Chamber();

  /**
   * Persistent scratchpad for the drivers.
   */
  private scratchpadContent: string = "";

  public readonly scratchpad: Scratchpad;

  constructor(
    public readonly order: number,
    public readonly name: string,
    public readonly driver: Driver,
  ) {
    this.scratchpad = {
      read: () => this.scratchpadContent,
      write: (content: string) => (this.scratchpadContent = content),
    };
  }

  public get score() {
    return this.chamber.hadrons.reduce(
      (acc, hadron) => (acc += hadron.indices.length),
      0,
    );
  }
}
