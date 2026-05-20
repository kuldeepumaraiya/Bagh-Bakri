import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors } from './boardHelpers';

// Find completed number trails
export function detectNumberTrails(
  pieces: Piece[],
  cellNumbers: Record<string, number>,
  version: GameVersion
) {
  const goats = pieces.filter(p => p.type === 'goat');
  const goatCoords = new Set(goats.map(g => g.position));
  const gridSize = VERSION_PRESETS[version].gridSize;

  let validSequences: number[][] = [];
  if (version === 'beginner') {
    validSequences = [[1, 2, 3]];
  } else if (version === 'standard') {
    validSequences = [[1, 2, 3], [2, 3, 4], [3, 4, 5]];
  } else {
    validSequences = [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]];
  }

  const completedTrails: string[][] = [];
  const protectedGoats = new Set<string>();
  const middleGoats = new Map<string, { trail: string[]; targetGoatVal: number }>();

  // Check each sequence
  validSequences.forEach(seq => {
    const dfs = (currCoord: string, seqIdx: number, path: string[]) => {
      if (seqIdx === seq.length - 1) {
        completedTrails.push([...path]);
        path.forEach(c => protectedGoats.add(c));
        const midIdx = Math.floor(seq.length / 2);
        const midCoord = path[midIdx];
        middleGoats.set(midCoord, { trail: [...path], targetGoatVal: seq[midIdx] });
        return;
      }

      const nextNum = seq[seqIdx + 1];
      const adj = getNeighbors(currCoord, gridSize);
      adj.forEach(neighbor => {
        if (goatCoords.has(neighbor) && !path.includes(neighbor)) {
          const val = cellNumbers[neighbor] || 0;
          if (val === nextNum) {
            dfs(neighbor, seqIdx + 1, [...path, neighbor]);
          }
        }
      });
    };

    goats.forEach(g => {
      const val = cellNumbers[g.position] || 0;
      if (val === seq[0]) {
        dfs(g.position, 0, [g.position]);
      }
    });
  });

  return { completedTrails, protectedGoats, middleGoats };
}

