
import { GameState, Move } from '@/game/gameState';
import { PlayerSide, Board, Piece, PieceType, getValidMoves } from '@/game/pieces';
import { scoreMovesByPersonality } from './moves/personalityAdjustments';
import { evaluatePosition } from './analysis/gameStateAnalysis';
import { AlgorithmicEngine, DifficultyLevel } from './engine';

export interface AIPlayerConfig {
  side: PlayerSide;
  difficulty: 'easy' | 'medium' | 'hard';
  personality?: AIPersonality;
}

export interface AIPersonality {
  aggression: number; // 0-1, how likely to make aggressive moves
  caution: number; // 0-1, how much to value piece safety
  creativity: number; // 0-1, how likely to make unexpected moves
  consistency: number; // 0-1, how likely to stick to a strategy
}

export class AIPlayer {
  private side: PlayerSide;
  private difficulty: 'easy' | 'medium' | 'hard';
  private personality: AIPersonality;
  private thinkingTimeMs: number;
  private engine: AlgorithmicEngine;
  private isThinking: boolean = false;
  private lastAnalysis: any = null; // Store the last position analysis
  private lastGameState: GameState | null = null; // Store the most recent game state

  constructor(config: AIPlayerConfig) {
    this.side = config.side;
    this.difficulty = config.difficulty;
    this.personality = config.personality ?? this.generateDefaultPersonality();
    this.thinkingTimeMs = this.calculateThinkingTime();
    
    // Initialize the algorithmic engine with appropriate difficulty level
    this.engine = new AlgorithmicEngine(
      this.mapDifficultyToEngineLevel(this.difficulty),
      true // Use alpha-beta pruning for better performance
    );
  }

  private generateDefaultPersonality(): AIPersonality {
    return {
      aggression: 0.5,
      caution: 0.5,
      creativity: 0.5,
      consistency: 0.5,
    };
  }

  private calculateThinkingTime(): number {
    // Base thinking time based on difficulty
    const baseTime = {
      easy: 500,
      medium: 1000,
      hard: 1500,
    }[this.difficulty];

    // Add random variation based on personality traits
    const variationRange = baseTime * 0.2;  // 20% variation range
    const consistencyFactor = 1 - this.personality.consistency; // More consistent = less variation
    const creativityFactor = this.personality.creativity; // More creative = more variation
    
    const variation = variationRange * (consistencyFactor + creativityFactor) / 2;
    const randomFactor = (Math.random() * variation * 2) - variation;

    // Aggressive players tend to think faster, cautious players slower
    const speedAdjustment = baseTime * 0.1 * (this.personality.caution - this.personality.aggression);

    return baseTime + randomFactor + speedAdjustment;
  }

  /**
   * Maps the user-facing difficulty level to the engine's internal difficulty level
   */
  private mapDifficultyToEngineLevel(difficulty: 'easy' | 'medium' | 'hard'): DifficultyLevel {
    switch (difficulty) {
      case 'easy':
        return DifficultyLevel.EASY;
      case 'medium':
        return DifficultyLevel.MEDIUM;
      case 'hard':
        return DifficultyLevel.HARD;
      default:
        return DifficultyLevel.MEDIUM;
    }
  }

  /**
   * Applies personality adjustments to an array of moves with scores
   */
  private applyPersonalityAdjustments(
    moves: Move[], 
    gameState: GameState
  ): { move: Move; score: number }[] {
    // Get base scores from personality traits
    const personalityScores = scoreMovesByPersonality(moves, this.personality, gameState);
    
    // Apply personality-based move preference
    for (let i = 0; i < personalityScores.length; i++) {
      const { move, score } = personalityScores[i];
      
      // Add personality-specific adjustments
      if (this.personality.aggression > 0.6 && move.capturedPiece) {
        // Aggressive personalities prefer captures
        personalityScores[i].score += 50 * this.personality.aggression;
      }
      
      if (this.personality.caution > 0.6) {
        // Cautious personalities prefer safer moves
        const simulatedState = this.simulateMove(gameState, move);
        const defensiveScore = evaluatePosition(simulatedState, this.side) * 0.2;
        personalityScores[i].score += defensiveScore * this.personality.caution;
      }
      
      if (this.personality.creativity > 0.7) {
        // Creative personalities sometimes make unexpected moves
        personalityScores[i].score += (Math.random() - 0.5) * 30 * this.personality.creativity;
      }
    }
    
    return personalityScores;
  }

  /**
   * Select a move from scored moves based on threshold
   */
  private selectMoveByScore(
    scoredMoves: { move: Move; score: number }[],
    threshold: number
  ): Move {
    // Sort moves by score in descending order
    const sortedMoves = [...scoredMoves].sort((a, b) => b.score - a.score);
    
    // Calculate threshold index based on perfection parameter
    const thresholdIndex = Math.floor((1 - threshold) * sortedMoves.length);
    
    // Select from top moves up to threshold index
    const selectedIndex = Math.floor(Math.random() * Math.max(1, thresholdIndex));
    return sortedMoves[selectedIndex].move;
  }

