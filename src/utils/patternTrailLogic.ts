import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors } from './boardHelpers';

// Find completed pattern trails
export function detectPatterns(
  pieces: Piece[],
  gridCells: Record<string, CellConfig>,
  version: GameVersion
) {
  const goats = pieces.filter(p => p.type === 'goat');
  const goatCoords = new Set(goats.map(g => g.position));
  const preset = VERSION_PRESETS[version];

  let validSequences: string[][] = [];
  if (version === 'beginner') {
    validSequences = [['circle', 'triangle', 'square']];
  } else if (version === 'standard') {
    validSequences = [
      ['circle', 'triangle', 'square'],
      ['triangle', 'square', 'star'],
      ['circle', 'square', 'circle']
    ];
  } else {
    validSequences = [
      ['circle', 'triangle', 'square', 'star'],
      ['circle', 'triangle', 'circle', 'triangle'],
      ['circle', 'triangle', 'square', 'triangle', 'circle']
    ];
  }

  const completedRoutes: string[][] = [];
  const protectedGoats = new Set<string>();
  const middleGoats = new Set<string>();

  validSequences.forEach(seq => {
    const dfs = (currCoord: string, seqIdx: number, path: string[]) => {
      if (seqIdx === seq.length - 1) {
        completedRoutes.push([...path]);
        path.forEach(c => protectedGoats.add(c));
        const midIdx = Math.floor(seq.length / 2);
        middleGoats.add(path[midIdx]);
        return;
      }

      const nextSymbol = seq[seqIdx + 1];
      const adj = getNeighbors(currCoord, preset.gridSize);
      adj.forEach(neighbor => {
        if (goatCoords.has(neighbor) && !path.includes(neighbor)) {
          const sym = gridCells[neighbor]?.symbol;
          if (sym === nextSymbol) {
            dfs(neighbor, seqIdx + 1, [...path, neighbor]);
          }
        }
      });
    };

    goats.forEach(g => {
      const sym = gridCells[g.position]?.symbol;
      if (sym === seq[0]) {
        dfs(g.position, 0, [g.position]);
      }
    });
  });

  return { completedRoutes, protectedGoats, middleGoats };
}

