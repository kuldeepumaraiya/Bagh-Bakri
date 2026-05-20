import React, { useState } from 'react';
import { BookOpen, Shield, Swords } from 'lucide-react';

interface RulesPanelProps {
  onClose?: () => void;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'basics' | 'math' | 'setup'>('basics');

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-700">Rules</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
            Close
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
        {(['basics', 'math', 'setup'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'basics' ? 'How to Play' : t === 'math' ? 'STEM Math' : 'Presets'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="text-xs text-slate-600 leading-relaxed space-y-3">
        {tab === 'basics' && (
          <>
            <p><strong className="text-slate-700">Turns:</strong> Goats move first, then Tigers. Alternate each turn. Move one piece to an adjacent empty cell.</p>
            <div className="flex gap-2 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
              <Swords className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <p><strong>Tiger Capture:</strong> A Tiger captures an adjacent Goat by moving onto its cell — only if Tiger + Goat value <strong>≥ 6</strong>.</p>
            </div>
            <div className="flex gap-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p><strong>Math Wall:</strong> Two adjacent Goats whose values sum to <strong>≥ 7</strong> form a protective Math Wall. Protected Goats block normal captures.</p>
            </div>
          </>
        )}
        {tab === 'math' && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wide">Goat Math Wall</p>
              <p className="font-mono font-bold text-emerald-600">G1 + G2 ≥ 7 → Protected</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wide">Tiger Capture</p>
              <p className="font-mono font-bold text-rose-600">T + G ≥ 6 → Capture allowed</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wide">Tiger Wall-Break</p>
              <p className="font-mono font-bold text-rose-600">T + Protected G ≥ 8 → Override</p>
            </div>
            <p className="text-slate-400 italic text-[11px]">High-value cells (4–5) are strategically powerful for both sides.</p>
          </div>
        )}
        {tab === 'setup' && (
          <div className="space-y-3">
            {[
              { name: 'Beginner', board: '5×5', tigers: 1, goats: 4, survive: 8, walls: 3, capture: 2 },
              { name: 'Standard', board: '6×6', tigers: 2, goats: 8, survive: 12, walls: 4, capture: 4 },
              { name: 'Advanced', board: '7×7', tigers: 3, goats: 12, survive: 15, walls: 5, capture: 5 },
            ].map(p => (
              <div key={p.name} className="border border-slate-200 rounded-lg p-3 space-y-1">
                <p className="font-bold text-slate-700">{p.name} ({p.board})</p>
                <p className="text-slate-400 text-[11px]">🐯 {p.tigers} Tigers · 🐐 {p.goats} Goats</p>
                <p className="text-slate-400 text-[11px]">Goats: survive {p.survive} turns or {p.walls} walls</p>
                <p className="text-slate-400 text-[11px]">Tigers: capture {p.capture} goats</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-300 text-center">Pass the device between turns</p>
    </div>
  );
};
