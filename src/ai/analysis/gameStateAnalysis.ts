
import {
  GameState,
  Move,
  GameStatus
} from '@/game/gameState';
import {
  PlayerSide,
  Board,
  Piece,
  PieceType
} from '@/game/pieces';
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

  // Material score (highest weight - material advantage is crucial)
  score += evaluateMaterial(gameState.board, side);

  // Piece mobility (medium weight - ability to make moves is important)
  score += evaluateMobility(gameState.board, side) * 0.4;

  // Control of center (medium weight - controlling key squares affects tactical opportunities)
  score += evaluateCenterControl(gameState.board, side) * 0.5;

  // King safety (high weight - avoiding check and protecting the king is critical)

  score += evaluateKingSafety(gameState.board, side, gameState.currentTurn) * 0.8;


  // Add game phase adjustments
  // Early game: focus on development and center control
  // Middle game: focus on tactics and piece coordination
  // End game: focus on material and king safety

  // Determine game phase based on piece count
  const pieceCount = gameState.board.pieces.length;
  if (pieceCount >= 28) {
    // Early game (32 pieces at start, consider early game until a few captures)
    score += evaluateCenterControl(gameState.board, side) * 0.3; // Extra weight for center control
  } else if (pieceCount <= 12) {
    // End game (few pieces left, material becomes more important)
    score += evaluateMaterial(gameState.board, side) * 0.2; // Extra weight for material
  }

  // Add draw evaluation (if game is drawn, score is 0)
  if (gameState.gameStatus === GameStatus.DRAW) {
    return 0;
  }


  // Add checkmate evaluation (if game is won/lost, score is extremely negative/positive)
  // Use RED_WON or BLACK_WON instead of non-existent CHECKMATE
  const isRedTurn = gameState.currentTurn === PlayerSide.RED;

  // Game is over with winner - apply appropriate scoring
  if ((gameState.gameStatus === GameStatus.RED_WON && isRedTurn) ||
      (gameState.gameStatus === GameStatus.BLACK_WON && !isRedTurn)) {
    // Current player has won
    return 10000;
  } else if ((gameState.gameStatus === GameStatus.RED_WON && !isRedTurn) ||
             (gameState.gameStatus === GameStatus.BLACK_WON && isRedTurn)) {
    // Current player has lost
    return -10000;
  }
  
  return score;
}

/**
 * Evaluates material balance
 */
