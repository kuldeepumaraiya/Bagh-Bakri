import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors, coordToColRow, colRowToCoord, areAdjacent } from './boardHelpers';

// Helper to determine cardinal path openings for each tile type based on rotation (0, 1, 2, 3)
export function getDirectionsForTileType(tileType: string, rotation: number = 0): string[] {
  let baseDirs: string[] = [];
  switch (tileType) {
    case 'crossroad':
    case 'bridge':
    case 'safe':
    case 'tiger-den':
      baseDirs = ['N', 'S', 'E', 'W'];
      break;
    case 'straight':
      baseDirs = (rotation % 2 === 0) ? ['E', 'W'] : ['N', 'S'];
      break;
    case 'corner':
      const rot = rotation % 4;
      if (rot === 0) baseDirs = ['N', 'E'];
      else if (rot === 1) baseDirs = ['E', 'S'];
      else if (rot === 2) baseDirs = ['S', 'W'];
      else baseDirs = ['W', 'N'];
      break;
    case 'one-way':
      const oneRot = rotation % 4;
      if (oneRot === 0) baseDirs = ['E'];
      else if (oneRot === 1) baseDirs = ['S'];
      else if (oneRot === 2) baseDirs = ['W'];
      else baseDirs = ['N'];
      break;
    case 'block':
    default:
      baseDirs = [];
      break;
  }
  return baseDirs;
}

// Helper to check if two adjacent cells have connecting path openings cardinally
export function arePathsConnected(from: string, to: string, gridCells: Record<string, CellConfig>, gridSize: number): boolean {
  const fromCell = gridCells[from];
  const toCell = gridCells[to];
  if (!fromCell || !toCell) return false;
  if (fromCell.isBlocked || toCell.isBlocked || fromCell.tileType === 'block' || toCell.tileType === 'block') return false;

  const fromCR = coordToColRow(from);
  const toCR = coordToColRow(to);

  const dc = toCR.col - fromCR.col;
  const dr = toCR.row - fromCR.row;

  const fromDirs = getDirectionsForTileType(fromCell.tileType || 'straight', fromCell.rotation || 0);
  const toDirs = getDirectionsForTileType(toCell.tileType || 'straight', toCell.rotation || 0);

  if (dr === -1 && dc === 0) {
    return fromDirs.includes('N') && toDirs.includes('S');
  }
  if (dr === 1 && dc === 0) {
    return fromDirs.includes('S') && toDirs.includes('N');
  }
  if (dr === 0 && dc === 1) {
    return fromDirs.includes('E') && toDirs.includes('W');
  }
  if (dr === 0 && dc === -1) {
    return fromDirs.includes('W') && toDirs.includes('E');
  }

  return false;
}

// Check for dead-end trapping (goat is on a cell with only 1 open connected exit, and tiger is adjacent)
export function isGoatTrappedInDeadEnd(goatCoord: string, pieces: Piece[], gridCells: Record<string, CellConfig>, gridSize: number): boolean {
  const cell = gridCells[goatCoord];
  if (!cell || cell.isBlocked) return false;

  const neighbors = getNeighbors(goatCoord, gridSize);
  const connectedNeighbors = neighbors.filter(n => arePathsConnected(goatCoord, n, gridCells, gridSize));

  if (connectedNeighbors.length === 1) {
    const tigerAdjacent = pieces.some(p => p.type === 'tiger' && areAdjacent(goatCoord, p.position));
    return tigerAdjacent;
  }
  return false;
}

