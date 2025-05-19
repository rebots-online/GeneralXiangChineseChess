
// Export the algorithmic engine
export { 
  AlgorithmicEngine,
  DifficultyLevel,
  findBestMove,
  minimax,
  alphaBeta
} from './AlgorithmicEngine';

// Export types using 'export type' syntax for isolatedModules compatibility
export type { Move } from './AlgorithmicEngine';

// Export the transposition table
export {
  TranspositionTable,
  hashGameState,
  EntryType
} from './TranspositionTable';

