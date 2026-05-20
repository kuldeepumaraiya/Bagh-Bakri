import React from 'react';
import { Play, Sparkles, Compass, ShieldAlert, Award } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: 'ideas' | 'home') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-4 py-12 md:py-24 text-center">
      {/* Decorative Floating Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ animationDelay: '-4s' }}></div>

      {/* Main Hero Header */}
      <div className="space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-indigo-400 text-sm font-semibold shadow-inner">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>Redesigning Traditional Play for Classrooms</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-100 to-emerald-100 bg-clip-text text-transparent">
          STEM Bagh-Bakri Lab
        </h1>
        
        <p className="text-xl md:text-2xl text-indigo-200/90 font-medium tracking-wide">
          Traditional strategy games redesigned for primary STEM learning
        </p>
        
        <p className="text-base md:text-lg text-slate-350 max-w-2xl mx-auto leading-relaxed">
          Welcome to the Lab! We take cultural board games and infuse STEM concepts directly into the mechanics of movement, capture, and defense. Goats construct arithmetic <strong className="text-emerald-400 font-semibold">Math Walls</strong> to protect against powerful Tigers. No separate quiz questions—here, strategy is pure math!
        </p>
      </div>

      {/* CTA Button */}
      <div className="mt-10">
        <button
          onClick={() => onNavigate('ideas')}
          className="btn-primary text-lg px-8 py-4 group"
        >
          <span>Explore Game Ideas</span>
          <Play className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 md:mt-24 w-full">
        {/* Card 1 */}
        <div className="glass-panel glass-panel-hover p-6 text-left space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/35 flex items-center justify-center text-indigo-400">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Integrated Mechanics</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            STEM is woven into capture requirements and barrier logic. Playing is learning!
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-panel glass-panel-hover p-6 text-left space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Single Device Play</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Perfect for interactive whiteboard, laptop, or tablet. Two teams pass-and-play side-by-side.
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-panel glass-panel-hover p-6 text-left space-y-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/35 flex items-center justify-center text-violet-400">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Classroom Mode</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Dedicated team roles (STEM Calculator, Move Recorder) and rich reflection questions for students.
          </p>
        </div>
      </div>
    </div>
  );
};
