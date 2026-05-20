import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { IdeasPage } from './components/IdeasPage';
import { GameSetup } from './components/GameSetup';
import { UniversalGameShell } from './components/UniversalGameShell';
import { IdeaDetailPage } from './components/IdeaDetailPage';
import { GAME_IDEAS } from './data/ideasData';
import type { GameSetupConfig } from './types';

type PageState = 'home' | 'ideas' | 'setup' | 'game' | 'idea-detail';

function App() {
  const [page, setPage] = useState<PageState>('home');
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
  const [gameConfig, setGameConfig] = useState<GameSetupConfig | null>(null);

  // Sync state to hash to allow deep linking and proper URL navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/ideas' || hash === '#ideas') {
        setPage('ideas');
        setSelectedIdeaId(null);
      } else if (hash.startsWith('#/ideas/')) {
        const parts = hash.replace('#/ideas/', '').split('/');
        const idStr = parts[0];
        const id = parseInt(idStr, 10);
        const subAction = parts[1]; // e.g. "setup"

        if (id >= 1 && id <= 10) {
          setSelectedIdeaId(id);
          if (subAction === 'setup') {
            setPage('setup');
          } else {
            setPage('idea-detail');
          }
        } else {
          setPage('ideas');
          setSelectedIdeaId(null);
        }
      } else if (hash === '#/setup' || hash === '#setup') {
        setPage('setup');
        setSelectedIdeaId(prev => prev || 1);
      } else if (hash === '#/game' || hash === '#game') {
        setPage('game');
      } else {
        setPage('home');
        setSelectedIdeaId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initialize on load
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newPage: PageState, ideaId?: number) => {
    const targetId = ideaId || selectedIdeaId || 1;
    if (newPage === 'home') {
      window.location.hash = '#/';
    } else if (newPage === 'ideas') {
      window.location.hash = '#/ideas';
    } else if (newPage === 'setup') {
      window.location.hash = `#/ideas/${targetId}/setup`;
    } else if (newPage === 'idea-detail') {
      window.location.hash = `#/ideas/${targetId}`;
    } else if (newPage === 'game') {
      window.location.hash = '#/game';
    }
  };

  const handleStartGame = (config: GameSetupConfig) => {
    setGameConfig(config);
    navigateTo('game');
  };

  const selectedIdea = GAME_IDEAS.find(idea => idea.id === selectedIdeaId);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 font-bold text-slate-800 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span className="text-xl">🎯</span>
          <span className="text-base font-bold tracking-tight">STEM Bagh-Bakri</span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">LAB</span>
        </button>

        <nav className="flex items-center gap-1 text-sm font-semibold">
          <button
            onClick={() => navigateTo('home')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              page === 'home' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('ideas')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              page === 'ideas' || page === 'setup' || page === 'game' || page === 'idea-detail'
                ? 'bg-slate-100 text-slate-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Game Library
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col bg-white">
        {page === 'home' && <HomePage onNavigate={(p) => navigateTo(p)} />}
        {page === 'ideas' && (
          <IdeasPage
            onNavigateHome={() => navigateTo('home')}
            onPlayGame={(ideaId) => navigateTo('setup', ideaId)}
            onViewConcept={(idea) => navigateTo('idea-detail', idea.id)}
          />
        )}
        {page === 'setup' && (
          <GameSetup ideaId={selectedIdeaId || 1} onBack={() => navigateTo('ideas')} onStartGame={handleStartGame} />
        )}
        {page === 'game' && gameConfig && (
          <UniversalGameShell config={gameConfig} onChangeSetup={() => navigateTo('setup')} />
        )}
        {page === 'idea-detail' && selectedIdea && (
          <IdeaDetailPage
            idea={selectedIdea}
            onBack={() => navigateTo('ideas')}
            onPlay={() => navigateTo('setup')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-6 text-center bg-white">
        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} STEM Bagh-Bakri Lab · Built for primary strategy education · Runs fully in-browser
        </p>
      </footer>
    </div>
  );
}

export default App;
