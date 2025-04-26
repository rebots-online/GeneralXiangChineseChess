// Define piece types
export enum PieceType {
  GENERAL = 'general',     // 將/帥 - General/Marshal
  ADVISOR = 'advisor',     // 士/仕 - Advisor
  ELEPHANT = 'elephant',   // 象/相 - Elephant/Minister
  HORSE = 'horse',         // 馬/傌 - Horse
  CHARIOT = 'chariot',     // 車/俥 - Chariot/Rook
  CANNON = 'cannon',       // 砲/炮 - Cannon
  SOLDIER = 'soldier',     // 兵/卒 - Soldier/Pawn
}

// Define player sides
export enum PlayerSide {
  RED = 'red',
  BLACK = 'blue', // Changed from 'black' to 'blue' to match UI
}

// Define a piece interface
export interface Piece {
  type: PieceType;
  side: PlayerSide;
  position: [number, number]; // [row, col]
  symbol: string;
}

// Define the board interface
export interface Board {
  pieces: Piece[];
  selectedPiece: Piece | null;
  validMoves: [number, number][];
  turn: PlayerSide;
}

// Function to check if a position is within the board boundaries
export function isWithinBoard(row: number, col: number): boolean {
  return row >= 0 && row <= 9 && col >= 0 && col <= 8;
}

// Function to check if a position is within the palace
export function isWithinPalace(row: number, col: number, side: PlayerSide): boolean {
  if (side === PlayerSide.RED) {
    return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  } else {
    return row >= 0 && row <= 2 && col >= 3 && col <= 5;
  }
}

// Function to check if a position is across the river for a given side
export function isAcrossRiver(row: number, side: PlayerSide): boolean {
  if (side === PlayerSide.RED) {
    return row < 5;
  } else {
    return row > 4;
  }
}

// Function to get a piece at a specific position
export function getPieceAtPosition(board: Board, row: number, col: number): Piece | null {
  return board.pieces.find(p => p.position[0] === row && p.position[1] === col) || null;
}

// Function to check if a move is valid
export function isValidMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  // Check if the target position is within the board
  if (!isWithinBoard(targetRow, targetCol)) {
    return false;
  }

  // Check if the target position has a piece of the same side
  const targetPiece = getPieceAtPosition(board, targetRow, targetCol);
  if (targetPiece && targetPiece.side === piece.side) {
    return false;
  }

  // Get the current position
  const [currentRow, currentCol] = piece.position;

  // Check movement rules based on piece type
  switch (piece.type) {
    case PieceType.GENERAL:
      return isValidGeneralMove(board, piece, targetRow, targetCol);
    case PieceType.ADVISOR:
      return isValidAdvisorMove(board, piece, targetRow, targetCol);
    case PieceType.ELEPHANT:
      return isValidElephantMove(board, piece, targetRow, targetCol);
    case PieceType.HORSE:
      return isValidHorseMove(board, piece, targetRow, targetCol);
    case PieceType.CHARIOT:
      return isValidChariotMove(board, piece, targetRow, targetCol);
    case PieceType.CANNON:
      return isValidCannonMove(board, piece, targetRow, targetCol);
    case PieceType.SOLDIER:
      return isValidSoldierMove(board, piece, targetRow, targetCol);
    default:
      return false;
  }
}

// General/Marshal movement rules
function isValidGeneralMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  // General can only move within the palace
  if (!isWithinPalace(targetRow, targetCol, piece.side)) {
    return false;
  }

  const [currentRow, currentCol] = piece.position;
  const rowDiff = Math.abs(targetRow - currentRow);
  const colDiff = Math.abs(targetCol - currentCol);

  // General can only move one step horizontally or vertically
  if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
    return true;
  }

  // Check for flying general rule (direct confrontation with enemy general)
  if (piece.type === PieceType.GENERAL && targetCol === currentCol) {
    const enemyGeneral = board.pieces.find(
      p => p.type === PieceType.GENERAL && p.side !== piece.side
    );

    if (enemyGeneral && enemyGeneral.position[1] === currentCol) {
      // Check if there are any pieces between the two generals
      const minRow = Math.min(currentRow, enemyGeneral.position[0]);
      const maxRow = Math.max(currentRow, enemyGeneral.position[0]);

      // Count pieces between the two generals
      const piecesBetween = board.pieces.filter(
        p => p.position[1] === currentCol &&
             p.position[0] > minRow &&
             p.position[0] < maxRow
      );

      // If there are no pieces between, and the target is the enemy general's position
      if (piecesBetween.length === 0 && targetRow === enemyGeneral.position[0]) {
        return true;
      }
    }
  }

  return false;
}

