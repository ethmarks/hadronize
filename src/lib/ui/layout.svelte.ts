import type { Hadronize, Result } from "../Hadronize.ts";
import type { Flavor } from "../Quark.ts";
import type { UIChamber, UIQuark } from "./store.svelte.ts";
import { getVertexPos, getVertexDistance } from "../utils/polygon.ts";

const SHUFFLE_CHAMBERS = false;

class Container {
  width: number = $state(0);
  height: number = $state(0);
  left: number = $state(0);
  top: number = $state(0);
  x: number = $derived(this.width / 2);
  y: number = $derived(this.height / 2);
}

export class LayoutManager {
  public container = new Container();
  public quarkSize = $state(50);

  constructor(
    public game: Hadronize,
    public quarks: UIQuark[],
    public chambers: UIChamber[],
    public syncQuarks: () => void,
    public getResult: () => Result,
    public labelDefaultColor: string,
    public labelActiveColor: string,
  ) {}

  public get chamberRadius(): number {
    return Math.min(this.container.width, this.container.height) * 0.25;
  }

  public get chamberSpacing(): number {
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

  updateChamberContent(chamber: UIChamber) {
    if (chamber.showCount === false && chamber.tooLarge === false) {
      const flatIndicies: number[] = Object.values(chamber.quarkMap).flat();

      const sides = flatIndicies.length;

      let spacing: number = getVertexDistance(sides, chamber.quarkRadius);

      // Will cause an infinite loop if run with 1 or fewer sides
      if (sides > 1) {
        while (spacing < 60) {
          chamber.quarkRadius += 1;
          spacing = getVertexDistance(sides, chamber.quarkRadius);
        }
        while (spacing > 80) {
          chamber.quarkRadius -= 1;
          spacing = getVertexDistance(sides, chamber.quarkRadius);
        }
      }

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
    } else {
      const nonEmptyByFlavor = Object.entries(chamber.quarkMap).filter(
        ([_, indices]) => indices.length > 0,
      ) as [Flavor | "hadron", number[]][];

      const hasHadrons = nonEmptyByFlavor.some(
        ([flavor, _]) => flavor === "hadron",
      );

      const sides = hasHadrons
        ? nonEmptyByFlavor.length - 1
        : nonEmptyByFlavor.length;

      let spacing: number = getVertexDistance(sides, chamber.quarkRadius);

      // Will cause an infinite loop if run with 1 or fewer sides
      if (sides > 1) {
        while (spacing < 100) {
          chamber.quarkRadius += 1;
          spacing = getVertexDistance(sides, chamber.quarkRadius);
        }
        while (spacing > 120) {
          chamber.quarkRadius -= 1;
          spacing = getVertexDistance(sides, chamber.quarkRadius);
        }
      }

      nonEmptyByFlavor.forEach(([flavor, indices], i) => {
        const quarkPos =
          flavor === "hadron"
            ? { x: chamber.x, y: chamber.y }
            : getVertexPos(chamber.x, chamber.y, sides, i, chamber.quarkRadius);
        indices.forEach((quarkIndex) => {
          const UIquark = this.quarks[quarkIndex];
          UIquark.x = quarkPos.x - this.quarkSize / 2;
          UIquark.y = quarkPos.y - this.quarkSize / 2;
          UIquark.text = indices.length.toString();
        });
      });
    }
  }

  updateChamberLabel(chamber: UIChamber) {
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

  update() {
    this.updateContainer();

    this.chambers.forEach((chamber) => {
      const chamberPos = getVertexPos(
        this.container.x,
        this.container.y,
        this.chambers.length,
        chamber.order,
        this.chamberRadius,
        SHUFFLE_CHAMBERS
          ? ((this.game.turn - 1) / this.chambers.length) * -1 - 0.25
          : -0.25,
      );
      chamber.x = chamberPos.x;
      chamber.y = chamberPos.y;

      this.updateChamberContent(chamber);
      this.updateChamberLabel(chamber);
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
