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

  // Fit each chamber's quarks.
  //
  // If the quarks are so close together that they overlap (plus their
  // padding), we calculate the minimum radius that would give the quarks, then
  // apply that radius.
  //
  // If the quarks aren't overlapping, we leave the radius alone.
  chamberPlans.forEach((chamber) => {
    smartSetQuarkRadius(chamber, quarkSize, preferredQuarkRadius, quarkPadding);
  });

  // Shrink all chambers that are overlapping with each other or are offscreen.
  shrinkOffendingChambers(
    chamberPlans,
    quarkSize,
    container,
    chamberRingRadius,
    preferredQuarkRadius,
    quarkPadding,
    globalLayoutMode,
  );

  // Set global layout mode.
  //
  // If some chambers are _still_ overlapping, it means that we've set every
  // chamber to are overlapping with each other or are offscreen, we switch the
  // layout to a grid.
  if (anyChambersOverlap(chamberPlans, quarkSize, container)) {
    globalLayoutMode = "grid";

    // We know that the chambers won't fit in full mode if we're using the ring
    // layout mode, but now that we're resigned to using the grid layout, some
    // of them might fit in full mode.
    chamberPlans.forEach((chamber) => {
      chamber.layoutMode = chamber.hovered ? "count" : "full";
    });
    shrinkOffendingChambers(
      chamberPlans,
      quarkSize,
      container,
      chamberRingRadius,
      preferredQuarkRadius,
      quarkPadding,
      globalLayoutMode,
    );
  }

  // Collect final layout into a plan and return it
  const plan: LayoutPlan = {
    chambers: chamberPlans,
    layoutMode: globalLayoutMode,
    quarkSize,
  };
  return plan;
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
    layoutMode: input.hovered ? "count" : "full",
  };
}

// ===================================
// Quark radius stuff
// ===================================

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
  quarkPadding: number,
): boolean {
  const sides = getSides(chamber);

  // Can't overlap if there's only 1
  if (sides <= 1) return false;

  const currentSpacing = getVertexDistance(sides, chamber.quarkRadius);

  const minSpacing = quarkSize + quarkPadding;

  return currentSpacing < minSpacing;
}

function minQuarkRadius(
  chamber: ChamberPlan,
  quarkSize: number,
  quarkPadding: number,
): number {
  const sides = getSides(chamber);

  // The check in quarksOverlap() should have already guarenteed that was
  // greater than 1, but we check again just in case.
  if (sides <= 1)
    throw new Error("cannot get minimum quark radius with fewer than 1 sides");

  // Spacing per 1 pixel of radius
  const spacingPerPixel = getVertexDistance(sides, 1);

  const minRadius = (quarkSize + quarkPadding) / spacingPerPixel;

  return minRadius;
}

function smartSetQuarkRadius(
  chamber: ChamberPlan,
  quarkSize: number,
  preferredQuarkRadius: number,
  quarkPadding: number,
) {
  const isOverlapping = quarksOverlap(chamber, quarkSize, quarkPadding);
  chamber.quarkRadius = isOverlapping
    ? minQuarkRadius(chamber, quarkSize, quarkPadding)
    : preferredQuarkRadius;
}

// ===================================
// Chamber placement stuff
// ===================================

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

function placeAllChambers(
  chamberPlans: ChamberPlan[],
  layoutMode: GlobalLayoutMode,
  container: Container,
  chamberRingRadius?: number,
) {
  chamberPlans.forEach((chamber) => {
    const pos = getChamberPos(
      chamber,
      chamberPlans.length,
      layoutMode,
      container,
      chamberRingRadius,
    );

    chamber.x = pos.x;
    chamber.y = pos.y;
  });
}

function theseChambersOverlap(
  chamber1: ChamberPlan,
  chamber2: ChamberPlan,
  quarkSize: number,
  quarkPadding: number = 20,
): boolean {
  const radius1 = chamber1.quarkRadius + quarkSize / 2 + quarkPadding;
  const radius2 = chamber2.quarkRadius + quarkSize / 2 + quarkPadding;

  const distanceX = chamber2.x - chamber1.x;
  const distanceY = chamber2.y - chamber1.y;

  const distanceSquared = distanceX ** 2 + distanceY ** 2;
  const radiusSumSquared = (radius1 + radius2) ** 2;

  return distanceSquared < radiusSumSquared;
}

function thisChamberIsOffscreen(
  chamber: ChamberPlan,
  quarkSize: number,
  container: Container,
): boolean {
  const radius = chamber.quarkRadius + quarkSize / 2;

  return (
    chamber.x - radius < 0 ||
    chamber.x + radius > container.width ||
    chamber.y - radius < 0 ||
    chamber.y + radius > container.height
  );
}

/**
 * Checks if any chambers overlap with each other or with the edge of the
 * screen. Does *not* check if quarks overlap.
 */
function anyChambersOverlap(
  chambers: ChamberPlan[],
  quarkSize: number,
  container: Container,
): boolean {
  for (let index1 = 0; index1 < chambers.length; index1++) {
    const chamber1 = chambers[index1];

    if (thisChamberIsOffscreen(chamber1, quarkSize, container)) return true;

    for (let index2 = index1 + 1; index2 < chambers.length; index2++) {
      const chamber2 = chambers[index2];

      if (theseChambersOverlap(chamber1, chamber2, quarkSize)) return true;
    }
  }
  return false;
}

/**
 * If any chambers are overlapping with each other or are offscreen, we switch
 * the largest one (which is probably the offender) and check again until
 * either all the chambers fit or all chambers are set to count mode.
 */
function shrinkOffendingChambers(
  chambers: ChamberPlan[],
  quarkSize: number,
  container: Container,
  chamberRingRadius: number,
  preferredQuarkRadius: number,
  quarkPadding: number,
  globalLayoutMode: GlobalLayoutMode,
) {
  const fullChambers = chambers.filter(
    (chamber) => chamber.layoutMode === "full",
  );

  placeAllChambers(chambers, globalLayoutMode, container, chamberRingRadius);

  while (
    anyChambersOverlap(chambers, quarkSize, container) &&
    fullChambers.length > 0
  ) {
    // Sort from most quarks to fewest
    fullChambers.sort((a, b) => getSides(b) - getSides(a));

    const offender = fullChambers.shift();

    if (offender === undefined) {
      throw new Error(
        "shift() somehow returned undefined even though the block only runs if the array has a nonzero length. I think maybe the array methods are broken?",
      );
    }

    offender.layoutMode = "count";
    smartSetQuarkRadius(
      offender,
      quarkSize,
      preferredQuarkRadius,
      quarkPadding,
    );
    placeAllChambers(chambers, globalLayoutMode, container, chamberRingRadius);
  }
}
