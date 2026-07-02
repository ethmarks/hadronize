import type { Hadronize } from "../Hadronize.ts";
import {
  FLAVORS,
  type Flavor,
  type QuarkStatus,
  type Superposition,
} from "../Quark.ts";
import type { LabelProps } from "../components/Label.svelte";

export interface QuarkDatum {
  index: number;
  x: number;
  y: number;
  flavor: Flavor;
  superposition: Superposition;
  status: QuarkStatus;
  text: string;
  owner: number | undefined;
}

export interface ChamberDatum {
  order: number;
  showCount: boolean;
  tooLarge: boolean;
  x: number;
  y: number;
  label: LabelProps;
  quarksByFlavor: Record<Flavor | "hadron", number[]>;
  quarkRadius: number;
}

export class StoreManager {
  public quarks: QuarkDatum[];
  public chambers: ChamberDatum[];

  constructor(
    public game: Hadronize,
    public labelDefaultColor: string,
  ) {
    // Init quarks
    this.quarks = $state(
      game.quarks.map((q) => {
        let owner: number | undefined = undefined;
        for (const player of game.players) {
          if (player.chamber.indices.some((index) => index === q.index)) {
            owner = player.order;
            break;
          }
        }
        return {
          index: q.index,
          status: q.status,
          flavor: q.flavor,
          superposition: q.superposition,
          text: "",
          x: 0,
          y: 0,
          owner,
        };
      }),
    );

    // Init chambers
    this.chambers = $state(
      game.players.map((p, _) => {
        const quarksByFlavor: ChamberDatum["quarksByFlavor"] = {
          up: [],
          down: [],
          strange: [],
          charm: [],
          top: [],
          bottom: [],
          hadron: [],
        };
        p.chamber.indices.forEach((i) =>
          quarksByFlavor[game.quarks[i].flavor].push(i),
        );

        return {
          order: p.order,
          count: 0,
          showCount: false,
          tooLarge: false,
          x: -9999,
          y: -9999,
          quarksByFlavor,
          quarkRadius: 75,
          label: {
            x: 0,
            y: 0,
            text: game.players[p.order].name,
            color: labelDefaultColor,
            fontSizeRem: 2,
          },
        };
      }),
    );
  }

  syncQuarks(): void {
    for (const uiQuark of this.quarks) {
      const gameQuark = this.game.quarks[uiQuark.index];

      uiQuark.status = gameQuark.status;
      uiQuark.flavor = gameQuark.flavor;
      uiQuark.superposition = gameQuark.superposition;
    }
  }

  syncChambers(): void {
    this.syncQuarks();

    for (const chamber of this.chambers) {
      const player = this.game.players[chamber.order];

      for (const flavor of FLAVORS) {
        chamber.quarksByFlavor[flavor] = player.chamber.indices.filter(
          (i) => this.quarks[i].flavor === flavor,
        );
      }

      chamber.quarksByFlavor["hadron"] = player.chamber.hadrons
        .map((h) => h.indices)
        .flat();
    }
  }
}