// Advisor movement rules
function isValidAdvisorMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  // Advisor can only move within the palace
  if (!isWithinPalace(targetRow, targetCol, piece.side)) {
    return false;
  }

  const [currentRow, currentCol] = piece.position;
  const rowDiff = Math.abs(targetRow - currentRow);
  const colDiff = Math.abs(targetCol - currentCol);

  // Advisor can only move one step diagonally
  return rowDiff === 1 && colDiff === 1;
}

// Elephant/Minister movement rules
function isValidElephantMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  const [currentRow, currentCol] = piece.position;
  const rowDiff = Math.abs(targetRow - currentRow);
  const colDiff = Math.abs(targetCol - currentCol);

  // Elephant moves exactly two points diagonally
  if (rowDiff !== 2 || colDiff !== 2) {
    return false;
  }

  // Elephant cannot cross the river
  if (piece.side === PlayerSide.RED && targetRow < 5) {
    return false;
  }
  if (piece.side === PlayerSide.BLACK && targetRow > 4) {
    return false;
  }

  // Check if there's a piece at the "elephant's eye" (the point between current and target)
  const eyeRow = (currentRow + targetRow) / 2;
  const eyeCol = (currentCol + targetCol) / 2;
  const pieceAtEye = getPieceAtPosition(board, eyeRow, eyeCol);

  return !pieceAtEye; // Return true if there's no piece blocking
}

// Horse movement rules
function isValidHorseMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  const [currentRow, currentCol] = piece.position;
  const rowDiff = Math.abs(targetRow - currentRow);
  const colDiff = Math.abs(targetCol - currentCol);

  // Horse moves in an L shape: 2 steps in one direction, then 1 step perpendicular
  if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) {
    return false;
  }

  // Check for "hobbling the horse's leg" - a piece blocking the horse's movement
  let blockingRow = currentRow;
  let blockingCol = currentCol;

  if (rowDiff === 2) {
    // Moving primarily vertically
    blockingRow = currentRow + (targetRow > currentRow ? 1 : -1);
  } else {
    // Moving primarily horizontally
    blockingCol = currentCol + (targetCol > currentCol ? 1 : -1);
  }

  const blockingPiece = getPieceAtPosition(board, blockingRow, blockingCol);
  return !blockingPiece; // Return true if there's no piece blocking
}

// Chariot/Rook movement rules
function isValidChariotMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  const [currentRow, currentCol] = piece.position;
  const rowDiff = Math.abs(targetRow - currentRow);
  const colDiff = Math.abs(targetCol - currentCol);

  // Chariot can only move horizontally or vertically
  if (rowDiff > 0 && colDiff > 0) {
    return false;
  }

  // Check if there are any pieces in the path
  if (rowDiff > 0) {
    // Moving vertically
    const minRow = Math.min(currentRow, targetRow);
    const maxRow = Math.max(currentRow, targetRow);

    for (let row = minRow + 1; row < maxRow; row++) {
      if (getPieceAtPosition(board, row, currentCol)) {
        return false;
      }
    }
  } else {
    // Moving horizontally
    const minCol = Math.min(currentCol, targetCol);
    const maxCol = Math.max(currentCol, targetCol);

    for (let col = minCol + 1; col < maxCol; col++) {
      if (getPieceAtPosition(board, currentRow, col)) {
        return false;
      }
    }
  }

  return true;
}

