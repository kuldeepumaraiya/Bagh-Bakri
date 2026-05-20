import React from 'react';
import { Brain, Sparkles, AlertCircle } from 'lucide-react';

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
  lastCalculation,
  capturedCount,
  capturedRequired,
  survivalTurns,
  survivalRequired,
  activeWallsCount,
  activeWallsRequired,
  showExplanations,
}) => {
  return (
    <div className="glass-panel p-5 bg-slate-800/90 border-slate-700 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-100">STEM Calculation Hub</h2>
        </div>
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
      </div>

      {/* Live Calculation Display */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-850 p-4 text-center space-y-2">
        <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
          Last Move Equation
        </span>
        <div className="font-mono text-xl md:text-2xl font-extrabold text-indigo-200 tracking-wide drop-shadow-[0_2px_4px_rgba(99,102,241,0.2)]">
          {lastCalculation || "0 + 0 = 0 (Waiting for move)"}
        </div>
        <p className="text-[11px] text-slate-400 leading-normal max-w-sm mx-auto">
          Every capture and defense evaluates a live addition equation based on cell coordinates!
        </p>
      </div>

      {/* Metrics Progress bars */}
      <div className="space-y-4 text-xs">
        {/* 1. Tiger captures */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold">
            <span className="text-red-400">Tiger Capture Goal</span>
            <span className="text-slate-350">{capturedCount} / {capturedRequired} Goats</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(capturedCount / capturedRequired) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 2. Goat survival turns */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold">
            <span className="text-emerald-400">Goat Survival turns</span>
            <span className="text-slate-350">{survivalTurns} / {survivalRequired} Turns</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(survivalTurns / survivalRequired) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 3. Goat Active Math Walls */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold">
            <span className="text-emerald-400">Active Math Walls</span>
            <span className="text-slate-350">{activeWallsCount} / {activeWallsRequired} Walls</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((activeWallsCount / activeWallsRequired) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* STEM Detailed Explanations (Collapsible/Toggled) */}
      {showExplanations && (
        <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-xl space-y-2.5 text-xs text-slate-300 leading-normal text-left">
          <div className="flex items-center gap-1 text-indigo-400 font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>How the rules teach STEM:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-350">
            <li>
              <strong>Addition practice</strong>: Calculating totals to see if a capture (≥ 6) or math wall (≥ 7) occurs.
            </li>
            <li>
              <strong>Inequality comparison</strong>: Comparing sums against thresholds (6, 7, 8) to determine outcomes.
            </li>
            <li>
              <strong>Spatial networks</strong>: Connecting adjacent nodes to create shapes, examining grid topology.
            </li>
            <li>
              <strong>Resource optimization</strong>: Goats collaborate to maximize walls; Tigers prioritize breaking them.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
