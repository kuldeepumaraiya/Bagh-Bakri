import React from 'react';
import type { Piece, CellConfig } from '../types';

interface CellProps {
  coordinate: string;
  nodeNumber: number;
  occupyingPiece?: Piece;
  isGoatProtected: boolean;
  isSelected: boolean;
  isMoveHighlight: boolean;
  isCaptureHighlight: boolean;
  isWallHighlight: boolean;
  onCellClick: () => void;
  classroomMode: boolean;
  cellConfig?: CellConfig;
}

const getTilePathMarkup = (tileType: string, rotation: number = 0) => {
  const strokeColor = tileType === 'bridge' ? '#f97316' : 
                      tileType === 'safe' ? '#10b981' : 
                      tileType === 'tiger-den' ? '#ef4444' : 
                      tileType === 'one-way' ? '#3b82f6' : '#cbd5e1';
  
  const strokeWidth = tileType === 'safe' ? 10 : 8;
  const rot = rotation % 4;

  if (tileType === 'straight') {
    return (rotation % 2 === 0) ? (
      <line x1="0" y1="50" x2="100" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    ) : (
      <line x1="50" y1="0" x2="50" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    );
  }

  if (tileType === 'corner') {
    let d = '';
    if (rot === 0) d = 'M 50 0 Q 50 50 100 50';
    else if (rot === 1) d = 'M 100 50 Q 50 50 50 100';
    else if (rot === 2) d = 'M 50 100 Q 50 50 0 50';
    else d = 'M 0 50 Q 50 50 50 0';
    return (
      <path d={d} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    );
  }

  if (tileType === 'one-way') {
    let arrowHead = '';
    let lineX = 50, lineY = 50;
    if (rot === 0) {
      lineX = 80; lineY = 50;
      arrowHead = 'M 75 42 L 88 50 L 75 58 Z';
    } else if (rot === 1) {
      lineX = 50; lineY = 80;
      arrowHead = 'M 42 75 L 50 88 L 58 75 Z';
    } else if (rot === 2) {
      lineX = 20; lineY = 50;
      arrowHead = 'M 25 42 L 12 50 L 25 58 Z';
    } else {
      lineX = 50; lineY = 20;
      arrowHead = 'M 42 25 L 50 12 L 58 25 Z';
    }
    return (
      <>
        <line x1="50" y1="50" x2={lineX} y2={lineY} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={arrowHead} fill={strokeColor} />
        <circle cx="50" cy="50" r="5" fill={strokeColor} />
      </>
    );
  }

  if (['crossroad', 'bridge', 'safe', 'tiger-den'].includes(tileType)) {
    return (
      <>
        <line x1="0" y1="50" x2="100" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="50" y1="0" x2="50" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="50" cy="50" r="10" fill={strokeColor} />
      </>
    );
  }

  return null;
};

