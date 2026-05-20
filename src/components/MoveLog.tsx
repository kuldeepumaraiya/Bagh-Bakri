import React from 'react';
import type { MoveLogEntry } from '../types';
import { Download, Trash2 } from 'lucide-react';

interface MoveLogProps {
  moveLog: MoveLogEntry[];
  onClearHistory: () => void;
  goatTeamName: string;
  tigerTeamName: string;
}

export const MoveLog: React.FC<MoveLogProps> = ({ moveLog, onClearHistory, goatTeamName, tigerTeamName }) => {
  const handleExportText = () => {
    if (!moveLog.length) return;
    let text = `STEM Bagh-Bakri Log\n===================\nGoat: ${goatTeamName} | Tiger: ${tigerTeamName}\nMoves: ${moveLog.length}\n\n`;
    moveLog.forEach(e => {
      text += `Turn ${e.turnNumber} [${e.team}] ${e.pieceMoved}: ${e.from}→${e.to}\n  ${e.calculationShown}\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `bagh-bakri-log-${moveLog.length}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleExportCSV = () => {
    if (!moveLog.length) return;
    let csv = 'Turn,Team,Piece,From,To,Calculation,Walls,Capture\n';
    moveLog.forEach(e => {
      csv += `${e.turnNumber},${e.team},${e.pieceMoved},${e.from},${e.to},"${e.calculationShown}",${e.activeMathWallsCount},${e.captureStatus}\n`;
    });
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    a.download = `bagh-bakri-log-${moveLog.length}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700">Move Log</h2>
        {moveLog.length > 0 && (
          <button onClick={onClearHistory} className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors font-medium">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="overflow-y-auto space-y-1.5 max-h-60">
        {moveLog.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No moves yet.</p>
        ) : (
          [...moveLog].reverse().map(e => {
            const isGoat = e.team === 'Goats';
            return (
              <div key={e.turnNumber} className={`p-2.5 rounded-lg border text-xs space-y-1 ${isGoat ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'}`}>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>T{e.turnNumber} · {isGoat ? '🐐' : '🐯'} {e.team}</span>
                  <span className="text-slate-400">{e.from}→{e.to}</span>
                </div>
                <p className="text-slate-500 font-mono text-[10px] leading-tight">{e.calculationShown}</p>
                {e.captureStatus === 'success' && <span className="text-[9px] font-bold text-rose-600 uppercase">Captured</span>}
                {e.mathWallStatus === 'formed' && <span className="text-[9px] font-bold text-emerald-600 uppercase">Wall formed</span>}
              </div>
            );
          })
        )}
      </div>

      {moveLog.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <button onClick={handleExportText} className="btn-secondary py-1.5 text-xs"><Download className="w-3 h-3" /> TXT</button>
          <button onClick={handleExportCSV} className="btn-secondary py-1.5 text-xs"><Download className="w-3 h-3" /> CSV</button>
        </div>
      )}
    </div>
  );
};