function evaluateMaterial(board: Board, side: PlayerSide): number {
  const pieceValues: Record<PieceType, number> = {
    [PieceType.GENERAL]: 6000,  // Highest value - losing the general means losing the game
    [PieceType.ADVISOR]: 120,   // Advisors are useful but limited to the palace
    [PieceType.ELEPHANT]: 120,  // Elephants can't cross the river, limiting their value
    [PieceType.HORSE]: 270,     // Horses are valuable tactical pieces
    [PieceType.CHARIOT]: 600,   // Chariots are the most powerful pieces (like rooks)
    [PieceType.CANNON]: 285,    // Cannons are strong but need a piece to jump over for captures
    [PieceType.SOLDIER]: 30,    // Soldiers are weak but gain power after crossing the river
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
  let mobilityScore = 0;
  const opponentSide = side === PlayerSide.RED ? PlayerSide.BLACK : PlayerSide.RED;
  
  // Define mobility weights by piece type
  const mobilityWeights: Record<PieceType, number> = {
    [PieceType.GENERAL]: 1.0,    // General's mobility is important but limited to palace
    [PieceType.ADVISOR]: 0.8,    // Advisors are limited to the palace
    [PieceType.ELEPHANT]: 0.8,   // Elephants are limited to own side
    [PieceType.HORSE]: 1.5,      // Horses are tactical pieces with good mobility
    [PieceType.CHARIOT]: 2.0,    // Chariots have the best mobility
    [PieceType.CANNON]: 1.8,     // Cannons have good mobility with unique capture mechanics
    [PieceType.SOLDIER]: 0.7,    // Soldiers' mobility increases after crossing the river
  };
  
  // Loop through all pieces on the board
  for (const piece of board.pieces) {
    // Skip pieces not involved in the evaluation
    if (piece.side !== side && piece.side !== opponentSide) continue;
    
    // Calculate how many squares this piece can access
    // Use the game's existing move validation function (simplified here)
    const validMoves = getValidMovesForPiece(board, piece);
    const moveCount = validMoves.length;
    
    // Apply the mobility weight for this piece type
    const weightedMobility = moveCount * mobilityWeights[piece.type];
    
    // Add to the score if it's our piece, subtract if it's opponent's
    if (piece.side === side) {
      mobilityScore += weightedMobility;
    } else {
      mobilityScore -= weightedMobility * 0.8; // Slightly lower weight for opponent mobility
    }
  }
  
  return mobilityScore;
}

/**
 * Helper function to get valid moves for a piece (simplified version)
 * In a full implementation, this would use the game's existing move validation
 */
function getValidMovesForPiece(board: Board, piece: Piece): [number, number][] {
  const [row, col] = piece.position;
  const validMoves: [number, number][] = [];
  
  // Basic move pattern based on piece type
  switch (piece.type) {
    case PieceType.GENERAL:
      // General moves one step orthogonally within the palace
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        // Check if within palace
        if (isInPalace(newRow, newCol, piece.side) && 
            !isOccupiedBySameSide(board, newRow, newCol, piece.side)) {
          validMoves.push([newRow, newCol]);
        }
      }
      break;
    
    case PieceType.ADVISOR:
      // Advisor moves one step diagonally within the palace
      for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (isInPalace(newRow, newCol, piece.side) && 
            !isOccupiedBySameSide(board, newRow, newCol, piece.side)) {
          validMoves.push([newRow, newCol]);
        }
      }
      break;
    
    case PieceType.ELEPHANT:
      // Elephant moves exactly two steps diagonally and cannot cross the river
      for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
        const newRow = row + dr;
        const newCol = col + dc;
        const blockRow = row + dr/2;
        const blockCol = col + dc/2;
        
        if (isOnOwnSide(newRow, piece.side) && 
            isWithinBounds(newRow, newCol) &&
            !isOccupied(board, blockRow, blockCol) && // No blocking piece
            !isOccupiedBySameSide(board, newRow, newCol, piece.side)) {
          validMoves.push([newRow, newCol]);
        }
      }
      break;
    
    case PieceType.HORSE:
      // Horse moves one step orthogonally then one step diagonally outward
      for (const [dr1, dc1] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const midRow = row + dr1;
        const midCol = col + dc1;
        
        // Check if horse's leg is blocked
        if (isOccupied(board, midRow, midCol)) continue;
        
        // Possible diagonal moves after the orthogonal step
        const diagonals: [number, number][] = [];
        if (dr1 === 0) { // Moved horizontally first
          diagonals.push([midRow + 1, midCol + dc1]);
          diagonals.push([midRow - 1, midCol + dc1]);
        } else { // Moved vertically first
          diagonals.push([midRow + dr1, midCol + 1]);
          diagonals.push([midRow + dr1, midCol - 1]);
        }
        
        for (const [newRow, newCol] of diagonals) {
          if (isWithinBounds(newRow, newCol) && 
              !isOccupiedBySameSide(board, newRow, newCol, piece.side)) {
            validMoves.push([newRow, newCol]);
          }
        }
      }
      break;
    
    case PieceType.CHARIOT:
      // Chariot moves any number of squares orthogonally
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        let distance = 1;
        
        while (true) {
          const newRow = row + dr * distance;
          const newCol = col + dc * distance;
          
          if (!isWithinBounds(newRow, newCol)) break;
          
          if (isOccupied(board, newRow, newCol)) {
            if (!isOccupiedBySameSide(board, newRow, newCol, piece.side)) {
              // Can capture opponent's piece
              validMoves.push([newRow, newCol]);
            }
            break;
          }
          
          validMoves.push([newRow, newCol]);
          distance++;
        }
      }
      break;
    
    case PieceType.CANNON:
      // Cannon moves like chariot but jumps over one piece to capture
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        let distance = 1;
        let foundScreen = false;
        
        while (true) {
          const newRow = row + dr * distance;
          const newCol = col + dc * distance;
          
          if (!isWithinBounds(newRow, newCol)) break;
          
          if (isOccupied(board, newRow, newCol)) {
            if (!foundScreen) {
              // Found a screen (jumping piece)
              foundScreen = true;
            } else {
              // After a screen, can only capture opponent's pieces
              if (!isOccupiedBySameSide(board, newRow, newCol, piece.side)) {
                validMoves.push([newRow, newCol]);
              }
              break;
            }
          } else if (!foundScreen) {
            // Normal move without capture
            validMoves.push([newRow, newCol]);
          }
          
          distance++;
        }
      }
      break;
    
    case PieceType.SOLDIER:
      // Soldier moves forward (or sideways/forward after crossing river)
      const forwardDir = piece.side === PlayerSide.RED ? -1 : 1;
      
      // Forward move
      const forwardRow = row + forwardDir;
      if (isWithinBounds(forwardRow, col) && 
          !isOccupiedBySameSide(board, forwardRow, col, piece.side)) {
        validMoves.push([forwardRow, col]);
      }
      
      // Check if soldier has crossed the river
      const crossedRiver = hasCrossedRiver(row, piece.side);
      
      if (crossedRiver) {
        // Can also move sideways
        for (const dc of [-1, 1]) {
          const newCol = col + dc;
          if (isWithinBounds(row, newCol) && 
              !isOccupiedBySameSide(board, row, newCol, piece.side)) {
            validMoves.push([row, newCol]);
          }
        }
      }
      break;
  }
  
  return validMoves;
}

