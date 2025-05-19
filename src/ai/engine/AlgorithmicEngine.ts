
import {
  GameState,
  GameStatus,
  Piece,
  applyMove,
  selectPiece
} from '@/game/gameState';
import { PlayerSide } from '@/game/pieces'; // Import PlayerSide directly from pieces
import { evaluatePosition } from '@/ai/analysis/gameStateAnalysis';
import {
  TranspositionTable,
  hashGameState,
  EntryType
} from './TranspositionTable';

// Define a move structure
export interface Move {
  piece: Piece;
  from: [number, number];
  to: [number, number];
  capturedPiece?: Piece | null;  // Piece that was captured by this move (if any)
  notation?: string;             // Algebraic notation representation of the move
}

// Define difficulty levels
export enum DifficultyLevel {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  EXPERT = "expert"
}

// Map difficulty levels to search depths
const difficultyToDepth: Record<DifficultyLevel, number> = {
  [DifficultyLevel.EASY]: 2,
  [DifficultyLevel.MEDIUM]: 3,
  [DifficultyLevel.HARD]: 4,
  [DifficultyLevel.EXPERT]: 5
};

/**
 * Generate all valid moves for the current player
 */
function generateMoves(gameState: GameState): Move[] {
  const moves: Move[] = [];
  const side = gameState.currentTurn;

  // Get all pieces for the current side
  const pieces = gameState.board.pieces.filter((p: Piece) => p.side === side);

  // For each piece, generate valid moves
  for (const piece of pieces) {
    const [fromRow, fromCol] = piece.position;

    // Create a temporary copy of the state to get valid moves
    const tempState = JSON.parse(JSON.stringify(gameState));

    // Select the piece to get valid moves
    const stateWithSelectedPiece = selectPiece(tempState, fromRow, fromCol);

    // Get valid moves from the board state
    const validMoves = stateWithSelectedPiece.board.validMoves || [];
    
    // Create Move objects
    for (const [toRow, toCol] of validMoves) {
      // Check if there's a piece at the target position (for captures)
      const capturedPiece = gameState.board.pieces.find((p: Piece) => 
        p.position[0] === toRow && p.position[1] === toCol && p.side !== side
      ) || null;
      
      // Create move with capturedPiece property
      moves.push({
        piece,
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        capturedPiece,
        notation: `${piece.type}${fromRow},${fromCol}-${toRow},${toCol}`
      });
    }
  }

  return moves;
}

/**
 * Apply a move to a gameState and return the new state
 */
function makeMove(gameState: GameState, move: Move): GameState {
  // Create a deep copy of the game state to avoid mutating the original
  const newState = JSON.parse(JSON.stringify(gameState));
  
  // Find the piece in the new state
  const piece = newState.board.pieces.find((p: Piece) => 
    p.id === move.piece.id || 
    (p.position[0] === move.from[0] && p.position[1] === move.from[1] && p.type === move.piece.type)
  );
  
  if (!piece) {
    return newState; // Return unchanged state if piece not found
  }
  
  // Select the piece
  const stateWithSelectedPiece = selectPiece(newState, piece.position[0], piece.position[1]);
  
  // We need a modified version of applyMove that returns a GameState
  // Create a function that properly handles our needs
  const applyMoveAndReturnState = (state: GameState, piece: Piece, toRow: number, toCol: number): GameState => {
    const newState = JSON.parse(JSON.stringify(state));
    
    // Find the piece in the copied state
    const pieceInNewState = newState.board.pieces.find((p: Piece) => 
      p.id === piece.id || 
      (p.position[0] === piece.position[0] && p.position[1] === piece.position[1] && p.type === piece.type)
    );
    
    if (!pieceInNewState) {
      return newState;
    }
    
    // Update piece position
    pieceInNewState.position = [toRow, toCol];
    
    // Remove captured piece if any
    const capturedPieceIndex = newState.board.pieces.findIndex((p: Piece) => 
      p.position[0] === toRow && p.position[1] === toCol && p.side !== pieceInNewState.side
    );
    
    if (capturedPieceIndex !== -1) {
      newState.board.pieces.splice(capturedPieceIndex, 1);
    }
    
    // Clear selection and valid moves
    newState.board.selectedPiece = null;
    newState.board.validMoves = [];
    
    // Switch turn
    newState.currentTurn = newState.currentTurn === PlayerSide.RED ? PlayerSide.BLACK : PlayerSide.RED;
    
    return newState;
  };
  
  // Apply the move using our helper function
  return applyMoveAndReturnState(stateWithSelectedPiece, piece, move.to[0], move.to[1]);
}

