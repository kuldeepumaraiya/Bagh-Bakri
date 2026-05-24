export interface GameIdea {
  id: number;
  title: string;
  status: 'Playable' | 'Coming Soon';
  route: string;
  stemFocus: string;
  shortDescription: string;
  coreConcept: string;
  coreMechanics: string;
  beginnerVersion: string;
  standardVersion: string;
  advancedVersion: string;
  whyFun: string;
  primarySchoolSuitability: string;
  futureImplementationNotes: string;
}

export const GAME_IDEAS: GameIdea[] = [
  {
    id: 1,
    title: 'Math Wall Edition',
    status: 'Playable',
    route: '/ideas/1',
    stemFocus: 'Addition, comparison, spatial reasoning, strategic planning, data observation, team decision-making',
    shortDescription: 'Goats create protective Math Walls through addition, while tigers use number-based capture rules to break them.',
    coreConcept: 'This version redesigns Bagh-Bakri so that addition and comparison become part of the protection and capture system. Goats form Math Walls when adjacent goats stand on numbered nodes that add up to a target value. Tigers capture by checking number sums and can break stronger walls with higher number conditions.',
    coreMechanics: `• Board cells have numbers from 1 to 5
• Goats move to adjacent empty cells
• Tigers move to adjacent empty cells
• Tiger captures when tiger node number plus goat node number is greater than or equal to 6
• Two adjacent goats form a Math Wall when their node numbers add up to 7 or more
• A protected goat can be captured only if tiger node number plus goat node number is greater than or equal to 8`,
    beginnerVersion: '5 by 5 board, 1 tiger, 4 goats',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats',
    whyFun: 'Goats experience a wonderful sense of teamwork when building solid "walls" just under a Tiger\'s nose. Tigers have to calculate complex pathways and wait for the exact moment when the goats\' addition breaks down to make their move.',
    primarySchoolSuitability: 'Very suitable for Classes 3 to 5 because children repeatedly practice addition and comparison through every capture and protection decision.',
    futureImplementationNotes: 'Fully implemented and playable! Features real-time math-wall tracking, dynamic cell-value displays, and automatic capture resolution rules based on values.'
  },
  {
    id: 2,
    title: 'Number Trail',
    status: 'Playable',
    route: '/ideas/2',
    stemFocus: 'Counting, number sequencing, ascending order, descending order, comparison, spatial reasoning',
    shortDescription: 'Goats create connected number trails while tigers try to break the sequence.',
    coreConcept: 'This version teaches children number order and sequencing. Goats win by forming connected number trails such as 1 → 2 → 3 or 1 → 2 → 3 → 4 → 5. Tigers try to break these trails by capturing goats that are part of incomplete or weak sequences.',
    coreMechanics: `• Each board cell has a number
• Goats move to adjacent empty cells
• Goats form a Number Trail when they occupy connected cells in a valid number sequence
• A valid trail can be 1 → 2 → 3, 2 → 3 → 4, or 1 → 2 → 3 → 4 → 5
• Goats in a completed trail become protected
• Tiger can capture unprotected adjacent goats
• Tiger can break a protected trail by attacking the middle number of the trail
• Tiger capture can use comparison, where tiger node number must be greater than the goat node number`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, only 1 → 2 → 3 trails',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, 3-number and 4-number trails',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, full 1 → 2 → 3 → 4 → 5 trails',
    whyFun: 'Children search the board for number sequences and plan routes. Tigers create excitement by trying to break the trails before goats complete them.',
    primarySchoolSuitability: 'Very suitable for Classes 3 to 5 because it directly teaches number order, sequence building, and spatial planning.',
    futureImplementationNotes: 'Add automatic trail detection. Highlight possible number trails. Show completed trails with a glowing path. Show trail messages such as "Number Trail formed: 1 → 2 → 3".'
  },
  {
    id: 3,
    title: 'Pattern Trail',
    status: 'Playable',
    route: '/ideas/3',
    stemFocus: 'Pattern recognition, sequencing, classification, prediction, spatial reasoning, logical thinking',
    shortDescription: 'Goats create shape-based pattern routes while tigers try to break the pattern.',
    coreConcept: 'This version uses symbols or shapes on the board. Goats form Pattern Routes by occupying connected cells that follow a required shape sequence. Tigers break patterns by identifying weak points in the route.',
    coreMechanics: `• Each board cell has a symbol such as circle, triangle, square, or star
• Goats move to adjacent empty cells
• Goats create Pattern Routes like circle → triangle → square
• Goats in a completed Pattern Route become protected
• Tiger can capture unprotected goats
• Tiger can break a protected Pattern Route by capturing the middle-symbol goat`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, only one pattern: circle → triangle → square',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, multiple 3-symbol and 4-symbol patterns',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, includes repeating patterns and mirror patterns',
    whyFun: 'Children visually search for patterns and try to build secret routes. The tiger tries to find and attack the weak point of the pattern.',
    primarySchoolSuitability: 'Very suitable for younger primary students because shape and pattern recognition is visual, direct, and easy to understand.',
    futureImplementationNotes: 'Use clear visual symbols on cells. Highlight valid patterns. Show protected goats with a Pattern Shield. Show messages like "Pattern Route formed: Circle → Triangle → Square".'
  },
  {
    id: 4,
    title: 'Energy Quest',
    status: 'Playable',
    route: '/ideas/4',
    stemFocus: 'Addition, subtraction, resource management, optimization, planning, cause and effect',
    shortDescription: 'Each tiger and goat has energy points, and every move or capture costs energy.',
    coreConcept: 'This version teaches arithmetic and resource planning. Pieces have energy points. Moving, capturing, shielding, and resting affect energy. Children must decide when to spend energy and when to save it.',
    coreMechanics: `• Each goat starts with 5 energy
• Each tiger starts with 8 energy
• Straight move costs 1 energy
• Diagonal move costs 2 energy
• Tiger capture costs 3 energy
• Capturing a shielded goat costs 5 energy
• Two adjacent goats can create an Energy Shield by spending energy
• Pieces can recharge energy based on the rules`,
    beginnerVersion: '5 by 5 board, 1 tiger, 4 goats, simple costs only',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, movement cost and shield cost included',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, adds terrain such as forest, hill, water, and safe cells',
    whyFun: 'Children manage energy like a game resource. Tigers feel powerful but limited. Goats must decide whether to move, shield, or save energy.',
    primarySchoolSuitability: 'Suitable for Classes 4 and 5 because it requires children to track energy values and make repeated subtraction decisions.',
    futureImplementationNotes: 'Add energy bars for each piece. Show move cost before confirming a move. Show messages like "G1 spent 2 energy for diagonal movement". Allow simple and advanced energy modes.'
  },
  {
    id: 5,
    title: 'Geometry Wall',
    status: 'Playable',
    route: '/ideas/5',
    stemFocus: 'Lines, triangles, squares, symmetry, spatial reasoning, structure logic',
    shortDescription: 'Goats form geometric shapes to protect themselves, while tigers attack weak points.',
    coreConcept: 'This version teaches geometry through shape formation. Goats become protected when they form lines, triangles, or squares on the board. Tigers break these structures by attacking their weak points.',
    coreMechanics: `• Goats move to adjacent empty cells
• Tigers move to adjacent empty cells
• Three goats in a straight connected line create a Line Wall
• Three goats forming a triangle create a Triangle Wall
• Four goats forming a square create a Square Wall
• Goats in valid shapes become protected
• Tigers can break shapes by attacking weak points
• Line Wall weak point is the middle goat
• Triangle and Square weak points are corner goats`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, only Line Wall and Triangle Wall',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, includes Line, Triangle, and Square Walls',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, includes symmetry-based walls',
    whyFun: 'Children build visible shapes and use geometry to survive. Tigers must understand the structure to break it.',
    primarySchoolSuitability: 'Very suitable for Classes 3 to 5 because shapes are visible and easy to discuss.',
    futureImplementationNotes: 'Add automatic shape detection. Highlight lines, triangles, and squares. Show messages like "Triangle Wall formed". Add a shape guide panel for students.'
  },
  {
    id: 6,
    title: 'Probability Capture',
    status: 'Playable',
    route: '/ideas/6',
    stemFocus: 'Probability, chance, prediction, risk assessment, comparison, data recording',
    shortDescription: 'Tiger captures depend on chance, and goats become safer when grouped.',
    coreConcept: 'This version teaches probability through capture attempts. Captures are not automatic. Tiger success depends on dice or chance values, and goats reduce capture risk by staying near other goats.',
    coreMechanics: `• Goat and tiger movement remains adjacent
• When a tiger attacks, a dice roll decides capture success
• An isolated goat is easier to capture
• A goat with nearby goats is harder to capture
• If capture fails, the goat escapes to an adjacent empty cell
• Students predict the chance level before the roll
• Capture chances table:
  - Goat alone: capture succeeds on 3, 4, 5, or 6 (66% success)
  - Goat with 1 nearby goat: capture succeeds on 4, 5, or 6 (50% success)
  - Goat with 2 or more nearby goats: capture succeeds on 5 or 6 (33% success)`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, three probability levels',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, adds Tiger Power Cells',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, adds terrain-based probability',
    whyFun: 'Dice rolls create suspense. Children learn that grouping reduces risk and that prediction can improve decision-making.',
    primarySchoolSuitability: 'Suitable for Classes 3 to 5 if probability is introduced as high chance, medium chance, and low chance.',
    futureImplementationNotes: 'Add digital dice. Show probability category before rolling. Record successful and failed captures. Show messages like "Low chance capture: tiger needs 5 or 6".'
  },
  {
    id: 7,
    title: 'Ecosystem Balance',
    status: 'Playable',
    route: '/ideas/7',
    stemFocus: 'Ecology, sustainability, predator-prey balance, food, water, habitat, systems thinking',
    shortDescription: 'The board becomes an ecosystem where goats, tigers, food, water, and balance interact.',
    coreConcept: 'This version teaches environmental science and systems thinking. Goats need food and water. Tigers need to hunt but should not overhunt. If the ecosystem balance falls too low, both teams lose.',
    coreMechanics: `• Board cells have habitat types such as grassland, forest, hill, water, and dry land
• Goats consume grass tokens from grassland cells
• Grassland can become dry if overused
• Goats need access to water
• Tigers have hunger levels
• Overhunting reduces ecosystem balance
• Safe Herds protect goats when they are near food or water
• The Ecosystem Balance Meter tracks system health
• If balance reaches 0, ecosystem collapses and both teams lose`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, only grass, water, tiger hunger, and balance meter',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, adds overgrazing and Safe Herds',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, adds drought, rain, regrowth, and migration paths',
    whyFun: 'The game feels like a living forest. Players compete, but both sides must also prevent ecosystem collapse.',
    primarySchoolSuitability: 'Suitable for Classes 4 and 5 because it introduces science and systems thinking through a story-driven game.',
    futureImplementationNotes: 'Add habitat icons. Add grass tokens. Add tiger hunger bar. Add Ecosystem Balance Meter. Show messages like "Grassland became dry. Balance reduced by 1".'
  },
  {
    id: 8,
    title: 'Data Hunt',
    status: 'Playable',
    route: '/ideas/8',
    stemFocus: 'Data collection, tally marks, comparison, prediction, pattern finding, basic statistics',
    shortDescription: 'Every move creates data, and players use that data to unlock powers and improve strategy.',
    coreConcept: 'This version teaches data literacy. Students collect and use game data such as moves, captures, escapes, blocks, and predictions. Data becomes part of gameplay through tokens and rewards.',
    coreMechanics: `• Each important action creates a data token (e.g. Tiger Move Token, Escape Token, Capture Token, Prediction Token)
• Tokens unlock special powers
• Students compare data during or after play
• Zones can be tracked to find safest and most dangerous areas
• Data Powers:
  - 3 Escape Tokens unlock "Safe Step" for goats
  - 3 Attack Tokens unlock "Focused Hunt" for tigers
  - Correct prediction tokens unlock bonus moves`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, records only tiger moves, escapes, and captures',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, records moves, attacks, captures, escapes, blocks, and predictions',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, includes zone-wise data and post-game charts',
    whyFun: 'Children become data detectives. They use evidence to predict and plan better moves.',
    primarySchoolSuitability: 'Very suitable for classroom play because observer students can collect data while teams play.',
    futureImplementationNotes: 'Add automatic move log. Add tally dashboard. Add zone-wise tracking. Add prediction prompts. Add simple bar chart after the game.'
  },
  {
    id: 9,
    title: 'Logic Lab',
    status: 'Playable',
    route: '/ideas/9',
    stemFocus: 'Conditional logic, algorithmic thinking, classification, comparison, prediction, problem-solving',
    shortDescription: 'Every round has a changing logic rule that controls movement, capture, or protection.',
    coreConcept: 'This version teaches computational thinking. Each round activates a logic rule. Players must understand the rule before moving. This helps children learn condition-based thinking similar to basic programming logic.',
    coreMechanics: `• A Logic Rule Card is revealed each round
• The rule applies to both goats and tigers
• Pieces move only if the active rule allows it
• Capture must also satisfy the active rule
• Goats can create Logic Shields by satisfying the active rule together
• Example Rule Cards: Even Path, Odd Path, Straight Move, Diagonal Move, Greater Move, Smaller Move, Group Rule, Edge Safe, Mirror Rule`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, only Even Path, Odd Path, Straight Move, and Diagonal Move',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, includes comparison and group rules',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, includes symmetry, prime numbers, multiples, and pattern rules',
    whyFun: 'Every round feels different. Children must think, adapt, and explain why a move is valid.',
    primarySchoolSuitability: 'Very suitable for computational thinking and logic learning in Classes 4 and 5.',
    futureImplementationNotes: 'Add rule card deck. Highlight legal moves based on active rule. Show rule explanation panel. Show messages like "Move allowed because this cell is even".'
  },
  {
    id: 10,
    title: 'Build-a-Board',
    status: 'Playable',
    route: '/ideas/10',
    stemFocus: 'Engineering design, spatial reasoning, connectivity, systems thinking, testing, iteration',
    shortDescription: 'Players change the board itself by adding, blocking, or rotating paths.',
    coreConcept: 'This version teaches engineering and design thinking. The board is modular. Players do not only move pieces, they also change the path system. Goats build safe routes. Tigers create traps and block routes.',
    coreMechanics: `• Board is made of path tiles
• Pieces move only through connected paths
• Goats can place Bridge Tiles
• Tigers can place Block Tiles
• Players may rotate tiles in standard or advanced versions
• Goats create Safe Routes to survive
• Tigers control crossroads and dead ends
• Board changes affect future movement
• Tile Types: Straight Path, Corner Path, Crossroad, Block, Bridge, Safe Tile, Tiger Den Tile`,
    beginnerVersion: '5 by 5 board, 1 tiger, 5 goats, only Bridge and Block Tiles, board change allowed every 2 turns',
    standardVersion: '6 by 6 board, 2 tigers, 8 goats, adds Straight, Corner, Crossroad, Block, Bridge, and Safe Tiles',
    advancedVersion: '7 by 7 board, 3 tigers, 12 goats, adds Tiger Den and One-Way Path Tiles',
    whyFun: 'Students build and test the board while playing. One tile change can change the entire game strategy.',
    primarySchoolSuitability: 'Suitable for Classes 4 and 5, especially for design thinking, engineering mindset, and spatial reasoning.',
    futureImplementationNotes: 'Add tile placement mode. Highlight connected paths. Show unreachable zones. Allow bridge and block placement. Add messages like "Safe Route created across the board".'
  }
];
