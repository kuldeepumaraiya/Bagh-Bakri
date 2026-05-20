import React from 'react';
import type { Piece, MathWall, CellConfig } from '../types';
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
  gridCells?: Record<string, CellConfig>;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gridSize, pieces, cellNumbers, activeWalls, protectedGoatPositions,
  selectedPiece, moveHighlights, captureHighlights, wallHighlights,
  onCellClick, classroomMode, gridCells,
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

  const cells: { coordinate: string; number: number; config?: CellConfig }[] = [];
  for (let r = gridSize; r >= 1; r--) {
    for (let c = 0; c < gridSize; c++) {
      const coord = `${colLetters[c]}${r}`;
      const conf = gridCells ? gridCells[coord] : undefined;
      cells.push({
        coordinate: coord,
        number: conf ? conf.number : (cellNumbers[coord] || 1),
        config: conf,
      });
    }
  }

  // Board lines
  const lines: React.ReactNode[] = [];
  for (let r = 0; r < gridSize; r++) {
    const p1 = getCellPct(`${colLetters[0]}${r + 1}`);
    const p2 = getCellPct(`${colLetters[gridSize - 1]}${r + 1}`);
    lines.push(<line key={`h-${r}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />);
  }
  for (let c = 0; c < gridSize; c++) {
    const p1 = getCellPct(`${colLetters[c]}1`);
    const p2 = getCellPct(`${colLetters[c]}${gridSize}`);
    lines.push(<line key={`v-${c}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />);
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
    <div className="relative w-full max-w-2xl mx-auto bg-[#FAF8F5] border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
      <div className="relative w-full aspect-square bg-[#FCFAF7] border border-[#ECE6DB] rounded-xl p-2 md:p-3 shadow-inner">
        {/* SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          {lines}
          {/* Math Wall or glowing connections */}
          {activeWalls.map(wall => {
            const p1 = getCellPct(wall.from), p2 = getCellPct(wall.to);
            return (
              <g key={`w-${wall.id}`}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#34d399" strokeWidth="8" strokeLinecap="round" opacity="0.45" />
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#059669" strokeWidth="3" strokeLinecap="round" className="wall-connection" />
              </g>
            );
          })}
        </svg>

        {/* Cells Grid */}
        <div
          className="absolute inset-0 grid gap-2 md:gap-3 w-full h-full z-20 p-2 md:p-3"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {cells.map(({ coordinate, number, config }) => {
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
                cellConfig={config}
              />
            );
          })}
        </div>
      </div>

      {/* Axis labels */}
      <div className="flex justify-between mt-3 px-1 text-[11px] text-slate-400 font-bold select-none uppercase tracking-wider">
        <span>Letters A – {colLetters[gridSize - 1]} (X-Axis)</span>
        <span>Rows 1 – {gridSize} (Y-Axis)</span>
      </div>
    </div>
  );
};
