
'use client';

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Undo, Sun, Moon, RotateCcw, Save, Volume2 } from 'lucide-react';
import { GameState, GameStatus, initializeGameState, startGame, makeMove, selectPiece, deselectPiece, undoMove } from '@/game/gameState';
import { Board, Piece, PlayerSide } from '@/game/pieces';
import { Feedback, loadSoundSettings, setSoundEnabled, setHapticsEnabled, setMasterVolume } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';

// Memoized sub-components
const MemoizedPiece = memo(({
  piece,
  isDarkMode,
  isSelected,
  isCurrentTurn,
  onClick
}: {
  piece: Piece,
  isDarkMode: boolean,
  isSelected: boolean,
  isCurrentTurn: boolean,
  onClick: () => void
}) => {
  const isRedPiece = piece.side === PlayerSide.RED;
  const pieceColor = isRedPiece ? 'hsl(5, 100%, 27.3%)' : 'hsl(215, 100%, 35%)'; // Deep Red and Strong Blue
  const pieceColorDark = isRedPiece ? 'hsl(5, 100%, 70%)' : 'hsl(215, 100%, 75%)'; // Lighter for dark mode

  const chipStyle: React.CSSProperties = {
    width: '38px', // Piece size
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isCurrentTurn ? 'pointer' : 'default',
    transition: 'all 0.2s ease-out',
    backgroundColor: isDarkMode ? 'hsl(0, 0%, 20%)' : 'hsl(36, 50%, 90%)', // Dark/Light wood background
    border: `2px solid ${isDarkMode ? 'hsl(0, 0%, 40%)' : 'hsl(36, 30%, 60%)'}`, // Outer ring
    boxShadow: isSelected
      ? `0 0 10px 3px ${isDarkMode ? 'hsl(200, 100%, 70%)' : 'hsl(200, 100%, 50%)'}` // Glow when selected
      : (isDarkMode ? 'inset 0 2px 4px rgba(0,0,0,0.5), 0 3px 5px rgba(0,0,0,0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.2), 0 3px 5px rgba(0,0,0,0.2)'),
  };

  return (
    <div
      style={chipStyle}
      onClick={onClick}
      role="button"
      aria-label={`${piece.side} ${piece.type}`}
    >
      <span
        style={{
          color: isDarkMode ? (isRedPiece ? pieceColorDark : pieceColorDark) : pieceColor,
          fontSize: '24px',
          fontWeight: 'bold',
          userSelect: 'none',
        }}
      >
        {piece.symbol}
      </span>
    </div>
  );
});
MemoizedPiece.displayName = 'MemoizedPiece';

// Memoized valid move indicator
const ValidMoveIndicator = memo(({ isDarkMode }: { isDarkMode: boolean }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: isDarkMode ? 'rgba(0, 255, 0, 0.4)' : 'rgba(0, 128, 0, 0.4)',
    border: `2px solid ${isDarkMode ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 128, 0, 0.8)'}`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 5,
  }} />
));
ValidMoveIndicator.displayName = 'ValidMoveIndicator';

// Memoized capture indicator
const CaptureIndicator = memo(({ isDarkMode }: { isDarkMode: boolean }) => (
  <div style={{
    position: 'absolute',
    top: '19px',
    left: '19px',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: `3px dashed ${isDarkMode ? 'rgba(255, 0, 0, 0.8)' : 'rgba(180, 0, 0, 0.8)'}`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 11,
  }} />
));
CaptureIndicator.displayName = 'CaptureIndicator';

// Memoized move history item
const MoveHistoryItem = memo(({ index, notation }: { index: number, notation: string }) => (
  <div className="text-xs sm:text-sm py-1 border-b last:border-b-0">
    {index + 1}. {notation}
  </div>
));
MoveHistoryItem.displayName = 'MoveHistoryItem';

// Helper hooks for drag and drop
const useDragState = () => {
  const [dragging, setDragging] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [validDropLocations, setValidDropLocations] = useState<[number, number][]>([]);

  // Use ref to avoid recreating event listeners
  const dragStateRef = useRef({ dragging, draggedPiece, validDropLocations });

  // Update ref when state changes
  useEffect(() => {
    dragStateRef.current = { dragging, draggedPiece, validDropLocations };
  }, [dragging, draggedPiece, validDropLocations]);

  return {
    dragging, setDragging,
    draggedPiece, setDraggedPiece,
    validDropLocations, setValidDropLocations,
    dragStateRef
  };
};

