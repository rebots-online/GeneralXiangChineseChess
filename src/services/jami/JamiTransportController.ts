
/**
 * JamiTransportController
 * 
 * This service provides an interface to interact with the Jami service,
 * handling message sending/receiving and event handling.
 */

import JamiService from './JamiService';

// Message handler type
type MessageHandler = (message: string, sender: string) => void;

// Presence handler type
type PresenceHandler = (status: string) => void;

// Event handler type
type EventHandler = (event: any) => void;

/**
 * JamiTransportController class
 * Provides an interface to interact with the Jami service
 */
class JamiTransportController {
  private static instance: JamiTransportController;
  private jamiService: JamiService;
  private initialized: boolean = false;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private presenceHandlers: Map<string, PresenceHandler> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.jamiService = JamiService.getInstance();
  }
  
  /**
   * Get the singleton instance of JamiTransportController
   */
  public static getInstance(): JamiTransportController {
    if (!JamiTransportController.instance) {
      JamiTransportController.instance = new JamiTransportController();
    }
    return JamiTransportController.instance;
  }
  
  /**
   * Initialize the Jami transport controller
   * @returns Promise resolving to true if initialization was successful
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    try {
      // Initialize the Jami service
      const success = await this.jamiService.initialize();
      this.initialized = success;
      
      if (success) {
        console.log('JamiTransportController initialized successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to initialize JamiTransportController:', error);
      return false;
    }
  }
  
  /**
   * Create a new game session (group chat)
   * @returns Promise resolving to the group ID
   */
  public async createGameSession(): Promise<string> {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    try {
      // Create a new game session
      const groupId = await this.jamiService.createGameSession();
      
      // Initialize message handlers set for this group
      this.messageHandlers.set(groupId, new Set());
      
      console.log(`Created game session with ID: ${groupId}`);
      return groupId;
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  }
  
  /**
   * Invite a player to a game session
   * @param groupId The ID of the group chat
   * @param playerId The ID of the player to invite
   * @returns Promise resolving to true if invitation was sent successfully
   */
  public async inviteToGameSession(groupId: string, playerId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    try {
      // Invite the player to the game session
      return await this.jamiService.inviteToGameSession(groupId, playerId);
    } catch (error) {
      console.error(`Failed to invite player ${playerId} to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to a group
   * @param groupId The ID of the group chat
   * @param message The message to send
   * @returns Promise resolving to true if message was sent successfully
   */
  public async sendMessage(groupId: string, message: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    try {
      // Send the message and get the result
      const result = await this.jamiService.sendMessage(groupId, message);
      
      // Convert the result to a boolean in a type-safe way
      if (typeof result === 'boolean') {
        // If it's already a boolean, return it directly
        return result;
      } else if (typeof result === 'string') {
        // If it's a string, consider it success if non-empty
        return result.length > 0;
      } else {
        // For any other type, convert to boolean
        return Boolean(result);
      }
    } catch (error) {
      console.error(`Failed to send message to group ${groupId}:`, error);
      throw error;
    }
  }

  
  /**
   * Get the members of a group
   * @param groupId The ID of the group chat
   * @returns Promise resolving to an array of member IDs
   */
  public async getGroupMembers(groupId: string): Promise<string[]> {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    try {
      // Get the members from the service
      return await this.jamiService.getGroupMembers(groupId);
    } catch (error) {
      console.error(`Failed to get members of group ${groupId}:`, error);
      throw error;
    }
  }
  
  /**
   * Leave a game session
   * @param groupId The ID of the group chat
   * @returns Promise resolving to true if the group was left successfully
   */
  public async leaveGameSession(groupId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    try {
      // Leave the game session
      return await this.jamiService.leaveGameSession(groupId);
    } catch (error) {
      console.error(`Failed to leave group ${groupId}:`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe to messages from a group
   * @param groupId The ID of the group chat
   * @param handler The message handler function
   */
  public subscribeToGroup(groupId: string, handler: MessageHandler): void {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    // Get or create the handlers set for this group
    let handlers = this.messageHandlers.get(groupId);
    if (!handlers) {
      handlers = new Set();
      this.messageHandlers.set(groupId, handlers);
    }
    
    // Add the handler
    handlers.add(handler);
    
    // Subscribe to the group in the service
    this.jamiService.subscribeToGroup(groupId, (message, sender) => {
      // Notify the handler
      try {
        handler(message, sender);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }
  
  /**
   * Unsubscribe from messages from a group
   * @param groupId The ID of the group chat
   * @param handler The message handler function to remove
   */
  public unsubscribeFromGroup(groupId: string, handler: MessageHandler): void {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    // Get the handlers set for this group
    const handlers = this.messageHandlers.get(groupId);
    if (handlers) {
      // Remove the handler
      handlers.delete(handler);
    }
    
    // Unsubscribe from the group in the service
    this.jamiService.unsubscribeFromGroup(groupId, handler);
  }
  
  /**
   * Subscribe to presence changes for a contact
   * @param contactId The ID of the contact
   * @param handler The presence handler function
   */
  public subscribeToPresence(contactId: string, handler: PresenceHandler): void {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    // Add the handler
    this.presenceHandlers.set(contactId, handler);
    
    // Subscribe to presence changes using the peer discovery mechanism
    this.jamiService.onPeerDiscovered((peerId, info) => {
      if (peerId === contactId) {
        // Convert peer info to presence status
        const status = info.status || 'offline';
        handler(status);
      }
    });
  }
  
  /**
   * Unsubscribe from presence changes for a contact
   * @param contactId The ID of the contact
   */
  public unsubscribeFromPresence(contactId: string): void {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    // Remove the handler
    this.presenceHandlers.delete(contactId);
    
    // Unsubscribe from peer discovery events for this contact
    this.jamiService.offPeerDiscovered(() => {
      // Removing all handlers for simplicity
      // A more sophisticated implementation would track and remove specific handlers
    });
  }

  /**
   * Subscribe to events of a specific type
   * @param eventType The type of event to subscribe to
   * @param handler The event handler function
   */
  public subscribeToEvent(eventType: string, handler: EventHandler): void {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    // Get or create the handlers set for this event type
    let handlers = this.eventHandlers.get(eventType);
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(eventType, handlers);
    }
    
    // Add the handler
    handlers.add(handler);
  }
  
  /**
   * Unsubscribe from events of a specific type
   * @param eventType The type of event to unsubscribe from
   * @param handler The event handler function to remove
   */
  public unsubscribeFromEvent(eventType: string, handler: EventHandler): void {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    // Get the handlers set for this event type
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      // Remove the handler
      handlers.delete(handler);
    }
  }
  
  /**
   * Get the current user ID
   * @returns The user ID
   */
  public getUserId(): string {
    if (!this.initialized) {
      throw new Error('JamiTransportController not initialized');
    }
    
    return this.jamiService.getAccountId();
  }
}

export default JamiTransportController;
