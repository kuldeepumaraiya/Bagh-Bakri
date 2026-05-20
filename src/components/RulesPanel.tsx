import React, { useState } from 'react';
import { BookOpen, Shield, Swords, Layers } from 'lucide-react';
import type { GameVersion } from '../types';
import type { GameLogicEngine } from '../utils/gameLogicRegistry';

interface RulesPanelProps {
  ideaId: number;
  version: GameVersion;
  logicEngine: GameLogicEngine;
  onClose?: () => void;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({ ideaId: _ideaId, version, logicEngine, onClose }) => {
  const [tab, setTab] = useState<'basics' | 'math' | 'setup'>('basics');

  const guide = logicEngine.getHowToPlayGuide(version);

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-700">{guide.title}</h2>
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
            {t === 'basics' ? 'How to Play' : t === 'math' ? guide.stemMathTitle : 'Presets'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="text-xs text-slate-600 leading-relaxed space-y-3">
        {tab === 'basics' && (
          <div className="space-y-2.5">
            {guide.studentGuide.map((rule, i) => (
              <div key={i} className={`flex gap-2 rounded-lg p-2.5 ${
                i === 0 ? 'bg-emerald-50 border border-emerald-100' :
                i % 3 === 1 ? 'bg-rose-50 border border-rose-100' :
                'bg-slate-50 border border-slate-100'
              }`}>
                {i === 0 ? (
                  <Swords className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : i % 3 === 1 ? (
                  <Shield className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <p>{rule}</p>
              </div>
            ))}
          </div>
        )}
        {tab === 'math' && (
          <div className="space-y-3">
            {guide.stemMathFormula.map((f, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wide">{f.label}</p>
                <p className="font-mono font-bold text-emerald-700">{f.formula}</p>
              </div>
            ))}
            <p className="text-slate-400 italic text-[11px]">Study the formulas above to master this game's strategy.</p>
          </div>
        )}
        {tab === 'setup' && (
          <div className="space-y-3">
            {guide.presets.map((p, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-0.5">
                <p className="font-bold text-slate-700">{p.name}</p>
                <p className="text-slate-500 text-[11px]">{p.info}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-300 text-center">Pass the device between turns</p>
    </div>
  );
};
