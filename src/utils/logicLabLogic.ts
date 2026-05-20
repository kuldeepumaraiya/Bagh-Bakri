import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors, coordToColRow, areAdjacent } from './boardHelpers';
import { getCoordZone } from './dataHuntLogic';

export interface RuleCard {
  id: string;
  name: string;
  description: string;
  color: string;
}

// Full rule card definitions divided by difficulty level
export const RULE_DECK: RuleCard[] = [
  // Beginner Rules
  { id: 'even-path', name: 'Even Path Only', description: 'Pieces can only move onto cells with EVEN numbers (2 or 4).', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'odd-path', name: 'Odd Path Only', description: 'Pieces can only move onto cells with ODD numbers (1, 3, or 5).', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'straight-only', name: 'Straight Move Only', description: 'No diagonal movements are allowed this turn. Orthogonal steps only.', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { id: 'diagonal-only', name: 'Diagonal Move Only', description: 'No straight movements are allowed this turn. Diagonal steps only.', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  
  // Standard Rules
  { id: 'greater-move', name: 'Greater Path', description: 'Target cell value must be GREATER than current cell value.', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'smaller-move', name: 'Smaller Path', description: 'Target cell value must be SMALLER than current cell value.', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'group-rule', name: 'Group Rule', description: 'Goats must end adjacent to another goat if possible. Tigers must end adjacent to a piece.', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { id: 'edge-safe', name: 'Edge Safe Mode', description: 'Goats occupying outer Edge or Corner cells are protected unless tiger is also on edge.', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  
  // Advanced Rules
  { id: 'mirror-rule', name: 'Mirror Symmetry', description: 'Target cell number must equal starting cell number, or destination lies on board center row/col.', color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700' },
  { id: 'prime-path', name: 'Prime Path', description: 'Target cell value must be a prime number (2, 3, or 5).', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'multiple-check', name: 'Multiple Check', description: 'Target cell value must be a multiple of 2 or 3 (2, 3, 4).', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { id: 'pattern-rule', name: 'Parity Pattern', description: 'Target cell value must have the OPPOSITE odd/even parity of the current cell.', color: 'bg-pink-50 border-pink-200 text-pink-700' }
];

function isDiagonalMove(from: string, to: string): boolean {
  const f = coordToColRow(from);
  const t = coordToColRow(to);
  return Math.abs(f.col - t.col) > 0 && Math.abs(f.row - t.row) > 0;
}

// Get the subset of rules matching the difficulty setting
function getRulesForVersion(version: GameVersion): RuleCard[] {
  if (version === 'beginner') {
    return RULE_DECK.slice(0, 4);
  } else if (version === 'standard') {
    return RULE_DECK.slice(4, 8);
  } else {
    return RULE_DECK.slice(8, 12);
  }
}

// Check if a move complies with the active rule
function compliesWithRule(
  from: string,
  to: string,
  cellNumbers: Record<string, number>,
  gridSize: number,
  ruleId: string,
  pieceType: 'goat' | 'tiger',
  pieces: Piece[]
): boolean {
  const fromVal = cellNumbers[from] || 1;
  const toVal = cellNumbers[to] || 1;

  switch (ruleId) {
    case 'even-path':
      return toVal % 2 === 0;
    case 'odd-path':
      return toVal % 2 !== 0;
    case 'straight-only':
      return !isDiagonalMove(from, to);
    case 'diagonal-only':
      return isDiagonalMove(from, to);
    case 'greater-move':
      return toVal > fromVal;
    case 'smaller-move':
      return toVal < fromVal;
    case 'group-rule':
      if (pieceType === 'goat') {
        const goats = pieces.filter(p => p.type === 'goat' && p.position !== from);
        const adjacentExists = goats.some(g => getNeighbors(to, gridSize).includes(g.position));
        if (adjacentExists) {
          // If possible, must end adjacent to another goat
          return goats.some(g => areAdjacent(to, g.position));
        }
      } else {
        const otherPieces = pieces.filter(p => p.position !== from);
        return otherPieces.some(p => areAdjacent(to, p.position));
      }
      return true;
    case 'edge-safe':
      return true; // standard moves are unconstrained
    case 'mirror-rule':
      const centerIndex = Math.floor(gridSize / 2);
      const toCR = coordToColRow(to);
      const isCenterLine = toCR.col === centerIndex || toCR.row === centerIndex;
      return toVal === fromVal || isCenterLine;
    case 'prime-path':
      return toVal === 2 || toVal === 3 || toVal === 5;
    case 'multiple-check':
      return toVal % 2 === 0 || toVal % 3 === 0;
    case 'pattern-rule':
      return (fromVal % 2 === 0 && toVal % 2 !== 0) || (fromVal % 2 !== 0 && toVal % 2 === 0);
    default:
      return true;
  }
}

// Find if three coordinates form a horizontal, vertical, or diagonal straight line
function isLineOfThree(c1: string, c2: string, c3: string): boolean {
  const cr1 = coordToColRow(c1);
  const cr2 = coordToColRow(c2);
  const cr3 = coordToColRow(c3);

  // Sorting by col first, then row
  const list = [cr1, cr2, cr3].sort((a, b) => a.col !== b.col ? a.col - b.col : a.row - b.row);

  const dCol1 = list[1].col - list[0].col;
  const dRow1 = list[1].row - list[0].row;
  const dCol2 = list[2].col - list[1].col;
  const dRow2 = list[2].row - list[1].row;

  return dCol1 === dCol2 && dRow1 === dRow2;
}

// Find central/middle node in a straight line of 3 coordinates
function getMiddleCoordinate(c1: string, c2: string, c3: string): string {
  const cr1 = coordToColRow(c1);
  const cr2 = coordToColRow(c2);
  const cr3 = coordToColRow(c3);

  const sorted = [
    { c: c1, cr: cr1 },
    { c: c2, cr: cr2 },
    { c: c3, cr: cr3 }
  ].sort((a, b) => a.cr.col !== b.cr.col ? a.cr.col - b.cr.col : a.cr.row - b.cr.row);

  return sorted[1].c; // Middle index
}

// Helper to determine active Logic Shields
interface LogicShieldInfo {
  shieldType: 'pair' | 'line' | 'edge' | 'group';
  members: Set<string>;
  centralCoordinate?: string;
}

function getActiveShields(pieces: Piece[], version: GameVersion, ruleCardId: string, gridSize: number, cellNumbers: Record<string, number>): LogicShieldInfo[] {
  const goats = pieces.filter(p => p.type === 'goat');
  const goatPositions = goats.map(g => g.position);
  const shields: LogicShieldInfo[] = [];

  if (ruleCardId === 'edge-safe') {
    const members = new Set<string>();
    goats.forEach(g => {
      const zone = getCoordZone(g.position, gridSize);
      if (zone === 'edge' || zone === 'corner') {
        members.add(g.position);
      }
    });
    if (members.size > 0) {
      shields.push({ shieldType: 'edge', members });
    }
    return shields;
  }

  // 1. Even/Odd pair shields
  if (ruleCardId === 'even-path' || ruleCardId === 'odd-path') {
    const isEven = ruleCardId === 'even-path';
    for (let i = 0; i < goats.length; i++) {
      for (let j = i + 1; j < goats.length; j++) {
        const g1 = goats[i].position;
        const g2 = goats[j].position;
        if (areAdjacent(g1, g2)) {
          const v1 = cellNumbers[g1] || 1;
          const v2 = cellNumbers[g2] || 1;
          const match1 = isEven ? v1 % 2 === 0 : v1 % 2 !== 0;
          const match2 = isEven ? v2 % 2 === 0 : v2 % 2 !== 0;
          if (match1 && match2) {
            shields.push({ shieldType: 'pair', members: new Set([g1, g2]) });
          }
        }
      }
    }
  }

  // 2. Straight/Diagonal line shields of 3
  if (ruleCardId === 'straight-only' || ruleCardId === 'diagonal-only') {
    const isStraight = ruleCardId === 'straight-only';
    for (let i = 0; i < goats.length; i++) {
      for (let j = i + 1; j < goats.length; j++) {
        for (let k = j + 1; k < goats.length; k++) {
          const g1 = goats[i].position;
          const g2 = goats[j].position;
          const g3 = goats[k].position;

          if (isLineOfThree(g1, g2, g3)) {
            const isDiag = isDiagonalMove(g1, g2);
            if ((isStraight && !isDiag) || (!isStraight && isDiag)) {
              const mid = getMiddleCoordinate(g1, g2, g3);
              shields.push({
                shieldType: 'line',
                members: new Set([g1, g2, g3]),
                centralCoordinate: mid
              });
            }
          }
        }
      }
    }
  }

  // 3. Greater / Smaller pair shields
  if (ruleCardId === 'greater-move' || ruleCardId === 'smaller-move') {
    const isGreater = ruleCardId === 'greater-move';
    for (let i = 0; i < goats.length; i++) {
      for (let j = 0; j < goats.length; j++) {
        if (i === j) continue;
        const g1 = goats[i].position;
        const g2 = goats[j].position;
        if (areAdjacent(g1, g2)) {
          const v1 = cellNumbers[g1] || 1;
          const v2 = cellNumbers[g2] || 1;
          const condition = isGreater ? v2 > v1 : v2 < v1;
          if (condition) {
            shields.push({ shieldType: 'pair', members: new Set([g1, g2]) });
          }
        }
      }
    }
  }

  // 4. Group Rule shield of 3 connected goats
  if (ruleCardId === 'group-rule') {
    // Look for any connected triple of goats
    for (let i = 0; i < goats.length; i++) {
      for (let j = i + 1; j < goats.length; j++) {
        for (let k = j + 1; k < goats.length; k++) {
          const g1 = goats[i].position;
          const g2 = goats[j].position;
          const g3 = goats[k].position;

          // Check connectivity
          const c12 = areAdjacent(g1, g2);
          const c23 = areAdjacent(g2, g3);
          const c13 = areAdjacent(g1, g3);

          if ((c12 && c23) || (c12 && c13) || (c23 && c13)) {
            shields.push({ shieldType: 'group', members: new Set([g1, g2, g3]) });
          }
        }
      }
    }
  }

  return shields;
}

export const logicLabLogic: GameLogicEngine = {
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
      extraState: {
        activeRuleIndex: 0, // Points to index in activeRulesDeck
        rulesCycleCount: 0,
        unlockedShieldsCount: 0, // Count of logic shields created
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

    const activeRulesDeck = getRulesForVersion(version);
    const activeRuleIdx = extraState.activeRuleIndex ?? 0;
    const ruleCard = activeRulesDeck[activeRuleIdx];

    // Find all active shields
    const activeShields = getActiveShields(pieces, version, ruleCard.id, preset.gridSize, preset.cellNumbers);

    adj.forEach(c => {
      const complies = compliesWithRule(
        selectedPiece.position,
        c,
        preset.cellNumbers,
        preset.gridSize,
        ruleCard.id,
        selectedPiece.type,
        pieces
      );

      if (complies) {
        const p = pieces.find(x => x.position === c);
        if (!p) {
          moveHighlights.push(c);
        } else if (p.type === 'goat' && selectedPiece.type === 'tiger') {
          // If goat is in logic shield, check tiger break rules!
          const protectingShields = activeShields.filter(s => s.members.has(c));
          
          if (protectingShields.length > 0) {
            let canBreak = false;
            
            protectingShields.forEach(shield => {
              if (shield.shieldType === 'pair') {
                // Pair shield is breakable if the tiger attack complies with the active rule
                canBreak = true;
              } else if (shield.shieldType === 'line') {
                // Line shield: tiger can only capture the central/middle goat of the line
                if (c === shield.centralCoordinate) {
                  canBreak = true;
                }
              } else if (shield.shieldType === 'edge') {
                // Edge shield: tiger must also be on an edge or corner cell
                const tigerZone = getCoordZone(selectedPiece.position, preset.gridSize);
                if (tigerZone === 'edge' || tigerZone === 'corner') {
                  canBreak = true;
                }
              } else if (shield.shieldType === 'group') {
                // Group shield: breakable by normal tiger attack
                canBreak = true;
              }
            });

            if (canBreak) {
              captureHighlights.push(c);
            }
          } else {
            // Unshielded goat
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

    const activeRulesDeck = getRulesForVersion(version);
    const ruleCard = activeRulesDeck[nextExtra.activeRuleIndex];

    // Check shields *before* moving to see if any are broken or if new ones form
    const prevShields = getActiveShields(pieces, version, ruleCard.id, preset.gridSize, preset.cellNumbers);

    if (isCapture) {
      const goat = pieces.find(p => p.position === toCoord)!;
      updatedPieces = updatedPieces.filter(p => p.id !== goat.id).map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      captureStatus = 'success';
      calcMsg = `Tiger captured Goat at ${toCoord} satisfying [${ruleCard.name}] condition!`;
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      calcMsg = `${selectedPiece.label} moved to ${toCoord} satisfying [${ruleCard.name}] condition.`;
    }

    // Tally newly created shields (only if goats move)
    if (currentPlayer === 'goat') {
      const postShields = getActiveShields(updatedPieces, version, ruleCard.id, preset.gridSize, preset.cellNumbers);
      if (postShields.length > prevShields.length) {
        const diff = postShields.length - prevShields.length;
        nextExtra.unlockedShieldsCount = (nextExtra.unlockedShieldsCount || 0) + diff;
        calcMsg += ` [Logic Shield Formed!] Goats created a new condition-aligned defensive barrier (+${diff} Shield)!`;
      }
    }

    // Round cycle: New Logic Rule Card appears ONLY after TIGER turn completes!
    if (currentPlayer === 'tiger') {
      const nextIdx = (nextExtra.activeRuleIndex + 1) % activeRulesDeck.length;
      nextExtra.activeRuleIndex = nextIdx;
      nextExtra.rulesCycleCount += 1;

      const newRule = activeRulesDeck[nextIdx];
      calcMsg += ` Round complete. Next condition activated: [${newRule.name}].`;
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
    version: GameVersion,
    extraState: any
  ): Set<string> => {
    const preset = VERSION_PRESETS[version];
    const protectedCoords = new Set<string>();
    const activeRulesDeck = getRulesForVersion(version);
    const activeRuleIdx = extraState.activeRuleIndex ?? 0;
    const ruleCard = activeRulesDeck[activeRuleIdx];

    // Evaluate active shields
    const activeShields = getActiveShields(pieces, version, ruleCard.id, preset.gridSize, preset.cellNumbers);
    activeShields.forEach(shield => {
      shield.members.forEach(c => protectedCoords.add(c));
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
    const shieldsCount = extraState?.unlockedShieldsCount || 0;

    let targetShields = 3;
    if (version === 'standard') targetShields = 4;
    else if (version === 'advanced') targetShields = 5;

    if (capturedGoatsCount >= preset.tigerCapturesRequired) return 'tiger';
    if (goatTurnsCount >= preset.goatSurvivalTurns || shieldsCount >= targetShields) return 'goat';
    return null;
  },

  generateStemMessage: (
    lastCalculation: string,
    extraState: any
  ): string => {
    return lastCalculation;
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const activeRulesDeck = getRulesForVersion(version);
    let targetShields = 3;
    if (version === 'standard') targetShields = 4;
    else if (version === 'advanced') targetShields = 5;

    return {
      title: 'Bagh-Bakri Logic Lab',
      studentGuide: [
        'Goal for Goat Team: Keep Goats safe by surviving or building logic shields aligned with active rule card!',
        'Goal for Tiger Team: Outmaneuver Goats by following and breaking logic shield conditions.',
        'Logic Cards: A single card is active each round, modifying which movements are legal. Moves must comply with the condition!',
        'Logic Shield Protection: Goats form shields matching the active logic card. Normal captures are blocked.',
        'Logic Shield Breaking Exception:',
        '  - Pair Shields (Even/Odd, Greater/Smaller): Tiger can capture either if complies with active card.',
        '  - Line Shields (Straight/Diagonal lines): Tiger can ONLY capture the middle/central goat.',
        '  - Edge Shields (Edge Safe Mode): Tiger can capture ONLY IF the tiger is also standing on an edge or corner cell.',
        `Round Cycle: The rule card cycles to the next queue item ONLY after the Tiger turn ends.`,
        `Win Condition: Surviving ${preset.goatSurvivalTurns} turns or forming ${targetShields} Logic Shields (Goats) or capturing ${preset.tigerCapturesRequired} goats (Tigers).`,
      ],
      stemMathTitle: 'Condition Rules Deck',
      stemMathFormula: activeRulesDeck.map(r => ({
        label: r.name,
        formula: r.description
      })),
      presets: [
        { name: 'Grid Size', info: `${preset.gridSize}×${preset.gridSize} Board with numbered nodes` },
        { name: 'Rotating Rule Deck', info: `${activeRulesDeck.length} difficulty-customized conditional cards` },
        { name: 'Win Targets', info: `Tigers: ${preset.tigerCapturesRequired} captures | Goats: ${preset.goatSurvivalTurns} turns or ${targetShields} Shields` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Algorithmic thinking, conditional clauses (if-then statements), subset classification, and symmetry properties.',
    observations: 'Encourage students to classify moves into true/false states according to rules. Observe how goats cluster to create shields matching odd/even numbers or straight vectors.',
    questions: [
      'Can you explain this active rule as an if-then programming sentence?',
      'Why is this destination cell blocked? What condition was violated?',
      'Which goat in the straight line is central to the logic shield defense?',
      'Why was the tiger able to capture the goat on the edge?',
    ],
    discussionPrompt: 'Can you explain this active rule as an if-then sentence?',
  }),

  getClassroomModeConfig: (turnNumber: number) => {
    // Return placeholder classroom modes that match turn rules
    return {
      prompts: [
        'Read the active Logic Rule card. Which destination cells are currently valid?',
        'Does the active rule create a strategic advantage for Goats or Tigers this round?',
        'How many adjacent goats satisfy the Logic Shield criteria under this rule?',
        'If a player has no legal moves, can they explain why using conditional logic?',
      ],
      roles: [
        { role: 'Logic Checker', desc: 'Verify that every proposed move strictly satisfies the active rule card condition.' },
        { role: 'Shield Auditor', desc: 'Identify when a Logic Shield is formed or broken based on the active condition.' },
        { role: 'Condition Logger', desc: 'Record the history of rule cards and active parities in the board log.' },
        { role: 'Condition Explainer', desc: 'Translate the active card description into a clear "if-then" pseudo-code instruction.' },
      ],
    };
  },
};