export const numberTrailLogic: GameLogicEngine = {
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
    const { protectedGoats, middleGoats } = detectNumberTrails(pieces, preset.cellNumbers, version);
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);

    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];
    const wallHighlights: string[] = []; // Used to highlight trails

    if (selectedPiece.type === 'goat') {
      adj.forEach(c => {
        if (!pieces.some(p => p.position === c)) {
          moveHighlights.push(c);
          // Highlight if this creates a trail
          const sim = pieces.map(p => p.id === selectedPiece.id ? { ...p, position: c } : p);
          if (detectNumberTrails(sim, preset.cellNumbers, version).completedTrails.some(t => t.includes(c))) {
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
          const isProtected = protectedGoats.has(c);
          const isMiddle = middleGoats.has(c);

          if (!isProtected) {
            // Unprotected goat is captureable
            captureHighlights.push(c);
          } else if (isMiddle) {
            // Protected trail break: tiger number >= goat number
            const tigerVal = preset.cellNumbers[selectedPiece.position] || 0;
            const goatVal = preset.cellNumbers[c] || 0;
            if (tigerVal >= goatVal) {
              captureHighlights.push(c);
            }
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
    const { completedTrails, protectedGoats, middleGoats } = detectNumberTrails(pieces, cellNumbers, version);

    let updatedPieces = [...pieces];
    let calcMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';
    let wallStatus: 'none' | 'formed' | 'broken' | 'active' = 'none';

    if (isCapture) {
      const goat = pieces.find(p => p.position === toCoord)!;
      const isProtected = protectedGoats.has(toCoord);
      const isMiddle = middleGoats.has(toCoord);

      updatedPieces = updatedPieces.filter(p => p.id !== goat.id).map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      captureStatus = 'success';

      if (isProtected && isMiddle) {
        wallStatus = 'broken';
        const tigerVal = cellNumbers[selectedPiece.position] || 0;
        const goatVal = cellNumbers[toCoord] || 0;
        calcMsg = `Trail Broken! Tiger (${tigerVal}) >= Goat (${goatVal}). Trail destroyed!`;
      } else {
        calcMsg = `Goat captured at ${toCoord}!`;
      }
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      const mv = cellNumbers[toCoord] || 0;

      if (selectedPiece.type === 'goat') {
        const newTrails = detectNumberTrails(updatedPieces, cellNumbers, version).completedTrails;
        const formed = newTrails.find(t => t.includes(toCoord) && !completedTrails.some(ct => ct.every(c => t.includes(c))));
        if (formed) {
          wallStatus = 'formed';
          calcMsg = `Number Trail Completed: ${formed.map(c => cellNumbers[c]).join(' → ')}! Goats are protected!`;
        } else {
          calcMsg = `Goat moved to ${toCoord} (Value: ${mv})`;
        }
      } else {
        calcMsg = `Tiger moved to ${toCoord} (Value: ${mv})`;
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
    return detectNumberTrails(pieces, preset.cellNumbers, version).protectedGoats;
  },

  checkWinCondition: (
    pieces: Piece[],
    _gridCells: Record<string, CellConfig>,
    capturedGoatsCount: number,
    goatTurnsCount: number,
    version: GameVersion,
    _extraState: any,
    _activeWallsCount: number
  ): 'goat' | 'tiger' | 'both-lose' | null => {
    const preset = VERSION_PRESETS[version];
    const { completedTrails } = detectNumberTrails(pieces, preset.cellNumbers, version);

    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns) return 'goat';

    const trailsRequired = version === 'beginner' ? 2 : version === 'standard' ? 3 : 4;
    if (completedTrails.length >= trailsRequired) return 'goat';

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
    const cellNumbers = preset.cellNumbers;
    const tigerVal = cellNumbers[tigerCoord] || 0;
    const goatVal = cellNumbers[goatCoord] || 0;
    
    if (isProtected) {
      const allowed = tigerVal >= goatVal;
      return {
        allowed,
        calculation: allowed 
          ? `Trail break check: Tiger value (${tigerVal}) ≥ Middle Goat (${goatVal}) ✓` 
          : `Trail break check: Tiger value (${tigerVal}) < Middle Goat (${goatVal}) ✘`
      };
    } else {
      return {
        allowed: true,
        calculation: `Adjacent capture: Target is unprotected ✓`
      };
    }
  },
  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    let trails = "1 → 2 → 3";
    if (version === "standard") trails = "1→2→3, 2→3→4, or 3→4→5";
    else if (version === "advanced") trails = "1→2→3→4→5, 5→4→3→2→1, 1→3→5, or 2→4";
    return {
      title: "Bagh-Bakri Number Trail",
      studentGuide: [
        "Goat Team moves first! Select a goat and move it to any adjacent empty cell.",
        "Goats win by completing connected Number Trails in order or surviving.",
        "A Number Trail is formed when Goats stand on connected cells in correct sequence (e.g. " + trails + ").",
        "Completed Number Trails glow blue/green and protect all Goats in that sequence.",
        "Tigers can only break a completed trail by capturing its middle goat.",
        "To break the trail, the Tiger must stand adjacent to the middle goat and have a cell value ≥ the middle goat's cell value."
      ],
      stemMathTitle: "Number Trail Sequence Rules",
      stemMathFormula: [
        { label: "Valid Sequence (e.g.)", formula: "Adjacent cell chain: 1 → 2 → 3" },
        { label: "Normal Capture Check", formula: "Adjacent cell + Target NOT in trail" },
        { label: "Trail-Break (Middle Goat)", formula: "Tiger adjacent + Tiger Value ≥ Middle Goat Value" }
      ],
      presets: [
        { name: "Grid Size", info: `${preset.gridSize}×${preset.gridSize} Board` },
        { name: "Active Trails", info: trails },
        { name: "Win Target", info: `Survive ${preset.goatSurvivalTurns} turns or complete ${version === 'beginner' ? 2 : version === 'standard' ? 3 : 4} Number Trails` }
      ]
    };
  },
  getTeacherNote: () => ({
    stemConcept: "Counting, connected routes, number order (ascending/descending), and skip-counting.",
    observations: "Observe if students coordinate their movements to form sequences, and how they protect the critical middle number in their trails.",
    questions: [
      "Which number is missing from this trail?",
      "Why is the middle goat the most vulnerable in a completed trail?",
      "How does creating a longer sequence like 1-2-3-4-5 change your strategy compared to short trails?"
    ],
    discussionPrompt: "Which number is missing from this trail?"
  }),
  getClassroomModeConfig: (_turnNumber: number) => {
    const prompts = [
      'Which number is missing from this trail?',
      'Can the Tiger attack the middle goat? Compare: Tiger value ≥ Middle goat value?',
      'How can Goats block the Tiger from reaching the middle number?',
      'Which sequence are you trying to build? Make sure they are adjacent!',
    ];
    return {
      prompts,
      roles: [
        { role: 'Rule Checker', desc: 'Verify the consecutive number order (ascending or descending).' },
        { role: 'STEM Calculator', desc: 'Verify greater-than-or-equal-to comparison for middle goat break.' },
        { role: 'Move Recorder', desc: 'Log coordinates and note the current trail progress.' },
        { role: 'Strategy Explainer', desc: 'Describe how the sequence will be completed on future turns.' },
      ]
    };
  }
};
