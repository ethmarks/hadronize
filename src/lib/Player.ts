import { Hadron, Quark } from "./Quark";

export interface PlayerInit {
  name: string;
}

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
  public chamber: Chamber = new Chamber();

  constructor(
    public readonly id: number,
    public readonly name: string,
  ) {}
}
