import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors } from './boardHelpers';

// Helper to check if a cell is water
function isWaterCell(coord: string, gridCells: Record<string, CellConfig>): boolean {
  return gridCells[coord]?.habitat === 'water';
}

// Helper to check if a cell is grassland
function isGrasslandCell(coord: string, gridCells: Record<string, CellConfig>): boolean {
  return gridCells[coord]?.habitat === 'grassland';
}

// Check if three goats are connected to form a Safe Herd
function getSafeHerdGoats(pieces: Piece[], gridCells: Record<string, CellConfig>, gridSize: number): Set<string> {
  const goats = pieces.filter(p => p.type === 'goat' && p.position !== "");
  const goatCoords = new Set(goats.map(g => g.position));
  const safeHerd = new Set<string>();

  // Helper to find connected components of goats
  const visited = new Set<string>();
  const components: string[][] = [];

  goats.forEach(g => {
    if (!visited.has(g.position)) {
      const comp: string[] = [];
      const queue = [g.position];
      visited.add(g.position);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);

        const neighbors = getNeighbors(curr, gridSize);
        neighbors.forEach(n => {
          if (goatCoords.has(n) && !visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        });
      }
      components.push(comp);
    }
  });

  // Filter components that satisfy Safe Herd conditions:
  // - 3 or more connected goats
  // - At least one goat ON water or ON grassland (with grass count > 0)
  components.forEach(comp => {
    if (comp.length >= 3) {
      const hasWaterOrGrass = comp.some(coord => {
        const cell = gridCells[coord];
        const isWater = cell?.habitat === 'water';
        const isGrass = cell?.habitat === 'grassland' && (cell.grassCount || 0) > 0;
        return isWater || isGrass;
      });

      if (hasWaterOrGrass) {
        comp.forEach(coord => safeHerd.add(coord));
      }
    }
  });

  return safeHerd;
}

