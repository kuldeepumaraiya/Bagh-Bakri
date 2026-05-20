import React from 'react';
import type { Piece, MathWall } from '../types';
import { Cell } from './Cell';
import { coordToColRow } from '../utils/boardHelpers';

interface GameBoardProps {
  gridSize: number;
  pieces: Piece[];
  cellNumbers: Record<string, number>;
  activeWalls: MathWall[];
  protectedGoatPositions: Set<string>;
  selectedPiece: Piece | null;
  moveHighlights: string[];
  captureHighlights: string[];
  wallHighlights: string[];
  onCellClick: (coordinate: string) => void;
  classroomMode: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gridSize,
  pieces,
  cellNumbers,
  activeWalls,
  protectedGoatPositions,
  selectedPiece,
  moveHighlights,
  captureHighlights,
  wallHighlights,
  onCellClick,
  classroomMode,
}) => {
  // Helper to map coordinate string to piece record
  const getPieceAt = (coordinate: string) => {
    return pieces.find(p => p.position === coordinate);
  };

  // Helper to generate coordinates percentage for SVG lines
  const getCellPercentCoords = (coord: string) => {
    const { col, row } = coordToColRow(coord);
    // col is 0 to gridSize-1 (left to right)
    // row is 0 to gridSize-1 (bottom to top, so visually row=gridSize-1 is at y=0)
    const x = ((col + 0.5) / gridSize) * 100;
    const y = ((gridSize - 1 - row + 0.5) / gridSize) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  // Pre-generate grid cells
  const cells: { coordinate: string; number: number }[] = [];
  const colLetters = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));

  // Rows should print top-to-bottom: from row = gridSize down to 1
  for (let r = gridSize; r >= 1; r--) {
    for (let c = 0; c < gridSize; c++) {
      const coord = `${colLetters[c]}${r}`;
      const num = cellNumbers[coord] || 1;
      cells.push({ coordinate: coord, number: num });
    }
  }

  // Generate traditional board lines:
  // We'll draw horizontal lines, vertical lines, and a few diagonal lines to represent paths.
  const boardLines: React.ReactNode[] = [];
  
  // 1. Horizontal paths
  for (let r = 0; r < gridSize; r++) {
    const leftCell = `${colLetters[0]}${r + 1}`;
    const rightCell = `${colLetters[gridSize - 1]}${r + 1}`;
    const p1 = getCellPercentCoords(leftCell);
    const p2 = getCellPercentCoords(rightCell);
    boardLines.push(
      <line key={`h-${r}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(71, 85, 105, 0.45)" strokeWidth="3" />
    );
  }

  // 2. Vertical paths
  for (let c = 0; c < gridSize; c++) {
    const bottomCell = `${colLetters[c]}1`;
    const topCell = `${colLetters[c]}${gridSize}`;
    const p1 = getCellPercentCoords(bottomCell);
    const p2 = getCellPercentCoords(topCell);
    boardLines.push(
      <line key={`v-${c}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(71, 85, 105, 0.45)" strokeWidth="3" />
    );
  }

  // 3. Diagonal paths (primary diagonals, plus sub-diagonals if appropriate)
  // Standard full-board diagonals
  const d1_p1 = getCellPercentCoords(`${colLetters[0]}1`);
  const d1_p2 = getCellPercentCoords(`${colLetters[gridSize - 1]}${gridSize}`);
  const d2_p1 = getCellPercentCoords(`${colLetters[0]}${gridSize}`);
  const d2_p2 = getCellPercentCoords(`${colLetters[gridSize - 1]}1`);

  boardLines.push(
    <line key="diag-main-1" x1={d1_p1.x} y1={d1_p1.y} x2={d1_p2.x} y2={d1_p2.y} stroke="rgba(71, 85, 105, 0.3)" strokeWidth="2" />,
    <line key="diag-main-2" x1={d2_p1.x} y1={d2_p1.y} x2={d2_p2.x} y2={d2_p2.y} stroke="rgba(71, 85, 105, 0.3)" strokeWidth="2" />
  );

  // For 5x5 board, draw inner diagonals for authentic Bagh-Bakri sub-routes
  if (gridSize === 5) {
    const subDiags = [
      { f: 'A3', t: 'C5' }, { f: 'A3', t: 'C1' },
      { f: 'C5', t: 'E3' }, { f: 'C1', t: 'E3' },
      { f: 'C5', t: 'A3' }, { f: 'C1', t: 'A3' }
    ];
    subDiags.forEach((d, idx) => {
      const p1 = getCellPercentCoords(d.f);
      const p2 = getCellPercentCoords(d.t);
      boardLines.push(
        <line key={`sub-diag-${idx}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(71, 85, 105, 0.2)" strokeWidth="1.5" />
      );
    });
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto glass-panel p-4 md:p-6 bg-slate-950/45 border-slate-800">
      {/* Decorative Board Background Glow */}
      <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl filter blur-3xl pointer-events-none"></div>

      <div className="relative w-full aspect-square">
        {/* SVG Board Lines Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* 1. Traditional Grid Paths */}
          {boardLines}

          {/* 2. Active Math Wall Glowing Connections */}
          {activeWalls.map(wall => {
            const p1 = getCellPercentCoords(wall.from);
            const p2 = getCellPercentCoords(wall.to);
            return (
              <g key={`wall-group-${wall.id}`}>
                {/* Visual shadow glow */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="rgba(16, 185, 129, 0.4)"
                  strokeWidth="8"
                  className="blur-sm"
                />
                {/* Active animated dashed line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="wall-connection"
                />
              </g>
            );
          })}
        </svg>

        {/* HTML Grid of Cells */}
        <div 
          className="absolute inset-0 grid gap-2.5 md:gap-4 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {cells.map(({ coordinate, number }) => {
            const occupyingPiece = getPieceAt(coordinate);
            const isGoatProtected = occupyingPiece?.type === 'goat' && protectedGoatPositions.has(coordinate);

            return (
              <Cell
                key={coordinate}
                coordinate={coordinate}
                nodeNumber={number}
                occupyingPiece={occupyingPiece}
                isGoatProtected={isGoatProtected}
                isSelected={selectedPiece?.position === coordinate}
                isMoveHighlight={moveHighlights.includes(coordinate)}
                isCaptureHighlight={captureHighlights.includes(coordinate)}
                isWallHighlight={wallHighlights.includes(coordinate)}
                onCellClick={() => onCellClick(coordinate)}
                classroomMode={classroomMode}
              />
            );
          })}
        </div>
      </div>

      {/* Grid Coordinates Index Labels */}
      <div className="flex justify-between items-center px-4 mt-4 text-[10px] md:text-xs font-bold text-slate-400">
        <span>Columns: A - {colLetters[gridSize - 1]}</span>
        <span>Rows: 1 - {gridSize}</span>
      </div>
    </div>
  );
};
