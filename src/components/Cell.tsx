import React from 'react';
import type { Piece } from '../types';
import { Shield, Target, Swords, PlusCircle } from 'lucide-react';

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
  coordinate,
  nodeNumber,
  occupyingPiece,
  isGoatProtected,
  isSelected,
  isMoveHighlight,
  isCaptureHighlight,
  isWallHighlight,
  onCellClick,
  classroomMode,
}) => {
  const isOccupied = !!occupyingPiece;
  const isTiger = occupyingPiece?.type === 'tiger';
  const isGoat = occupyingPiece?.type === 'goat';

  // Base background and text sizes
  let bgClass = 'bg-slate-800/40 border-slate-700/60 text-slate-400';


  if (isMoveHighlight) {
    bgClass = 'bg-indigo-500/20 border-indigo-400 text-indigo-200 cursor-pointer animate-pulse ring-2 ring-indigo-400/40';
  } else if (isCaptureHighlight) {
    bgClass = 'bg-red-500/25 border-red-400 text-red-100 cursor-pointer ring-2 ring-red-500/50 animate-pulse';
  } else if (isWallHighlight) {
    bgClass = 'bg-emerald-500/20 border-emerald-400 text-emerald-100 cursor-pointer ring-2 ring-emerald-400/40 animate-pulse';
  } else if (isSelected) {
    bgClass = 'bg-indigo-600/30 border-indigo-400 text-slate-100 ring-2 ring-indigo-500';
  } else if (isOccupied) {
    bgClass = isTiger 
      ? 'bg-red-950/40 border-red-800/80 text-red-100 shadow-lg shadow-red-950/30' 
      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-100 shadow-lg shadow-emerald-950/20';
  }

  return (
    <button
      type="button"
      onClick={onCellClick}
      className={`relative w-full aspect-square rounded-2xl border-2 flex flex-col items-center justify-between p-2 md:p-3 transition-all duration-200 ${bgClass} ${
        !isOccupied && !isMoveHighlight && !isCaptureHighlight && !isWallHighlight 
          ? 'hover:bg-slate-800/70 hover:border-slate-600' 
          : ''
      }`}
      style={{ minHeight: classroomMode ? '84px' : '72px' }}
      title={`${coordinate} (Value: ${nodeNumber})`}
    >
      {/* Coordinate & Node Value header row */}
      <div className="flex justify-between items-center w-full text-[10px] md:text-xs font-semibold text-slate-400">
        <span className="tracking-wide">{coordinate}</span>
        <span className={`px-1.5 py-0.5 rounded ${
          isSelected 
            ? 'bg-indigo-500 text-white' 
            : isMoveHighlight 
              ? 'bg-indigo-400/30 text-indigo-300' 
              : isCaptureHighlight 
                ? 'bg-red-500/30 text-red-300 font-bold' 
                : isWallHighlight 
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                  : isOccupied 
                    ? isTiger ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'
                    : 'bg-slate-700/50 text-slate-350'
        }`}>
          {nodeNumber}
        </span>
      </div>

      {/* Piece label or helper icon */}
      <div className="flex-1 flex items-center justify-center w-full my-1">
        {isOccupied ? (
          <div className="flex flex-col items-center justify-center">
            {/* Bold labels */}
            <span className={`font-extrabold ${classroomMode ? 'text-3xl' : 'text-2xl md:text-3xl'} tracking-tight ${
              isTiger ? 'text-red-400 drop-shadow-[0_2px_8px_rgba(239,68,68,0.3)]' : 'text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
            }`}>
              {occupyingPiece.label}
            </span>
          </div>
        ) : (
          <div className="opacity-0 hover:opacity-10 transition-opacity">
            <span className="text-xs font-bold">{coordinate}</span>
          </div>
        )}
      </div>

      {/* Bottom status markers (Shield for protected, Swords for capture, etc.) */}
      <div className="h-4 flex items-center justify-center gap-1.5 w-full">
        {isGoat && isGoatProtected && (
          <div className="flex items-center gap-1 text-emerald-400 animate-bounce" title="Math Wall Protection Enabled">
            <Shield className="w-3.5 h-3.5 fill-emerald-400/20" />
            {!classroomMode && <span className="text-[9px] font-bold uppercase tracking-wider">Shield</span>}
          </div>
        )}

        {isCaptureHighlight && (
          <div className="flex items-center gap-0.5 text-red-400">
            <Swords className="w-3.5 h-3.5" />
            <span className="text-[9px] font-extrabold uppercase">Attack</span>
          </div>
        )}

        {isWallHighlight && (
          <div className="flex items-center gap-0.5 text-emerald-400">
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9px] font-extrabold uppercase">Wall</span>
          </div>
        )}

        {isMoveHighlight && !isCaptureHighlight && !isWallHighlight && (
          <div className="flex items-center gap-0.5 text-indigo-400">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[9px] font-semibold uppercase">Move</span>
          </div>
        )}
      </div>
    </button>
  );
};
