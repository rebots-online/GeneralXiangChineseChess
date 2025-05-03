import { GameState, Move } from '@/game/gameState';
import { PlayerSide, Board, Piece, PieceType, getValidMoves } from '@/game/pieces';
import { scoreMovesByPersonality } from './moves/personalityAdjustments';
import { analyzePosition, evaluatePosition, GameAnalysis } from './analysis/gameStateAnalysis';
import { suggestMove, SuggestMoveInput } from './flows/suggest-move';
import { analyzeGameState, AnalyzeGameStateInput } from './flows/analyze-game-state';

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
  private lastAnalysis: GameAnalysis | null = null;

  constructor(config: AIPlayerConfig) {
    this.side = config.side;
    this.difficulty = config.difficulty;
    this.personality = config.personality ?? this.generateDefaultPersonality();
    this.thinkingTimeMs = this.calculateThinkingTime();
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
      easy: 1000,
      medium: 2500,
      hard: 4000,
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

  private async getGameStateNotation(gameState: GameState): Promise<string> {
    // Convert game state to a notation that Genkit can understand
    // This is a simplified version - implement full notation if needed
    return JSON.stringify({
      board: gameState.board.pieces.map(p => ({
        type: p.type,
        side: p.side,
        position: p.position,
      })),
      currentTurn: gameState.currentTurn,
      moveHistory: gameState.moveHistory,
    });
  }

  private serializeMoveHistory(moves: Move[]): string {
    // Convert move history to a readable format
    return moves.map(m => m.notation).join(' ');
  }

  private async analyzeAndSelectMove(gameState: GameState): Promise<Move | null> {
    try {
      // Get AI analysis of the position
      const { analysis, suggestedMove } = await analyzePosition(gameState, this.side, this.difficulty);
      this.lastAnalysis = analysis;

      // Generate and score all valid moves
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

      if (allMoves.length === 0) {
        return null;
      }

      // Score moves based on both personality and position evaluation
      const scoredMoves = allMoves.map(move => {
        // Get base score from personality evaluation
        const personalityScore = scoreMovesByPersonality([move], this.personality, gameState)[0].score;
        
        // Simulate the move and evaluate the resulting position
        const simulatedState = this.simulateMove(gameState, move);
        const positionScore = evaluatePosition(simulatedState, this.side);
        
        // Weight the scores based on difficulty
        const weights = {
          easy: { personality: 0.7, position: 0.3 },
          medium: { personality: 0.5, position: 0.5 },
          hard: { personality: 0.3, position: 0.7 },
        }[this.difficulty];

        // Calculate final score
        const finalScore = (
          personalityScore * weights.personality +
          positionScore * weights.position
        );

        return { move, score: finalScore };
      });

      // Apply difficulty-based move selection
      const thresholds = {
        easy: 0.7,
        medium: 0.9,
        hard: 0.95,
      };

      // If we have a suggested move from analysis, consider it
      if (suggestedMove) {
        const suggestedMoveScore = scoredMoves.find(
          m => this.isSameMove(m.move, suggestedMove)
        );
        if (suggestedMoveScore && Math.random() < thresholds[this.difficulty]) {
          return suggestedMove;
        }
      }

      // Select move based on difficulty threshold
      return this.selectMoveByScore(scoredMoves, thresholds[this.difficulty]);
    } catch (error) {
      console.error('Error analyzing position:', error);
      return null;
    }
  }

  /**
   * Select a move from scored moves based on difficulty threshold
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

  /**
   * Checks if two moves are effectively the same
   */
  private isSameMove(move1: Move, move2: Move): boolean {
    return move1.from[0] === move2.from[0] &&
           move1.from[1] === move2.from[1] &&
           move1.to[0] === move2.to[0] &&
           move1.to[1] === move2.to[1];
  }

  public async selectMove(gameState: GameState): Promise<Move | null> {
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, this.thinkingTimeMs));

    // Get the best move based on position analysis and personality
    return this.analyzeAndSelectMove(gameState);
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    this.thinkingTimeMs = this.calculateThinkingTime();
  }

  public setPersonality(personality: Partial<AIPersonality>): void {
    this.personality = {
      ...this.personality,
      ...personality,
    };
    this.thinkingTimeMs = this.calculateThinkingTime();
  }
}