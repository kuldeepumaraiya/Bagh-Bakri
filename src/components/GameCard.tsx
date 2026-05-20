import React from 'react';
import type { GameIdea } from '../data/ideasData';
import { Play, Lock } from 'lucide-react';

interface GameCardProps {
  idea: GameIdea;
  onPlay: (ideaId: number) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ idea, onPlay }) => {
  const isPlayable = idea.status === 'Playable Now';

  return (
    <div className={`glass-panel p-5 flex flex-col gap-4 ${isPlayable ? '' : 'opacity-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
          {idea.tag}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
          isPlayable ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-slate-400 bg-slate-50 border border-slate-200'
        }`}>
          {idea.status}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-slate-800">{idea.id}. {idea.title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{idea.stemFocus}</p>
        <p className="text-sm text-slate-600 leading-relaxed">{idea.description}</p>
      </div>

      {isPlayable ? (
        <button
          onClick={() => onPlay(idea.id)}
          className="btn-primary w-full py-2 text-sm mt-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Play Game</span>
        </button>
      ) : (
        <button
          disabled
          className="w-full py-2 text-sm border border-slate-200 rounded-lg text-slate-400 flex items-center justify-center gap-1.5 cursor-not-allowed mt-auto"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Coming Soon</span>
        </button>
      )}
    </div>
  );
};
