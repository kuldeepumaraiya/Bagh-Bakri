import React from 'react';
import type { MoveLogEntry } from '../types';
import { Download, Scroll, Trash2 } from 'lucide-react';

interface MoveLogProps {
  moveLog: MoveLogEntry[];
  onClearHistory: () => void;
  goatTeamName: string;
  tigerTeamName: string;
}

export const MoveLog: React.FC<MoveLogProps> = ({
  moveLog,
  onClearHistory,
  goatTeamName,
  tigerTeamName,
}) => {
  
  // Format entry as Text for download
  const handleExportText = () => {
    if (moveLog.length === 0) return;
    
    let text = `STEM Bagh-Bakri Lab Match History Log\n`;
    text += `=========================================\n`;
    text += `Goat Team: ${goatTeamName}\n`;
    text += `Tiger Team: ${tigerTeamName}\n`;
    text += `Total Moves Recorded: ${moveLog.length}\n`;
    text += `=========================================\n\n`;

    moveLog.forEach(entry => {
      text += `Turn ${entry.turnNumber}: [${entry.team}] Piece ${entry.pieceMoved} moved from ${entry.from} to ${entry.to}\n`;
      text += `  - Calc: ${entry.calculationShown}\n`;
      text += `  - Active Math Walls: ${entry.activeMathWallsCount}\n`;
      text += `  - Capture Status: ${entry.captureStatus.toUpperCase()}\n`;
      text += `  - Wall Action: ${entry.mathWallStatus.toUpperCase()}\n`;
      text += `-----------------------------------------\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bagh-Bakri-Log-Turn-${moveLog.length}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format entry as CSV for download
  const handleExportCSV = () => {
    if (moveLog.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Turn Number,Team,Piece,From,To,Calculation,Active Math Walls,Capture Status,Math Wall Status\n";

    moveLog.forEach(entry => {
      // Escape commas in calculations
      const escapedCalc = `"${entry.calculationShown.replace(/"/g, '""')}"`;
      const row = `${entry.turnNumber},${entry.team},${entry.pieceMoved},${entry.from},${entry.to},${escapedCalc},${entry.activeMathWallsCount},${entry.captureStatus},${entry.mathWallStatus}\n`;
      csvContent += row;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bagh-Bakri-Log-Turn-${moveLog.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-5 bg-slate-800/90 border-slate-700 h-full flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-100">Move History Log</h2>
        </div>
        {moveLog.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 bg-red-950/20 px-2.5 py-1 rounded border border-red-900/30 transition-all hover:bg-red-950/40 active:scale-95"
            title="Clear game match history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Logs Scroll container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px]">
        {moveLog.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-center">
            <span className="text-xs text-slate-500 italic">No moves recorded yet.<br />Make your first move to start logging.</span>
          </div>
        ) : (
          [...moveLog].reverse().map(entry => {
            const isGoatMove = entry.team === 'Goats';
            return (
              <div 
                key={entry.turnNumber} 
                className={`p-3 rounded-xl border text-xs leading-normal space-y-1.5 transition-all ${
                  isGoatMove 
                    ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-100' 
                    : 'bg-red-950/20 border-red-900/30 text-red-100'
                }`}
              >
                {/* Entry Header */}
                <div className="flex justify-between items-center font-bold">
                  <span>Turn {entry.turnNumber}: {entry.pieceMoved} ({entry.team})</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                    isGoatMove ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {entry.from} → {entry.to}
                  </span>
                </div>

                {/* Calculation Detail */}
                <div className="font-mono bg-slate-950/40 p-1.5 rounded text-[11px] text-slate-300 flex items-center justify-between">
                  <span>{entry.calculationShown}</span>
                  {entry.captureStatus === 'success' && (
                    <span className="text-red-400 font-extrabold text-[9px] uppercase px-1 rounded bg-red-950/60">Capture</span>
                  )}
                  {entry.mathWallStatus === 'formed' && (
                    <span className="text-emerald-400 font-extrabold text-[9px] uppercase px-1 rounded bg-emerald-950/60">Wall Formed</span>
                  )}
                </div>

                {/* Additional metrics */}
                <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                  <span>Active Walls: {entry.activeMathWallsCount}</span>
                  {entry.captureStatus === 'blocked' && <span className="text-amber-400 font-bold uppercase">Capture Blocked</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Export actions at bottom */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-700/60">
        <button
          onClick={handleExportText}
          disabled={moveLog.length === 0}
          className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-800/40 disabled:border-slate-850"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export TXT</span>
        </button>
        <button
          onClick={handleExportCSV}
          disabled={moveLog.length === 0}
          className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-800/40 disabled:border-slate-850"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
};
