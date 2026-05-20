import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors, coordToColRow, colRowToCoord, areAdjacent } from './boardHelpers';

// Helper to determine the zone of a coordinate
export function getCoordZone(coord: string, gridSize: number): 'corner' | 'edge' | 'center' {
  const { col, row } = coordToColRow(coord);
  const max = gridSize - 1;
  const isColBoundary = col === 0 || col === max;
  const isRowBoundary = row === 0 || row === max;

  if (isColBoundary && isRowBoundary) {
    return 'corner';
  }
  if (isColBoundary || isRowBoundary) {
    return 'edge';
  }
  return 'center';
}

// Helper to calculate grid distance (Chebyshev distance)
function getGridDistance(c1: string, c2: string): number {
  const cr1 = coordToColRow(c1);
  const cr2 = coordToColRow(c2);
  return Math.max(Math.abs(cr1.col - cr2.col), Math.abs(cr1.row - cr2.row));
}

// Find coordinate of the nearest goat to a tiger position
function getDistanceToNearestGoat(tigerCoord: string, pieces: Piece[]): number {
  const goats = pieces.filter(p => p.type === 'goat');
  if (goats.length === 0) return 999;
  let minDistance = 999;
  goats.forEach(g => {
    const dist = getGridDistance(tigerCoord, g.position);
    if (dist < minDistance) minDistance = dist;
  });
  return minDistance;
}

