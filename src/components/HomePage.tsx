import React from 'react';
import { Play } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: 'ideas' | 'home') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-6 py-20 text-center space-y-10">

      {/* Hero */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
          STEM · Strategy · Classroom
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          STEM Bagh-Bakri Lab
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          Traditional strategy games redesigned for primary STEM learning. Goats build <strong className="text-slate-700">Math Walls</strong>. Tigers hunt. Every move is an equation.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => onNavigate('ideas')}
        className="btn-primary text-base px-8 py-3 group"
      >
        <span>Explore Game Ideas</span>
        <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Feature strip */}
      <div className="w-full border-t border-slate-100 pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="space-y-1.5">
          <div className="text-emerald-600 font-bold text-sm">Integrated Mechanics</div>
          <p className="text-slate-500 text-sm leading-relaxed">
            STEM is built into every capture and defense rule — no separate worksheet needed.
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="text-emerald-600 font-bold text-sm">Single Device</div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Two teams share one screen. Pass the device to take turns.
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="text-emerald-600 font-bold text-sm">Classroom Mode</div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Roles, reflection prompts, and a move log built in for structured play.
          </p>
        </div>
      </div>

    </div>
  );
};
