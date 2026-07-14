import type { Hadronize, Result } from "../Hadronize.ts";
import type { Flavor } from "../Quark.ts";
import type { UIChamber, UIQuark } from "./store.svelte.ts";
import { getVertexPos } from "../utils/polygon.ts";
import {
  computeLayoutPlan,
  smartSetQuarkRadius,
  type InputChamber,
  type LayoutPlan,
} from "./planLayout.ts";

class Container {
  width: number = $state(0);
  height: number = $state(0);
  left: number = $state(0);
  top: number = $state(0);
  x: number = $derived(this.width / 2);
  y: number = $derived(this.height / 2);
}

/**
 * The layout used to place chambers in the game.
 */
export type GlobalLayoutMode = "ring" | "grid";

/**
 * The layout used to place quarks in a chamber.
 */
export type ChamberLayoutMode = "full" | "count";

const PREFERRED_QUARK_SIZE = 50;

export class LayoutManager {
  public container = new Container();
  public quarkSize = $state(PREFERRED_QUARK_SIZE);

  public globalLayoutMode: GlobalLayoutMode = "ring";

  constructor(
    public game: Hadronize,

    // Store values
    public quarks: UIQuark[],
    public chambers: UIChamber[],

    // Store getters
    public syncQuarks: () => void,
    public getResult: () => Result,

    // Constants
    public labelDefaultColor: string,
    public labelActiveColor: string,
  ) {}

  /**
   * For running inside onMount.
   */
  init() {
    window.addEventListener("resize", (_) => {
      if (this.getResult() === undefined) this.update();
    });
    this.update();
  }

  placeQuarksFull(chamber: UIChamber) {
    const flatIndicies: number[] = Object.values(chamber.quarkMap).flat();

    const sides = flatIndicies.length;

    flatIndicies.forEach((quarkIndex, i) => {
      const quarkPos =
        sides === 1
          ? { x: chamber.x, y: chamber.y }
          : getVertexPos(
              chamber.x,
              chamber.y,
              sides,
              i,
              chamber.quarkRadius,
              chamber.order / this.chambers.length,
            );

      const quark = this.quarks[quarkIndex];
      quark.x = quarkPos.x - this.quarkSize / 2;
      quark.y = quarkPos.y - this.quarkSize / 2;

      quark.text =
        quark.status === "hadronized" ? "h" : quark.flavor.slice(0, 1);
    });
  }

  placeQuarksCount(chamber: UIChamber) {
    const nonEmptyByFlavor = Object.entries(chamber.quarkMap).filter(
      ([_, indices]) => indices.length > 0,
    ) as [Flavor | "hadron", number[]][];

    const hasHadrons = nonEmptyByFlavor.some(
      ([flavor, _]) => flavor === "hadron",
    );

    const sides = hasHadrons
      ? nonEmptyByFlavor.length - 1
      : nonEmptyByFlavor.length;

    const quarkRadius = hasHadrons
      ? Math.max(this.quarkSize * 1.2, chamber.quarkRadius)
      : chamber.quarkRadius;

    nonEmptyByFlavor.forEach(([flavor, indices], i) => {
      const quarkPos =
        flavor === "hadron" || (!hasHadrons && sides === 1)
          ? { x: chamber.x, y: chamber.y }
          : getVertexPos(chamber.x, chamber.y, sides, i, quarkRadius);
      indices.forEach((quarkIndex) => {
        const UIquark = this.quarks[quarkIndex];
        UIquark.x = quarkPos.x - this.quarkSize / 2;
        UIquark.y = quarkPos.y - this.quarkSize / 2;
        UIquark.text = indices.length.toString();
      });
    });
  }

  placeQuarks(chamber: UIChamber) {
    if (chamber.layoutMode === "count") {
      this.placeQuarksCount(chamber);
    } else {
      this.placeQuarksFull(chamber);
    }
  }

