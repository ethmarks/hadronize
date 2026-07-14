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
  preferredQuarkSize: number,
  preferredChamberRingRadius: number,
): LayoutPlan {
  // The reason that we can't always just use solveLayout directly is that it's
  // vulnerable to layout thrashing if the user hovers over a large chamber
  // while the game is in grid mode.

  const inputHoveredChamber = inputChambers.find((chamber) => chamber.hovered);

  // If nothing is hovered, we can just use solveLayout directly and do an
  // early return.
  if (inputHoveredChamber === undefined) {
    return solveLayout(
      inputChambers,
      container,
      preferredQuarkSize,
      preferredChamberRingRadius,
    );
  }

  const stableInputChambers = inputChambers.map((chamber) => ({
    ...chamber,
    hovered: false,
  }));

  const plan = solveLayout(
    stableInputChambers,
    container,
    preferredQuarkSize,
    preferredChamberRingRadius,
  );

  const hoveredChamber = plan.chambers[inputHoveredChamber.order];

  if (hoveredChamber.order !== inputHoveredChamber.order)
    throw new Error(
      "the indices of plan chambers doesn't line up with the chamber orders. Something is seriously wrong.",
    );

  hoveredChamber.hovered = true;
  hoveredChamber.layoutMode = "count";

  // The ONLY function that directly uses a chamber's layout mode is getSides.
  //
  // And the only functions that use getSides are:
  //
  // 1. the quark radius functions
  // 2. smartSetChamberLayout()
  //
  // We are intentionally not running smartSetChamberLayout() because we want
  // the layout mode to be 'count' no matter what. So the only thing the we need
  // to recalculate is the quark radius.
  smartSetQuarkRadius(hoveredChamber, plan.quarkSize);

  return plan;
}

