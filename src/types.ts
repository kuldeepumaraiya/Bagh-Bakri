export type GameVersion = 'beginner' | 'standard' | 'advanced';
export type PlayerFormat = '2-players' | '4-players' | 'classroom';
export type PieceType = 'tiger' | 'goat';

export interface Piece {
  id: string; // T1, T2, G1, G2
  type: PieceType;
  label: string; // "T1", "G1"
  position: string; // coordinate e.g. "C3"
  energy?: number; // Idea 4 (Energy Quest)
  hunger?: number; // Idea 7 (Ecosystem Balance)
  thirsty?: boolean; // Idea 7 (Ecosystem Balance)
  turnsSinceWater?: number; // Idea 7 (Ecosystem Balance)
  hasShield?: boolean; // Idea 4 (Energy Quest)
  hasSafeStepUsed?: boolean; // Idea 8 (Data Hunt)
  hasFocusedHuntUsed?: boolean; // Idea 8 (Data Hunt)
}

export interface CellConfig {
  coordinate: string; // e.g. "A1"
  number: number; // 1 to 5 (Math Wall, Number Trail, Logic Lab)
  symbol?: 'circle' | 'triangle' | 'square' | 'star'; // Idea 3 (Pattern Trail)
  habitat?: 'grassland' | 'forest' | 'hill' | 'water' | 'dry land' | 'corner' | 'edge' | 'center'; // Idea 7 (Ecosystem Balance) & Idea 8 (Data Hunt)
  grassCount?: number; // Idea 7 (Ecosystem Balance grass tokens)
  bridgeDirections?: string[]; // Idea 10 (Build-a-Board connected directions: e.g. "N", "S", "E", "W")
  isBlocked?: boolean; // Idea 10 (Build-a-Board blocked paths)
  tileType?: 'straight' | 'corner' | 'crossroad' | 'block' | 'bridge' | 'safe' | 'tiger-den' | 'one-way'; // Idea 10
  rotation?: number; // Idea 10 (0, 1, 2, 3 clockwise)
}

export interface MathWall {
  id: string; // "G1-G2"
  from: string; // e.g. "A1"
  to: string; // e.g. "B1"
  sum: number;
}

export interface GameSetupConfig {
  ideaId: number; // 1 to 10
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
  ecosystemBalance?: number; // Idea 7
  goatEnergy?: Record<string, number>; // Idea 4
  tigerEnergy?: Record<string, number>; // Idea 4
  rulesDeck?: string[]; // Idea 9
  predictions?: Record<string, string>; // Idea 8
  gridCells?: Record<string, CellConfig>; // Idea 7 & 10
  extraState?: any; // Generic container for dynamic logic states
}