// Cannon movement rules
function isValidCannonMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  const [currentRow, currentCol] = piece.position;
  const rowDiff = Math.abs(targetRow - currentRow);
  const colDiff = Math.abs(targetCol - currentCol);
  const targetPiece = getPieceAtPosition(board, targetRow, targetCol);

  // Cannon can only move horizontally or vertically
  if (rowDiff > 0 && colDiff > 0) {
    return false;
  }

  // Count pieces in the path
  let piecesInPath = 0;
  if (rowDiff > 0) {
    // Moving vertically
    const minRow = Math.min(currentRow, targetRow);
    const maxRow = Math.max(currentRow, targetRow);

    for (let row = minRow + 1; row < maxRow; row++) {
      if (getPieceAtPosition(board, row, currentCol)) {
        piecesInPath++;
      }
    }
  } else {
    // Moving horizontally
    const minCol = Math.min(currentCol, targetCol);
    const maxCol = Math.max(currentCol, targetCol);

    for (let col = minCol + 1; col < maxCol; col++) {
      if (getPieceAtPosition(board, currentRow, col)) {
        piecesInPath++;
      }
    }
  }

  // Cannon needs exactly one piece to capture
  if (targetPiece) {
    return piecesInPath === 1;
  }

  // Cannon needs no pieces in the way to move without capturing
  return piecesInPath === 0;
}

