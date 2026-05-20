export interface GameIdea {
  id: number;
  title: string;
  stemFocus: string;
  description: string;
  status: 'Playable Now' | 'Coming Soon';
  tag: string; // e.g. "Mathematics", "Science", "Technology", "Engineering"
}

export const GAME_IDEAS: GameIdea[] = [
  {
    id: 1,
    title: 'Bagh-Bakri Math Wall Edition',
    stemFocus: 'Addition, Comparison, Spatial Reasoning, Strategic Planning',
    description: 'STEM learning is integrated into the core mechanics of capture and protection. Goats collaborate to build "Math Walls" (sum ≥ 7) to block Tiger captures (which require Tiger+Goat sum ≥ 6, or ≥ 8 to break walls). No isolated quiz questions—strategy is arithmetic!',
    status: 'Playable Now',
    tag: 'Math & Strategy'
  },
  {
    id: 2,
    title: 'Number Path Bagh-Bakri',
    stemFocus: 'Counting, Number Sequence, Number Comparison',
    description: 'Tigers and Goats must follow specific number sequence lanes. Pieces can only advance by matching arithmetic counts or skip-counting intervals on the path tiles.',
    status: 'Coming Soon',
    tag: 'Mathematics'
  },
  {
    id: 3,
    title: 'Pattern Route Bagh-Bakri',
    stemFocus: 'Patterns, Sequencing, Prediction',
    description: 'The game board contains colored geometric pattern tiles. Move paths dynamically open and close based on pattern matching rules and student sequence predictions.',
    status: 'Coming Soon',
    tag: 'Logic & Patterns'
  },
  {
    id: 4,
    title: 'Energy Move Bagh-Bakri',
    stemFocus: 'Arithmetic, Resource Management, Optimization',
    description: 'Each move costs "Energy Joules" calculated from cells. Goats must manage their shared battery resources to survive while Tigers optimize their kinetic energy outputs.',
    status: 'Coming Soon',
    tag: 'Science & Math'
  },
  {
    id: 5,
    title: 'Geometry Wall Bagh-Bakri',
    stemFocus: 'Shapes, Symmetry, Spatial Reasoning',
    description: 'Goats form defensive polygons (triangles, squares) to protect themselves. Tigers must solve geometric symmetry puzzles to dissolve and bypass the polygonal barriers.',
    status: 'Coming Soon',
    tag: 'Geometry'
  },
  {
    id: 6,
    title: 'Probability Capture Bagh-Bakri',
    stemFocus: 'Probability, Uncertainty, Risk Assessment',
    description: 'Capture attempts and wall defense parameters depend on spinner outcomes. Students calculate risk ratios and fraction probabilities before executing aggressive plays.',
    status: 'Coming Soon',
    tag: 'Data & Statistics'
  },
  {
    id: 7,
    title: 'Ecosystem Balance Bagh-Bakri',
    stemFocus: 'Ecology, Balance, Feedback Loops',
    description: 'Simulates predator-prey relationships. Goats represent herbivores grazing on grass cells while Tigers act as apex predators, exploring ecological equilibrium.',
    status: 'Coming Soon',
    tag: 'Biology & Ecology'
  },
  {
    id: 8,
    title: 'Data Hunt Bagh-Bakri',
    stemFocus: 'Data Collection, Tally Marks, Comparison',
    description: 'Players collect scientific samples distributed across coordinates, recording data in real-time tally systems to unlock power-up moves.',
    status: 'Coming Soon',
    tag: 'Data Science'
  },
  {
    id: 9,
    title: 'Logic Rule Bagh-Bakri',
    stemFocus: 'Conditional Logic, Algorithmic Thinking',
    description: 'Moves are governed by customizable IF-THEN conditional blocks. Students write simple visual algorithms that dictate how pieces respond when adjacent.',
    status: 'Coming Soon',
    tag: 'Computer Science'
  },
  {
    id: 10,
    title: 'Modular Board Bagh-Bakri',
    stemFocus: 'Engineering Design, Testing, Spatial Systems',
    description: 'Features a modular board designed by students. Assemble different configurations and run simulation tests to find the most balanced engineering layout.',
    status: 'Coming Soon',
    tag: 'Engineering'
  }
];
