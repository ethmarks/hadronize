import type { ChamberDatum, QuarkDatum } from "./store.svelte.ts";
import { type DropIndicatorDTO } from "../components/DropIndicator.svelte";
import type { LayoutManager } from "./layout.svelte.ts";
import type { Result } from "../Hadronize.ts";

/**
 * The number of pixels that the drop indicator's radius should exceed the
 * quark radius of its chamber.
 */
const DROP_PADDING = 50;

export class MouseManager {
  superposedQuarkPressed: boolean = $state(false);
  mousePos: { x: number; y: number } = $state({ x: 0, y: 0 });
  hoveredChamber: ChamberDatum | undefined = $state(undefined);
  dropIndicator: DropIndicatorDTO = $state({
    active: false,
    radius: 0,
    x: 0,
    y: 0,
  });

  constructor(
    public chambers: ChamberDatum[],
    public getSuperposed: () => QuarkDatum,
    public layout: LayoutManager,
    public getResult: () => Result,
  ) {}

  public get superposed(): QuarkDatum {
    return this.getSuperposed();
  }

  public get result(): Result {
    return this.getResult();
  }

  detectDrop() {
    let isSuperposedOverHovered = false;
    for (const chamber of this.chambers) {
      const mouseDistance = Math.sqrt(
        Math.abs(chamber.x - this.mousePos.x) ** 2 +
          Math.abs(chamber.y - this.mousePos.y) ** 2,
      );
      const superposedDistance = Math.sqrt(
        Math.abs(chamber.x - this.superposed.x) ** 2 +
          Math.abs(chamber.y - this.superposed.y) ** 2,
      );

      if (superposedDistance < chamber.quarkRadius + DROP_PADDING) {
        isSuperposedOverHovered = true;
      }

      if (mouseDistance < chamber.quarkRadius + DROP_PADDING) {
        this.hoveredChamber = chamber;

        // Multiple chambers can't be hovered over simultaneously, so we
        // skip checking the others.
        break;
      }

      this.hoveredChamber = undefined;
      this.dropIndicator.active = false;
    }

    if (this.hoveredChamber === undefined) {
      this.chambers.forEach((c) => {
        if (c.showCount === true) {
          c.showCount = false;
          this.layout.update();
        }
      });
    } else {
      if (this.superposedQuarkPressed) {
        this.dropIndicator.active = true;
        this.dropIndicator.radius =
          this.hoveredChamber.quarkRadius + DROP_PADDING;
        this.dropIndicator.x = this.hoveredChamber.x;
        this.dropIndicator.y = this.hoveredChamber.y;
      } else {
        if (isSuperposedOverHovered) {
          this.dropIndicator.active = false;
          // Collapse the quark into the selected chamber
          const turnEvent = new CustomEvent("takeTurn", {
            detail: { playerOrder: this.hoveredChamber.order },
          });
          window.dispatchEvent(turnEvent);
        } else {
          if (this.hoveredChamber.showCount === false) {
            this.hoveredChamber.showCount = true;
            this.layout.update();
          }
        }
      }
    }
  }

  handleMouseMove(event: MouseEvent) {
    if (this.result === undefined) {
      this.mousePos = { x: event.clientX, y: event.clientY };

      if (this.superposedQuarkPressed) {
        this.superposed.x = this.mousePos.x - 25;
        this.superposed.y = this.mousePos.y - 25;
      }

      this.detectDrop();
    }
  }
}
