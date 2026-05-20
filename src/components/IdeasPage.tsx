import React from 'react';
import { GAME_IDEAS } from '../data/ideasData';
import { GameCard } from './GameCard';
import { ArrowLeft } from 'lucide-react';

interface IdeasPageProps {
  onPlayGame: (ideaId: number) => void;
  onNavigateHome: () => void;
}

export const IdeasPage: React.FC<IdeasPageProps> = ({ onPlayGame, onNavigateHome }) => {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900">Game Ideas Library</h1>
        <p className="text-slate-500 text-sm">Select a game to explore the STEM concept and play.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAME_IDEAS.map(idea => (
          <GameCard key={idea.id} idea={idea} onPlay={onPlayGame} />
        ))}
      </div>
    </div>
  );
};
