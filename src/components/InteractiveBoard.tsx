'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  GameState,
  GameStatus,
  initializeGameState,
  startGame,
  selectPiece,
  makeMove,
  deselectPiece,
  undoMove
} from '@/game/gameState';
import { PlayerSide } from '@/game/pieces';
import { Undo, Sun, Moon, RotateCcw, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const InteractiveBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showSaveGameDialog, setShowSaveGameDialog] = useState(false);

  // Define game control functions first
  const handleNewGame = () => {
    // If there are moves in the history, show confirmation dialog
    if (gameState.moveHistory.length > 0) {
      setShowNewGameDialog(true);
    } else {
      // If no moves have been made, start a new game immediately
      const newGameState = startGame(initializeGameState());
      setGameState(newGameState);
    }
  };

  const confirmNewGame = () => {
    const newGameState = startGame(initializeGameState());
    setGameState(newGameState);
    setShowNewGameDialog(false);
  };

  const handleUndoMove = () => {
    const newGameState = undoMove(gameState);
    setGameState(newGameState);
  };

  const handleSaveGame = () => {
    // If there are moves in the history, allow saving
    if (gameState.moveHistory.length > 0) {
      const gameData = JSON.stringify(gameState);
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `xiangqi-game-${timestamp}.json`;

      // Create a blob and download link
      const blob = new Blob([gameData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } else {
      // Show dialog that there's nothing to save
      setShowSaveGameDialog(true);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');

    // Apply or remove dark mode class
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Check localStorage and system preference for dark mode
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial state based on stored preference or system preference
    const initialDarkMode = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);
    setIsDarkMode(initialDarkMode);

    // Apply dark mode class to document
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Start the game
    setGameState(startGame(gameState));
  }, []);



  // Handle multiplayer game functionality
  const [showJoinGameDialog, setShowJoinGameDialog] = useState(false);
  const [showHostGameDialog, setShowHostGameDialog] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [generatedGameCode, setGeneratedGameCode] = useState('');

  const handleJoinGame = () => {
    setShowJoinGameDialog(true);
  };

  const handleHostGame = () => {
    // Generate a unique game code
    const randomCode = generateGameCode();
    setGeneratedGameCode(randomCode);
    setShowHostGameDialog(true);
  };

  // Generate a random game code
  const generateGameCode = () => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += validChars.charAt(Math.floor(Math.random() * validChars.length));
    }
    return result;
  };

  const confirmJoinGame = () => {
    // This would connect to the Jami-based game state multicaster
    console.log(`Joining game with code: ${gameCode}`);
    // TODO: Implement Jami-based multiplayer functionality
    setShowJoinGameDialog(false);
  };

  const confirmHostGame = () => {
    // This would create a new game session using the Jami-based game state multicaster
    console.log(`Hosting game with code: ${generatedGameCode}`);
    // TODO: Implement Jami-based multiplayer functionality
    setShowHostGameDialog(false);
  };

  // Connect the sidebar buttons to their respective functions
  useEffect(() => {
    const newGameButton = document.getElementById('new-game-button');
    const saveGameButton = document.getElementById('save-game-button');
    const joinGameButton = document.getElementById('join-game-button');
    const hostGameButton = document.getElementById('host-game-button');

    const handleNewGameClick = () => handleNewGame();
    const handleSaveGameClick = () => handleSaveGame();
    const handleJoinGameClick = () => handleJoinGame();
    const handleHostGameClick = () => handleHostGame();

    if (newGameButton) {
      newGameButton.addEventListener('click', handleNewGameClick);
    }

    if (saveGameButton) {
      saveGameButton.addEventListener('click', handleSaveGameClick);
    }

    if (joinGameButton) {
      joinGameButton.addEventListener('click', handleJoinGameClick);
    }

    if (hostGameButton) {
      hostGameButton.addEventListener('click', handleHostGameClick);
    }

    // Cleanup event listeners on component unmount
    return () => {
      if (newGameButton) {
        newGameButton.removeEventListener('click', handleNewGameClick);
      }
      if (saveGameButton) {
        saveGameButton.removeEventListener('click', handleSaveGameClick);
      }
      if (joinGameButton) {
        joinGameButton.removeEventListener('click', handleJoinGameClick);
      }
      if (hostGameButton) {
        hostGameButton.removeEventListener('click', handleHostGameClick);
      }
    };
  }, []);

  const handleCellClick = (row: number, col: number) => {
    // If game is not in progress, do nothing
    if (gameState.gameStatus !== GameStatus.IN_PROGRESS) {
      return;
    }

    const { board } = gameState;
    const { selectedPiece, validMoves } = board;

    // If a piece is already selected
    if (selectedPiece) {
      // Check if the clicked cell is a valid move
      const isValidMoveTarget = validMoves.some(([r, c]) => r === row && c === col);

      if (isValidMoveTarget) {
        // Make the move
        const newGameState = makeMove(gameState, selectedPiece, row, col);
        setGameState(newGameState);
      } else {
        // Check if clicking on another piece of the same side
        const pieceAtCell = board.pieces.find(p => p.position[0] === row && p.position[1] === col);

        if (pieceAtCell && pieceAtCell.side === gameState.currentTurn) {
          // Select the new piece
          const newGameState = selectPiece(gameState, row, col);
          setGameState(newGameState);
        } else {
          // Deselect the current piece
          const newGameState = deselectPiece(gameState);
          setGameState(newGameState);
        }
      }
    } else {
      // No piece selected, try to select one
      const newGameState = selectPiece(gameState, row, col);
      setGameState(newGameState);
    }
  };

  const renderPiece = (row: number, col: number) => {
    const piece = gameState.board.pieces.find(p => p.position[0] === row && p.position[1] === col);

    if (!piece) {
      return null;
    }

    const isRedPiece = piece.side === PlayerSide.RED;
    const pieceColor = isRedPiece ? 'hsl(5, 100%, 27.3%)' : 'hsl(197, 37%, 24%)'; // Deep Red and Dark Blue

    // Check if this piece is selected
    const isSelected = gameState.board.selectedPiece &&
                      gameState.board.selectedPiece.position[0] === row &&
                      gameState.board.selectedPiece.position[1] === col;

    // Check if this position is a valid move
    const isValidMove = gameState.board.validMoves.some(([r, c]) => r === row && c === col);

    const getChipStyle = () => {
      const baseStyle = {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2em',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'absolute', // Absolute positioning
        top: '0',             // Position at the intersection
        left: '0',            // Position at the intersection
        transform: 'translate(-50%, -50%)', // Offset to center on the intersection
        border: '2px solid',
        borderColor: isSelected ? 'hsl(215, 100%, 50%)' : pieceColor, // Highlight selected piece
        backgroundColor: isSelected ? 'hsl(215, 100%, 95%)' : 'white', // Highlight selected piece
        color: pieceColor, // Character color
        zIndex: 10, // Ensure pieces appear above the board lines
      };
      return baseStyle;
    };

    const getTextStyle = () => {
      return {
        position: 'relative',
        zIndex: 1,
        WebkitTextStroke: `1px ${pieceColor}`,
        color: pieceColor,
        fontFamily: 'serif',
        fontWeight: 'bold',
      };
    };

    return (
      <div
        key={`${row}-${col}`}
        style={getChipStyle()}
        onClick={() => handleCellClick(row, col)}
      >
        <span style={getTextStyle()}>{piece.symbol}</span>
      </div>
    );
  };

  const getCellStyle = (rowIndex: number, colIndex: number) => {
    // Base cell style - now represents an intersection point rather than a square
    let cellStyle = {
      width: '50px',
      height: '50px',
      position: 'relative', // Relative positioning for the cell
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    };

    // Line color based on dark mode
    const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'hsl(var(--border))';

    // Add horizontal lines
    if (rowIndex < 9) {
      cellStyle = {
        ...cellStyle,
        borderBottom: `1px solid ${lineColor}`,
      };
    }

    // Add vertical lines
    if (colIndex < 8) {
      cellStyle = {
        ...cellStyle,
        borderRight: `1px solid ${lineColor}`,
      };
    }

    // River boundaries (rows 4 and 5)
    if (rowIndex === 4) {
      const riverColor = isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)'; // Jade Green
      cellStyle = {
        ...cellStyle,
        borderBottom: `2px dashed ${riverColor}`,
      };
    }

    // Palace boundaries
    if ((rowIndex >= 0 && rowIndex <= 2 && colIndex >= 3 && colIndex <= 5) ||
        (rowIndex >= 7 && rowIndex <= 9 && colIndex >= 3 && colIndex <= 5)) {
      // Palace color based on dark mode
      const palaceColor = isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'; // Deep Red

      // Add thicker borders for palace
      if (rowIndex === 0 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 0 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 2 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 2 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 7 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 7 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 9 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 9 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
    }

    // Highlight valid move positions
    const isValidMove = gameState.board.validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
    if (isValidMove) {
      cellStyle = {
        ...cellStyle,
        cursor: 'pointer',
      };
    }

    return cellStyle;
  };

  // Create a 10x9 grid for the board
  const renderBoard = () => {
    const rows = [];
    for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
      const cells = [];
      for (let colIndex = 0; colIndex < 9; colIndex++) {
        cells.push(
          <div
            key={`${rowIndex}-${colIndex}`}
            className="w-[50px] h-[50px] flex items-center justify-center"
            style={getCellStyle(rowIndex, colIndex)}
            onClick={() => handleCellClick(rowIndex, colIndex)}
          >
            {renderPiece(rowIndex, colIndex)}

            {/* Valid move indicator */}
            {gameState.board.validMoves.some(([r, c]) => r === rowIndex && c === colIndex) && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none',
                zIndex: 5,
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: isDarkMode ? 'rgba(0, 255, 0, 0.9)' : 'rgba(0, 128, 0, 0.9)',
                  backgroundColor: isDarkMode ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 128, 0, 0.3)',
                  boxShadow: isDarkMode ? '0 0 4px rgba(0, 255, 0, 0.7)' : '0 0 4px rgba(0, 128, 0, 0.7)',
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)', // Center on the intersection
                  top: '0',
                  left: '0',
                }}></div>
              </div>
            )}

            {/* Position markers for soldiers and cannons */}
            {((rowIndex === 3 && (colIndex === 0 || colIndex === 2 || colIndex === 4 || colIndex === 6 || colIndex === 8)) ||
              (rowIndex === 6 && (colIndex === 0 || colIndex === 2 || colIndex === 4 || colIndex === 6 || colIndex === 8)) ||
              (rowIndex === 2 && (colIndex === 1 || colIndex === 7)) ||
              (rowIndex === 7 && (colIndex === 1 || colIndex === 7))) && (
              <div style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                zIndex: 1,
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '0',
                  width: '10px',
                  height: '1px',
                  backgroundColor: lineColor,
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '0',
                  width: '10px',
                  height: '1px',
                  backgroundColor: lineColor,
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '-5px',
                  top: '0',
                  width: '1px',
                  height: '10px',
                  backgroundColor: lineColor,
                }}></div>
                <div style={{
                  position: 'absolute',
                  right: '-5px',
                  top: '0',
                  width: '1px',
                  height: '10px',
                  backgroundColor: lineColor,
                }}></div>
              </div>
            )}
          </div>
        );
      }
      rows.push(
        <div key={rowIndex} className="flex">
          {cells}
        </div>
      );
    }
    return rows;
  };

  // Get the line color based on dark mode
  const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'hsl(var(--border))';

  // Game status message
  const getGameStatusMessage = () => {
    switch (gameState.gameStatus) {
      case GameStatus.NOT_STARTED:
        return "Game not started";
      case GameStatus.IN_PROGRESS:
        if (gameState.check) {
          return `${gameState.currentTurn === PlayerSide.RED ? 'Blue' : 'Red'} is in check!`;
        }
        return `${gameState.currentTurn === PlayerSide.RED ? 'Red' : 'Blue'}'s turn`;
      case GameStatus.RED_WON:
        return "Red wins!";
      case GameStatus.BLACK_WON:
        return "Blue wins!";
      case GameStatus.DRAW:
        return "Game ended in a draw";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center gap-2">
        <div className="text-base sm:text-lg font-semibold">
          {getGameStatusMessage()}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="icon" variant="outline" onClick={handleUndoMove} disabled={gameState.moveHistory.length === 0}
            title="Undo Move" aria-label="Undo Move">
            <Undo className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="relative p-2 sm:p-4 rounded-md board-container overflow-auto" style={{
        backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)',
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        <div className="relative" style={{ width: 'fit-content', margin: '0 auto' }}>
          {/* Palace diagonal lines */}
          <div className="absolute" style={{
            top: '0',
            left: '0',
            width: '450px',
            height: '500px',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            {/* Palace diagonals */}
            <svg width="450" height="500" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              {/* Top palace diagonal lines - connecting corners of the 3x3 palace */}
              <line
                x1="150" y1="0"
                x2="250" y2="100"
                stroke={isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}
                strokeWidth="2"
              />
              <line
                x1="250" y1="0"
                x2="150" y2="100"
                stroke={isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}
                strokeWidth="2"
              />

              {/* Bottom palace diagonal lines - connecting corners of the 3x3 palace */}
              <line
                x1="150" y1="350"
                x2="250" y2="450"
                stroke={isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}
                strokeWidth="2"
              />
              <line
                x1="250" y1="350"
                x2="150" y2="450"
                stroke={isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* River text */}
          <div className="absolute flex justify-between items-center" style={{
            top: '225px',
            left: '0',
            width: '450px',
            zIndex: 2,
            padding: '0 20px',
            pointerEvents: 'none'
          }}>
            <span className="text-lg font-bold" style={{
              color: isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)',
              textShadow: isDarkMode ? '0 0 3px rgba(0, 0, 0, 0.5)' : 'none'
            }}>楚河</span>
            <span className="text-lg font-bold" style={{
              color: isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)',
              textShadow: isDarkMode ? '0 0 3px rgba(0, 0, 0, 0.5)' : 'none'
            }}>漢界</span>
          </div>

          {renderBoard()}
        </div>
      </div>

      {/* Move history */}
      {gameState.moveHistory.length > 0 && (
        <div className="mt-2 sm:mt-4">
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Move History</h3>
          <div className="max-h-32 sm:max-h-40 overflow-y-auto border rounded-md p-2">
            {gameState.moveHistory.map((move, index) => (
              <div key={index} className="text-xs sm:text-sm py-1 border-b last:border-b-0">
                {index + 1}. {move.notation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Game Confirmation Dialog */}
      <AlertDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a New Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your current game and start a new one. Any unsaved progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNewGame}>Start New Game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Nothing to Save Dialog */}
      <AlertDialog open={showSaveGameDialog} onOpenChange={setShowSaveGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Game to Save</AlertDialogTitle>
            <AlertDialogDescription>
              There are no moves to save. Make some moves first before saving the game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSaveGameDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Join Game Dialog */}
      <AlertDialog open={showJoinGameDialog} onOpenChange={setShowJoinGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join a Multiplayer Game</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the game code provided by your opponent to join their game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Game codes are provided by the host player when they start a multiplayer game.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmJoinGame} disabled={!gameCode.trim()}>
              Join Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Host Game Dialog */}
      <AlertDialog open={showHostGameDialog} onOpenChange={setShowHostGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Host a Multiplayer Game</AlertDialogTitle>
            <AlertDialogDescription>
              Share this game code with your opponent so they can join your game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="text-2xl font-bold tracking-widest bg-muted p-4 rounded-md">
                {generatedGameCode}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your opponent will need to enter this code to join your game.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHostGame}>
              Start Hosting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InteractiveBoard;
