import React from 'react';
import { GraduationCap, ArrowRight, MessageSquare, Clipboard } from 'lucide-react';

interface ClassroomModePanelProps {
  currentPlayer: 'goat' | 'tiger';
  hasSelectedPiece: boolean;
  goatTeamName: string;
  tigerTeamName: string;
  turnNumber: number;
}

export const ClassroomModePanel: React.FC<ClassroomModePanelProps> = ({
  currentPlayer,
  hasSelectedPiece,
  goatTeamName,
  tigerTeamName,
  turnNumber,
}) => {
  const isGoatTurn = currentPlayer === 'goat';

  // Determine active classroom task
  let currentTask = "";

  if (isGoatTurn) {
    currentTask = !hasSelectedPiece 
      ? `Goat Team (${goatTeamName}): Select a Goat to move.`
      : `Goat Team (${goatTeamName}): Choose an adjacent cell to move to.`;
  } else {
    currentTask = !hasSelectedPiece
      ? `Tiger Team (${tigerTeamName}): Select a Tiger to move.`
      : `Tiger Team (${tigerTeamName}): Select an empty cell OR an adjacent Goat to capture.`;
  }

  // Rotate discussion prompts based on turn number
  const discussionPrompts = [
    "Which Goat is protected now? Look at the green wall links!",
    "Can the Tiger break any Math Wall? Check if Tiger value + Goat value ≥ 8.",
    "Which move creates the strongest Math Wall? Try to sum to 8 or 9!",
    "Which Tiger has the best capture opportunity? Look at adjacent goats.",
    "If Goats block the Tiger completely, what is the best strategy?",
    "Does moving to a high-value cell (4 or 5) help Goats or Tigers more?"
  ];
  const activePrompt = discussionPrompts[turnNumber % discussionPrompts.length];

  return (
    <div className="glass-panel p-6 bg-indigo-950/20 border-indigo-500/35 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-500/25 pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-100">Classroom Mode Controller</h2>
        </div>
        <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/30">
          Pedagogy Active
        </span>
      </div>

      {/* 1. Giant Active Classroom Task */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border-2 border-indigo-500/30 space-y-3 shadow-inner">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
          <span>Current Classroom Task</span>
        </div>
        
        <div className="text-xl md:text-2xl font-black text-slate-100 leading-normal tracking-wide">
          {currentTask}
        </div>
      </div>

      {/* 2. Active Student Roles */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
          <Clipboard className="w-4 h-4 text-indigo-400" />
          <span>Classroom Student Roles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 text-slate-350">
            <strong className="text-indigo-300 block font-semibold">🔍 Rule Checker</strong>
            Ensure the piece moves only 1 cell adjacent.
          </div>
          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 text-slate-350">
            <strong className="text-emerald-300 block font-semibold">🧮 STEM Calculator</strong>
            Perform the sums out loud before capturing.
          </div>
          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 text-slate-350">
            <strong className="text-amber-300 block font-semibold">✍️ Move Recorder</strong>
            Ensure the sidebar match log is accurate.
          </div>
          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 text-slate-350">
            <strong className="text-violet-300 block font-semibold">📢 Strategy Explainer</strong>
            Explain *why* this is the mathematically best move.
          </div>
        </div>
      </div>

      {/* 3. Cooperative reflection prompts */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
          <MessageSquare className="w-4 h-4" />
          <span>Group Discussion Prompt</span>
        </div>
        <p className="text-slate-300 text-sm font-semibold leading-relaxed italic">
          "{activePrompt}"
        </p>
      </div>
    </div>
  );
};