/**
 * Helper function to check if a position is in the palace
 */
function isInPalace(row: number, col: number, side: PlayerSide): boolean {
  // Palace is a 3x3 grid
  if (col < 3 || col > 5) return false;
  
  if (side === PlayerSide.RED) {
    return row >= 7 && row <= 9; // Red palace
  } else {
    return row >= 0 && row <= 2; // Black palace
  }
}

/**
 * Helper function to check if a position is on own side of the river
 */
function isOnOwnSide(row: number, side: PlayerSide): boolean {
  if (side === PlayerSide.RED) {
    return row >= 5; // Red side
  } else {
    return row <= 4; // Black side
  }
}

/**
 * Helper function to check if a position is within board bounds
 */
function isWithinBounds(row: number, col: number): boolean {
  return row >= 0 && row <= 9 && col >= 0 && col <= 8;
}

/**
 * Helper function to check if a position is occupied by any piece
 */
function isOccupied(board: Board, row: number, col: number): boolean {
  return board.pieces.some(p => p.position[0] === row && p.position[1] === col);
}

/**
 * Helper function to check if a position is occupied by a piece of the same side
 */
function isOccupiedBySameSide(board: Board, row: number, col: number, side: PlayerSide): boolean {
  return board.pieces.some(p => p.position[0] === row && p.position[1] === col && p.side === side);
}

/**
 * Helper function to check if a soldier has crossed the river
 */
function hasCrossedRiver(row: number, side: PlayerSide): boolean {
  if (side === PlayerSide.RED) {
    return row <= 4; // Red pieces start at bottom, so crossing river means row <= 4
  } else {
    return row >= 5; // Black pieces start at top, so crossing river means row >= 5
  }
}

/**
 * Evaluates control of center squares
 */
