
import {
  Board,
  Piece,
  PlayerSide,
  PieceType,
  isValidMove,
  isInCheck,
  isCheckmate,
  wouldBeInCheck,
  getValidMoves,
  initializeBoard
} from './pieces';

// Re-export the Piece type for components that import from gameState
export type { Piece };
// Re-export the PlayerSide type for components that import from gameState
export type { PlayerSide };

// Define draw conditions
export enum DrawReason {
  PERPETUAL_CHECK = 'perpetual_check',
  STALEMATE = 'stalemate',
  MUTUAL_AGREEMENT = 'mutual_agreement',
  POSITION_REPETITION = 'position_repetition',
  INSUFFICIENT_MATERIAL = 'insufficient_material',
}

// Define game state interface
export interface GameState {
  board: Board;
  currentTurn: PlayerSide;
  moveHistory: Move[];
  gameStatus: GameStatus;
  check: boolean;
  checkmate: boolean;
  drawOffered: boolean;
  positionHistory: string[];
  lastCaptureMoveIndex: number;
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

// Draw conditions helper functions
export function isDraw(gameState: GameState): { isDraw: boolean; reason?: DrawReason } {
  // Check stalemate
  if (isStalemate(gameState)) {
    return { isDraw: true, reason: DrawReason.STALEMATE };
  }

  // Check position repetition (same position occurring 3 times)
  if (isPositionRepetition(gameState)) {
    return { isDraw: true, reason: DrawReason.POSITION_REPETITION };
  }

  // Check insufficient material
  if (hasInsufficientMaterial(gameState)) {
    return { isDraw: true, reason: DrawReason.INSUFFICIENT_MATERIAL };
  }

  // Check perpetual check
  if (isPerpetualCheck(gameState)) {
    return { isDraw: true, reason: DrawReason.PERPETUAL_CHECK };
  }

  return { isDraw: false };
}

// Check for stalemate - no legal moves but not in check
function isStalemate(gameState: GameState): boolean {
  if (gameState.check) return false;

  const currentSidePieces = gameState.board.pieces.filter(p => p.side === gameState.currentTurn);
  return currentSidePieces.every(piece => getValidMoves(gameState.board, piece).length === 0);
}

// Check for position repetition
function isPositionRepetition(gameState: GameState): boolean {
  const currentPosition = serializePosition(gameState.board);
  const occurrences = gameState.positionHistory.filter(pos => pos === currentPosition).length;
  return occurrences >= 3;
}

// Check for insufficient material
function hasInsufficientMaterial(gameState: GameState): boolean {
  const pieces = gameState.board.pieces;
  
  // Count pieces for each side
  const redPieces = pieces.filter(p => p.side === PlayerSide.RED);
  const blackPieces = pieces.filter(p => p.side === PlayerSide.BLACK);

  // If either side has only their general left
  if (redPieces.length === 1 && redPieces[0].type === PieceType.GENERAL ||
      blackPieces.length === 1 && blackPieces[0].type === PieceType.GENERAL) {
    return true;
  }

  // Add more specific insufficient material conditions here
  // For example: two generals and one horse might be insufficient

  return false;
}

// Check for perpetual check
function isPerpetualCheck(gameState: GameState): boolean {
  // Need at least 6 moves to have 3 repeated checks
  if (gameState.moveHistory.length < 6) return false;

  // Get the last 6 moves
  const lastMoves = gameState.moveHistory.slice(-6);
  const checkingMoves = lastMoves.filter((_, index) =>
    index % 2 === 0 && isInCheck(recreateBoardState(gameState, index), gameState.currentTurn)
  );

  // If the last 3 moves by the same player were all checks
  return checkingMoves.length === 3;
}

// Helper function to serialize board position for repetition detection
function serializePosition(board: Board): string {
  return board.pieces
    .sort((a, b) => a.position[0] - b.position[0] || a.position[1] - b.position[1])
    .map(p => `${p.type}${p.side}${p.position.join(',')}`)
    .join('|');
}

// Helper function to recreate board state at a specific move index
function recreateBoardState(gameState: GameState, moveIndex: number): Board {
  const board = initializeBoard();
  for (let i = 0; i <= moveIndex; i++) {
    const move = gameState.moveHistory[i];
    applyMove(board, move);
  }
  return board;
}

// Helper function to apply a move to a board

export function applyMove(board: Board, move: Move): void {
    
  const pieceIndex = board.pieces.findIndex(
    p => p.position[0] === move.from[0] && p.position[1] === move.from[1]
  );

  if (pieceIndex === -1) return;

  // Remove captured piece if any
  if (move.capturedPiece) {
    const capturedIndex = board.pieces.findIndex(
      p => p.position[0] === move.to[0] && p.position[1] === move.to[1]
    );
    if (capturedIndex !== -1) {
      board.pieces.splice(capturedIndex, 1);
    }
  }

  // Update piece position
  board.pieces[pieceIndex] = {
    ...board.pieces[pieceIndex],
    position: [...move.to]
  };
}

// Function to initialize position history
function initializePositionHistory(board: Board): string[] {
  return [serializePosition(board)];
}

// Initialize a new game state
export function initializeGameState(): GameState {
  const board = initializeBoard();
  return {
    board,
    currentTurn: PlayerSide.RED, // Red goes first
    moveHistory: [],
    gameStatus: GameStatus.NOT_STARTED,
    check: false,
    checkmate: false,
    drawOffered: false,
    positionHistory: initializePositionHistory(board),
    lastCaptureMoveIndex: -1,
  };
}

// Function to offer a draw
export function offerDraw(gameState: GameState): GameState {
  if (gameState.gameStatus !== GameStatus.IN_PROGRESS) {
    return gameState;
  }
  return {
    ...gameState,
    drawOffered: true,
  };
}

// Function to accept a draw offer
export function acceptDraw(gameState: GameState): GameState {
  if (!gameState.drawOffered || gameState.gameStatus !== GameStatus.IN_PROGRESS) {
    return gameState;
  }
  return {
    ...gameState,
    drawOffered: false,
    gameStatus: GameStatus.DRAW,
  };
}

// Function to decline a draw offer
export function declineDraw(gameState: GameState): GameState {
  if (!gameState.drawOffered) {
    return gameState;
  }
  return {
    ...gameState,
    drawOffered: false,
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
  
  // Update game status if checkmate or draw
  let gameStatus: GameStatus = newGameState.gameStatus;
  const drawState = isDraw(newGameState);

  if (isOpponentInCheckmate) {
    gameStatus = newGameState.currentTurn === PlayerSide.RED ? GameStatus.RED_WON : GameStatus.BLACK_WON;
  } else if (drawState.isDraw) {
    gameStatus = GameStatus.DRAW;
  }
  
  // Update the game state
  return {
    ...newGameState,
    board,
    currentTurn: nextTurn,
    moveHistory: [...newGameState.moveHistory, move],
    positionHistory: [...newGameState.positionHistory, serializePosition(board)],
    lastCaptureMoveIndex: capturedPiece ? newGameState.moveHistory.length : newGameState.lastCaptureMoveIndex,
    gameStatus: isDraw(newGameState).isDraw ? GameStatus.DRAW : gameStatus,
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

