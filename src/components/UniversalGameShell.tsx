import React, { useState, useEffect } from 'react';
import type { GameSetupConfig, Piece, MoveLogEntry, GameHistorySnapshot, CellConfig } from '../types';
import { VERSION_PRESETS } from '../data/gameConfig';
import { GAME_IDEAS } from '../data/ideasData';
import { GameBoard } from './GameBoard';
import { RulesPanel } from './RulesPanel';
import { MoveLog } from './MoveLog';
import { ClassroomModePanel } from './ClassroomModePanel';
import { getGameLogic } from '../utils/gameLogicRegistry';
import { RULE_DECK } from '../utils/logicLabLogic';
import { findConnectedPaths } from '../utils/buildBoardLogic';
import { getNeighbors } from '../utils/boardHelpers';
import {
  RotateCcw,
  ArrowLeft,
  Eye,
  EyeOff,
  Award,
  Zap,
  Dice5,
  Heart,
  BarChart3,
  Wrench,
  Hammer,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface UniversalGameShellProps {
  config: GameSetupConfig;
  onChangeSetup: () => void;
}

export const UniversalGameShell: React.FC<UniversalGameShellProps> = ({ config, onChangeSetup }) => {
  const { ideaId, version, format, goatTeamName, tigerTeamName } = config;
  const preset = VERSION_PRESETS[version];
  const idea = GAME_IDEAS.find(i => i.id === ideaId)!;
  const logicEngine = getGameLogic(ideaId);

  // Core States
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [gridCells, setGridCells] = useState<Record<string, CellConfig>>({});
  const [extraState, setExtraState] = useState<any>({});
  const [capturedGoatsCount, setCapturedGoatsCount] = useState(0);
  const [goatTurnsCount, setGoatTurnsCount] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<'goat' | 'tiger'>('goat');
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [lastCalculation, setLastCalculation] = useState('');
  const [winner, setWinner] = useState<'goat' | 'tiger' | 'both-lose' | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [showSTEMExplanations, setShowSTEMExplanations] = useState(true);
  const [classroomMode, setClassroomMode] = useState(format === 'classroom');
  const [teacherMode, setTeacherMode] = useState(false);
  const [history, setHistory] = useState<GameHistorySnapshot[]>([]);

  // Special Dice Battle Overlay States (Idea 6)
  const [diceBattleState, setDiceBattleState] = useState<{
    active: boolean;
    attacker: Piece | null;
    target: Piece | null;
    threshold: number;
    activeChance: string;
    modifierMsg: string;
    targetCoord: string | null;
  } | null>(null);

  const [isRollingDice, setIsRollingDice] = useState(false);
  const [currentRolledFace, setCurrentRolledFace] = useState<number | null>(null);
  const [userPrediction, setUserPrediction] = useState<'success' | 'fail' | null>(null);
  const [battleOutcome, setBattleOutcome] = useState<{
    succeeded: boolean;
    roll: number;
    predictionCorrect: boolean | null;
    isEscaping: boolean;
  } | null>(null);

  // Special Placement States (Idea 10)
  const [placementMode, setPlacementMode] = useState<'none' | 'bridge' | 'block' | 'rotate' | 'remove'>('none');

  // Trigger setup reset on load or when version changes
  useEffect(() => {
    handleReset();
  }, [ideaId, version]);

  const handleReset = () => {
    const init = logicEngine.initializeGame(version);
    setPieces(init.pieces);
    setGridCells(init.gridCells);
    setExtraState(init.extraState);
    setCapturedGoatsCount(0);
    setGoatTurnsCount(0);
    setCurrentPlayer('goat');
    setSelectedPiece(null);
    setMoveLog([]);
    setWinner(null);
    setHistory([]);
    setPlacementMode('none');
    setDiceBattleState(null);
    setIsRollingDice(false);
    setCurrentRolledFace(null);
    setUserPrediction(null);
    setBattleOutcome(null);

    // Customized start message
    let startMsg = 'Game started. Goats move first.';
    if (ideaId === 4) startMsg = 'Energy quest active! Goats start with 5 energy, Tigers with 8.';
    else if (ideaId === 7) startMsg = 'Ecosystem balance active. Maintain ecological harmony!';
    else if (ideaId === 9) startMsg = 'Logic Lab online. Match rule conditions to execute moves.';
    setLastCalculation(startMsg);
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = [...history];
    const snap = prev.pop()!;
    setHistory(prev);
    setPieces(snap.pieces);
    if (snap.gridCells) setGridCells(snap.gridCells);
    if (snap.extraState) setExtraState(snap.extraState);
    setCapturedGoatsCount(snap.capturedGoatsCount);
    setGoatTurnsCount(snap.goatTurnsCount);
    setCurrentPlayer(snap.currentPlayer);
    setSelectedPiece(null);
    setMoveLog(snap.moveLog);
    setLastCalculation(snap.lastCalculation);
    setWinner(null);
    setPlacementMode('none');
  };

  const recordHistory = (currentPieces: Piece[], currentMoveLog: MoveLogEntry[]) => {
    setHistory(prev => [
      ...prev,
      {
        turnNumber: currentMoveLog.length + 1,
        currentPlayer,
        pieces: JSON.parse(JSON.stringify(currentPieces)),
        gridCells: JSON.parse(JSON.stringify(gridCells)),
        extraState: JSON.parse(JSON.stringify(extraState)),
        capturedGoatsCount,
        goatTurnsCount,
        lastCalculation,
        moveLog: JSON.parse(JSON.stringify(currentMoveLog)),
      },
    ]);
  };

  // Determine highlights using logic registry
  let moveHighlights: string[] = [];
  let captureHighlights: string[] = [];
  let wallHighlights: string[] = [];

  const activeProtectedGoats = logicEngine.detectProtection(pieces, gridCells, version, extraState);

  // If in placement/engineering mode (Idea 10), determine highlights dynamically
  if (placementMode !== 'none') {
    if (placementMode === 'bridge') {
      const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));
      for (let r = 1; r <= preset.gridSize; r++) {
        for (let c = 0; c < preset.gridSize; c++) {
          const coord = `${colLetters[c]}${r}`;
          const occupies = pieces.some(p => p.position === coord);
          const cell = gridCells[coord];
          if (!occupies && !cell?.isBlocked && cell?.tileType !== 'bridge' && cell?.tileType !== 'block') {
            moveHighlights.push(coord);
          }
        }
      }
    } else if (placementMode === 'block') {
      const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));
      for (let r = 1; r <= preset.gridSize; r++) {
        for (let c = 0; c < preset.gridSize; c++) {
          const coord = `${colLetters[c]}${r}`;
          const occupies = pieces.some(p => p.position === coord);
          const cell = gridCells[coord];
          if (!occupies && !cell?.isBlocked && cell?.tileType !== 'block') {
            moveHighlights.push(coord);
          }
        }
      }
    } else if (placementMode === 'rotate') {
      Object.keys(gridCells).forEach(c => {
        const cell = gridCells[c];
        if (cell && cell.tileType && cell.tileType !== 'block') {
          moveHighlights.push(c);
        }
      });
    } else if (placementMode === 'remove') {
      const pBridges = extraState.placedBridges || [];
      const pBlocks = extraState.placedBlocks || [];
      pBridges.forEach((c: string) => moveHighlights.push(c));
      pBlocks.forEach((c: string) => moveHighlights.push(c));
    }
  } else if (selectedPiece && !winner) {
    const res = logicEngine.getLegalMoves(selectedPiece, pieces, gridCells, currentPlayer, version, extraState);
    moveHighlights = res.moveHighlights;
    captureHighlights = res.captureHighlights;
    wallHighlights = res.wallHighlights || [];
  }

  const handleCellClick = (coordinate: string) => {
    if (winner) return;

    // Handle Engineering Placement & Actions (Idea 10)
    if (placementMode !== 'none') {
      if (placementMode === 'rotate') {
        const nextGrid = { ...gridCells };
        const cell = nextGrid[coordinate];
        if (cell && cell.tileType && cell.tileType !== 'block') {
          recordHistory(pieces, moveLog);
          const nextRotation = ((cell.rotation || 0) + 1) % 4;
          nextGrid[coordinate] = { ...cell, rotation: nextRotation };

          const nextExtra = { ...extraState };
          nextExtra.lastEngineeringEvent = `${currentPlayer === 'goat' ? 'Goats' : 'Tigers'} rotated tile ${coordinate} clockwise!`;

          // Update active safe routes
          const routes = findConnectedPaths(nextGrid, preset.gridSize, pieces);
          nextExtra.activeSafeRoutes = routes.map(r => r.path);

          setGridCells(nextGrid);
          setExtraState(nextExtra);
          setPlacementMode('none');

          const calc = nextExtra.lastEngineeringEvent;
          setLastCalculation(calc);

          const entry: MoveLogEntry = {
            turnNumber: moveLog.length + 1,
            team: currentPlayer === 'goat' ? 'Goats' : 'Tigers',
            pieceMoved: 'Rotate Tile',
            from: coordinate,
            to: coordinate,
            captureStatus: 'none',
            mathWallStatus: 'none',
            calculationShown: calc,
            activeMathWallsCount: 0,
          };
          setMoveLog([...moveLog, entry]);

          const isGoatTurn = currentPlayer === 'goat';
          const nextGoatTurns = isGoatTurn ? goatTurnsCount + 1 : goatTurnsCount;
          setGoatTurnsCount(nextGoatTurns);

          // Check win conditions
          const winCheck = logicEngine.checkWinCondition(
            pieces,
            nextGrid,
            capturedGoatsCount,
            nextGoatTurns,
            version,
            nextExtra,
            0
          );
          if (winCheck) setWinner(winCheck);

          setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
        } else {
          setPlacementMode('none');
        }
        return;
      }

      if (placementMode === 'remove') {
        const nextGrid = { ...gridCells };
        const nextExtra = { ...extraState };
        const cell = nextGrid[coordinate];

        if (cell) {
          let removed = false;
          if (cell.tileType === 'bridge' && nextExtra.placedBridges?.includes(coordinate)) {
            recordHistory(pieces, moveLog);
            nextGrid[coordinate] = {
              ...cell,
              tileType: 'straight',
              isBlocked: false,
            };
            nextExtra.placedBridges = nextExtra.placedBridges.filter((c: string) => c !== coordinate);
            nextExtra.goatBridgesLeft = (nextExtra.goatBridgesLeft ?? 0) + 1;
            nextExtra.lastEngineeringEvent = `Goats removed Bridge at ${coordinate} and recovered 1 Bridge!`;
            removed = true;
          } else if (cell.tileType === 'block' && nextExtra.placedBlocks?.includes(coordinate)) {
            recordHistory(pieces, moveLog);
            nextGrid[coordinate] = {
              ...cell,
              tileType: 'straight',
              isBlocked: false,
            };
            nextExtra.placedBlocks = nextExtra.placedBlocks.filter((c: string) => c !== coordinate);
            nextExtra.tigerBlocksLeft = (nextExtra.tigerBlocksLeft ?? 0) + 1;
            nextExtra.lastEngineeringEvent = `Tigers removed Block at ${coordinate} and recovered 1 Block!`;
            removed = true;
          }

          if (removed) {
            const routes = findConnectedPaths(nextGrid, preset.gridSize, pieces);
            nextExtra.activeSafeRoutes = routes.map(r => r.path);

            setGridCells(nextGrid);
            setExtraState(nextExtra);
            setPlacementMode('none');

            const calc = nextExtra.lastEngineeringEvent;
            setLastCalculation(calc);

            const entry: MoveLogEntry = {
              turnNumber: moveLog.length + 1,
              team: currentPlayer === 'goat' ? 'Goats' : 'Tigers',
              pieceMoved: 'Remove Tile',
              from: coordinate,
              to: coordinate,
              captureStatus: 'none',
              mathWallStatus: 'none',
              calculationShown: calc,
              activeMathWallsCount: 0,
            };
            setMoveLog([...moveLog, entry]);

            const isGoatTurn = currentPlayer === 'goat';
            const nextGoatTurns = isGoatTurn ? goatTurnsCount + 1 : goatTurnsCount;
            setGoatTurnsCount(nextGoatTurns);

            const winCheck = logicEngine.checkWinCondition(
              pieces,
              nextGrid,
              capturedGoatsCount,
              nextGoatTurns,
              version,
              nextExtra,
              0
            );
            if (winCheck) setWinner(winCheck);

            setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
          } else {
            setPlacementMode('none');
          }
        } else {
          setPlacementMode('none');
        }
        return;
      }

      if (moveHighlights.includes(coordinate)) {
        recordHistory(pieces, moveLog);
        const nextGrid = { ...gridCells };
        const nextExtra = { ...extraState };

        if (placementMode === 'bridge') {
          nextGrid[coordinate] = {
            ...nextGrid[coordinate],
            tileType: 'bridge',
            isBlocked: false,
          };
          nextExtra.goatBridgesLeft = Math.max(0, nextExtra.goatBridgesLeft - 1);
          nextExtra.placedBridges = nextExtra.placedBridges || [];
          nextExtra.placedBridges.push(coordinate);
          nextExtra.lastEngineeringEvent = `Goats constructed a Bridge tile at ${coordinate}!`;
        } else if (placementMode === 'block') {
          nextGrid[coordinate] = {
            ...nextGrid[coordinate],
            tileType: 'block',
            isBlocked: true,
          };
          nextExtra.tigerBlocksLeft = Math.max(0, nextExtra.tigerBlocksLeft - 1);
          nextExtra.placedBlocks = nextExtra.placedBlocks || [];
          nextExtra.placedBlocks.push(coordinate);
          nextExtra.lastEngineeringEvent = `Tigers placed a block barrier at ${coordinate}!`;
        }

        // Update active safe routes
        const routes = findConnectedPaths(nextGrid, preset.gridSize, pieces);
        nextExtra.activeSafeRoutes = routes.map(r => r.path);

        setGridCells(nextGrid);
        setExtraState(nextExtra);
        setPlacementMode('none');

        const calc = nextExtra.lastEngineeringEvent;
        setLastCalculation(calc);

        // Record log entry
        const entry: MoveLogEntry = {
          turnNumber: moveLog.length + 1,
          team: currentPlayer === 'goat' ? 'Goats' : 'Tigers',
          pieceMoved: placementMode === 'bridge' ? 'Bridge Tile' : 'Block Tile',
          from: 'Inventory',
          to: coordinate,
          captureStatus: 'none',
          mathWallStatus: 'none',
          calculationShown: calc,
          activeMathWallsCount: 0,
        };

        setMoveLog([...moveLog, entry]);
        const isGoatTurn = currentPlayer === 'goat';
        const nextGoatTurns = isGoatTurn ? goatTurnsCount + 1 : goatTurnsCount;
        setGoatTurnsCount(nextGoatTurns);

        // Check win conditions
        const winCheck = logicEngine.checkWinCondition(
          pieces,
          nextGrid,
          capturedGoatsCount,
          nextGoatTurns,
          version,
          nextExtra,
          0
        );
        if (winCheck) setWinner(winCheck);

        // Turn toggle
        setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
      } else {
        setPlacementMode('none');
      }
      return;
    }

    const pieceAtCell = pieces.find(p => p.position === coordinate);

    if (!selectedPiece) {
      if (pieceAtCell?.type === currentPlayer) {
        setSelectedPiece(pieceAtCell);
      }
      return;
    }

    if (selectedPiece.position === coordinate) {
      setSelectedPiece(null);
      return;
    }

    const isMove = moveHighlights.includes(coordinate);
    const isCapture = captureHighlights.includes(coordinate);

    if (isMove || isCapture) {
      if (isCapture && ideaId === 6) {
        const targetGoat = pieces.find(p => p.position === coordinate);
        if (targetGoat && selectedPiece) {
          const neighbors = getNeighbors(coordinate, preset.gridSize);
          const nearbyCount = pieces.filter(p => p.type === 'goat' && p.position !== coordinate && neighbors.includes(p.position)).length;

          let baseThreshold = 3;
          let baseChanceStr = 'High';
          if (nearbyCount === 1) {
            baseThreshold = 4;
            baseChanceStr = 'Medium';
          } else if (nearbyCount >= 2) {
            baseThreshold = 5;
            baseChanceStr = 'Low';
          }

          let modifierInfo = '';
          let activeChance = baseChanceStr;

          const tigerCell = gridCells[selectedPiece.position];
          if (tigerCell && tigerCell.habitat === 'hill') {
            if (activeChance === 'Low') activeChance = 'Medium';
            else if (activeChance === 'Medium') activeChance = 'High';
            modifierInfo = 'Tiger on Hill Power Cell: Chance Improved +1 Level!';
          }

          if (version === 'advanced') {
            const goatCell = gridCells[coordinate];
            if (goatCell && goatCell.habitat === 'forest') {
              if (activeChance === 'High') activeChance = 'Medium';
              else if (activeChance === 'Medium') activeChance = 'Low';
              modifierInfo += (modifierInfo ? ' · ' : '') + 'Goat in Forest: Chance Reduced -1 Level!';
            }
          }

          let finalThreshold = 3;
          if (activeChance === 'Medium') finalThreshold = 4;
          else if (activeChance === 'Low') finalThreshold = 5;

          setDiceBattleState({
            active: true,
            attacker: selectedPiece,
            target: targetGoat,
            threshold: finalThreshold,
            activeChance,
            modifierMsg: modifierInfo || 'No active terrain modifiers',
            targetCoord: coordinate
          });

          setUserPrediction(null);
          setBattleOutcome(null);
          return;
        }
      }

      recordHistory(pieces, moveLog);

      const res = logicEngine.applyMove(
        selectedPiece,
        coordinate,
        pieces,
        gridCells,
        currentPlayer,
        version,
        extraState,
        isCapture
      );

      let nextCaptured = capturedGoatsCount;
      if (res.captureStatus === 'success') {
        nextCaptured += 1;
      }

      const isGoatTurn = currentPlayer === 'goat';
      const nextGoatTurns = isGoatTurn ? goatTurnsCount + 1 : goatTurnsCount;

      // Update state containers
      setPieces(res.pieces);
      setGridCells(res.gridCells);
      setExtraState(res.extraState);
      setCapturedGoatsCount(nextCaptured);
      setGoatTurnsCount(nextGoatTurns);
      setLastCalculation(res.calculationMsg);
      setSelectedPiece(null);

      // Check win/loss
      const winCheck = logicEngine.checkWinCondition(
        res.pieces,
        res.gridCells,
        nextCaptured,
        nextGoatTurns,
        version,
        res.extraState,
        res.wallStatus === 'formed' ? 1 : 0 // simplify wall signal
      );

      const entry: MoveLogEntry = {
        turnNumber: moveLog.length + 1,
        team: isGoatTurn ? 'Goats' : 'Tigers',
        pieceMoved: selectedPiece.label,
        from: selectedPiece.position,
        to: coordinate,
        captureStatus: res.captureStatus,
        mathWallStatus: res.wallStatus,
        calculationShown: res.calculationMsg,
        activeMathWallsCount: 0,
      };
      setMoveLog([...moveLog, entry]);

      if (winCheck) {
        setWinner(winCheck);
        return;
      }

      setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
    } else {
      if (pieceAtCell?.type === currentPlayer) {
        setSelectedPiece(pieceAtCell);
      } else {
        setSelectedPiece(null);
      }
    }
  };

  // Idea 4: Resting action
  const handleRestAction = () => {
    if (!selectedPiece || winner) return;
    recordHistory(pieces, moveLog);

    const isGoatTurn = currentPlayer === 'goat';
    const maxEnergy = selectedPiece.type === 'tiger' ? 10 : 6;
    const currentEnergy = selectedPiece.energy ?? 0;
    const gained = Math.min(maxEnergy, currentEnergy + 2);

    const updatedPieces = pieces.map(p => {
      if (p.id === selectedPiece.id) {
        return { ...p, energy: gained };
      }
      return p;
    });

    const msg = `${selectedPiece.label} rested and recovered 2 energy points (now ${gained}/${maxEnergy}).`;

    setPieces(updatedPieces);
    setLastCalculation(msg);
    setSelectedPiece(null);

    const entry: MoveLogEntry = {
      turnNumber: moveLog.length + 1,
      team: isGoatTurn ? 'Goats' : 'Tigers',
      pieceMoved: selectedPiece.label,
      from: selectedPiece.position,
      to: 'Resting',
      captureStatus: 'none',
      mathWallStatus: 'none',
      calculationShown: msg,
      activeMathWallsCount: 0,
    };
    setMoveLog([...moveLog, entry]);

    const nextGoatTurns = isGoatTurn ? goatTurnsCount + 1 : goatTurnsCount;
    setGoatTurnsCount(nextGoatTurns);

    setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
  };

  const handleResolveDiceBattle = (finalRoll: number) => {
    if (!diceBattleState || !diceBattleState.attacker || !diceBattleState.targetCoord) return;

    recordHistory(pieces, moveLog);

    const nextExtra = {
      ...extraState,
      prediction: userPrediction,
      manualDiceRoll: finalRoll
    };

    const res = logicEngine.applyMove(
      diceBattleState.attacker,
      diceBattleState.targetCoord,
      pieces,
      gridCells,
      currentPlayer,
      version,
      nextExtra,
      true
    );

    let nextCaptured = capturedGoatsCount;
    if (res.captureStatus === 'success') {
      nextCaptured += 1;
    }

    const isGoatTurn = currentPlayer === 'goat';
    const nextGoatTurns = isGoatTurn ? goatTurnsCount + 1 : goatTurnsCount;

    setPieces(res.pieces);
    setGridCells(res.gridCells);
    setExtraState(res.extraState);
    setCapturedGoatsCount(nextCaptured);
    setGoatTurnsCount(nextGoatTurns);
    setLastCalculation(res.calculationMsg);

    const succeeded = finalRoll >= diceBattleState.threshold;
    const isEscaping = res.extraState.isEscaping === true;

    setBattleOutcome({
      succeeded,
      roll: finalRoll,
      predictionCorrect: userPrediction ? (userPrediction === 'success' ? succeeded : !succeeded) : null,
      isEscaping
    });

    if (isEscaping) {
      const escapingGoat = res.pieces.find(p => p.id === res.extraState.escapingGoatId);
      if (escapingGoat) {
        setSelectedPiece(escapingGoat);
      }
    } else {
      setSelectedPiece(null);
    }

    const winCheck = logicEngine.checkWinCondition(
      res.pieces,
      res.gridCells,
      nextCaptured,
      nextGoatTurns,
      version,
      res.extraState,
      0
    );

    const entry: MoveLogEntry = {
      turnNumber: moveLog.length + 1,
      team: isGoatTurn ? 'Goats' : 'Tigers',
      pieceMoved: diceBattleState.attacker.label,
      from: diceBattleState.attacker.position,
      to: diceBattleState.targetCoord,
      captureStatus: res.captureStatus,
      mathWallStatus: 'none',
      calculationShown: res.calculationMsg,
      activeMathWallsCount: 0,
    };
    setMoveLog([...moveLog, entry]);

    if (winCheck) {
      setWinner(winCheck);
    }

    setCurrentPlayer(isGoatTurn ? 'tiger' : 'goat');
  };

  const handleCloseDiceBattle = () => {
    setDiceBattleState(null);
    setBattleOutcome(null);
    setIsRollingDice(false);
    setCurrentRolledFace(null);
    setUserPrediction(null);
  };

  const handleMakePrediction = (predId: string, predName: string) => {
    const nextExtra = { ...extraState, prediction: predId, predictionName: predName };
    setExtraState(nextExtra);
    setLastCalculation(`Prediction registered: "${predName}". This will be evaluated after the opponent's move!`);
  };

  const isGoatTurn = currentPlayer === 'goat';

  // Customize STEM Inquiry Explanations based on IdeaId
  const getStemExplanations = () => {
    switch (ideaId) {
      case 1:
        return [
          { bold: 'Addition', desc: 'Sum cell values to check captures (≥ 6) and walls (≥ 7).' },
          { bold: 'Inequalities', desc: 'Compare sums to thresholds to decide outcomes.' },
          { bold: 'Spatial logic', desc: 'Connect adjacent nodes to form defensive shapes.' },
        ];
      case 2:
        return [
          { bold: 'Number Trails', desc: 'Sequence consecutive values (e.g. 1 → 2 → 3) along the grid path.' },
          { bold: 'Middle Value Detection', desc: 'Tigers target the middle number, creating subtraction logic.' },
          { bold: 'Strategic Trails', desc: 'Build paths to protect your herd from captures.' },
        ];
      case 3:
        return [
          { bold: 'Pattern Recognition', desc: 'Form sequential loops (Circle → Triangle → Square).' },
          { bold: 'Classification', desc: 'Categorize cell positions based on visual shapes.' },
          { bold: 'Pathmaking', desc: 'Navigate trails of symbols to establish shield protection.' },
        ];
      case 4:
        return [
          { bold: 'Optimization', desc: 'Balance the energy depletion of movements vs captures.' },
          { bold: 'Resource Subtraction', desc: 'Subtract energy costs (1 for orthogonal, 2 for diagonal moves).' },
          { bold: 'Recovery Phase', desc: 'Decide when to "Rest" to recover 2 energy.' },
        ];
      case 5:
        return [
          { bold: 'Geometric Forms', desc: 'Construct Straight Lines, Triangles, and Squares.' },
          { bold: 'Symmetry', desc: 'Locate symmetrical vertices to solidify defenses.' },
          { bold: 'Structural Weak Points', desc: 'Target corners or centers to break shapes.' },
        ];
      case 6:
        return [
          { bold: 'Probability', desc: 'Calculate success rates based on neighborhood counts.' },
          { bold: 'Dice Outcomes', desc: 'Simulate randomized 6-sided dice rolls (1 to 6).' },
          { bold: 'Risk Assessment', desc: 'Group goats together to decrease capture rate from 66% down to 33%.' },
        ];
      case 7:
        return [
          { bold: 'Ecological Balances', desc: 'Monitor resource limits (dry lands decrease balance by 10%).' },
          { bold: 'Predator Hunger', desc: 'Ensure tigers eat goats before hunger decays to 0.' },
          { bold: 'Systems Collapse', desc: 'If balance drops to 0%, both sides face immediate defeat.' },
        ];
      case 8:
        return [
          { bold: 'Data Tallies', desc: 'Track escapes, moves, and captures systematically.' },
          { bold: 'Board Zones', desc: 'Analyze coordinate zones: Corner, Edge, and Center.' },
          { bold: 'Power Tokens', desc: 'Gather tokens to unlock "Safe Steps" or "Focused Hunts".' },
        ];
      case 9:
        return [
          { bold: 'Algorithmic Conditions', desc: 'Check dynamic rules (Even/Odd, Multiple Checks) before every turn.' },
          { bold: 'Conditional Loops', desc: 'Evaluate rule decks in a cycling series.' },
          { bold: 'Boolean Logic', desc: 'Verify constraint validity to reveal valid moves.' },
        ];
      case 10:
        return [
          { bold: 'Engineering Design', desc: 'Alter the physical grid structure using modular path tiles.' },
          { bold: 'Barrier Logic', desc: 'Place Blocks to restrict entry, or Bridges to create escape routes.' },
          { bold: 'System Connectivity', desc: 'Build connected corridors to safe areas.' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6 bg-[#FAF7F2]">
      {/* Top Bar Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <button
            onClick={onChangeSetup}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Setup
          </button>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>{idea.title}</span>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              IDEA {ideaId}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {version.toUpperCase()} VERSION · {format.toUpperCase()} FORMAT ·{' '}
            <span className="text-emerald-600 font-bold">{goatTeamName} (Goats)</span> vs{' '}
            <span className="text-rose-600 font-bold">{tigerTeamName} (Tigers)</span>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setClassroomMode(p => !p)}
            className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
              classroomMode
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Classroom Mode
          </button>
          <button
            onClick={() => setTeacherMode(p => !p)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
              teacherMode
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-amber-700 border-amber-200 hover:border-amber-300'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Teacher Mode
          </button>
          <button
            onClick={() => setShowSTEMExplanations(p => !p)}
            className={`px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
              showSTEMExplanations
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            STEM Hub
          </button>
          <button
            onClick={() => setShowRules(p => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300 cursor-pointer"
          >
            {showRules ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>Rules Guide</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Playfield Area */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Turn Strip */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className={`w-3.5 h-3.5 rounded-full shadow-inner animate-pulse ${
                  isGoatTurn ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-rose-500 ring-4 ring-rose-100'
                }`}
              />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Active Turn
                </p>
                <p className={`font-black text-lg leading-none ${isGoatTurn ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isGoatTurn ? `🐐 ${goatTeamName}` : `🐯 ${tigerTeamName}`}
                </p>
              </div>
            </div>

            {/* Custom Control Actions Bar */}
            <div className="flex items-center gap-2">
              {/* Idea 4: Rest Action */}
              {ideaId === 4 && selectedPiece && (
                <button
                  onClick={handleRestAction}
                  className="flex items-center gap-1.5 bg-sky-50 text-sky-700 border-2 border-sky-200 px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-sky-100 cursor-pointer transition-all shadow-sm"
                >
                  <Zap className="w-4 h-4 animate-bounce" />
                  <span>Rest Piece (+2⚡)</span>
                </button>
              )}

              {/* Idea 10: Structural Engineering Action Center */}
              {ideaId === 10 && (
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mr-1 select-none">
                    🏗️ Actions:
                  </span>
                  
                  {/* Action 1: Move Piece */}
                  <button
                    onClick={() => {
                      setPlacementMode('none');
                      setSelectedPiece(null);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      placementMode === 'none'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>🚶 Move Piece</span>
                  </button>

                  {/* Action 2: Place Bridge (Goats only) */}
                  {isGoatTurn && (
                    <button
                      disabled={(extraState.goatBridgesLeft ?? 0) <= 0}
                      onClick={() => setPlacementMode(p => (p === 'bridge' ? 'none' : 'bridge'))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border ${
                        placementMode === 'bridge'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-emerald-600 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Place Bridge ({extraState.goatBridgesLeft ?? 0})</span>
                    </button>
                  )}

                  {/* Action 3: Place Block (Tigers only) */}
                  {!isGoatTurn && (
                    <button
                      disabled={(extraState.tigerBlocksLeft ?? 0) <= 0}
                      onClick={() => setPlacementMode(p => (p === 'block' ? 'none' : 'block'))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border ${
                        placementMode === 'block'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-rose-600 border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Place Block ({extraState.tigerBlocksLeft ?? 0})</span>
                    </button>
                  )}

                  {/* Action 4: Rotate Tile (Standard & Advanced only) */}
                  {version !== 'beginner' && (
                    <button
                      onClick={() => setPlacementMode(p => (p === 'rotate' ? 'none' : 'rotate'))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        placementMode === 'rotate'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-indigo-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <span>🔄 Rotate Path</span>
                    </button>
                  )}

                  {/* Action 5: Remove Tile (Advanced only) */}
                  {version === 'advanced' && (
                    <button
                      onClick={() => setPlacementMode(p => (p === 'remove' ? 'none' : 'remove'))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        placementMode === 'remove'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-rose-700 border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      <span>❌ Remove Tile</span>
                    </button>
                  )}
                </div>
              )}

              {/* Undo & Reset buttons */}
              <button
                onClick={handleUndo}
                disabled={!history.length}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold text-xs hover:border-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Undo
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reset this game match? All progress will be lost.')) handleReset();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-rose-100 bg-white text-rose-600 font-bold text-xs hover:border-rose-300 cursor-pointer transition-all shadow-xs"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Winner and Termination Screen */}
          {winner && (
            <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center gap-4 text-center shadow-lg animate-fade-in bg-gradient-to-b from-white to-emerald-50/10">
              <Award
                className={`w-16 h-16 ${
                  winner === 'goat' ? 'text-emerald-500 animate-pulse' : winner === 'tiger' ? 'text-rose-500 animate-bounce' : 'text-slate-400'
                }`}
              />
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                {winner === 'goat'
                  ? `🐐 Goats Win!`
                  : winner === 'tiger'
                  ? `🐯 Tigers Win!`
                  : `🏜️ Ecosystem Collapse!`}
              </h2>
              <p className="text-slate-500 text-sm max-w-md leading-relaxed font-medium">
                {winner === 'goat'
                  ? `The Goats successfully built defensive walls, sequences, or survived all tiger hunting cycles.`
                  : winner === 'tiger'
                  ? `The Tigers successfully captured enough goats to secure their food dominance.`
                  : `Resources were depleted completely. The forest became uninhabitable and both teams lost. Balance reached 0.`}
              </p>
              <div className="flex gap-3">
                <button onClick={handleReset} className="btn-primary px-8 py-2.5 text-sm font-extrabold shadow-md cursor-pointer">
                  Play Again
                </button>
                <button onClick={onChangeSetup} className="btn-secondary px-6 py-2.5 text-sm font-extrabold border-2 border-slate-200 bg-white hover:border-slate-300 cursor-pointer">
                  Back to Setup
                </button>
              </div>
            </div>
          )}

          {/* Interactive Custom Game Dashboards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Idea 6: Probability Roll & Prediction Dashboard */}
            {ideaId === 6 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Dice5 className="w-4 h-4 text-slate-500" />
                  <span>Probability Simulator</span>
                </h3>
                <div className="bg-[#FAF9F6] border border-slate-100 rounded-xl p-3.5 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-600">
                    Next Action Prediction:
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setExtraState({ ...extraState, prediction: 'success' })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        extraState.prediction === 'success'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-white text-indigo-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      Predict Success (High Chance)
                    </button>
                    <button
                      onClick={() => setExtraState({ ...extraState, prediction: 'fail' })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        extraState.prediction === 'fail'
                          ? 'bg-amber-600 text-white border-amber-600 shadow'
                          : 'bg-white text-amber-600 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      Predict Fail (Low Chance)
                    </button>
                  </div>
                  {extraState.prediction && (
                    <p className="text-[10px] text-indigo-600 font-extrabold mt-1">
                      Currently Selected: {extraState.prediction === 'success' ? 'Predict Success ✓' : 'Predict Fail ✗'}
                    </p>
                  )}
                </div>

                {/* Prediction Token Wallet */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-bold">
                  <div className="text-emerald-700">
                    🐐 Goat Tokens: <span className="font-extrabold text-xs">{extraState.predictionTokens?.goat ?? 0}</span>
                  </div>
                  <div className="text-rose-700">
                    🐯 Tiger Tokens: <span className="font-extrabold text-xs">{extraState.predictionTokens?.tiger ?? 0}</span>
                  </div>
                </div>

                {extraState.lastDiceRoll !== null && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Last Dice Roll
                      </p>
                      <p className="text-sm font-black text-slate-700">
                        Rolled a <span className="text-emerald-600 font-extrabold text-base">🎲 {extraState.lastDiceRoll}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Outcome Check
                      </p>
                      <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                        {extraState.rollResult === 'success' ? 'Captured ✓' : 'Escaped 🏃'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Idea 7: Ecosystem Health Circular Bar */}
            {ideaId === 7 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Ecosystem Balance Meter</span>
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-2xl font-black text-slate-800">
                        {extraState.ecosystemBalance}%
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Forest Health Status
                      </p>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                        extraState.ecosystemBalance >= 60
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : extraState.ecosystemBalance >= 30
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'
                      }`}
                    >
                      {extraState.ecosystemBalance >= 60
                        ? 'Healthy'
                        : extraState.ecosystemBalance >= 30
                        ? 'Degrading'
                        : 'CRITICAL WARNING!'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        extraState.ecosystemBalance >= 60
                          ? 'bg-emerald-500'
                          : extraState.ecosystemBalance >= 30
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${extraState.ecosystemBalance}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold italic bg-[#FAF9F6] p-2.5 rounded-xl border border-slate-100">
                  {extraState.lastEvent}
                </p>
              </div>
            )}

            {/* Idea 8: Zone Tallies (Data Hunt) Dashboard */}
            {ideaId === 8 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>Zone Data Tallymark Panel</span>
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
                  <div className="bg-[#FAF9F6] border border-slate-100 rounded-xl p-2">
                    <span className="text-lg font-black text-indigo-600">
                      {extraState.zoneTallies?.corner ?? 0}
                    </span>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      Corners
                    </p>
                  </div>
                  <div className="bg-[#FAF9F6] border border-slate-100 rounded-xl p-2">
                    <span className="text-lg font-black text-emerald-600">
                      {extraState.zoneTallies?.edge ?? 0}
                    </span>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      Edges
                    </p>
                  </div>
                  <div className="bg-[#FAF9F6] border border-slate-100 rounded-xl p-2">
                    <span className="text-lg font-black text-amber-600">
                      {extraState.zoneTallies?.center ?? 0}
                    </span>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      Center
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between">
                  <span>Goat Escapes: {extraState.escapesCount ?? extraState.escapes ?? 0}</span>
                  <span>Tiger Captures: {extraState.capturesCount ?? extraState.captures ?? 0}</span>
                </div>

                {/* Prediction Hub */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    🔮 {currentPlayer === 'goat' ? 'Goat' : 'Tiger'} Prediction Hub
                  </h4>
                  {extraState.prediction ? (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider">Active Prediction</span>
                        <p className="font-extrabold text-indigo-900 leading-tight">{extraState.predictionName}</p>
                      </div>
                      <button
                        onClick={() => {
                          setExtraState({ ...extraState, prediction: '', predictionName: '' });
                          setLastCalculation('Prediction cleared.');
                        }}
                        className="text-[9px] text-indigo-500 underline font-bold cursor-pointer hover:text-indigo-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-slate-500 font-semibold leading-tight">Predict your opponent's action to earn 1 Prediction Token:</p>
                      <div className="flex flex-wrap gap-1">
                        {currentPlayer === 'goat' ? (
                          <>
                            <button
                              onClick={() => handleMakePrediction('tiger_attack', 'Tiger will capture a goat')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              ⚔️ Capture
                            </button>
                            <button
                              onClick={() => handleMakePrediction('tiger_nearest', 'Tiger will move toward nearest goat')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              🎯 Near Goat
                            </button>
                            <button
                              onClick={() => handleMakePrediction('tiger_center', 'Tiger will move to Center')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              🏛️ Center
                            </button>
                            <button
                              onClick={() => handleMakePrediction('tiger_retreat', 'Tiger will move away/retreat')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              🏃 Retreat
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleMakePrediction('goat_escape', 'Goat will escape tiger proximity')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              🏃 Escape
                            </button>
                            <button
                              onClick={() => handleMakePrediction('goat_group', 'Goat will group with other goats')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              🛡️ Group Up
                            </button>
                            <button
                              onClick={() => handleMakePrediction('goat_edge', 'Goat will move to Edge zone')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              🟩 Edge Zone
                            </button>
                            <button
                              onClick={() => handleMakePrediction('goat_block', 'Goat will form block adjacent to Tiger')}
                              className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                            >
                              🧱 Block Tiger
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Data Token Wallet */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    💳 Data Token Wallet
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 space-y-1">
                      <p className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">Goat Tokens</p>
                      <div className="flex justify-between text-slate-700">
                        <span>🏃 Escapes:</span>
                        <span className="font-extrabold text-emerald-700">{extraState.escapeTokens ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>🧱 Blocks:</span>
                        <span className="font-extrabold text-emerald-700">{extraState.blockTokens ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>🔮 Predictions:</span>
                        <span className="font-extrabold text-emerald-700">{extraState.predictionTokensGoat ?? 0}</span>
                      </div>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2 space-y-1">
                      <p className="text-[8px] font-black text-rose-800 uppercase tracking-widest">Tiger Tokens</p>
                      <div className="flex justify-between text-slate-700">
                        <span>🍗 Attacks:</span>
                        <span className="font-extrabold text-rose-700">{extraState.attackTokens ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>🏛️ Center Moves:</span>
                        <span className="font-extrabold text-rose-700">{extraState.tigerCenterMoveTokens ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>🔮 Predictions:</span>
                        <span className="font-extrabold text-rose-700">{extraState.predictionTokensTiger ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Power-up Store */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>🛒 Power-up Store</span>
                    {extraState.activePower && (
                      <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                        Active: {extraState.activePower}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {currentPlayer === 'goat' ? (
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          disabled={!!extraState.activePower || (extraState.escapeTokens ?? 0) < 3}
                          onClick={() => {
                            recordHistory(pieces, moveLog);
                            setExtraState({
                              ...extraState,
                              escapeTokens: extraState.escapeTokens - 3,
                              activePower: 'safeStep'
                            });
                            setLastCalculation('Goats activated Safe Step! Range-2 movement enabled.');
                          }}
                          className={`p-1 rounded-lg border text-[9px] font-bold text-center flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                            extraState.activePower === 'safeStep'
                              ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold shadow'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                          title="Cost: 3 Escape Tokens. Allows range-2 movement for a goat."
                        >
                          <span className="text-xs">🏃</span>
                          <span className="font-black leading-none mt-0.5">Safe Step</span>
                          <span className="text-[7px] text-slate-400 mt-0.5">3 Escape</span>
                        </button>

                        <button
                          disabled={!!extraState.activePower || (extraState.blockTokens ?? 0) < 3}
                          onClick={() => {
                            recordHistory(pieces, moveLog);
                            setExtraState({
                              ...extraState,
                              blockTokens: extraState.blockTokens - 3,
                              activePower: 'strongBlock'
                            });
                            setLastCalculation('Goats activated Strong Block! Select adjacent empty cell to block.');
                          }}
                          className={`p-1 rounded-lg border text-[9px] font-bold text-center flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                            extraState.activePower === 'strongBlock'
                              ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold shadow'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                          title="Cost: 3 Block Tokens. Place a block that lasts 1 round."
                        >
                          <span className="text-xs">🧱</span>
                          <span className="font-black leading-none mt-0.5">Strong Block</span>
                          <span className="text-[7px] text-slate-400 mt-0.5">3 Block</span>
                        </button>

                        <button
                          disabled={!!extraState.activePower || (extraState.predictionTokensGoat ?? 0) < 2}
                          onClick={() => {
                            recordHistory(pieces, moveLog);
                            setExtraState({
                              ...extraState,
                              predictionTokensGoat: extraState.predictionTokensGoat - 2,
                              activePower: 'smartMove'
                            });
                            setLastCalculation('Goats activated Smart Move! Gain capture immunity.');
                          }}
                          className={`p-1 rounded-lg border text-[9px] font-bold text-center flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                            extraState.activePower === 'smartMove'
                              ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold shadow'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                          title="Cost: 2 Prediction Tokens. Gain capture immunity."
                        >
                          <span className="text-xs">👁️</span>
                          <span className="font-black leading-none mt-0.5">Smart Move</span>
                          <span className="text-[7px] text-slate-400 mt-0.5">2 Predict</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          disabled={!!extraState.activePower || (extraState.attackTokens ?? 0) < 3}
                          onClick={() => {
                            recordHistory(pieces, moveLog);
                            setExtraState({
                              ...extraState,
                              attackTokens: extraState.attackTokens - 3,
                              activePower: 'focusedHunt'
                            });
                            setLastCalculation('Tigers activated Focused Hunt! Leap capture range increased to 2.');
                          }}
                          className={`p-1 rounded-lg border text-[9px] font-bold text-center flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                            extraState.activePower === 'focusedHunt'
                              ? 'bg-rose-600 border-rose-600 text-white font-extrabold shadow'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                          title="Cost: 3 Attack Tokens. Leap capture over an empty cell to a goat."
                        >
                          <span className="text-xs">🎯</span>
                          <span className="font-black leading-none mt-0.5">Focused Hunt</span>
                          <span className="text-[7px] text-slate-400 mt-0.5">3 Attack</span>
                        </button>

                        <button
                          disabled={!!extraState.activePower || (extraState.tigerCenterMoveTokens ?? 0) < 3}
                          onClick={() => {
                            recordHistory(pieces, moveLog);
                            setExtraState({
                              ...extraState,
                              tigerCenterMoveTokens: extraState.tigerCenterMoveTokens - 3,
                              activePower: 'centerControl'
                            });
                            setLastCalculation('Tigers activated Center Control! Center is blocked for goats.');
                          }}
                          className={`p-1 rounded-lg border text-[9px] font-bold text-center flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                            extraState.activePower === 'centerControl'
                              ? 'bg-rose-600 border-rose-600 text-white font-extrabold shadow'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                          title="Cost: 3 Center Tokens. Blocks Center node for goats."
                        >
                          <span className="text-xs">🏛️</span>
                          <span className="font-black leading-none mt-0.5">Center Control</span>
                          <span className="text-[7px] text-slate-400 mt-0.5">3 Center</span>
                        </button>

                        <button
                          disabled={!!extraState.activePower || (extraState.predictionTokensTiger ?? 0) < 2}
                          onClick={() => {
                            recordHistory(pieces, moveLog);
                            setExtraState({
                              ...extraState,
                              predictionTokensTiger: extraState.predictionTokensTiger - 2,
                              activePower: 'ambush'
                            });
                            setLastCalculation('Tigers activated Ambush! Tiger can make a range-2 movement.');
                          }}
                          className={`p-1 rounded-lg border text-[9px] font-bold text-center flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                            extraState.activePower === 'ambush'
                              ? 'bg-rose-600 border-rose-600 text-white font-extrabold shadow'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                          title="Cost: 2 Prediction Tokens. Allows double-step movement."
                        >
                          <span className="text-xs">⚡</span>
                          <span className="font-black leading-none mt-0.5">Ambush</span>
                          <span className="text-[7px] text-slate-400 mt-0.5">2 Predict</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Idea 9: Logic Lab Rules banner */}
            {ideaId === 9 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Logic Lab Rule deck</span>
                </h3>

                {(() => {
                  const card = RULE_DECK[extraState.activeRuleIndex ?? 0];
                  const nextCard = RULE_DECK[(extraState.activeRuleIndex + 1) % RULE_DECK.length];
                  return (
                    <div className="space-y-3.5">
                      {/* Active Card */}
                      <div className={`p-4 rounded-xl border-2 shadow-xs ${card.color}`}>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-white/70 px-1.5 rounded shadow-3xs leading-none">
                            ACTIVE
                          </span>
                          <span className="text-xs font-black text-slate-500">Condition</span>
                        </div>
                        <h4 className="text-base font-extrabold tracking-tight mt-1">
                          {card.name}
                        </h4>
                        <p className="text-xs font-medium opacity-90 mt-1 leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      {/* Next queue preview */}
                      <div className="bg-[#FAF9F6] border border-slate-200 p-2.5 rounded-xl text-[11px] font-bold text-slate-500 flex justify-between items-center">
                        <span>Next up in queue:</span>
                        <span className="text-slate-700 bg-white border border-slate-100 px-2 py-0.5 rounded shadow-3xs">
                          {nextCard.name}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Interactive Game Board */}
          <GameBoard
            gridSize={preset.gridSize}
            pieces={pieces}
            cellNumbers={preset.cellNumbers}
            activeWalls={
              ideaId === 1
                ? (extraState.activeWalls || [])
                : [] // wall glow logic for other ideas
            }
            protectedGoatPositions={activeProtectedGoats}
            selectedPiece={selectedPiece}
            moveHighlights={moveHighlights}
            captureHighlights={captureHighlights}
            wallHighlights={wallHighlights}
            onCellClick={handleCellClick}
            classroomMode={classroomMode}
            gridCells={gridCells}
            ideaId={ideaId}
            version={version}
            extraState={extraState}
          />
        </div>

        {/* Sidebar Info Area */}
        <div className="lg:col-span-4 space-y-4">
          {/* STEM Panel */}
          <div className="glass-panel p-4 space-y-4">
            <h2 className="text-sm font-black text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>STEM Inquiry Center</span>
            </h2>

            {/* Calculations Log */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 shadow-inner">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Active Equation / Tally log
              </p>
              <p className="font-mono text-xs font-black text-slate-800 leading-snug break-words mt-1">
                {lastCalculation || 'Waiting for first movement...'}
              </p>
            </div>

            {/* Metrics Bars */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span className="text-rose-600">🐯 Tiger captures</span>
                  <span className="text-slate-500">
                    {capturedGoatsCount} / {preset.tigerCapturesRequired}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-rose-500"
                    style={{ width: `${Math.min((capturedGoatsCount / preset.tigerCapturesRequired) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span className="text-emerald-600">🐐 Goat turns survived</span>
                  <span className="text-slate-500">
                    {goatTurnsCount} / {preset.goatSurvivalTurns}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                    style={{ width: `${Math.min((goatTurnsCount / preset.goatSurvivalTurns) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {showSTEMExplanations && (
              <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  How STEM integrates into Idea {ideaId}
                </p>
                <ul className="space-y-2 text-xs text-slate-500 leading-relaxed pl-4 list-disc font-medium">
                  {getStemExplanations().map((exp, idx) => (
                    <li key={idx}>
                      <strong className="text-slate-700">{exp.bold}</strong>: {exp.desc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Move Log list */}
          <MoveLog
            moveLog={moveLog}
            onClearHistory={handleReset}
            goatTeamName={goatTeamName}
            tigerTeamName={tigerTeamName}
          />

          {/* Classroom Mode Panel */}
          {classroomMode && (
            <ClassroomModePanel
              currentPlayer={currentPlayer}
              hasSelectedPiece={!!selectedPiece}
              goatTeamName={goatTeamName}
              tigerTeamName={tigerTeamName}
              turnNumber={moveLog.length}
              logicEngine={logicEngine}
            />
          )}

          {/* Teacher Mode Panel */}
          {teacherMode && (() => {
            const teacherNote = logicEngine.getTeacherNote();
            return (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-700" />
                  <h3 className="text-sm font-black text-amber-800">Teacher Mode</h3>
                  <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide ml-auto">Active</span>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">STEM Concept</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{teacherNote.stemConcept}</p>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">What to Observe</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{teacherNote.observations}</p>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">Questions to Ask Students</p>
                  <ul className="space-y-1 pl-3 list-disc">
                    {teacherNote.questions.map((q, i) => (
                      <li key={i} className="text-xs text-slate-600">{q}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-100 border border-amber-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide mb-1">Discussion Prompt</p>
                  <p className="text-sm font-bold text-amber-900 italic">"{teacherNote.discussionPrompt}"</p>
                </div>
              </div>
            );
          })()}

          {/* Rules overlay panel */}
          {showRules && (
            <RulesPanel
              ideaId={ideaId}
              version={version}
              logicEngine={logicEngine}
              onClose={() => setShowRules(false)}
            />
          )}
        </div>
      </div>

      {/* Premium Digital Dice Roll Battle Overlay (Idea 6) */}
      {diceBattleState?.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-gradient-to-b from-slate-900 to-slate-955 border border-slate-800 rounded-3xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden space-y-6">
            
            {/* Glowing neon decorative background */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Title */}
            <div>
              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Probability Dice Arena
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                TIGER CAPTURE BATTLE
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto font-medium">
                Tigers must roll equal to or higher than the target threshold to execute a capture. Terrains modify these chances.
              </p>
            </div>

            {/* Attacker vs Target details */}
            <div className="grid grid-cols-7 items-center gap-2 bg-slate-800/40 border border-slate-800 rounded-2xl p-4">
              <div className="col-span-3 text-center">
                <div className="text-3xl animate-bounce-gentle">🐯</div>
                <div className="text-xs font-black text-slate-300 mt-1">Tiger Attacker</div>
                <span className="inline-block text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded mt-1 font-bold">
                  {diceBattleState.attacker?.label} ({diceBattleState.attacker?.position})
                </span>
              </div>

              <div className="col-span-1 flex flex-col items-center justify-center text-slate-500 font-black italic text-lg select-none">
                VS
              </div>

              <div className="col-span-3 text-center">
                <div className="text-3xl animate-pulse-gentle">🐐</div>
                <div className="text-xs font-black text-slate-300 mt-1">Goat Target</div>
                <span className="inline-block text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-1 font-bold">
                  {diceBattleState.target?.label} ({diceBattleState.target?.position})
                </span>
              </div>
            </div>

            {/* Threshold & Chance Dial */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Capture Chance Level:</span>
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-black uppercase tracking-wider ${
                  diceBattleState.activeChance === 'High'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : diceBattleState.activeChance === 'Medium'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {diceBattleState.activeChance}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs font-bold border-t border-slate-800/60 pt-3">
                <span className="text-slate-400">Winning Dice Outcomes:</span>
                <span className="text-indigo-400 font-extrabold">
                  🎲 {diceBattleState.threshold}+ (i.e. {Array.from({ length: 7 - diceBattleState.threshold }, (_, i) => diceBattleState.threshold + i).join(', ')})
                </span>
              </div>

              {/* Progress Indicator Dots */}
              <div className="flex justify-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6].map(num => {
                  const isWinning = num >= diceBattleState.threshold;
                  return (
                    <div
                      key={num}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-extrabold shadow-sm select-none transition-all ${
                        isWinning
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 scale-105'
                          : 'bg-slate-850 border-slate-800 text-slate-500 opacity-55'
                      }`}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-indigo-400 font-semibold italic">
                ℹ️ Modifier details: {diceBattleState.modifierMsg}
              </p>
            </div>

            {/* Prediction Panel */}
            {!battleOutcome && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs font-black text-slate-300">
                  Step 1: Predict the outcome! Correct predictions earn +1 token.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setUserPrediction('success')}
                    className={`flex-1 max-w-[170px] py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      userPrediction === 'success'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-102 font-extrabold'
                        : 'bg-slate-800 text-slate-350 border-slate-750 hover:border-slate-655'
                    }`}
                  >
                    🚀 Success (Roll ≥ {diceBattleState.threshold})
                  </button>
                  <button
                    onClick={() => setUserPrediction('fail')}
                    className={`flex-1 max-w-[170px] py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      userPrediction === 'fail'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg scale-102 font-extrabold'
                        : 'bg-slate-800 text-slate-355 border-slate-750 hover:border-slate-655'
                    }`}
                  >
                    💥 Failure (Roll &lt; {diceBattleState.threshold})
                  </button>
                </div>
              </div>
            )}

            {/* Rolling Arena & Dice Graphics */}
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              {/* Giant Digital Dice Block */}
              <div className={`relative w-20 h-20 bg-white text-slate-900 border-4 border-slate-200 rounded-2xl shadow-xl flex items-center justify-center text-4xl font-extrabold select-none transition-all ${
                isRollingDice ? 'animate-spin cursor-not-allowed bg-indigo-50 border-indigo-300' : ''
              }`}>
                {isRollingDice ? (
                  <span>🎲</span>
                ) : currentRolledFace !== null ? (
                  <span>
                    {currentRolledFace === 1 && '⚀'}
                    {currentRolledFace === 2 && '⚁'}
                    {currentRolledFace === 3 && '⚂'}
                    {currentRolledFace === 4 && '⚃'}
                    {currentRolledFace === 5 && '⚄'}
                    {currentRolledFace === 6 && '⚅'}
                  </span>
                ) : (
                  <span className="text-slate-300">?</span>
                )}
              </div>

              {/* Rolling Triggers / Resolution */}
              {!battleOutcome ? (
                <button
                  disabled={isRollingDice}
                  onClick={() => {
                    setIsRollingDice(true);
                    let spins = 0;
                    const interval = setInterval(() => {
                      setCurrentRolledFace(Math.floor(Math.random() * 6) + 1);
                      spins++;
                      if (spins >= 10) {
                        clearInterval(interval);
                        const finalRoll = Math.floor(Math.random() * 6) + 1;
                        setCurrentRolledFace(finalRoll);
                        setIsRollingDice(false);
                        handleResolveDiceBattle(finalRoll);
                      }
                    }, 80);
                  }}
                  className="btn-primary w-full max-w-[240px] py-3 rounded-2xl text-sm font-extrabold shadow-md hover:scale-102 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRollingDice ? 'Shaking Dice Box...' : '🎲 Roll Dice Now'}
                </button>
              ) : (
                <div className="w-full space-y-4 animate-fade-in">
                  {/* Glowing Outcome Banner */}
                  <div className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 shadow-lg ${
                    battleOutcome.succeeded
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className="text-xs font-black tracking-widest uppercase">
                      BATTLE RESOLVED
                    </span>
                    <span className="text-xl font-black">
                      {battleOutcome.succeeded ? '🐯 GOAT CAPTURED!' : '🏃 GOAT ATTEMPTS ESCAPE!'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 mt-1">
                      Rolled a {battleOutcome.roll} (Threshold: {diceBattleState.threshold})
                    </span>
                  </div>

                  {/* Prediction Reward Status */}
                  {battleOutcome.predictionCorrect !== null && (
                    <p className={`text-xs font-bold ${battleOutcome.predictionCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {battleOutcome.predictionCorrect
                        ? '✓ Prediction Correct! Token added to wallet.'
                        : '✗ Prediction Incorrect. No tokens awarded.'}
                    </p>
                  )}

                  {/* Continue Button */}
                  <button
                    onClick={handleCloseDiceBattle}
                    className="btn-primary w-full max-w-[240px] py-2.5 rounded-2xl text-xs font-extrabold shadow cursor-pointer transition-all hover:scale-102"
                  >
                    {battleOutcome.isEscaping ? 'Proceed to Escape Route' : '✓ End Turn'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
