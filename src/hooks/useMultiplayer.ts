'use client';

import { useState, useEffect, useCallback } from 'react';
import MultiplayerManager, { GameSession, Player } from '../services/game/MultiplayerManager';
import { PlayerSide } from '../game/pieces';

interface UseMultiplayerOptions {
  playerName?: string;
  autoInitialize?: boolean;
}

interface UseMultiplayerReturn {
  isInitialized: boolean;
  isInSession: boolean;
  isHost: boolean;
  gameSession: GameSession | null;
  players: Player[];
  localPlayerId: string;
  localPlayerName: string;
  initialize: (playerName: string) => Promise<boolean>;
  createGameSession: (side: PlayerSide) => Promise<GameSession>;
  joinGameSession: (sessionId: string) => Promise<GameSession>;
  leaveGameSession: () => Promise<boolean>;
  startGame: () => boolean;
  sendChatMessage: (message: string) => boolean;
  setLocalPlayerName: (name: string) => void;
}

/**
 * Hook for using multiplayer functionality
 * @param options Options for the hook
 * @returns Multiplayer functionality
 */
export function useMultiplayer(options: UseMultiplayerOptions = {}): UseMultiplayerReturn {
  const { playerName = 'Player', autoInitialize = true } = options;
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInSession, setIsInSession] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [localPlayerName, setLocalPlayerName] = useState(playerName);
  
  // Get the multiplayer manager
  const multiplayerManager = MultiplayerManager.getInstance();
  
  // Initialize the multiplayer manager
  const initialize = useCallback(async (name: string): Promise<boolean> => {
    try {
      const success = await multiplayerManager.initialize(name);
      
      if (success) {
        setIsInitialized(true);
        setLocalPlayerId(multiplayerManager.getLocalPlayerId());
        setLocalPlayerName(name);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to initialize multiplayer:', error);
      return false;
    }
  }, [multiplayerManager]);
  
  // Create a new game session
  const createGameSession = useCallback(async (side: PlayerSide): Promise<GameSession> => {
    try {
      const session = await multiplayerManager.createGameSession(side);
      
      setGameSession(session);
      setPlayers(session.players);
      setIsInSession(true);
      
      return session;
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  }, [multiplayerManager]);
  
  // Join an existing game session
  const joinGameSession = useCallback(async (sessionId: string): Promise<GameSession> => {
    try {
      const session = await multiplayerManager.joinGameSession(sessionId);
      
      setGameSession(session);
      setPlayers(session.players);
      setIsInSession(true);
      
      return session;
    } catch (error) {
      console.error('Failed to join game session:', error);
      throw error;
    }
  }, [multiplayerManager]);
  
  // Leave the current game session
  const leaveGameSession = useCallback(async (): Promise<boolean> => {
    try {
      const success = await multiplayerManager.leaveGameSession();
      
      if (success) {
        setGameSession(null);
        setPlayers([]);
        setIsInSession(false);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to leave game session:', error);
      return false;
    }
  }, [multiplayerManager]);
  
  // Start the game
  const startGame = useCallback((): boolean => {
    return multiplayerManager.startGame();
  }, [multiplayerManager]);
  
  // Send a chat message
  const sendChatMessage = useCallback((message: string): boolean => {
    return multiplayerManager.sendChatMessage(message);
  }, [multiplayerManager]);
  
  // Set the local player name
  const setPlayerName = useCallback((name: string): void => {
    multiplayerManager.setLocalPlayerName(name);
    setLocalPlayerName(name);
  }, [multiplayerManager]);
  
  // Auto-initialize if enabled
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize(playerName);
    }
  }, [autoInitialize, initialize, isInitialized, playerName]);
  
  // Set up event listeners
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    
    // Handle game session updates
    const handleGameSessionUpdated = (session: GameSession) => {
      setGameSession(session);
      setPlayers(session.players);
    };
    
    // Handle player joined
    const handlePlayerJoined = () => {
      const session = multiplayerManager.getGameSession();
      if (session) {
        setPlayers(session.players);
      }
    };
    
    // Handle player left
    const handlePlayerLeft = () => {
      const session = multiplayerManager.getGameSession();
      if (session) {
        setPlayers(session.players);
      }
    };
    
    // Handle game session left
    const handleGameSessionLeft = () => {
      setGameSession(null);
      setPlayers([]);
      setIsInSession(false);
    };
    
    // Register event handlers
    multiplayerManager.on('gameSessionCreated', handleGameSessionUpdated);
    multiplayerManager.on('gameSessionJoined', handleGameSessionUpdated);
    multiplayerManager.on('gameStarted', handleGameSessionUpdated);
    multiplayerManager.on('playerJoined', handlePlayerJoined);
    multiplayerManager.on('playerLeft', handlePlayerLeft);
    multiplayerManager.on('gameSessionLeft', handleGameSessionLeft);
    
    // Clean up event handlers
    return () => {
      multiplayerManager.off('gameSessionCreated', handleGameSessionUpdated);
      multiplayerManager.off('gameSessionJoined', handleGameSessionUpdated);
      multiplayerManager.off('gameStarted', handleGameSessionUpdated);
      multiplayerManager.off('playerJoined', handlePlayerJoined);
      multiplayerManager.off('playerLeft', handlePlayerLeft);
      multiplayerManager.off('gameSessionLeft', handleGameSessionLeft);
    };
  }, [isInitialized, multiplayerManager]);
  
  return {
    isInitialized,
    isInSession,
    isHost: gameSession?.isHost || false,
    gameSession,
    players,
    localPlayerId,
    localPlayerName,
    initialize,
    createGameSession,
    joinGameSession,
    leaveGameSession,
    startGame,
    sendChatMessage,
    setLocalPlayerName: setPlayerName
  };
}
