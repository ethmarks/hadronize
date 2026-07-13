import {
  getGridPos,
  getVertexDistance,
  getVertexPos,
} from "../utils/polygon.ts";
import type { ChamberLayoutMode, GlobalLayoutMode } from "./layout.svelte.ts";
import type { QuarkMap } from "./store.svelte.ts";

export interface InputChamber {
  order: number;
  hovered: boolean;
  quarkMap: QuarkMap;
}

/**
 * Output type
 */
export interface LayoutPlan {
  layoutMode: GlobalLayoutMode;
  quarkSize: number;
  chambers: ChamberPlan[];
}

// Intentionally not exported. This is for internal use only.
interface ChamberPlan extends InputChamber {
  x: number;
  y: number;
  quarkRadius: number;
  layoutMode: ChamberLayoutMode;
}

interface Container {
  width: number;
  height: number;
}

/**
 * Main function
 */
export function computeLayoutPlan(
  inputChambers: InputChamber[],
  container: Container,
  quarkPadding: number,
  preferredQuarkSize: number,
  preferredQuarkRadius: number,
  preferredChamberRingRadius: number,
): LayoutPlan {
  let globalLayoutMode: GlobalLayoutMode = "ring";

  const chamberPlans: ChamberPlan[] = inputChambers.map((inputChamber) =>
    makeChamberPlan(inputChamber, preferredQuarkRadius),
  );

  let quarkSize = preferredQuarkSize;
  let chamberRingRadius = preferredChamberRingRadius;

  chamberPlans.forEach((chamber) => {
    placeChamber(
      chamber,
      chamberPlans.length,
      globalLayoutMode,
      container,
      chamberRingRadius,
    );
    smartSetQuarkRadius(chamber, quarkSize, quarkPadding);
  });

  const plan: LayoutPlan = {
    chambers: chamberPlans,
    layoutMode: globalLayoutMode,
    quarkSize,
  };

  return plan;
}

function smartSetQuarkRadius(
  chamber: ChamberPlan,
  quarkSize: number,
  padding: number,
) {
  if (quarksOverlap(chamber, quarkSize, padding)) {
    chamber.quarkRadius = minQuarkRadius(chamber, quarkSize, padding);
  }
}

function makeChamberPlan(
  input: InputChamber,
  preferredQuarkRadius: number,
): ChamberPlan {
  return {
    ...input,
    x: 0,
    y: 0,
    quarkRadius: preferredQuarkRadius,
    layoutMode: "full",
  };
}

/** The number of sides with the full layout type */
function getFullSides(chamber: ChamberPlan): number {
  const flatIndicies: number[] = Object.values(chamber.quarkMap).flat();
  const sides = flatIndicies.length;
  return sides;
}

/** The number of sides with the count layout type */
function getCountSides(chamber: ChamberPlan): number {
  // Explicit version
  //
  // const nonEmptyByFlavor = Object.entries(chamber.quarkMap).filter(
  //   ([_, indices]) => indices.length > 0,
  // ) as [Flavor | "hadron", number[]][];
  // const hasHadrons = nonEmptyByFlavor.some(
  //   ([flavor, _]) => flavor === "hadron",
  // );
  // const sides = hasHadrons
  //   ? nonEmptyByFlavor.length - 1
  //   : nonEmptyByFlavor.length;

  // Slightly optimized version
  const sides = Object.entries(chamber.quarkMap).filter(
    ([flavor, indices]) => indices.length > 0 && flavor !== "hadron",
  ).length;

  return sides;
}

function getSides(chamber: ChamberPlan) {
  return chamber.layoutMode === "count"
    ? getCountSides(chamber)
    : getFullSides(chamber);
}

function quarksOverlap(
  chamber: ChamberPlan,
  quarkSize: number,
  padding: number,
): boolean {
  const sides = getSides(chamber);

  // Can't overlap if there's only 1
  if (sides <= 1) return false;

  const currentSpacing = getVertexDistance(sides, chamber.quarkRadius);

  const minSpacing = quarkSize + padding;

  return currentSpacing < minSpacing;
}

function minQuarkRadius(
  chamber: ChamberPlan,
  quarkSize: number,
  padding: number,
): number {
  const sides = getSides(chamber);

  // The check in quarksOverlap() should have already guarenteed that was
  // greater than 1, but we check again just in case.
  if (sides <= 1)
    throw new Error("cannot get minimum quark radius with fewer than 1 sides");

  // Spacing per 1 pixel of radius
  const spacingPerPixel = getVertexDistance(sides, 1);

  const minRadius = (quarkSize + padding) / spacingPerPixel;

  return minRadius;
}

function getPosInChamberRing(
  count: number,
  order: number,
  radius: number,
  container: Container,
): { x: number; y: number } {
  const containerCenterX = container.width / 2;
  const containerCenterY = container.height / 2;

  return getVertexPos(
    containerCenterX,
    containerCenterY,
    count,
    order,
    radius,
    -0.25,
  );
}

function getPosInChamberGrid(
  count: number,
  order: number,
  container: Container,
): { x: number; y: number } {
  const longLength = Math.max(container.width, container.height);
  const shortLength = Math.min(container.width, container.height);

  const { long, short } = getGridPos(count, order, longLength, shortLength);

  if (container.width > container.height) {
    return { x: long, y: short };
  } else {
    return { x: short, y: long };
  }
}

function getChamberPos(
  chamber: ChamberPlan,
  count: number,
  layoutMode: GlobalLayoutMode,
  container: Container,
  chamberRingRadius?: number,
): { x: number; y: number } {
  const order = chamber.order;

  if (layoutMode === "ring") {
    if (typeof chamberRingRadius === "undefined") {
      throw new Error(
        "Must provide a chamber ring radius if using ring layout mode",
      );
    }

    return getPosInChamberRing(count, order, chamberRingRadius, container);
  }

  if (layoutMode === "grid") {
    return getPosInChamberGrid(count, order, container);
  }

  // I just wanted to put the getPosInChamberGrid call in an explicit
  // `layoutMode === "grid"` block, and also make it extensible in case I add
  // more global layout modes later.
  //
  // But now to sate TS, I have to add this asinine check.
  throw new Error(
    "layout mode somehow isn't ring or grid. This should be unreachable.",
  );
}

function placeChamber(
  chamber: ChamberPlan,
  count: number,
  layoutMode: GlobalLayoutMode,
  container: Container,
  chamberRingRadius?: number,
) {
  const pos = getChamberPos(
    chamber,
    count,
    layoutMode,
    container,
    chamberRingRadius,
  );

  chamber.x = pos.x;
  chamber.y = pos.y;
}