function solveLayout(
  inputChambers: InputChamber[],
  container: Container,
  preferredQuarkSize: number,
  preferredChamberRingRadius: number,
): LayoutPlan {
  let globalLayoutMode: GlobalLayoutMode = "ring";

  let quarkSize = preferredQuarkSize;
  let chamberRingRadius = preferredChamberRingRadius;

  const chambers: ChamberPlan[] = inputChambers.map((inputChamber) =>
    makeChamberPlan(inputChamber, quarkSize),
  );

  //
  // Pipeline step 1: basic stuff that's done unconditionally.
  //
  // As far as we know, everything is ideal. We're using the preferred quark
  // size, all non-hovered chambers are full, and we're using the ring layout
  // with the preferred ring radius.
  //
  // We set the quarkRadius, x position, and y position of each chamber, all of
  // which are things that we need to do regardless even if everything really
  // is ideal.
  //
  // This might compromise quark radius.
  //

  // Fit each chamber's quarks.
  //
  // If the quarks are so close together that they overlap (plus their
  // padding), we calculate the minimum radius that would give the quarks, then
  // apply that radius.
  //
  // If the quarks aren't overlapping, we leave the radius alone.
  chambers.forEach((chamber) => {
    smartSetQuarkRadius(chamber, quarkSize);
  });

  // Set x and y positions
  placeAllChambers(chambers, globalLayoutMode, container, chamberRingRadius);

  // Return early if chambers aren't overlapping
  if (!anyChambersOverlap(chambers, quarkSize, container)) {
    return {
      chambers: chambers,
      layoutMode: globalLayoutMode,
      quarkSize,
    };
  }

  //
  // Pipeline step 2: adjusting the chamber ring radius.
  //
  // We know that some of the chambers are overlapping. To fix it, we'll need
  // to compromise one of our preferred values, and the least-disruptive one
  // available to us is the chamber ring radius.
  //
  // This might compromise chamber ring radius.
  //

  chamberRingRadius = smartGetChamberRingRadius(
    chambers,
    quarkSize,
    container,
    chamberRingRadius,
    globalLayoutMode,
  );

  if (!anyChambersOverlap(chambers, quarkSize, container)) {
    return {
      chambers: chambers,
      layoutMode: globalLayoutMode,
      quarkSize,
    };
  }

  //
  // Pipeline step 3: setting chambers to count mode.
  //
  // Chambers are still overlapping, and just moving them further apart isn't
  // cutting it. Clearly there are just too many quarks. The next
  // least-disruptive compromise is the chamber layout mode.
  //
  // This will compromise chamber layout, but it might recover quark radius and
  // chamber ring radius.
  //

  smartSetChamberLayout(
    chambers,
    quarkSize,
    container,
    chamberRingRadius,
    globalLayoutMode,
  );

  if (!anyChambersOverlap(chambers, quarkSize, container)) {
    return {
      chambers: chambers,
      layoutMode: globalLayoutMode,
      quarkSize,
    };
  }

  //
  // Pipeline step 4: switching to grid layout.
  //
  // Even with every chamber in count mode, there's still not enough room, and
  // chambers are still overlapping. We're kind of running out of tricks, so
  // the least-disruptive thing we can do is completely rearrange the chambers
  // from a ring into a grid.
  //
  // This will compromise global layout, but it might let us recover chamber
  // layout, quark radius, and chamber ring radius.

  globalLayoutMode = "grid";

  chambers.forEach((chamber) => {
    chamber.layoutMode = chamber.hovered ? "count" : "full";
    smartSetQuarkRadius(chamber, quarkSize);
  });
  smartSetChamberLayout(
    chambers,
    quarkSize,
    container,
    chamberRingRadius,
    globalLayoutMode,
  );

  if (!anyChambersOverlap(chambers, quarkSize, container)) {
    return {
      chambers: chambers,
      layoutMode: globalLayoutMode,
      quarkSize,
    };
  }

  //
  // Pipeline step 5: decreasing quark size.
  //
  // We only have one trick left, and it's a disruptive one. We'll try
  // decreasing the quark size.
  //
  // Each iteration, we decrement the quark size by 2 pixels. We start with
  // preferred values for everything, and if it doesn't work then we work
  // through the previous 4 steps. If it still doesn't work, we try
  // decrementing by another 2 pixels. We continue this until either there's no
  // overlap or we reach the minimum quark size.
  //

  const minimumQuarkSize = getMinimumQuarkSize();

  while (
    anyChambersOverlap(chambers, quarkSize, container) &&
    quarkSize > minimumQuarkSize
  ) {
    quarkSize -= 2;

    globalLayoutMode = "ring";

    chambers.forEach((chamber) => {
      chamber.layoutMode = chamber.hovered ? "count" : "full";
      smartSetQuarkRadius(chamber, quarkSize);
    });
    smartSetChamberLayout(
      chambers,
      quarkSize,
      container,
      chamberRingRadius,
      globalLayoutMode,
    );

    if (!anyChambersOverlap(chambers, quarkSize, container)) {
      break;
    }

    globalLayoutMode = "grid";

    chambers.forEach((chamber) => {
      chamber.layoutMode = chamber.hovered ? "count" : "full";
      smartSetQuarkRadius(chamber, quarkSize);
    });
    smartSetChamberLayout(
      chambers,
      quarkSize,
      container,
      chamberRingRadius,
      globalLayoutMode,
    );
  }

  return {
    chambers: chambers,
    layoutMode: globalLayoutMode,
    quarkSize,
  };
}

function getQuarkPadding(quarkSize: number): number {
  return quarkSize * 0.2;
}
function getPreferredQuarkRadius(quarkSize: number): number {
  return quarkSize * 1.2;
}
function getMaxChamberRingRadius(container: Container): number {
  return Math.min(container.width, container.height) * 0.5;
}
function getMinimumQuarkSize(): number {
  return 30;
}

