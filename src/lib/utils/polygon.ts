/**
 * Utility to calculate the x and y coordinates of a polygon.
 *
 * @param centerX X coord of the center of the polygon
 * @param centerY Y coord of the center of the polygon
 * @param sides Number of sides/vertices in the polygon
 * @param vertex Specific vertex to calculate, 0-indexed
 * @param radius Radius of the polygon in pixels
 */
export function getVertexPos(
  centerX: number,
  centerY: number,
  sides: number,
  vertex: number,
  radius: number,
): { x: number; y: number } {
  // Validate
  if (!Number.isInteger(sides) || sides < 1)
    throw new Error("sides must be a positive integer");
  if (!Number.isInteger(vertex) || vertex < 0 || vertex >= sides)
    throw new Error("vertex must be a nonnegative integer less than sides");

  if (sides === 1) {
    // The default formula yields monogons for sides=1, but we want a centered
    // point instead.
    return { x: centerX, y: centerY };
  } else {
    // x = r * cos(2 * pi * k / n)
    // y = r * sin(2 * pi * k / n)

    const offsetX = radius * Math.cos((2 * Math.PI * vertex) / sides);
    const offsetY = radius * Math.sin((2 * Math.PI * vertex) / sides);

    return {
      x: centerX + offsetX,
      y: centerY + offsetY,
    };
  }
}

/**
 * Utility to calculate the straight-line distance between adjacent vertices
 * of a polygon.
 *
 * @param sides Number of sides/vertices in the polygon
 * @param radius Radius of the polygon in pixels
 * @returns
 */
export function getVertexDistance(sides: number, radius: number): number {
  if (!Number.isInteger(sides) || sides < 2) {
    // A 1-sided polygon (point) has no distance to another vertex
    return 0;
  }
  return 2 * radius * Math.sin(Math.PI / sides);
}
