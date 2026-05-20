import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { IdeasPage } from './components/IdeasPage';
import { GameSetup } from './components/GameSetup';
import { MathWallGame } from './components/MathWallGame';
import type { GameSetupConfig } from './types';
import { Brain, Compass } from 'lucide-react';


type PageState = 'home' | 'ideas' | 'setup' | 'game';

function App() {
  const [page, setPage] = useState<PageState>('home');
  const [gameConfig, setGameConfig] = useState<GameSetupConfig | null>(null);

  const handleStartGame = (config: GameSetupConfig) => {
    setGameConfig(config);
    setPage('game');
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen">
      {/* 1. Universal Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/85 px-6 py-4 flex items-center justify-between shadow-md">
        {/* Left: Logo */}
        <div 
          onClick={() => setPage('home')}
          className="flex items-center gap-2.5 cursor-pointer group active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 duration-200">
            <Brain className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <span className="font-black text-slate-100 tracking-tight text-lg block leading-none">
              STEM Bagh-Bakri
            </span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mt-0.5">
              LAB EDITION
            </span>
          </div>
        </div>

        {/* Right: Main Navigation Actions */}
        <nav className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-bold">
          <button
            onClick={() => setPage('home')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              page === 'home' 
                ? 'bg-slate-800 text-indigo-400 border border-slate-700/80 shadow-inner' 
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setPage('ideas')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              page === 'ideas' || page === 'setup' || page === 'game'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700/80 shadow-inner' 
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Game Library</span>
          </button>
        </nav>
      </header>

      {/* 2. Main Page Render viewport */}
      <main className="flex-1 w-full flex flex-col relative">
        {page === 'home' && (
          <HomePage onNavigate={setPage} />
        )}
        
        {page === 'ideas' && (
          <IdeasPage 
            onNavigateHome={() => setPage('home')} 
            onPlayGame={(id) => {
              if (id === 1) {
                setPage('setup');
              }
            }} 
          />
        )}

        {page === 'setup' && (
          <GameSetup 
            onBack={() => setPage('ideas')} 
            onStartGame={handleStartGame} 
          />
        )}

        {page === 'game' && gameConfig && (
          <MathWallGame 
            config={gameConfig} 
            onChangeSetup={() => setPage('setup')} 
          />
        )}
      </main>

      {/* 3. Universal Classroom Resources Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-8 px-6 text-center text-xs text-slate-500 space-y-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand details */}
          <div className="text-left space-y-1">
            <span className="font-bold text-slate-400 block">STEM Bagh-Bakri Lab</span>
            <p className="text-[11px] text-slate-500">
              Integrating cultural board games with mathematics, spatial logic, and strategic collaboration.
            </p>
          </div>

          {/* Core STEM Badging */}
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider text-[9px]">
              Addition
            </span>
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider text-[9px]">
              Inequalities
            </span>
            <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold uppercase tracking-wider text-[9px]">
              Spatial Logic
            </span>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-4 text-[11px] text-slate-500">
          © {new Date().getFullYear()} STEM Bagh-Bakri Lab. Built for primary strategy education and classroom teamwork. No cookies, no trackers. 100% run in-browser.
        </div>
      </footer>
    </div>
  );
}

export default App;