// BFS check to verify if Goats have constructed a Safe Route (connected path from left to right, or top to bottom)
// with minimum goats standing on it, and no tiger on the path
export function findConnectedPaths(
  gridCells: Record<string, CellConfig>,
  gridSize: number,
  pieces: Piece[],
  version: GameVersion
): { path: string[]; type: 'left-right' | 'top-bottom' }[] {
  const colLetters = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));
  const tigerCoords = new Set(pieces.filter(p => p.type === 'tiger' && p.position !== "").map(p => p.position));
  const goatCoords = pieces.filter(p => p.type === 'goat' && p.position !== "").map(p => p.position);

  const foundRoutes: { path: string[]; type: 'left-right' | 'top-bottom' }[] = [];
  const minGoats = (version === 'beginner') ? 2 : 3;

  const runBFS = (starts: string[], targetCheck: (coord: string) => boolean, type: 'left-right' | 'top-bottom') => {
    starts.forEach(start => {
      const startCell = gridCells[start];
      if (!startCell || startCell.isBlocked || startCell.tileType === 'block') return;

      const queue: { coord: string; path: string[] }[] = [{ coord: start, path: [start] }];
      const visited = new Set<string>([start]);

      while (queue.length > 0) {
        const { coord, path } = queue.shift()!;

        if (targetCheck(coord)) {
          const pathGoatsCount = path.filter(c => goatCoords.includes(c)).length;
          const pathHasTiger = path.some(c => tigerCoords.has(c));

          if (pathGoatsCount >= minGoats && !pathHasTiger) {
            foundRoutes.push({ path, type });
          }
        }

        const neighbors = getNeighbors(coord, gridSize);
        neighbors.forEach(n => {
          if (!visited.has(n) && arePathsConnected(coord, n, gridCells, gridSize)) {
            // Tigers standing on Crossroads block passage! (Crossroad Control)
            const isBlockedByTigerCrossroad = tigerCoords.has(n) && gridCells[n]?.tileType === 'crossroad';
            if (!isBlockedByTigerCrossroad) {
              visited.add(n);
              queue.push({ coord: n, path: [...path, n] });
            }
          }
        });
      }
    });
  };

  // Left to Right starts: Col A cells
  const leftStarts = Array.from({ length: gridSize }, (_, r) => `A${r + 1}`);
  const rightTarget = (coord: string) => coord.startsWith(colLetters[gridSize - 1]);
  runBFS(leftStarts, rightTarget, 'left-right');

  // Top to Bottom starts: Row 1 cells
  const topStarts = colLetters.map(c => `${c}1`);
  const bottomTarget = (coord: string) => coord.endsWith(String(gridSize));
  runBFS(topStarts, bottomTarget, 'top-bottom');

  return foundRoutes;
}

