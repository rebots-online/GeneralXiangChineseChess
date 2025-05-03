import { GameState, Move } from '@/game/gameState';
import { PlayerSide, Board, Piece, PieceType } from '@/game/pieces';
import { analyzeGameState, AnalyzeGameStateInput } from '../flows/analyze-game-state';
import { suggestMove, SuggestMoveInput } from '../flows/suggest-move';

/**
 * Interface for analysis results
 */
export interface GameAnalysis {
  threats: string[];
  opportunities: string[];
  suggestedMoves: string[];
  explanation: string;
}

/**
 * Converts a game state to standard notation for AI analysis
 */
export function serializeGameState(gameState: GameState): string {
  const rows = Array(10).fill(null).map(() => Array(9).fill('.'));
  
  // Fill board with piece symbols
  gameState.board.pieces.forEach(piece => {
    const [row, col] = piece.position;
    rows[row][col] = getPieceNotation(piece);
  });

  // Convert to string
  return rows.map(row => row.join('')).join('\n');
}

/**
 * Gets standard notation for a piece
 */
function getPieceNotation(piece: Piece): string {
  // Use uppercase for red pieces, lowercase for black
  const symbol = piece.side === PlayerSide.RED ? 
    piece.symbol.toUpperCase() : 
    piece.symbol.toLowerCase();
  return symbol;
}

/**
 * Converts move history to standard notation
 */
export function serializeMoveHistory(moves: Move[]): string {
  return moves.map((move, index) => {
    const turnNumber = Math.floor(index / 2) + 1;
    const notation = `${move.piece.symbol}${move.from.join('')}-${move.to.join('')}`;
    return index % 2 === 0 ? 
      `${turnNumber}. ${notation}` : 
      `${notation}`;
  }).join(' ');
}

/**
 * Analyzes the current game state using the Genkit flows
 */
export async function analyzePosition(
  gameState: GameState,
  side: PlayerSide,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<{ analysis: GameAnalysis; suggestedMove: Move | null }> {
  try {
    // Get game state notation
    const boardState = serializeGameState(gameState);
    const moveHistory = serializeMoveHistory(gameState.moveHistory);

    // Analyze position
    const analysisInput: AnalyzeGameStateInput = {
      boardState,
      currentPlayer: side === PlayerSide.RED ? 'red' : 'black',
      moveHistory,
    };
    const analysis = await analyzeGameState(analysisInput);

    // Get move suggestion
    const suggestInput: SuggestMoveInput = {
      gameState: boardState,
      difficulty,
    };
    const suggestion = await suggestMove(suggestInput);
    
    // Convert suggested move to Move object
    const suggestedMove = parseMoveNotation(suggestion.suggestedMove, gameState.board);

    return {
      analysis,
      suggestedMove,
    };
  } catch (error) {
    console.error('Error analyzing position:', error);
    return {
      analysis: {
        threats: [],
        opportunities: [],
        suggestedMoves: [],
        explanation: 'Error analyzing position',
      },
      suggestedMove: null,
    };
  }
}

/**
 * Parse standard algebraic notation into a Move object
 */
function parseMoveNotation(notation: string, board: Board): Move | null {
  try {
    // Example notation: "R0c-1c" (Chariot at 0,2 moves to 1,2)
    const [fromNotation, toNotation] = notation.split('-');
    const fromRow = parseInt(fromNotation[1]);
    const fromCol = fromNotation[2].charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = parseInt(toNotation[0]);
    const toCol = toNotation[1].charCodeAt(0) - 'a'.charCodeAt(0);

    // Find the piece at the starting position
    const piece = board.pieces.find(
      p => p.position[0] === fromRow && p.position[1] === fromCol
    );

    if (!piece) {
      throw new Error(`No piece found at position ${fromRow},${fromCol}`);
    }

    // Find if there's a piece at the target position (for captures)
    const capturedPiece = board.pieces.find(
      p => p.position[0] === toRow && p.position[1] === toCol
    ) || null;

    return {
      piece,
      from: [fromRow, fromCol],
      to: [toRow, toCol],
      capturedPiece,
      notation,
    };
  } catch (error) {
    console.error('Error parsing move notation:', error);
    return null;
  }
}

/**
 * Evaluates positional factors for a game state
 */
export function evaluatePosition(gameState: GameState, side: PlayerSide): number {
  let score = 0;

  // Material score
  score += evaluateMaterial(gameState.board, side);

  // Piece mobility
  score += evaluateMobility(gameState.board, side);

  // Control of center
  score += evaluateCenterControl(gameState.board, side);

  // King safety
  score += evaluateKingSafety(gameState.board, side);

  return score;
}

/**
 * Evaluates material balance
 */
function evaluateMaterial(board: Board, side: PlayerSide): number {
  const pieceValues: Record<PieceType, number> = {
    [PieceType.GENERAL]: 6000,
    [PieceType.ADVISOR]: 120,
    [PieceType.ELEPHANT]: 120,
    [PieceType.HORSE]: 270,
    [PieceType.CHARIOT]: 600,
    [PieceType.CANNON]: 285,
    [PieceType.SOLDIER]: 30,
  };

  return board.pieces.reduce((score, piece) => {
    const value = pieceValues[piece.type];
    return score + (piece.side === side ? value : -value);
  }, 0);
}

/**
 * Evaluates piece mobility
 */
function evaluateMobility(board: Board, side: PlayerSide): number {
  return 0; // TODO: Implement mobility evaluation
}

/**
 * Evaluates control of center squares
 */
function evaluateCenterControl(board: Board, side: PlayerSide): number {
  return 0; // TODO: Implement center control evaluation
}

/**
 * Evaluates king safety
 */
function evaluateKingSafety(board: Board, side: PlayerSide): number {
  return 0; // TODO: Implement king safety evaluation
}