export const patternTrailLogic: GameLogicEngine = {
  initializeGame: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const gridCells: Record<string, CellConfig> = {};
    const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));
    const symbols: ('circle' | 'triangle' | 'square' | 'star')[] = ['circle', 'triangle', 'square', 'star'];

    for (let r = 1; r <= preset.gridSize; r++) {
      for (let c = 0; c < preset.gridSize; c++) {
        const coord = `${colLetters[c]}${r}`;
        // Deterministic assignment
        const symbol = symbols[(r + c) % 4];
        gridCells[coord] = {
          coordinate: coord,
          number: preset.cellNumbers[coord] || 1,
          symbol,
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
    gridCells: Record<string, CellConfig>,
    _currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    _extraState: any
  ): LegalMovesResult => {
    const preset = VERSION_PRESETS[version];
    const { protectedGoats, middleGoats } = detectPatterns(pieces, gridCells, version);
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);

    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];
    const wallHighlights: string[] = [];

    if (selectedPiece.type === 'goat') {
      adj.forEach(c => {
        if (!pieces.some(p => p.position === c)) {
          moveHighlights.push(c);
          // Highlight if it helps complete a pattern
          const sim = pieces.map(p => p.id === selectedPiece.id ? { ...p, position: c } : p);
          if (detectPatterns(sim, gridCells, version).completedRoutes.some(r => r.includes(c))) {
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
            captureHighlights.push(c);
          } else if (isMiddle) {
            // Tigers can capture middle goat of a protected pattern directly
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
    const { completedRoutes, protectedGoats, middleGoats } = detectPatterns(pieces, gridCells, version);

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
        calcMsg = `Pattern Broken! Tiger captured the middle goat (${gridCells[toCoord]?.symbol}) at ${toCoord}!`;
      } else {
        calcMsg = `Goat captured at ${toCoord}!`;
      }
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      const sym = gridCells[toCoord]?.symbol || 'circle';

      if (selectedPiece.type === 'goat') {
        const newRoutes = detectPatterns(updatedPieces, gridCells, version).completedRoutes;
        const formed = newRoutes.find(r => r.includes(toCoord) && !completedRoutes.some(cr => cr.every(c => r.includes(c))));
        if (formed) {
          wallStatus = 'formed';
          calcMsg = `Pattern Route Completed: ${formed.map(c => gridCells[c]?.symbol).join(' → ')}! Goats are protected!`;
        } else {
          calcMsg = `Goat moved to ${toCoord} (${sym})`;
        }
      } else {
        calcMsg = `Tiger moved to ${toCoord} (${sym})`;
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
    gridCells: Record<string, CellConfig>,
    version: GameVersion,
    _extraState: any
  ): Set<string> => {
    return detectPatterns(pieces, gridCells, version).protectedGoats;
  },

  checkWinCondition: (
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    capturedGoatsCount: number,
    goatTurnsCount: number,
    version: GameVersion,
    _extraState: any,
    _activeWallsCount: number
  ): 'goat' | 'tiger' | 'both-lose' | null => {
    const preset = VERSION_PRESETS[version];
    const { completedRoutes } = detectPatterns(pieces, gridCells, version);

    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns) return 'goat';

    const routesRequired = version === 'beginner' ? 2 : version === 'standard' ? 3 : 4;
    if (completedRoutes.length >= routesRequired) return 'goat';

    return null;
  },

  generateStemMessage: (
    lastCalculation: string,
    _extraState: any
  ): string => {
    return lastCalculation;
  },

  checkCapture: (
    _tigerCoord: string,
    goatCoord: string,
    isProtected: boolean,
    extraState: any,
    _version: GameVersion
  ) => {
    if (isProtected) {
      // Can only break by hitting middle goat – determined externally in getLegalMoves
      const isMiddle = extraState?.middleGoatCoords?.includes(goatCoord);
      return {
        allowed: !!isMiddle,
        calculation: isMiddle
          ? `Pattern-Break: Tiger targets the Pattern Core symbol at ${goatCoord} ✓`
          : `Pattern is protected. Only the Pattern Core symbol can be captured. ✘`,
      };
    }
    return {
      allowed: true,
      calculation: `Adjacent capture: Goat at ${goatCoord} is not in a pattern trail ✓`,
    };
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    let patterns = 'Circle → Triangle → Square';
    if (version === 'standard') patterns = 'Circle → Triangle → Square, Triangle → Square → Star, Circle → Square → Circle';
    else if (version === 'advanced') patterns = 'Circle → Triangle → Square → Star, Circle → Triangle → Circle → Triangle, Circle → Triangle → Square → Triangle → Circle';
    return {
      title: 'Bagh-Bakri Pattern Trail',
      studentGuide: [
        'Goat Team moves first! Choose a goat and move it to any empty adjacent cell.',
        'Goats win by forming Pattern Trails — goats standing on connected cells in the right symbol order.',
        `Valid pattern for ${version}: ${patterns}.`,
        'Goats in a completed pattern trail are protected from normal tiger attacks.',
        'Tiger Team tries to break patterns by capturing the middle-symbol goat (Pattern Core).',
        'Tigers can only break a completed pattern trail by attacking the Pattern Core symbol.',
        'If the Pattern Core is captured, the whole trail breaks and protection disappears.',
        'Goats win by completing enough pattern trails or surviving all tiger turns.',
      ],
      stemMathTitle: 'Pattern Logic Rules',
      stemMathFormula: [
        { label: 'Pattern Trail', formula: 'Goats on connected cells with symbols in correct order' },
        { label: 'Protection Rule', formula: 'Goats in completed trail → protected from capture' },
        { label: 'Pattern Break', formula: 'Tiger captures Pattern Core (middle symbol) → trail breaks' },
      ],
      presets: [
        { name: 'Grid Size', info: `${preset.gridSize}×${preset.gridSize} Board` },
        { name: 'Valid Patterns', info: patterns },
        { name: 'Win Target', info: `Survive ${preset.goatSurvivalTurns} turns or complete ${version === 'beginner' ? 2 : version === 'standard' ? 3 : 4} Pattern Trails` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Pattern recognition, sequencing, classification, visual logic, and prediction.',
    observations: 'Observe if students remember the symbol order and plan which cells their goats should move to. Watch for pattern-completion planning and disruption strategies.',
    questions: [
      'What symbol should come next in this pattern?',
      'Which goat is the Pattern Core that the Tiger should target?',
      'Can you predict where you need to move your goat to complete the pattern?',
    ],
    discussionPrompt: 'What symbol should come next in this pattern?',
  }),

  getClassroomModeConfig: (_turnNumber: number) => {
    const prompts = [
      'What symbol should come next in this pattern?',
      'Which goat is the Pattern Core? That is the target for the Tiger!',
      'Which adjacent cell should the goat move to in order to help complete the pattern?',
      'Can the Tiger reach the Pattern Core this turn?',
    ];
    return {
      prompts,
      roles: [
        { role: 'Rule Checker', desc: 'Verify the symbol order is correct (e.g. Circle → Triangle → Square).' },
        { role: 'STEM Calculator', desc: 'Identify which symbol is the Pattern Core (middle symbol).' },
        { role: 'Move Recorder', desc: 'Record coordinates and note which pattern is forming.' },
        { role: 'Strategy Explainer', desc: 'Describe which cells are needed to complete the next pattern.' },
      ],
    };
  },
};
