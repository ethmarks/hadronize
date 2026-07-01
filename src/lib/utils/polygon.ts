/**
 * Utility to calculate the x and y coordinates of a polygon.
 *
 * @param centerX X coord of the center of the polygon
 * @param centerY Y coord of the center of the polygon
 * @param sides Number of sides/vertices in the polygon
 * @param vertex Specific vertex to calculate, 0-indexed
 * @param radius Radius of the polygon in pixels
 * @param rotation Rotation of the polygon. Must be between 0 and 1. (default: 0)
 */
export function getVertexPos(
  centerX: number,
  centerY: number,
  sides: number,
  vertex: number,
  radius: number,
  rotation: number = 0,
): { x: number; y: number } {
  // Validate
  if (!Number.isInteger(sides) || sides < 1)
    throw new Error("sides must be a positive integer");
  if (!Number.isInteger(vertex) || vertex < 0 || vertex >= sides)
    throw new Error("vertex must be a nonnegative integer less than sides");

  const radians = rotation * Math.PI * 2;
  const angle = (2 * Math.PI * vertex) / sides + radians;

  const offsetX = radius * Math.cos(angle);
  const offsetY = radius * Math.sin(angle);

  return {
    x: centerX + offsetX,
    y: centerY + offsetY,
  };
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
