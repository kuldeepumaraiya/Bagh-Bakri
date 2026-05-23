import type { GameVersion, Piece, CellConfig } from '../types';
import type { GameLogicEngine, LegalMovesResult, LogicResult } from './gameLogicRegistry';
import { VERSION_PRESETS } from '../data/gameConfig';
import { getNeighbors } from './boardHelpers';

// Helper to count nearby goats
function getNearbyGoatsCount(goatCoord: string, pieces: Piece[], gridSize: number): number {
  const neighbors = getNeighbors(goatCoord, gridSize);
  return pieces.filter(p => p.type === 'goat' && p.position !== goatCoord && neighbors.includes(p.position)).length;
}

export const probabilityCaptureLogic: GameLogicEngine = {
  initializeGame: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    const gridCells: Record<string, CellConfig> = {};
    const colLetters = Array.from({ length: preset.gridSize }, (_, i) => String.fromCharCode(65 + i));

    // Define terrain positions based on version
    const forestCells = new Set<string>();
    const hillCells = new Set<string>(); // Power cells in Standard
    const waterCells = new Set<string>();

    if (version === 'standard') {
      // Hill cells act as Tiger Power Cells
      hillCells.add('B2');
      hillCells.add('E5');
      hillCells.add('C3');
    } else if (version === 'advanced') {
      forestCells.add('A3');
      forestCells.add('D5');
      forestCells.add('G3');
      forestCells.add('D2');

      hillCells.add('C4');
      hillCells.add('E4');
      hillCells.add('B6');

      waterCells.add('D4');
      waterCells.add('B2');
      waterCells.add('F6');
    }

    for (let r = 1; r <= preset.gridSize; r++) {
      for (let c = 0; c < preset.gridSize; c++) {
        const coord = `${colLetters[c]}${r}`;
        let habitat: 'grassland' | 'forest' | 'hill' | 'water' | 'dry land' = 'grassland';

        if (forestCells.has(coord)) {
          habitat = 'forest';
        } else if (hillCells.has(coord)) {
          habitat = 'hill';
        } else if (waterCells.has(coord)) {
          habitat = 'water';
        }

        gridCells[coord] = {
          coordinate: coord,
          number: preset.cellNumbers[coord] || 1,
          habitat,
        };
      }
    }

    return {
      pieces: JSON.parse(JSON.stringify(preset.startingPieces)),
      gridCells,
      extraState: {
        lastDiceRoll: null,
        lastSuccessThreshold: null,
        lastSuccessChance: null,
        rollResult: 'none',
        prediction: '', // 'success' or 'fail'
        predictionCorrect: null,
        predictionTokens: { goat: 0, tiger: 0 },
        isEscaping: false,
        escapingGoatId: null,
        escapeOptions: [],
        escapesCount: 0,
        capturesCount: 0,
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
    // If in escape selection, only the escaping goat can move to escapeOptions
    if (extraState?.isEscaping) {
      if (selectedPiece.id === extraState.escapingGoatId) {
        return {
          moveHighlights: extraState.escapeOptions || [],
          captureHighlights: [],
        };
      }
      return { moveHighlights: [], captureHighlights: [] };
    }

    const preset = VERSION_PRESETS[version];
    const adj = getNeighbors(selectedPiece.position, preset.gridSize);

    const moveHighlights: string[] = [];
    const captureHighlights: string[] = [];

    adj.forEach(c => {
      const p = pieces.find(x => x.position === c);
      if (!p) {
        // Normal move
        moveHighlights.push(c);
      } else if (p.type === 'goat' && selectedPiece.type === 'tiger') {
        // Tiger can capture adjacent goat (subject to dice roll)
        captureHighlights.push(c);
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
    let calcMsg = '';
    let captureStatus: 'none' | 'success' | 'blocked' = 'none';
    const nextExtra = { ...extraState };

    // If applying an escape move
    if (nextExtra.isEscaping) {
      updatedPieces = updatedPieces.map(p =>
        p.id === nextExtra.escapingGoatId ? { ...p, position: toCoord } : p
      );
      nextExtra.escapesCount = (nextExtra.escapesCount || 0) + 1;
      nextExtra.isEscaping = false;
      nextExtra.escapingGoatId = null;
      nextExtra.escapeOptions = [];
      calcMsg = `Goat successfully escaped to cell ${toCoord}!`;

      return {
        pieces: updatedPieces,
        gridCells,
        extraState: nextExtra,
        calculationMsg: calcMsg,
        captureStatus: 'none',
        wallStatus: 'none',
      };
    }

    if (isCapture) {
      const targetGoat = pieces.find(p => p.position === toCoord)!;
      const nearbyCount = getNearbyGoatsCount(toCoord, pieces, preset.gridSize);

      let successThreshold = 3; // Isolated (0 nearby): succeeds on 3, 4, 5, 6 (High)
      let baseChanceStr = 'High';

      if (nearbyCount === 1) {
        successThreshold = 4; // 1 nearby: succeeds on 4, 5, 6 (Medium)
        baseChanceStr = 'Medium';
      } else if (nearbyCount >= 2) {
        successThreshold = 5; // 2+ nearby: succeeds on 5, 6 (Low)
        baseChanceStr = 'Low';
      }

      // Modifier tracking
      let modifierInfo = '';
      let activeChance = baseChanceStr;

      // 1. Tiger Power Cells (Standard & Advanced Hill cells)
      const tigerCell = gridCells[selectedPiece.position];
      if (tigerCell && tigerCell.habitat === 'hill') {
        if (activeChance === 'Low') activeChance = 'Medium';
        else if (activeChance === 'Medium') activeChance = 'High';
        modifierInfo = ' (Tiger on Hill Power Cell: Chance Improved +1 Level!)';
      }

      // 2. Forest Cell Cover (Advanced only)
      if (version === 'advanced') {
        const goatCell = gridCells[toCoord];
        if (goatCell && goatCell.habitat === 'forest') {
          if (activeChance === 'High') activeChance = 'Medium';
          else if (activeChance === 'Medium') activeChance = 'Low';
          modifierInfo += ' (Goat in Forest: Chance Reduced -1 Level!)';
        }
      }

      // Convert active chance to final threshold
      let finalThreshold = 3;
      let thresholdDesc = '3, 4, 5, or 6';
      if (activeChance === 'Medium') {
        finalThreshold = 4;
        thresholdDesc = '4, 5, or 6';
      } else if (activeChance === 'Low') {
        finalThreshold = 5;
        thresholdDesc = '5 or 6';
      }

      // Roll a digital 6-sided dice
      const diceRoll = (nextExtra.manualDiceRoll !== undefined && nextExtra.manualDiceRoll !== null)
        ? nextExtra.manualDiceRoll
        : Math.floor(Math.random() * 6) + 1;

      // Clean up the manual roll so it doesn't linger
      delete nextExtra.manualDiceRoll;

      const succeeded = diceRoll >= finalThreshold;

      // Handle user predictions
      let predCorrect = null;
      if (nextExtra.prediction) {
        const predictedSuccess = nextExtra.prediction === 'success';
        predCorrect = predictedSuccess === succeeded;
        if (predCorrect) {
          nextExtra.predictionTokens = nextExtra.predictionTokens || { goat: 0, tiger: 0 };
          nextExtra.predictionTokens[currentPlayer] = (nextExtra.predictionTokens[currentPlayer] || 0) + 1;
        }
      }

      nextExtra.lastDiceRoll = diceRoll;
      nextExtra.lastSuccessThreshold = finalThreshold;
      nextExtra.lastSuccessChance = activeChance;
      nextExtra.predictionCorrect = predCorrect;

      if (succeeded) {
        updatedPieces = updatedPieces
          .filter(p => p.id !== targetGoat.id)
          .map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
        captureStatus = 'success';
        nextExtra.rollResult = 'success';
        nextExtra.capturesCount = (nextExtra.capturesCount || 0) + 1;
        calcMsg = `Dice: ${diceRoll} (Needs >= ${finalThreshold} for ${activeChance} Chance)${modifierInfo} → Capture Succeeded! Goat captured at ${toCoord}.`;
      } else {
        // Capture failed. Goat attempts escape.
        const goatNeighbors = getNeighbors(toCoord, preset.gridSize);
        let escapeOptions = goatNeighbors.filter(c => !updatedPieces.some(p => p.position === c));

        // 3. Water Cell Dehydration escape reduction (Advanced only)
        const goatCell = gridCells[toCoord];
        if (version === 'advanced' && goatCell && goatCell.habitat === 'water') {
          if (escapeOptions.length > 0) {
            escapeOptions = escapeOptions.slice(1); // Reduce escape options by 1
            modifierInfo += ' (Goat on Water: Dehydration reduced escape choices!)';
          }
        }

        if (escapeOptions.length > 0) {
          // Goat escapes - Put into escaping state to let the user select
          nextExtra.isEscaping = true;
          nextExtra.escapingGoatId = targetGoat.id;
          nextExtra.escapeOptions = escapeOptions;
          nextExtra.rollResult = 'fail';
          captureStatus = 'blocked';
          calcMsg = `Dice: ${diceRoll} (Needs >= ${finalThreshold} for ${activeChance} Chance)${modifierInfo} → Capture Failed! Goat is escaping! Click a highlighted cell to choose escape route.`;
        } else {
          // No escape routes - Goat is trapped and captured anyway!
          updatedPieces = updatedPieces
            .filter(p => p.id !== targetGoat.id)
            .map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
          captureStatus = 'success';
          nextExtra.rollResult = 'success';
          nextExtra.capturesCount = (nextExtra.capturesCount || 0) + 1;
          calcMsg = `Dice: ${diceRoll} (Needs >= ${finalThreshold} for ${activeChance} Chance)${modifierInfo} → Capture Failed but Goat has no escape route! Goat is captured at ${toCoord}.`;
        }
      }
    } else {
      updatedPieces = updatedPieces.map(p => p.id === selectedPiece.id ? { ...p, position: toCoord } : p);
      calcMsg = `${selectedPiece.label} moved to ${toCoord}.`;
      nextExtra.rollResult = 'none';
    }

    nextExtra.prediction = '';

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
    _extraState: any
  ): Set<string> => {
    // Goats become safer when grouped with other goats.
    const preset = VERSION_PRESETS[version];
    const protectedSet = new Set<string>();

    pieces.forEach(p => {
      if (p.type === 'goat') {
        const nearby = getNearbyGoatsCount(p.position, pieces, preset.gridSize);
        if (nearby >= 1) {
          protectedSet.add(p.position);
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

    // Check escapes target
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
    if (extraState?.lastDiceRoll !== null && extraState?.lastDiceRoll !== undefined) {
      const pred = extraState.predictionCorrect !== null
        ? ` (Prediction: ${extraState.predictionCorrect ? 'Correct ✓' : 'Incorrect ✗'} · Token +1)`
        : '';
      return `${lastCalculation}${pred}`;
    }
    return lastCalculation;
  },

  getHowToPlayGuide: (version: GameVersion) => {
    const preset = VERSION_PRESETS[version];
    let escapeReq = 3;
    if (version === 'standard') escapeReq = 5;
    else if (version === 'advanced') escapeReq = 7;

    return {
      title: 'Bagh-Bakri Probability Capture',
      studentGuide: [
        'Goal for Goat Team: Keep goats grouped to lower tiger success, escape fails, and survive!',
        'Goal for Tiger Team: Plan attacks on isolated goats to maximize your probability of capture.',
        'Movement: Click any piece and move to an adjacent empty node. Tigers can attack adjacent goats.',
        'Capture Rule: Tigers do not capture automatically! They must roll a digital 6-sided dice.',
        'Isolated Goat (0 neighbors): HIGH capture chance! Tiger captures on 3, 4, 5, or 6.',
        'Partially Protected Goat (1 neighbor): MEDIUM capture chance! Tiger captures on 4, 5, or 6.',
        'Fully Protected Goat (2+ neighbors): LOW capture chance! Tiger captures on 5 or 6.',
        'Escape Route: If a capture roll fails, the Goat Team chooses an adjacent empty cell to escape. If trapped, the tiger succeeds.',
        'Tiger Power Cells (Hills in Standard/Advanced): Tiger attacks from Hill improve capture chance by 1 level!',
        'Forest Cover (Advanced): Goat standing in Forest reduces tiger capture chance by 1 level!',
        'Water Cell Dehydration (Advanced): Goat on Water has one fewer escape option if capture fails!',
        `Win Condition: Goats win by surviving ${preset.goatSurvivalTurns} turns or escaping ${escapeReq} times. Tigers win by capturing ${preset.tigerCapturesRequired} goats.`,
      ],
      stemMathTitle: 'Probability Threshold Chart',
      stemMathFormula: [
        { label: 'High Chance (0 neighbors)', formula: 'Succeeds on dice rolls ≥ 3 (4 out of 6 outcomes = 66.7%)' },
        { label: 'Medium Chance (1 neighbor)', formula: 'Succeeds on dice rolls ≥ 4 (3 out of 6 outcomes = 50.0%)' },
        { label: 'Low Chance (2+ neighbors)', formula: 'Succeeds on dice rolls ≥ 5 (2 out of 6 outcomes = 33.3%)' },
        { label: 'Terrain Modifier (+1 level)', formula: 'Tiger on Hill Power Cell: Low → Medium, Medium → High' },
        { label: 'Terrain Modifier (-1 level)', formula: 'Goat in Forest: High → Medium, Medium → Low' },
      ],
      presets: [
        { name: 'Grid Board', info: `${preset.gridSize}×${preset.gridSize} Board` },
        { name: 'Tigers / Goats', info: `${preset.startingPieces.filter(p=>p.type==='tiger').length} Tigers / ${preset.startingPieces.filter(p=>p.type==='goat').length} Goats` },
        { name: 'Win Targets', info: `Tigers: ${preset.tigerCapturesRequired} captures | Goats: ${preset.goatSurvivalTurns} turns or ${escapeReq} escapes` },
      ],
    };
  },

  getTeacherNote: () => ({
    stemConcept: 'Probability, risk assessment, likelihood of outcomes, fractions, and terrain multipliers.',
    observations: 'Encourage students to calculate the fractions (e.g. 4/6 vs 2/6) before rolls. Observe if goats actively move together to reduce tiger capture chance.',
    questions: [
      'Was this a high chance or low chance capture?',
      'Why was this goat safer when grouped?',
      'How many dice outcomes allow a tiger to capture under Medium chance?',
      'Should the tiger attack now or wait for a better chance?',
    ],
    discussionPrompt: 'Was this a high chance or low chance capture?',
  }),

  getClassroomModeConfig: (_turnNumber: number) => {
    return {
      prompts: [
        'What is the probability of success for this attack? (e.g., 4/6 or 2/3 ≈ 67%)',
        'Did the prediction match the actual dice outcome?',
        'How does a Forest or Hill cell change the likelihood of this event?',
        'What is the strategic value of keeping goats grouped?',
      ],
      roles: [
        { role: 'Probability Checker', desc: 'Count neighboring goats and confirm the correct dice threshold.' },
        { role: 'STEM Calculator', desc: 'Convert chance level to fractions and percentage values.' },
        { role: 'Move Recorder', desc: 'Log dice rolls, capture status, escapes, and prediction correctness.' },
        { role: 'Strategy Explainer', desc: 'Propose moves that keep goats grouped or position tigers on Hills.' },
      ],
    };
  },
};
