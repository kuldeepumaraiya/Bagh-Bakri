import type { GameVersion, Piece, CellConfig } from '../types';

export interface LogicResult {
  pieces: Piece[];
  gridCells: Record<string, CellConfig>;
  extraState: any;
  calculationMsg: string;
  captureStatus: 'none' | 'success' | 'blocked';
  wallStatus: 'none' | 'formed' | 'broken' | 'active';
}

export interface LegalMovesResult {
  moveHighlights: string[];
  captureHighlights: string[];
  wallHighlights?: string[];
}

export interface HowToPlayGuide {
  title: string;
  studentGuide: string[];
  stemMathTitle: string;
  stemMathFormula: { label: string; formula: string }[];
  presets: { name: string; info: string }[];
}

export interface TeacherNote {
  stemConcept: string;
  observations: string;
  questions: string[];
  discussionPrompt: string;
}

export interface GameLogicEngine {
  initializeGame: (version: GameVersion) => {
    pieces: Piece[];
    gridCells: Record<string, CellConfig>;
    extraState: any;
  };
  getLegalMoves: (
    selectedPiece: Piece,
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    extraState: any
  ) => LegalMovesResult;
  applyMove: (
    selectedPiece: Piece,
    toCoord: string,
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    extraState: any,
    isCapture: boolean
  ) => LogicResult;
  detectProtection: (
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    version: GameVersion,
    extraState: any
  ) => Set<string>;
  checkWinCondition: (
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    capturedGoatsCount: number,
    goatTurnsCount: number,
    version: GameVersion,
    extraState: any,
    activeWallsCount: number
  ) => 'goat' | 'tiger' | 'both-lose' | null;
  generateStemMessage: (
    lastCalculation: string,
    extraState: any
  ) => string;
  // Dynamic educational content
  getHowToPlayGuide: (version: GameVersion) => HowToPlayGuide;
  getTeacherNote: () => TeacherNote;
  getClassroomModeConfig?: (turnNumber: number) => {
    prompts: string[];
    roles: { role: string; desc: string }[];
  };
  checkCapture?: (
    tigerCoord: string,
    goatCoord: string,
    isProtected: boolean,
    extraState: any,
    version: GameVersion
  ) => { allowed: boolean; calculation: string };
}

// Lazy load or import engines to prevent circular dependencies
import { mathWallLogic } from './mathWallLogic';
import { numberTrailLogic } from './numberTrailLogic';
import { patternTrailLogic } from './patternTrailLogic';
import { energyQuestLogic } from './energyQuestLogic';
import { geometryWallLogic } from './geometryWallLogic';
import { probabilityCaptureLogic } from './probabilityCaptureLogic';
import { ecosystemBalanceLogic } from './ecosystemBalanceLogic';
import { dataHuntLogic } from './dataHuntLogic';
import { logicLabLogic } from './logicLabLogic';
import { buildBoardLogic } from './buildBoardLogic';

export const GAME_LOGIC_REGISTRY: Record<number, GameLogicEngine> = {
  1: mathWallLogic,
  2: numberTrailLogic,
  3: patternTrailLogic,
  4: energyQuestLogic,
  5: geometryWallLogic,
  6: probabilityCaptureLogic,
  7: ecosystemBalanceLogic,
  8: dataHuntLogic,
  9: logicLabLogic,
  10: buildBoardLogic,
};

export function getGameLogic(ideaId: number): GameLogicEngine {
  const engine = GAME_LOGIC_REGISTRY[ideaId];
  if (!engine) {
    // Fallback to Idea 1 to prevent hard crashes
    return GAME_LOGIC_REGISTRY[1];
  }
  return engine;
}