function makeChamberPlan(input: InputChamber, quarkSize: number): ChamberPlan {
  return {
    ...input,
    x: 0,
    y: 0,
    quarkRadius: getPreferredQuarkRadius(quarkSize),
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

function quarksOverlap(chamber: ChamberPlan, quarkSize: number): boolean {
  const sides = getSides(chamber);

  // Can't overlap if there's only 1
  if (sides <= 1) return false;

  const currentSpacing = getVertexDistance(sides, chamber.quarkRadius);

  const minSpacing = quarkSize + getQuarkPadding(quarkSize);

  return currentSpacing < minSpacing;
}

function minQuarkRadius(chamber: ChamberPlan, quarkSize: number): number {
  const sides = getSides(chamber);

  // The check in quarksOverlap() should have already guarenteed that was
  // greater than 1, but we check again just in case.
  if (sides <= 1)
    throw new Error("cannot get minimum quark radius with fewer than 1 sides");

  // Spacing per 1 pixel of radius
  const spacingPerPixel = getVertexDistance(sides, 1);

  const minRadius = (quarkSize + getQuarkPadding(quarkSize)) / spacingPerPixel;

  return minRadius;
}

function smartSetQuarkRadius(chamber: ChamberPlan, quarkSize: number) {
  const isOverlapping = quarksOverlap(chamber, quarkSize);
  chamber.quarkRadius = isOverlapping
    ? minQuarkRadius(chamber, quarkSize)
    : getPreferredQuarkRadius(quarkSize);
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

function placeAllChambers(
  chambers: ChamberPlan[],
  layoutMode: GlobalLayoutMode,
  container: Container,
  chamberRingRadius?: number,
) {
  chambers.forEach((chamber) => {
    placeChamber(
      chamber,
      chambers.length,
      layoutMode,
      container,
      chamberRingRadius,
    );
  });
}

function theseChambersOverlap(
  chamber1: ChamberPlan,
  chamber2: ChamberPlan,
  quarkSize: number,
): boolean {
  const quarkPadding = getQuarkPadding(quarkSize);
  const radius1 = chamber1.quarkRadius + quarkSize / 2 + quarkPadding;
  const radius2 = chamber2.quarkRadius + quarkSize / 2 + quarkPadding;

  const distanceX = chamber2.x - chamber1.x;
  const distanceY = chamber2.y - chamber1.y;

  const distanceSquared = distanceX ** 2 + distanceY ** 2;
  const radiusSumSquared = (radius1 + radius2) ** 2;

  return distanceSquared < radiusSumSquared;
}

function tooCloseToCenter(
  chamber: ChamberPlan,
  container: Container,
  quarkSize: number,
) {
  const quarkPadding = getQuarkPadding(quarkSize);
  const radius = chamber.quarkRadius + quarkSize / 2 + quarkPadding;

  // center gets double padding
  const minDistanceFromCenter = quarkSize / 2 + quarkPadding * 2;

  const distanceX = chamber.x - container.width / 2;
  const distanceY = chamber.y - container.height / 2;

  const distanceSquared = distanceX ** 2 + distanceY ** 2;
  const minDistanceSquared = (radius + minDistanceFromCenter) ** 2;

  return distanceSquared < minDistanceSquared;
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

    if (tooCloseToCenter(chamber1, container, quarkSize)) return true;

    for (let index2 = index1 + 1; index2 < chambers.length; index2++) {
      const chamber2 = chambers[index2];

      if (theseChambersOverlap(chamber1, chamber2, quarkSize)) return true;
    }
  }
  return false;
}

function smartGetChamberRingRadius(
  chambers: ChamberPlan[],
  quarkSize: number,
  container: Container,
  currentChamberRingRadius: number,
  globalLayoutMode: GlobalLayoutMode,
): number {
  const maxChamberRingRadius = getMaxChamberRingRadius(container);

  let tempChamberRingRadius = currentChamberRingRadius;
  while (
    anyChambersOverlap(chambers, quarkSize, container) &&
    tempChamberRingRadius < maxChamberRingRadius
  ) {
    tempChamberRingRadius += 2;
    placeAllChambers(
      chambers,
      globalLayoutMode,
      container,
      tempChamberRingRadius,
    );
  }
  return tempChamberRingRadius;
}

/**
 * If any chambers are overlapping with each other or are offscreen, we switch
 * the largest one (which is probably the offender) and check again until
 * either all the chambers fit or all chambers are set to count mode.
 *
 * Returns a new chamber ring radius.
 */
function smartSetChamberLayout(
  chambers: ChamberPlan[],
  quarkSize: number,
  container: Container,
  currentChamberRingRadius: number,
  globalLayoutMode: GlobalLayoutMode,
): number {
  const fullChambers = chambers.filter(
    (chamber) => chamber.layoutMode === "full",
  );

  let tempChamberRingRadius = currentChamberRingRadius;

  placeAllChambers(
    chambers,
    globalLayoutMode,
    container,
    tempChamberRingRadius,
  );

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
    smartSetQuarkRadius(offender, quarkSize);

    if (globalLayoutMode === "ring") {
      tempChamberRingRadius = smartGetChamberRingRadius(
        chambers,
        quarkSize,
        container,
        tempChamberRingRadius,
        globalLayoutMode,
      );
    }

    placeAllChambers(
      chambers,
      globalLayoutMode,
      container,
      tempChamberRingRadius,
    );
  }

  return tempChamberRingRadius;
}
