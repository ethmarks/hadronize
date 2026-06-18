import { Quark } from "./Quark";

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

export class Player {
  public chamber: Quark[] = [];

  constructor(
    public readonly id: number,
    public readonly name: string,
  ) {}
}
