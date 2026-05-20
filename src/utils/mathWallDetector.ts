import type { Piece, MathWall } from '../types';
import { areAdjacent } from './boardHelpers';

interface MathWallResult {
  activeWalls: MathWall[];
  protectedGoatPositions: Set<string>; // Set of coordinates like "A1" where goats are protected
}

/**
 * Detects all active Math Walls on the board.
 * A Math Wall exists between two adjacent goats whose node numbers add up to 7 or more.
 */
export function detectMathWalls(
  pieces: Piece[],
  cellNumbers: Record<string, number>
): MathWallResult {
  const activeWalls: MathWall[] = [];
  const protectedGoatPositions = new Set<string>();

  // Filter goats that are active on the board
  const goats = pieces.filter(p => p.type === 'goat');

  // Check each pair of goats
  for (let i = 0; i < goats.length; i++) {
    for (let j = i + 1; j < goats.length; j++) {
      const g1 = goats[i];
      const g2 = goats[j];

      // Check if they are adjacent
      if (areAdjacent(g1.position, g2.position)) {
        const val1 = cellNumbers[g1.position] || 0;
        const val2 = cellNumbers[g2.position] || 0;
        const sum = val1 + val2;

        if (sum >= 7) {
          // Unique ID based on alphabetical sorting of coordinates
          const wallId = g1.position < g2.position 
            ? `${g1.position}-${g2.position}` 
            : `${g2.position}-${g1.position}`;

          // Avoid duplicates
          if (!activeWalls.some(w => w.id === wallId)) {
            activeWalls.push({
              id: wallId,
              from: g1.position,
              to: g2.position,
              sum
            });
          }

          // Mark both goats as protected
          protectedGoatPositions.add(g1.position);
          protectedGoatPositions.add(g2.position);
        }
      }
    }
  }

  return { activeWalls, protectedGoatPositions };
}
