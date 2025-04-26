/**
 * JamiService
 * 
 * This service provides an abstraction over the Jami SDK, handling group chat creation,
 * invitations, and message sending/receiving. It is implemented as a singleton to ensure
 * a single instance throughout the application.
 */

// Type definitions for Jami SDK
// Note: These are placeholder types and should be replaced with actual Jami SDK types
interface JamiSDK {
  initialize(): Promise<boolean>;
  createGroupConversation(): Promise<string>;
  inviteContact(groupId: string, contactId: string): Promise<boolean>;
  sendMessage(groupId: string, message: string): Promise<boolean>;
  onMessageReceived(callback: (groupId: string, message: string, sender: string) => void): void;
  onPresenceChanged(callback: (contactId: string, status: string) => void): void;
  getContacts(): Promise<string[]>;
  getGroupMembers(groupId: string): Promise<string[]>;
  leaveGroup(groupId: string): Promise<boolean>;
}

// Group chat information
interface GroupChat {
  id: string;
  members: string[];
  created: Date;
}

// Message handler type
type MessageHandler = (message: string, sender: string) => void;

/**
 * JamiService class
 * Provides an interface to interact with the Jami SDK
 */
class JamiService {
  private static instance: JamiService;
  private initialized: boolean = false;
  private jamiSDK: JamiSDK | null = null;
  private groupChats: Map<string, GroupChat> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private presenceHandlers: Map<string, (status: string) => void> = new Map();
  private userId: string = '';
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of JamiService
   */
  public static getInstance(): JamiService {
    if (!JamiService.instance) {
      JamiService.instance = new JamiService();
    }
    return JamiService.instance;
  }
  
