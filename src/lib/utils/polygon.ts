/**
 * Utility to calculate the x and y coordinates of a vertex of a polygon.
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

/**
 * Utility to calculate the coordinates of a node in a grid.
 *
 * Uses 'long' and 'short' abstractions. Remember to map these to x and y
 * based on their relative sizes.
 *
 * @param order Specific node to calculate
 * @param count Number of nodes in grid
 * @param longLength Length of long axis
 * @param shortLength Length of short axis
 * @returns The long and short coordinates
 */
export function getGridPos(
  count: number,
  order: number,
  longLength: number,
  shortLength: number,
): { long: number; short: number } {
  // Validate
  if (!Number.isInteger(count) || count < 2 || count > 6)
    throw new Error("count must be an integer between 2 and 6");
  if (!Number.isInteger(order) || order < 0 || order >= count)
    throw new Error("order must be a nonnegative integer less than count");
  if (longLength < shortLength)
    throw new Error("Long axis and short axis were incorrectly mapped");

  if (count === 2) {
    const short = shortLength / 2;
    const long = order === 0 ? longLength * 0.25 : longLength * 0.75;
    return { short, long };
  }

  const rowSizes = [Math.floor(count / 2), Math.ceil(count / 2)];

  // prettier-ignore
  const [row, column] = order < rowSizes[0]
    ? [0, order]
    : [1, order - rowSizes[0]];

  const nodesInThisRow = rowSizes[row];

  const long = (column + 0.5) * (longLength / nodesInThisRow);
  const short = (row + 0.5) * (shortLength / 2);

  return { long, short };
}
