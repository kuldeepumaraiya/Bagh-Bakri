import React, { useState, useEffect } from 'react';
import type { GameSetupConfig, Piece, MoveLogEntry, GameHistorySnapshot } from '../types';
import { VERSION_PRESETS } from '../data/gameConfig';
import { GameBoard } from './GameBoard';
import { RulesPanel } from './RulesPanel';
import { MoveLog } from './MoveLog';
import { STEMPanel } from './STEMPanel';
import { ClassroomModePanel } from './ClassroomModePanel';
import { mathWallLogic } from '../utils/mathWallLogic';
import { detectMathWalls } from '../utils/mathWallDetector';
import { checkTigerCapture } from '../utils/captureChecker';
import { areAdjacent, getNeighbors } from '../utils/boardHelpers';
import { RotateCcw, ArrowLeft, Eye, EyeOff, Award } from 'lucide-react';

interface MathWallGameProps {
  config: GameSetupConfig;
  onChangeSetup: () => void;
}

export const MathWallGame: React.FC<MathWallGameProps> = ({ config, onChangeSetup }) => {
  const { version, format, goatTeamName, tigerTeamName } = config;
  const preset = VERSION_PRESETS[version];

  const [pieces, setPieces] = useState<Piece[]>([]);
  const [capturedGoatsCount, setCapturedGoatsCount] = useState(0);
  const [goatTurnsCount, setGoatTurnsCount] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<'goat' | 'tiger'>('goat');
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [lastCalculation, setLastCalculation] = useState('');
  const [winner, setWinner] = useState<'goat' | 'tiger' | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [showSTEMExplanations, setShowSTEMExplanations] = useState(true);
  const [classroomMode, setClassroomMode] = useState(format === 'classroom');
  const [history, setHistory] = useState<GameHistorySnapshot[]>([]);

  useEffect(() => { handleReset(); }, [version]);

  const { activeWalls, protectedGoatPositions } = detectMathWalls(pieces, preset.cellNumbers);

  const handleReset = () => {
    setPieces(JSON.parse(JSON.stringify(preset.startingPieces)));
    setCapturedGoatsCount(0); setGoatTurnsCount(0);
    setCurrentPlayer('goat'); setSelectedPiece(null);
    setMoveLog([]); setLastCalculation('Game started. Goats move first.');
    setWinner(null); setHistory([]);
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = [...history];
    const snap = prev.pop()!;
    setHistory(prev); setPieces(snap.pieces);
    setCapturedGoatsCount(snap.capturedGoatsCount); setGoatTurnsCount(snap.goatTurnsCount);
    setCurrentPlayer(snap.currentPlayer); setSelectedPiece(null);
    setMoveLog(snap.moveLog); setLastCalculation(snap.lastCalculation);
    setWinner(null);
  };

  const recordHistory = (currentPieces: Piece[], currentMoveLog: MoveLogEntry[]) => {
    setHistory(prev => [...prev, {
      turnNumber: currentMoveLog.length + 1, currentPlayer,
      pieces: JSON.parse(JSON.stringify(currentPieces)), capturedGoatsCount, goatTurnsCount,
      lastCalculation, moveLog: JSON.parse(JSON.stringify(currentMoveLog)),
    }]);
  };

  let moveHighlights: string[] = [], captureHighlights: string[] = [], wallHighlights: string[] = [];
  if (selectedPiece && !winner) {
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);
    if (selectedPiece.type === 'goat') {
      moveHighlights = adj.filter(c => !pieces.some(p => p.position === c));
      moveHighlights.forEach(tc => {
        const sim = pieces.map(p => p.id === selectedPiece.id ? { ...p, position: tc } : p);
        if (detectMathWalls(sim, preset.cellNumbers).activeWalls.some(w => w.from === tc || w.to === tc))
          wallHighlights.push(tc);
      });
    } else {
      adj.forEach(c => {
        const p = pieces.find(x => x.position === c);
        if (!p) moveHighlights.push(c);
        else if (p.type === 'goat' && checkTigerCapture(selectedPiece.position, c, protectedGoatPositions.has(c), preset.cellNumbers).allowed)
          captureHighlights.push(c);
      });
    }
  }

  const handleCellClick = (coordinate: string) => {
    if (winner) return;
    const pieceAtCell = pieces.find(p => p.position === coordinate);
    if (!selectedPiece) {
      if (pieceAtCell?.type === currentPlayer) setSelectedPiece(pieceAtCell);
      return;
    }
    if (selectedPiece.position === coordinate) { setSelectedPiece(null); return; }

    const isMove = moveHighlights.includes(coordinate);
    const isCapture = captureHighlights.includes(coordinate);

    if (isMove || isCapture) {
      recordHistory(pieces, moveLog);
      let updatedPieces = [...pieces];
      let updatedCaptured = capturedGoatsCount, updatedGoatTurns = goatTurnsCount;
      let calcMsg = '', logCapture: 'none'|'success'|'blocked' = 'none', logWall: 'none'|'formed'|'broken'|'active' = 'none';
      const fromCoord = selectedPiece.position;

      if (isCapture) {
        const goat = pieces.find(p => p.position === coordinate)!;
        const check = checkTigerCapture(selectedPiece.position, coordinate, protectedGoatPositions.has(coordinate), preset.cellNumbers);
        updatedPieces = updatedPieces.filter(p => p.id !== goat.id).map(p => p.id === selectedPiece.id ? { ...p, position: coordinate } : p);
        updatedCaptured += 1; logCapture = 'success';
        calcMsg = `${check.calculation} → Goat captured!`;
        if (protectedGoatPositions.has(coordinate)) logWall = 'broken';
      } else {
        updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: coordinate } : p);
        const mv = preset.cellNumbers[coordinate] || 0;
        if (selectedPiece.type === 'goat') {
          const newWalls = detectMathWalls(updatedPieces, preset.cellNumbers).activeWalls;
          const formed = newWalls.find(w => (w.from === coordinate || w.to === coordinate) && !activeWalls.some(aw => aw.id === w.id));
          if (formed) { logWall = 'formed'; calcMsg = `Math Wall: ${preset.cellNumbers[formed.from]} + ${preset.cellNumbers[formed.to]} = ${formed.sum} ✓`; }
          else {
            const adj2 = updatedPieces.filter(p => p.type === 'goat' && p.id !== selectedPiece.id && areAdjacent(coordinate, p.position));
            calcMsg = adj2.length ? `Sum check: ${mv} + ${preset.cellNumbers[adj2[0].position]} = ${mv + (preset.cellNumbers[adj2[0].position] || 0)}` : `Goat → ${coordinate} (value ${mv})`;
          }
        } else { calcMsg = `Tiger → ${coordinate} (value ${mv})`; }
      }

      const finalWalls = detectMathWalls(updatedPieces, preset.cellNumbers).activeWalls;
      const isGoatTurn = currentPlayer === 'goat';
      if (isGoatTurn) updatedGoatTurns += 1;

      const entry: MoveLogEntry = {
        turnNumber: moveLog.length + 1, team: isGoatTurn ? 'Goats' : 'Tigers',
        pieceMoved: selectedPiece.label, from: fromCoord, to: coordinate,
        captureStatus: logCapture, mathWallStatus: logWall,
        calculationShown: calcMsg, activeMathWallsCount: finalWalls.length,
      };

      setPieces(updatedPieces); setCapturedGoatsCount(updatedCaptured);
      setGoatTurnsCount(updatedGoatTurns); setMoveLog([...moveLog, entry]);
      setLastCalculation(calcMsg); setSelectedPiece(null);

      if (updatedCaptured >= preset.tigerCapturesRequired) { setWinner('tiger'); return; }
      if (updatedGoatTurns >= preset.goatSurvivalTurns) { setWinner('goat'); return; }
      if (isGoatTurn && finalWalls.length >= preset.goatActiveWallsRequired) { setWinner('goat'); return; }
      setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
    } else {
      if (pieceAtCell?.type === currentPlayer) setSelectedPiece(pieceAtCell);
      else setSelectedPiece(null);
    }
  };

  const isGoatTurn = currentPlayer === 'goat';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="space-y-0.5">
          <button onClick={onChangeSetup} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Change Setup
          </button>
          <h1 className="text-lg font-extrabold text-slate-800">Bagh-Bakri · Math Wall Edition</h1>
          <p className="text-xs text-slate-400">
            {version} · {format === '2-players' ? '2 Players' : format === '4-players' ? '4 Players' : 'Classroom'} ·{' '}
            <span className="text-emerald-600 font-semibold">{goatTeamName}</span> vs{' '}
            <span className="text-rose-600 font-semibold">{tigerTeamName}</span>
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <button onClick={() => setClassroomMode(p => !p)} className={`px-3 py-1.5 rounded-lg border transition-colors ${classroomMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            Classroom
          </button>
          <button onClick={() => setShowSTEMExplanations(p => !p)} className={`px-3 py-1.5 rounded-lg border transition-colors ${showSTEMExplanations ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            STEM
          </button>
          <button onClick={() => setShowRules(p => !p)} className="btn-secondary py-1.5 px-3 text-xs">
            {showRules ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Board area */}
        <div className="lg:col-span-8 space-y-4">

          {/* Turn strip */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isGoatTurn ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Turn</p>
                <p className={`font-extrabold text-base ${isGoatTurn ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isGoatTurn ? `🐐 ${goatTeamName}` : `🐯 ${tigerTeamName}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleUndo} disabled={!history.length} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                <RotateCcw className="w-3 h-3" /> Undo
              </button>
              <button onClick={() => { if (window.confirm('Reset the match?')) handleReset(); }} className="btn-secondary py-1.5 px-3 text-xs text-rose-600 hover:text-rose-700 border-rose-200">
                Reset
              </button>
            </div>
          </div>

          {/* Winner */}
          {winner && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
              <Award className={`w-12 h-12 ${winner === 'goat' ? 'text-emerald-500' : 'text-rose-500'}`} />
              <h2 className="text-2xl font-extrabold text-slate-800">
                {winner === 'goat' ? `🐐 ${goatTeamName}` : `🐯 ${tigerTeamName}`} wins!
              </h2>
              <p className="text-slate-400 text-sm max-w-xs">
                {winner === 'goat'
                  ? `Goats survived ${preset.goatSurvivalTurns} turns or built ${preset.goatActiveWallsRequired} Math Walls.`
                  : `Tigers captured ${preset.tigerCapturesRequired} goats.`}
              </p>
              <button onClick={handleReset} className="btn-primary px-6 py-2 text-sm">Play Again</button>
            </div>
          )}

          {classroomMode && (
            <ClassroomModePanel currentPlayer={currentPlayer} hasSelectedPiece={!!selectedPiece} goatTeamName={goatTeamName} tigerTeamName={tigerTeamName} turnNumber={moveLog.length} logicEngine={mathWallLogic} />
          )}

          <GameBoard
            gridSize={preset.gridSize} pieces={pieces} cellNumbers={preset.cellNumbers}
            activeWalls={activeWalls} protectedGoatPositions={protectedGoatPositions}
            selectedPiece={selectedPiece} moveHighlights={moveHighlights}
            captureHighlights={captureHighlights} wallHighlights={wallHighlights}
            onCellClick={handleCellClick} classroomMode={classroomMode}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <STEMPanel lastCalculation={lastCalculation} capturedCount={capturedGoatsCount} capturedRequired={preset.tigerCapturesRequired} survivalTurns={goatTurnsCount} survivalRequired={preset.goatSurvivalTurns} activeWallsCount={activeWalls.length} activeWallsRequired={preset.goatActiveWallsRequired} showExplanations={showSTEMExplanations} />
          <MoveLog moveLog={moveLog} onClearHistory={handleReset} goatTeamName={goatTeamName} tigerTeamName={tigerTeamName} />
          {showRules && (
            <RulesPanel ideaId={1} version={version} logicEngine={mathWallLogic} onClose={() => setShowRules(false)} />
          )}
        </div>
      </div>
    </div>
  );
};
