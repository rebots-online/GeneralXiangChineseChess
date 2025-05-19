/**
 * GameStateTransport
 * 
 * This service manages the transmission and reception of game state updates,
 * using Jami's group chat as a multicast mechanism.
 */

import JamiTransportController from '../jami/JamiTransportController';
import { GameState, Move } from '../../game/gameState';
import { Piece, PlayerSide } from '../../game/pieces';

// Game action types
export enum GameActionType {
  GAME_START = 'game_start',
  PIECE_MOVE = 'piece_move',
  GAME_END = 'game_end',
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
  CHAT_MESSAGE = 'chat_message',
}

// Game action interface
export interface GameAction {
  type: GameActionType;
  playerId: string;
  timestamp: number;
  data: any;
  vectorClock: Record<string, number>;
}

// Game action handler type
export type GameActionHandler = (action: GameAction) => void;

// Chat message handler type
export type ChatMessageHandler = (message: string, sender: string) => void;

/**
 * VectorClock class for distributed event ordering
 */
class VectorClock {
  private clock: Record<string, number> = {};

  constructor(playerIds: string[] = []) {
    playerIds.forEach(id => {
      this.clock[id] = 0;
    });
  }

  /**
   * Add a player to the vector clock
   * @param playerId The player ID to add
   */
  public addPlayer(playerId: string): void {
    if (!this.clock[playerId]) {
      this.clock[playerId] = 0;
    }
  }

  /**
   * Increment the clock for a player
   * @param playerId The player ID to increment
   */
  public increment(playerId: string): void {
    this.addPlayer(playerId);
    this.clock[playerId]++;
  }

  /**
   * Compare this vector clock with another
   * @param other The other vector clock
   * @returns 'before', 'after', 'concurrent', or 'equal'
   */
  public compare(other: VectorClock): 'before' | 'after' | 'concurrent' | 'equal' {
    let before = false;
    let after = false;

    // Combine all keys from both clocks
    const allKeys = new Set([...Object.keys(this.clock), ...Object.keys(other.clock)]);

    for (const key of allKeys) {
      const thisValue = this.clock[key] || 0;
      const otherValue = other.clock[key] || 0;

      if (thisValue < otherValue) {
        before = true;
      } else if (thisValue > otherValue) {
        after = true;
      }
    }

    if (before && after) {
      return 'concurrent';
    } else if (before) {
      return 'before';
    } else if (after) {
      return 'after';
    } else {
      return 'equal';
    }
  }

  /**
   * Merge this vector clock with another
   * @param other The other vector clock
   */
  public merge(other: VectorClock): void {
    // Combine all keys from both clocks
    const allKeys = new Set([...Object.keys(this.clock), ...Object.keys(other.clock)]);

    for (const key of allKeys) {
      const thisValue = this.clock[key] || 0;
      const otherValue = other.clock[key] || 0;

      this.clock[key] = Math.max(thisValue, otherValue);
    }
  }

  /**
   * Serialize the vector clock
   * @returns The serialized vector clock
   */
  public serialize(): Record<string, number> {
    return { ...this.clock };
  }

  /**
   * Deserialize a vector clock
   * @param serialized The serialized vector clock
   * @returns A new VectorClock instance
   */
  public static deserialize(serialized: Record<string, number>): VectorClock {
    const clock = new VectorClock();
    clock.clock = { ...serialized };
    return clock;
  }
}

/**
 * GameStateTransport class
 */
export class GameStateTransport {
  private jamiTransport: JamiTransportController;
  private gameSessionId: string;
  private vectorClock: VectorClock;
  private playerId: string;
  private gameActionHandlers: Set<GameActionHandler> = new Set();
  private chatMessageHandlers: Set<ChatMessageHandler> = new Set();
  private actionLog: GameAction[] = [];
  
  /**
   * Constructor
   * @param gameSessionId The ID of the game session (Jami group chat)
   * @param playerId The ID of the current player
   */
  constructor(gameSessionId: string, playerId: string) {
    this.jamiTransport = JamiTransportController.getInstance();
    this.gameSessionId = gameSessionId;
    this.playerId = playerId;
    this.vectorClock = new VectorClock([playerId]);
    
    // Subscribe to messages from the game session
    this.jamiTransport.subscribeToGroup(gameSessionId, this.handleMessage);
  }
  
  /**
   * Handle a message from the game session
   * @param message The message
   * @param sender The sender ID
   */
  private handleMessage = (message: string, sender: string): void => {
    // Check if it's a chat message
    if (message.startsWith('[CHAT] ')) {
      // Extract the chat message content
      const content = message.substring(7);
      
      // Notify chat message handlers
      this.notifyChatMessageHandlers(content, sender);
      return;
    }
    
    // Try to parse as game state message
    try {
      const gameAction = JSON.parse(message) as GameAction;
      
      // Add sender to vector clock if not already present
      this.vectorClock.addPlayer(sender);
      
      // Process the action
      this.processGameAction(gameAction, sender);
    } catch (error) {
      console.error('Failed to parse game message:', error);
      
      // If parsing fails, treat as unmarked chat message
      this.notifyChatMessageHandlers(message, sender);
    }
  };
  
