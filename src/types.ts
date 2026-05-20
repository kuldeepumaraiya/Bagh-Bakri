export type GameVersion = 'beginner' | 'standard' | 'advanced';
export type PlayerFormat = '2-players' | '4-players' | 'classroom';
export type PieceType = 'tiger' | 'goat';

export interface Piece {
  id: string; // T1, T2, G1, G2
  type: PieceType;
  label: string; // "T1", "G1"
  position: string; // coordinate e.g. "C3"
}

export interface CellConfig {
  coordinate: string; // e.g. "A1"
  number: number; // 1 to 5
}

export interface MathWall {
  id: string; // "G1-G2"
  from: string; // e.g. "A1"
  to: string; // e.g. "B1"
  sum: number;
}

export interface GameSetupConfig {
  version: GameVersion;
  format: PlayerFormat;
  goatTeamName: string;
  tigerTeamName: string;
}

export interface MoveLogEntry {
  turnNumber: number;
  team: 'Goats' | 'Tigers';
  pieceMoved: string;
  from: string;
  to: string;
  captureStatus: 'none' | 'success' | 'blocked';
  mathWallStatus: 'none' | 'formed' | 'broken' | 'active';
  calculationShown: string;
  activeMathWallsCount: number;
}

export interface GameHistorySnapshot {
  turnNumber: number;
  currentPlayer: 'goat' | 'tiger';
  pieces: Piece[];
  capturedGoatsCount: number;
  goatTurnsCount: number;
  lastCalculation: string;
  moveLog: MoveLogEntry[];
}