  placeChamberLabel(chamber: UIChamber) {
    chamber.label.x = chamber.x;
    chamber.label.y = chamber.y - chamber.quarkRadius - this.quarkSize;
    chamber.label.color =
      this.game.activePlayer.order === chamber.order
        ? this.labelActiveColor
        : this.labelDefaultColor;
  }

  updateContainer() {
    const gameContainer = document.getElementById("gameContainer");
    if (gameContainer) {
      const rect = gameContainer.getBoundingClientRect();
      this.container.width = rect.width;
      this.container.height = rect.height;
      this.container.left = rect.left;
      this.container.top = rect.top;
    }
  }

  getLayoutPlan(): LayoutPlan {
    const inputChambers: InputChamber[] = this.chambers.map((chamber) => ({
      order: chamber.order,
      hovered: chamber.hovered,
      quarkMap: chamber.quarkMap,
    }));

    const inputContainer = {
      width: this.container.width,
      height: this.container.height,
    };

    const preferredChamberRingRadius =
      Math.min(this.container.width, this.container.height) * 0.25;

    const plan = computeLayoutPlan(
      inputChambers,
      inputContainer,
      PREFERRED_QUARK_SIZE,
      preferredChamberRingRadius,
    );

    return plan;
  }

  applyLayoutPlan(plan: LayoutPlan): void {
    // We check if the values are changed before modifying them to avoid
    // unnecessarily triggering Svelte reactivity.

    plan.chambers.forEach((chamberPlan, index) => {
      const uiChamber = this.chambers[index];

      if (uiChamber.order !== chamberPlan.order) {
        throw new Error("layout plan is improperly ordered");
      }

      if (uiChamber.x !== chamberPlan.x) {
        uiChamber.x = chamberPlan.x;
      }
      if (uiChamber.y !== chamberPlan.y) {
        uiChamber.y = chamberPlan.y;
      }
      if (uiChamber.layoutMode !== chamberPlan.layoutMode) {
        uiChamber.layoutMode = chamberPlan.layoutMode;
      }
      if (uiChamber.quarkRadius !== chamberPlan.quarkRadius) {
        uiChamber.quarkRadius = chamberPlan.quarkRadius;
      }
    });

    if (this.globalLayoutMode !== plan.layoutMode) {
      this.globalLayoutMode = plan.layoutMode;
    }

    if (this.quarkSize !== plan.quarkSize) {
      this.quarkSize = plan.quarkSize;
    }
  }

  update() {
    this.updateContainer();

    const plan = this.getLayoutPlan();

    this.applyLayoutPlan(plan);

    this.chambers.forEach((chamber) => {
      // Chambers were already placed when we applied the layout plan
      // this.placeChamber(chamber);

      this.placeQuarks(chamber);
      this.placeChamberLabel(chamber);
    });

    this.syncQuarks();

    this.quarks.forEach((quark) => {
      if (quark.status === "latent" || quark.status === "superposed") {
        quark.text = "?";
        quark.x = this.container.x - this.quarkSize / 2;
        quark.y = this.container.y - this.quarkSize / 2;
      }
    });
  }

  explodeChamber(chamber: UIChamber) {
    const flatIndicies: number[] = Object.values(chamber.quarkMap).flat();

    flatIndicies.forEach((quarkIndex) => {
      const quark = this.quarks[quarkIndex];
      quark.x =
        Math.round(Math.random()) *
          (this.container.width + this.quarkSize * 2) -
        this.quarkSize;
      quark.y = this.container.height;
    });

    chamber.label.color = "transparent";
  }

  focalizeChamber(chamber: UIChamber) {
    chamber.hovered = false;
    chamber.layoutMode = "full";
    chamber.x = this.container.x;
    chamber.y = this.container.y;

    // UIChamber overlaps with ChamberPlan so they're compatible
    smartSetQuarkRadius(chamber, this.quarkSize);

    this.placeQuarks(chamber);

    chamber.label.color = "#98c379";
    chamber.label.text += " Wins!";
    this.placeChamberLabel(chamber);
  }
}
