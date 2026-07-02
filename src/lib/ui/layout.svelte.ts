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
    return Math.min(this.container.x, this.container.y) * 0.5;
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

  updateChamberContent(c: UIChamber) {
    if (c.showCount === false && c.tooLarge === false) {
      const flatIndicies: number[] = Object.values(c.quarkMap).flat();

      const sides = flatIndicies.length;

      let spacing: number = getVertexDistance(sides, c.quarkRadius);

      // Will cause an infinite loop if run with 1 or fewer sides
      if (sides > 1) {
        while (spacing < 60) {
          c.quarkRadius += 1;
          spacing = getVertexDistance(sides, c.quarkRadius);
        }
        while (spacing > 80) {
          c.quarkRadius -= 1;
          spacing = getVertexDistance(sides, c.quarkRadius);
        }
      }

      flatIndicies.forEach((quarkIndex, i) => {
        const quarkPos =
          sides === 1
            ? { x: c.x, y: c.y }
            : getVertexPos(
                c.x,
                c.y,
                sides,
                i,
                c.quarkRadius,
                c.order / this.chambers.length,
              );

        if (
          c.quarkRadius >= this.chamberSpacing / 2 ||
          quarkPos.x > this.container.x * 2 - 25 ||
          quarkPos.x < 0 + 25 ||
          quarkPos.y > this.container.y * 2 - 25 ||
          quarkPos.y < 0 + 25
        ) {
          c.tooLarge = true;
        }

        const quark = this.quarks[quarkIndex];
        quark.x = quarkPos.x - 25;
        quark.y = quarkPos.y - 25;

        quark.text =
          quark.status === "hadronized" ? "h" : quark.flavor.slice(0, 1);
      });
    } else {
      const nonEmptyByFlavor = Object.entries(c.quarkMap).filter(
        ([_, indices]) => indices.length > 0,
      ) as [Flavor | "hadron", number[]][];

      const hasHadrons = nonEmptyByFlavor.some(
        ([flavor, _]) => flavor === "hadron",
      );

      const sides = hasHadrons
        ? nonEmptyByFlavor.length - 1
        : nonEmptyByFlavor.length;

      let spacing: number = getVertexDistance(sides, c.quarkRadius);

      // Will cause an infinite loop if run with 1 or fewer sides
      if (sides > 1) {
        while (spacing < 100) {
          c.quarkRadius += 1;
          spacing = getVertexDistance(sides, c.quarkRadius);
        }
        while (spacing > 120) {
          c.quarkRadius -= 1;
          spacing = getVertexDistance(sides, c.quarkRadius);
        }
      }

      nonEmptyByFlavor.forEach(([flavor, indices], i) => {
        const quarkPos =
          flavor === "hadron"
            ? { x: c.x, y: c.y }
            : getVertexPos(c.x, c.y, sides, i, c.quarkRadius);
        indices.forEach((quarkIndex) => {
          const UIquark = this.quarks[quarkIndex];
          UIquark.x = quarkPos.x - 25;
          UIquark.y = quarkPos.y - 25;
          UIquark.text = indices.length.toString();
        });
      });
    }
  }

  updateChamberLabel(c: UIChamber) {
    c.label.x = c.x;
    c.label.y = c.y - c.quarkRadius - 50;
    c.label.color =
      this.game.activePlayer.order === c.order
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

    this.chambers.forEach((c) => {
      const chamberPos = getVertexPos(
        this.container.x,
        this.container.y,
        this.chambers.length,
        c.order,
        this.chamberRadius,
        SHUFFLE_CHAMBERS
          ? ((this.game.turn - 1) / this.chambers.length) * -1 - 0.25
          : -0.25,
      );
      c.x = chamberPos.x;
      c.y = chamberPos.y;

      this.updateChamberContent(c);
      this.updateChamberLabel(c);
    });

    this.syncQuarks();

    this.quarks.forEach((q) => {
      if (q.status === "latent" || q.status === "superposed") {
        q.text = "?";
        q.x = this.container.x - 25;
        q.y = this.container.y - 25;
      }
    });
  }

  explodeChamber(c: UIChamber) {
    const flatIndicies: number[] = Object.values(c.quarkMap).flat();

    flatIndicies.forEach((quarkIndex) => {
      const quark = this.quarks[quarkIndex];
      quark.x = Math.round(Math.random()) * (this.container.x * 2 + 100) - 50;
      quark.y = this.container.y * 2;
    });

    c.label.color = "transparent";
  }
}
