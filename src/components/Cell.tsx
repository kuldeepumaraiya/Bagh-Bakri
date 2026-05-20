import React from 'react';
import type { Piece } from '../types';

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
}

export const Cell: React.FC<CellProps> = ({
  coordinate, nodeNumber, occupyingPiece, isGoatProtected,
  isSelected, isMoveHighlight, isCaptureHighlight, isWallHighlight,
  onCellClick, classroomMode,
}) => {
  const isTiger = occupyingPiece?.type === 'tiger';
  const isGoat  = occupyingPiece?.type === 'goat';

  // Background state
  let bg = 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300';
  if (isMoveHighlight)         bg = 'bg-sky-50 border-sky-300';
  else if (isCaptureHighlight) bg = 'bg-rose-50 border-rose-400';
  else if (isWallHighlight)    bg = 'bg-emerald-50 border-emerald-400';
  else if (isSelected)         bg = 'bg-amber-50 border-amber-400';
  else if (isTiger)            bg = 'bg-rose-50 border-rose-200';
  else if (isGoat)             bg = 'bg-emerald-50 border-emerald-200';

  // Number colour
  let numColor = 'text-slate-400';
  if (isMoveHighlight)         numColor = 'text-sky-500';
  else if (isCaptureHighlight) numColor = 'text-rose-500';
  else if (isWallHighlight)    numColor = 'text-emerald-600';
  else if (isSelected)         numColor = 'text-amber-500';

  const emoji = isTiger ? '🐯' : isGoat ? '🐐' : null;
  const emojiAnim = isTiger ? 'animate-bounce-gentle' : 'animate-pulse-gentle';
  const emojiSize = classroomMode ? 'text-3xl' : 'text-2xl';

  return (
    <button
      type="button"
      onClick={onCellClick}
      className={`relative w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-0 cursor-pointer transition-all duration-150 ${bg}`}
      style={{ minHeight: classroomMode ? '80px' : '60px' }}
      title={`${coordinate} · Value: ${nodeNumber}`}
    >
      {/* Coordinate — bottom-left, very faint */}
      <span className="absolute bottom-1 left-1.5 text-[7px] font-medium text-slate-300 leading-none select-none">
        {coordinate}
      </span>

      {/* Wall badge — top-right only, doesn't overlap coordinate */}
      {isWallHighlight && !isCaptureHighlight && (
        <span className="absolute top-1 right-1 text-[7px] font-bold text-emerald-600 uppercase leading-none select-none bg-emerald-100 px-0.5 rounded">
          wall
        </span>
      )}
      {isCaptureHighlight && (
        <span className="absolute top-1 right-1 text-[7px] font-bold text-rose-500 uppercase leading-none select-none bg-rose-100 px-0.5 rounded">
          cap
        </span>
      )}

      {/* Protected shield — top-left only when goat is protected */}
      {isGoat && isGoatProtected && (
        <span className="absolute top-0.5 left-0.5 text-base leading-none select-none pointer-events-none" title="Protected by Math Wall">
          🛡️
        </span>
      )}

      {/* Main content: emoji or node number */}
      {emoji ? (
        <span className={`${emojiSize} ${emojiAnim} select-none pointer-events-none leading-none`} role="img">
          {emoji}
        </span>
      ) : (
        <span className={`text-lg font-bold select-none leading-none ${numColor}`}>
          {nodeNumber}
        </span>
      )}

      {/* Node number — shown below emoji when occupied */}
      {emoji && (
        <span className={`text-[10px] font-semibold select-none leading-none mt-0.5 ${numColor}`}>
          {nodeNumber}
        </span>
      )}
    </button>
  );
};