  /**
   * Generate algebraic notation for a move
   */
  private generateMoveNotation(
    piece: Piece,
    to: [number, number],
    captured: Piece | null
  ): string {
    const [toRow, toCol] = to;
    const pieceSymbol = piece.symbol;
    const capture = captured ? 'x' : '-';
    return `${pieceSymbol}${piece.position[0]}${piece.position[1]}${capture}${toRow}${toCol}`;
  }

  /**
   * Checks if two moves are effectively the same
   */
  private isSameMove(move1: Move, move2: Move): boolean {
    return move1.from[0] === move2.from[0] &&
           move1.from[1] === move2.from[1] &&
           move1.to[0] === move2.to[0] &&
           move1.to[1] === move2.to[1];
  }

  /**
   * Converts an engine Move object to a gameState-compatible Move object
   * This ensures type compatibility between the engine and game state
   */
  private convertEngineMove(engineMove: any): Move | null {
    // Ensure all required properties exist
    if (!engineMove) return null;

    // Find the captured piece if not already present
    let capturedPiece = engineMove.capturedPiece;
    if (capturedPiece === undefined) {
      capturedPiece = this.findCapturedPiece(engineMove.to, engineMove.piece.side);
    }
    
    // Generate notation if not already present
    const notation = engineMove.notation || 
      this.generateMoveNotation(engineMove.piece, engineMove.to, capturedPiece);
    
    // Create a new Move object that conforms to the gameState Move interface
    return {
      piece: engineMove.piece,
      from: engineMove.from,
      to: engineMove.to,
      capturedPiece: capturedPiece,
      notation: notation
    };
  }
  
  /**
   * Helper function to find a captured piece at a given position
   */
  private findCapturedPiece(position: [number, number], side: PlayerSide): Piece | null {
    const [row, col] = position;
    // Find a piece at the target position that belongs to the opposite side
    return this.lastGameState?.board.pieces.find(
      p => p.position[0] === row && p.position[1] === col && p.side !== side
    ) || null;
  }

  /**
   * Simulates a move and returns the resulting game state
   */
  private simulateMove(gameState: GameState, move: Move): GameState {
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    const board = newState.board;

    // Remove captured piece if any
    if (move.capturedPiece) {
      board.pieces = board.pieces.filter(
        p => !(p.position[0] === move.capturedPiece!.position[0] &&
               p.position[1] === move.capturedPiece!.position[1])
      );
    }

    // Update piece position
    const piece = board.pieces.find(
      p => p.position[0] === move.from[0] && p.position[1] === move.from[1]
    );
    if (piece) {
      piece.position = [...move.to];
    }

    return newState;
  }

  public async selectMove(gameState: GameState): Promise<Move | null> {
    this.isThinking = true;
    try {
      // Realistic thinking delay
      await new Promise<void>(resolve => setTimeout(resolve, this.thinkingTimeMs));

      // First, use the engine to find the best move
      const algorithmicMove = await this.engine.findBestMove(gameState);
      if (!algorithmicMove) {
        return null;
      }

      // Generate all valid moves to apply personality adjustments
      const allMoves: Move[] = [];
      const pieces = gameState.board.pieces.filter(p => p.side === this.side);
      for (const piece of pieces) {
        const validMoves = getValidMoves(gameState.board, piece);
        for (const [toRow, toCol] of validMoves) {
          const targetPiece = gameState.board.pieces.find(
            p => p.position[0] === toRow && p.position[1] === toCol
          ) || null;
          
          allMoves.push({
            piece,
            from: piece.position,
            to: [toRow, toCol],
            capturedPiece: targetPiece,
            notation: this.generateMoveNotation(piece, [toRow, toCol], targetPiece),
          });
        }
      }
      
      // Apply personality adjustments to all moves
      const scoredMoves = this.applyPersonalityAdjustments(allMoves, gameState);
      scoredMoves.sort((a, b) => b.score - a.score);

      // Determine how likely we are to pick the algorithmic (best) move
      const bestMoveThresholds = {
        easy: 0.5,
        medium: 0.75,
        hard: 0.9,
      };
      const threshold = bestMoveThresholds[this.difficulty];


      // Store the current game state for future reference
      this.lastGameState = gameState;
      
      // Check if we should use the algorithmic best move or a personality-influenced move
      if (Math.random() < threshold) {
        // Use the algorithmic best move with proper type conversion

        const convertedMove = algorithmicMove ? this.convertEngineMove(algorithmicMove) : null;
        return convertedMove;
    
      } else {
        // Pick from top 3 personality-scored moves
        const topN = Math.min(3, scoredMoves.length);
        const selectedIndex = Math.floor(Math.random() * topN);
        return scoredMoves[selectedIndex].move;
      }
    
    } finally {
      // Clear thinking flag when done
      this.isThinking = false;
    }
  }
    
  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    this.thinkingTimeMs = this.calculateThinkingTime();
    
    // Update the engine's difficulty level
    this.engine.setDifficulty(this.mapDifficultyToEngineLevel(difficulty));
  }

  public setPersonality(personality: Partial<AIPersonality>): void {
    this.personality = {
      ...this.personality,
      ...personality,
    };
    this.thinkingTimeMs = this.calculateThinkingTime();
  }
  
  /**
   * Returns whether the AI is currently "thinking" (calculating its next move)
   */
  public isCalculating(): boolean {
    return this.isThinking || this.engine.isThinking();
  }
}