/**
 * Get the opponent's side
 */
function getOpponentSide(side: PlayerSide): PlayerSide {
  return side === PlayerSide.RED ? PlayerSide.BLACK : PlayerSide.RED;
}

/**
 * Order moves to improve alpha-beta pruning efficiency
 * Prioritize captures, especially valuable captures
 */
function orderMoves(moves: Move[], gameState: GameState): Move[] {
  // Define piece values for move ordering
  const pieceValues: Record<string, number> = {
    'GENERAL': 6000,
    'CHARIOT': 600,
    'CANNON': 285,
    'HORSE': 270,
    'ADVISOR': 120,
    'ELEPHANT': 120,
    'SOLDIER': 30,
  };

  // Score each move
  const scoredMoves = moves.map(move => {
    let score = 0;

    // Check if it's a capture, and which piece is being captured
    const capturedPiece = gameState.board.pieces.find((p: Piece) =>
      p.position[0] === move.to[0] &&
      p.position[1] === move.to[1] &&
      p.side !== gameState.currentTurn
    );
    
    if (capturedPiece) {
      // Prioritize capturing high-value pieces
      score += pieceValues[capturedPiece.type] * 10;

      // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      // Prioritize capturing valuable pieces with less valuable pieces
      score -= pieceValues[move.piece.type];
    }

    // Prioritize center control for certain pieces
    const [toRow, toCol] = move.to;
    const centerBonus = Math.max(0, 4 - Math.abs(toCol - 4)) *
                        Math.max(0, 5 - Math.abs(toRow - 4.5));

    // Center control bonus for strategic pieces (not general or advisors)
    if (!['GENERAL', 'ADVISOR'].includes(move.piece.type)) {
      score += centerBonus * 2;
    }

    // Prioritize developing pieces in early game
    if (gameState.board.pieces.length > 28) { // Early game
      // Bonus for moving pieces into play (out of back rank)
      const backRank = gameState.currentTurn === PlayerSide.RED ? 9 : 0;
      if (move.piece.position[0] === backRank && move.to[0] !== backRank) {
        score += 5;
      }
    }

    return { move, score };
  });

  // Sort by score in descending order
  scoredMoves.sort((a, b) => b.score - a.score);

  // Return ordered moves
  return scoredMoves.map(m => m.move);
}

/**
 * Basic minimax search algorithm
 */