// Soldier/Pawn movement rules
function isValidSoldierMove(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  const [currentRow, currentCol] = piece.position;
  const rowDiff = targetRow - currentRow;
  const colDiff = Math.abs(targetCol - currentCol);

  // Soldiers can only move forward before crossing the river
  if (piece.side === PlayerSide.RED) {
    // Red soldiers move up (decreasing row)
    if (!isAcrossRiver(currentRow, PlayerSide.RED)) {
      // Before crossing the river, can only move forward
      return rowDiff === -1 && colDiff === 0;
    } else {
      // After crossing, can move forward or sideways
      return (rowDiff === -1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
  } else {
    // Black soldiers move down (increasing row)
    if (!isAcrossRiver(currentRow, PlayerSide.BLACK)) {
      // Before crossing the river, can only move forward
      return rowDiff === 1 && colDiff === 0;
    } else {
      // After crossing, can move forward or sideways
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
  }
}

// Function to get all valid moves for a piece
export function getValidMoves(board: Board, piece: Piece): [number, number][] {
  const validMoves: [number, number][] = [];

  // Check all possible positions on the board
  for (let row = 0; row <= 9; row++) {
    for (let col = 0; col <= 8; col++) {
      if (isValidMove(board, piece, row, col)) {
        validMoves.push([row, col]);
      }
    }
  }

  return validMoves;
}

// Function to check if a king is in check
export function isInCheck(board: Board, side: PlayerSide): boolean {
  // Find the general of the given side
  const general = board.pieces.find(p => p.type === PieceType.GENERAL && p.side === side);
  if (!general) return false;

  // Check if any enemy piece can capture the general
  return board.pieces.some(piece => {
    if (piece.side === side) return false; // Skip friendly pieces
    return isValidMove(board, piece, general.position[0], general.position[1]);
  });
}

// Function to check if a move would result in check
export function wouldBeInCheck(board: Board, piece: Piece, targetRow: number, targetCol: number): boolean {
  // Create a copy of the board to simulate the move
  const simulatedBoard: Board = {
    ...board,
    pieces: [...board.pieces]
  };

  // Find the index of the piece to move
  const pieceIndex = simulatedBoard.pieces.findIndex(
    p => p.position[0] === piece.position[0] && p.position[1] === piece.position[1]
  );

  // Find if there's a piece at the target position (to capture)
  const targetPieceIndex = simulatedBoard.pieces.findIndex(
    p => p.position[0] === targetRow && p.position[1] === targetCol
  );

  // Remove the captured piece if any
  if (targetPieceIndex !== -1) {
    simulatedBoard.pieces.splice(targetPieceIndex, 1);
  }

  // Update the piece position
  const updatedPiece = { ...simulatedBoard.pieces[pieceIndex] };
  updatedPiece.position = [targetRow, targetCol];
  simulatedBoard.pieces[pieceIndex] = updatedPiece;

  // Check if the king is in check after the move
  return isInCheck(simulatedBoard, piece.side);
}

// Function to check if a side is in checkmate
export function isCheckmate(board: Board, side: PlayerSide): boolean {
  // If not in check, can't be checkmate
  if (!isInCheck(board, side)) {
    return false;
  }

  // Check if any piece can make a move that gets out of check
  return !board.pieces.some(piece => {
    if (piece.side !== side) return false; // Skip enemy pieces

    // Get all valid moves for this piece
    const moves = getValidMoves(board, piece);

    // Check if any move would get out of check
    return moves.some(([row, col]) => !wouldBeInCheck(board, piece, row, col));
  });
}

// Function to initialize a new game board
export function initializeBoard(): Board {
  const pieces: Piece[] = [
    // Red pieces (bottom side)
    { type: PieceType.CHARIOT, side: PlayerSide.RED, position: [9, 0], symbol: '俥' },
    { type: PieceType.HORSE, side: PlayerSide.RED, position: [9, 1], symbol: '傌' },
    { type: PieceType.ELEPHANT, side: PlayerSide.RED, position: [9, 2], symbol: '相' },
    { type: PieceType.ADVISOR, side: PlayerSide.RED, position: [9, 3], symbol: '仕' },
    { type: PieceType.GENERAL, side: PlayerSide.RED, position: [9, 4], symbol: '帥' },
    { type: PieceType.ADVISOR, side: PlayerSide.RED, position: [9, 5], symbol: '仕' },
    { type: PieceType.ELEPHANT, side: PlayerSide.RED, position: [9, 6], symbol: '相' },
    { type: PieceType.HORSE, side: PlayerSide.RED, position: [9, 7], symbol: '傌' },
    { type: PieceType.CHARIOT, side: PlayerSide.RED, position: [9, 8], symbol: '俥' },
    { type: PieceType.CANNON, side: PlayerSide.RED, position: [7, 1], symbol: '砲' },
    { type: PieceType.CANNON, side: PlayerSide.RED, position: [7, 7], symbol: '砲' },
    { type: PieceType.SOLDIER, side: PlayerSide.RED, position: [6, 0], symbol: '兵' },
    { type: PieceType.SOLDIER, side: PlayerSide.RED, position: [6, 2], symbol: '兵' },
    { type: PieceType.SOLDIER, side: PlayerSide.RED, position: [6, 4], symbol: '兵' },
    { type: PieceType.SOLDIER, side: PlayerSide.RED, position: [6, 6], symbol: '兵' },
    { type: PieceType.SOLDIER, side: PlayerSide.RED, position: [6, 8], symbol: '兵' },

    // Black pieces (top side)
    { type: PieceType.CHARIOT, side: PlayerSide.BLACK, position: [0, 0], symbol: '車' },
    { type: PieceType.HORSE, side: PlayerSide.BLACK, position: [0, 1], symbol: '馬' },
    { type: PieceType.ELEPHANT, side: PlayerSide.BLACK, position: [0, 2], symbol: '象' },
    { type: PieceType.ADVISOR, side: PlayerSide.BLACK, position: [0, 3], symbol: '士' },
    { type: PieceType.GENERAL, side: PlayerSide.BLACK, position: [0, 4], symbol: '將' },
    { type: PieceType.ADVISOR, side: PlayerSide.BLACK, position: [0, 5], symbol: '士' },
    { type: PieceType.ELEPHANT, side: PlayerSide.BLACK, position: [0, 6], symbol: '象' },
    { type: PieceType.HORSE, side: PlayerSide.BLACK, position: [0, 7], symbol: '馬' },
    { type: PieceType.CHARIOT, side: PlayerSide.BLACK, position: [0, 8], symbol: '車' },
    { type: PieceType.CANNON, side: PlayerSide.BLACK, position: [2, 1], symbol: '炮' },
    { type: PieceType.CANNON, side: PlayerSide.BLACK, position: [2, 7], symbol: '炮' },
    { type: PieceType.SOLDIER, side: PlayerSide.BLACK, position: [3, 0], symbol: '卒' },
    { type: PieceType.SOLDIER, side: PlayerSide.BLACK, position: [3, 2], symbol: '卒' },
    { type: PieceType.SOLDIER, side: PlayerSide.BLACK, position: [3, 4], symbol: '卒' },
    { type: PieceType.SOLDIER, side: PlayerSide.BLACK, position: [3, 6], symbol: '卒' },
    { type: PieceType.SOLDIER, side: PlayerSide.BLACK, position: [3, 8], symbol: '卒' },
  ];

  return {
    pieces,
    selectedPiece: null,
    validMoves: [],
    turn: PlayerSide.RED, // Red goes first
  };
}
