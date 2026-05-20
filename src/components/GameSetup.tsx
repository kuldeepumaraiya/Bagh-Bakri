import React, { useState } from 'react';
import type { GameVersion, PlayerFormat, GameSetupConfig } from '../types';
import { VERSION_PRESETS } from '../data/gameConfig';
import { GAME_IDEAS } from '../data/ideasData';
import { ArrowLeft, Play } from 'lucide-react';

interface GameSetupProps {
  ideaId: number;
  onBack: () => void;
  onStartGame: (config: GameSetupConfig) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ ideaId, onBack, onStartGame }) => {
  const [version, setVersion] = useState<GameVersion>('standard');
  const [format, setFormat] = useState<PlayerFormat>('2-players');
  const [goatTeamName, setGoatTeamName] = useState('Goat Team');
  const [tigerTeamName, setTigerTeamName] = useState('Tiger Team');

  const selectedPreset = VERSION_PRESETS[version];
  const activeIdea = GAME_IDEAS.find(i => i.id === ideaId) || GAME_IDEAS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      ideaId,
      version,
      format,
      goatTeamName: goatTeamName.trim() || 'Goat Team',
      tigerTeamName: tigerTeamName.trim() || 'Tiger Team',
    });
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Back */}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Game Ideas
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Setup: {activeIdea.title}</h1>
        <p className="text-slate-500 text-sm mt-1">STEM: {activeIdea.stemFocus}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Version */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">1. Board Size</label>
          <div className="grid grid-cols-3 gap-3">
            {(['beginner', 'standard', 'advanced'] as GameVersion[]).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setVersion(v)}
                className={`py-3 px-4 rounded-lg border text-sm font-semibold transition-colors ${
                  version === v
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="capitalize">{v}</div>
                <div className="text-xs font-normal mt-0.5 opacity-70">
                  {v === 'beginner' ? '5×5' : v === 'standard' ? '6×6' : '7×7'}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">{VERSION_PRESETS[version].description}</p>
        </div>

        {/* Step 2: Format */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">2. Player Format</label>
          <div className="grid grid-cols-3 gap-3">
            {(['2-players', '4-players', 'classroom'] as PlayerFormat[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`py-3 px-4 rounded-lg border text-sm font-semibold transition-colors text-left ${
                  format === f
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div>{f === '2-players' ? '2 Players' : f === '4-players' ? '4 Players' : 'Classroom'}</div>
                <div className="text-xs font-normal mt-0.5 opacity-70">
                  {f === '2-players' ? '1 vs 1' : f === '4-players' ? '2 vs 2' : 'Collaborative'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Team Names */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">3. Team Names</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">🐐 Goat Team</label>
              <input
                type="text"
                value={goatTeamName}
                onChange={e => setGoatTeamName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Goat Team"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">🐯 Tiger Team</label>
              <input
                type="text"
                value={tigerTeamName}
                onChange={e => setTigerTeamName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Tiger Team"
              />
            </div>
          </div>
        </div>

        {/* Summary + Start */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">Summary</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-slate-400">Version</span><span className="text-slate-700 font-semibold capitalize">{version}</span>
            <span className="text-slate-400">Board</span><span className="text-slate-700 font-semibold">{selectedPreset.gridSize}×{selectedPreset.gridSize}</span>
            <span className="text-slate-400">Tigers</span><span className="text-rose-600 font-semibold">{selectedPreset.tigersCount}</span>
            <span className="text-slate-400">Goats</span><span className="text-emerald-600 font-semibold">{selectedPreset.goatsCount}</span>
            <span className="text-slate-400">Format</span><span className="text-slate-700 font-semibold">{format === '2-players' ? '2 Players' : format === '4-players' ? '4 Players' : 'Classroom'}</span>
            <span className="text-slate-400">Goat win</span><span className="text-slate-600 text-xs">Survive {selectedPreset.goatSurvivalTurns} turns or {selectedPreset.goatActiveWallsRequired} walls</span>
            <span className="text-slate-400">Tiger win</span><span className="text-slate-600 text-xs">Capture {selectedPreset.tigerCapturesRequired} goats</span>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-sm">
            <Play className="w-4 h-4 fill-current" />
            <span>Start Game</span>
          </button>
        </div>
      </form>
    </div>
  );
};
