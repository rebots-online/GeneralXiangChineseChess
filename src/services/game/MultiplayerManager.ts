/**
 * MultiplayerManager
 * 
 * This service manages multiplayer game sessions, handling player connections,
 * game state synchronization, and turn management.
 */

import JamiTransportController from '../jami/JamiTransportController';
import GameStateTransport, { GameAction, GameActionType } from './GameStateTransport';
import { GameState, GameStatus, initializeGameState, makeMove, startGame } from '../../game/gameState';
import { Piece, PlayerSide } from '../../game/pieces';

// Player information
export interface Player {
  id: string;
  name: string;
  side: PlayerSide;
  isLocal: boolean;
  isConnected: boolean;
}

// Game session information
export interface GameSession {
  id: string;
  players: Player[];
  gameState: GameState;
  localPlayerId: string;
  isHost: boolean;
  status: 'waiting' | 'playing' | 'ended';
}

// Event handler type
export type EventHandler<T = any> = (data: T) => void;

/**
 * MultiplayerManager class
 */
export class MultiplayerManager {
  private static instance: MultiplayerManager;
  private jamiTransport: JamiTransportController;
  private gameTransport: GameStateTransport | null = null;
  private gameSession: GameSession | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private localPlayerName: string = 'Player';
  private localPlayerId: string = '';
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.jamiTransport = JamiTransportController.getInstance();
  }
  
  /**
   * Get the singleton instance of MultiplayerManager
   */
  public static getInstance(): MultiplayerManager {
    if (!MultiplayerManager.instance) {
      MultiplayerManager.instance = new MultiplayerManager();
    }
    return MultiplayerManager.instance;
  }
  
  /**
   * Initialize the multiplayer manager
   * @param playerName The local player's name
   * @returns Promise resolving to true if initialization was successful
   */
  public async initialize(playerName: string): Promise<boolean> {
    try {
      // Initialize the Jami transport
      const success = await this.jamiTransport.initialize();
      
      if (success) {
        // Set local player information
        this.localPlayerName = playerName;
        this.localPlayerId = this.jamiTransport.getUserId();
        
        console.log('MultiplayerManager initialized successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to initialize MultiplayerManager:', error);
      return false;
    }
  }
  
  /**
   * Create a new game session
   * @param side The side the local player will play
   * @returns Promise resolving to the game session
   */
  public async createGameSession(side: PlayerSide): Promise<GameSession> {
    try {
      // Create a new game session
      const sessionId = await this.jamiTransport.createGameSession();
      
      // Create the game transport
      this.gameTransport = new GameStateTransport(sessionId, this.localPlayerId);
      
      // Create the local player
      const localPlayer: Player = {
        id: this.localPlayerId,
        name: this.localPlayerName,
        side,
        isLocal: true,
        isConnected: true
      };
      
      // Create the game session
      this.gameSession = {
        id: sessionId,
        players: [localPlayer],
        gameState: initializeGameState(),
        localPlayerId: this.localPlayerId,
        isHost: true,
        status: 'waiting'
      };
      
      // Set up game action handler
      this.gameTransport.onGameAction(this.handleGameAction);
      
      // Set up chat message handler
      this.gameTransport.onChatMessage(this.handleChatMessage);
      
      // Send player join action
      this.gameTransport.sendPlayerJoin(this.localPlayerName, side);
      
      // Emit game session created event
      this.emitEvent('gameSessionCreated', this.gameSession);
      
      return this.gameSession;
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  }
  
  /**
   * Join an existing game session
   * @param sessionId The ID of the game session to join
   * @returns Promise resolving to the game session
   */
  public async joinGameSession(sessionId: string): Promise<GameSession> {
    try {
      // Create the game transport
      this.gameTransport = new GameStateTransport(sessionId, this.localPlayerId);
      
      // Determine which side is available
      // For now, just pick the opposite of the host's side
      // In a real implementation, we would query the host for available sides
      const hostSide = PlayerSide.RED; // Assume host is RED for now
      const localPlayerSide = hostSide === PlayerSide.RED ? PlayerSide.BLACK : PlayerSide.RED;
      
      // Create the local player
      const localPlayer: Player = {
        id: this.localPlayerId,
        name: this.localPlayerName,
        side: localPlayerSide,
        isLocal: true,
        isConnected: true
      };
      
      // Create the game session
      this.gameSession = {
        id: sessionId,
        players: [localPlayer], // Will be updated when we receive player info from host
        gameState: initializeGameState(), // Will be updated when we receive game state from host
        localPlayerId: this.localPlayerId,
        isHost: false,
        status: 'waiting'
      };
      
      // Set up game action handler
      this.gameTransport.onGameAction(this.handleGameAction);
      
      // Set up chat message handler
      this.gameTransport.onChatMessage(this.handleChatMessage);
      
      // Send player join action
      this.gameTransport.sendPlayerJoin(this.localPlayerName, localPlayerSide);
      
      // Emit game session joined event
      this.emitEvent('gameSessionJoined', this.gameSession);
      
      return this.gameSession;
    } catch (error) {
      console.error('Failed to join game session:', error);
      throw error;
    }
  }
  
  /**
   * Leave the current game session
   * @returns Promise resolving to true if the session was left successfully
   */
  public async leaveGameSession(): Promise<boolean> {
    if (!this.gameSession || !this.gameTransport) {
      return false;
    }
    
    try {
      // Send player leave action
      this.gameTransport.sendPlayerLeave();
      
      // Leave the game session
      await this.jamiTransport.leaveGameSession(this.gameSession.id);
      
      // Clean up
      this.gameSession = null;
      this.gameTransport = null;
      
      // Emit game session left event
      this.emitEvent('gameSessionLeft', null);
      
      return true;
    } catch (error) {
      console.error('Failed to leave game session:', error);
      return false;
    }
  }
  
  /**
   * Start the game
   * @returns True if the game was started successfully
   */
  public startGame(): boolean {
    if (!this.gameSession || !this.gameTransport || !this.gameSession.isHost) {
      return false;
    }
    
    // Check if we have enough players
    if (this.gameSession.players.length < 2) {
      return false;
    }
    
    // Start the game
    const newGameState = startGame(this.gameSession.gameState);
    
    // Update the game session
    this.gameSession.gameState = newGameState;
    this.gameSession.status = 'playing';
    
    // Send game start action
    this.gameTransport.sendGameStart(newGameState);
    
    // Emit game started event
    this.emitEvent('gameStarted', this.gameSession);
    
    return true;
  }
  
  /**
   * Make a move
   * @param piece The piece to move
   * @param targetRow The target row
   * @param targetCol The target column
   * @returns True if the move was made successfully
   */
  public makeMove(piece: Piece, targetRow: number, targetCol: number): boolean {
    if (!this.gameSession || !this.gameTransport) {
      return false;
    }
    
    // Check if it's the local player's turn
    const localPlayer = this.gameSession.players.find(p => p.id === this.localPlayerId);
    if (!localPlayer || localPlayer.side !== this.gameSession.gameState.currentTurn) {
      return false;
    }
    
    // Check if the piece belongs to the local player
    if (piece.side !== localPlayer.side) {
      return false;
    }
    
    // Get the current position
    const [currentRow, currentCol] = piece.position;
    
    // Make the move
    const newGameState = makeMove(this.gameSession.gameState, piece, targetRow, targetCol);
    
    // Check if the move was valid
    if (newGameState === this.gameSession.gameState) {
      return false;
    }
    
    // Find the captured piece, if any
    const capturedPiece = this.gameSession.gameState.board.pieces.find(p => 
      p.position[0] === targetRow && p.position[1] === targetCol
    ) || null;
    
    // Update the game session
    this.gameSession.gameState = newGameState;
    
    // Check if the game has ended
    if (newGameState.gameStatus !== GameStatus.IN_PROGRESS) {
      this.gameSession.status = 'ended';
    }
    
    // Send piece move action
    this.gameTransport.sendPieceMove(
      piece,
      [currentRow, currentCol],
      [targetRow, targetCol],
      capturedPiece
    );
    
    // If the game has ended, send game end action
    if (newGameState.gameStatus !== GameStatus.IN_PROGRESS) {
      let winner: PlayerSide | null = null;
      
      if (newGameState.gameStatus === GameStatus.RED_WON) {
        winner = PlayerSide.RED;
      } else if (newGameState.gameStatus === GameStatus.BLACK_WON) {
        winner = PlayerSide.BLACK;
      }
      
      this.gameTransport.sendGameEnd(winner);
    }
    
    // Emit move made event
    this.emitEvent('moveMade', {
      piece,
      from: [currentRow, currentCol],
      to: [targetRow, targetCol],
      capturedPiece
    });
    
    // If the game has ended, emit game ended event
    if (newGameState.gameStatus !== GameStatus.IN_PROGRESS) {
      this.emitEvent('gameEnded', {
        winner: newGameState.gameStatus === GameStatus.RED_WON ? PlayerSide.RED :
                newGameState.gameStatus === GameStatus.BLACK_WON ? PlayerSide.BLACK : null
      });
    }
    
    return true;
  }
  
  /**
   * Send a chat message
   * @param message The message to send
   * @returns True if the message was sent successfully
   */
  public sendChatMessage(message: string): boolean {
    if (!this.gameTransport) {
      return false;
    }
    
    // Send the message
    this.gameTransport.sendChatMessage(message);
    
    return true;
  }
  
  /**
   * Handle a game action
   * @param action The game action
   */
  private handleGameAction = (action: GameAction): void => {
    if (!this.gameSession) {
      return;
    }
    
    switch (action.type) {
      case GameActionType.GAME_START:
        this.handleGameStart(action);
        break;
      case GameActionType.PIECE_MOVE:
        this.handlePieceMove(action);
        break;
      case GameActionType.GAME_END:
        this.handleGameEnd(action);
        break;
      case GameActionType.PLAYER_JOIN:
        this.handlePlayerJoin(action);
        break;
      case GameActionType.PLAYER_LEAVE:
        this.handlePlayerLeave(action);
        break;
    }
  };
  
  /**
   * Handle a game start action
   * @param action The game action
   */
  private handleGameStart(action: GameAction): void {
    if (!this.gameSession || this.gameSession.isHost) {
      return;
    }
    
    // Update the game state
    this.gameSession.gameState = action.data;
    this.gameSession.status = 'playing';
    
    // Emit game started event
    this.emitEvent('gameStarted', this.gameSession);
  }
  
  /**
   * Handle a piece move action
   * @param action The game action
   */
  private handlePieceMove(action: GameAction): void {
    if (!this.gameSession) {
      return;
    }
    
    // Check if the move was made by the local player
    if (action.playerId === this.localPlayerId) {
      return;
    }
    
    const { piece, from, to, capturedPiece } = action.data;
    
    // Update the game state
    // In a real implementation, we would apply the move to the game state
    // For now, we'll just emit the move made event
    
    // Emit move made event
    this.emitEvent('moveMade', {
      piece,
      from,
      to,
      capturedPiece
    });
  }
  
  /**
   * Handle a game end action
   * @param action The game action
   */
  private handleGameEnd(action: GameAction): void {
    if (!this.gameSession) {
      return;
    }
    
    // Update the game session
    this.gameSession.status = 'ended';
    
    // Emit game ended event
    this.emitEvent('gameEnded', {
      winner: action.data.winner
    });
  }
  
  /**
   * Handle a player join action
   * @param action The game action
   */
  private handlePlayerJoin(action: GameAction): void {
    if (!this.gameSession) {
      return;
    }
    
    const { playerName, side } = action.data;
    
    // Check if the player is already in the game
    const existingPlayerIndex = this.gameSession.players.findIndex(p => p.id === action.playerId);
    
    if (existingPlayerIndex !== -1) {
      // Update the existing player
      this.gameSession.players[existingPlayerIndex] = {
        ...this.gameSession.players[existingPlayerIndex],
        name: playerName,
        side,
        isConnected: true
      };
    } else {
      // Add the new player
      this.gameSession.players.push({
        id: action.playerId,
        name: playerName,
        side,
        isLocal: false,
        isConnected: true
      });
    }
    
    // Emit player joined event
    this.emitEvent('playerJoined', {
      playerId: action.playerId,
      playerName,
      side
    });
  }
  
  /**
   * Handle a player leave action
   * @param action The game action
   */
  private handlePlayerLeave(action: GameAction): void {
    if (!this.gameSession) {
      return;
    }
    
    // Find the player
    const playerIndex = this.gameSession.players.findIndex(p => p.id === action.playerId);
    
    if (playerIndex !== -1) {
      // Remove the player
      const player = this.gameSession.players[playerIndex];
      this.gameSession.players.splice(playerIndex, 1);
      
      // Emit player left event
      this.emitEvent('playerLeft', {
        playerId: action.playerId,
        playerName: player.name
      });
    }
  }
  
  /**
   * Handle a chat message
   * @param message The message
   * @param sender The sender ID
   */
  private handleChatMessage = (message: string, sender: string): void => {
    if (!this.gameSession) {
      return;
    }
    
    // Find the sender
    const senderPlayer = this.gameSession.players.find(p => p.id === sender);
    
    // Emit chat message event
    this.emitEvent('chatMessage', {
      message,
      senderId: sender,
      senderName: senderPlayer ? senderPlayer.name : 'Unknown'
    });
  };
  
  /**
   * Register an event handler
   * @param eventType The event type
   * @param handler The handler function
   */
  public on<T = any>(eventType: string, handler: EventHandler<T>): void {
    // Get or create the handlers set for this event type
    let handlers = this.eventHandlers.get(eventType);
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(eventType, handlers);
    }
    
    // Add the handler
    handlers.add(handler as EventHandler);
  }
  
  /**
   * Unregister an event handler
   * @param eventType The event type
   * @param handler The handler function
   */
  public off<T = any>(eventType: string, handler: EventHandler<T>): void {
    // Get the handlers set for this event type
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      // Remove the handler
      handlers.delete(handler as EventHandler);
    }
  }
  
  /**
   * Emit an event
   * @param eventType The event type
   * @param data The event data
   */
  private emitEvent<T = any>(eventType: string, data: T): void {
    // Get the handlers for this event type
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      // Notify all handlers
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${eventType} handler:`, error);
        }
      });
    }
  }
  
  /**
   * Get the current game session
   * @returns The current game session, or null if not in a session
   */
  public getGameSession(): GameSession | null {
    return this.gameSession;
  }
  
  /**
   * Get the local player ID
   * @returns The local player ID
   */
  public getLocalPlayerId(): string {
    return this.localPlayerId;
  }
  
  /**
   * Get the local player name
   * @returns The local player name
   */
  public getLocalPlayerName(): string {
    return this.localPlayerName;
  }
  
  /**
   * Set the local player name
   * @param name The new name
   */
  public setLocalPlayerName(name: string): void {
    this.localPlayerName = name;
  }
}

export default MultiplayerManager;
