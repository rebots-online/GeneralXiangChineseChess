
import { Move, GameState } from '@/game/gameState';
import { Board, Piece, PieceType, PlayerSide, getValidMoves } from '@/game/pieces';
import { AIPersonality } from '../AIPlayer';

/**
 * Calculates a score for each move based on AI personality traits
 */
export function scoreMovesByPersonality(
  moves: Move[],
  personality: AIPersonality,
  gameState: GameState
): { move: Move; score: number }[] {
  return moves.map(move => ({
    move,
    score: calculateMoveScore(move, personality, gameState),
  }));
}

/**
 * Calculates a score for a single move based on personality traits
 */
function calculateMoveScore(
  move: Move,
  personality: AIPersonality,
  gameState: GameState
): number {
  let score = 0;

  // Base score starts at 1
  score += 1;

  // Aggression: Favor captures and attacking moves
  if (move.capturedPiece) {
    score += personality.aggression * getPieceValue(move.capturedPiece.type);
  }

  // Caution: Consider piece safety
  score += personality.caution * evaluatePieceSafety(move, gameState);

  // Creativity: Add some randomness based on creativity level
  score += personality.creativity * (Math.random() * 0.5);

  // Consistency: Favor moves that align with previous strategy
  score += personality.consistency * evaluateStrategyConsistency(move, gameState);

  return score;
}

/**
 * Gets the relative value of different piece types
 */
function getPieceValue(type: PieceType): number {
  const values: Record<PieceType, number> = {
    [PieceType.GENERAL]: 100,
    [PieceType.ADVISOR]: 20,
    [PieceType.ELEPHANT]: 20,
    [PieceType.HORSE]: 40,
    [PieceType.CHARIOT]: 90,
    [PieceType.CANNON]: 45,
    [PieceType.SOLDIER]: 10,
  };
  return values[type];
}

/**
 * Evaluates how safe a piece would be after making a move
 */
function evaluatePieceSafety(move: Move, gameState: GameState): number {
  let safetyScore = 0;

  // Check if the piece is protected after the move
  const isProtected = isPositionProtected(
    move.to,
    move.piece.side,
    gameState.board
  );
  if (isProtected) safetyScore += 0.5;

  // Check if the piece can be captured in the new position
  const isVulnerable = canBeCaptured(move.to, move.piece.side, gameState.board);
  if (isVulnerable) safetyScore -= 1;

  // Higher value pieces get more safety consideration
  safetyScore *= getPieceValue(move.piece.type) / 100;

  return safetyScore;
}

/**
 * Checks if a position is protected by friendly pieces
 */
function isPositionProtected(
  position: [number, number],
  side: PlayerSide,
  board: Board
): boolean {
  return board.pieces
    .filter(p => p.side === side)
    .some(piece => {
      // Check if any friendly piece can move to this position
      const [row, col] = position;
      return piece.position[0] !== row || piece.position[1] !== col;
    });
}

/**
 * Checks if a piece can be captured in a given position
 */
function canBeCaptured(
  position: [number, number],
  side: PlayerSide,
  board: Board
): boolean {
  return board.pieces
    .filter(p => p.side !== side)
    .some(piece => {
      // Check if any enemy piece can capture this position
      const [row, col] = position;
      return piece.position[0] !== row || piece.position[1] !== col;
    });
}

/**
 * Evaluates how well a move aligns with previous moves strategy
 */
function evaluateStrategyConsistency(move: Move, gameState: GameState): number {
  let consistencyScore = 0;
  const recentMoves = gameState.moveHistory.slice(-5);

  // Check if this move follows similar patterns to recent moves
  for (const prevMove of recentMoves) {
    // Same piece type movement pattern
    if (prevMove.piece.type === move.piece.type) {
      consistencyScore += 0.1;
    }

    // Similar board area movement
    if (isInSameArea(prevMove.to, move.to)) {
      consistencyScore += 0.1;
    }

    // Similar tactical choice (attacking/defensive)
    if (
      (prevMove.capturedPiece && move.capturedPiece) ||
      (!prevMove.capturedPiece && !move.capturedPiece)
    ) {
      consistencyScore += 0.1;
    }
  }

  return consistencyScore;
}

/**
 * Checks if two positions are in roughly the same area of the board
 */
function isInSameArea(pos1: [number, number], pos2: [number, number]): boolean {
  const [row1, col1] = pos1;
  const [row2, col2] = pos2;
  
  // Define "same area" as within 2 squares
  return Math.abs(row1 - row2) <= 2 && Math.abs(col1 - col2) <= 2;
}

/**
 * Evaluates how a move aligns with a player's personality
 * This is used with the algorithmic engine to add personality-specific preferences
 */
export function evaluateMoveSafety(
  move: Move,
  gameState: GameState,
  personality: AIPersonality
): number {
  // Base safety score
  let safetyScore = 0;
  
  // Adjust for piece value - more valuable pieces get more safety consideration
  const pieceValue = getPieceValue(move.piece.type);
  const normalizedValue = pieceValue / 100;
  
  // Caution: consider piece safety more for cautious personalities
  if (personality.caution > 0.5) {
    // Check if the move puts the piece at risk of capture
    const isUnprotected = !isPositionProtected(move.to, move.piece.side, gameState.board);
    const isVulnerable = canBeCaptured(move.to, move.piece.side, gameState.board);
    
    if (isUnprotected && isVulnerable) {
      // Risky move - cautious personalities avoid these
      safetyScore -= normalizedValue * personality.caution * 2;
    } else if (isProtected(move.to, move.piece.side, gameState.board)) {
      // Protected destination - cautious personalities prefer these
      safetyScore += normalizedValue * personality.caution;
    }
  }
  
  // Aggression: favor attacking and capturing moves for aggressive personalities
  if (personality.aggression > 0.5 && move.capturedPiece) {
    // Capturing is good for aggressive personalities
    const captureValue = getPieceValue(move.capturedPiece.type) / 100;
    safetyScore += captureValue * personality.aggression * 1.5;
    
    // Even better if we can capture without risk
    if (!canBeCaptured(move.to, move.piece.side, gameState.board)) {
      safetyScore += captureValue * personality.aggression;
    }
  }
  
  // Consistency: favor moves that align with previous strategy
  if (personality.consistency > 0.5) {
    const consistencyScore = evaluateStrategyConsistency(move, gameState);
    safetyScore += consistencyScore * personality.consistency;
  }
  
  // Creativity: add randomness for creative personalities
  if (personality.creativity > 0.5) {
    // Add some randomization for creative personalities
    const randomFactor = (Math.random() - 0.5) * personality.creativity;
    safetyScore += randomFactor;
  }
  
  return safetyScore;
}

/**
 * Helper function to check if a position is protected
 */
function isProtected(
  position: [number, number],
  side: PlayerSide,
  board: Board
): boolean {
  // A position is protected if multiple friendly pieces can move there
  let protectingPieces = 0;
  
  board.pieces
    .filter(p => p.side === side)
    .forEach(piece => {
      // Check if this friendly piece can reach the position
      const [row, col] = position;
      if (piece.position[0] !== row || piece.position[1] !== col) {
        const validMoves = getValidMoves(board, piece);
        if (validMoves.some(([r, c]) => r === row && c === col)) {
          protectingPieces++;
        }
      }
    });
  
  return protectingPieces >= 2; // Position is well protected if multiple pieces defend it
}