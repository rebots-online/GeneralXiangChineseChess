'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Assuming these imports are correct and components exist
import { Button } from '@/components/ui/button';
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
import { useToast } from "@/hooks/use-toast"; // Assuming this hook exists
import { Feedback, initAudio } from "@/lib/sound"; // Assuming sound feedback functions exist
import SoundSettings from "@/components/SoundSettings"; // Assuming this component exists
import {
  GameState,
  GameStatus,
  initializeGameState,
  startGame,
  selectPiece,
  makeMove,
  deselectPiece,
  undoMove,
  Piece // Import Piece type correctly from gameState
} from '@/game/gameState'; // Assuming gameState functions and types exist
import { PlayerSide } from '@/game/pieces'; // Assuming PlayerSide enum exists
import { Undo, Sun, Moon, RotateCcw, Save, Volume2, Settings, Check, Clipboard, Copy, RefreshCw } from 'lucide-react';

// --- Constants ---
const CELL_SIZE = 50; // Size of each cell (distance between intersections)
const BOARD_COLUMNS = 9; // Xiangqi board has 9 columns (0-8)
const BOARD_ROWS = 10; // Xiangqi board has 10 rows (0-9)

// Visual grid constants
const VISUAL_INTERSECTION_COLUMNS = 9; // Number of columns in the visual grid
const VISUAL_INTERSECTION_ROWS = 10; // Number of rows in the visual grid

// Calculate board dimensions
const BOARD_WIDTH = CELL_SIZE * (BOARD_COLUMNS - 1);
const BOARD_HEIGHT = CELL_SIZE * (BOARD_ROWS - 1);

// --- Coordinate Mapping ---
// Since we're now showing all 9 columns visually, the mapping is direct.
// We keep these functions for compatibility with existing code.

/**
 * Maps a visual column index (0-8) to a logical column index (0-8).
 * With our updated approach, this is now a direct mapping.
 * @param visualCol - The column index from the visual representation (0-8).
 * @returns The corresponding logical column index (0-8).
 */
const mapVisualToLogical = (visualCol: number): number => {
  // Direct mapping now that visual and logical grids match
  return visualCol;
};

/**
 * Maps a logical column index (0-8) to a visual column index (0-8).
 * With our updated approach, this is now a direct mapping.
 * @param logicalCol - The column index from the logical game state (0-8).
 * @returns The corresponding visual column index (0-8).
 */
const mapLogicalToVisual = (logicalCol: number): number => {
  // Direct mapping now that visual and logical grids match
  return logicalCol;
};

// --- Helper Components ---

/**
 * Renders the palace 'X' markings using absolutely positioned divs.
 * @param isDarkMode - Boolean indicating if dark mode is active.
 */
const PalatialAnchors: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  // Palace coordinates in the logical grid
  const topPalaceLogicalLeft = 3;
  const topPalaceLogicalTop = 0;
  const bottomPalaceLogicalLeft = 3;
  const bottomPalaceLogicalTop = 7; // Bottom palace starts at row 7

  // Map to visual coordinates
  const topPalaceVisualLeft = mapLogicalToVisual(topPalaceLogicalLeft);
  const bottomPalaceVisualLeft = mapLogicalToVisual(bottomPalaceLogicalLeft);

  // Palace color
  const palaceColor = isDarkMode ? 'hsl(5, 100%, 70%)' : 'hsl(5, 100%, 27.3%)'; // Brighter red in dark mode
  const palaceShadow = isDarkMode ? 'drop-shadow(0 0 6px hsl(5, 100%, 50%))' : 'drop-shadow(0 0 4px hsl(5, 100%, 27.3%))';

  const palaceBorderStyle: React.CSSProperties = {
    position: 'absolute',
    width: 2 * CELL_SIZE,
    height: 2 * CELL_SIZE,
    border: `1px solid ${palaceColor}`,
    boxShadow: isDarkMode ? '0 0 10px hsl(5, 100%, 50%)' : '0 0 6px hsl(5, 100%, 27.3%)',
    pointerEvents: 'none', // Prevent interaction
    zIndex: 2, // Above board lines, below pieces
  };

  const diagonalStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 0.5px), ${palaceColor} calc(50% - 0.5px), ${palaceColor} calc(50% + 0.5px), transparent calc(50% + 0.5px)),
                       linear-gradient(to bottom left, transparent calc(50% - 0.5px), ${palaceColor} calc(50% - 0.5px), ${palaceColor} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
    filter: palaceShadow,
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Top Palace */}
      <div style={{
        ...palaceBorderStyle,
        top: topPalaceLogicalTop * CELL_SIZE,
        left: topPalaceVisualLeft * CELL_SIZE,
      }}>
        <div style={diagonalStyle}></div>
      </div>

      {/* Bottom Palace */}
      <div style={{
        ...palaceBorderStyle,
        top: bottomPalaceLogicalTop * CELL_SIZE,
        left: bottomPalaceVisualLeft * CELL_SIZE,
      }}>
        <div style={diagonalStyle}></div>
      </div>
    </>
  );
};

