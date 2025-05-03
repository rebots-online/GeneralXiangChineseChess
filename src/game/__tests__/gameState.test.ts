import { GameState, GameStatus, initializeGameState, startGame, makeMove, selectPiece, deselectPiece, undoMove } from '../gameState';
import { PlayerSide, PieceType } from '../pieces';

describe('Game State Management', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = initializeGameState();
  });

  test('initializes game state correctly', () => {
    expect(gameState.board.pieces.length).toBe(32); // 16 pieces per player
    expect(gameState.currentTurn).toBe(PlayerSide.RED); // Red goes first
    expect(gameState.moveHistory.length).toBe(0);
    expect(gameState.gameStatus).toBe(GameStatus.NOT_STARTED);
    expect(gameState.check).toBe(false);
    expect(gameState.checkmate).toBe(false);
  });

  test('starts the game', () => {
    const newGameState = startGame(gameState);
    expect(newGameState.gameStatus).toBe(GameStatus.IN_PROGRESS);
  });

  test('selects a piece', () => {
    // Start the game
    gameState = startGame(gameState);
    
    // Find a red soldier (since red goes first)
    const redSoldier = gameState.board.pieces.find(
      p => p.type === PieceType.SOLDIER && p.side === PlayerSide.RED
    );
    
    if (!redSoldier) {
      fail('Red soldier not found');
      return;
    }
    
    // Select the piece
    const newGameState = selectPiece(gameState, redSoldier.position[0], redSoldier.position[1]);
    
    // Verify the piece is selected
    expect(newGameState.board.selectedPiece).not.toBeNull();
    expect(newGameState.board.selectedPiece?.type).toBe(PieceType.SOLDIER);
    expect(newGameState.board.selectedPiece?.side).toBe(PlayerSide.RED);
    
    // Verify valid moves are calculated
    expect(newGameState.board.validMoves.length).toBeGreaterThan(0);
  });

  test('deselects a piece', () => {
    // Start the game
    gameState = startGame(gameState);
    
    // Find a red soldier (since red goes first)
    const redSoldier = gameState.board.pieces.find(
      p => p.type === PieceType.SOLDIER && p.side === PlayerSide.RED
    );
    
    if (!redSoldier) {
      fail('Red soldier not found');
      return;
    }
    
    // Select the piece
    gameState = selectPiece(gameState, redSoldier.position[0], redSoldier.position[1]);
    
    // Deselect the piece
    const newGameState = deselectPiece(gameState);
    
    // Verify the piece is deselected
    expect(newGameState.board.selectedPiece).toBeNull();
    expect(newGameState.board.validMoves.length).toBe(0);
  });

  test('makes a valid move', () => {
    // Start the game
    gameState = startGame(gameState);
    
    // Find a red soldier (since red goes first)
    const redSoldier = gameState.board.pieces.find(
      p => p.type === PieceType.SOLDIER && p.side === PlayerSide.RED && p.position[0] === 6
    );
    
    if (!redSoldier) {
      fail('Red soldier not found');
      return;
    }
    
    // Make a move (move the soldier forward one space)
    const targetRow = redSoldier.position[0] - 1;
    const targetCol = redSoldier.position[1];
    const newGameState = makeMove(gameState, redSoldier, targetRow, targetCol);
    
    // Verify the move was made
    const movedSoldier = newGameState.board.pieces.find(
      p => p.type === PieceType.SOLDIER && p.side === PlayerSide.RED && p.position[1] === targetCol
    );
    
    expect(movedSoldier).not.toBeUndefined();
    expect(movedSoldier?.position[0]).toBe(targetRow);
    expect(movedSoldier?.position[1]).toBe(targetCol);
    
    // Verify turn has switched
    expect(newGameState.currentTurn).toBe(PlayerSide.BLACK);
    
    // Verify move history was updated
    expect(newGameState.moveHistory.length).toBe(1);
  });

  test('undoes a move', () => {
    // Start the game
    gameState = startGame(gameState);
    
    // Find a red soldier (since red goes first)
    const redSoldier = gameState.board.pieces.find(
      p => p.type === PieceType.SOLDIER && p.side === PlayerSide.RED && p.position[0] === 6
    );
    
    if (!redSoldier) {
      fail('Red soldier not found');
      return;
    }
    
    // Make a move (move the soldier forward one space)
    const targetRow = redSoldier.position[0] - 1;
    const targetCol = redSoldier.position[1];
    gameState = makeMove(gameState, redSoldier, targetRow, targetCol);
    
    // Undo the move
    const newGameState = undoMove(gameState);
    
    // Verify the move was undone
    const originalSoldier = newGameState.board.pieces.find(
      p => p.type === PieceType.SOLDIER && p.side === PlayerSide.RED && p.position[1] === targetCol
    );
    
    expect(originalSoldier).not.toBeUndefined();
    expect(originalSoldier?.position[0]).toBe(6); // Back to original position
    
    // Verify turn has switched back
    expect(newGameState.currentTurn).toBe(PlayerSide.RED);
    
    // Verify move history was updated
    expect(newGameState.moveHistory.length).toBe(0);
  });
});
