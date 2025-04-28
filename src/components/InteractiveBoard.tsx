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
import { Undo, Sun, Moon, RotateCcw, Save, Volume2, Settings, CreditCard, LogIn } from 'lucide-react';
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
import CurrencyDisplay from "@/components/payment/CurrencyDisplay";
import CurrencyStore from "@/components/payment/CurrencyStore";
import LoginDialog from "@/components/auth/LoginDialog";
import AuthService, { AuthState, User } from "@/services/AuthService";

// Board dimensions for Xiangqi (Chinese Chess)
// The board has 9 columns (0-8) and 10 rows (0-9)
// Pieces are placed on intersections, not in squares
const cellSize = 50; // Size between intersections
const boardWidth = cellSize * 8; // 8 spaces between 9 intersections horizontally
const boardHeight = cellSize * 9; // 9 spaces between 10 intersections vertically

const setupPalatialAnchors = (isDarkMode: boolean) => (
  <div className="absolute" style={{
    top: 0,
    left: 0,
    width: boardWidth + 'px',
    height: boardHeight + 'px',
    zIndex: 2,
    pointerEvents: 'none'
  }}>
    {/* Top Palace */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 3 * cellSize,
      width: 2 * cellSize,
      height: 2 * cellSize,
      border: `1px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
      boxShadow: `${isDarkMode ? '0 0 10px hsl(5, 100%, 50%)' : '0 0 6px hsl(5, 100%, 27.3%)'}`,
      pointerEvents: 'none'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px)),
                       linear-gradient(to bottom left, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
      filter: `${isDarkMode ? 'drop-shadow(0 0 6px hsl(5, 100%, 50%))' : 'drop-shadow(0 0 4px hsl(5, 100%, 27.3%))'}`,
        pointerEvents: 'none'
      }}></div>
    </div>
    {/* Bottom Palace */}
    <div style={{
      position: 'absolute',
      top: 7 * cellSize,
      left: 3 * cellSize,
      width: 2 * cellSize,
      height: 2 * cellSize,
      border: `1px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
      boxShadow: `${isDarkMode ? '0 0 10px hsl(5, 100%, 50%)' : '0 0 6px hsl(5, 100%, 27.3%)'}`,
      pointerEvents: 'none'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px)),
                       linear-gradient(to bottom left, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
      filter: `${isDarkMode ? 'drop-shadow(0 0 6px hsl(5, 100%, 50%))' : 'drop-shadow(0 0 4px hsl(5, 100%, 27.3%))'}`,
        pointerEvents: 'none'
      }}></div>
    </div>
  </div>
);

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

    // Initialize authentication
    const initAuth = async () => {
      try {
        const authService = AuthService.getInstance();

        // Sign in anonymously by default
        const anonymousUser = await authService.signInAnonymously();
        setUser(anonymousUser);
        setAuthState(AuthState.AUTHENTICATED);
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        setAuthState(AuthState.UNAUTHENTICATED);
      }
    };

    initAuth();

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
  const [showCurrencyStoreDialog, setShowCurrencyStoreDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [generatedGameCode, setGeneratedGameCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNKNOWN);
  const [userId, setUserId] = useState<string>('user_' + Math.random().toString(36).substring(2, 15));

  // Player information
  const [redPlayerName, setRedPlayerName] = useState('Red Player');
  const [blackPlayerName, setBlackPlayerName] = useState('Blue Player');

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
    Feedback.dialogOpen();

    // Check clipboard for game code when dialog opens
    navigator.clipboard.readText()
      .then(text => {
        const trimmedText = text.trim();
        // If clipboard contains what looks like a game code (6 characters), auto-paste it
        if (trimmedText.length === 6) {
          setGameCode(trimmedText);
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);

          // Play paste sound
          Feedback.paste();

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
    Feedback.dialogOpen();
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
    const pieceColor = isRedPiece ? 'hsl(5, 100%, 27.3%)' : 'hsl(215, 100%, 35%)'; // Deep Red and Strong Blue
    const pieceColorDark = isRedPiece ? 'hsl(5, 100%, 70%)' : 'hsl(215, 100%, 75%)'; // Lighter for dark mode

    // Check if this piece is selected
    const isSelected = gameState.board.selectedPiece &&
                      gameState.board.selectedPiece.position[0] === row &&
                      gameState.board.selectedPiece.position[1] === col;

    const chipStyle: React.CSSProperties = {
      width: '38px', // Piece size
      height: '38px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: gameState.currentTurn === piece.side ? 'pointer' : 'default',
      transition: 'all 0.2s ease-out',
      backgroundColor: isDarkMode ? 'hsl(0, 0%, 20%)' : 'hsl(36, 50%, 90%)', // Dark/Light wood background
      border: `2px solid ${isDarkMode ? 'hsl(0, 0%, 40%)' : 'hsl(36, 30%, 60%)'}`, // Outer ring
      boxShadow: isSelected
        ? `0 0 10px 3px ${isDarkMode ? 'hsl(200, 100%, 70%)' : 'hsl(200, 100%, 50%)'}` // Glow when selected
        : (isDarkMode ? 'inset 0 2px 4px rgba(0,0,0,0.5), 0 3px 5px rgba(0,0,0,0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.2), 0 3px 5px rgba(0,0,0,0.2)'),
    };

    const textStyle: React.CSSProperties = {
      fontSize: '1.4em', // Larger text
      fontWeight: 'bold',
      fontFamily: '"Noto Serif SC", serif', // Use a suitable CJK font if available
      color: isDarkMode ? pieceColorDark : pieceColor,
      textShadow: isDarkMode ? `1px 1px 2px rgba(0, 0, 0, 0.7)` : `1px 1px 1px rgba(0, 0, 0, 0.3)`,
      WebkitTextStroke: `0.5px ${isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}`, // Subtle outline
    };

    return (
      <div
        style={chipStyle}
        onClick={(e) => {
          e.stopPropagation();
          handleCellClick(row, col);
        }}
        role="button"
        aria-label={`Piece ${piece.symbol} at ${row}, ${col}`}
      >
        <span style={textStyle}>{piece.symbol}</span>
      </div>
    );
  };

  // Cell styling is now handled directly in the renderBoard function

  // Render the board with pieces on intersections (not in spaces)
  const renderBoard = () => {
    const elements = [];
    const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const riverColor = isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)'; // Jade Green

    // 1. First, render the grid lines (8 horizontal, 9 vertical)
    // Horizontal lines (9 lines for 10 rows)
    for (let row = 0; row < 10; row++) {
      elements.push(
        <div
          key={`h-line-${row}`}
          className="absolute"
          style={{
            top: `${row * cellSize}px`,
            left: 0,
            width: '100%',
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
    for (let col = 0; col < 9; col++) {
      // Top half (stops at river)
      elements.push(
        <div
          key={`v-line-top-${col}`}
          className="absolute"
          style={{
            top: 0,
            left: `${col * cellSize}px`,
            width: '1px',
            height: col > 0 && col < 8 ? `${4 * cellSize}px` : `${4 * cellSize}px`, // Full columns
            backgroundColor: lineColor,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      );

      // Bottom half (starts after river)
      elements.push(
        <div
          key={`v-line-bottom-${col}`}
          className="absolute"
          style={{
            top: `${5 * cellSize}px`,
            left: `${col * cellSize}px`,
            width: '1px',
            height: col > 0 && col < 8 ? `${5 * cellSize}px` : `${5 * cellSize}px`, // Full columns
            backgroundColor: lineColor,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      );
    }

    // 2. Render position markers for soldiers and cannons
    const positionMarkers = [
      // Soldier positions
      {row: 3, col: 0}, {row: 3, col: 2}, {row: 3, col: 4}, {row: 3, col: 6}, {row: 3, col: 8},
      {row: 5, col: 0}, {row: 5, col: 2}, {row: 5, col: 4}, {row: 5, col: 6}, {row: 5, col: 8},
      // Cannon positions
      {row: 2, col: 1}, {row: 2, col: 7},
      {row: 6, col: 1}, {row: 6, col: 7}
    ];

    positionMarkers.forEach(({row, col}, index) => {
      elements.push(
        <div
          key={`marker-${index}`}
          className="absolute"
          style={{
            top: `${row * cellSize}px`,
            left: `${col * cellSize}px`,
            width: '10px',
            height: '10px',
            transform: 'translate(-5px, -5px)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        >
          {/* Horizontal parts */}
          <div style={{ position: 'absolute', top: '4.5px', left: '-5px', width: '5px', height: '1px', backgroundColor: lineColor }}></div>
          <div style={{ position: 'absolute', top: '4.5px', right: '-5px', width: '5px', height: '1px', backgroundColor: lineColor }}></div>
          {/* Vertical parts */}
          <div style={{ position: 'absolute', left: '4.5px', top: '-5px', height: '5px', width: '1px', backgroundColor: lineColor }}></div>
          <div style={{ position: 'absolute', left: '4.5px', bottom: '-5px', height: '5px', width: '1px', backgroundColor: lineColor }}></div>
        </div>
      );
    });

    // 3. Render intersection points (for click handling)
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
              // For debugging: backgroundColor: 'rgba(255, 0, 0, 0.1)',
            }}
            onClick={() => handleCellClick(row, col)}
            role="button"
            aria-label={`Board position ${row}, ${col}`}
          >
            {/* Valid move indicator */}
            {isValidMove && !gameState.board.pieces.find(p => p.position[0] === row && p.position[1] === col) && (
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
            )}
          </div>
        );
      }
    }

    // 4. Render pieces separately (on top of everything else)
    gameState.board.pieces.forEach(piece => {
      const [row, col] = piece.position;
      const isValidMove = gameState.board.validMoves.some(([r, c]) => r === row && c === col);

      elements.push(
        <div
          key={`piece-${row}-${col}`}
          className="absolute"
          style={{
            top: `${row * cellSize}px`,
            left: `${col * cellSize}px`,
            zIndex: 10,
            transform: 'translate(-19px, -19px)', // Center the piece on the intersection
          }}
        >
          {renderPiece(row, col)}

          {/* Capture Move Indicator (Circle around opponent piece) */}
          {isValidMove && piece.side !== gameState.currentTurn && (
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
          )}
        </div>
      );
    });

    return elements;
  };

  // Line color is now defined within the renderBoard function

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
          <div className="flex items-center gap-2">
            <CurrencyDisplay userId={userId} />
            <Button size="icon" variant="outline" onClick={() => setShowCurrencyStoreDialog(true)}
              title="Currency Store" aria-label="Currency Store">
              <CreditCard className="h-4 w-4" />
            </Button>
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
            <Button size="icon" variant="outline" onClick={() => setShowSoundSettingsDialog(true)}
              title="Sound Settings" aria-label="Sound Settings">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative rounded-md board-container" style={{
        backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)',
        maxWidth: '100%',
        margin: '0 auto',
        padding: '50px 50px 50px 50px', // Equal padding on all sides
        boxSizing: 'content-box'
      }}>
        <div className="relative" style={{
          width: '450px', // 9 columns * 50px
          height: '500px', // 10 rows * 50px
          margin: '0 auto',
          border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'hsl(var(--border))'}`,
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
          backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)' // Add background color to the board
        }}>
          {/* Palace diagonal lines - proper 3x3 implementation */}
          <div className="absolute" style={{
            top: '0',
            left: '0',
            width: '450px',
            height: '500px',
            zIndex: 2,
            pointerEvents: 'none'
          }}>
            {/* Top Palace (3x3 grid) */}
            <div style={{
              position: 'absolute',
              top: '0px',
              left: '150px',
              width: '100px', /* 2 cells wide (2*50px) */
              height: '100px', /* 2 cells tall (2*50px) */
              border: `1px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
              pointerEvents: 'none'
            }}>
              {/* Top Palace Diagonals */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px)),
                                 linear-gradient(to bottom left, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
                pointerEvents: 'none'
              }}></div>
            </div>

            {/* Bottom Palace (3x3 grid) */}
            <div style={{
              position: 'absolute',
              top: '350px', /* Row 7 starts at 350px (7*50px) */
              left: '150px', /* Column 3 starts at 150px (3*50px) */
              width: '100px', /* 2 cells wide (2*50px) */
              height: '100px', /* 2 cells tall (2*50px) */
              border: `1px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
              pointerEvents: 'none'
            }}>
              {/* Bottom Palace Diagonals */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px)),
                                 linear-gradient(to bottom left, transparent calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% - 0.5px), ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
                pointerEvents: 'none'
              }}></div>
            </div>
          </div>

          {/* River text */}
          <div className="absolute flex justify-between items-center" style={{
            top: '200px', /* Adjusted to match the new board size */
            left: '0',
            width: '450px',
            zIndex: 3, /* Increased z-index to ensure it's above the palace diagonals */
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

          {setupPalatialAnchors(isDarkMode)}
          <div className="relative" style={{
            width: '450px',
            height: '500px',
            backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)'
          }}>
            {renderBoard()}
          </div>
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

      {/* Sound Settings Dialog */}
      <AlertDialog open={showSoundSettingsDialog} onOpenChange={setShowSoundSettingsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sound Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Customize sound and haptic feedback for the game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <SoundSettings className="w-full" />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowSoundSettingsDialog(false);
              Feedback.dialogClose();
            }}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Currency Store Dialog */}
      <AlertDialog open={showCurrencyStoreDialog} onOpenChange={setShowCurrencyStoreDialog}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Currency Store</AlertDialogTitle>
            <AlertDialogDescription>
              Purchase virtual currency to unlock premium features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <CurrencyStore userId={userId} onClose={() => {
              setShowCurrencyStoreDialog(false);
              Feedback.dialogClose();
            }} />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InteractiveBoard;