// --- Main Component ---

const InteractiveBoard: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(() => initializeGameState());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showSaveGameDialog, setShowSaveGameDialog] = useState(false);
  const [showPlayerNameDialog, setShowPlayerNameDialog] = useState(false);
  const [showSoundSettingsDialog, setShowSoundSettingsDialog] = useState(false);

  // Multiplayer State
  const [showJoinGameDialog, setShowJoinGameDialog] = useState(false);
  const [showHostGameDialog, setShowHostGameDialog] = useState(false);
  const [showNewCodeConfirmation, setShowNewCodeConfirmation] = useState(false);
  const [gameCode, setGameCode] = useState(''); // For joining
  const [generatedGameCode, setGeneratedGameCode] = useState(''); // For hosting
  const [copySuccess, setCopySuccess] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Player Info State
  const [redPlayerName, setRedPlayerName] = useState('Red Player');
  const [blackPlayerName, setBlackPlayerName] = useState('Blue Player'); // Changed to Blue for consistency with UI

  const { toast } = useToast();

  // --- Effects ---

  // Initialize theme, load names, setup audio interaction listener
  useEffect(() => {
    // Theme initialization
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);
    setIsDarkMode(initialDarkMode);
    document.documentElement.classList.toggle('dark', initialDarkMode);

    // Load player names or set defaults
    const savedRedName = localStorage.getItem('redPlayerName');
    const savedBlackName = localStorage.getItem('blackPlayerName');

    // Set names from storage or use defaults
    setRedPlayerName(savedRedName || 'Red Player');
    setBlackPlayerName(savedBlackName || 'Blue Player');

    // Start the game automatically with default or saved names
    if (gameState.gameStatus === GameStatus.NOT_STARTED) {
      const newGameState = startGame(initializeGameState());
      setGameState(newGameState);
      Feedback.gameStart();
    }

    // Initialize audio on first user interaction
    const handleUserInteraction = () => {
      console.log("User interaction detected, initializing audio...");
      initAudio(); // Call your audio initialization function
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    // Load or generate host game code
    const savedGameCode = localStorage.getItem('generalXiangHostCode');
    if (savedGameCode) {
      setGeneratedGameCode(savedGameCode);
    } else {
      const newCode = generateRandomCode();
      setGeneratedGameCode(newCode);
      localStorage.setItem('generalXiangHostCode', newCode);
    }

    // Cleanup listeners
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Game Logic Handlers ---

  const handleCellClick = useCallback((visualRow: number, visualCol: number) => {
    if (gameState.gameStatus !== GameStatus.IN_PROGRESS) {
      console.log("Game not in progress, ignoring click.");
      return;
    }

    const logicalCol = mapVisualToLogical(visualCol);
    const { board, currentTurn } = gameState;
    const { selectedPiece, validMoves } = board;
    const targetPosition: [number, number] = [visualRow, logicalCol];

    const pieceAtTarget = board.pieces.find(p => p.position[0] === targetPosition[0] && p.position[1] === targetPosition[1]);

    if (selectedPiece) {
      const isValidMoveTarget = validMoves.some(([r, c]) => r === targetPosition[0] && c === targetPosition[1]);

      if (isValidMoveTarget) {
        // Make the move
        console.log(`Attempting move: ${selectedPiece.symbol} from ${selectedPiece.position} to ${targetPosition}`);
        const newGameState = makeMove(gameState, selectedPiece, targetPosition[0], targetPosition[1]);
        setGameState(newGameState);

        // Play sounds based on move result
        if (pieceAtTarget) Feedback.pieceCapture(); else Feedback.pieceMove();
        if (newGameState.check) setTimeout(() => Feedback.check(), 200); // Delay check sound slightly
        if (newGameState.gameStatus !== GameStatus.IN_PROGRESS) setTimeout(() => Feedback.gameEnd(), 400); // Delay end sound

      } else if (pieceAtTarget && pieceAtTarget.side === currentTurn) {
        // Clicked on another piece of the current player - select it
        console.log(`Switching selection to: ${pieceAtTarget.symbol} at ${targetPosition}`);
        const newGameState = selectPiece(gameState, targetPosition[0], targetPosition[1]);
        setGameState(newGameState);
        Feedback.pieceSelect();
      } else {
        // Clicked on empty square or opponent piece (not a valid move) - deselect
        console.log(`Deselecting piece: ${selectedPiece.symbol}`);
        const newGameState = deselectPiece(gameState);
        setGameState(newGameState);
        Feedback.toggle(); // Use a neutral sound for deselection
      }
    } else {
      // No piece selected - try to select the piece at the clicked cell
      if (pieceAtTarget && pieceAtTarget.side === currentTurn) {
        console.log(`Selecting piece: ${pieceAtTarget.symbol} at ${targetPosition}`);
        const newGameState = selectPiece(gameState, targetPosition[0], targetPosition[1]);
        setGameState(newGameState);
        Feedback.pieceSelect();
      } else {
        // Clicked on empty square or opponent piece when nothing selected
        console.log("Invalid selection attempt.");
        Feedback.invalidMove();
      }
    }
  }, [gameState, setGameState]); // Dependencies for the click handler

  // --- UI Action Handlers ---

  const handleNewGameRequest = () => {
    Feedback.buttonClick();
    if (gameState.moveHistory.length > 0 && gameState.gameStatus !== GameStatus.NOT_STARTED) {
      setShowNewGameDialog(true); // Show confirmation if game is in progress
    } else {
      setShowPlayerNameDialog(true); // Directly ask for names if no game started
    }
  };

  const confirmAndStartNewGame = () => {
    setShowNewGameDialog(false);
    setShowPlayerNameDialog(true); // Proceed to player name entry
  };

  const startNewGameWithNames = () => {
    console.log(`Starting new game with Red: ${redPlayerName}, Blue: ${blackPlayerName}`);
    const newGameState = startGame(initializeGameState()); // Start fresh
    setGameState(newGameState);
    setShowPlayerNameDialog(false);

    localStorage.setItem('redPlayerName', redPlayerName);
    localStorage.setItem('blackPlayerName', blackPlayerName);

    Feedback.gameStart();
    toast({
      title: "New Game Started",
      description: `${redPlayerName} (Red) vs ${blackPlayerName} (Blue)`,
      duration: 3000,
    });
  };

  const handleUndo = () => {
    if (gameState.moveHistory.length > 0) {
      console.log("Undoing last move");
      const newGameState = undoMove(gameState);
      setGameState(newGameState);
      Feedback.buttonClick(); // Or a specific undo sound
    } else {
      console.log("No moves to undo");
      Feedback.error(); // Indicate nothing to undo
    }
  };

  const handleSaveGameRequest = () => {
    Feedback.buttonClick();
    if (gameState.moveHistory.length > 0) {
      try {
        const gameData = JSON.stringify(gameState, null, 2); // Pretty print JSON
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `xiangqi-game-${timestamp}.json`;
        const blob = new Blob([gameData], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Game saved as ${filename}`);
        toast({ title: "Game Saved", description: `Saved as ${filename}`, duration: 3000 });
      } catch (error) {
        console.error("Failed to save game:", error);
        toast({ title: "Save Failed", description: "Could not save the game.", variant: "destructive", duration: 3000 });
        Feedback.error();
      }
    } else {
      setShowSaveGameDialog(true); // Show dialog if nothing to save
    }
  };

  const toggleTheme = () => {
    Feedback.toggle();
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
    console.log(`Theme switched to ${newTheme ? 'dark' : 'light'}`);
  };

  const openSoundSettings = () => {
    Feedback.dialogOpen();
    setShowSoundSettingsDialog(true);
  }

  // --- Multiplayer Action Handlers ---

  const generateRandomCode = () => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars (I, O, 0, 1)
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += validChars.charAt(Math.floor(Math.random() * validChars.length));
    }
    return result;
  };

  const handleJoinGameRequest = async () => {
    Feedback.dialogOpen();
    setShowJoinGameDialog(true);
    setPasteSuccess(false); // Reset paste status
    // Try to read clipboard automatically
    try {
      const text = await navigator.clipboard.readText();
      const trimmedText = text.trim();
      if (trimmedText.length === 6 && /^[A-Z2-9]{6}$/.test(trimmedText)) { // Basic validation
        setGameCode(trimmedText);
        setPasteSuccess(true); // Indicate auto-paste
        Feedback.paste();
        toast({ title: "Code Pasted", description: "Game code from clipboard auto-filled.", duration: 2000 });
        setTimeout(() => setPasteSuccess(false), 2500); // Reset visual cue
      }
    } catch (err) {
      console.warn('Clipboard read access denied or failed:', err);
      // Fail silently - user can still paste manually
    }
  };

  const handleHostGameRequest = () => {
    Feedback.dialogOpen();
    // Ensure a code exists if somehow cleared
    if (!generatedGameCode) {
        const newCode = generateRandomCode();
        setGeneratedGameCode(newCode);
        localStorage.setItem('generalXiangHostCode', newCode);
    }
    setShowHostGameDialog(true);
    setCopySuccess(false); // Reset copy status
  };

  const generateNewHostCode = () => {
    Feedback.buttonClick();
    const randomCode = generateRandomCode();
    setGeneratedGameCode(randomCode);
    localStorage.setItem('generalXiangHostCode', randomCode);
    setShowNewCodeConfirmation(false); // Close confirmation dialog
    setCopySuccess(false); // Reset copy status for the new code
    console.log(`Generated new host code: ${randomCode}`);
    toast({ title: "New Code Generated", description: `New host code is ${randomCode}`, duration: 3000 });
  };

  const copyHostCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedGameCode);
      setCopySuccess(true);
      Feedback.copy();
      toast({ title: "Copied!", description: "Host code copied to clipboard.", duration: 2000 });
      setTimeout(() => setCopySuccess(false), 2500); // Reset visual cue
    } catch (err) {
      console.error('Failed to copy host code: ', err);
      Feedback.error();
      toast({ title: "Copy Failed", description: "Could not copy code.", variant: "destructive", duration: 3000 });
    }
  };

  const pasteCodeFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmedText = text.trim();
      setGameCode(trimmedText); // Update input field
      setPasteSuccess(true);
      Feedback.paste();
      toast({ title: "Pasted!", description: "Code pasted from clipboard.", duration: 2000 });
      setTimeout(() => setPasteSuccess(false), 2500);
      // Optional: Auto-submit if valid?
      // if (trimmedText.length === 6 && /^[A-Z2-9]{6}$/.test(trimmedText)) {
      //   confirmJoinGame(trimmedText);
      // }
    } catch (err) {
      console.error('Failed to paste code: ', err);
      Feedback.error();
      toast({ title: "Paste Failed", description: "Could not read clipboard.", variant: "destructive", duration: 3000 });
    }
  };

  const confirmJoinGame = (codeToJoin: string) => {
    // TODO: Implement actual Jami/multiplayer connection logic here
    console.log(`Attempting to join game with code: ${codeToJoin}`);
    Feedback.buttonClick();
    toast({ title: "Joining Game...", description: `Connecting with code ${codeToJoin}...`, duration: 3000 });
    // Close dialog after attempting connection (or on success)
    setShowJoinGameDialog(false);
    setGameCode(''); // Clear input after use
  };

  const confirmHostGame = () => {
    // TODO: Implement actual Jami/multiplayer hosting logic here
    console.log(`Attempting to host game with code: ${generatedGameCode}`);
    Feedback.buttonClick();
    toast({ title: "Hosting Game...", description: `Waiting for opponent with code ${generatedGameCode}...`, duration: 3000 });
    // Close dialog after starting host process
    setShowHostGameDialog(false);
  };


  // --- Rendering Functions ---

  const renderPiece = (piece: Piece | undefined, visualRow: number, visualCol: number) => {
    if (!piece) return null;

    const logicalCol = mapVisualToLogical(visualCol);
    const isRedPiece = piece.side === PlayerSide.RED;
    const pieceColor = isRedPiece ? 'hsl(5, 100%, 27.3%)' : 'hsl(215, 100%, 35%)'; // Deep Red and Strong Blue
    const pieceColorDark = isRedPiece ? 'hsl(5, 100%, 70%)' : 'hsl(215, 100%, 75%)'; // Lighter for dark mode

    const isSelected = gameState.board.selectedPiece?.position[0] === piece.position[0] &&
                       gameState.board.selectedPiece?.position[1] === piece.position[1];

    const chipStyle: React.CSSProperties = {
      width: '38px', // Slightly larger than grid lines
      height: '38px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: '50%', // Center vertically in the cell div
      left: '50%', // Center horizontally in the cell div
      transform: 'translate(-50%, -50%)', // Precise centering on intersection
      cursor: gameState.currentTurn === piece.side ? 'pointer' : 'default',
      transition: 'all 0.2s ease-out',
      zIndex: 10, // Pieces above lines and indicators
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
            e.stopPropagation(); // Prevent click from bubbling to the cell div
            handleCellClick(visualRow, visualCol);
        }}
        role="button"
        aria-label={`Piece ${piece.symbol} at ${visualRow}, ${visualCol}`}
      >
        <span style={textStyle}>{piece.symbol}</span>
      </div>
    );
  };

  const renderBoardGrid = () => {
    const gridElements = [];
    const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.7)';
    const riverColor = isDarkMode ? 'hsl(146, 100%, 60%)' : 'hsl(146, 100%, 32.7%)'; // Jade Green

    for (let r = 0; r < VISUAL_INTERSECTION_ROWS; r++) {
      for (let c = 0; c < VISUAL_INTERSECTION_COLUMNS; c++) {
        const logicalCol = mapVisualToLogical(c);
        const isRiverBoundary = r === 4; // Line below row 4 is the top of the river

        const piece = gameState.board.pieces.find(p => p.position[0] === r && p.position[1] === logicalCol);
        const isValidMoveTarget = gameState.board.validMoves.some(([vr, vc]) => vr === r && vc === logicalCol);

        gridElements.push(
          <div
            key={`cell-${r}-${c}`}
            className="absolute" // Position cells absolutely within the relative container
            style={{
              top: `${r * CELL_SIZE}px`,
              left: `${c * CELL_SIZE}px`,
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              // Draw lines originating from this cell's top-left corner
              borderRight: c < VISUAL_INTERSECTION_COLUMNS - 1 ? `1px solid ${lineColor}` : undefined,
              borderBottom: r < VISUAL_INTERSECTION_ROWS - 1 ? `1px solid ${isRiverBoundary ? riverColor : lineColor}` : undefined,
              borderBottomWidth: isRiverBoundary ? '2px' : '1px', // Thicker river line
              boxSizing: 'border-box',
              cursor: isValidMoveTarget ? 'pointer' : 'default',
              zIndex: 1, // Ensure lines are below pieces and indicators
            }}
            onClick={() => handleCellClick(r, c)}
            role="gridcell"
            aria-label={`Board position ${r}, ${c}`}
          >
            {/* Render piece centered within this cell's area */}
            {renderPiece(piece, r, c)}

            {/* Valid Move Indicator (Dot) */}
            {isValidMoveTarget && !piece && ( // Show dot only on empty valid squares
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
                pointerEvents: 'none', // Don't interfere with clicks
                zIndex: 5, // Above lines, below pieces
              }} />
            )}

             {/* Capture Move Indicator (Circle around opponent piece) */}
            {isValidMoveTarget && piece && piece.side !== gameState.currentTurn && (
                 <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '42px', // Slightly larger than piece
                    height: '42px',
                    borderRadius: '50%',
                    border: `3px dashed ${isDarkMode ? 'rgba(255, 0, 0, 0.8)' : 'rgba(180, 0, 0, 0.8)'}`, // Dashed red circle
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 11, // Above the piece being captured
                 }} />
            )}

            {/* Soldier/Cannon Position Markers (Small Crosses) */}
            {((r === 3 || r === 6) && (c === 0 || c === 2 || c === 4 || c === 6)) ||
             ((r === 2 || r === 7) && (c === 1 || c === 7)) ? (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '10px', height: '10px',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 0, // Below everything else
                    pointerEvents: 'none',
                }}>
                    {/* Horizontal parts */}
                    {(c > 0 && c < VISUAL_INTERSECTION_COLUMNS -1) && <>
                        <div style={{ position: 'absolute', top: '4.5px', left: '-5px', width: '5px', height: '1px', backgroundColor: lineColor }}></div>
                        <div style={{ position: 'absolute', top: '4.5px', right: '-5px', width: '5px', height: '1px', backgroundColor: lineColor }}></div>
                    </>}
                    {/* Vertical parts */}
                     {(r > 0 && r < VISUAL_INTERSECTION_ROWS -1) && <>
                        <div style={{ position: 'absolute', left: '4.5px', top: '-5px', height: '5px', width: '1px', backgroundColor: lineColor }}></div>
                        <div style={{ position: 'absolute', left: '4.5px', bottom: '-5px', height: '5px', width: '1px', backgroundColor: lineColor }}></div>
                     </>}
                </div>
            ) : null}
          </div>
        );
      }
    }
    return gridElements;
  };

  const getGameStatusMessage = () => {
    switch (gameState.gameStatus) {
      case GameStatus.NOT_STARTED: return "Enter player names to start";
      case GameStatus.IN_PROGRESS:
        const turnPlayerName = gameState.currentTurn === PlayerSide.RED ? redPlayerName : blackPlayerName;
        const opponentPlayerName = gameState.currentTurn === PlayerSide.RED ? blackPlayerName : redPlayerName;
        if (gameState.check) {
          return `${opponentPlayerName} is in Check! ${turnPlayerName}'s turn.`;
        }
        return `${turnPlayerName}'s Turn`;
      case GameStatus.RED_WON: return `Checkmate! ${redPlayerName} (Red) Wins!`;
      case GameStatus.BLACK_WON: return `Checkmate! ${blackPlayerName} (Blue) Wins!`;
      case GameStatus.DRAW: return "Game Over: Draw";
      default: return "";
    }
  };

  // --- JSX ---
  return (
    <div className="flex flex-col gap-4 p-2 sm:p-4 max-w-3xl mx-auto">
      {/* Player Info & Status Bar */}
      <div className="flex flex-col gap-2 sm:gap-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Red Player Card */}
          <div className={`p-2 sm:p-3 rounded-lg border-2 ${gameState.currentTurn === PlayerSide.RED ? 'border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-950 shadow-md' : 'border-gray-300 dark:border-gray-700'}`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-700 dark:bg-red-500 border border-black/20"></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold truncate text-gray-900 dark:text-gray-100">{redPlayerName}</h3>
                <p className="text-xs text-muted-foreground">Red Side</p>
              </div>
              {gameState.currentTurn === PlayerSide.RED && gameState.gameStatus === GameStatus.IN_PROGRESS && (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" title="Current Turn"></div>
              )}
            </div>
          </div>
          {/* Blue Player Card */}
          <div className={`p-2 sm:p-3 rounded-lg border-2 ${gameState.currentTurn === PlayerSide.BLACK ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 shadow-md' : 'border-gray-300 dark:border-gray-700'}`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-700 dark:bg-blue-500 border border-black/20"></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold truncate text-gray-900 dark:text-gray-100">{blackPlayerName}</h3>
                <p className="text-xs text-muted-foreground">Blue Side</p>
              </div>
              {gameState.currentTurn === PlayerSide.BLACK && gameState.gameStatus === GameStatus.IN_PROGRESS && (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" title="Current Turn"></div>
              )}
            </div>
          </div>
        </div>

        {/* Status Message & Controls */}
        <div className="flex flex-wrap justify-between items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
           <div className={`text-base sm:text-lg font-semibold flex-grow ${gameState.check ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
             {getGameStatusMessage()}
           </div>
           <div className="flex items-center gap-2 flex-shrink-0">
             <Button size="icon" variant="outline" onClick={handleUndo} disabled={gameState.moveHistory.length === 0 || gameState.gameStatus !== GameStatus.IN_PROGRESS} title="Undo Move"> <Undo className="h-4 w-4" /> </Button>
             <Button size="icon" variant="outline" onClick={toggleTheme} title={isDarkMode ? "Light Mode" : "Dark Mode"}> {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} </Button>
             <Button size="icon" variant="outline" onClick={openSoundSettings} title="Sound Settings"> <Volume2 className="h-4 w-4" /> </Button>
             {/* Add New Game/Save/Load/Multiplayer buttons here if they belong in this bar */}
             <Button size="icon" variant="outline" onClick={handleNewGameRequest} title="New Game"><RotateCcw className="h-4 w-4" /></Button>
             <Button size="icon" variant="outline" onClick={handleSaveGameRequest} title="Save Game" disabled={gameState.moveHistory.length === 0}><Save className="h-4 w-4" /></Button>
             {/* Consider adding Load Game button */}
             {/* Multiplayer buttons could go here or in a separate menu */}
             {/* <Button size="icon" variant="outline" onClick={handleHostGameRequest} title="Host Game"><Users className="h-4 w-4" /></Button> */}
             {/* <Button size="icon" variant="outline" onClick={handleJoinGameRequest} title="Join Game"><UserPlus className="h-4 w-4" /></Button> */}
           </div>
         </div>
      </div>

      {/* Board Area */}
      <div className="relative w-full aspect-square max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vh-15rem)] mx-auto">
        <div
          className="board-background rounded-md overflow-hidden shadow-lg"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            padding: `${CELL_SIZE / 2}px`, // Padding around the grid
            backgroundColor: isDarkMode ? 'hsl(36, 30%, 20%)' : 'hsl(36, 70%, 85%)', // Wooden background
            border: `2px solid ${isDarkMode ? 'hsl(36, 30%, 40%)' : 'hsl(36, 30%, 60%)'}`,
          }}
        >
          {/* Container for the grid lines and pieces */}
          <div className="relative" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, margin: '0 auto' }}>
            {/* Render Grid Lines and Cells */}
            {renderBoardGrid()}

            {/* River Text */}
            <div className="absolute flex justify-between items-center pointer-events-none" style={{
              top: `${4.5 * CELL_SIZE}px`, // Center between rows 4 and 5
              left: `${-CELL_SIZE / 4}px`, // Adjust horizontal position
              width: `calc(${BOARD_WIDTH}px + ${CELL_SIZE / 2}px)`, // Span across the board + padding
              transform: 'translateY(-50%)', // Vertically center text
              zIndex: 3,
            }}>
              <span className="text-xl sm:text-2xl font-bold font-['KaiTi',_'STKaiti',_serif]" style={{
                color: isDarkMode ? 'hsl(146, 100%, 70%)' : 'hsl(146, 100%, 25%)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                transform: 'rotate(180deg)', // Rotate Red side's river text
                writingMode: 'vertical-rl', // Optional: Vertical text
              }}>楚 河</span>
              <span className="text-xl sm:text-2xl font-bold font-['KaiTi',_'STKaiti',_serif]" style={{
                color: isDarkMode ? 'hsl(146, 100%, 70%)' : 'hsl(146, 100%, 25%)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                 writingMode: 'vertical-rl', // Optional: Vertical text
              }}>漢 界</span>
            </div>

            {/* Palace Markings */}
            <PalatialAnchors isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>


      {/* Move History (Optional Display) */}
      {gameState.moveHistory.length > 0 && (
        <div className="mt-2 sm:mt-4">
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-800 dark:text-gray-200">Move History</h3>
          <div className="max-h-32 sm:max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-900">
            {gameState.moveHistory.map((move, index) => (
              <div key={index} className="text-xs sm:text-sm py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-gray-700 dark:text-gray-300">
                {index + 1}. {move.notation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Dialogs --- */}

      {/* New Game Confirmation */}
      <AlertDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the current game. Unsaved progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => Feedback.dialogClose()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndStartNewGame}>Start New</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Player Name Entry */}
      <AlertDialog open={showPlayerNameDialog} onOpenChange={setShowPlayerNameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Player Names</AlertDialogTitle>
            <AlertDialogDescription>Set names for the Red and Blue players.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            {/* Red Player Input */}
            <div className="space-y-1">
              <label htmlFor="redPlayerName" className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-4 h-4 rounded-full bg-red-700 dark:bg-red-500 border border-black/20"></div> Red Player
              </label>
              <Input id="redPlayerName" placeholder="Enter Red's name" value={redPlayerName} onChange={(e) => setRedPlayerName(e.target.value)} />
            </div>
            {/* Blue Player Input */}
            <div className="space-y-1">
              <label htmlFor="blackPlayerName" className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-4 h-4 rounded-full bg-blue-700 dark:bg-blue-500 border border-black/20"></div> Blue Player
              </label>
              <Input id="blackPlayerName" placeholder="Enter Blue's name" value={blackPlayerName} onChange={(e) => setBlackPlayerName(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
                // If cancelling name entry on first load, maybe set default names?
                if (gameState.gameStatus === GameStatus.NOT_STARTED) {
                    setRedPlayerName('Red Player');
                    setBlackPlayerName('Blue Player');
                    // Optionally start game with defaults, or just close dialog
                }
                setShowPlayerNameDialog(false);
                Feedback.dialogClose();
             }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startNewGameWithNames} disabled={!redPlayerName.trim() || !blackPlayerName.trim()}>
              Start Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Nothing to Save Info */}
      <AlertDialog open={showSaveGameDialog} onOpenChange={setShowSaveGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nothing to Save</AlertDialogTitle>
            <AlertDialogDescription>Make at least one move before saving the game.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {setShowSaveGameDialog(false); Feedback.dialogClose();}}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sound Settings */}
       <AlertDialog open={showSoundSettingsDialog} onOpenChange={setShowSoundSettingsDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Sound Settings</AlertDialogTitle>
             <AlertDialogDescription>Adjust volume and enable/disable sounds.</AlertDialogDescription>
           </AlertDialogHeader>
           <div className="py-4">
             {/* Ensure SoundSettings component is imported and works */}
             <SoundSettings className="w-full" />
           </div>
           <AlertDialogFooter>
             <AlertDialogAction onClick={() => { setShowSoundSettingsDialog(false); Feedback.dialogClose(); }}>Done</AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      {/* --- Multiplayer Dialogs (Placeholders) --- */}

      {/* Join Game */}
      <AlertDialog open={showJoinGameDialog} onOpenChange={setShowJoinGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Multiplayer Game</AlertDialogTitle>
            <AlertDialogDescription>Enter the 6-character code from the host.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="ABCDEF"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase().trim())}
                maxLength={6}
                className="flex-1 tracking-widest font-mono text-lg"
              />
              <Button variant="outline" onClick={pasteCodeFromClipboard} title="Paste Code">
                {pasteSuccess ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">Codes are 6 characters, letters (A-Z) and numbers (2-9).</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => Feedback.dialogClose()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmJoinGame(gameCode)} disabled={gameCode.length !== 6}>
              Join Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Host Game */}
      <AlertDialog open={showHostGameDialog} onOpenChange={setShowHostGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Host Multiplayer Game</AlertDialogTitle>
            <AlertDialogDescription>Share this code with your opponent.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center bg-muted p-4 rounded-md">
              <div className="text-3xl font-bold tracking-widest font-mono text-primary">
                {generatedGameCode || '...'}
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={copyHostCodeToClipboard} title="Copy Code">
                {copySuccess ? <><Check className="h-4 w-4 mr-1 text-green-500" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
              </Button>
              <Button variant="outline" onClick={() => setShowNewCodeConfirmation(true)} title="Generate New Code">
                <RefreshCw className="h-4 w-4 mr-1" /> New Code
              </Button>
            </div>
             <p className="text-xs text-muted-foreground text-center">Your opponent enters this code to join.</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => Feedback.dialogClose()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHostGame}>Start Hosting</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm New Host Code */}
      <AlertDialog open={showNewCodeConfirmation} onOpenChange={setShowNewCodeConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Host Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates a new code. Anyone using the old code ({generatedGameCode}) cannot join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => Feedback.dialogClose()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateNewHostCode}>Generate New</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default InteractiveBoard;