function evaluateCenterControl(board: Board, side: PlayerSide): number {
  let score = 0;
  
  // Define key strategic points on the board with their weights
  const strategicPoints = [
    // Central points around the river (most important in Xiangqi)
    { row: 4, col: 4, weight: 6 },  // Absolute center
    { row: 5, col: 4, weight: 6 },  // Absolute center
    
    // Palace centers
    { row: 1, col: 4, weight: 4 },  // Black palace center
    { row: 8, col: 4, weight: 4 },  // Red palace center
    
    // Central column points
    { row: 3, col: 4, weight: 3 },
    { row: 6, col: 4, weight: 3 },
    
    // Key crossing points
    { row: 4, col: 3, weight: 2 },
    { row: 4, col: 5, weight: 2 },
    { row: 5, col: 3, weight: 2 },
    { row: 5, col: 5, weight: 2 },
    
    // River crossing points
    { row: 4, col: 2, weight: 1 },
    { row: 4, col: 6, weight: 1 },
    { row: 5, col: 2, weight: 1 },
    { row: 5, col: 6, weight: 1 },
  ];
  
  // Evaluate each strategic point
  for (const point of strategicPoints) {
    const { row, col, weight } = point;
    
    // Count attacking pieces for both sides
    let ownControl = 0;
    let opponentControl = 0;
    
    for (const piece of board.pieces) {
      // Simple check: can this piece move to the strategic point?
      // In a real implementation, we'd use the actual move validation
      const validMoves = getValidMovesForPiece(board, piece);
      const canAttack = validMoves.some(([r, c]) => r === row && c === col);
      
      if (canAttack) {
        if (piece.side === side) {
          ownControl++;
        } else {
          opponentControl++;
        }
      }
    }
    
    // Calculate control difference and apply weight
    const controlDifference = ownControl - opponentControl;
    score += controlDifference * weight;
    
    // Bonus for occupying key squares
    const occupier = board.pieces.find(p => p.position[0] === row && p.position[1] === col);
    if (occupier) {
      if (occupier.side === side) {
        score += weight * 2; // Bonus for occupying strategic points
      } else {
        score -= weight * 2; // Penalty if opponent occupies strategic points
      }
    }
  }
  
  return score;
}

/**
 * Evaluates king safety
 */

function evaluateKingSafety(board: Board, side: PlayerSide, currentTurn: PlayerSide): number {
    
  let score = 0;
  const opponentSide = side === PlayerSide.RED ? PlayerSide.BLACK : PlayerSide.RED;
  
  // Find the general (king)
  const general = board.pieces.find(p => p.type === PieceType.GENERAL && p.side === side);
  if (!general) return 0; // No general found (shouldn't happen in a valid game)
  
  const [kingRow, kingCol] = general.position;
  
  // Check if the king is in check (heavy penalty)
  const attackingPieces = board.pieces.filter(p => {
    if (p.side !== opponentSide) return false;
    
    const validMoves = getValidMovesForPiece(board, p);
    return validMoves.some(([r, c]) => r === kingRow && c === kingCol);
  });
  
  if (attackingPieces.length > 0) {
    score -= 350; // Heavy penalty for being in check
    
    // Extra penalty for multiple attackers (likely checkmate soon)
    if (attackingPieces.length > 1) {
      score -= 300 * (attackingPieces.length - 1);
    }
  }
  
  // Check for the "flying general" rule
  // (generals facing each other on an open file, which is illegal in Xiangqi)
  const opponentGeneral = board.pieces.find(p => p.type === PieceType.GENERAL && p.side === opponentSide);
  if (opponentGeneral) {
    const [oppKingRow, oppKingCol] = opponentGeneral.position;
    
    if (kingCol === oppKingCol) {
      // Check if there are pieces between the two generals
      let piecesBetween = false;
      const minRow = Math.min(kingRow, oppKingRow);
      const maxRow = Math.max(kingRow, oppKingRow);
      
      for (let r = minRow + 1; r < maxRow; r++) {
        if (isOccupied(board, r, kingCol)) {
          piecesBetween = true;
          break;
        }
      }
      
      if (!piecesBetween) {
        // Flying general situation
        // If it's our move, this is good for us (we can capture)
        // If it's opponent's move, this is bad for us (we will be captured)
        score += side === currentTurn ? 500 : -500;
      }
    }
  }
  
  // Palace mobility (king should have escape squares)
  const kingMoves = getValidMovesForPiece(board, general);
  score += kingMoves.length * 15;
  
  // Evaluate king's protection
  // 1. Check for advisors and elephants (traditional defensive pieces)
  const defenders = board.pieces.filter(p => 
    p.side === side && 
    (p.type === PieceType.ADVISOR || p.type === PieceType.ELEPHANT)
  );
  
  score += defenders.length * 20; // Bonus for having defensive pieces
  
  // 2. Check for nearby defenders (pieces that can move to protect the king)
  const nearbyDefenders = board.pieces.filter(p => {
    if (p.side !== side || p === general) return false;
    
    const [pRow, pCol] = p.position;
    const distance = Math.abs(pRow - kingRow) + Math.abs(pCol - kingCol);
    return distance <= 2; // Manhattan distance of 2 or less
  });
  
  score += nearbyDefenders.length * 10;
  
  // 3. Penalty for open lines to the king
  const openLines = countOpenLinesToKing(board, general);
  score -= openLines * 25;
  
  // 4. Palace structure (king should ideally be at the back of the palace)
  const idealKingPos = side === PlayerSide.RED ? 9 : 0;
  const backRankBonus = side === PlayerSide.RED ? 
    Math.min(2, 9 - kingRow) * 15 : 
    Math.min(2, kingRow) * 15;
  
  score += backRankBonus;
  
  return score;
}

