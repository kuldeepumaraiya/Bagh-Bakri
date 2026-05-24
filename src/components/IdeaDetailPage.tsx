import React from 'react';
import type { GameIdea } from '../data/ideasData';
import { 
  ArrowLeft, 
  Lightbulb, 
  BookOpen, 
  Settings, 
  Sparkles, 
  GraduationCap, 
  Code,
  CheckCircle,
  Play
} from 'lucide-react';

interface IdeaDetailPageProps {
  idea: GameIdea;
  onBack: () => void;
  onPlay: (ideaId: number) => void;
}

export const IdeaDetailPage: React.FC<IdeaDetailPageProps> = ({ idea, onBack, onPlay }) => {
  const isPlayable = idea.status === 'Playable';

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Ideas Library
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Idea {idea.id}: {idea.title}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isPlayable
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
            >
              {idea.status}
            </span>
          </div>
        </div>

        {isPlayable && (
          <button
            onClick={() => onPlay(idea.id)}
            className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Play Now
          </button>
        )}
      </div>

      {/* STEM Focus Header Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            STEM Learning Focus
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {idea.stemFocus.split(',').map((skill, index) => (
            <span
              key={index}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg"
            >
              {skill.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main content (Concept & Mechanics) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Core Concept */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">Core Concept</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {idea.coreConcept}
            </p>
          </div>

          {/* Gameplay Mechanics */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-800">Core Gameplay Mechanics</h3>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed space-y-2 whitespace-pre-line font-medium">
              {idea.coreMechanics}
            </div>
          </div>

          {/* Future Implementation Notes */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Code className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-800">Future Implementation Notes</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed italic">
              {idea.futureImplementationNotes}
            </p>
          </div>
          
        </div>

        {/* Right sidebar content (Version presets, fun, suitability) */}
        <div className="space-y-6">
          
          {/* Version Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Settings className="w-5 h-5 text-slate-600" />
              <h3 className="text-base font-bold text-slate-800">Version Plan</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Beginner</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{idea.beginnerVersion}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Standard</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{idea.standardVersion}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Advanced</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{idea.advancedVersion}</p>
              </div>
            </div>
          </div>

          {/* Why it is Fun */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 pb-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse-gentle" />
              <h3 className="text-base font-bold text-slate-800">Why It Is Fun</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {idea.whyFun}
            </p>
          </div>

          {/* Primary School Suitability */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 pb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-800">School Suitability</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {idea.primarySchoolSuitability}
            </p>
          </div>

        </div>

      </div>

      {/* Premium Tutorial Cards at the bottom of the Idea details */}
      <div className="border-t border-slate-200 pt-8 mt-12 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span>Quick Start & Strategy Tutorial</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Learn the core concepts and strategy tips for this STEM edition</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-2xs hover:shadow-xs transition-shadow duration-200">
            <div className="text-emerald-600 text-lg font-black flex items-center gap-1.5">
              <span>📋</span>
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider">How to Play</span>
            </div>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
              <li><strong>Placement Phase:</strong> Alternate placing pieces one at a time, starting with Tigers. Board starts completely empty!</li>
              <li><strong>Standard Play:</strong> Click on your active piece to select it, then click highlighted cells to move.</li>
              <li><strong>Win Targets:</strong> Goats win by surviving or completing target shapes. Tigers win by capturing Goats.</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-2xs hover:shadow-xs transition-shadow duration-200">
            <div className="text-indigo-600 text-lg font-black flex items-center gap-1.5">
              <span>🎓</span>
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider">STEM Learning Focus</span>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-slate-600 font-bold leading-relaxed">{idea.stemFocus}</p>
              <p className="text-slate-400 font-medium leading-relaxed">Every move, capture, or defense follows strict rules designed to build computational, mathematical, and spatial reasoning skills.</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-2xs hover:shadow-xs transition-shadow duration-200">
            <div className="text-amber-600 text-lg font-black flex items-center gap-1.5">
              <span>💡</span>
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Strategy Tips</span>
            </div>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
              <li><strong>Goats:</strong> Safety lies in numbers! Stay adjacent to build protective shapes, number trails, or safe herds.</li>
              <li><strong>Tigers:</strong> Watch your targets carefully. Wait for goats to isolate themselves or fail to satisfy target arithmetic rules.</li>
              <li><strong>Guides:</strong> Toggle <strong>Move Guides</strong> ON in the toolbar if you need help finding valid moves!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onBack}
          className="btn-secondary py-2 px-6 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ideas Library
        </button>
      </div>
    </div>
  );
};
