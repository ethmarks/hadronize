import type { Hadronize, Result } from "../Hadronize.ts";
import type { Flavor } from "../Quark.ts";
import type { ChamberDatum, QuarkDatum } from "../components/Game.svelte";
import { getVertexPos, getVertexDistance } from "../utils/polygon.ts";

const SHUFFLE_CHAMBERS = false;

export class LayoutManager {
  center = $state({ x: 0, y: 0 });

  constructor(
    public game: Hadronize,
    public quarks: QuarkDatum[],
    public chambers: ChamberDatum[],
    public getResult: () => Result,
    public labelDefaultColor: string,
    public labelActiveColor: string,
  ) {}

  public get chamberRadius(): number {
    return Math.min(this.center.x, this.center.y) * 0.5;
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

  updateChamberContent(c: ChamberDatum) {
    if (c.showCount === false && c.tooLarge === false) {
      const flatIndicies: number[] = Object.values(c.quarksByFlavor).flat();

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
          quarkPos.x > this.center.x * 2 - 25 ||
          quarkPos.x < 0 + 25 ||
          quarkPos.y > this.center.y * 2 - 25 ||
          quarkPos.y < 0 + 25
        ) {
          c.tooLarge = true;
        }

        const UIquark = this.quarks[quarkIndex];
        const gameQuark = this.game.quarks[quarkIndex];
        UIquark.x = quarkPos.x - 25;
        UIquark.y = quarkPos.y - 25;

        UIquark.text = gameQuark.isHadronized
          ? "h"
          : gameQuark.flavor.slice(0, 1);
      });
    } else {
      const nonEmptyByFlavor = Object.entries(c.quarksByFlavor).filter(
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

  updateChamberLabel(c: ChamberDatum) {
    c.label.x = c.x;
    c.label.y = c.y - c.quarkRadius - 50;
    c.label.color =
      this.game.activePlayer.order === c.order
        ? this.labelActiveColor
        : this.labelDefaultColor;
  }

  update() {
    this.center.x = window.innerWidth / 2;
    this.center.y = window.innerHeight / 2;

    this.chambers.forEach((c) => {
      const chamberPos = getVertexPos(
        this.center.x,
        this.center.y,
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

    this.quarks.forEach((q) => {
      q.status = this.game.quarks[q.index].status;

      if (q.status === "latent" || q.status === "superposed") {
        q.text = "?";
        q.x = window.innerWidth / 2 - 25;
        q.y = window.innerHeight / 2 - 25;
      }
    });
  }
}
