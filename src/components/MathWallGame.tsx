import React, { useState, useEffect } from 'react';
import type { GameSetupConfig, Piece, MoveLogEntry, GameHistorySnapshot } from '../types';
import { VERSION_PRESETS } from '../data/gameConfig';
import { GameBoard } from './GameBoard';
import { RulesPanel } from './RulesPanel';
import { MoveLog } from './MoveLog';
import { STEMPanel } from './STEMPanel';
import { ClassroomModePanel } from './ClassroomModePanel';
import { detectMathWalls } from '../utils/mathWallDetector';
import { checkTigerCapture } from '../utils/captureChecker';
import { areAdjacent, getNeighbors } from '../utils/boardHelpers';
import { RotateCcw, ArrowLeft, Eye, EyeOff, Sparkles, Award } from 'lucide-react';

interface MathWallGameProps {
  config: GameSetupConfig;
  onChangeSetup: () => void;
}

export const MathWallGame: React.FC<MathWallGameProps> = ({ config, onChangeSetup }) => {
  const { version, format, goatTeamName, tigerTeamName } = config;
  const preset = VERSION_PRESETS[version];

  // Core Game State
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [capturedGoatsCount, setCapturedGoatsCount] = useState(0);
  const [goatTurnsCount, setGoatTurnsCount] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<'goat' | 'tiger'>('goat');
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [lastCalculation, setLastCalculation] = useState('');
  const [winner, setWinner] = useState<'goat' | 'tiger' | null>(null);

  // Panels Toggle State
  const [showRules, setShowRules] = useState(true);
  const [showSTEMExplanations, setShowSTEMExplanations] = useState(true);
  const [classroomMode, setClassroomMode] = useState(format === 'classroom');

  // History State for Unlimited Undo
  const [history, setHistory] = useState<GameHistorySnapshot[]>([]);

  // Initialize Game on Mount or Version Change
  useEffect(() => {
    handleReset();
  }, [version]);

  // Recalculate Math Walls and Protected positions
  const { activeWalls, protectedGoatPositions } = detectMathWalls(pieces, preset.cellNumbers);

  const handleReset = () => {
    setPieces(JSON.parse(JSON.stringify(preset.startingPieces)));
    setCapturedGoatsCount(0);
    setGoatTurnsCount(0);
    setCurrentPlayer('goat');
    setSelectedPiece(null);
    setMoveLog([]);
    setLastCalculation('Game initialized. Goats move first!');
    setWinner(null);
    setHistory([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const previousSnapshots = [...history];
    const latestSnapshot = previousSnapshots.pop()!;

    setHistory(previousSnapshots);
    setPieces(latestSnapshot.pieces);
    setCapturedGoatsCount(latestSnapshot.capturedGoatsCount);
    setGoatTurnsCount(latestSnapshot.goatTurnsCount);
    setCurrentPlayer(latestSnapshot.currentPlayer);
    setSelectedPiece(null);
    setMoveLog(latestSnapshot.moveLog);
    setLastCalculation(latestSnapshot.lastCalculation);
    setWinner(null); // Clear winner in case undoing a winning move
  };

  // Helper to record history state before making a move
  const recordHistory = (currentPieces: Piece[], currentMoveLog: MoveLogEntry[]) => {
    const snapshot: GameHistorySnapshot = {
      turnNumber: currentMoveLog.length + 1,
      currentPlayer,
      pieces: JSON.parse(JSON.stringify(currentPieces)),
      capturedGoatsCount,
      goatTurnsCount,
      lastCalculation,
      moveLog: JSON.parse(JSON.stringify(currentMoveLog)),
    };
    setHistory(prev => [...prev, snapshot]);
  };

  // Move highlights calculation
  let moveHighlights: string[] = [];
  let captureHighlights: string[] = [];
  let wallHighlights: string[] = [];

  if (selectedPiece && !winner) {
    const adjacentCoords = getNeighbors(selectedPiece.position, preset.gridSize);

    if (selectedPiece.type === 'goat') {
      // Goats move to empty adjacent cells
      moveHighlights = adjacentCoords.filter(
        coord => !pieces.some(p => p.position === coord)
      );

      // Simulative check to see if moving to empty cell forms a Math Wall
      moveHighlights.forEach(targetCoord => {
        // Simulative pieces
        const simPieces = pieces.map(p => 
          p.id === selectedPiece.id ? { ...p, position: targetCoord } : p
        );
        const { activeWalls: simWalls } = detectMathWalls(simPieces, preset.cellNumbers);

        // Find if targetCoord is part of any active Math Wall in simulative state
        const formsWall = simWalls.some(w => w.from === targetCoord || w.to === targetCoord);
        if (formsWall) {
          wallHighlights.push(targetCoord);
        }
      });
    } else if (selectedPiece.type === 'tiger') {
      // Tigers move to empty adjacent cells OR capture Goats
      adjacentCoords.forEach(coord => {
        const pieceAtCoord = pieces.find(p => p.position === coord);

        if (!pieceAtCoord) {
          moveHighlights.push(coord);
        } else if (pieceAtCoord.type === 'goat') {
          // Goat is present: check capture feasibility
          const isProtected = protectedGoatPositions.has(coord);
          const captureCheck = checkTigerCapture(
            selectedPiece.position,
            coord,
            isProtected,
            preset.cellNumbers
          );

          if (captureCheck.allowed) {
            captureHighlights.push(coord);
          }
        }
      });
    }
  }

  const handleCellClick = (coordinate: string) => {
    if (winner) return;

    const pieceAtCell = pieces.find(p => p.position === coordinate);

    // 1. Piece selection/switching logic
    if (!selectedPiece) {
      if (pieceAtCell && pieceAtCell.type === currentPlayer) {
        setSelectedPiece(pieceAtCell);
      }
      return;
    }

    // 2. Deselect if clicked the selected piece again
    if (selectedPiece.position === coordinate) {
      setSelectedPiece(null);
      return;
    }

    // 3. Move/Capture execution
    const isMove = moveHighlights.includes(coordinate);
    const isCapture = captureHighlights.includes(coordinate);

    if (isMove || isCapture) {
      // Record history for undos
      recordHistory(pieces, moveLog);

      let updatedPieces = [...pieces];
      let updatedCapturedCount = capturedGoatsCount;
      let updatedGoatTurnsCount = goatTurnsCount;
      let turnCalcMessage = '';
      let logCaptureStatus: 'none' | 'success' | 'blocked' = 'none';
      let logWallStatus: 'none' | 'formed' | 'broken' | 'active' = 'none';
      let pieceMovedLabel = selectedPiece.label;
      const fromCoord = selectedPiece.position;

      if (isCapture) {
        // Find the captured Goat
        const capturedGoat = pieces.find(p => p.position === coordinate)!;
        const isGoatProtected = protectedGoatPositions.has(coordinate);
        
        const captureCheck = checkTigerCapture(
          selectedPiece.position,
          coordinate,
          isGoatProtected,
          preset.cellNumbers
        );

        // Remove goat from board
        updatedPieces = updatedPieces.filter(p => p.id !== capturedGoat.id);
        
        // Move tiger to the goat's cell
        updatedPieces = updatedPieces.map(p =>
          p.id === selectedPiece.id ? { ...p, position: coordinate } : p
        );

        updatedCapturedCount += 1;
        logCaptureStatus = 'success';
        turnCalcMessage = `${captureCheck.calculation} ➔ Goat captured!`;
        
        if (isGoatProtected) {
          logWallStatus = 'broken';
        }
      } else {
        // Standard movement: update position
        updatedPieces = updatedPieces.map(p =>
          p.id === selectedPiece.id ? { ...p, position: coordinate } : p
        );

        // Calculate and build formula message
        const isGoatMove = selectedPiece.type === 'goat';
        const movedVal = preset.cellNumbers[coordinate] || 0;
        
        if (isGoatMove) {
          // Find adjacent Goats in the NEW state to see if a wall was formed
          const { activeWalls: newWalls } = detectMathWalls(updatedPieces, preset.cellNumbers);
          const newWallCreated = newWalls.find(
            w => (w.from === coordinate || w.to === coordinate) && !activeWalls.some(aw => aw.id === w.id)
          );

          if (newWallCreated) {
            logWallStatus = 'formed';
            turnCalcMessage = `Math Wall formed: ${preset.cellNumbers[newWallCreated.from]} + ${preset.cellNumbers[newWallCreated.to]} = ${newWallCreated.sum} (Protected)`;
          } else {
            // Find closest adjacent goat, show standard sum
            const adjGoats = updatedPieces.filter(
              p => p.type === 'goat' && p.id !== selectedPiece.id && areAdjacent(coordinate, p.position)
            );
            if (adjGoats.length > 0) {
              const otherVal = preset.cellNumbers[adjGoats[0].position] || 0;
              turnCalcMessage = `Goat sum check: ${movedVal} + ${otherVal} = ${movedVal + otherVal} (no wall)`;
            } else {
              turnCalcMessage = `Goat moved to ${coordinate} (Value: ${movedVal})`;
            }
          }
        } else {
          // Tiger move
          turnCalcMessage = `Tiger moved to ${coordinate} (Value: ${movedVal})`;
        }
      }

      // Check active walls in the NEW state
      const { activeWalls: finalWalls } = detectMathWalls(updatedPieces, preset.cellNumbers);

      // Increment Goat survival turn count after Goat Team finishes their move
      const isGoatTurn = currentPlayer === 'goat';
      if (isGoatTurn) {
        updatedGoatTurnsCount += 1;
      }

      // Build logs entry
      const logEntry: MoveLogEntry = {
        turnNumber: moveLog.length + 1,
        team: isGoatTurn ? 'Goats' : 'Tigers',
        pieceMoved: pieceMovedLabel,
        from: fromCoord,
        to: coordinate,
        captureStatus: logCaptureStatus,
        mathWallStatus: logWallStatus,
        calculationShown: turnCalcMessage,
        activeMathWallsCount: finalWalls.length,
      };

      const updatedMoveLog = [...moveLog, logEntry];

      // Update state in one synchronous block
      setPieces(updatedPieces);
      setCapturedGoatsCount(updatedCapturedCount);
      setGoatTurnsCount(updatedGoatTurnsCount);
      setMoveLog(updatedMoveLog);
      setLastCalculation(turnCalcMessage);
      setSelectedPiece(null);

      // Evaluate Win Conditions
      // 1. Tigers win if captures target met
      if (updatedCapturedCount >= preset.tigerCapturesRequired) {
        setWinner('tiger');
        return;
      }

      // 2. Goats win if survival turn target met
      if (updatedGoatTurnsCount >= preset.goatSurvivalTurns) {
        setWinner('goat');
        return;
      }

      // 3. Goats win if active math walls target met at the end of Goat Team's turn
      if (isGoatTurn && finalWalls.length >= preset.goatActiveWallsRequired) {
        setWinner('goat');
        return;
      }

      // Switch turn
      setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
    } else {
      // If clicked another piece belonging to the active team, switch selection
      if (pieceAtCell && pieceAtCell.type === currentPlayer) {
        setSelectedPiece(pieceAtCell);
      } else {
        // Clicked an invalid cell, clear selection
        setSelectedPiece(null);
      }
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner and Configuration Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="text-left space-y-1">
          <button
            onClick={onChangeSetup}
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-semibold mb-1 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Game Setup</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Bagh-Bakri: Math Wall Edition
            </h1>
          </div>
          <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1 font-medium">
            <span>Preset: <strong className="text-slate-200 capitalize">{version}</strong></span>
            <span>•</span>
            <span>Format: <strong className="text-slate-200 capitalize">
              {format === '2-players' ? '2 Players' : format === '4-players' ? '4 Players' : 'Classroom Mode'}
            </strong></span>
            <span>•</span>
            <span>Goats: <strong className="text-emerald-400">{goatTeamName}</strong></span>
            <span>•</span>
            <span>Tigers: <strong className="text-red-400">{tigerTeamName}</strong></span>
          </div>
        </div>

        {/* Global Controls Panel Toggle */}
        <div className="flex gap-2 shrink-0 text-xs font-bold">
          <button
            onClick={() => setClassroomMode(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              classroomMode 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                : 'bg-slate-800/80 border-slate-700 text-slate-350 hover:bg-slate-750'
            }`}
          >
            <span>Classroom Mode</span>
          </button>
          <button
            onClick={() => setShowSTEMExplanations(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              showSTEMExplanations 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                : 'bg-slate-800/80 border-slate-700 text-slate-350 hover:bg-slate-750'
            }`}
          >
            <span>STEM Formulas</span>
          </button>
          <button
            onClick={() => setShowRules(prev => !prev)}
            className="btn-secondary py-1.5 px-3 flex items-center gap-1 text-xs"
          >
            {showRules ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showRules ? 'Hide Rules' : 'Show Rules'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Game Loop layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Playable Area: ColumnSpan 8 */}
        <div className="lg:col-span-8 space-y-6">
          {/* Turn and Current State Info Box */}
          <div className="glass-panel p-4 bg-slate-850/80 border-indigo-500/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              {/* Giant glowing indicator bulb */}
              <div className={`w-3.5 h-3.5 rounded-full animate-ping absolute`} style={{
                backgroundColor: currentPlayer === 'goat' ? '#10b981' : '#ef4444'
              }}></div>
              <div className={`w-3.5 h-3.5 rounded-full shrink-0`} style={{
                backgroundColor: currentPlayer === 'goat' ? '#10b981' : '#ef4444'
              }}></div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  Active Turn
                </span>
                <span className={`text-lg md:text-xl font-black ${
                  currentPlayer === 'goat' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {currentPlayer === 'goat' ? goatTeamName : tigerTeamName} ({currentPlayer === 'goat' ? 'Goats' : 'Tigers'})
                </span>
              </div>
            </div>

            {/* In-game action keys */}
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80"
                title="Undo last turn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset the match? All progress will be lost.')) {
                    handleReset();
                  }
                }}
                className="btn-secondary py-2 px-3 text-xs text-rose-300 border-rose-900/40 hover:bg-rose-950/20 hover:text-rose-200"
                title="Reset game board"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Winner Overlay announcement popup */}
          {winner && (
            <div className="glass-panel p-6 bg-slate-900 border-2 border-indigo-500 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 animate-fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/5 filter blur-2xl pointer-events-none"></div>
              <Award className={`w-14 h-14 ${winner === 'goat' ? 'text-emerald-400 animate-bounce' : 'text-red-400 animate-bounce'}`} />
              <h2 className="text-3xl font-black text-slate-100 tracking-tight">
                Victory Declared!
              </h2>
              <p className="text-lg text-indigo-200 max-w-md">
                🏆 <strong className={winner === 'goat' ? 'text-emerald-400' : 'text-red-400'}>
                  {winner === 'goat' ? goatTeamName : tigerTeamName} ({winner === 'goat' ? 'Goats' : 'Tigers'})
                </strong> has won the match!
              </p>
              
              <div className="text-xs text-slate-400 bg-slate-950/40 px-4 py-2.5 rounded-xl border border-slate-800 text-left max-w-sm space-y-1">
                <span className="font-bold text-indigo-300 block uppercase tracking-wider text-[10px]">Win Reason:</span>
                {winner === 'goat' ? (
                  <span>
                    Goats met their victory target by either surviving {preset.goatSurvivalTurns} turns or maintaining {preset.goatActiveWallsRequired} active Math Walls.
                  </span>
                ) : (
                  <span>
                    Tigers met their victory target by successfully capturing {preset.tigerCapturesRequired} goats.
                  </span>
                )}
              </div>

              <button onClick={handleReset} className="btn-primary px-6 py-2.5 text-sm font-bold">
                <span>Play Again</span>
              </button>
            </div>
          )}

          {/* Classroom Mode Panel */}
          {classroomMode && (
            <ClassroomModePanel
              currentPlayer={currentPlayer}
              hasSelectedPiece={!!selectedPiece}
              goatTeamName={goatTeamName}
              tigerTeamName={tigerTeamName}
              turnNumber={moveLog.length}
            />
          )}

          {/* Dynamic Board grid */}
          <GameBoard
            gridSize={preset.gridSize}
            pieces={pieces}
            cellNumbers={preset.cellNumbers}
            activeWalls={activeWalls}
            protectedGoatPositions={protectedGoatPositions}
            selectedPiece={selectedPiece}
            moveHighlights={moveHighlights}
            captureHighlights={captureHighlights}
            wallHighlights={wallHighlights}
            onCellClick={handleCellClick}
            classroomMode={classroomMode}
          />
        </div>

        {/* Informational Sidebar Area: ColumnSpan 4 */}
        <div className="lg:col-span-4 space-y-6">
          {/* STEM Panel */}
          <STEMPanel
            lastCalculation={lastCalculation}
            capturedCount={capturedGoatsCount}
            capturedRequired={preset.tigerCapturesRequired}
            survivalTurns={goatTurnsCount}
            survivalRequired={preset.goatSurvivalTurns}
            activeWallsCount={activeWalls.length}
            activeWallsRequired={preset.goatActiveWallsRequired}
            showExplanations={showSTEMExplanations}
          />

          {/* Move Log Panel */}
          <MoveLog
            moveLog={moveLog}
            onClearHistory={handleReset}
            goatTeamName={goatTeamName}
            tigerTeamName={tigerTeamName}
          />

          {/* Rules Panel Collapsible Drawer */}
          {showRules && (
            <RulesPanel 
              onClose={() => setShowRules(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
