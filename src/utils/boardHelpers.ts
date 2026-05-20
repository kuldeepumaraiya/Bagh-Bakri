export interface ColRow {
  col: number;
  row: number;
}

/**
 * Converts an algebraic coordinate string (e.g., "A1", "C3") into 0-based col and row indices.
 * "A1" corresponds to col=0, row=0 (bottom-left).
 */
export function coordToColRow(coord: string): ColRow {
  const colLetter = coord.charAt(0).toUpperCase();
  const col = colLetter.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
  const row = parseInt(coord.substring(1), 10) - 1; // '1' -> 0
  return { col, row };
}

/**
 * Converts 0-based col and row indices back into an algebraic coordinate (e.g., "A1").
 */
export function colRowToCoord(col: number, row: number): string {
  const colLetter = String.fromCharCode(65 + col);
  const rowNum = row + 1;
  return `${colLetter}${rowNum}`;
}

/**
 * Gets all adjacent coordinates (horizontal, vertical, diagonal) inside the grid boundaries.
 */
export function getNeighbors(coord: string, gridSize: number): string[] {
  const { col, row } = coordToColRow(coord);
  const neighbors: string[] = [];

  for (let dCol = -1; dCol <= 1; dCol++) {
    for (let dRow = -1; dRow <= 1; dRow++) {
      if (dCol === 0 && dRow === 0) continue; // Skip current cell

      const newCol = col + dCol;
      const newRow = row + dRow;

      if (newCol >= 0 && newCol < gridSize && newRow >= 0 && newRow < gridSize) {
        neighbors.push(colRowToCoord(newCol, newRow));
      }
    }
  }

  return neighbors;
}

/**
 * Checks if two coordinates are adjacent (horizontal, vertical, diagonal).
 */
export function areAdjacent(coord1: string, coord2: string): boolean {
  const cr1 = coordToColRow(coord1);
  const cr2 = coordToColRow(coord2);
  const dCol = Math.abs(cr1.col - cr2.col);
  const dRow = Math.abs(cr1.row - cr2.row);
  return dCol <= 1 && dRow <= 1 && !(dCol === 0 && dRow === 0);
}
