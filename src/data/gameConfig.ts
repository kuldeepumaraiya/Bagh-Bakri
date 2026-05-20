import type { GameVersion, Piece } from '../types';

export interface VersionConfig {
  name: string;
  gridSize: number; // 5, 6, 7
  tigersCount: number;
  goatsCount: number;
  goatSurvivalTurns: number;
  goatActiveWallsRequired: number;
  tigerCapturesRequired: number;
  description: string;
  cellNumbers: Record<string, number>; // "A1" -> 1
  startingPieces: Piece[];
}

export const VERSION_PRESETS: Record<GameVersion, VersionConfig> = {
  beginner: {
    name: 'Beginner Version',
    gridSize: 5,
    tigersCount: 1,
    goatsCount: 4,
    goatSurvivalTurns: 8,
    goatActiveWallsRequired: 3,
    tigerCapturesRequired: 2,
    description: 'Best for first-time players and younger primary students. Fast gameplay with 1 Tiger and 4 Goats.',
    cellNumbers: {
      // Row 5
      "A5": 5, "B5": 2, "C5": 4, "D5": 1, "E5": 3,
      // Row 4
      "A4": 1, "B4": 3, "C4": 5, "D4": 2, "E4": 4,
      // Row 3
      "A3": 4, "B3": 1, "C3": 3, "D3": 5, "E3": 2,
      // Row 2
      "A2": 2, "B2": 4, "C2": 1, "D2": 3, "E2": 5,
      // Row 1
      "A1": 3, "B1": 5, "C1": 2, "D1": 4, "E1": 1
    },
    startingPieces: [
      { id: 'T1', type: 'tiger', label: 'T1', position: 'C3' },
      { id: 'G1', type: 'goat', label: 'G1', position: 'A1' },
      { id: 'G2', type: 'goat', label: 'G2', position: 'E1' },
      { id: 'G3', type: 'goat', label: 'G3', position: 'A5' },
      { id: 'G4', type: 'goat', label: 'G4', position: 'E5' }
    ]
  },
  standard: {
    name: 'Standard Version',
    gridSize: 6,
    tigersCount: 2,
    goatsCount: 8,
    goatSurvivalTurns: 12,
    goatActiveWallsRequired: 4,
    tigerCapturesRequired: 4,
    description: 'Best for regular classroom play. Tactical balance with 2 Tigers and 8 Goats.',
    cellNumbers: {
      // Row 6
      "A6": 5, "B6": 2, "C6": 4, "D6": 1, "E6": 3, "F6": 5,
      // Row 5
      "A5": 1, "B5": 3, "C5": 5, "D5": 2, "E5": 4, "F5": 1,
      // Row 4
      "A4": 4, "B4": 1, "C4": 3, "D4": 5, "E4": 2, "F4": 4,
      // Row 3
      "A3": 2, "B3": 4, "C3": 1, "D3": 3, "E3": 5, "F3": 2,
      // Row 2
      "A2": 3, "B2": 5, "C2": 2, "D2": 4, "E2": 1, "F2": 3,
      // Row 1
      "A1": 1, "B1": 2, "C1": 3, "D1": 4, "E1": 5, "F1": 1
    },
    startingPieces: [
      { id: 'T1', type: 'tiger', label: 'T1', position: 'C3' },
      { id: 'T2', type: 'tiger', label: 'T2', position: 'D4' },
      { id: 'G1', type: 'goat', label: 'G1', position: 'A1' },
      { id: 'G2', type: 'goat', label: 'G2', position: 'F1' },
      { id: 'G3', type: 'goat', label: 'G3', position: 'A6' },
      { id: 'G4', type: 'goat', label: 'G4', position: 'F6' },
      { id: 'G5', type: 'goat', label: 'G5', position: 'C1' },
      { id: 'G6', type: 'goat', label: 'G6', position: 'D6' },
      { id: 'G7', type: 'goat', label: 'G7', position: 'A3' },
      { id: 'G8', type: 'goat', label: 'G8', position: 'F4' }
    ]
  },
  advanced: {
    name: 'Advanced Version',
    gridSize: 7,
    tigersCount: 3,
    goatsCount: 12,
    goatSurvivalTurns: 15,
    goatActiveWallsRequired: 5,
    tigerCapturesRequired: 5,
    description: 'Best for older or more confident students. Deep strategy on a 7x7 board with 3 Tigers and 12 Goats.',
    cellNumbers: {
      // Row 7
      "A7": 5, "B7": 2, "C7": 4, "D7": 1, "E7": 3, "F7": 5, "G7": 2,
      // Row 6
      "A6": 1, "B6": 3, "C6": 5, "D6": 2, "E6": 4, "F6": 1, "G6": 3,
      // Row 5
      "A5": 4, "B5": 1, "C5": 3, "D5": 5, "E5": 2, "F5": 4, "G5": 1,
      // Row 4
      "A4": 2, "B4": 4, "C4": 1, "D4": 3, "E4": 5, "F4": 2, "G4": 4,
      // Row 3
      "A3": 3, "B3": 5, "C3": 2, "D3": 4, "E3": 1, "F3": 3, "G3": 5,
      // Row 2
      "A2": 5, "B2": 1, "C2": 4, "D2": 2, "E2": 3, "F2": 5, "G2": 1,
      // Row 1
      "A1": 1, "B1": 2, "C1": 3, "D1": 4, "E1": 5, "F1": 1, "G1": 2
    },
    startingPieces: [
      { id: 'T1', type: 'tiger', label: 'T1', position: 'C3' },
      { id: 'T2', type: 'tiger', label: 'T2', position: 'D4' },
      { id: 'T3', type: 'tiger', label: 'T3', position: 'E5' },
      { id: 'G1', type: 'goat', label: 'G1', position: 'A1' },
      { id: 'G2', type: 'goat', label: 'G2', position: 'G1' },
      { id: 'G3', type: 'goat', label: 'G3', position: 'A7' },
      { id: 'G4', type: 'goat', label: 'G4', position: 'G7' },
      { id: 'G5', type: 'goat', label: 'G5', position: 'C1' },
      { id: 'G6', type: 'goat', label: 'G6', position: 'E1' },
      { id: 'G7', type: 'goat', label: 'G7', position: 'C7' },
      { id: 'G8', type: 'goat', label: 'G8', position: 'E7' },
      { id: 'G9', type: 'goat', label: 'G9', position: 'A4' },
      { id: 'G10', type: 'goat', label: 'G10', position: 'G4' },
      { id: 'G11', type: 'goat', label: 'G11', position: 'B2' },
      { id: 'G12', type: 'goat', label: 'G12', position: 'F6' }
    ]
  }
};
