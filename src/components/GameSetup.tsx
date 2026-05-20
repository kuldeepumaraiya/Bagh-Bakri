import React, { useState } from 'react';
import type { GameVersion, PlayerFormat, GameSetupConfig } from '../types';
import { VERSION_PRESETS } from '../data/gameConfig';
import { ArrowLeft, Play, Settings, Users, Shield } from 'lucide-react';

interface GameSetupProps {
  onBack: () => void;
  onStartGame: (config: GameSetupConfig) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onBack, onStartGame }) => {
  const [version, setVersion] = useState<GameVersion>('standard');
  const [format, setFormat] = useState<PlayerFormat>('2-players');
  const [goatTeamName, setGoatTeamName] = useState('Goat Team');
  const [tigerTeamName, setTigerTeamName] = useState('Tiger Team');

  const selectedPreset = VERSION_PRESETS[version];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      version,
      format,
      goatTeamName: goatTeamName.trim() || 'Goat Team',
      tigerTeamName: tigerTeamName.trim() || 'Tiger Team',
    });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Top Navigation */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Game Ideas</span>
      </button>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Settings Form: Left 3 Columns */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6 glass-panel p-6 bg-slate-800/80">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3 mb-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Bagh-Bakri Setup</h2>
          </div>

          {/* 1. Game Version */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-indigo-300">
              Step 1: Choose Game Version
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['beginner', 'standard', 'advanced'] as GameVersion[]).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVersion(v)}
                  className={`px-4 py-3 rounded-xl border text-center font-bold transition-all text-sm flex flex-col justify-between h-20 ${
                    version === v
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600'
                  }`}
                >
                  <span className="capitalize">{v}</span>
                  <span className={`text-[10px] uppercase font-semibold px-1 py-0.5 rounded inline-block ${
                    version === v ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {v === 'beginner' ? '5x5 Board' : v === 'standard' ? '6x6 Board' : '7x7 Board'}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              {VERSION_PRESETS[version].description}
            </p>
          </div>

          {/* 2. Player Format */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-indigo-300">
              Step 2: Choose Player Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['2-players', '4-players', 'classroom'] as PlayerFormat[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-4 py-3 rounded-xl border text-left font-bold transition-all text-sm flex items-start gap-2.5 ${
                    format === f
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600'
                  }`}
                >
                  <Users className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="capitalize">
                      {f === '2-players' ? '2 Players' : f === '4-players' ? '4 Players' : 'Classroom Mode'}
                    </span>
                    <span className="text-[10px] text-indigo-200 font-medium">
                      {f === '2-players' ? '1 vs 1 Game' : f === '4-players' ? '2 vs 2 Teams' : 'Collaborative play'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              {format === '2-players' && 'One player controls all goats, and one player controls all tigers. Perfect for head-to-head calculations.'}
              {format === '4-players' && 'Two students form the Goat Team, two form the Tiger Team. Encourages discussion before making a move.'}
              {format === 'classroom' && 'Perfect for interactive screens. Displays roles (Rule Checker, STEM Calculator, Move Recorder, Strategy Explainer) and cooperative prompts.'}
            </p>
          </div>

          {/* 3. Team Names */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-indigo-300">
              Step 3: Enter Team Names
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Goat Team (Defenders)</label>
                <input
                  type="text"
                  value={goatTeamName}
                  onChange={e => setGoatTeamName(e.target.value)}
                  maxLength={20}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  placeholder="Goat Team"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tiger Team (Attackers)</label>
                <input
                  type="text"
                  value={tigerTeamName}
                  onChange={e => setTigerTeamName(e.target.value)}
                  maxLength={20}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  placeholder="Tiger Team"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Summary Card: Right 2 Columns */}
        <div className="lg:col-span-2 glass-panel p-6 bg-slate-850 border-indigo-500/20 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3 mb-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Setup Summary</h2>
          </div>

          <div className="space-y-4 text-sm">
            {/* Version */}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Selected Version:</span>
              <span className="font-bold text-slate-200 capitalize">{version}</span>
            </div>

            {/* Board size */}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Board Grid Size:</span>
              <span className="font-bold text-slate-200">{selectedPreset.gridSize} x {selectedPreset.gridSize}</span>
            </div>

            {/* Tigers */}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Number of Tigers:</span>
              <span className="font-bold text-red-400">{selectedPreset.tigersCount}</span>
            </div>

            {/* Goats */}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Number of Goats:</span>
              <span className="font-bold text-emerald-400">{selectedPreset.goatsCount}</span>
            </div>

            {/* Format */}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Player Format:</span>
              <span className="font-bold text-slate-250 capitalize">
                {format === '2-players' ? '2 Players' : format === '4-players' ? '4 Players' : 'Classroom Mode'}
              </span>
            </div>

            {/* Team Names */}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Goat Side:</span>
              <span className="font-bold text-emerald-300">{goatTeamName || 'Goat Team'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Tiger Side:</span>
              <span className="font-bold text-red-300">{tigerTeamName || 'Tiger Team'}</span>
            </div>

            {/* Win conditions */}
            <div className="space-y-2.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-xs font-bold text-indigo-300 block uppercase tracking-wider">Win Conditions:</span>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <span className="text-emerald-400 shrink-0 font-bold">Goats:</span>
                  <span className="text-slate-300 leading-normal">
                    Survive <strong className="text-slate-200">{selectedPreset.goatSurvivalTurns}</strong> goat turns OR build <strong className="text-slate-200">{selectedPreset.goatActiveWallsRequired}</strong> active Math Walls (sum ≥ 7).
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-red-400 shrink-0 font-bold">Tigers:</span>
                  <span className="text-slate-300 leading-normal">
                    Capture <strong className="text-slate-200">{selectedPreset.tigerCapturesRequired}</strong> goats.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 group text-base font-bold shadow-indigo-600/30"
          >
            <span>Start Game</span>
            <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
