import React, { useState } from 'react';
import { BookOpen, Shield, Swords, HelpCircle } from 'lucide-react';

interface RulesPanelProps {
  onClose?: () => void;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'math' | 'setup'>('basics');

  return (
    <div className="glass-panel p-5 bg-slate-800/95 border-slate-700 h-full flex flex-col space-y-4">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-100">Bagh-Bakri STEM Rules</h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white font-bold text-sm px-2.5 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Navigation tabs inside Rules */}
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 text-xs font-bold">
        {(['basics', 'math', 'setup'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'basics' ? 'How to Play' : tab === 'math' ? 'STEM Math' : 'Variant Preset'}
          </button>
        ))}
      </div>

      {/* Rules Content */}
      <div className="flex-1 overflow-y-auto text-sm space-y-4 pr-1 leading-relaxed text-slate-300">
        {activeTab === 'basics' && (
          <div className="space-y-4">
            {/* Movement */}
            <div className="space-y-1">
              <strong className="text-slate-200 block text-xs uppercase tracking-wide font-bold">1. Turns & Movement</strong>
              <p className="text-xs">
                Goats always move first. Turns alternate between Goat Team and Tiger Team.
              </p>
              <p className="text-xs">
                On your turn, you can select <strong className="text-indigo-300 font-semibold">one piece</strong> and move it to any adjacent empty cell (horizontal, vertical, or diagonal).
              </p>
            </div>

            {/* Capturing */}
            <div className="space-y-2.5 bg-red-950/20 border border-red-900/30 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-red-400">
                <Swords className="w-4 h-4" />
                <strong className="text-slate-200 text-xs uppercase font-bold">2. Tiger Captures</strong>
              </div>
              <p className="text-xs">
                Tigers do not jump. Instead, they capture an adjacent Goat by moving <strong className="text-red-300">directly onto the goat's cell</strong>.
              </p>
              <p className="text-xs">
                Capture is allowed only if:
                <span className="block font-bold text-slate-100 bg-red-950/50 p-1.5 rounded mt-1.5 text-center">
                  Tiger Cell Number + Goat Cell Number ≥ 6
                </span>
              </p>
            </div>

            {/* Math Walls */}
            <div className="space-y-2.5 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-4 h-4 animate-pulse" />
                <strong className="text-slate-200 text-xs uppercase font-bold">3. Goat Math Walls</strong>
              </div>
              <p className="text-xs">
                Two adjacent Goats form a defensive <strong className="text-emerald-400 font-semibold">Math Wall</strong> if:
                <span className="block font-bold text-slate-100 bg-emerald-950/50 p-1.5 rounded mt-1.5 text-center">
                  Goat 1 Number + Goat 2 Number ≥ 7
                </span>
              </p>
              <p className="text-xs">
                Goats in a Math Wall are <strong className="text-emerald-400">protected</strong> from standard captures!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'math' && (
          <div className="space-y-4">
            <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-wide">The Mathematics of Bagh-Bakri</h3>

            {/* Math Wall Formulas */}
            <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400 text-xs block">Goat Math Wall Formula</span>
              <p className="text-xs leading-normal">
                Goats must find adjacent cells where:
                <span className="block font-mono font-bold text-emerald-400 text-center py-1 mt-1 text-sm bg-slate-950/40 rounded">
                  G1 + G2 ≥ 7
                </span>
                Goats inside a Math Wall show a <strong className="text-emerald-300">Shield Icon</strong> and block normal capture attempts.
              </p>
            </div>

            {/* Wall Break Formula */}
            <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-red-400 text-xs block">Tiger Wall-Break Formula</span>
              <p className="text-xs leading-normal">
                Tigers are powerful! They can bypass a Math Wall and capture a protected Goat if:
                <span className="block font-mono font-bold text-red-400 text-center py-1 mt-1 text-sm bg-slate-950/40 rounded">
                  Tiger + Protected Goat ≥ 8
                </span>
                If the sum is 7 or less, the capture is blocked by the wall!
              </p>
            </div>

            {/* STEM Tip */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/35 rounded-xl text-xs space-y-1">
              <span className="font-bold text-indigo-400 block">Classroom Learning Tip:</span>
              <p className="italic text-slate-350">
                Notice which cells on the board have high values (4 or 5). Positioning goats on high values makes it easy to form Math Walls, but positioning tigers on high values makes them extremely deadly!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="space-y-3.5 text-xs">
            <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-wide">Game Presets Info</h3>

            {/* Beginner */}
            <div className="border-b border-slate-800 pb-2.5">
              <strong className="text-slate-200 block">Beginner (5x5 Board)</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                Tigers: 1 | Goats: 4<br />
                Goat Goal: Survive 8 turns OR make 3 Math Walls.<br />
                Tiger Goal: Capture 2 Goats.
              </p>
            </div>

            {/* Standard */}
            <div className="border-b border-slate-800 pb-2.5">
              <strong className="text-slate-200 block">Standard (6x6 Board)</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                Tigers: 2 | Goats: 8<br />
                Goat Goal: Survive 12 turns OR make 4 Math Walls.<br />
                Tiger Goal: Capture 4 Goats.
              </p>
            </div>

            {/* Advanced */}
            <div className="pb-1">
              <strong className="text-slate-200 block">Advanced (7x7 Board)</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                Tigers: 3 | Goats: 12<br />
                Goat Goal: Survive 15 turns OR make 5 Math Walls.<br />
                Tiger Goal: Capture 5 Goats.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-700/80 pt-3 text-[10px] text-slate-450 text-center flex items-center justify-center gap-1">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Pass the device to take turns</span>
      </div>
    </div>
  );
};