export const buildBoardLogic: GameLogicEngine = {
  initializeGame: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const gridCells: Record<string, CellConfig> = {};
    const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));

    for (let r = 1; r <= preset.gridSize; r++) {
      for (let c = 0; c < preset.gridSize; c++) {
        const coord = `${colLetters[c]}${r}`;
        let tileType: 'straight' | 'corner' | 'crossroad' | 'block' | 'bridge' | 'safe' | 'tiger-den' | 'one-way' = 'straight';
        let rotation = 0;
        let isBlocked = false;

        if (version === 'beginner') {
          tileType = 'crossroad';
        } else {
          const isCenterCol = c === Math.floor(preset.gridSize / 2);
          const isCenterRow = r === Math.ceil(preset.gridSize / 2);

          if (isCenterCol && isCenterRow) {
            tileType = 'crossroad';
          } else if (isCenterCol || isCenterRow) {
            tileType = 'straight';
            rotation = isCenterCol ? 1 : 0;
          } else if ((c === 0 && r === 1) || (c === preset.gridSize - 1 && r === preset.gridSize)) {
            tileType = 'corner';
            rotation = (c === 0) ? 1 : 3;
          } else if (c % 2 === 1 && r % 2 === 1) {
            tileType = 'safe';
          } else if (version === 'advanced' && c === 1 && r === preset.gridSize - 1) {
            tileType = 'tiger-den';
          } else if (version === 'advanced' && c === preset.gridSize - 2 && r === 2) {
            tileType = 'one-way';
            rotation = 0;
          } else {
            tileType = 'corner';
            rotation = (c + r) % 4;
          }

          if (version === 'advanced' && (coord === 'B3' || coord === 'E5')) {
            tileType = 'block';
            isBlocked = true;
          }
        }

        gridCells[coord] = {
          coordinate: coord,
          number: preset.cellNumbers[coord] || 1,
          tileType,
          isBlocked,
          rotation,
        };
      }
    }

    return {
      pieces: JSON.parse(JSON.stringify(preset.startingPieces)),
      gridCells,
      extraState: {
        goatBridgesLeft: version === 'beginner' ? 1 : version === 'standard' ? 2 : 3,
        tigerBlocksLeft: version === 'beginner' ? 1 : version === 'standard' ? 2 : 3,
        placedBridges: [] as string[],
        placedBlocks: version === 'advanced' ? ['B3', 'E5'] : [] as string[],
        lastEngineeringEvent: 'Engineering phase initialized. Goats construct bridges, tigers place blocks.',
        activeSafeRoutes: [] as string[][],
        blockedTurnsCount: 0,
        goatSurvivalTurnsTracker: 0,
      },
    };
  },

  getLegalMoves: (
    selectedPiece: Piece,
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    _currentPlayer: 'goat' | 'tiger',
    version: GameVersion,
    extraState: any
  ): LegalMovesResult => {
    const preset = VERSION_PRESETS[version];
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);

    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];

    adj.forEach(c => {
      const cell = gridCells[c];
      if (cell?.isBlocked || cell?.tileType === 'block') return;

      const pathConnected = version === 'beginner' || arePathsConnected(selectedPiece.position, c, gridCells, preset.gridSize);

      if (pathConnected) {
        const p = pieces.find(x => x.position === c);
        if (!p) {
          moveHighlights.push(c);
        } else if (p.type === 'goat' && selectedPiece.type === 'tiger') {
          const isSafeTile = cell?.tileType === 'safe';
          const isSafeRoute = extraState?.activeSafeRoutes?.some((route: string[]) => route.includes(c));

          if (!isSafeTile && !isSafeRoute) {
            captureHighlights.push(c);
          }
        }
      }
    });

    const currentCell = gridCells[selectedPiece.position];
    if (version === 'advanced' && selectedPiece.type === 'tiger' && currentCell?.tileType === 'tiger-den') {
      const connectedNeighbors = adj.filter(n => arePathsConnected(selectedPiece.position, n, gridCells, preset.gridSize));

      connectedNeighbors.forEach(mid => {
        const occupier = pieces.find(p => p.position === mid);
        if (!occupier) {
          const dist2Neighbors = getNeighbors(mid, preset.gridSize);
          dist2Neighbors.forEach(dest => {
            if (dest === selectedPiece.position) return;
            const destCell = gridCells[dest];
            const destConnected = arePathsConnected(mid, dest, gridCells, preset.gridSize);

            if (destConnected && !destCell?.isBlocked && destCell?.tileType !== 'block') {
              const target = pieces.find(p => p.position === dest);
              const isSafeTile = destCell?.tileType === 'safe';
              const isSafeRoute = extraState?.activeSafeRoutes?.some((route: string[]) => route.includes(dest));

              if (target?.type === 'goat' && !isSafeTile && !isSafeRoute) {
                captureHighlights.push(dest);
              }
            }
          });
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
    let calcMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';
    const nextExtra = { ...extraState };

    if (isCapture) {
      const goat = pieces.find(p => p.position === toCoord)!;
      updatedPieces = updatedPieces.filter(p => p.id !== goat.id).map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      captureStatus = 'success';
      calcMsg = `Tiger captured Goat at ${toCoord}!`;

      // Tiger earns 1 block token on capture
      nextExtra.tigerBlocksLeft = (nextExtra.tigerBlocksLeft || 0) + 1;
      calcMsg += ` Tigers earned 1 Block token!`;
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      calcMsg = `${selectedPiece.label} moved to ${toCoord}.`;

      if (selectedPiece.type === 'goat' && isGoatTrappedInDeadEnd(toCoord, updatedPieces, gridCells, preset.gridSize)) {
        calcMsg += ` Warning: Goat is trapped in a dead end!`;
      }
    }

    // Goats earn 1 bridge token every 3 turns or when reaching a safe tile
    if (currentPlayer === 'goat') {
      nextExtra.goatSurvivalTurnsTracker = (nextExtra.goatSurvivalTurnsTracker || 0) + 1;
      if (nextExtra.goatSurvivalTurnsTracker % 3 === 0) {
        nextExtra.goatBridgesLeft = (nextExtra.goatBridgesLeft || 0) + 1;
        calcMsg += ` Goats earned 1 Bridge token for surviving 3 turns!`;
      }

      const destCell = gridCells[toCoord];
      if (destCell?.tileType === 'safe') {
        nextExtra.goatBridgesLeft = (nextExtra.goatBridgesLeft || 0) + 1;
        calcMsg += ` Goats reached a Safe Tile and earned 1 Bridge token!`;
      }
    }

    // Tigers earn 1 block token for controlling a Crossroad cell at the end of their turn
    if (currentPlayer === 'tiger') {
      const tigers = updatedPieces.filter(p => p.type === 'tiger' && p.position !== "");
      const controlsCrossroad = tigers.some(t => gridCells[t.position]?.tileType === 'crossroad');
      if (controlsCrossroad) {
        nextExtra.tigerBlocksLeft = (nextExtra.tigerBlocksLeft || 0) + 1;
        calcMsg += ` Tigers controlled a Crossroad and earned 1 Block token!`;
      }
    }

    // Update active safe routes after any movement
    const routes = findConnectedPaths(gridCells, preset.gridSize, updatedPieces, version);
    nextExtra.activeSafeRoutes = routes.map(r => r.path);

    if (routes.length > (extraState.activeSafeRoutes?.length || 0)) {
      calcMsg += ` [Safe Route Formed!] A connected pathway spans across the board!`;
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
    gridCells: Record<string, CellConfig>,
    version: GameVersion,
    extraState: any
  ): Set<string> => {
    const protectedCoords = new Set<string>();

    pieces.forEach(p => {
      if (p.type === 'goat' && p.position !== "") {
        const cell = gridCells[p.position];
        if (cell?.tileType === 'safe') {
          protectedCoords.add(p.position);
        }
        const onSafeRoute = extraState?.activeSafeRoutes?.some((route: string[]) => route.includes(p.position));
        if (onSafeRoute) {
          protectedCoords.add(p.position);
        }
      }
    });

    return protectedCoords;
  },

  checkWinCondition: (
    pieces: Piece[],
    gridCells: Record<string, CellConfig>,
    capturedGoatsCount: number,
    goatTurnsCount: number,
    version: GameVersion,
    extraState: any,
    _activeWallsCount: number
  ): 'goat' | 'tiger' | 'both-lose' | null => {
    const preset = VERSION_PRESETS[version];

    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';

    const routesCount = extraState?.activeSafeRoutes?.length || 0;
    let targetRoutes = (version === 'beginner') ? 1 : 2;

    if (routesCount >= targetRoutes || goatTurnsCount >= preset.goatSurvivalTurns) return 'goat';

    // Route lockdown win condition
    const goats = pieces.filter(p => p.type === 'goat' && p.position !== "");
    let hasGoatMoves = false;
    goats.forEach(g => {
      const adj = getNeighbors(g.position, preset.gridSize);
      adj.forEach(c => {
        const pathConnected = version === 'beginner' || arePathsConnected(g.position, c, gridCells, preset.gridSize);
        const occupies = pieces.some(p => p.position === c);
        if (pathConnected && !occupies && !gridCells[c]?.isBlocked && gridCells[c]?.tileType !== 'block') {
          hasGoatMoves = true;
        }
      });
    });

    const hasBridgesLeft = (extraState?.goatBridgesLeft ?? 0) > 0;
    if (!hasGoatMoves && !hasBridgesLeft) {
      const blockedTurns = (extraState?.blockedTurnsCount || 0) + 1;
      if (extraState) extraState.blockedTurnsCount = blockedTurns;
      if (blockedTurns >= 4) {
        return 'tiger';
      }
    } else {
      if (extraState) extraState.blockedTurnsCount = 0;
    }

    return null;
  },

  generateStemMessage: (
    lastCalculation: string,
    extraState: any
  ): string => {
    const b = extraState?.goatBridgesLeft ?? 0;
    const bl = extraState?.tigerBlocksLeft ?? 0;
    const rc = extraState?.activeSafeRoutes?.length || 0;
    return `Inventory — Bridges: ${b} | Blocks: ${bl} | Active Safe Routes: ${rc} | ${lastCalculation}`;
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const bridges = version === 'beginner' ? 1 : version === 'standard' ? 2 : 3;
    const blocks = bridges;
    const targetRoutes = (version === 'beginner') ? 1 : 2;

    return {
      title: 'Bagh-Bakri Build-a-Board with STEM Learning',
      studentGuide: [
        'Goal for Goat Team: Build connected safe pathways connecting opposite sides of the board to escape!',
        'Goal for Tiger Team: Place block blocks to trap Goats in dead-ends or lockdown all routes.',
        'Path Connectivity: Pieces can only move cardinally if the path lines align between adjacent cells!',
        'Action Choice: Each turn, teams can choose to MOVE a piece, PLACE a Bridge/Block, or ROTATE an active tile! Placing or rotating consumes your entire turn.',
        'Bridge Placements (Goats): Spend 1 Bridge Token to lay a Bridge crossroad 🌉 to connect empty spaces. Bridges give goats capture protection.',
        'Block Placements (Tigers): Spend 1 Block Token to lay a Block barrier 🧱 to sever connections. Blocks cannot be crossed by any team.',
        'Tile Rotation (Standard/Advanced): Rotate any pathway 🔄 90 degrees clockwise to change how corridors link!',
        'Safe Routes: Constructing a continuous connected path spanning Left-to-Right or Top-to-Bottom protecting Goats! Needs at least 2 goats (Beginner) or 3 goats (Standard/Advanced) standing on it.',
        'Tiger Den (Advanced): Tiger on a Tiger Den tile gets a range-2 leap capture if paths connect.',
        'One-Way Path (Advanced): Allows movement in one direction only.',
        `Win Condition: Survivors survived ${preset.goatSurvivalTurns} turns or formed ${targetRoutes} Safe Routes (Goats) or capturing ${preset.tigerCapturesRequired} goats / triggering a 2-round lockdown (Tigers).`,
      ],
      stemMathTitle: 'Engineering Tile Specifications',
      stemMathFormula: [
        { label: 'Straight Tile', formula: 'Connects opposite edges (rotates between Horiz/Vert)' },
        { label: 'Corner Tile', formula: 'Connects perpendicular edges (NE, ES, SW, WN)' },
        { label: 'Crossroad Tile', formula: 'Fully open in all 4 cardinal directions (N, S, E, W)' },
        { label: 'Safe Tile', formula: 'Fully connected crossroad that blocks normal Tiger captures' },
        { label: 'Tiger Den (Adv)', formula: 'Grants Tiger leap capture range of 2 connected steps' },
      ],
      presets: [
        { name: 'Grid Size', info: `${preset.gridSize}×${preset.gridSize} Board` },
        { name: 'Engineering Inventory', info: `Goats: ${bridges} bridges | Tigers: ${blocks} blocks` },
        { name: 'Win Targets', info: `Tigers: ${preset.tigerCapturesRequired} captures | Goats: ${preset.goatSurvivalTurns} survived or ${targetRoutes} Safe Routes` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Engineering design cycle, structural connectivity, maze-solving, spatial rotations, and systems optimization.',
    observations: 'Watch if students plan bridge placements to link opposite borders. Observe how they rotate straight/corner tiles to redirect tiger pursuits or complete safe paths.',
    questions: [
      'How did placing this bridge or block change the connectedness of the system?',
      'Which paths are now active? Can you trace a route from column A to column G?',
      'What happens when a corner tile is rotated 90 degrees clockwise?',
      'How can the Goat Team bypass a tiger controlling a Crossroad cell?',
    ],
    discussionPrompt: 'How did this bridge or block change the system?',
  }),

  getClassroomModeConfig: (_turnNumber: number) => {
    return {
      prompts: [
        'Trace the path from the left edge to the right. Is it connected?',
        'Does the tiger stand on a Crossroad tile? What is the impact?',
        'What will happen if we rotate this corner tile clockwise?',
        'How many bridges and blocks are left in each team\'s inventory?',
      ],
      roles: [
        { role: 'Route Checker', desc: 'Verify if path openings align between adjacent cells before allowing a move.' },
        { role: 'Builder / Planner', desc: 'Choose the optimal cell to place a Bridge or Block to open/close paths.' },
        { role: 'Symmetry Specialist', desc: 'Predict how rotating a tile changes available exits on the grid.' },
        { role: 'Strategy Auditor', desc: 'Advise on completing the Left-to-Right Safe Route connection.' },
      ],
    };
  },
};