export const Cell: React.FC<CellProps> = ({
  coordinate, nodeNumber, occupyingPiece, isGoatProtected,
  isSelected, isMoveHighlight, isCaptureHighlight, isWallHighlight,
  onCellClick, classroomMode, cellConfig,
}) => {
  const isTiger = occupyingPiece?.type === 'tiger';
  const isGoat  = occupyingPiece?.type === 'goat';

  // Base background determined by habitat first (if present), overridden by highlight colors
  let habitatBg = 'bg-white border-slate-200';
  let habitatLabel = '';

  if (cellConfig) {
    if (cellConfig.tileType === 'block' || cellConfig.isBlocked) {
      habitatBg = 'bg-slate-200 border-slate-400 opacity-80 cursor-not-allowed';
      habitatLabel = '🧱 BLOCK';
    } else if (cellConfig.tileType === 'bridge') {
      habitatBg = 'bg-orange-50 border-orange-300 shadow-inner';
      habitatLabel = '🌉 BRIDGE';
    } else if (cellConfig.tileType === 'safe') {
      habitatBg = 'bg-emerald-50 border-emerald-300';
      habitatLabel = '🛡️ SAFE';
    } else if (cellConfig.tileType === 'tiger-den') {
      habitatBg = 'bg-rose-50 border-rose-300';
      habitatLabel = '🐯 DEN';
    } else if (cellConfig.tileType === 'one-way') {
      habitatBg = 'bg-sky-50 border-sky-300';
      habitatLabel = '➡️ ONE-WAY';
    } else if (cellConfig.habitat === 'water') {
      habitatBg = 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      habitatLabel = 'WATER';
    } else if (cellConfig.habitat === 'forest') {
      habitatBg = 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
      habitatLabel = 'FOREST';
    } else if (cellConfig.habitat === 'hill') {
      habitatBg = 'bg-amber-50 border-amber-200 hover:bg-amber-100';
      habitatLabel = 'HILL';
    } else if (cellConfig.habitat === 'dry land') {
      habitatBg = 'bg-yellow-50 border-yellow-200';
      habitatLabel = 'DRY';
    } else if (cellConfig.habitat === 'corner') {
      habitatBg = 'bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/70';
      habitatLabel = 'CORNER';
    } else if (cellConfig.habitat === 'edge') {
      habitatBg = 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70';
      habitatLabel = 'EDGE';
    } else if (cellConfig.habitat === 'center') {
      habitatBg = 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70';
      habitatLabel = 'CENTER';
    }
  }

  let bg = `${habitatBg} hover:bg-slate-50 hover:border-slate-300`;
  if (isMoveHighlight)         bg = 'bg-sky-100 border-sky-400 shadow-md scale-[1.02]';
  else if (isCaptureHighlight) bg = 'bg-rose-100 border-rose-500 shadow-md scale-[1.02] animate-pulse';
  else if (isWallHighlight)    bg = 'bg-emerald-100 border-emerald-400 shadow-md scale-[1.02]';
  else if (isSelected)         bg = 'bg-amber-100 border-amber-500 ring-2 ring-amber-300 scale-[1.02]';
  else if (isTiger)            bg = 'bg-rose-50 border-rose-300 shadow-sm';
  else if (isGoat)             bg = 'bg-emerald-50 border-emerald-300 shadow-sm';

  // Number/Symbol colour
  let numColor = 'text-slate-400';
  if (isMoveHighlight)         numColor = 'text-sky-600';
  else if (isCaptureHighlight) numColor = 'text-rose-600';
  else if (isWallHighlight)    numColor = 'text-emerald-700';
  else if (isSelected)         numColor = 'text-amber-600';

  const emoji = isTiger ? '🐯' : isGoat ? '🐐' : null;
  const emojiAnim = isTiger ? 'animate-bounce-gentle' : 'animate-pulse-gentle';
  const emojiSize = classroomMode ? 'text-4xl' : 'text-3xl';

  // Pattern symbols for Idea 3
  const renderSymbol = () => {
    if (!cellConfig?.symbol) return null;
    const syms = {
      circle: '◯',
      triangle: '△',
      square: '⬜',
      star: '⭐',
    };
    return (
      <span className="text-xs font-bold text-slate-300 pointer-events-none select-none">
        {syms[cellConfig.symbol]}
      </span>
    );
  };

  return (
    <button
      type="button"
      onClick={onCellClick}
      disabled={cellConfig?.isBlocked && !isMoveHighlight}
      className={`relative w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all duration-200 ${bg}`}
      style={{ minHeight: classroomMode ? '90px' : '70px' }}
      title={`${coordinate} · Value: ${nodeNumber} ${habitatLabel ? `· Terrain: ${habitatLabel}` : ''}`}
    >
      {/* Visual Path overlay for Build-a-Board (Idea 10) */}
      {cellConfig?.tileType && cellConfig.tileType !== 'block' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 p-1" viewBox="0 0 100 100">
          {getTilePathMarkup(cellConfig.tileType, cellConfig.rotation || 0)}
        </svg>
      )}

      {/* Coordinate — bottom-left */}
      <span className="absolute bottom-1 left-1.5 text-[8px] font-bold text-slate-400 select-none leading-none z-10">
        {coordinate}
      </span>

      {/* Badges on top corner */}
      {habitatLabel && !isMoveHighlight && !isCaptureHighlight && (
        <span className="absolute top-1 left-1 text-[7px] font-extrabold text-slate-500 select-none leading-none px-1 rounded-sm bg-white/70 border border-slate-200 z-10">
          {habitatLabel}
        </span>
      )}

      {isWallHighlight && !isCaptureHighlight && (
        <span className="absolute top-1 right-1 text-[7px] font-extrabold text-white uppercase leading-none select-none bg-emerald-500 px-1 py-0.5 rounded shadow-sm z-20">
          wall
        </span>
      )}
      {isCaptureHighlight && (
        <span className="absolute top-1 right-1 text-[7px] font-extrabold text-white uppercase leading-none select-none bg-rose-500 px-1 py-0.5 rounded shadow-sm z-20 animate-bounce">
          CAP
        </span>
      )}

      {/* Protected shield for goat */}
      {isGoat && isGoatProtected && (
        <span className="absolute top-0.5 left-0.5 text-base leading-none select-none pointer-events-none drop-shadow-md z-30" title="Protected!">
          🛡️
        </span>
      )}

      {/* Grass count display for Idea 7 */}
      {cellConfig?.grassCount !== undefined && cellConfig.grassCount > 0 && !emoji && (
        <span className="absolute bottom-1 right-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 flex items-center gap-0.5 select-none z-10">
          🌿 {cellConfig.grassCount}
        </span>
      )}

      {/* Main content: Piece emoji or node number/pattern symbol */}
      {emoji ? (
        <div className="flex flex-col items-center justify-center relative z-10">
          <span className={`${emojiSize} ${emojiAnim} select-none pointer-events-none drop-shadow`} role="img">
            {emoji}
          </span>
          {/* Piece label / coordinates */}
          <span className="text-[9px] font-black text-slate-800 bg-white/95 px-1 py-0.5 rounded shadow-xs border border-slate-100 leading-none select-none">
            {occupyingPiece?.label}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center select-none z-10">
          {renderSymbol()}
          <span className={`text-xl font-black leading-none ${numColor}`}>
            {nodeNumber}
          </span>
        </div>
      )}

      {/* Extra piece metrics: Energy (Idea 4), Hunger & Thirsty (Idea 7) */}
      {emoji && occupyingPiece && (
        <div className="absolute top-1 right-1 flex flex-col gap-0.5 items-end z-20">
          {occupyingPiece.energy !== undefined && (
            <span className="text-[8px] font-extrabold text-sky-700 bg-sky-50 px-0.5 rounded leading-none border border-sky-100">
              ⚡{occupyingPiece.energy}
            </span>
          )}
          {occupyingPiece.hunger !== undefined && (
            <span className="text-[8px] font-extrabold text-orange-700 bg-orange-50 px-0.5 rounded leading-none border border-orange-100">
              🍗{occupyingPiece.hunger}
            </span>
          )}
          {occupyingPiece.thirsty && (
            <span className="text-[8px] font-extrabold text-blue-700 bg-blue-50 px-0.5 rounded leading-none border border-blue-100 animate-pulse flex items-center gap-0.5">
              💧 Thirsty
            </span>
          )}
        </div>
      )}
    </button>
  );
};