  /**
   * Initialize the Jami service
   * @returns Promise resolving to true if initialization was successful
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    try {
      // In a real implementation, this would load and initialize the Jami SDK
      // For now, we'll create a mock implementation
      this.jamiSDK = this.createMockJamiSDK();
      
      const success = await this.jamiSDK.initialize();
      this.initialized = success;
      
      if (success) {
        // Set up message handler
        this.jamiSDK.onMessageReceived(this.handleMessageReceived);
        
        // Set up presence handler
        this.jamiSDK.onPresenceChanged(this.handlePresenceChanged);
        
        // Generate a mock user ID for testing
        this.userId = `user-${Math.random().toString(36).substring(2, 9)}`;
        
        console.log('JamiService initialized successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to initialize JamiService:', error);
      return false;
    }
  }
  
  /**
   * Create a new game session (group chat)
   * @returns Promise resolving to the group ID
   */
  public async createGameSession(): Promise<string> {
    if (!this.initialized || !this.jamiSDK) {
      throw new Error('JamiService not initialized');
    }
    
    try {
      // Create a new group conversation
      const groupId = await this.jamiSDK.createGroupConversation();
      
      // Store group information
      this.groupChats.set(groupId, {
        id: groupId,
        members: [this.userId],
        created: new Date()
      });
      
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
    if (!this.initialized || !this.jamiSDK) {
      throw new Error('JamiService not initialized');
    }
    
    try {
      // Invite the player to the group
      const success = await this.jamiSDK.inviteContact(groupId, playerId);
      
      if (success) {
        // Update group members
        const groupChat = this.groupChats.get(groupId);
        if (groupChat) {
          groupChat.members.push(playerId);
        }
      }
      
      return success;
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
  public async sendGroupMessage(groupId: string, message: string): Promise<boolean> {
    if (!this.initialized || !this.jamiSDK) {
      throw new Error('JamiService not initialized');
    }
    
    try {
      // Send the message
      return await this.jamiSDK.sendMessage(groupId, message);
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
    if (!this.initialized || !this.jamiSDK) {
      throw new Error('JamiService not initialized');
    }
    
    try {
      // Get the members from the SDK
      return await this.jamiSDK.getGroupMembers(groupId);
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
    if (!this.initialized || !this.jamiSDK) {
      throw new Error('JamiService not initialized');
    }
    
    try {
      // Leave the group
      const success = await this.jamiSDK.leaveGroup(groupId);
      
      if (success) {
        // Remove group information
        this.groupChats.delete(groupId);
        this.messageHandlers.delete(groupId);
      }
      
      return success;
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
    // Get or create the handlers set for this group
    let handlers = this.messageHandlers.get(groupId);
    if (!handlers) {
      handlers = new Set();
      this.messageHandlers.set(groupId, handlers);
    }
    
    // Add the handler
    handlers.add(handler);
  }
  
  /**
   * Unsubscribe from messages from a group
   * @param groupId The ID of the group chat
   * @param handler The message handler function to remove
   */
  public unsubscribeFromGroup(groupId: string, handler: MessageHandler): void {
    // Get the handlers set for this group
    const handlers = this.messageHandlers.get(groupId);
    if (handlers) {
      // Remove the handler
      handlers.delete(handler);
    }
  }
  
  /**
   * Subscribe to presence changes for a contact
   * @param contactId The ID of the contact
   * @param handler The presence handler function
   */
  public subscribeToPresence(contactId: string, handler: (status: string) => void): void {
    // Add the handler
    this.presenceHandlers.set(contactId, handler);
  }
  
  /**
   * Unsubscribe from presence changes for a contact
   * @param contactId The ID of the contact
   */
  public unsubscribeFromPresence(contactId: string): void {
    // Remove the handler
    this.presenceHandlers.delete(contactId);
  }
  
  /**
   * Get the current user ID
   * @returns The user ID
   */
  public getUserId(): string {
    return this.userId;
  }
  
  /**
   * Handle a message received from Jami
   */
  private handleMessageReceived = (groupId: string, message: string, sender: string): void => {
    // Get the handlers for this group
    const handlers = this.messageHandlers.get(groupId);
    if (handlers) {
      // Notify all handlers
      handlers.forEach(handler => {
        try {
          handler(message, sender);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  };
  
  /**
   * Handle a presence change from Jami
   */
  private handlePresenceChanged = (contactId: string, status: string): void => {
    // Get the handler for this contact
    const handler = this.presenceHandlers.get(contactId);
    if (handler) {
      // Notify the handler
      try {
        handler(status);
      } catch (error) {
        console.error('Error in presence handler:', error);
      }
    }
  };
  
  /**
   * Create a mock Jami SDK for testing
   * @returns A mock Jami SDK
   */
  private createMockJamiSDK(): JamiSDK {
    // Mock contacts
    const contacts = [
      'contact-1',
      'contact-2',
      'contact-3',
      'contact-4'
    ];
    
    // Mock groups
    const groups = new Map<string, string[]>();
    
    // Message callback
    let messageCallback: ((groupId: string, message: string, sender: string) => void) | null = null;
    
    // Presence callback
    let presenceCallback: ((contactId: string, status: string) => void) | null = null;
    
    return {
      initialize: async () => {
        console.log('Mock Jami SDK initialized');
        return true;
      },
      
      createGroupConversation: async () => {
        const groupId = `group-${Math.random().toString(36).substring(2, 9)}`;
        groups.set(groupId, [this.userId]);
        return groupId;
      },
      
      inviteContact: async (groupId: string, contactId: string) => {
        if (!groups.has(groupId)) {
          return false;
        }
        
        groups.get(groupId)!.push(contactId);
        return true;
      },
      
      sendMessage: async (groupId: string, message: string) => {
        if (!groups.has(groupId)) {
          return false;
        }
        
        // Simulate message delivery to self (for testing)
        setTimeout(() => {
          if (messageCallback) {
            messageCallback(groupId, message, this.userId);
          }
        }, 100);
        
        return true;
      },
      
      onMessageReceived: (callback) => {
        messageCallback = callback;
      },
      
      onPresenceChanged: (callback) => {
        presenceCallback = callback;
        
        // Simulate presence changes for testing
        setInterval(() => {
          if (presenceCallback) {
            const randomContact = contacts[Math.floor(Math.random() * contacts.length)];
            const status = Math.random() > 0.5 ? 'online' : 'offline';
            presenceCallback(randomContact, status);
          }
        }, 30000);
      },
      
      getContacts: async () => {
        return contacts;
      },
      
      getGroupMembers: async (groupId: string) => {
        if (!groups.has(groupId)) {
          return [];
        }
        
        return groups.get(groupId)!;
      },
      
      leaveGroup: async (groupId: string) => {
        if (!groups.has(groupId)) {
          return false;
        }
        
        groups.delete(groupId);
        return true;
      }
    };
  }
}

export default JamiService;
