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
import { Undo, Sun, Moon, RotateCcw, Save, Volume2, Settings } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { Feedback, initAudio } from "@/lib/sound";
import SoundSettings from "@/components/SoundSettings";

const InteractiveBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showSaveGameDialog, setShowSaveGameDialog] = useState(false);
  const { toast } = useToast();

  // Define game control functions first
  const handleNewGame = () => {
    // If there are moves in the history, show confirmation dialog
    if (gameState.moveHistory.length > 0) {
      setShowNewGameDialog(true);
    } else {
      // If no moves have been made, prompt for player names first
      setShowPlayerNameDialog(true);
    }
  };

  const startNewGameWithNames = () => {
    // Start a new game with the entered player names
    const newGameState = startGame(initializeGameState());
    setGameState(newGameState);
    setShowPlayerNameDialog(false);

    // Save player names to localStorage
    localStorage.setItem('redPlayerName', redPlayerName);
    localStorage.setItem('blackPlayerName', blackPlayerName);

    // Play game start sound
    Feedback.gameStart();

    toast({
      title: "Game Started",
      description: `${redPlayerName} vs ${blackPlayerName}`,
      duration: 3000,
    });
  };

  const confirmNewGame = () => {
    setShowNewGameDialog(false);
    // Show player name dialog after confirming new game
    setShowPlayerNameDialog(true);
  };

  const handleUndoMove = () => {
    const newGameState = undoMove(gameState);
    setGameState(newGameState);
    // Play undo sound
    Feedback.buttonClick();
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

    // Load saved player names if available
    const savedRedName = localStorage.getItem('redPlayerName');
    const savedBlackName = localStorage.getItem('blackPlayerName');

    if (savedRedName) {
      setRedPlayerName(savedRedName);
    }

    if (savedBlackName) {
      setBlackPlayerName(savedBlackName);
    }

    // Start the game
    setGameState(startGame(gameState));

    // Initialize audio system after user interaction
    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);



  // Handle multiplayer game functionality
  const [showJoinGameDialog, setShowJoinGameDialog] = useState(false);
  const [showHostGameDialog, setShowHostGameDialog] = useState(false);
  const [showNewCodeConfirmation, setShowNewCodeConfirmation] = useState(false);
  const [showPlayerNameDialog, setShowPlayerNameDialog] = useState(false);
  const [showSoundSettingsDialog, setShowSoundSettingsDialog] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [generatedGameCode, setGeneratedGameCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Player information
  const [redPlayerName, setRedPlayerName] = useState('Red Player');
  const [blackPlayerName, setBlackPlayerName] = useState('Blue Player');
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [playerSide, setPlayerSide] = useState<PlayerSide | null>(null);

  // Load saved game code from local storage on component mount
  useEffect(() => {
    const savedGameCode = localStorage.getItem('generalXiangHostCode');
    if (savedGameCode) {
      setGeneratedGameCode(savedGameCode);
    } else {
      // Generate a code if none exists
      const newCode = generateGameCode();
      setGeneratedGameCode(newCode);
      localStorage.setItem('generalXiangHostCode', newCode);
    }
  }, []);

  const handleJoinGame = () => {
    setShowJoinGameDialog(true);

    // Check clipboard for game code when dialog opens
    navigator.clipboard.readText()
      .then(text => {
        const trimmedText = text.trim();
        // If clipboard contains what looks like a game code (6 characters), auto-paste it
        if (trimmedText.length === 6) {
          setGameCode(trimmedText);
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);

          toast({
            title: "Code detected",
            description: "Game code found in clipboard and auto-pasted",
            duration: 2000,
          });
        }
      })
      .catch(err => {
        // Silently fail - no need to show error for this automatic check
        console.log('Could not read clipboard automatically');
      });
  };

  const handleHostGame = () => {
    // Use the existing code
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

  // Generate a new game code and save it to local storage
  const generateNewGameCode = () => {
    const randomCode = generateGameCode();
    setGeneratedGameCode(randomCode);
    localStorage.setItem('generalXiangHostCode', randomCode);
    setShowNewCodeConfirmation(false);
  };

  // Copy game code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedGameCode)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);

        // Play copy sound
        Feedback.copy();

        // Show toast notification
        toast({
          title: "Copied to clipboard",
          description: "Game code has been copied to your clipboard",
          duration: 2000,
        });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);

        // Play error sound
        Feedback.error();

        // Show error toast
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      });
  };

  // Paste from clipboard to game code input
  const pasteFromClipboard = () => {
    navigator.clipboard.readText()
      .then(text => {
        const trimmedText = text.trim();
        setGameCode(trimmedText);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);

        // Play paste sound
        Feedback.paste();

        // Show toast notification
        toast({
          title: "Pasted from clipboard",
          description: "Game code has been pasted from your clipboard",
          duration: 2000,
        });

        // If the pasted code is valid (6 characters), automatically proceed after a short delay
        if (trimmedText.length === 6) {
          setTimeout(() => {
            confirmJoinGame();
          }, 500);
        }
      })
      .catch(err => {
        console.error('Failed to paste text: ', err);

        // Play error sound
        Feedback.error();

        // Show error toast
        toast({
          title: "Paste failed",
          description: "Could not paste from clipboard. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      });
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
      // No piece selected, try to select one
      const newGameState = selectPiece(gameState, row, col);

      // Check if a piece was actually selected
      if (newGameState.board.selectedPiece) {
        setGameState(newGameState);
        // Play piece selection sound
        Feedback.pieceSelect();
      } else {
        // Invalid selection - play error sound
        Feedback.invalidMove();
      }
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
          return `${gameState.currentTurn === PlayerSide.RED ? blackPlayerName : redPlayerName} is in check!`;
        }
        return `${gameState.currentTurn === PlayerSide.RED ? redPlayerName : blackPlayerName}'s turn`;
      case GameStatus.RED_WON:
        return `${redPlayerName} wins!`;
      case GameStatus.BLACK_WON:
        return `${blackPlayerName} wins!`;
      case GameStatus.DRAW:
        return "Game ended in a draw";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Player info and game status */}
      <div className="flex flex-col gap-2 sm:gap-4">
        {/* Player info cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Red player card */}
          <div className={`p-2 sm:p-3 rounded-md border ${gameState.currentTurn === PlayerSide.RED ? 'border-red-800 bg-red-50 dark:bg-red-950' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-800"></div>
              <div className="flex-1 truncate">
                <h3 className="text-sm sm:text-base font-semibold truncate">{redPlayerName}</h3>
                <p className="text-xs text-muted-foreground">Red Side</p>
              </div>
              {gameState.currentTurn === PlayerSide.RED && (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Blue player card */}
          <div className={`p-2 sm:p-3 rounded-md border ${gameState.currentTurn === PlayerSide.BLACK ? 'border-blue-800 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-800"></div>
              <div className="flex-1 truncate">
                <h3 className="text-sm sm:text-base font-semibold truncate">{blackPlayerName}</h3>
                <p className="text-xs text-muted-foreground">Blue Side</p>
              </div>
              {gameState.currentTurn === PlayerSide.BLACK && (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Game status and controls */}
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
              {/*
                Palace coordinates explanation:
                - Each cell is 50x50 pixels
                - Top palace spans from row 0 to row 2, and column 3 to column 5
                - Bottom palace spans from row 7 to row 9, and column 3 to column 5
                - Column 3 starts at x=150px (3*50px)
                - Column 5 ends at x=250px (5*50px)
                - Row 0 starts at y=0px
                - Row 2 ends at y=100px (2*50px)
                - Row 7 starts at y=350px (7*50px)
                - Row 9 ends at y=450px (9*50px)
              */}

              {/* Diagonal from top-left (col 3, row 0) to bottom-right (col 5, row 2) */}
              <line
                x1="150" y1="0"
                x2="250" y2="100"
                stroke={isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}
                strokeWidth="2"
              />
              {/* Diagonal from top-right (col 5, row 0) to bottom-left (col 3, row 2) */}
              <line
                x1="250" y1="0"
                x2="150" y2="100"
                stroke={isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}
                strokeWidth="2"
              />

              {/* Bottom palace diagonal lines - connecting corners of the 3x3 palace */}
              {/* Diagonal from top-left (col 3, row 7) to bottom-right (col 5, row 9) */}
              <line
                x1="150" y1="350"
                x2="250" y2="450"
                stroke={isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}
                strokeWidth="2"
              />
              {/* Diagonal from top-right (col 5, row 7) to bottom-left (col 3, row 9) */}
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
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Enter game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={pasteFromClipboard}
                className="flex items-center gap-1"
                title="Paste from clipboard"
              >
                {pasteSuccess ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Pasted
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard">
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    </svg>
                    Paste
                  </>
                )}
              </Button>
            </div>
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
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="text-2xl font-bold tracking-widest bg-muted p-4 rounded-md mb-2">
                {generatedGameCode}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  {copySuccess ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                      </svg>
                      Copy Code
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewCodeConfirmation(true)}
                  className="flex items-center gap-1"
                  title="Generate a new code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  New Code
                </Button>
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

      {/* New Code Confirmation Dialog */}
      <AlertDialog open={showNewCodeConfirmation} onOpenChange={setShowNewCodeConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Game Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new game code. Anyone using your previous code will no longer be able to join your game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateNewGameCode}>
              Generate New Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Player Name Dialog */}
      <AlertDialog open={showPlayerNameDialog} onOpenChange={setShowPlayerNameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Player Names</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter names for both players.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="redPlayerName" className="text-sm font-medium flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-800"></div>
                Red Player
              </label>
              <Input
                id="redPlayerName"
                placeholder="Enter red player's name"
                value={redPlayerName}
                onChange={(e) => setRedPlayerName(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="blackPlayerName" className="text-sm font-medium flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-800"></div>
                Blue Player
              </label>
              <Input
                id="blackPlayerName"
                placeholder="Enter blue player's name"
                value={blackPlayerName}
                onChange={(e) => setBlackPlayerName(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={startNewGameWithNames}
              disabled={!redPlayerName.trim() || !blackPlayerName.trim()}
            >
              Start Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InteractiveBoard;
