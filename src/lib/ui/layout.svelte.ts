import type { Hadronize, Result } from "../Hadronize.ts";
import type { Flavor } from "../Quark.ts";
import type { UIChamber, UIQuark } from "./store.svelte.ts";
import {
  getVertexPos,
  getVertexDistance,
  getGridPos,
} from "../utils/polygon.ts";

const REVOLVE_CHAMBERS = false;

class Container {
  width: number = $state(0);
  height: number = $state(0);
  left: number = $state(0);
  top: number = $state(0);
  x: number = $derived(this.width / 2);
  y: number = $derived(this.height / 2);
}

export type ChamberLayoutType = "ring" | "grid";

export class LayoutManager {
  public container = new Container();
  public quarkSize = $state(50);

  public chamberLayoutType: ChamberLayoutType = "ring";

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

  get chamberRadius(): number {
    return Math.min(this.container.width, this.container.height) * 0.25;
  }

  get chamberSpacing(): number {
    return getVertexDistance(this.chambers.length, this.chamberRadius);
  }

  /**
   * For running inside onMount.
   */
  init() {
    window.addEventListener("resize", (_) => {
      if (this.getResult() === undefined) this.update();
    });
    this.update();
  }

  recalculateQuarkRadius(chamber: UIChamber, sides: number): void {
    // If we have 1 or fewer sides, return early and don't change the
    // quarkRadius.
    if (sides <= 1) return;

    // The relationship between radius and vertex distance is perfectly
    // linear, so we can calculate it analytically rather than using a loop
    // like I was before.

    // Spacing per 1 pixel of radius
    const spacingPerPixel = getVertexDistance(sides, 1);

    const minRadius = (this.quarkSize * 1.2) / spacingPerPixel;
    const maxRadius = (this.quarkSize * 1.6) / spacingPerPixel;

    // We use a clamp so that we only change the radius when we need to,
    // which prevents the layout from changing unnecessarily.
    chamber.quarkRadius = Math.max(
      minRadius,
      Math.min(maxRadius, chamber.quarkRadius),
    );
  }

  placeQuarksFull(chamber: UIChamber) {
    const flatIndicies: number[] = Object.values(chamber.quarkMap).flat();

    const sides = flatIndicies.length;

    this.recalculateQuarkRadius(chamber, sides);

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

      if (
        chamber.quarkRadius >= this.chamberSpacing / 2 ||
        quarkPos.x > this.container.width - this.quarkSize / 2 ||
        quarkPos.x < 0 + this.quarkSize / 2 ||
        quarkPos.y > this.container.height - this.quarkSize / 2 ||
        quarkPos.y < 0 + this.quarkSize / 2
      ) {
        chamber.tooLarge = true;
      }

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

    this.recalculateQuarkRadius(chamber, sides);

    const quarkRadius = hasHadrons
      ? Math.max(this.quarkSize * 1.2, chamber.quarkRadius)
      : chamber.quarkRadius;

    nonEmptyByFlavor.forEach(([flavor, indices], i) => {
      const quarkPos =
        flavor === "hadron"
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
    const showFull = chamber.showCount === false && chamber.tooLarge === false;

    if (showFull) {
      this.placeQuarksFull(chamber);
    } else {
      this.placeQuarksCount(chamber);
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

  getPosInChamberRing(
    count: number,
    order: number,
    radius: number,
  ): { x: number; y: number } {
    return getVertexPos(
      this.container.x,
      this.container.y,
      count,
      order,
      radius,
      -0.25,
    );
  }

  getPosInChamberGrid(count: number, order: number): { x: number; y: number } {
    const longLength = Math.max(this.container.width, this.container.height);
    const shortLength = Math.min(this.container.width, this.container.height);

    const { long, short } = getGridPos(count, order, longLength, shortLength);

    if (this.container.width > this.container.height) {
      return { x: long, y: short };
    } else {
      return { x: short, y: long };
    }
  }

  placeChamber(chamber: UIChamber) {
    const count = this.chambers.length;
    const order = REVOLVE_CHAMBERS
      ? (chamber.order - ((this.game.turn - 1) % count) + count) % count
      : chamber.order;

    const pos =
      this.chamberLayoutType === "ring"
        ? this.getPosInChamberRing(count, order, this.chamberRadius)
        : this.getPosInChamberGrid(count, order);

    chamber.x = pos.x;
    chamber.y = pos.y;
  }

  update() {
    this.updateContainer();

    this.chambers.forEach((chamber) => {
      this.placeChamber(chamber);

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
}
