import React from 'react';

interface STEMPanelProps {
  lastCalculation: string;
  capturedCount: number;
  capturedRequired: number;
  survivalTurns: number;
  survivalRequired: number;
  activeWallsCount: number;
  activeWallsRequired: number;
  showExplanations: boolean;
}

export const STEMPanel: React.FC<STEMPanelProps> = ({
  lastCalculation, capturedCount, capturedRequired,
  survivalTurns, survivalRequired, activeWallsCount, activeWallsRequired, showExplanations,
}) => {
  const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  );

  return (
    <div className="glass-panel p-4 space-y-4">
      <h2 className="text-sm font-bold text-slate-700">STEM Hub</h2>

      {/* Last equation */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Equation</p>
        <p className="font-mono text-sm font-bold text-slate-800 leading-snug break-words">
          {lastCalculation || '—'}
        </p>
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-rose-600">🐯 Tiger captures</span>
            <span className="text-slate-500">{capturedCount}/{capturedRequired}</span>
          </div>
          <Bar value={capturedCount} max={capturedRequired} color="bg-rose-500" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-600">🐐 Goat turns</span>
            <span className="text-slate-500">{survivalTurns}/{survivalRequired}</span>
          </div>
          <Bar value={survivalTurns} max={survivalRequired} color="bg-emerald-500" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-amber-600">✦ Math Walls</span>
            <span className="text-slate-500">{activeWallsCount}/{activeWallsRequired}</span>
          </div>
          <Bar value={activeWallsCount} max={activeWallsRequired} color="bg-amber-400" />
        </div>
      </div>

      {showExplanations && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">How STEM works here</p>
          <ul className="space-y-1.5 text-xs text-slate-500 leading-relaxed list-disc pl-4">
            <li><strong className="text-slate-600">Addition</strong>: Sum cell values to check captures (≥ 6) and walls (≥ 7).</li>
            <li><strong className="text-slate-600">Inequalities</strong>: Compare sums to thresholds to decide outcomes.</li>
            <li><strong className="text-slate-600">Spatial logic</strong>: Connect adjacent nodes to form defensive shapes.</li>
            <li><strong className="text-slate-600">Strategy</strong>: Goats maximise walls; Tigers try to break them.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