  /**
   * Process a game action
   * @param action The game action
   * @param sender The sender ID
   */
  private processGameAction(action: GameAction, sender: string): void {
    // Deserialize vector clock from action
    const actionClock = VectorClock.deserialize(action.vectorClock);
    
    // Compare with local clock
    const comparison = this.vectorClock.compare(actionClock);
    
    if (comparison === 'before' || comparison === 'concurrent') {
      // This is a new or concurrent action
      
      // Merge clocks
      this.vectorClock.merge(actionClock);
      
      // Add to action log (with proper ordering)
      this.insertActionInLog(action);
      
      // Notify game action handlers
      this.notifyGameActionHandlers(action);
    }
    // If 'after', we already have this action or a newer one
  }
  
  /**
   * Insert an action in the log with proper ordering
   * @param action The action to insert
   */
  private insertActionInLog(action: GameAction): void {
    // For now, just append to the log
    // In a more sophisticated implementation, we would order by vector clock
    this.actionLog.push(action);
  }
  
  /**
   * Notify game action handlers
   * @param action The game action
   */
  private notifyGameActionHandlers(action: GameAction): void {
    this.gameActionHandlers.forEach(handler => {
      try {
        handler(action);
      } catch (error) {
        console.error('Error in game action handler:', error);
      }
    });
  }
  
  /**
   * Notify chat message handlers
   * @param message The chat message
   * @param sender The sender ID
   */
  private notifyChatMessageHandlers(message: string, sender: string): void {
    this.chatMessageHandlers.forEach(handler => {
      try {
        handler(message, sender);
      } catch (error) {
        console.error('Error in chat message handler:', error);
      }
    });
  }
  
  /**
   * Send a game action
   * @param action The game action to send
   */
  public sendGameAction(action: Partial<GameAction>): void {
    // Increment vector clock for this player
    this.vectorClock.increment(this.playerId);
    
    // Create complete action
    const completeAction: GameAction = {
      ...action as any,
      playerId: this.playerId,
      timestamp: Date.now(),
      vectorClock: this.vectorClock.serialize()
    };
    
    // Send action
    this.jamiTransport.sendMessage(this.gameSessionId, JSON.stringify(completeAction));
    
    // Add to local action log
    this.actionLog.push(completeAction);
    
    // Notify game action handlers
    this.notifyGameActionHandlers(completeAction);
  }
  
  /**
   * Send a chat message
   * @param content The chat message content
   */
  public sendChatMessage(content: string): void {
    // Send message with [CHAT] prefix
    this.jamiTransport.sendMessage(this.gameSessionId, `[CHAT] ${content}`);
    
    // Notify chat message handlers
    this.notifyChatMessageHandlers(content, this.playerId);
  }
  
  /**
   * Register a handler for game actions
   * @param handler The handler function
   */
  public onGameAction(handler: GameActionHandler): void {
    this.gameActionHandlers.add(handler);
  }
  
  /**
   * Unregister a handler for game actions
   * @param handler The handler function
   */
  public offGameAction(handler: GameActionHandler): void {
    this.gameActionHandlers.delete(handler);
  }
  
  /**
   * Register a handler for chat messages
   * @param handler The handler function
   */
  public onChatMessage(handler: ChatMessageHandler): void {
    this.chatMessageHandlers.add(handler);
  }
  
  /**
   * Unregister a handler for chat messages
   * @param handler The handler function
   */
  public offChatMessage(handler: ChatMessageHandler): void {
    this.chatMessageHandlers.delete(handler);
  }
  
  /**
   * Send a game start action
   * @param initialState The initial game state
   */
  public sendGameStart(initialState: GameState): void {
    this.sendGameAction({
      type: GameActionType.GAME_START,
      data: initialState
    });
  }
  
  /**
   * Send a piece move action
   * @param piece The piece that was moved
   * @param from The starting position
   * @param to The ending position
   * @param capturedPiece The captured piece, if any
   */
  public sendPieceMove(piece: Piece, from: [number, number], to: [number, number], capturedPiece: Piece | null): void {
    this.sendGameAction({
      type: GameActionType.PIECE_MOVE,
      data: {
        piece,
        from,
        to,
        capturedPiece
      }
    });
  }
  
  /**
   * Send a game end action
   * @param winner The winning side, or null for a draw
   */
  public sendGameEnd(winner: PlayerSide | null): void {
    this.sendGameAction({
      type: GameActionType.GAME_END,
      data: {
        winner
      }
    });
  }
  
  /**
   * Send a player join action
   * @param playerName The name of the player
   * @param side The side the player is playing
   */
  public sendPlayerJoin(playerName: string, side: PlayerSide): void {
    this.sendGameAction({
      type: GameActionType.PLAYER_JOIN,
      data: {
        playerName,
        side
      }
    });
  }
  
  /**
   * Send a player leave action
   */
  public sendPlayerLeave(): void {
    this.sendGameAction({
      type: GameActionType.PLAYER_LEAVE,
      data: {}
    });
  }
  
  /**
   * Get the action log
   * @returns The action log
   */
  public getActionLog(): GameAction[] {
    return [...this.actionLog];
  }
  
  /**
   * Get the player ID
   * @returns The player ID
   */
  public getPlayerId(): string {
    return this.playerId;
  }
  
  /**
   * Get the game session ID
   * @returns The game session ID
   */
  public getGameSessionId(): string {
    return this.gameSessionId;
  }
}

export default GameStateTransport;