export const dataHuntLogic: GameLogicEngine = {
  initializeGame: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const gridCells: Record<string, CellConfig> = {};
    const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));

    for (let r = 1; r <= preset.gridSize; r++) {
      for (let c = 0; c < preset.gridSize; c++) {
        const coord = `${colLetters[c]}${r}`;
        const zone = getCoordZone(coord, preset.gridSize);
        gridCells[coord] = {
          coordinate: coord,
          number: preset.cellNumbers[coord] || 1,
          habitat: zone, // Set zone as habitat to render Corner, Edge, Center
        };
      }
    }

    return {
      pieces: JSON.parse(JSON.stringify(preset.startingPieces)),
      gridCells,
      extraState: {
        // Event tokens
        tigerMoveTokens: 0,
        goatMoveTokens: 0,
        attackTokens: 0,
        captureTokens: 0,
        escapeTokens: 0,
        blockTokens: 0,
        predictionTokensGoat: 0,
        predictionTokensTiger: 0,
        tigerCenterMoveTokens: 0,

        // Zone Tallies
        zoneTallies: {
          corner: 0,
          edge: 0,
          center: 0,
        },
        tallyHistory: [] as string[],

        // Prediction mechanics
        prediction: '', // Selected prediction ID (e.g. 'tiger_nearest')
        predictionName: '', // e.g. 'Tiger will move toward nearest goat'
        predictionCorrect: null,
        consecutiveWrongPredictions: 0,
        bonusDisabledTurns: 0,

        // Active Power (what power is currently activated for the upcoming turn)
        activePower: null, // 'safeStep' | 'strongBlock' | 'focusedHunt' | 'ambush' | 'centerControl'
        strongBlockCell: null,
        strongBlockDuration: 0,
        centerControlActive: false,
        centerControlDuration: 0,
        
        escapesCount: 0,
        capturesCount: 0,
      },
    };
  },

  getLegalMoves: (
    selectedPiece: Piece,
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    extraState: any
  ): LegalMovesResult => {
    const preset = VERSION_PRESETS[version];
    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];

    // If Strong Block is active, Goats can choose an adjacent empty cell to block!
    if (currentPlayer === 'goat' && extraState?.activePower === 'strongBlock') {
      const adj = getNeighbors(selectedPiece.position, preset.gridSize);
      adj.forEach(c => {
        const occupies = pieces.some(p => p.position === c);
        if (!occupies) {
          moveHighlights.push(c); // Highlight empty cells for placing the block
        }
      });
      return { moveHighlights, captureHighlights };
    }

    const baseNeighbors = getNeighbors(selectedPiece.position, preset.gridSize);

    // Filter neighbors by Center Control or Strong Block cells
    const getFilteredNeighbors = (coord: string) => {
      let adj = getNeighbors(coord, preset.gridSize);
      
      // Filter out Strong Block cell if active
      if (extraState?.strongBlockCell) {
        adj = adj.filter(c => c !== extraState.strongBlockCell);
      }
      
      // Filter out Center Control cell if active and current piece is goat
      if (selectedPiece.type === 'goat' && extraState?.centerControlActive) {
        const centerCoord = colRowToCoord(Math.floor(preset.gridSize / 2), Math.floor(preset.gridSize / 2));
        const tigerCoords = pieces.filter(p => p.type === 'tiger').map(p => p.position);
        const tigerAdjacentToCenter = tigerCoords.some(tc => areAdjacent(tc, centerCoord));
        if (tigerAdjacentToCenter) {
          adj = adj.filter(c => c !== centerCoord); // Block center cell for goats
        }
      }
      return adj;
    };

    const adj = getFilteredNeighbors(selectedPiece.position);

    // 1. Ambush or Safe Step - Range 2 movements
    const isAmbushActive = selectedPiece.type === 'tiger' && extraState?.activePower === 'ambush';
    const isSafeStepActive = selectedPiece.type === 'goat' && extraState?.activePower === 'safeStep';

    if (isAmbushActive || isSafeStepActive) {
      // Find all cells at distance 1 and distance 2
      const visited = new Set<string>([selectedPiece.position]);
      
      // Distance 1
      adj.forEach(c => {
        const p = pieces.find(x => x.position === c);
        if (!p) {
          moveHighlights.push(c);
          visited.add(c);
          
          // Distance 2 neighbors from this empty cell
          const subAdj = getFilteredNeighbors(c);
          subAdj.forEach(sc => {
            if (!visited.has(sc)) {
              const sp = pieces.find(x => x.position === sc);
              if (!sp) {
                moveHighlights.push(sc);
                visited.add(sc);
              }
            }
          });
        } else if (p.type === 'goat' && selectedPiece.type === 'tiger') {
          captureHighlights.push(c);
        }
      });

      return { moveHighlights, captureHighlights };
    }

    // 2. Focused Hunt - Tiger can leap capture at distance 2
    const isFocusedHuntActive = selectedPiece.type === 'tiger' && extraState?.activePower === 'focusedHunt';

    adj.forEach(c => {
      const p = pieces.find(x => x.position === c);
      if (!p) {
        moveHighlights.push(c);
      } else if (p.type === 'goat' && selectedPiece.type === 'tiger') {
        captureHighlights.push(c);
      }
    });

    if (isFocusedHuntActive && selectedPiece.type === 'tiger') {
      const { col, row } = coordToColRow(selectedPiece.position);
      const directions = [
        { dc: 2, dr: 0 }, { dc: -2, dr: 0 },
        { dc: 0, dr: 2 }, { dc: 0, dr: -2 },
        { dc: 2, dr: 2 }, { dc: -2, dr: -2 },
        { dc: 2, dr: -2 }, { dc: -2, dr: 2 }
      ];
      directions.forEach(d => {
        const nc = col + d.dc;
        const nr = row + d.dr;
        if (nc >= 0 && nc < preset.gridSize && nr >= 0 && nr < preset.gridSize) {
          const intermediateCol = col + d.dc / 2;
          const intermediateRow = row + d.dr / 2;
          const midCoord = colRowToCoord(intermediateCol, intermediateRow);
          const destCoord = colRowToCoord(nc, nr);

          // Path is clear if intermediate is empty or contains the target goat
          const midPiece = pieces.find(p => p.position === midCoord);
          const destPiece = pieces.find(p => p.position === destCoord);

          if (destPiece?.type === 'goat' && !midPiece) {
            captureHighlights.push(destCoord);
          }
        }
      });
    }

    return { moveHighlights, captureHighlights };
  },

  applyMove: (
    selectedPiece: Piece,
    toCoord: string,
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    extraState: any,
    isCapture: boolean
  ): LogicResult => {
    const preset = VERSION_PRESETS[version];
    let updatedPieces = [...pieces];
    const nextExtra = { ...extraState };
    let calcMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';
    const destZone = getCoordZone(toCoord, preset.gridSize);

    // Disable block cell duration ticker
    if (currentPlayer === 'goat') {
      if (nextExtra.strongBlockDuration > 0) {
        nextExtra.strongBlockDuration -= 1;
        if (nextExtra.strongBlockDuration === 0) {
          nextExtra.strongBlockCell = null;
        }
      }
      if (nextExtra.centerControlDuration > 0) {
        nextExtra.centerControlDuration -= 1;
        if (nextExtra.centerControlDuration === 0) {
          nextExtra.centerControlActive = false;
        }
      }
    }

    // 1. Evaluate previous team's prediction before making this move
    const opponentTeam = currentPlayer === 'goat' ? 'tiger' : 'goat';
    if (nextExtra.prediction) {
      let isCorrect = false;
      const pred = nextExtra.prediction;

      if (opponentTeam === 'goat' && currentPlayer === 'tiger') {
        // Evaluating Goat Team's predictions of Tiger's action
        const prevNearestGoatDist = getDistanceToNearestGoat(selectedPiece.position, pieces);
        const postNearestGoatDist = getDistanceToNearestGoat(toCoord, pieces);

        if (pred === 'tiger_nearest') {
          isCorrect = !isCapture && postNearestGoatDist < prevNearestGoatDist;
        } else if (pred === 'tiger_center') {
          isCorrect = !isCapture && destZone === 'center';
        } else if (pred === 'tiger_attack') {
          isCorrect = isCapture;
        } else if (pred === 'tiger_retreat') {
          isCorrect = !isCapture && postNearestGoatDist > prevNearestGoatDist;
        }
      } else if (opponentTeam === 'tiger' && currentPlayer === 'goat') {
        // Evaluating Tiger Team's predictions of Goat's action
        const wasAdjacentToTiger = pieces.filter(p => p.type === 'tiger').some(t => areAdjacent(selectedPiece.position, t.position));
        const isAdjacentToTiger = pieces.filter(p => p.type === 'tiger').some(t => areAdjacent(toCoord, t.position));
        const neighboringGoats = pieces.filter(p => p.type === 'goat' && p.id !== selectedPiece.id && areAdjacent(toCoord, p.position)).length;

        if (pred === 'goat_group') {
          isCorrect = neighboringGoats >= 1;
        } else if (pred === 'goat_escape') {
          isCorrect = wasAdjacentToTiger && !isAdjacentToTiger;
        } else if (pred === 'goat_edge') {
          isCorrect = destZone === 'edge';
        } else if (pred === 'goat_block') {
          isCorrect = isAdjacentToTiger;
        }
      }

      nextExtra.predictionCorrect = isCorrect;
      if (isCorrect) {
        nextExtra.consecutiveWrongPredictions = 0;
        if (opponentTeam === 'goat') {
          nextExtra.predictionTokensGoat = (nextExtra.predictionTokensGoat || 0) + 1;
        } else {
          nextExtra.predictionTokensTiger = (nextExtra.predictionTokensTiger || 0) + 1;
        }
        calcMsg = `[Prediction Correct!] ${opponentTeam.toUpperCase()} Team predicted accurately and earned 1 Prediction Token! `;
      } else {
        nextExtra.consecutiveWrongPredictions = (nextExtra.consecutiveWrongPredictions || 0) + 1;
        calcMsg = `[Prediction Incorrect] ${opponentTeam.toUpperCase()} Team prediction failed. `;
        
        // Advanced Penalty: 2 wrong predictions disables tokens earning for 1 round (2 turns)
        if (version === 'advanced' && nextExtra.consecutiveWrongPredictions >= 2) {
          nextExtra.bonusDisabledTurns = 2;
          nextExtra.consecutiveWrongPredictions = 0;
          calcMsg += `Data bonus locked for 1 round! `;
        }
      }
      nextExtra.prediction = '';
      nextExtra.predictionName = '';
    }

    // Decrement advanced token lock ticker
    let isDataLocked = false;
    if (version === 'advanced' && nextExtra.bonusDisabledTurns > 0) {
      nextExtra.bonusDisabledTurns -= 1;
      isDataLocked = true;
    }

    // 2. Handle Strong Block placement action
    if (currentPlayer === 'goat' && nextExtra.activePower === 'strongBlock') {
      nextExtra.strongBlockCell = toCoord;
      nextExtra.strongBlockDuration = 2; // Lasts 1 tiger turn (2 global turn half-steps)
      nextExtra.blockTokens = (nextExtra.blockTokens || 0) + 1;
      nextExtra.activePower = null;
      calcMsg += `Goats placed Strong Block at ${toCoord}! Tigers cannot enter for 1 round.`;
      
      return {
        pieces,
        gridCells,
        extraState: nextExtra,
        calculationMsg: calcMsg,
        captureStatus: 'none',
        wallStatus: 'none',
      };
    }

    // 3. Normal Movement and Capture Actions
    if (isCapture) {
      const targetGoat = pieces.find(p => p.position === toCoord)!;

      updatedPieces = updatedPieces
        .filter(p => p.id !== targetGoat.id)
        .map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      captureStatus = 'success';
      nextExtra.capturesCount = (nextExtra.capturesCount || 0) + 1;
      
      if (!isDataLocked) {
        nextExtra.captureTokens = (nextExtra.captureTokens || 0) + 1;
        nextExtra.zoneTallies[destZone] += 1;
        nextExtra.tallyHistory.push(`Capture at ${destZone.toUpperCase()} (${toCoord})`);
      }
      calcMsg += `Tiger captured Goat at ${toCoord} (${destZone} zone).`;

      if (nextExtra.activePower === 'focusedHunt') {
        nextExtra.activePower = null; // Consume Focused Hunt
      }
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      
      if (selectedPiece.type === 'goat') {
        if (!isDataLocked) {
          nextExtra.goatMoveTokens = (nextExtra.goatMoveTokens || 0) + 1;
          nextExtra.zoneTallies[destZone] += 1;
        }

        // Tally escapes: Goat moves away from cell adjacent to a tiger
        const tigerPositions = pieces.filter(p => p.type === 'tiger').map(p => p.position);
        const wasAdjacentToTiger = tigerPositions.some(tp => areAdjacent(selectedPiece.position, tp));
        const isAdjacentToTiger = tigerPositions.some(tp => areAdjacent(toCoord, tp));

        if (wasAdjacentToTiger && !isAdjacentToTiger) {
          if (!isDataLocked) {
            nextExtra.escapeTokens = (nextExtra.escapeTokens || 0) + 1;
            nextExtra.tallyHistory.push(`Escape at ${destZone.toUpperCase()} (${toCoord})`);
          }
          nextExtra.escapesCount = (nextExtra.escapesCount || 0) + 1;
          calcMsg += `Goat successfully escaped Tiger proximity to ${toCoord}!`;
        } else {
          calcMsg += `Goat moved to ${toCoord} (${destZone} zone).`;
        }

        // Tally blocks: Goat moves to a cell adjacent to both a tiger and another goat
        const neighboringGoats = pieces.filter(p => p.type === 'goat' && p.id !== selectedPiece.id && areAdjacent(toCoord, p.position)).length;
        if (isAdjacentToTiger && neighboringGoats >= 1) {
          if (!isDataLocked) {
            nextExtra.blockTokens = (nextExtra.blockTokens || 0) + 1;
            nextExtra.tallyHistory.push(`Block at ${destZone.toUpperCase()} (${toCoord})`);
          }
          calcMsg += ` Goat block formed adjacent to Tiger!`;
        }

        if (nextExtra.activePower === 'safeStep' || nextExtra.activePower === 'smartMove') {
          nextExtra.activePower = null; // Consume goat powers
        }
      } else {
        if (!isDataLocked) {
          nextExtra.tigerMoveTokens = (nextExtra.tigerMoveTokens || 0) + 1;
          nextExtra.zoneTallies[destZone] += 1;
          if (destZone === 'center') {
            nextExtra.tigerCenterMoveTokens = (nextExtra.tigerCenterMoveTokens || 0) + 1;
          }
        }
        calcMsg += `Tiger moved to ${toCoord} (${destZone} zone).`;

        if (nextExtra.activePower === 'ambush') {
          nextExtra.activePower = null; // Consume Ambush
        }
        if (nextExtra.activePower === 'centerControl') {
          // Activate center control!
          nextExtra.centerControlActive = true;
          nextExtra.centerControlDuration = 2; // Lasts 1 goat turn
          nextExtra.activePower = null;
        }
      }
    }

    return {
      pieces: updatedPieces,
      gridCells,
      extraState: nextExtra,
      calculationMsg: calcMsg,
      captureStatus,
      wallStatus: 'none',
    };
  },

  detectProtection: (
    pieces: Piece[],
    _gridCells: Record<string, CellConfig>,
    _version: GameVersion,
    extraState: any
  ): Set<string> => {
    const protectedSet = new Set<string>();

    // If Smart Move or Safe Step is active, all goats have active shield for this turn
    if (extraState?.activePower === 'smartMove') {
      pieces.forEach(p => {
        if (p.type === 'goat') protectedSet.add(p.position);
      });
    }

    // Goats are grouped if 2 or more goats are adjacent
    pieces.forEach(p => {
      if (p.type === 'goat') {
        const adjacentGoats = pieces.filter(
          other => other.type === 'goat' && other.id !== p.id && areAdjacent(p.position, other.position)
        ).length;
        
        if (adjacentGoats >= 1) {
          protectedSet.add(p.position); // Grouped goat cannot be captured by Focused Hunt leap
        }
      }
    });

    return protectedSet;
  },

  checkWinCondition: (
    _pieces: Piece[],
    _gridCells: Record<string, CellConfig>,
    capturedGoatsCount: number,
    goatTurnsCount: number,
    version: GameVersion,
    extraState: any,
    _activeWallsCount: number
  ): 'goat' | 'tiger' | 'both-lose' | null => {
    const preset = VERSION_PRESETS[version];
    const escapes = extraState?.escapesCount || 0;

    let escapesRequired = 3;
    if (version === 'standard') escapesRequired = 5;
    else if (version === 'advanced') escapesRequired = 7;

    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns || escapes >= escapesRequired) return 'goat';
    return null;
  },

  generateStemMessage: (
    lastCalculation: string,
    extraState: any
  ): string => {
    const active = extraState?.activePower ? `[Active Power: ${extraState.activePower}] ` : '';
    const block = extraState?.strongBlockCell ? `[Blocked Cell: ${extraState.strongBlockCell}] ` : '';
    const center = extraState?.centerControlActive ? `[Center Control Active] ` : '';
    return `${active}${block}${center}${lastCalculation}`;
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    let escapeReq = 3;
    if (version === 'standard') escapeReq = 5;
    else if (version === 'advanced') escapeReq = 7;

    return {
      title: 'Bagh-Bakri Data Hunt',
      studentGuide: [
        'Goal for Goat Team: Keep Goats safe by surviving or collecting escape data to outrun tigers!',
        'Goal for Tiger Team: Track Goats, unlock hunting data powerups, and capture the herd.',
        'Zones: Board divided into 3 zones: CORNER (highly exposed), EDGE (partially secure), CENTER (safest). Cells display these labels.',
        'Data Tokens: Making moves, attacks, escapes, blocks, and predictions earns Data Tokens!',
        'Goat Power-Ups:',
        '  - Safe Step (3 Escape Tokens): Move one goat up to 2 connected cells.',
        '  - Strong Block (3 Block Tokens): Block a tiger from entering a cell for 1 round.',
        '  - Smart Move (2 Prediction Tokens): Gain capture immunity and see tiger moves.',
        'Tiger Power-Ups:',
        '  - Focused Hunt (3 Attack Tokens): Long range leap capture at distance 2 (cannot capture grouped goats).',
        '  - Ambush (2 Prediction Tokens): Double step movement (up to 2 empty nodes).',
        '  - Center Control (3 center Move Tokens): Prevent Goats from passing through the center cell.',
        'Prediction Mechanic: Predict opponent movements to earn Prediction Tokens! Wrong predictions disable data collection in Advanced.',
        `Win Condition: Surviving ${preset.goatSurvivalTurns} turns or escaping ${escapeReq} times (Goats) or capturing ${preset.tigerCapturesRequired} goats (Tigers).`,
      ],
      stemMathTitle: 'Data Event Tokens Table',
      stemMathFormula: [
        { label: 'Goat Escape Token', formula: 'Goat moves away from Tiger proximity cell (3 unlocks Safe Step)' },
        { label: 'Goat Block Token', formula: 'Goat moves to block Tiger path next to Goat (3 unlocks Strong Block)' },
        { label: 'Tiger Attack Token', formula: 'Tiger completes a capture attempt (3 unlocks Focused Hunt)' },
        { label: 'Prediction Token', formula: 'Correctly predict opponent next move (2 unlocks Smart Move/Ambush)' },
        { label: 'Tiger Center Token', formula: 'Tiger lands in Center zone (3 unlocks Center Control)' },
      ],
      presets: [
        { name: 'Zones Board', info: `${preset.gridSize}×${preset.gridSize} Board with Corner, Edge, and Center zones` },
        { name: 'Tigers / Goats', info: `${preset.startingPieces.filter(p=>p.type==='tiger').length} Tigers / ${preset.startingPieces.filter(p=>p.type==='goat').length} Goats` },
        { name: 'Win Targets', info: `Tigers: ${preset.tigerCapturesRequired} captures | Goats: ${preset.goatSurvivalTurns} turns or ${escapeReq} escapes` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Data collection, tallying, zone-wise classification, prediction under uncertainty, and strategic evidence-based planning.',
    observations: 'Observe if students use zone data to position themselves. Encourage teams to analyze logs to verify who has power-ups unlocked and how predictions are evaluated.',
    questions: [
      'Which zone is safest based on our tallied move data?',
      'Why is prediction accuracy important in this game?',
      'How does unlocking Safe Step or Focused Hunt change the balance of power?',
      'Can you spot a pattern in the tiger\'s movement zone preferences?',
    ],
    discussionPrompt: 'Which zone has the most goat moves so far?',
  }),

  getClassroomModeConfig: (_turnNumber: number) => {
    return {
      prompts: [
        'Which zone has the highest density of movements so far?',
        'Was the prediction correct? How should we adjust our model?',
        'Do Goats have enough escape data to activate a Safe Step?',
        'Should we use Center Control now to lock down the board?',
      ],
      roles: [
        { role: 'Data Recorder', desc: 'Maintain live count of Escape, Block, Attack, and Prediction Tokens.' },
        { role: 'Zone Analyst', desc: 'Report the tally percentage of Corners, Edges, and Centers.' },
        { role: 'Prediction Checker', desc: 'Announce predictions and verify if the opponent\'s move matched.' },
        { role: 'Strategy Explainer', desc: 'Advise on spending tokens for optimal offensive/defensive powers.' },
      ],
    };
  },
};
