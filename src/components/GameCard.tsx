import React from 'react';
import type { GameIdea } from '../data/ideasData';
import { Play, Lock, BrainCircuit } from 'lucide-react';

interface GameCardProps {
  idea: GameIdea;
  onPlay: (ideaId: number) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ idea, onPlay }) => {
  const isPlayable = idea.status === 'Playable Now';

  return (
    <div 
      className={`glass-panel p-6 flex flex-col justify-between space-y-6 ${
        isPlayable 
          ? 'border-indigo-500/40 ring-1 ring-indigo-500/20 bg-slate-800/80 shadow-indigo-950/20' 
          : 'opacity-70 saturate-50 hover:opacity-85 hover:saturate-100 duration-500'
      } transition-all`}
    >
      <div className="space-y-4">
        {/* Tag & Status Header */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            isPlayable 
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
              : 'bg-slate-700/60 text-slate-350 border border-slate-700'
          }`}>
            {idea.tag}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isPlayable 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {idea.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-100 text-left">
          {idea.id}. {idea.title}
        </h3>

        {/* STEM Focus Display */}
        <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg p-3 border border-slate-800 text-left text-xs">
          <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300 block font-semibold">STEM Focus:</strong>
            <span className="text-slate-400 font-medium">{idea.stemFocus}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-350 text-sm text-left leading-relaxed">
          {idea.description}
        </p>
      </div>

      {/* Action Button */}
      <div>
        {isPlayable ? (
          <button
            onClick={() => onPlay(idea.id)}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 group text-sm"
          >
            <span>Play Game</span>
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-500 flex items-center justify-center gap-2 text-sm cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>Coming Soon</span>
          </button>
        )}
      </div>
    </div>
  );
};
