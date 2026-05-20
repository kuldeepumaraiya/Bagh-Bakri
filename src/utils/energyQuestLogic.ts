import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors, coordToColRow } from './boardHelpers';

// Helper to check if diagonal move
function isDiagonalMove(from: string, to: string): boolean {
  const f = coordToColRow(from);
  const t = coordToColRow(to);
  return Math.abs(f.col - t.col) > 0 && Math.abs(f.row - t.row) > 0;
}

// Check terrain cost modifier
function getMoveCost(from: string, to: string, _pieceType: 'goat' | 'tiger', gridCells: Record<string, CellConfig>, version: GameVersion): number {
  let baseCost = isDiagonalMove(from, to) ? 2 : 1;
  if (version === 'advanced') {
    const dest = gridCells[to];
    if (dest?.habitat === 'water') {
      baseCost += 1; // Water costs +1 energy
    }
  }
  return baseCost;
}

export const energyQuestLogic: GameLogicEngine = {
  initializeGame: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const gridCells: Record<string, CellConfig> = {};
    const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));

    // Assign terrain for Advanced version
    const forests = new Set(['B2', 'F6', 'C5', 'E3']);
    const hills = new Set(['D4', 'B6', 'F2']);
    const waters = new Set(['D1', 'D7', 'A4', 'G4']);

    for (let r = 1; r <= preset.gridSize; r++) {
      for (let c = 0; c < preset.gridSize; c++) {
        const coord = `${colLetters[c]}${r}`;
        let habitat: 'grassland' | 'forest' | 'hill' | 'water' = 'grassland';
        if (version === 'advanced') {
          if (forests.has(coord)) habitat = 'forest';
          else if (hills.has(coord)) habitat = 'hill';
          else if (waters.has(coord)) habitat = 'water';
        }
        gridCells[coord] = {
          coordinate: coord,
          number: preset.cellNumbers[coord] || 1,
          habitat,
        };
      }
    }

    const pieces = preset.startingPieces.map(p => ({
      ...p,
      energy: p.type === 'tiger' ? 8 : 5,
      hasShield: false,
    }));

    return {
      pieces,
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
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);

    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];

    const currentEnergy = selectedPiece.energy ?? 0;

    adj.forEach(c => {
      const cost = getMoveCost(selectedPiece.position, c, selectedPiece.type, gridCells, version);
      if (currentEnergy >= cost) {
        const p = pieces.find(x => x.position === c);
        if (!p) {
          moveHighlights.push(c);
        } else if (p.type === 'goat' && selectedPiece.type === 'tiger') {
          // Tiger capture check
          const isShielded = p.hasShield;
          const capCost = isShielded ? 5 : 3;
          if (currentEnergy >= capCost) {
            captureHighlights.push(c);
          }
        }
      }
    });

    return { moveHighlights, captureHighlights };
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
    let updatedPieces = [...pieces];
    let calcMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';
    let wallStatus: 'none' | 'formed' | 'broken' | 'active' = 'none';

    const cost = getMoveCost(selectedPiece.position, toCoord, selectedPiece.type, gridCells, version);
    const startEnergy = selectedPiece.energy ?? 0;

    if (isCapture) {
      const goat = pieces.find(p => p.position === toCoord)!;
      const isShielded = goat.hasShield;
      const capCost = isShielded ? 5 : 3;

      updatedPieces = updatedPieces.filter(p => p.id !== goat.id);
      updatedPieces = updatedPieces.map(p => {
        if (p.id === selectedPiece.id) {
          const rem = Math.max(0, startEnergy - capCost);
          return { ...p, position: toCoord, energy: rem };
        }
        return p;
      });

      captureStatus = 'success';
      calcMsg = isShielded
        ? `Tiger spent 5 energy to break shield and capture Goat at ${toCoord}!`
        : `Tiger spent 3 energy to capture Goat at ${toCoord}!`;
    } else {
      updatedPieces = updatedPieces.map(p => {
        if (p.id === selectedPiece.id) {
          let rem = Math.max(0, startEnergy - cost);
          // Forest energy bonus for goats in Advanced version
          if (version === 'advanced' && p.type === 'goat' && gridCells[toCoord]?.habitat === 'forest') {
            rem = Math.min(6, rem + 1);
          }
          // Hill energy bonus for tigers in Advanced version
          if (version === 'advanced' && p.type === 'tiger' && gridCells[toCoord]?.habitat === 'hill') {
            rem = Math.min(10, rem + 1);
          }
          return { ...p, position: toCoord, energy: rem };
        }
        return p;
      });

      const isDiag = isDiagonalMove(selectedPiece.position, toCoord);
      calcMsg = `${selectedPiece.label} spent ${cost} energy for ${isDiag ? 'diagonal' : 'straight'} move to ${toCoord}.`;
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
    _version: GameVersion,
    _extraState: any
  ): Set<string> => {
    // Shielded goats are protected
    const shielded = new Set<string>();
    pieces.forEach(p => {
      if (p.type === 'goat' && p.hasShield) {
        shielded.add(p.position);
      }
    });
    return shielded;
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
    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns) return 'goat';

    // Count shields created
    const shieldsCount = pieces.filter(p => p.type === 'goat' && p.hasShield).length;
    const shieldsRequired = version === 'beginner' ? 3 : version === 'standard' ? 4 : 5;
    if (shieldsCount >= shieldsRequired) return 'goat';

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
    _goatCoord: string,
    isProtected: boolean,
    extraState: any,
    _version: GameVersion
  ) => {
    // Find the tiger's energy from extraState or use a guess
    const tigerEnergy = extraState?.tigerEnergyAtCoord?.[tigerCoord] ?? 8;
    if (isProtected) {
      const allowed = tigerEnergy >= 5;
      return {
        allowed,
        calculation: allowed
          ? `Shield Break: Tiger has ${tigerEnergy} energy ≥ 5. Shield break capture allowed! ✓`
          : `Shield Break: Tiger needs 5 energy but has ${tigerEnergy}. Cannot break shield. ✘`,
      };
    } else {
      const allowed = tigerEnergy >= 3;
      return {
        allowed,
        calculation: allowed
          ? `Capture: Tiger has ${tigerEnergy} energy ≥ 3. Cost: 3 energy. Capture allowed! ✓`
          : `Capture: Tiger needs 3 energy but has ${tigerEnergy}. Not enough energy to capture. ✘`,
      };
    }
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    return {
      title: 'Bagh-Bakri Energy Quest',
      studentGuide: [
        'Every goat and tiger has energy points shown on the board.',
        'Moving straight (up, down, left, right) costs 1 energy.',
        'Moving diagonally costs 2 energy.',
        'Instead of moving, any piece can REST to gain +2 energy back.',
        'Tigers capture goats by spending 3 energy. The goat must be unshielded.',
        'Two adjacent goats can create an Energy Shield — each goat spends 1 energy.',
        'Shielded goats need 5 tiger energy to capture — much harder to beat!',
        'If a piece has 0 energy, it must rest and cannot move or capture.',
        'Goats win by surviving enough turns or creating enough Energy Shields.',
        'Tigers win by capturing enough goats.',
      ],
      stemMathTitle: 'Energy Cost Formulae',
      stemMathFormula: [
        { label: 'Straight Move Cost', formula: 'Energy spent = 1' },
        { label: 'Diagonal Move Cost', formula: 'Energy spent = 2' },
        { label: 'Normal Capture Cost', formula: 'Tiger energy ≥ 3, spends 3' },
        { label: 'Shield Break Cost', formula: 'Tiger energy ≥ 5, spends 5' },
        { label: 'Rest Gain', formula: 'Energy +2 (up to max)' },
      ],
      presets: [
        { name: 'Grid Size', info: `${preset.gridSize}×${preset.gridSize} Board` },
        { name: 'Starting Energy', info: `Goats: 5⚡ (max 6), Tigers: 8⚡ (max 10)` },
        { name: 'Win Target', info: `Survive ${preset.goatSurvivalTurns} turns or create ${version === 'beginner' ? 3 : version === 'standard' ? 4 : 5} Energy Shields` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Subtraction through energy spending, addition through recharging, resource management, planning, and optimization.',
    observations: 'Watch if students choose to rest strategically before expensive actions, and whether tiger teams manage their energy budget carefully to afford captures.',
    questions: [
      'Should this piece spend energy now or rest to save energy?',
      'How many turns will it take this tiger to charge up enough energy to break a shield?',
      'Is it better to move diagonally quickly or save energy by moving straight?',
    ],
    discussionPrompt: 'Should this piece spend energy now or rest to save energy?',
  }),

  getClassroomModeConfig: (_turnNumber: number) => {
    const prompts = [
      'Should this piece spend energy now or rest to save energy?',
      'How much energy will this move cost? Can the team afford it?',
      'Which goats should form an Energy Shield together?',
      'Does the tiger have enough energy to break the shield (needs 5)?',
    ];
    return {
      prompts,
      roles: [
        { role: 'Rule Checker', desc: 'Verify the move is legal given the piece\'s current energy.' },
        { role: 'STEM Calculator', desc: 'Calculate energy cost of moves: straight = 1, diagonal = 2, capture = 3.' },
        { role: 'Move Recorder', desc: 'Track energy changes after every move and write them down.' },
        { role: 'Strategy Explainer', desc: 'Justify whether to move, rest, capture, or shield based on energy.' },
      ],
    };
  },
};