/**
 * Helper function to count open lines to the king
 */
function countOpenLinesToKing(board: Board, king: Piece): number {
  const [kingRow, kingCol] = king.position;
  let openLines = 0;
  
  // Check orthogonal directions
  const directions = [
    [0, 1],  // Right
    [1, 0],  // Down
    [0, -1], // Left
    [-1, 0], // Up
  ];
  
  for (const [dr, dc] of directions) {
    let distance = 1;
    let foundPiece = false;
    
    // Look outward in each direction
    while (true) {
      const newRow = kingRow + dr * distance;
      const newCol = kingCol + dc * distance;
      
      // Stop at board boundary or palace boundary for general
      if (!isWithinBounds(newRow, newCol) || 
          !isInPalace(newRow, newCol, king.side)) {
        // Reached boundary without finding a piece
        if (!foundPiece) openLines++;
        break;
      }
      
      // Check if there's a piece at this position
      if (isOccupied(board, newRow, newCol)) {
        foundPiece = true;
        // If it's not our piece, it could be a threat
        const piece = board.pieces.find(p => 
          p.position[0] === newRow && p.position[1] === newCol
        );
        
        if (piece && piece.side !== king.side) {
          // Check if this opponent piece can actually attack in this direction
          const canAttack = canPieceAttackInDirection(piece, [dr, dc]);
          if (canAttack) {
            openLines++; // Count it as an open line if there's a direct threat
          }
        }
        break;
      }
      
      distance++;
    }
  }
  
  return openLines;
}

/**
 * Helper function to check if a piece can attack in a given direction
 */
function canPieceAttackInDirection(piece: Piece, [dr, dc]: [number, number]): boolean {
  switch (piece.type) {
    case PieceType.CHARIOT:
      // Chariot can attack in all orthogonal directions
      return true;
    case PieceType.CANNON:
      // Cannon can attack in all orthogonal directions with a screen
      return true;
    case PieceType.GENERAL:
      // General can only attack one square in orthogonal directions
      return true;
    case PieceType.SOLDIER:
      // Soldier attacking direction depends on side and if crossed river
      if (piece.side === PlayerSide.RED) {
        // Red soldier moves up (-dr) and possibly sideways if crossed river
        return dr === 1 || (hasCrossedRiver(piece.position[0], piece.side) && dr === 0);
      } else {
        // Black soldier moves down (+dr) and possibly sideways if crossed river
        return dr === -1 || (hasCrossedRiver(piece.position[0], piece.side) && dr === 0);
      }
    default:
      // Other pieces don't attack in straight lines
      return false;
  }
}