// Main component
const OptimizedInteractiveBoard = forwardRef((props, ref) => {
  // Helper function to get board coordinates from mouse position
  const getBoardCoordinates = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const boardElement = document.querySelector('.board-container');
    if (!boardElement) return null;
    
    const boardRect = boardElement.getBoundingClientRect();
    
    // Calculate position relative to the board
    const relativeX = clientX - boardRect.left - 50; // Adjust for padding
    const relativeY = clientY - boardRect.top - 50; // Adjust for padding
    
    // Convert to board coordinates using floor with half-cell offset
    // This ensures more accurate snapping to grid intersections
    const col = Math.floor((relativeX + cellSize/2) / cellSize);
    const row = Math.floor((relativeY + cellSize/2) / cellSize);
    
    // Check if within board boundaries
    if (row >= 0 && row < 10 && col >= 0 && col < 9) {
      return [row, col];
    }
    
    return null;
  }, []);

  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showSaveGameDialog, setShowSaveGameDialog] = useState<boolean>(false);
  const [showSoundSettingsDialog, setShowSoundSettingsDialog] = useState<boolean>(false);
  const [soundVolume, setSoundVolume] = useState<number>(0.7);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const { toast } = useToast();

  const cellSize = 50; // Size of each cell (distance between intersections)
  const board = gameState.board;

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    // Check for dark mode preference
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldUseDarkMode = storedTheme === 'dark' || (!storedTheme && prefersDark);
    setIsDarkMode(shouldUseDarkMode);

    // Apply theme to document
    document.documentElement.classList.toggle('dark', shouldUseDarkMode);

    // Load sound settings
    loadSoundSettings();
    setSoundVolume(parseFloat(localStorage.getItem('masterVolume') || '0.7'));
    setSoundEnabled(localStorage.getItem('soundEnabled') !== 'false');
    setHapticsEnabled(localStorage.getItem('hapticsEnabled') !== 'false');

    // Start a new game
    const newGameState = startGame(gameState);
    setGameState(newGameState);
  }, []);

  // Memoize the palatial anchors to avoid recreating them on every render
  const palatialAnchors = useMemo(() => {
    const setupPalatialAnchors = (isDark: boolean) => {
      const lineColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';

      return (
        <>
          {/* Top palace (black side) - Correct 3x3 size */}
          <svg className="absolute" style={{ top: 0, left: '150px', width: '100px', height: '100px', zIndex: 2, pointerEvents: 'none' }}>
            <line x1="0" y1="0" x2="100" y2="100" stroke={lineColor} strokeWidth="1" />
            <line x1="100" y1="0" x2="0" y2="100" stroke={lineColor} strokeWidth="1" />
          </svg>

          {/* Bottom palace (red side) - Correct 3x3 size */}
          <svg className="absolute" style={{ bottom: 0, left: '150px', width: '100px', height: '100px', zIndex: 2, pointerEvents: 'none' }}>
            <line x1="0" y1="0" x2="100" y2="100" stroke={lineColor} strokeWidth="1" />
            <line x1="100" y1="0" x2="0" y2="100" stroke={lineColor} strokeWidth="1" />
          </svg>
        </>
      );
    };

    return setupPalatialAnchors(isDarkMode);
  }, [isDarkMode]);

  // Memoize the board grid elements to avoid recreating them on every render
  const boardGridElements = useMemo(() => {
    const elements: JSX.Element[] = [];
    const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const riverColor = isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)'; // Jade Green

    // 1. First, render the grid lines (8 horizontal, 9 vertical)
    // Horizontal lines (9 lines for 10 rows)
    for (let row = 0; row < 9; row++) {
      elements.push(
        <div
          key={`h-line-${row}`}
          className="absolute"
          style={{
            top: `${row * cellSize}px`,
            left: 0,
            width: '400px', // 8 columns * 50px
            height: row === 4 ? '2px' : '1px', // Thicker line for river
            backgroundColor: row === 4 ? riverColor : lineColor,
            borderStyle: row === 4 ? 'dashed' : 'solid',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      );
    }

    // Vertical lines (8 lines for 9 columns)
    for (let col = 0; col < 8; col++) {
      // Top half (above river)
      elements.push(
        <div
          key={`v-line-top-${col}`}
          className="absolute"
          style={{
            top: 0,
            left: `${col * cellSize}px`,
            width: '1px',
            height: '200px', // 4 rows * 50px
            backgroundColor: lineColor,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      );

      // Bottom half (below river)
      elements.push(
        <div
          key={`v-line-bottom-${col}`}
          className="absolute"
          style={{
            top: '250px', // 5 rows * 50px
            left: `${col * cellSize}px`,
            width: '1px',
            height: '200px', // 4 rows * 50px
            backgroundColor: lineColor,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      );
    }

    // 2. Add river text
    elements.push(
      <div
        key="river-text"
        className="absolute flex justify-between items-center"
        style={{
          top: '200px', // 4 rows * 50px
          left: '50px', // 1 column * 50px
          width: '300px', // 6 columns * 50px
          height: '50px',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      >
        <span style={{ color: riverColor, fontWeight: 'bold', fontSize: '24px' }}>楚河</span>
        <span style={{ color: riverColor, fontWeight: 'bold', fontSize: '24px' }}>漢界</span>
      </div>
    );

    return elements;
  }, [isDarkMode, cellSize]);

  // State for mouse position tracking
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const mousePosRef = useRef<{x: number, y: number} | null>(null);

  // Update mouse position using RAF for performance
  useEffect(() => {
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const newPos = {x: e.clientX, y: e.clientY};
        setMousePos(newPos);
        mousePosRef.current = newPos;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Initialize drag state hooks
  const dragState = useDragState();

  // Type for handleCellClick function
  type HandleCellClickFn = (row: number, col: number) => void;

  // Handle cell click with useCallback to avoid recreating the function on every render
  const handleCellClick: HandleCellClickFn = useCallback((row: number, col: number) => {
    const selectedPiece = board.selectedPiece;

    // If a piece is already selected
    if (selectedPiece) {
      const isValidMoveTarget = board.validMoves.some(([r, c]) => r === row && c === col);

      if (isValidMoveTarget) {
        // Check if this is a capture move
        const pieceAtTarget = board.pieces.find(p => p.position[0] === row && p.position[1] === col);

        // Make the move
        const newGameState = makeMove(gameState, selectedPiece, row, col);
        setGameState(newGameState);

        // Play appropriate sound
        if (pieceAtTarget) {
          // Capture sound
          Feedback.pieceCapture();
        } else {
          // Regular move sound
          Feedback.pieceMove();
        }

        // Check if the move resulted in check
        if (newGameState.check) {
          // Slight delay for the check sound to avoid overlap
          setTimeout(() => Feedback.check(), 300);
        }

        // Check if the game ended
        if (newGameState.gameStatus !== GameStatus.IN_PROGRESS) {
          // Slight delay for the game end sound
          setTimeout(() => Feedback.gameEnd(), 500);
        }
      } else {
        // Check if clicking on another piece of the same side
        const pieceAtCell = board.pieces.find(p => p.position[0] === row && p.position[1] === col);

        if (pieceAtCell && pieceAtCell.side === gameState.currentTurn) {
          // Select the new piece
          const newGameState = selectPiece(gameState, row, col);
          setGameState(newGameState);
          // Play piece selection sound
          Feedback.pieceSelect();
        } else {
          // Deselect the current piece
          const newGameState = deselectPiece(gameState);
          setGameState(newGameState);
          // Play deselection sound (using toggle sound)
          Feedback.toggle();
        }
      }
    } else {
      // No piece is selected, try to select a piece
      const pieceAtCell = board.pieces.find(p => p.position[0] === row && p.position[1] === col);

      if (pieceAtCell && pieceAtCell.side === gameState.currentTurn) {
        // Select the piece
        const newGameState = selectPiece(gameState, row, col);
        setGameState(newGameState);
        // Play piece selection sound
        Feedback.pieceSelect();
      }
    }
  }, [gameState, board, setGameState]);

  // Handle undo move with useCallback
  const handleUndoMove = useCallback(() => {
    if (gameState.moveHistory.length > 0) {
      const newGameState = undoMove(gameState);
      setGameState(newGameState);
      // Play undo sound
      Feedback.buttonClick();
    }
  }, [gameState]);

  // Handle new game with useCallback
  const handleNewGame = useCallback(() => {
    const newGameState = startGame(initializeGameState());
    setGameState(newGameState);
    // Play game start sound
    Feedback.gameStart();
  }, []);

  // Handle theme toggle with useCallback
  const handleThemeToggle = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
    // Play toggle sound
    Feedback.toggle();
  }, [isDarkMode]);

  // Handle save game with useCallback
  const handleSaveGame = useCallback(() => {
    if (gameState.moveHistory.length > 0) {
      try {
        const gameData = JSON.stringify(gameState);
        localStorage.setItem('savedXiangqiGame', gameData);
        toast({ title: 'Game Saved', description: 'Your game has been saved to local storage.' });
        Feedback.buttonClick();
      } catch (error) {
        console.error("Error saving game to local storage:", error);
        toast({ title: 'Error Saving Game', description: 'Could not save game to local storage.', variant: 'destructive' });
      }
    } else {
      setShowSaveGameDialog(true);
    }
  }, [gameState, toast]);

  // Handle load game with useCallback
  const handleLoadGame = useCallback(() => {
    try {
      const savedGameData = localStorage.getItem('savedXiangqiGame');
      if (savedGameData) {
        const loadedGameState = JSON.parse(savedGameData);
        // TODO: Add validation for the loaded game state structure
        setGameState(loadedGameState);
        toast({ title: 'Game Loaded', description: 'Your game has been loaded from local storage.' });
        Feedback.gameStart(); // Or a specific load sound
      } else {
        toast({ title: 'No Saved Game Found', description: 'Could not find a saved game in local storage.', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error loading game from local storage:", error);
      toast({ title: 'Error Loading Game', description: 'Could not load game from local storage.', variant: 'destructive' });
    }
  }, [setGameState, toast]);

  // Expose functions to parent component via ref
  useImperativeHandle(ref, () => ({
    resetGame: handleNewGame,
    saveGame: handleSaveGame,
    loadGame: handleLoadGame,
  }));

  // Handle sound settings with useCallback
  const handleSoundSettings = useCallback(() => {
    setShowSoundSettingsDialog(true);
    Feedback.dialogOpen();
  }, []);

  // Handle volume change with useCallback
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setSoundVolume(volume);
    setMasterVolume(volume);
  }, []);

  // Handle sound toggle with useCallback
  const handleSoundToggle = useCallback(() => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    Feedback.toggle();
  }, [soundEnabled]);

  // Handle haptics toggle with useCallback
  const handleHapticsToggle = useCallback(() => {
    const newHapticsEnabled = !hapticsEnabled;
    setHapticsEnabled(newHapticsEnabled);
    Feedback.toggle();
  }, [hapticsEnabled]);

  // Render intersection points for click handling
  const intersectionPoints = useMemo(() => {
    const elements: JSX.Element[] = [];

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const isValidMove = gameState.board.validMoves.some(([r, c]) => r === row && c === col);

        elements.push(
          <div
            key={`intersection-${row}-${col}`}
            className="absolute"
            style={{
              top: `${row * cellSize}px`,
              left: `${col * cellSize}px`,
              width: '20px',
              height: '20px',
              transform: 'translate(-10px, -10px)',
              cursor: isValidMove ? 'pointer' : 'default',
              zIndex: 3,
            }}
            onClick={() => handleCellClick(row, col)}
            role="button"
            aria-label={`Board position ${row}, ${col}`}
          >
            {/* Valid move indicator */}
            {isValidMove && !gameState.board.pieces.find(p => p.position[0] === row && p.position[1] === col) && (
              <ValidMoveIndicator isDarkMode={isDarkMode} />
            )}
          </div>
        );
      }
    }

    return elements;
  }, [gameState.board.validMoves, gameState.board.pieces, cellSize, isDarkMode, handleCellClick]);

  // Memoize the pieces to avoid recreating them on every render
  const pieces = useMemo(() => {
    const elements: JSX.Element[] = [];

    // Render pieces
    gameState.board.pieces.forEach(piece => {
      const [row, col] = piece.position;
      const isValidMove = gameState.board.validMoves.some(
        ([r, c]) => r === row && c === col
      );
      
      // Check if this piece is selected
      const isSelected = !!(
        gameState.board.selectedPiece &&
        gameState.board.selectedPiece.position[0] === row &&
        gameState.board.selectedPiece.position[1] === col
      );
      
      // Get current mouse coordinates for hover effects
      const currentCoords = mousePos ? getBoardCoordinates(mousePos.x, mousePos.y) : null;
      const isHovered = currentCoords && currentCoords[0] === row && currentCoords[1] === col;

      elements.push(
        <div
          key={`piece-${piece.id || `${row}-${col}`}`}
          className="absolute"
          style={{
            top: `${row * cellSize}px`,
            left: `${col * cellSize}px`,
            zIndex: 10,
            transform: 'translate(-19px, -19px)', // Center the piece on the intersection
          }}
        >
          <MemoizedPiece
            piece={piece}
            isDarkMode={isDarkMode}
            isSelected={isSelected}
            isCurrentTurn={gameState.currentTurn === piece.side}
            onClick={() => handleCellClick(row, col)}
          />

          {/* Capture Move Indicator (Circle around opponent piece) */}
          {isValidMove && piece.side !== gameState.currentTurn && (
            <CaptureIndicator isDarkMode={isDarkMode} />
          )}
        </div>
      );
    });

    return elements;
  }, [gameState.board.pieces, gameState.board.selectedPiece, gameState.board.validMoves, gameState.currentTurn, cellSize, isDarkMode, handleCellClick, mousePos, getBoardCoordinates]);

  // Memoize the move history to avoid recreating it on every render
  const moveHistory = useMemo(() => {
    if (gameState.moveHistory.length === 0) return null;

    return (
      <div className="mt-2 sm:mt-4">
        <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Move History</h3>
        <div className="max-h-32 sm:max-h-40 overflow-y-auto border rounded-md p-2">
          {gameState.moveHistory.map((move, index) => (
            <MoveHistoryItem key={index} index={index} notation={move.notation} />
          ))}
        </div>
      </div>
    );
  }, [gameState.moveHistory]);

  return (
    <div className="flex flex-col items-center">
      {/* Game controls */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleNewGame}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New Game
        </Button>
        <Button variant="outline" size="sm" onClick={handleUndoMove} disabled={gameState.moveHistory.length === 0}>
          <Undo className="mr-2 h-4 w-4" />
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={handleSaveGame}>
          <Save className="mr-2 h-4 w-4" />
          Save Game
        </Button>
        <Button variant="outline" size="sm" onClick={handleThemeToggle}>
          {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleSoundSettings}>
          <Volume2 className="mr-2 h-4 w-4" />
          Sound
        </Button>
      </div>

      {/* Player turn indicator */}
      <div className="mb-4 text-center">
        <div className="text-lg font-semibold">
          Current Turn: <span className={gameState.currentTurn === PlayerSide.RED ? "text-red-600" : "text-blue-600"}>
            {gameState.currentTurn === PlayerSide.RED ? "Red" : "Blue"}
          </span>
        </div>
        {gameState.check && (
          <div className="text-amber-500 font-bold mt-1">CHECK!</div>
        )}
        {gameState.checkmate && (
          <div className="text-red-500 font-bold mt-1">CHECKMATE!</div>
        )}
        {gameState.gameStatus === GameStatus.RED_WON && (
          <div className="text-red-600 font-bold mt-1">Red Wins!</div>
        )}
        {gameState.gameStatus === GameStatus.BLACK_WON && (
          <div className="text-blue-600 font-bold mt-1">Blue Wins!</div>
        )}
        {gameState.gameStatus === GameStatus.DRAW && (
          <div className="text-gray-600 font-bold mt-1">Draw!</div>
        )}
      </div>

      {/* Board */}
      <div className="relative rounded-md board-container" style={{
        backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)',
        maxWidth: '100%',
        margin: '0 auto',
        padding: '50px', // Keep the 50px padding around all sides
        boxSizing: 'content-box'
      }}>
        <div className="relative" style={{
          width: '400px', // 8 columns * 50px (pieces are placed on intersections, not cells)
          height: '450px', // 9 rows * 50px (pieces are placed on intersections, not cells)
          margin: '0 auto',
          border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'hsl(var(--border))'}`,
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
          backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)' // Add background color to the board
        }}>
          {/* Palace diagonal lines - proper 3x3 implementation */}
          {palatialAnchors}
          <div className="relative" style={{
            width: '400px',
            height: '450px',
            backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)'
          }}>
            {/* Render board grid */}
            {boardGridElements}

            {/* Render intersection points for click handling */}
            {intersectionPoints}

            {/* Render pieces */}
            {pieces}
          </div>
        </div>
      </div>

      {/* Move history */}
      {moveHistory}

      {/* Save Game Dialog */}
      <Dialog open={showSaveGameDialog} onOpenChange={setShowSaveGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Moves to Save</DialogTitle>
            <DialogDescription>
              There are no moves to save. Make at least one move before saving the game.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSaveGameDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sound Settings Dialog */}
      <Dialog open={showSoundSettingsDialog} onOpenChange={setShowSoundSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sound Settings</DialogTitle>
            <DialogDescription>
              Adjust sound and haptic feedback settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <label htmlFor="sound-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Sound Effects
              </label>
              <input
                id="sound-toggle"
                type="checkbox"
                checked={soundEnabled}
                onChange={handleSoundToggle}
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="haptics-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Haptic Feedback
              </label>
              <input
                id="haptics-toggle"
                type="checkbox"
                checked={hapticsEnabled}
                onChange={handleHapticsToggle}
                className="h-4 w-4"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="volume-slider" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Volume: {Math.round(soundVolume * 100)}%
              </label>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={soundVolume}
                onChange={handleVolumeChange}
                className="w-full"
                disabled={!soundEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSoundSettingsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default memo(OptimizedInteractiveBoard);
