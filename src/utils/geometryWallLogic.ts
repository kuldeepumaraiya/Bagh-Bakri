import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors, areAdjacent, coordToColRow } from './boardHelpers';

export interface GeometryWallShape {
  type: 'line' | 'triangle' | 'square' | 'symmetry';
  coords: string[];
  weakPoints: string[];
}

export function detectGeometryWalls(
  pieces: Piece[],
  version: GameVersion
) {
  const goats = pieces.filter(p => p.type === 'goat');
  const goatCoords = goats.map(g => g.position);
  const goatSet = new Set(goatCoords);
  const preset = VERSION_PRESETS[version];
  const N = preset.gridSize;

  const activeWalls: GeometryWallShape[] = [];
  const protectedGoats = new Set<string>();
  const weakPoints = new Set<string>();

  // 1. Line Wall (3 goats in a straight line, connected)
  for (let i = 0; i < goats.length; i++) {
    for (let j = i + 1; j < goats.length; j++) {
      for (let k = j + 1; k < goats.length; k++) {
        const g1 = goats[i].position;
        const g2 = goats[j].position;
        const g3 = goats[k].position;

        // Sort by coordinates to find middle
        const sorted = [g1, g2, g3].sort();
        const sc1 = coordToColRow(sorted[0]);
        const sc2 = coordToColRow(sorted[1]);
        const sc3 = coordToColRow(sorted[2]);

        const isLine =
          (sc1.col === sc2.col && sc2.col === sc3.col && Math.abs(sc1.row - sc2.row) === 1 && Math.abs(sc2.row - sc3.row) === 1) || // Vertical
          (sc1.row === sc2.row && sc2.row === sc3.row && Math.abs(sc1.col - sc2.col) === 1 && Math.abs(sc2.col - sc3.col) === 1) || // Horizontal
          (sc1.col - sc1.row === sc2.col - sc2.row && sc2.col - sc2.row === sc3.col - sc3.row && areAdjacent(sorted[0], sorted[1]) && areAdjacent(sorted[1], sorted[2])) || // Diagonal \
          (sc1.col + sc1.row === sc2.col + sc2.row && sc2.col + sc2.row === sc3.col + sc3.row && areAdjacent(sorted[0], sorted[1]) && areAdjacent(sorted[1], sorted[2]));  // Diagonal /

        if (isLine) {
          const mid = sorted[1];
          activeWalls.push({
            type: 'line',
            coords: [g1, g2, g3],
            weakPoints: [mid],
          });
          protectedGoats.add(g1);
          protectedGoats.add(g2);
          protectedGoats.add(g3);
          weakPoints.add(mid);
        }
      }
    }
  }

  // 2. Triangle Wall (3 mutually adjacent goats)
  for (let i = 0; i < goats.length; i++) {
    for (let j = i + 1; j < goats.length; j++) {
      for (let k = j + 1; k < goats.length; k++) {
        const g1 = goats[i].position;
        const g2 = goats[j].position;
        const g3 = goats[k].position;

        if (areAdjacent(g1, g2) && areAdjacent(g2, g3) && areAdjacent(g3, g1)) {
          // Confirm it's not a line (mutually adjacent is always a triangle on grid except diagonal line but diagonal line has areAdjacent(g1, g3) as false)
          activeWalls.push({
            type: 'triangle',
            coords: [g1, g2, g3],
            weakPoints: [g1, g2, g3], // Any corner is weak
          });
          protectedGoats.add(g1);
          protectedGoats.add(g2);
          protectedGoats.add(g3);
          weakPoints.add(g1);
          weakPoints.add(g2);
          weakPoints.add(g3);
        }
      }
    }
  }

  // 3. Square Wall (2x2 goats) - Standard & Advanced
  if (version !== 'beginner') {
    for (let r = 0; r < N - 1; r++) {
      for (let c = 0; c < N - 1; c++) {
        // Col letters
        const colL = String.fromCharCode(65 + c);
        const colLNext = String.fromCharCode(65 + c + 1);
        const coord1 = `${colL}${r + 1}`;
        const coord2 = `${colLNext}${r + 1}`;
        const coord3 = `${colL}${r + 2}`;
        const coord4 = `${colLNext}${r + 2}`;

        if (goatSet.has(coord1) && goatSet.has(coord2) && goatSet.has(coord3) && goatSet.has(coord4)) {
          activeWalls.push({
            type: 'square',
            coords: [coord1, coord2, coord3, coord4],
            weakPoints: [coord1, coord2, coord3, coord4],
          });
          protectedGoats.add(coord1);
          protectedGoats.add(coord2);
          protectedGoats.add(coord3);
          protectedGoats.add(coord4);
          weakPoints.add(coord1);
          weakPoints.add(coord2);
          weakPoints.add(coord3);
          weakPoints.add(coord4);
        }
      }
    }
  }

  // 4. Symmetry Wall (Advanced only: 2 goats symmetric across center)
  if (version === 'advanced') {
    for (let i = 0; i < goats.length; i++) {
      for (let j = i + 1; j < goats.length; j++) {
        const g1 = goats[i].position;
        const g2 = goats[j].position;

        const c1 = coordToColRow(g1);
        const c2 = coordToColRow(g2);

        if (c1.col + c2.col === N - 1 && c1.row + c2.row === N - 1) {
          activeWalls.push({
            type: 'symmetry',
            coords: [g1, g2],
            weakPoints: [g1, g2],
          });
          protectedGoats.add(g1);
          protectedGoats.add(g2);
          weakPoints.add(g1);
          weakPoints.add(g2);
        }
      }
    }
  }

  return { activeWalls, protectedGoats, weakPoints };
}

