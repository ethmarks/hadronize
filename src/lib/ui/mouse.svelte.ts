import type { UIChamber, UIQuark } from "./store.svelte.ts";
import { type DropIndicatorDTO } from "../components/DropIndicator.svelte";
import type { LayoutManager } from "./layout.svelte.ts";
import type { Result } from "../Hadronize.ts";
import { playSound } from "./sound.svelte.ts";

/**
 * The number of pixels that the drop indicator's radius should exceed the
 * quark radius of its chamber.
 */
const DROP_PADDING = 50;

export class MouseManager {
  superposedQuarkPressed: boolean = $state(false);
  mousePos: { x: number; y: number } = $state({ x: 0, y: 0 });
  dropIndicator: DropIndicatorDTO = $state({
    active: false,
    radius: 0,
    x: 0,
    y: 0,
  });
  isHovering: boolean = false;
  lastDraggedOverChamber: number | undefined = undefined;

  constructor(
    public chambers: UIChamber[],
    public getSuperposed: () => UIQuark,
    public layout: LayoutManager,
    public getResult: () => Result,
  ) {}

  public get superposed(): UIQuark {
    return this.getSuperposed();
  }

  collapseIntoChamber(order: number): void {
    this.dropIndicator.active = false;
    // Collapse the quark into the selected chamber
    const turnEvent = new CustomEvent("takeTurn", {
      detail: { playerOrder: order },
    });
    window.dispatchEvent(turnEvent);
  }

  markChamberAsDraggedOver(order: number): void {
    const chamber = this.chambers[order];

    this.dropIndicator.active = true;
    this.dropIndicator.radius = chamber.quarkRadius + DROP_PADDING;
    this.dropIndicator.x = chamber.x;
    this.dropIndicator.y = chamber.y;
  }

  markChamberAsHoveredOver(order: number): void {
    const chamber = this.chambers[order];

    if (chamber.hovered === false) {
      chamber.hovered = true;
      this.layout.update();
    }
  }

  clearHoverStates(): void {
    for (const chamber of this.chambers) {
      if (chamber.hovered === true) {
        chamber.hovered = false;
        this.layout.update();
        return;
      }
    }
  }

  /**
   * The chamber whose hover radius the mouse is inside of.
   */
  findHoveredChamber(): UIChamber | undefined {
    return this.chambers.find((chamber) => {
      const mouseDistance = Math.sqrt(
        Math.abs(chamber.x - this.mousePos.x) ** 2 +
          Math.abs(chamber.y - this.mousePos.y) ** 2,
      );

      return mouseDistance < chamber.hoverRadius + DROP_PADDING;
    });
  }

  /**
   * The chamber whose quark radius the superposed quark is inside of.
   */
  findDraggedOverChamber(): UIChamber | undefined {
    return this.chambers.find((chamber) => {
      const superposedDistance = Math.sqrt(
        Math.abs(chamber.x - this.superposed.x) ** 2 +
          Math.abs(chamber.y - this.superposed.y) ** 2,
      );
      return superposedDistance < chamber.quarkRadius + DROP_PADDING;
    });
  }

  handleMouseUp() {
    const chamber = this.findDraggedOverChamber();

    if (chamber) {
      this.collapseIntoChamber(chamber.order);
    } else {
      this.superposed.x = this.layout.container.x - this.layout.quarkSize / 2;
      this.superposed.y = this.layout.container.y - this.layout.quarkSize / 2;
    }
  }

  updateDropIndicator() {
    if (this.superposedQuarkPressed) {
      const draggedOverChamber = this.findDraggedOverChamber();

      if (draggedOverChamber === undefined) {
        if (this.lastDraggedOverChamber !== undefined) {
          this.lastDraggedOverChamber = undefined;

          this.dropIndicator.active = false;
        }
        return;
      }

      if (this.lastDraggedOverChamber !== draggedOverChamber.order) {
        this.lastDraggedOverChamber = draggedOverChamber.order;

        playSound("dragover.ogg", 0.5);

        this.clearHoverStates();
        this.markChamberAsDraggedOver(draggedOverChamber.order);
      }
    } else {
      const hoveredChamber = this.findHoveredChamber();

      this.clearHoverStates();

      if (hoveredChamber === undefined) {
        if (this.isHovering === true) {
          this.isHovering = false;
        }
        return;
      }

      this.isHovering = true;

      this.markChamberAsHoveredOver(hoveredChamber.order);
    }
  }

  handleMouseMove(event: MouseEvent) {
    if (this.getResult() === undefined) {
      this.mousePos = {
        x: event.clientX - this.layout.container.left,
        y: event.clientY - this.layout.container.top,
      };

      if (this.superposedQuarkPressed) {
        this.superposed.x = this.mousePos.x - this.layout.quarkSize / 2;
        this.superposed.y = this.mousePos.y - this.layout.quarkSize / 2;
      }

      this.updateDropIndicator();
    }
  }
}
