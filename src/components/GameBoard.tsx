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
  gridSize, pieces, cellNumbers, activeWalls, protectedGoatPositions,
  selectedPiece, moveHighlights, captureHighlights, wallHighlights,
  onCellClick, classroomMode,
}) => {
  const getPieceAt = (coordinate: string) => pieces.find(p => p.position === coordinate);

  const getCellPct = (coord: string) => {
    const { col, row } = coordToColRow(coord);
    return {
      x: `${((col + 0.5) / gridSize) * 100}%`,
      y: `${((gridSize - 1 - row + 0.5) / gridSize) * 100}%`,
    };
  };

  const colLetters = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));

  const cells: { coordinate: string; number: number }[] = [];
  for (let r = gridSize; r >= 1; r--) {
    for (let c = 0; c < gridSize; c++) {
      const coord = `${colLetters[c]}${r}`;
      cells.push({ coordinate: coord, number: cellNumbers[coord] || 1 });
    }
  }

  // Board lines
  const lines: React.ReactNode[] = [];
  for (let r = 0; r < gridSize; r++) {
    const p1 = getCellPct(`${colLetters[0]}${r + 1}`);
    const p2 = getCellPct(`${colLetters[gridSize - 1]}${r + 1}`);
    lines.push(<line key={`h-${r}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />);
  }
  for (let c = 0; c < gridSize; c++) {
    const p1 = getCellPct(`${colLetters[c]}1`);
    const p2 = getCellPct(`${colLetters[c]}${gridSize}`);
    lines.push(<line key={`v-${c}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />);
  }
  const d1p1 = getCellPct(`${colLetters[0]}1`), d1p2 = getCellPct(`${colLetters[gridSize-1]}${gridSize}`);
  const d2p1 = getCellPct(`${colLetters[0]}${gridSize}`), d2p2 = getCellPct(`${colLetters[gridSize-1]}1`);
  lines.push(
    <line key="d1" x1={d1p1.x} y1={d1p1.y} x2={d1p2.x} y2={d1p2.y} stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />,
    <line key="d2" x1={d2p1.x} y1={d2p1.y} x2={d2p2.x} y2={d2p2.y} stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
  );

  if (gridSize === 5) {
    [['A3','C5'],['A3','C1'],['C5','E3'],['C1','E3']].forEach(([f,t], i) => {
      const p1 = getCellPct(f), p2 = getCellPct(t);
      lines.push(<line key={`sd-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />);
    });
  }

  return (
    <div className="relative w-full max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-3 md:p-4">
      <div className="relative w-full aspect-square">
        {/* SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          {lines}
          {/* Math Wall glow connections */}
          {activeWalls.map(wall => {
            const p1 = getCellPct(wall.from), p2 = getCellPct(wall.to);
            return (
              <g key={`w-${wall.id}`}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" className="wall-connection" />
              </g>
            );
          })}
        </svg>

        {/* Cells */}
        <div
          className="absolute inset-0 grid gap-1.5 md:gap-2 w-full h-full z-20"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {cells.map(({ coordinate, number }) => {
            const piece = getPieceAt(coordinate);
            return (
              <Cell
                key={coordinate}
                coordinate={coordinate}
                nodeNumber={number}
                occupyingPiece={piece}
                isGoatProtected={piece?.type === 'goat' && protectedGoatPositions.has(coordinate)}
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

      {/* Axis labels */}
      <div className="flex justify-between mt-2 px-1 text-[10px] text-slate-300 font-medium">
        <span>A – {colLetters[gridSize - 1]}</span>
        <span>Rows 1 – {gridSize}</span>
      </div>
    </div>
  );
};