export const ecosystemBalanceLogic: GameLogicEngine = {
  initializeGame: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const gridCells: Record<string, CellConfig> = {};
    const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));

    // Place habitats depending on board size
    // Beginner 5x5, Standard 6x6, Advanced 7x7
    const waterCells = new Set<string>();
    const forestCells = new Set<string>();
    const hillCells = new Set<string>();

    if (version === 'beginner') {
      waterCells.add('C3');
      forestCells.add('B2');
      forestCells.add('D4');
      hillCells.add('A4');
      hillCells.add('E2');
    } else if (version === 'standard') {
      waterCells.add('C3');
      waterCells.add('D4');
      forestCells.add('B2');
      forestCells.add('E5');
      forestCells.add('C5');
      hillCells.add('A4');
      hillCells.add('F3');
      hillCells.add('B5');
    } else {
      waterCells.add('D4');
      waterCells.add('D5');
      waterCells.add('A4');
      forestCells.add('B2');
      forestCells.add('F6');
      forestCells.add('C5');
      forestCells.add('E3');
      hillCells.add('B5');
      hillCells.add('F3');
      hillCells.add('D7');
      hillCells.add('A2');
    }

    for (let r = 1; r <= preset.gridSize; r++) {
      for (let c = 0; c < preset.gridSize; c++) {
        const coord = `${colLetters[c]}${r}`;
        let habitat: 'grassland' | 'forest' | 'hill' | 'water' | 'dry land' = 'grassland';
        let grassCount = 0;

        if (waterCells.has(coord)) {
          habitat = 'water';
        } else if (forestCells.has(coord)) {
          habitat = 'forest';
          grassCount = 2;
        } else if (hillCells.has(coord)) {
          habitat = 'hill';
        } else {
          habitat = 'grassland';
          grassCount = 2; // Starts with 2 grass tokens
        }

        gridCells[coord] = {
          coordinate: coord,
          number: preset.cellNumbers[coord] || 1,
          habitat,
          grassCount: grassCount > 0 ? grassCount : undefined,
        };
      }
    }

    // Set starting balances
    let startingBalance = 5;
    if (version === 'standard') startingBalance = 6;
    else if (version === 'advanced') startingBalance = 8;

    // Tigers start with hunger = 3 (hunger increases over time)
    const pieces = preset.startingPieces.map(p => ({
      ...p,
      hunger: p.type === 'tiger' ? 3 : undefined,
      turnsSinceWater: p.type === 'goat' ? 0 : undefined,
      thirsty: false,
    }));

    return {
      pieces,
      gridCells,
      extraState: {
        balance: startingBalance,
        maxBalance: startingBalance,
        ecosystemBalance: 100, // percentage for UI
        lastEvent: 'Ecosystem balance active. Maintain ecological harmony!',
        tigerCapturesCount: 0,
        tigerCaptureHistory: [], // record turns of captures
        overgrazedCoords: [],
        roundsUnusedGrass: {}, // track grassland cells and turns since used
      },
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

    // Safe Herd Set
    const safeHerd = getSafeHerdGoats(pieces, gridCells, preset.gridSize);

    // Tiger hunger/weak details
    const isWeakTiger = selectedPiece.type === 'tiger' && (selectedPiece.hunger ?? 0) >= 6;

    adj.forEach(c => {
      const p = pieces.find(x => x.position === c);
      const destCell = gridCells[c];

      // Thirsty Goats and Weak Tigers cannot move diagonally
      if (selectedPiece.type === 'goat' && selectedPiece.thirsty) {
        // Only allow horizontal/vertical adjacent moves, filter out diagonal
        const dx = Math.abs(selectedPiece.position.charCodeAt(0) - c.charCodeAt(0));
        const dy = Math.abs(parseInt(selectedPiece.position.substring(1)) - parseInt(c.substring(1)));
        if (dx > 0 && dy > 0) return; // diagonal move
      }

      if (isWeakTiger) {
        // Weak tigers move straight only
        const dx = Math.abs(selectedPiece.position.charCodeAt(0) - c.charCodeAt(0));
        const dy = Math.abs(parseInt(selectedPiece.position.substring(1)) - parseInt(c.substring(1)));
        if (dx > 0 && dy > 0) return; // diagonal blocked for weak
      }

      if (!p) {
        // Can move to empty adjacent cell
        moveHighlights.push(c);
      } else if (p.type === 'goat' && selectedPiece.type === 'tiger') {
        // Tiger capture adjacent goat
        let allowed = true;

        // 1. Forest Cover: Absolute protection
        if (destCell?.habitat === 'forest') {
          allowed = false;
        }

        // 2. Shield: Absolute protection
        if (p.hasShield) {
          allowed = false;
        }

        // 3. Safe Herd protection
        const isGoatInSafeHerd = safeHerd.has(c);
        const goatOnHill = destCell?.habitat === 'hill';

        if (isGoatInSafeHerd && !goatOnHill) {
          const tigerCell = gridCells[selectedPiece.position];
          const tigerOnHill = tigerCell?.habitat === 'hill';
          
          if (!tigerOnHill || isWeakTiger) {
            allowed = false; // Weak tiger or tiger not on Hill cannot break protection!
          }
        }

        if (allowed) {
          captureHighlights.push(c);
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
    currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    extraState: any,
    isCapture: boolean
  ): LogicResult => {
    const preset = VERSION_PRESETS[version];
    let updatedPieces = [...pieces];
    const nextGrid = { ...gridCells };
    const nextExtra = { ...extraState };
    let balanceChange = 0;
    let eventMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';

    const turnNum = (nextExtra.tigerCaptureHistory?.length || 0) + 1;

    if (isCapture) {
      const targetGoat = pieces.find(p => p.position === toCoord)!;
      const tigerCell = gridCells[selectedPiece.position];
      const tigerOnHill = tigerCell?.habitat === 'hill';
      const safeHerd = getSafeHerdGoats(pieces, gridCells, preset.gridSize);
      const isGoatInSafeHerd = safeHerd.has(toCoord);

      // Update pieces: Remove target goat and update tiger
      updatedPieces = updatedPieces.filter(p => p.id !== targetGoat.id).map(p => {
        if (p.id === selectedPiece.id) {
          // Reduce hunger by 2
          const currentHunger = p.hunger ?? 3;
          const newHunger = Math.max(1, currentHunger - 2);
          return { ...p, position: toCoord, hunger: newHunger };
        }
        return p;
      });

      nextExtra.tigerCapturesCount = (nextExtra.tigerCapturesCount || 0) + 1;
      captureStatus = 'success';

      // Overhunting logic: 2 captures within 3 turns
      const captures = nextExtra.tigerCaptureHistory || [];
      captures.push(turnNum);
      nextExtra.tigerCaptureHistory = captures;

      let overhunted = false;
      if (captures.length >= 2) {
        const lastCaptureTurn = captures[captures.length - 1];
        const prevCaptureTurn = captures[captures.length - 2];
        if (lastCaptureTurn - prevCaptureTurn <= 3) {
          overhunted = true;
        }
      }

      let breakMsg = '';
      if (isGoatInSafeHerd && tigerOnHill) {
        breakMsg = 'Tiger used Hill advantage to break Safe Herd protection! ';
      }

      if (overhunted) {
        balanceChange -= 2;
        eventMsg = `${breakMsg}Predator overhunting! Tiger captured Goat at ${toCoord}. Ecosystem Balance drops by 2!`;
      } else {
        eventMsg = `${breakMsg}Tiger successfully hunted Goat at ${toCoord}. Tiger hunger reduced by 2.`;
      }
    } else {
      // Normal move
      updatedPieces = updatedPieces.map(p =>
        p.id === selectedPiece.id ? { ...p, position: toCoord } : p
      );

      if (selectedPiece.type === 'goat') {
        const destCell = nextGrid[toCoord];

        // Reset turnsSinceWater if adjacent to water
        const adjacentCells = getNeighbors(toCoord, preset.gridSize);
        const nearWater = adjacentCells.some(c => isWaterCell(c, nextGrid));

        updatedPieces = updatedPieces.map(p => {
          if (p.id === selectedPiece.id) {
            return {
              ...p,
              turnsSinceWater: nearWater ? 0 : (p.turnsSinceWater || 0) + 1,
              thirsty: nearWater ? false : (p.turnsSinceWater || 0) + 1 >= 4,
            };
          }
          return p;
        });

        // 1. Beginner simplified water safety
        if (version === 'beginner' && nearWater) {
          eventMsg = `Goat reached water safety at ${toCoord}. Protected for 1 round!`;
        } else if (destCell && destCell.habitat === 'grassland' && destCell.grassCount !== undefined && destCell.grassCount > 0) {
          destCell.grassCount -= 1;
          if (destCell.grassCount === 0) {
            destCell.habitat = 'dry land';
            balanceChange -= 1;
            eventMsg = `Goat grazed on ${toCoord}. Grass depleted! Land turned Dry. Balance -1!`;
          } else {
            eventMsg = `Goat grazed sustainably on ${toCoord}. Grass count: ${destCell.grassCount}.`;
          }
        } else if (destCell && destCell.habitat === 'dry land') {
          eventMsg = `Goat moved to Dry Land at ${toCoord}. Lack of resources!`;
        } else {
          eventMsg = `Goat moved to ${toCoord} (${destCell?.habitat || 'Grassland'}).`;
        }

        // Overgrazing: (Standard/Advanced) 3+ adjacent goats near grassland
        if (version !== 'beginner') {
          const compGoats = updatedPieces.filter(p => p.type === 'goat');
          const overgrazedCoords: string[] = [];

          compGoats.forEach(g => {
            const adjGoatCount = compGoats.filter(
              other => other.id !== g.id && getNeighbors(g.position, preset.gridSize).includes(other.position)
            ).length;

            if (adjGoatCount >= 2 && isGrasslandCell(g.position, nextGrid)) {
              overgrazedCoords.push(g.position);
            }
          });

          if (overgrazedCoords.length > 0) {
            balanceChange -= 1;
            nextExtra.overgrazedCoords = overgrazedCoords;
            eventMsg += ` Warning: Overgrazing in grassland! Balance -1.`;
          } else {
            // Recovery: Goats move away from overgrazed area
            if (nextExtra.overgrazedCoords && nextExtra.overgrazedCoords.length > 0) {
              balanceChange += 1;
              eventMsg += ` Goats dispersed. Habitat recovering! Balance +1.`;
            }
            nextExtra.overgrazedCoords = [];
          }
        }
      } else {
        // Tiger moves
        eventMsg = `Tiger moved to ${toCoord}.`;
      }
    }

    // Tick updates at the end of each full turn cycle
    if (currentPlayer === 'goat') {
      // Dehydration triggers
      let dehydrationInc = false;
      updatedPieces = updatedPieces.map(p => {
        if (p.type === 'goat') {
          const adj = getNeighbors(p.position, preset.gridSize);
          const nearWater = adj.some(c => isWaterCell(c, nextGrid));

          if (nearWater) {
            return { ...p, turnsSinceWater: 0, thirsty: false };
          } else {
            const turns = (p.turnsSinceWater || 0) + 1;
            const isThirsty = turns >= 4;
            if (isThirsty && !p.thirsty) dehydrationInc = true;
            return { ...p, turnsSinceWater: turns, thirsty: isThirsty };
          }
        }
        return p;
      });

      if (dehydrationInc) {
        balanceChange -= 1;
        eventMsg += ` A Goat became severely thirsty! Balance -1.`;
      }

      // Regrowth: Grassland unused for 2 rounds regrows
      if (version !== 'beginner') {
        const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));
        for (let r = 1; r <= preset.gridSize; r++) {
          for (let c = 0; c < preset.gridSize; c++) {
            const coord = `${colLetters[c]}${r}`;
            const cell = nextGrid[coord];
            if (cell?.habitat === 'grassland' && cell.grassCount !== undefined && cell.grassCount < 2) {
              const occupier = updatedPieces.some(p => p.position === coord);
              if (!occupier) {
                const turnsUnused = (nextExtra.roundsUnusedGrass[coord] || 0) + 1;
                if (turnsUnused >= 4) { // 2 full rounds = 4 turns
                  cell.grassCount += 1;
                  nextExtra.roundsUnusedGrass[coord] = 0;
                  balanceChange += 1;
                  eventMsg += ` Grass regrew at ${coord}! Balance +1.`;
                } else {
                  nextExtra.roundsUnusedGrass[coord] = turnsUnused;
                }
              } else {
                nextExtra.roundsUnusedGrass[coord] = 0;
              }
            }
          }
        }
      }
    } else {
      // Tiger Hunger increases at end of tiger turn
      let starvedTiger = false;
      updatedPieces = updatedPieces.map(p => {
        if (p.type === 'tiger') {
          const hunger = (p.hunger ?? 3) + 1;
          if (hunger >= 6) starvedTiger = true;
          return { ...p, hunger };
        }
        return p;
      });

      if (starvedTiger) {
        eventMsg += ` Tiger hunger is critical (🍗 >= 6). Weak status active!`;
      }
    }

    // Apply balance updates
    let newBalance = (nextExtra.balance ?? 5) + balanceChange;
    newBalance = Math.min(nextExtra.maxBalance + 2, Math.max(0, newBalance));
    nextExtra.balance = newBalance;
    nextExtra.ecosystemBalance = Math.round((newBalance / nextExtra.maxBalance) * 100);
    nextExtra.lastEvent = eventMsg;

    return {
      pieces: updatedPieces,
      gridCells: nextGrid,
      extraState: nextExtra,
      calculationMsg: eventMsg,
      captureStatus,
      wallStatus: 'none',
    };
  },

  detectProtection: (
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    version: GameVersion,
    extraState: any
  ): Set<string> => {
    const preset = VERSION_PRESETS[version];
    const protectedSet = new Set<string>();

    // 1. Forest Cover Protection
    pieces.forEach(p => {
      if (p.type === 'goat') {
        const cell = gridCells[p.position];
        if (cell?.habitat === 'forest') {
          protectedSet.add(p.position);
        }
      }
    });

    // 2. Beginner Water Safety protection
    if (version === 'beginner') {
      pieces.forEach(p => {
        if (p.type === 'goat') {
          const adj = getNeighbors(p.position, preset.gridSize);
          const hasWater = adj.some(c => isWaterCell(c, gridCells));
          if (hasWater) {
            protectedSet.add(p.position);
          }
        }
      });
    }

    // 3. Safe Herd Protection
    const safeHerd = getSafeHerdGoats(pieces, gridCells, preset.gridSize);
    safeHerd.forEach(coord => protectedSet.add(coord));

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
    const balance = extraState?.balance ?? 5;

    if (balance <= 0) return 'both-lose'; // Collapse

    let winMinBalance = 3;
    if (version === 'advanced') winMinBalance = 4;

    if (capturedGoatsCount >= preset.tigerCapturesRequired && balance >= winMinBalance) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns && balance >= winMinBalance) return 'goat';

    return null;
  },

  generateStemMessage: (
    lastCalculation: string,
    extraState: any
  ): string => {
    const balance = extraState?.ecosystemBalance ?? 100;
    return `Ecosystem Balance: ${balance}% | ${lastCalculation}`;
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    let startBal = 5;
    if (version === 'standard') startBal = 6;
    else if (version === 'advanced') startBal = 8;

    return {
      title: 'Bagh-Bakri Ecosystem Balance',
      studentGuide: [
        'Goal for Goat Team: Survive by foraging grass and finding water without triggering collapse!',
        'Goal for Tiger Team: Manage your hunger by hunting sustainably. Do not wipe out the ecosystem!',
        'Ecosystem Ticks: Grasslands have Grass tokens 🌿. Goats grazing too much turns grassland to Dry Land.',
        'Dry Land Transformation: Dry Land cells reduce ecosystem balance by 1 tick.',
        'Water Hydration (Standard/Advanced): Goats must visit water drops within 4 turns, or they get thirsty (cannot move diagonally).',
        'Tiger Hunger: Tigers lose energy every round (🍗). If hunger reaches 6, tigers get weak (cannot move diagonally, cannot break safe herds). Tiger captures reduce hunger by 2.',
        'Safe Herds: 3 healthy goats standing near water/grassland form a Safe Herd 🛡️. Normal capture is blocked!',
        'Hill Advantage: Tigers on Hills can break Safe Herd protection!',
        'Overhunting Penalty: Tigers capturing 2 goats in 3 turns triggers overhunting, reducing balance by 2 ticks.',
        `Win Condition: Maintain balance above threshold and survive ${preset.goatSurvivalTurns} turns (Goats) or capture ${preset.tigerCapturesRequired} goats (Tigers). Balance reaching 0 collapses the system!`,
      ],
      stemMathTitle: 'Ecosystem Balance System Rules',
      stemMathFormula: [
        { label: 'Ecosystem Collapse', formula: 'Balance reaches 0 → Both teams lose instantly!' },
        { label: 'Grass depletion', formula: 'Grassland grass count = 0 → transforms to Dry Land (-1 tick)' },
        { label: 'Tiger hunger decay', formula: 'End of tiger turn → Hunger +1. Hunger = 6 → Weak Tiger' },
        { label: 'Tiger rest recharge', formula: 'Resting tiger → Hunger -1. Hunting goat → Hunger -2' },
        { label: 'Regrowth', formula: 'Unused grass cells regrow grass after 4 turns of inactivity' },
      ],
      presets: [
        { name: 'Start Balance Ticks', info: `${startBal} Ticks` },
        { name: 'Tigers / Goats', info: `${preset.startingPieces.filter(p=>p.type==='tiger').length} Tigers / ${preset.startingPieces.filter(p=>p.type==='goat').length} Goats` },
        { name: 'Win Targets', info: `Tigers: ${preset.tigerCapturesRequired} captures | Goats: ${preset.goatSurvivalTurns} turns survived` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Ecosystem conservation, predator-prey dynamics, balance of resources, food webs, and sustainability.',
    observations: 'Watch if students realize that greed leads to shared defeat (collapse). Encourage Goats to rotate grasslands and Tigers to space out hunts or rest.',
    questions: [
      'What changed in the ecosystem after this move?',
      'Why is it important for the tiger to rest instead of always capturing?',
      'Which habitat was safest for the goats and why?',
      'What can both teams do to prevent ecosystem collapse?',
    ],
    discussionPrompt: 'What changed in the ecosystem after this move?',
  }),

  getClassroomModeConfig: (_turnNumber: number) => {
    return {
      prompts: [
        'Is the ecosystem balance improving or degrading?',
        'How many grass cells remain? Should goats migrate?',
        'Are tigers becoming weak? What is the impact of overhunting?',
        'Why does overgrazing prevent goats from forming a Safe Herd?',
      ],
      roles: [
        { role: 'Ecosystem Manager', desc: 'Monitor grass counts, thirsty goats, and total ecosystem balance ticks.' },
        { role: 'Balance Analyst', desc: 'Explain how specific actions (grazing, hunting) impacted the balance meter.' },
        { role: 'Hunger Tracker', desc: 'Track tiger hunger and declare when tigers enter weak status.' },
        { role: 'Strategy Planner', desc: 'Recommend conservation movements to protect both prey and predator survival.' },
      ],
    };
  },
};
