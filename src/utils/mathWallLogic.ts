import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { detectMathWalls } from './mathWallDetector';
import { checkTigerCapture } from './captureChecker';
import { getNeighbors, areAdjacent } from './boardHelpers';

export const mathWallLogic: GameLogicEngine = {
  initializeGame: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const gridCells: Record<string, CellConfig> = {};
    const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));

    for (let r = 1; r <= preset.gridSize; r++) {
      for (let c = 0; c < preset.gridSize; c++) {
        const coord = `${colLetters[c]}${r}`;
        gridCells[coord] = {
          coordinate: coord,
          number: preset.cellNumbers[coord] || 1,
        };
      }
    }

    return {
      pieces: JSON.parse(JSON.stringify(preset.startingPieces)),
      gridCells,
      extraState: {},
    };
  },

  getLegalMoves: (
    selectedPiece: Piece,
    pieces: Piece[],
    _gridCells: Record<string, CellConfig>,
    _currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    _extraState: any
  ): LegalMovesResult => {
    const preset = VERSION_PRESETS[version];
    const cellNumbers = preset.cellNumbers;
    const { protectedGoatPositions } = detectMathWalls(pieces, cellNumbers);
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);

    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];
    const wallHighlights: string[] = [];

    if (selectedPiece.type === 'goat') {
      adj.forEach(c => {
        if (!pieces.some(p => p.position === c)) {
          moveHighlights.push(c);
          // Highlight potential walls
          const sim = pieces.map(p => p.id === selectedPiece.id ? { ...p, position: c } : p);
          if (detectMathWalls(sim, cellNumbers).activeWalls.some(w => w.from === c || w.to === c)) {
            wallHighlights.push(c);
          }
        }
      });
    } else {
      adj.forEach(c => {
        const p = pieces.find(x => x.position === c);
        if (!p) {
          moveHighlights.push(c);
        } else if (p.type === 'goat') {
          const isProtected = protectedGoatPositions.has(c);
          const check = checkTigerCapture(selectedPiece.position, c, isProtected, cellNumbers);
          if (check.allowed) {
            captureHighlights.push(c);
          }
        }
      });
    }

    return { moveHighlights, captureHighlights, wallHighlights };
  },

  applyMove: (
    selectedPiece: Piece,
    toCoord: string,
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    _currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    extraState: any,
    isCapture: boolean
  ): LogicResult => {
    const preset = VERSION_PRESETS[version];
    const cellNumbers = preset.cellNumbers;
    const { activeWalls, protectedGoatPositions } = detectMathWalls(pieces, cellNumbers);

    let updatedPieces = [...pieces];
    let calcMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';
    let wallStatus: 'none' | 'formed' | 'broken' | 'active' = 'none';

    if (isCapture) {
      const goat = pieces.find(p => p.position === toCoord)!;
      const isProtected = protectedGoatPositions.has(toCoord);
      const check = checkTigerCapture(selectedPiece.position, toCoord, isProtected, cellNumbers);

      updatedPieces = updatedPieces.filter(p => p.id !== goat.id).map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      captureStatus = 'success';
      calcMsg = `${check.calculation} → Goat captured!`;
      if (isProtected) {
        wallStatus = 'broken';
      }
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      const mv = cellNumbers[toCoord] || 0;

      if (selectedPiece.type === 'goat') {
        const newWalls = detectMathWalls(updatedPieces, cellNumbers).activeWalls;
        const formed = newWalls.find(w => (w.from === toCoord || w.to === toCoord) && !activeWalls.some(aw => aw.id === w.id));
        if (formed) {
          wallStatus = 'formed';
          calcMsg = `Math Wall: ${cellNumbers[formed.from]} + ${cellNumbers[formed.to]} = ${formed.sum} ✓`;
        } else {
          const adj2 = updatedPieces.filter(p => p.type === 'goat' && p.id !== selectedPiece.id && areAdjacent(toCoord, p.position));
          calcMsg = adj2.length
             ? `Sum check: ${mv} + ${cellNumbers[adj2[0].position]} = ${mv + (cellNumbers[adj2[0].position] || 0)}`
             : `Goat → ${toCoord} (value ${mv})`;
        }
      } else {
        calcMsg = `Tiger → ${toCoord} (value ${mv})`;
      }
    }

    return {
      pieces: updatedPieces,
      gridCells,
      extraState,
      calculationMsg: calcMsg,
      captureStatus,
      wallStatus,
    };
  },

  detectProtection: (
    pieces: Piece[],
    _gridCells: Record<string, CellConfig>,
    version: GameVersion,
    _extraState: any
  ): Set<string> => {
    const preset = VERSION_PRESETS[version];
    return detectMathWalls(pieces, preset.cellNumbers).protectedGoatPositions;
  },

  checkWinCondition: (
    _pieces: Piece[],
    _gridCells: Record<string, CellConfig>,
    capturedGoatsCount: number,
    goatTurnsCount: number,
    version: GameVersion,
    _extraState: any,
    activeWallsCount: number
  ): 'goat' | 'tiger' | 'both-lose' | null => {
    const preset = VERSION_PRESETS[version];
    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns) return 'goat';
    if (activeWallsCount >= preset.goatActiveWallsRequired) return 'goat';
    return null;
  },

  generateStemMessage: (
    lastCalculation: string,
    _extraState: any
  ): string => {
    return lastCalculation;
  },
  checkCapture: (
    tigerCoord: string,
    goatCoord: string,
    isProtected: boolean,
    _extraState: any,
    version: GameVersion
  ) => {
    const preset = VERSION_PRESETS[version];
    const check = checkTigerCapture(tigerCoord, goatCoord, isProtected, preset.cellNumbers);
    return { allowed: check.allowed, calculation: check.calculation };
  },
  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    return {
      title: "Bagh-Bakri Math Wall Edition",
      studentGuide: [
        "Goat Team moves first! Select a goat and move it to any adjacent empty cell.",
        "Tigers move next to hunt Goats by matching arithmetic sums.",
        "Tigers can capture an unprotected goat if the Tiger value + Goat value is 6 or more.",
        "Goats protect themselves by standing next to each other to make a Math Wall.",
        "A Math Wall forms if adjacent Goats stand on numbers that add up to 7 or more.",
        "Protected Goats cannot be captured normally unless: Tiger + Goat numbers ≥ 8 (Wall break)."
      ],
      stemMathTitle: "Math Wall Formulae",
      stemMathFormula: [
        { label: "Normal Capture Check", formula: "Tiger Cell + Goat Cell ≥ 6" },
        { label: "Math Wall Protection", formula: "Goat 1 + Goat 2 ≥ 7" },
        { label: "Wall-Break Capture", formula: "Tiger + Protected Goat ≥ 8" }
      ],
      presets: [
        { name: "Grid Size", info: `${preset.gridSize}×${preset.gridSize} Board` },
        { name: "Starting Setup", info: `${preset.startingPieces.filter(p => p.type === 'tiger').length} Tigers & ${preset.startingPieces.filter(p => p.type === 'goat').length} Goats` },
        { name: "Win Target", info: `Survive ${preset.goatSurvivalTurns} turns or form ${preset.goatActiveWallsRequired} active Math Walls` }
      ]
    };
  },
  getTeacherNote: () => ({
    stemConcept: "Addition, inequalities (≥), number bonds, and spatial defense strategy.",
    observations: "Observe if students intentionally pair high-value Goats (4 and 5) to form secure walls, or place Goats on low-value numbers (1 or 2) making them vulnerable to easy captures.",
    questions: [
      "Which two goats make the strongest Math Wall?",
      "If a Tiger is on a 5, can it break a Math Wall made of 4 and 3?",
      "How does placing a goat on a 1 affect your team's defense?"
    ],
    discussionPrompt: "Which two goats make the strongest Math Wall?"
  }),
  getClassroomModeConfig: (_turnNumber: number) => {
    const prompts = [
      'Which Goat is protected? Check the gold wall lines.',
      'Can the Tiger break a Math Wall? Tiger + Goat ≥ 8?',
      'Which move creates the best Math Wall? Aim for sum ≥ 7.',
      'Which Tiger has the best capture? Look at adjacent Goats.',
      'If Goats block all Tigers, what is the best strategy?',
      'Does moving to a high-value cell (4–5) help more?',
    ];
    return {
      prompts,
      roles: [
        { role: 'Rule Checker', desc: 'Verify valid orthogonal and diagonal grid moves.' },
        { role: 'STEM Calculator', desc: 'Verify addition sums for captures (≥6) and walls (≥7).' },
        { role: 'Move Recorder', desc: 'Verify the turn is logged and update the sheet.' },
        { role: 'Strategy Explainer', desc: 'Justify the math and positional safety of the chosen move.' },
      ]
    };
  }
};
