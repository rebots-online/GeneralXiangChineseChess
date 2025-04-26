import { Board, Piece, PlayerSide, isValidMove, isInCheck, isCheckmate, wouldBeInCheck, getValidMoves, initializeBoard } from './pieces';

// Define game state interface
export interface GameState {
  board: Board;
  currentTurn: PlayerSide;
  moveHistory: Move[];
  gameStatus: GameStatus;
  check: boolean;
  checkmate: boolean;
}

// Define move interface
export interface Move {
  piece: Piece;
  from: [number, number];
  to: [number, number];
  capturedPiece: Piece | null;
  notation: string; // Chinese chess notation
}

// Define game status
export enum GameStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  RED_WON = 'red_won',
  BLACK_WON = 'black_won',
  DRAW = 'draw',
}

// Initialize a new game state
export function initializeGameState(): GameState {
  return {
    board: initializeBoard(),
    currentTurn: PlayerSide.RED, // Red goes first
    moveHistory: [],
    gameStatus: GameStatus.NOT_STARTED,
    check: false,
    checkmate: false,
  };
}

// Start the game
export function startGame(gameState: GameState): GameState {
  return {
    ...gameState,
    gameStatus: GameStatus.IN_PROGRESS,
  };
}

// Make a move
export function makeMove(gameState: GameState, piece: Piece, targetRow: number, targetCol: number): GameState {
  // Clone the current game state to avoid mutations
  const newGameState = { ...gameState };
  const board = { ...newGameState.board, pieces: [...newGameState.board.pieces] };
  
  // Check if the game is in progress
  if (newGameState.gameStatus !== GameStatus.IN_PROGRESS) {
    return newGameState;
  }
  
  // Check if it's the correct player's turn
  if (piece.side !== newGameState.currentTurn) {
    return newGameState;
  }
  
  // Check if the move is valid
  if (!isValidMove(board, piece, targetRow, targetCol)) {
    return newGameState;
  }
  
  // Check if the move would put the player in check
  if (wouldBeInCheck(board, piece, targetRow, targetCol)) {
    return newGameState;
  }
  
  // Find the piece in the board
  const pieceIndex = board.pieces.findIndex(
    p => p.position[0] === piece.position[0] && p.position[1] === piece.position[1]
  );
  
  // Check if there's a piece at the target position (to capture)
  const capturedPieceIndex = board.pieces.findIndex(
    p => p.position[0] === targetRow && p.position[1] === targetCol
  );
  
  // Store the captured piece for move history
  const capturedPiece = capturedPieceIndex !== -1 ? { ...board.pieces[capturedPieceIndex] } : null;
  
  // Remove the captured piece if any
  if (capturedPieceIndex !== -1) {
    board.pieces.splice(capturedPieceIndex, 1);
  }
  
  // Create a move record
  const move: Move = {
    piece: { ...piece },
    from: [...piece.position],
    to: [targetRow, targetCol],
    capturedPiece,
    notation: generateMoveNotation(piece, [targetRow, targetCol], capturedPiece),
  };
  
  // Update the piece position
  const updatedPiece = { ...board.pieces[pieceIndex] };
  updatedPiece.position = [targetRow, targetCol];
  board.pieces[pieceIndex] = updatedPiece;
  
  // Switch turns
  const nextTurn = newGameState.currentTurn === PlayerSide.RED ? PlayerSide.BLACK : PlayerSide.RED;
  
  // Check if the opponent is in check or checkmate
  const isOpponentInCheck = isInCheck(board, nextTurn);
  const isOpponentInCheckmate = isOpponentInCheck && isCheckmate(board, nextTurn);
  
  // Update game status if checkmate
  let gameStatus = newGameState.gameStatus;
  if (isOpponentInCheckmate) {
    gameStatus = newGameState.currentTurn === PlayerSide.RED ? GameStatus.RED_WON : GameStatus.BLACK_WON;
  }
  
  // Update the game state
  return {
    ...newGameState,
    board,
    currentTurn: nextTurn,
    moveHistory: [...newGameState.moveHistory, move],
    gameStatus,
    check: isOpponentInCheck,
    checkmate: isOpponentInCheckmate,
  };
}

// Generate Chinese chess notation for a move
function generateMoveNotation(piece: Piece, to: [number, number], capturedPiece: Piece | null): string {
  // This is a simplified version - a full implementation would follow traditional Chinese chess notation
  const [toRow, toCol] = to;
  
  // For now, just return a basic description
  return `${piece.symbol} to ${toRow},${toCol}${capturedPiece ? ' captures ' + capturedPiece.symbol : ''}`;
}

// Select a piece
export function selectPiece(gameState: GameState, row: number, col: number): GameState {
  const board = { ...gameState.board };
  const piece = board.pieces.find(p => p.position[0] === row && p.position[1] === col);
  
  // If no piece at the position or not the current player's piece, deselect
  if (!piece || piece.side !== gameState.currentTurn) {
    return {
      ...gameState,
      board: {
        ...board,
        selectedPiece: null,
        validMoves: [],
      },
    };
  }
  
  // Get valid moves for the selected piece
  const validMoves = getValidMoves(board, piece).filter(
    ([targetRow, targetCol]) => !wouldBeInCheck(board, piece, targetRow, targetCol)
  );
  
  return {
    ...gameState,
    board: {
      ...board,
      selectedPiece: piece,
      validMoves,
    },
  };
}

// Deselect the currently selected piece
export function deselectPiece(gameState: GameState): GameState {
  return {
    ...gameState,
    board: {
      ...gameState.board,
      selectedPiece: null,
      validMoves: [],
    },
  };
}

// Undo the last move
export function undoMove(gameState: GameState): GameState {
  if (gameState.moveHistory.length === 0) {
    return gameState;
  }
  
  // Clone the current game state
  const newGameState = { ...gameState };
  const board = { ...newGameState.board, pieces: [...newGameState.board.pieces] };
  
  // Get the last move
  const lastMove = newGameState.moveHistory[newGameState.moveHistory.length - 1];
  
  // Find the piece that was moved
  const pieceIndex = board.pieces.findIndex(
    p => p.position[0] === lastMove.to[0] && p.position[1] === lastMove.to[1] &&
         p.type === lastMove.piece.type && p.side === lastMove.piece.side
  );
  
  if (pieceIndex === -1) {
    return gameState; // Can't find the piece, something went wrong
  }
  
  // Move the piece back to its original position
  const updatedPiece = { ...board.pieces[pieceIndex] };
  updatedPiece.position = [...lastMove.from];
  board.pieces[pieceIndex] = updatedPiece;
  
  // If a piece was captured, add it back
  if (lastMove.capturedPiece) {
    board.pieces.push({ ...lastMove.capturedPiece });
  }
  
  // Switch back to the previous player's turn
  const previousTurn = newGameState.currentTurn === PlayerSide.RED ? PlayerSide.BLACK : PlayerSide.RED;
  
  // Remove the last move from history
  const newMoveHistory = [...newGameState.moveHistory];
  newMoveHistory.pop();
  
  // Check if the previous player is in check
  const isInCheckNow = isInCheck(board, previousTurn);
  
  // Update game status
  let gameStatus = GameStatus.IN_PROGRESS;
  if (newMoveHistory.length === 0) {
    gameStatus = GameStatus.NOT_STARTED;
  }
  
  return {
    ...newGameState,
    board,
    currentTurn: previousTurn,
    moveHistory: newMoveHistory,
    gameStatus,
    check: isInCheckNow,
    checkmate: false, // If we're undoing, there's no checkmate
  };
}
