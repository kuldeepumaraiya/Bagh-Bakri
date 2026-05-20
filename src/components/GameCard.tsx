import React from 'react';
import type { GameIdea } from '../data/ideasData';
import { Play, Eye, Sparkles } from 'lucide-react';

interface GameCardProps {
  idea: GameIdea;
  onPlay: (ideaId: number) => void;
  onViewConcept: (idea: GameIdea) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ idea, onPlay, onViewConcept }) => {
  const isPlayable = idea.status === 'Playable';

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 hover:border-slate-300 transition-all duration-200">
      {/* Top tags */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
          {idea.stemFocus.split(',')[0]}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            isPlayable
              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
              : 'text-amber-700 bg-amber-50 border-amber-100 animate-pulse-gentle'
          }`}
        >
          {idea.status}
        </span>
      </div>

      {/* Title & description */}
      <div className="space-y-2 flex-1">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
          {idea.id}. {idea.title}
        </h3>
        
        {/* STEM Focus */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          STEM: {idea.stemFocus}
        </p>

        {/* Short Description */}
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {idea.shortDescription}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        {isPlayable ? (
          <div className="flex gap-2">
            <button
              onClick={() => onPlay(idea.id)}
              className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Now</span>
            </button>
            <button
              onClick={() => onViewConcept(idea)}
              className="btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-1"
              title="View Concept Details"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Concept</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onViewConcept(idea)}
            className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-1 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>View Concept</span>
          </button>
        )}
      </div>
    </div>
  );
};
