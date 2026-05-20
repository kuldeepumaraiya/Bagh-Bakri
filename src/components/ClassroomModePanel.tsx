import React from 'react';
import type { GameLogicEngine } from '../utils/gameLogicRegistry';

interface ClassroomModePanelProps {
  currentPlayer: 'goat' | 'tiger';
  hasSelectedPiece: boolean;
  goatTeamName: string;
  tigerTeamName: string;
  turnNumber: number;
  logicEngine: GameLogicEngine;
}

export const ClassroomModePanel: React.FC<ClassroomModePanelProps> = ({
  currentPlayer, hasSelectedPiece, goatTeamName, tigerTeamName, turnNumber, logicEngine,
}) => {
  const isGoat = currentPlayer === 'goat';

  const task = isGoat
    ? (!hasSelectedPiece ? `🐐 ${goatTeamName}: Select a Goat to move.` : `🐐 ${goatTeamName}: Choose an adjacent cell.`)
    : (!hasSelectedPiece ? `🐯 ${tigerTeamName}: Select a Tiger to move.` : `🐯 ${tigerTeamName}: Move or capture an adjacent Goat.`);

  // Get dynamic classroom config from the logic engine
  const classroomConfig = logicEngine.getClassroomModeConfig
    ? logicEngine.getClassroomModeConfig(turnNumber)
    : {
        prompts: [
          'What is the best move for this piece?',
          'Is this move allowed? Check the rules.',
          'How does this move help the team?',
          'What should the other team watch out for?',
        ],
        roles: [
          { role: 'Rule Checker', desc: 'Verify adjacency and move legality.' },
          { role: 'STEM Calculator', desc: 'Apply the game\'s math or logic.' },
          { role: 'Move Recorder', desc: 'Watch the log.' },
          { role: 'Strategy Explainer', desc: 'Justify the move.' },
        ],
      };

  const { prompts, roles } = classroomConfig;
  const currentPrompt = prompts[turnNumber % prompts.length];

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700">Classroom Mode</h2>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wide">Active</span>
      </div>

      {/* Current task */}
      <div className={`rounded-lg border p-3 ${isGoat ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Task</p>
        <p className="text-sm font-bold text-slate-800 leading-snug">{task}</p>
      </div>

      {/* Roles */}
      <div className="grid grid-cols-2 gap-2">
        {roles.map(r => (
          <div key={r.role} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-600">{r.role}</p>
            <p className="text-[10px] text-slate-400">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Discussion prompt */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Discussion Prompt</p>
        <p className="text-xs text-slate-600 italic">"{currentPrompt}"</p>
      </div>
    </div>
  );
};
