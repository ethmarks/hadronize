import type { Player } from "../Player.ts";
import type { Hadronize, Result } from "../Hadronize.ts";
import {
  FLAVORS,
  Quark,
  type Flavor,
  type QuarkStatus,
  type Superposition,
} from "../Quark.ts";
import type { LabelProps } from "../components/Label.svelte";

export interface UIQuark {
  index: number;
  x: number;
  y: number;
  flavor: Flavor;
  superposition: Superposition;
  status: QuarkStatus;
  text: string;
  owner: number | undefined;
}

export type QuarkMap = Record<Flavor | "hadron", number[]>;

export interface UIChamber {
  order: number;
  hovered: boolean;
  tooLarge: boolean;
  x: number;
  y: number;
  label: LabelProps;
  quarkMap: QuarkMap;
  quarkRadius: number;

  /**
   * Fixed value to prevent hover thrashing
   */
  hoverRadius: number;
}

export class StoreManager {
  public quarks: UIQuark[];
  public chambers: UIChamber[];
  public superposed: UIQuark;

  public result: Result = $state(undefined);

  constructor(
    public game: Hadronize,
    public labelDefaultColor: string,
  ) {
    this.quarks = $state(this.game.quarks.map(this.initQuark));

    this.chambers = $state(this.game.players.map(this.initChamber));

    this.superposed = $derived(this.quarks[this.game.superposedIndex!]);
  }

  private getEmptyQuarkMap(): QuarkMap {
    return {
      up: [],
      down: [],
      strange: [],
      charm: [],
      top: [],
      bottom: [],
      hadron: [],
    };
  }

  private initQuark = (quark: Quark): UIQuark => {
    let owner: number | undefined = undefined;
    for (const player of this.game.players) {
      if (player.chamber.indices.includes(quark.index)) {
        owner = player.order;
        break;
      }
    }
    return {
      index: quark.index,
      status: quark.status,
      flavor: quark.flavor,
      superposition: quark.superposition,
      text: "",
      x: 0,
      y: 0,
      owner,
    };
  };

  private initChamber = (player: Player): UIChamber => {
    const quarkMap = this.getEmptyQuarkMap();
    player.chamber.indices.forEach((i) =>
      quarkMap[this.game.quarks[i].flavor].push(i),
    );

    const label: LabelProps = {
      x: 0,
      y: 0,
      text: this.game.players[player.order].name,
      color: this.labelDefaultColor,
      fontSizeRem: 2,
    };

    return {
      order: player.order,
      hovered: false,
      tooLarge: false,
      x: 0,
      y: 0,
      quarkMap,
      quarkRadius: 75,
      hoverRadius: 70,
      label,
    };
  };

  public syncQuarks(): void {
    for (const uiQuark of this.quarks) {
      const gameQuark = this.game.quarks[uiQuark.index];

      uiQuark.status = gameQuark.status;
      uiQuark.flavor = gameQuark.flavor;
      uiQuark.superposition = gameQuark.superposition;
    }
  }

  public syncChamber = (chamber: UIChamber): void => {
    const player = this.game.players[chamber.order];

    for (const flavor of FLAVORS) {
      chamber.quarkMap[flavor] = player.chamber.indices.filter(
        (i) => this.quarks[i].flavor === flavor,
      );
    }

    chamber.quarkMap["hadron"] = player.chamber.hadrons
      .map((h) => h.indices)
      .flat();
  };

  public syncChambers(): void {
    this.syncQuarks();
    this.chambers.forEach(this.syncChamber);
  }
}
