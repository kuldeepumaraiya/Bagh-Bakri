import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { IdeasPage } from './components/IdeasPage';
import { GameSetup } from './components/GameSetup';
import { MathWallGame } from './components/MathWallGame';
import type { GameSetupConfig } from './types';

type PageState = 'home' | 'ideas' | 'setup' | 'game';

function App() {
  const [page, setPage] = useState<PageState>('home');
  const [gameConfig, setGameConfig] = useState<GameSetupConfig | null>(null);

  const handleStartGame = (config: GameSetupConfig) => {
    setGameConfig(config);
    setPage('game');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-2 font-bold text-slate-800 hover:text-emerald-600 transition-colors"
        >
          <span className="text-xl">🎯</span>
          <span className="text-base font-bold tracking-tight">STEM Bagh-Bakri</span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">LAB</span>
        </button>

        <nav className="flex items-center gap-1 text-sm font-semibold">
          <button
            onClick={() => setPage('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              page === 'home' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setPage('ideas')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              page === 'ideas' || page === 'setup' || page === 'game'
                ? 'bg-slate-100 text-slate-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Game Library
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex flex-col">
        {page === 'home' && <HomePage onNavigate={setPage} />}
        {page === 'ideas' && (
          <IdeasPage
            onNavigateHome={() => setPage('home')}
            onPlayGame={(id) => { if (id === 1) setPage('setup'); }}
          />
        )}
        {page === 'setup' && (
          <GameSetup onBack={() => setPage('ideas')} onStartGame={handleStartGame} />
        )}
        {page === 'game' && gameConfig && (
          <MathWallGame config={gameConfig} onChangeSetup={() => setPage('setup')} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-6 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} STEM Bagh-Bakri Lab · Built for primary strategy education · Runs fully in-browser
        </p>
      </footer>
    </div>
  );
}

export default App;
