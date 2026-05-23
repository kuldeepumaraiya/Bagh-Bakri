import React from 'react';
import type { Piece, MathWall, CellConfig, GameVersion } from '../types';
import { Cell } from './Cell';
import { coordToColRow } from '../utils/boardHelpers';

// STEM Logic Imports
import { detectNumberTrails } from '../utils/numberTrailLogic';
import { detectPatterns } from '../utils/patternTrailLogic';
import { detectGeometryWalls } from '../utils/geometryWallLogic';
import { findConnectedPaths } from '../utils/buildBoardLogic';

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
  ideaId?: number;
  version?: GameVersion;
  extraState?: any;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gridSize, pieces, cellNumbers, activeWalls, protectedGoatPositions,
  selectedPiece, moveHighlights, captureHighlights, wallHighlights,
  onCellClick, classroomMode, gridCells,
  ideaId, version, extraState,
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

  // Helper: check satisfies logic rule (Idea 9)
  const checkSatisfiesLogicRule = (coord: string, val: number) => {
    if (ideaId !== 9 || !extraState || !extraState.activeRuleId) return false;
    const ruleId = extraState.activeRuleId;
    if (ruleId === 'even-path') return val % 2 === 0;
    if (ruleId === 'odd-path') return val % 2 !== 0;
    if (ruleId === 'prime-path') return val === 2 || val === 3 || val === 5;
    if (ruleId === 'multiple-check') return val === 2 || val === 3 || val === 4;
    
    if (selectedPiece) {
      const from = selectedPiece.position;
      const fromVal = cellNumbers[from] || 1;
      if (ruleId === 'greater-move') return val > fromVal;
      if (ruleId === 'smaller-move') return val < fromVal;
      if (ruleId === 'pattern-rule') return (val % 2) !== (fromVal % 2);
    }
    return false;
  };

  // Helper: calculate pre-flight energy cost (Idea 4)
  const getEnergyCostForCell = (coord: string) => {
    if (ideaId !== 4 || !selectedPiece) return null;
    const isMove = moveHighlights.includes(coord);
    const isCap = captureHighlights.includes(coord);
    if (!isMove && !isCap) return null;

    const f = coordToColRow(selectedPiece.position);
    const t = coordToColRow(coord);
    const isDiagonal = Math.abs(f.col - t.col) > 0 && Math.abs(f.row - t.row) > 0;
    let baseCost = isDiagonal ? 2 : 1;

    if (version === 'advanced') {
      const dest = gridCells ? gridCells[coord] : undefined;
      if (dest?.habitat === 'water') {
        baseCost += 1;
      }
    }

    if (isCap && selectedPiece.type === 'tiger') {
      const target = pieces.find(p => p.position === coord);
      const isShielded = target?.hasShield;
      return isShielded ? 5 : 3;
    }

    return baseCost;
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-[#FAF8F5] border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
      <div className="relative w-full aspect-square bg-[#FCFAF7] border border-[#ECE6DB] rounded-xl p-2 md:p-3 shadow-inner">
        {/* SVG lines and Glowing Overlays */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          {lines}

          {/* Idea 1: Standard/Math Walls */}
          {ideaId === 1 && activeWalls.map(wall => {
            const p1 = getCellPct(wall.from), p2 = getCellPct(wall.to);
            return (
              <g key={`w-${wall.id}`}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#34d399" strokeWidth="8" strokeLinecap="round" opacity="0.45" />
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#059669" strokeWidth="3" strokeLinecap="round" className="wall-connection" />
              </g>
            );
          })}

          {/* Idea 2: Number Trail (Purple) */}
          {ideaId === 2 && (() => {
            const { completedTrails } = detectNumberTrails(pieces, cellNumbers, version || 'standard');
            return completedTrails.map((trail, index) => (
              <g key={`trail-${index}`} className="opacity-90">
                {trail.map((coord, i) => {
                  if (i === 0) return null;
                  const p1 = getCellPct(trail[i - 1]);
                  const p2 = getCellPct(coord);
                  return (
                    <g key={`trail-line-${i}`}>
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#c084fc" strokeWidth="8" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                    </g>
                  );
                })}
              </g>
            ));
          })()}

          {/* Idea 3: Pattern Trail (Cyan/Blue) */}
          {ideaId === 3 && (() => {
            const { completedRoutes } = detectPatterns(pieces, gridCells || {}, version || 'standard');
            return completedRoutes.map((trail, index) => (
              <g key={`pattern-trail-${index}`} className="opacity-90">
                {trail.map((coord, i) => {
                  if (i === 0) return null;
                  const p1 = getCellPct(trail[i - 1]);
                  const p2 = getCellPct(coord);
                  return (
                    <g key={`pattern-line-${i}`}>
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                    </g>
                  );
                })}
              </g>
            ));
          })()}

          {/* Idea 5: Geometry Wall (Green polygons/symmetry axes) */}
          {ideaId === 5 && (() => {
            const { activeWalls: geomWalls } = detectGeometryWalls(pieces, version || 'standard');
            return geomWalls.map((wall, index) => {
              if (wall.type === 'line') {
                const sorted = [...wall.coords].sort();
                const p1 = getCellPct(sorted[0]);
                const p2 = getCellPct(sorted[sorted.length - 1]);
                return (
                  <g key={`geom-line-${index}`}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#34d399" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                  </g>
                );
              }
              if (wall.type === 'triangle' || wall.type === 'square') {
                const points = wall.coords.map(c => {
                  const pct = getCellPct(c);
                  return {
                    coord: c,
                    xVal: parseFloat(pct.x),
                    yVal: parseFloat(pct.y),
                    xStr: pct.x,
                    yStr: pct.y
                  };
                });
                const cx = points.reduce((sum, p) => sum + p.xVal, 0) / points.length;
                const cy = points.reduce((sum, p) => sum + p.yVal, 0) / points.length;
                points.sort((a, b) => Math.atan2(a.yVal - cy, a.xVal - cx) - Math.atan2(b.yVal - cy, b.xVal - cx));
                const pointsStr = points.map(p => `${p.xStr},${p.yStr}`).join(' ');

                return (
                  <g key={`geom-poly-${index}`}>
                    <polygon points={pointsStr} fill="#34d399" fillOpacity="0.25" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" className="animate-pulse" />
                    {wall.weakPoints.map(wp => {
                      const p = getCellPct(wp);
                      return (
                        <circle key={`weak-${wp}`} cx={p.x} cy={p.y} r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                      );
                    })}
                  </g>
                );
              }
              if (wall.type === 'symmetry') {
                const p1 = getCellPct(wall.coords[0]);
                const p2 = getCellPct(wall.coords[1]);
                return (
                  <g key={`geom-symm-${index}`}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#a855f7" strokeWidth="3" strokeDasharray="6,4" opacity="0.8" />
                    <circle cx="50%" cy="50%" r="8" fill="#a855f7" fillOpacity="0.4" className="animate-ping" />
                    <circle cx="50%" cy="50%" r="5" fill="#c084fc" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                );
              }
              return null;
            });
          })()}

          {/* Idea 10: Build-a-Board Gold Paths */}
          {ideaId === 10 && (() => {
            const routes = findConnectedPaths(gridCells || {}, gridSize, pieces);
            return routes.map((route, index) => {
              return route.path.map((coord, i) => {
                if (i === 0) return null;
                const p1 = getCellPct(route.path[i - 1]);
                const p2 = getCellPct(coord);
                return (
                  <g key={`route-${index}-line-${i}`}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fbbf24" strokeWidth="12" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
                  </g>
                );
              });
            });
          })()}
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
                satisfiesLogicRule={checkSatisfiesLogicRule(coordinate, number)}
                energyCost={getEnergyCostForCell(coordinate)}
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