export function minimax(
  gameState: GameState,
  depth: number,
  maximizing: boolean,
  side: PlayerSide
): [number, Move | null] {
  // If depth is 0 or game is over, evaluate position
  if (depth === 0 || gameState.gameStatus !== GameStatus.IN_PROGRESS) {
    const score = evaluatePosition(gameState, side);
    return [maximizing ? score : -score, null];
  }

  const moves = generateMoves(gameState);

  // If no moves are available, return the evaluation
  if (moves.length === 0) {
    const score = evaluatePosition(gameState, side);
    return [maximizing ? score : -score, null];
  }

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove: Move | null = null;

  // Recursively evaluate all possible moves
  for (const move of moves) {
    const newState = makeMove(gameState, move);
    const [score] = minimax(newState, depth - 1, !maximizing, side);

    if (maximizing && score > bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (!maximizing && score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return [bestScore, bestMove];
}

/**
 * Minimax search with alpha-beta pruning for better performance
 */
export function alphaBeta(
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  side: PlayerSide,
  transTable?: TranspositionTable,
  timeLimit?: { endTime: number; checkTime: boolean }
): [number, Move | null] {
  // Check time limit if provided
  if (timeLimit?.checkTime && Date.now() > timeLimit.endTime) {
    // Time limit reached, return evaluation with no move
    const score = evaluatePosition(gameState, side);
    return [maximizing ? score : -score, null];
  }

  // Check for transposition table hit
  const posHash = transTable ? hashGameState(gameState) : "";
  if (transTable) {
    const ttEntry = transTable.lookup(posHash, depth);
    if (ttEntry) {
      if (ttEntry.type === EntryType.EXACT) {
        return [ttEntry.score, ttEntry.bestMove ? stringToMove(ttEntry.bestMove, gameState) : null];
      } else if (ttEntry.type === EntryType.LOWER_BOUND && ttEntry.score > alpha) {
        alpha = ttEntry.score;
      } else if (ttEntry.type === EntryType.UPPER_BOUND && ttEntry.score < beta) {
        beta = ttEntry.score;
      }

      if (alpha >= beta) {
        return [ttEntry.score, ttEntry.bestMove ? stringToMove(ttEntry.bestMove, gameState) : null];
      }
    }
  }

  // If depth is 0 or game is over, evaluate position
  if (depth === 0 || gameState.gameStatus !== GameStatus.IN_PROGRESS) {
    const score = evaluatePosition(gameState, side);

    // Store in transposition table if available
    if (transTable) {
      transTable.store(posHash, depth, score, EntryType.EXACT);
    }

    return [maximizing ? score : -score, null];
  }

  // Generate and order moves
  let moves = generateMoves(gameState);
  if (moves.length === 0) {
    const score = evaluatePosition(gameState, side);
    return [maximizing ? score : -score, null];
  }

  // Order moves for better pruning
  moves = orderMoves(moves, gameState);

  let bestMove: Move | null = null;
  let entryType = EntryType.UPPER_BOUND;

  if (maximizing) {
    let maxScore = -Infinity;

    for (const move of moves) {
      const newState = makeMove(gameState, move);
      const [score] = alphaBeta(
        newState,
        depth - 1,
        alpha,
        beta,
        false,
        side,
        transTable,
        timeLimit
      );

      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }

      if (score > alpha) {
        alpha = score;
        entryType = EntryType.EXACT;
      }

      if (beta <= alpha) {
        entryType = EntryType.LOWER_BOUND;
        break; // Beta cutoff - prune this branch
      }
    }

    // Store in transposition table if available
    if (transTable && bestMove) {
      transTable.store(
        posHash,
        depth,
        maxScore,
        entryType,
        moveToString(bestMove)
      );
    }

    return [maxScore, bestMove];
  } else {
    let minScore = Infinity;

    for (const move of moves) {
      const newState = makeMove(gameState, move);
      const [score] = alphaBeta(
        newState,
        depth - 1,
        alpha,
        beta,
        true,
        side,
        transTable,
        timeLimit
      );

      if (score < minScore) {
        minScore = score;
        bestMove = move;
      }

      if (score < beta) {
        beta = score;
        entryType = EntryType.EXACT;
      }

      if (beta <= alpha) {
        entryType = EntryType.UPPER_BOUND;
        break; // Alpha cutoff - prune this branch
      }
    }

    // Store in transposition table if available
    if (transTable && bestMove) {
      transTable.store(
        posHash,
        depth,
        minScore,
        entryType,
        moveToString(bestMove)
      );
    }

    return [minScore, bestMove];
  }
}

/**
 * Helper function to convert Move to string for transposition table
 */
function moveToString(move: Move): string {
  return `${move.from[0]},${move.from[1]}-${move.to[0]},${move.to[1]}`;
}

/**
 * Helper function to convert string to Move
 */
function stringToMove(moveStr: string, gameState: GameState): Move | null {

  const [fromStr, toStr] = moveStr.split('-');
  if (!fromStr || !toStr) return null;

  const [fromRow, fromCol] = fromStr.split(',').map(Number);
  const [toRow, toCol] = toStr.split(',').map(Number);

  const piece = gameState.board.pieces.find(p =>
    p.position[0] === fromRow && p.position[1] === fromCol
  );

  if (!piece) return null;

  // Check if there's a piece at the target position (for captures)
  const capturedPiece = gameState.board.pieces.find(p =>
    p.position[0] === toRow && p.position[1] === toCol && p.side !== piece.side
  ) || null;

  return {
    piece,
    from: [fromRow, fromCol],
    to: [toRow, toCol],
    capturedPiece,
    notation: `${piece.type}${fromRow},${fromCol}-${toRow},${toCol}`
  };
}

/**
 * Find the best move for a given game state using minimax with alpha-beta pruning
 * Implements iterative deepening for more responsive behavior
 */

export function findBestMove(
  gameState: GameState,
  maxDepth: number = 3,
  useAlphaBeta: boolean = true,
  timeLimit: number = 3000, // Time limit in milliseconds
  useTransTable: boolean = true,
  transTable?: TranspositionTable
): Move | null {
  
  const side = gameState.currentTurn;
  const endTime = Date.now() + timeLimit;
  
  // Initialize transposition table
  const localTransTable = useTransTable ? new TranspositionTable() : undefined;
  
  // Start with depth 1 and iteratively increase
  let bestMove: Move | null = null;
  let currentDepth = 1;
  
  try {
    // Iterative deepening
    while (currentDepth <= maxDepth && Date.now() < endTime) {
      // Check if we have enough time for another iteration
      const remainingTime = endTime - Date.now();
      if (currentDepth > 1 && remainingTime < timeLimit / (currentDepth * 2)) {
        // Not enough time for another full iteration at this depth
        break;
      }

      let move: Move | null = null;

      if (useAlphaBeta) {
        const [_, newMove] = alphaBeta(
          gameState, 
          currentDepth, 
          -Infinity, 
          Infinity, 
          true, 
          side, 
          localTransTable,
          { endTime, checkTime: true }
        );
        move = newMove;
      } else {
        const [_, newMove] = minimax(gameState, currentDepth, true, side);
        move = newMove;
      }

      // Update best move if we found one
      if (move) {
        bestMove = move;
      }

      // If time is running out, don't start a new iteration
      if (Date.now() > endTime - 100) {
        break;
      }

      // Increase depth for next iteration
      currentDepth++;
    }
  } catch (error) {
    console.error("Error in findBestMove:", error);
    // Return the best move found so far if an error occurs
  }

  return bestMove;
}

/**
 * Algorithmic engine for Chinese Chess
 * Implements multiple optimizations for better performance:
 * - Move ordering for better pruning
 * - Transposition table for position caching
 * - Iterative deepening for responsiveness
 * - Time management to prevent UI freezing
 */
export class AlgorithmicEngine {
  private difficulty: DifficultyLevel;
  private useAlphaBeta: boolean;
  private useTranspositionTable: boolean;
  private transpositionTable: TranspositionTable;
  private thinking: boolean;
  private timeLimits: Record<DifficultyLevel, number>;
  private lastSearchStats: {
    depth: number;
    time: number;
    nodesExplored: number;
    transpositionHits?: number;
  } | null;
  
  constructor(
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM, 
    useAlphaBeta: boolean = true,
    useTranspositionTable: boolean = true
  ) {
    this.difficulty = difficulty;
    this.useAlphaBeta = useAlphaBeta;
    this.useTranspositionTable = useTranspositionTable;
    this.transpositionTable = new TranspositionTable();
    this.thinking = false;
    this.lastSearchStats = null;
    
    // Set time limits based on difficulty (in milliseconds)
    this.timeLimits = {
      [DifficultyLevel.EASY]: 1000,    // 1 second
      [DifficultyLevel.MEDIUM]: 2000,  // 2 seconds
      [DifficultyLevel.HARD]: 3000,    // 3 seconds
      [DifficultyLevel.EXPERT]: 5000   // 5 seconds
    };
  }
  
  /**
   * Find the best move for a given game state
   * Returns a promise to prevent UI freezing during calculation
   */
  findBestMove(gameState: GameState): Promise<Move | null> {
    this.thinking = true;
    const startTime = Date.now();
    
    // Reset statistics
    this.lastSearchStats = null;
    
    // Use a worker or setTimeout to prevent UI freezing
    return new Promise((resolve) => {
      // Use requestAnimationFrame to give browser a chance to update UI
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            const depth = difficultyToDepth[this.difficulty];
            const timeLimit = this.timeLimits[this.difficulty];
            
            // Clear transposition table for new search
            if (this.useTranspositionTable) {
              this.transpositionTable.clear();
            }
            

              const bestMove = findBestMove(
                gameState,
                depth,
                this.useAlphaBeta,
                timeLimit,
                this.useTranspositionTable,
                this.useTranspositionTable ? this.transpositionTable : undefined
              );
    
    
            // Record search statistics
            const endTime = Date.now();
            this.lastSearchStats = {
              depth,
              time: endTime - startTime,
              nodesExplored: 0, // We would need to count this in the search functions
              transpositionHits: this.useTranspositionTable ? 
                this.transpositionTable.getStats().hits : undefined
            };
            
            this.thinking = false;
            resolve(bestMove);
          } catch (error) {
            console.error("Error in AI thinking:", error);
            this.thinking = false;
            resolve(null);
          }
        }, 0);
      });
    });
  }
  
  /**
   * Check if the engine is currently calculating
   */
  isThinking(): boolean {
    return this.thinking;
  }
  
  /**
   * Set the difficulty level
   */
  setDifficulty(difficulty: DifficultyLevel): void {
    this.difficulty = difficulty;
  }
  
  /**
   * Get the current difficulty level
   */
  getDifficulty(): DifficultyLevel {
    return this.difficulty;
  }
  
  /**
   * Enable or disable alpha-beta pruning
   */
  setUseAlphaBeta(useAlphaBeta: boolean): void {
    this.useAlphaBeta = useAlphaBeta;
  }
  
  /**
   * Check if alpha-beta pruning is enabled
   */
  isUsingAlphaBeta(): boolean {
    return this.useAlphaBeta;
  }
  
  /**
   * Enable or disable transposition table
   */
  setUseTranspositionTable(useTransTable: boolean): void {
    this.useTranspositionTable = useTransTable;
  }
  
  /**
   * Check if transposition table is enabled
   */
  isUsingTranspositionTable(): boolean {
    return this.useTranspositionTable;
  }
  
  /**
   * Get the last search statistics
   */
  getLastSearchStats(): any {
    return this.lastSearchStats;
  }
  
  /**
   * Adjust time limits based on device performance
   * Can be called after a few searches to tune performance
   */
  autoAdjustTimeLimits(): void {
    if (!this.lastSearchStats) return;
    
    // If the search was too slow, reduce time limits
    const actualTime = this.lastSearchStats.time;
    const expectedTime = this.timeLimits[this.difficulty];
    
    if (actualTime > expectedTime * 1.5) {
      // Search took too long, reduce time limits
      Object.keys(this.timeLimits).forEach(key => {
        const diffKey = key as DifficultyLevel;
        this.timeLimits[diffKey] = Math.max(500, this.timeLimits[diffKey] * 0.8);
      });
    } else if (actualTime < expectedTime * 0.5) {
      // Search was faster than expected, can increase limits
      Object.keys(this.timeLimits).forEach(key => {
        const diffKey = key as DifficultyLevel;
        this.timeLimits[diffKey] = Math.min(10000, this.timeLimits[diffKey] * 1.2);
      });
    }
  }
}

