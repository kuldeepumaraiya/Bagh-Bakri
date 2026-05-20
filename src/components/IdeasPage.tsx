import React from 'react';
import { GAME_IDEAS } from '../data/ideasData';
import { GameCard } from './GameCard';
import { ArrowLeft, Compass } from 'lucide-react';

interface IdeasPageProps {
  onPlayGame: (ideaId: number) => void;
  onNavigateHome: () => void;
}

export const IdeasPage: React.FC<IdeasPageProps> = ({ onPlayGame, onNavigateHome }) => {
  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1 text-left">
          <button 
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-2 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400 shrink-0" />
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              STEM Game Ideas Library
            </h2>
          </div>
          <p className="text-slate-400 text-sm">
            Select a game card to explore the specific STEM concept and play.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAME_IDEAS.map(idea => (
          <GameCard 
            key={idea.id} 
            idea={idea} 
            onPlay={onPlayGame} 
          />
        ))}
      </div>
    </div>
  );
};
