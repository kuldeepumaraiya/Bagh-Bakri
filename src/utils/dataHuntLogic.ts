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
  const goats = pieces.filter(p => p.type === 'goat' && p.position !== "");
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
        escapeTokens: 0,
        attackTokens: 0,
        predictionTokensGoat: 0,
        predictionTokensTiger: 0,

        // Zone Tallies
        zoneTallies: {
          corner: 0,
          edge: 0,
          center: 0,
        },
        tallyHistory: [] as string[],

        // Prediction mechanics
        prediction: '', // Selected prediction ID (e.g. 'tiger_nearest')
        predictionName: '',
        predictionCorrect: null,
        consecutiveWrongPredictions: 0,
        bonusDisabledTurns: 0,

        // Active Power
        activePower: null, // 'safeStep' | 'focusedHunt' | 'smartMove' | 'dataShield'
        shieldedGoatId: null,
        shieldedGoatCell: null,
        
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
    const wallHighlights: string[] = [];

    const baseNeighbors = getNeighbors(selectedPiece.position, preset.gridSize);
    const adj = baseNeighbors;

    // 1. Safe Step - Goat Range 2 movements
    const isSafeStepActive = selectedPiece.type === 'goat' && extraState?.activePower === 'safeStep';

    if (isSafeStepActive) {
      const visited = new Set<string>([selectedPiece.position]);
      
      // Distance 1 empty cells
      adj.forEach(c => {
        const p = pieces.find(x => x.position === c);
        if (!p) {
          moveHighlights.push(c);
          visited.add(c);
          
          // Distance 2 neighbors from this empty cell
          const subAdj = getNeighbors(c, preset.gridSize);
          subAdj.forEach(sc => {
            if (!visited.has(sc)) {
              const sp = pieces.find(x => x.position === sc);
              if (!sp) {
                moveHighlights.push(sc);
                visited.add(sc);
              }
            }
          });
        }
      });

      return { moveHighlights, captureHighlights, wallHighlights };
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

          // Path is clear if intermediate is empty
          const midPiece = pieces.find(p => p.position === midCoord);
          const destPiece = pieces.find(p => p.position === destCoord);

          if (destPiece?.type === 'goat' && !midPiece) {
            captureHighlights.push(destCoord);
          }
        }
      });
    }

    // 3. Smart Move highlights
    const isSmartMoveActive = extraState?.activePower === 'smartMove';
    if (isSmartMoveActive) {
      if (currentPlayer === 'goat' && selectedPiece.type === 'goat') {
        // Calculate danger zones (cells adjacent to tigers or threatened by focused hunt capture)
        const dangerZones = new Set<string>();
        const tigers = pieces.filter(p => p.type === 'tiger' && p.position !== "");
        
        tigers.forEach(t => {
          // Adjacent danger
          const tAdj = getNeighbors(t.position, preset.gridSize);
          tAdj.forEach(c => dangerZones.add(c));
          
          // Focused hunt danger (even if tiger doesn't have it active, it's a potential threat zone)
          const { col, row } = coordToColRow(t.position);
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
              const midCoord = colRowToCoord(col + d.dc / 2, row + d.dr / 2);
              const destCoord = colRowToCoord(nc, nr);
              const midPiece = pieces.find(p => p.position === midCoord);
              if (!midPiece) {
                dangerZones.add(destCoord);
              }
            }
          });
        });

        dangerZones.forEach(c => wallHighlights.push(c));
      } else if (currentPlayer === 'tiger' && selectedPiece.type === 'tiger') {
        // Calculate goat escape options (cells where goats can move and escape tiger proximity)
        const escapeOptions = new Set<string>();
        const goats = pieces.filter(p => p.type === 'goat' && p.position !== "");
        const tigers = pieces.filter(p => p.type === 'tiger' && p.position !== "");

        goats.forEach(g => {
          const gNeighbors = getNeighbors(g.position, preset.gridSize);
          gNeighbors.forEach(c => {
            const isOccupied = pieces.some(p => p.position === c);
            if (!isOccupied) {
              const adjacentToTiger = tigers.some(t => areAdjacent(c, t.position));
              if (!adjacentToTiger) {
                escapeOptions.add(c);
              }
            }
          });
        });

        escapeOptions.forEach(c => wallHighlights.push(c));
      }
    }

    return { moveHighlights, captureHighlights, wallHighlights };
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

    // 1. Evaluate prediction
    const opponentTeam = currentPlayer === 'goat' ? 'tiger' : 'goat';
    if (nextExtra.prediction) {
      let isCorrect = false;
      const pred = nextExtra.prediction;

      if (opponentTeam === 'goat' && currentPlayer === 'tiger') {
        const prevNearestGoatDist = getDistanceToNearestGoat(selectedPiece.position, pieces);
        const postNearestGoatDist = getDistanceToNearestGoat(toCoord, pieces);

        if (pred === 'tiger_attack') {
          isCorrect = isCapture;
        } else if (pred === 'tiger_nearest') {
          isCorrect = !isCapture && postNearestGoatDist < prevNearestGoatDist;
        } else if (pred === 'tiger_center') {
          isCorrect = !isCapture && destZone === 'center';
        } else if (pred === 'tiger_focused_hunt') {
          isCorrect = (extraState.activePower === 'focusedHunt') || (isCapture && getGridDistance(selectedPiece.position, toCoord) === 2);
        }
      } else if (opponentTeam === 'tiger' && currentPlayer === 'goat') {
        const wasAdjacentToTiger = pieces.filter(p => p.type === 'tiger').some(t => areAdjacent(selectedPiece.position, t.position));
        const isAdjacentToTiger = pieces.filter(p => p.type === 'tiger').some(t => areAdjacent(toCoord, t.position));
        const neighboringGoats = pieces.filter(p => p.type === 'goat' && p.id !== selectedPiece.id && areAdjacent(toCoord, p.position)).length;

        if (pred === 'goat_escape') {
          isCorrect = wasAdjacentToTiger && !isAdjacentToTiger;
        } else if (pred === 'goat_group') {
          isCorrect = neighboringGoats >= 1;
        } else if (pred === 'goat_edge') {
          isCorrect = destZone === 'edge';
        } else if (pred === 'goat_safe_step') {
          isCorrect = (extraState.activePower === 'safeStep') || (getGridDistance(selectedPiece.position, toCoord) === 2);
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

    // 2. Handle Shield block check
    if (isCapture) {
      const targetGoat = pieces.find(p => p.position === toCoord)!;
      if (targetGoat && nextExtra.shieldedGoatId === targetGoat.id) {
        // Capture is BLOCKED by Temporary Data Shield!
        captureStatus = 'blocked';
        if (!isDataLocked) {
          nextExtra.attackTokens = (nextExtra.attackTokens || 0) + 1;
        }
        calcMsg += `Tiger attempted capture on Goat ${targetGoat.label} at ${toCoord}, but it was BLOCKED by the Temporary Data Shield! Tiger earned 1 Attack Token.`;
        
        // Consumed after block or tiger turn completion
        nextExtra.shieldedGoatId = null;
        nextExtra.shieldedGoatCell = null;
        nextExtra.activePower = null;

        return {
          pieces,
          gridCells,
          extraState: nextExtra,
          calculationMsg: calcMsg,
          captureStatus: 'blocked',
          wallStatus: 'none',
        };
      }

      // Successful capture
      updatedPieces = updatedPieces
        .filter(p => p.id !== targetGoat.id)
        .map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      captureStatus = 'success';
      nextExtra.capturesCount = (nextExtra.capturesCount || 0) + 1;
      
      if (!isDataLocked) {
        nextExtra.attackTokens = (nextExtra.attackTokens || 0) + 1;
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
          nextExtra.zoneTallies[destZone] += 1;
        }

        // Tally escapes: Goat moves away from cell adjacent to a tiger
        const tigerPositions = pieces.filter(p => p.type === 'tiger' && p.position !== "").map(p => p.position);
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

        if (nextExtra.activePower === 'safeStep' || nextExtra.activePower === 'smartMove') {
          nextExtra.activePower = null; // Consume goat powers
        }
      } else {
        if (!isDataLocked) {
          nextExtra.zoneTallies[destZone] += 1;
        }
        calcMsg += `Tiger moved to ${toCoord} (${destZone} zone).`;

        if (nextExtra.activePower === 'smartMove') {
          nextExtra.activePower = null; // Consume tiger powers
        }
      }
    }

    // Always clear shielded goat at the end of the Tiger turn
    if (currentPlayer === 'tiger') {
      nextExtra.shieldedGoatId = null;
      nextExtra.shieldedGoatCell = null;
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

    if (extraState?.shieldedGoatCell) {
      protectedSet.add(extraState.shieldedGoatCell);
    }

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
    const shield = extraState?.shieldedGoatCell ? `[Shielded Goat at: ${extraState.shieldedGoatCell}] ` : '';
    return `${active}${shield}${lastCalculation}`;
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    let escapeReq = 3;
    if (version === 'standard') escapeReq = 5;
    else if (version === 'advanced') escapeReq = 7;

    return {
      title: 'Bagh-Bakri Data Hunt with STEM Learning',
      studentGuide: [
        'Goal for Goat Team: Keep Goats safe by surviving or collecting escape data to outrun tigers!',
        'Goal for Tiger Team: Track Goats, unlock hunting data powerups, and capture the herd.',
        'Zones: Board divided into 3 zones: CORNER (highly exposed), EDGE (partially secure), CENTER (safest). Cells display these labels.',
        'Data Tokens: Making moves, attacks, escapes, and predictions earns Data Tokens!',
        'Goat Power-Ups:',
        '  - Safe Step (3 Escape Tokens): Move one goat up to 2 connected cells.',
        '  - Temporary Data Shield (3 Escape Tokens): Shield a selected goat for 1 tiger turn (cannot be captured).',
        '  - Smart Move (2 Prediction Tokens): Highlights danger zones on the board (cells threatened by tiger).',
        'Tiger Power-Ups:',
        '  - Focused Hunt (3 Attack Tokens): Long range leap capture at distance 2 in straight/diagonal lines if path is clear.',
        '  - Smart Move (2 Prediction Tokens): Highlights goat escape routes (cells where goats can escape tiger proximity).',
        'Prediction Mechanic: Predict opponent movements to earn Prediction Tokens! Incorrect predictions in Advanced disable token earning for 1 round.',
        `Win Condition: Surviving ${preset.goatSurvivalTurns} turns or escaping ${escapeReq} times (Goats) or capturing ${preset.tigerCapturesRequired} goats (Tigers).`,
      ],
      stemMathTitle: 'Data Event Tokens Table',
      stemMathFormula: [
        { label: 'Goat Escape Token', formula: 'Goat moves away from Tiger proximity cell (3 unlocks Safe Step or Data Shield)' },
        { label: 'Tiger Attack Token', formula: 'Tiger completes a capture attempt (3 unlocks Focused Hunt)' },
        { label: 'Prediction Token', formula: 'Correctly predict opponent next move (2 unlocks Smart Move)' },
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
        'Should we use a Data Shield now to protect an exposed goat?',
      ],
      roles: [
        { role: 'Data Recorder', desc: 'Maintain live count of Escape, Attack, and Prediction Tokens.' },
        { role: 'Zone Analyst', desc: 'Report the tally percentage of Corners, Edges, and Centers.' },
        { role: 'Prediction Checker', desc: 'Announce predictions and verify if the opponent\'s move matched.' },
        { role: 'Strategy Explainer', desc: 'Advise on spending tokens for optimal offensive/defensive powers.' },
      ],
    };
  },
};