export const geometryWallLogic: GameLogicEngine = {
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
    const { protectedGoats, weakPoints } = detectGeometryWalls(pieces, version);
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);

    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];
    const wallHighlights: string[] = [];

    if (selectedPiece.type === 'goat') {
      adj.forEach(c => {
        if (!pieces.some(p => p.position === c)) {
          moveHighlights.push(c);
          // Highlight if it creates a shape
          const sim = pieces.map(p => p.id === selectedPiece.id ? { ...p, position: c } : p);
          if (detectGeometryWalls(sim, version).activeWalls.some(w => w.coords.includes(c))) {
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
          const isWeakPoint = weakPoints.has(c);

          if (!isProtected) {
            captureHighlights.push(c);
          } else if (isWeakPoint) {
            // Tiger can capture weak points of the geometry wall directly
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
    const { activeWalls, protectedGoats, weakPoints } = detectGeometryWalls(pieces, version);

    let updatedPieces = [...pieces];
    let calcMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';
    let wallStatus: 'none' | 'formed' | 'broken' | 'active' = 'none';

    if (isCapture) {
      const goat = pieces.find(p => p.position === toCoord)!;
      const isProtected = protectedGoats.has(toCoord);
      const isWeak = weakPoints.has(toCoord);

      updatedPieces = updatedPieces.filter(p => p.id !== goat.id).map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      captureStatus = 'success';

      if (isProtected && isWeak) {
        wallStatus = 'broken';
        const shape = activeWalls.find(w => w.weakPoints.includes(toCoord));
        calcMsg = `Shape Wall Broken! Tiger attacked corner/middle of ${shape ? shape.type : 'Geometry'} Wall at ${toCoord}!`;
      } else {
        calcMsg = `Goat captured at ${toCoord}!`;
      }
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);

      if (selectedPiece.type === 'goat') {
        const newWalls = detectGeometryWalls(updatedPieces, version).activeWalls;
        const formed = newWalls.find(w => w.coords.includes(toCoord) && !activeWalls.some(aw => aw.coords.every(c => w.coords.includes(c))));
        if (formed) {
          wallStatus = 'formed';
          calcMsg = `Geometry Wall Formed: ${formed.type.toUpperCase()} Wall completed! Goats are protected!`;
        } else {
          calcMsg = `Goat moved to ${toCoord}`;
        }
      } else {
        calcMsg = `Tiger moved to ${toCoord}`;
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
    return detectGeometryWalls(pieces, version).protectedGoats;
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
    const { activeWalls } = detectGeometryWalls(pieces, version);

    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns) return 'goat';

    const wallsRequired = version === 'beginner' ? 2 : version === 'standard' ? 3 : 4;
    if (activeWalls.length >= wallsRequired) return 'goat';

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
    _extraState: any,
    _version: GameVersion
  ) => {
    if (isProtected) {
      // Geometry wall: protected goats can only be captured at weak points
      return {
        allowed: true, // Weak-point check is done in getLegalMoves; reaching here means it's a valid target
        calculation: `Geometry Wall weak point at ${goatCoord} — Tiger attacks the vulnerable position! ✓`,
      };
    }
    return {
      allowed: true,
      calculation: `Goat at ${goatCoord} is not in any Geometry Wall — capture allowed! ✓`,
    };
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const walls = version === 'beginner'
      ? 'Line Wall and Triangle Wall'
      : version === 'standard'
        ? 'Line Wall, Triangle Wall, and Square Wall'
        : 'Line Wall, Triangle Wall, Square Wall, and Symmetry Wall';
    return {
      title: 'Bagh-Bakri Geometry Wall',
      studentGuide: [
        'Goat Team moves first! Move your goat to any adjacent empty cell.',
        'Goats protect themselves by making geometric shapes!',
        '3 goats in a straight line → Line Wall (weak point: middle goat).',
        '3 goats forming a triangle → Triangle Wall (stronger! needs warning turn to break).',
        version !== 'beginner' ? '4 goats at square corners → Square Wall (very strong — warning turn needed).' : '(Square Wall unlocked in Standard and Advanced)',
        'Protected goats inside a shape cannot be captured normally.',
        'Tiger must target weak points (middle of line, or corners of triangle/square).',
        'For Triangle and Square walls, the Tiger must wait one turn adjacent before breaking.',
        'Goats win by creating enough walls or surviving all rounds!',
        'Tigers win by capturing enough goats.',
      ],
      stemMathTitle: 'Geometry Shape Rules',
      stemMathFormula: [
        { label: 'Line Wall', formula: '3 goats in a straight line (H, V, or Diagonal) → middle goat is weak' },
        { label: 'Triangle Wall', formula: '3 mutually adjacent goats forming a triangle → any corner; needs 1 warning turn' },
        { label: 'Square Wall', formula: '4 goats at square corners → any corner; needs 1 warning turn' },
        version === 'advanced' ? { label: 'Symmetry Wall', formula: '2 goats mirrored across board center → temporary 1-round protection' } : { label: 'Available walls', formula: walls },
      ],
      presets: [
        { name: 'Grid Size', info: `${preset.gridSize}×${preset.gridSize} Board` },
        { name: 'Available Walls', info: walls },
        { name: 'Win Target', info: `Survive ${preset.goatSurvivalTurns} turns or create ${version === 'beginner' ? 2 : version === 'standard' ? 3 : 4} Geometry Walls` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Geometry: lines, triangles, squares, corners, middle points, symmetry, and structural reasoning.',
    observations: 'Observe if students recognise which goat is the weak point of a wall, and how they adapt when tigers threaten their shapes. Watch for students who plan shapes before moving.',
    questions: [
      'Which goat is the weak point of this shape?',
      'Which shape is stronger — a Line Wall or a Triangle Wall? Why?',
      'How many goats do you need to make a Square Wall?',
    ],
    discussionPrompt: 'Which goat is the weak point of this shape?',
  }),

  getClassroomModeConfig: (_turnNumber: number) => {
    const prompts = [
      'Which goat is the weak point of this Geometry Wall?',
      'Is this shape a Line, Triangle, or Square Wall?',
      'Is the Tiger in a warning turn position? Can it break the wall next turn?',
      'Which goat should move to help complete a geometric shape?',
    ];
    return {
      prompts,
      roles: [
        { role: 'Rule Checker', desc: 'Identify if goats form a valid Line, Triangle, or Square shape.' },
        { role: 'STEM Calculator', desc: 'Name the weak point: middle for lines, any corner for triangles/squares.' },
        { role: 'Move Recorder', desc: 'Record shape formations and warning turns in the move log.' },
        { role: 'Strategy Explainer', desc: 'Explain which shape the team is building and why it is a good strategy.' },
      ],
    };
  },
};
