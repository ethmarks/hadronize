import { MAX_PLAYERS, type CurrentGameState, MIN_PLAYERS } from "./Hadronize";
import { Hadron } from "./Quark";

export interface PlayerInit {
  name: string;
  driver: Driver;
}

export interface Scratchpad {
  read: () => string;
  write: (content: string) => void;
}

class PlayerScratchpad implements Scratchpad {
  constructor(private player: { _scratchpadContent: string }) {}
  read() {
    return this.player._scratchpadContent;
  }
  write(content: string) {
    this.player._scratchpadContent = content;
  }
}

export type Driver = (
  state: CurrentGameState,
  pad: Scratchpad,
) => Promise<number>;

export function validatePlayerInits(inits: PlayerInit[]): void {
  if (inits.length < MIN_PLAYERS) {
    throw new Error("Not enough player inits");
  }
  if (inits.length > MAX_PLAYERS) {
    throw new Error("Too many player inits");
  }

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
   * Stores all the player's quarks.
   */
  public chamber: Chamber = new Chamber();

  /**
   * Persistent scratchpad for the drivers.
   */
  public readonly scratchpad: Scratchpad;

  /**
   * Do not read or write directly from this. Use the scratchpad.
   */
  public _scratchpadContent: string = "";

  constructor(
    public readonly order: number,
    public readonly name: string,
    public readonly driver: Driver,
  ) {
    this.scratchpad = new PlayerScratchpad(this);
  }

  public get score() {
    return this.chamber.hadrons.reduce(
      (acc, hadron) => (acc += hadron.indices.length),
      0,
    );
  }
}
