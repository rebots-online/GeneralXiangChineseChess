/**
 * JamiService
 * 
 * This service provides an abstraction over the external Jami component, handling 
 * connection management, message passing, and game session creation.
 */

// Path to the external Jami component
const EXTERNAL_JAMI_PATH = process.env.EXTERNAL_JAMI_PATH || './external/jami';

interface JamiExternalInterface {
  // Initialization
  initialize(): Promise<boolean>;
  shutdown(): Promise<void>;
  
  // Account management
  createAccount(): Promise<string>;
  getAccountDetails(accountId: string): Promise<Record<string, string>>;
  
  // Conversation management
  createConversation(accountId: string): Promise<string>;
  joinConversation(accountId: string, conversationId: string): Promise<boolean>;
  leaveConversation(accountId: string, conversationId: string): Promise<boolean>;
  removeConversation(accountId: string, conversationId: string): Promise<boolean>;
  
  // Member management
  addConversationMember(accountId: string, conversationId: string, contactUri: string): Promise<boolean>;
  getConversationMembers(accountId: string, conversationId: string): Promise<string[]>;
  
  // Message handling
  sendMessage(accountId: string, conversationId: string, message: string, replyTo?: string): Promise<string>;
  loadConversationMessages(accountId: string, conversationId: string, fromMessage?: string, count?: number): Promise<any[]>;
  getLastMessageTimestamp(accountId: string, conversationId: string): Promise<number>;
  
  // Event callbacks
  onMessageReceived(callback: (accountId: string, conversationId: string, message: any) => void): void;
  onConversationReady(callback: (accountId: string, conversationId: string) => void): void;
  onMemberEvent(callback: (accountId: string, conversationId: string, member: string, event: number) => void): void;
  
  // Peer discovery
  startDiscovery(accountId: string): Promise<void>;
  stopDiscovery(accountId: string): Promise<void>;
  onPeerDiscovered(callback: (accountId: string, peerId: string, info: Record<string, string>) => void): void;
  onPeerLost(callback: (accountId: string, peerId: string) => void): void;
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
 * Provides an interface to interact with the Jami component
 */
class JamiService {
  private static instance: JamiService;
  
  // Private fields using # to ensure true privacy
  #initialized: boolean = false;
  #externalJami: JamiExternalInterface | null = null;
  #accountId: string = '';
  #groupChats: Map<string, GroupChat> = new Map();
  #messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  #readyHandlers: Set<(conversationId: string) => void> = new Set();
  #memberEventHandlers: Set<(conversationId: string, member: string, event: number) => void> = new Set();
  #authToken: string | null = null;
  #discoveryMode: boolean = false;
  #discoveredPeers: Map<string, Record<string, string>> = new Map();
  #peerHandlers: Set<(peerId: string, info: Record<string, string>) => void> = new Set();
  
  // Message synchronization
  #lastMessageTimestamps: Map<string, number> = new Map();
  #pendingMessages: Map<string, Array<{message: string, timestamp: number}>> = new Map();
  #syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  readonly MESSAGE_SYNC_INTERVAL = 5000; // 5 seconds
  
  // Connection management
  #connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  #reconnectAttempts: number = 0;
  #maxReconnectAttempts: number = 5;
  #reconnectDelay: number = 1000; // Start with 1 second delay
  #connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  #connectionStatusHandlers: Set<(status: 'connected' | 'disconnected' | 'reconnecting') => void> = new Set();
  
  // Constants
  readonly MEMBER_TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Initialize the authentication token
   */
  private async initializeAuth(): Promise<void> {
    try {
      this.checkInitialized();
      if (!this.#externalJami) throw new Error('JamiService not initialized');

      const details = await this.#externalJami.getAccountDetails(this.#accountId);
      this.#authToken = details.token || null;
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
      throw error;
    }
  }

  /**
   * Get the authentication status
   */
  public isAuthenticated(): boolean {
    return this.#initialized && this.#authToken !== null;
  }

  /**
   * Get the authentication token
   */
  public getAuthToken(): string | null {
    return this.#authToken;
  }
  
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
   * Check if service is initialized and external component is available
   */
  /**
   * Check if service is initialized and external component is available
   * @throws {Error} If service is not initialized
   */
  private checkInitialized(): void {
    if (!this.#initialized || !this.#externalJami) {
      throw new Error('JamiService not initialized');
    }
  }

  /**
   * Get the current connection status
   */
  public getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    return this.#connectionStatus;
  }

  /**
   * Start monitoring connection for a member
   */
  private startConnectionTimeout(memberId: string): void {
    // Clear any existing timeout
    this.clearConnectionTimeout(memberId);

    // Set new timeout
    const timeout = setTimeout(() => {
      this.handleMemberTimeout(memberId);
    }, this.MEMBER_TIMEOUT_MS);

    this.#connectionTimeouts.set(memberId, timeout);
  }

  /**
   * Clear connection timeout for a member
   */
  private clearConnectionTimeout(memberId: string): void {
    const timeout = this.#connectionTimeouts.get(memberId);
    if (timeout) {
      clearTimeout(timeout);
      this.#connectionTimeouts.delete(memberId);
    }
  }

  /**
   * Handle member timeout
   */
  private async handleMemberTimeout(memberId: string): Promise<void> {
    console.warn(`Member ${memberId} timed out`);
    this.notifyConnectionStatusChange('disconnected');

    // Remove member from connection monitoring
    this.clearConnectionTimeout(memberId);
    
    // Remove member from group chats
    for (const [groupId, chat] of this.#groupChats.entries()) {
      if (chat.members.includes(memberId)) {
        chat.members = chat.members.filter(id => id !== memberId);
        if (chat.members.length === 0) {
          this.#groupChats.delete(groupId);
        }
      }
    }

    // Start reconnection process
    await this.attemptReconnect();
  }

  /**
   * Attempt to reconnect to the service
   */
  private async attemptReconnect(): Promise<boolean> {
    if (this.#reconnectAttempts >= this.#maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return false;
    }

    this.notifyConnectionStatusChange('reconnecting');
    this.#reconnectAttempts++;

    try {
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, this.#reconnectDelay * Math.pow(2, this.#reconnectAttempts - 1)));

      // Try to reinitialize
      const success = await this.initialize();
      if (success) {
        this.#connectionStatus = 'connected';
        this.#reconnectAttempts = 0;
        this.#reconnectDelay = 1000; // Reset delay
        return true;
      }
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
    }

    return false;
  }

  /**
   * Handle peer discovered event
   */
  private handlePeerDiscovered = (accountId: string, peerId: string, info: Record<string, string>): void => {
    // Store peer information
    this.#discoveredPeers.set(peerId, info);
    
    // Notify handlers
    this.#peerHandlers.forEach(handler => {
      try {
        handler(peerId, info);
      } catch (error) {
        console.error('Error in peer discovery handler:', error);
      }
    });
  };

  /**
   * Handle peer lost event
   */
  private handlePeerLost = (accountId: string, peerId: string): void => {
    // Remove peer from discovered peers
    this.#discoveredPeers.delete(peerId);
    
    // Notify handlers about peer loss
    this.#peerHandlers.forEach(handler => {
      try {
        handler(peerId, { status: 'lost' });
      } catch (error) {
        console.error('Error in peer lost handler:', error);
      }
    });
  };

  /**
   * Initialize the Jami service
   */
  public async initialize(): Promise<boolean> {
    if (this.#initialized) {
      return true;
    }
    
    try {
      // Load external component
      const ExternalJamiComponent = await import(EXTERNAL_JAMI_PATH);
      const jami = new ExternalJamiComponent.default();
      
      // Initialize component
      const success = await jami.initialize();
      if (!success) {
        return false;
      }
      
      this.#externalJami = jami;
      this.#accountId = await jami.createAccount();
      
      // Set up handlers
      jami.onMessageReceived(this.handleMessage.bind(this));
      jami.onConversationReady(this.handleConversationReady.bind(this));
      jami.onMemberEvent(this.handleMemberEvent.bind(this));
      
      this.#initialized = true;
      console.log('JamiService initialized successfully');

      // Initialize authentication and connection management
      await this.initializeAuth();
      this.#connectionStatus = 'connected';
      
      // Monitor connections for each member
      if (this.#externalJami) {
        const members = await this.#externalJami.getConversationMembers(this.#accountId, this.#accountId);
        members.forEach(memberId => {
          this.startConnectionTimeout(memberId);
        });

        // Set up peer discovery handlers
        this.#externalJami.onPeerDiscovered(this.handlePeerDiscovered.bind(this));
        this.#externalJami.onPeerLost(this.handlePeerLost.bind(this));
      }

      // Notify status change
      this.notifyConnectionStatusChange('connected');
      
      return true;
      
    } catch (error) {
      console.error('Failed to initialize JamiService:', error);
      this.#connectionStatus = 'disconnected';
      this.notifyConnectionStatusChange('disconnected');
      return false;
    }
  }

  /**
   * Notify all handlers of connection status change
   */
  private notifyConnectionStatusChange(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.#connectionStatus = status;
    this.#connectionStatusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in connection status handler:', error);
      }
    });
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionStatusChange(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void): void {
    this.#connectionStatusHandlers.add(handler);
  }

  /**
   * Unsubscribe from connection status changes
   */
  public offConnectionStatusChange(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void): void {
    this.#connectionStatusHandlers.delete(handler);
  }

  /**
   * Clean up all resources associated with a conversation
   */
  /**
   * Start peer discovery mode
   */
  public async startDiscovery(): Promise<void> {
    try {
      this.checkInitialized();
      if (!this.#externalJami) throw new Error('JamiService not initialized');
      
      if (!this.#discoveryMode) {
        await this.#externalJami.startDiscovery(this.#accountId);
        this.#discoveryMode = true;
      }
    } catch (error) {
      console.error('Failed to start peer discovery:', error);
      throw error;
    }
  }

  /**
   * Stop peer discovery mode
   */
  public async stopDiscovery(): Promise<void> {
    try {
      if (this.#initialized && this.#externalJami && this.#discoveryMode) {
        await this.#externalJami.stopDiscovery(this.#accountId);
        this.#discoveryMode = false;
        this.#discoveredPeers.clear();
      }
    } catch (error) {
      console.error('Failed to stop peer discovery:', error);
      throw error;
    }
  }

  /**
   * Get list of discovered peers
   */
  public getDiscoveredPeers(): Map<string, Record<string, string>> {
    return new Map(this.#discoveredPeers);
  }

  /**
   * Subscribe to peer discovery events
   */
  public onPeerDiscovered(handler: (peerId: string, info: Record<string, string>) => void): void {
    this.#peerHandlers.add(handler);
  }

  /**
   * Unsubscribe from peer discovery events
   */
  public offPeerDiscovered(handler: (peerId: string, info: Record<string, string>) => void): void {
    this.#peerHandlers.delete(handler);
  }

  private cleanupConversation(conversationId: string): void {
    // Clean up group chat data and members
    const chat = this.#groupChats.get(conversationId);
    if (chat) {
      // Clean up member timeouts
      chat.members.forEach(memberId => {
        this.clearConnectionTimeout(memberId);
      });
    }
    this.#groupChats.delete(conversationId);
    
    // Clean up message handlers and sync
    this.#messageHandlers.delete(conversationId);
    this.#lastMessageTimestamps.delete(conversationId);
    this.#pendingMessages.delete(conversationId);
    
    // Clear sync interval
    const interval = this.#syncIntervals.get(conversationId);
    if (interval) {
      clearInterval(interval);
      this.#syncIntervals.delete(conversationId);
    }

    // Clean up peer discovery if this was the last conversation
    if (this.#groupChats.size === 0) {
      this.stopDiscovery().catch(error => {
        console.error('Failed to stop discovery during cleanup:', error);
      });
    }
  }
  
  /**
   * Clean up all resources
   */
  private async cleanup(): Promise<void> {
    try {
      // Stop peer discovery if active
      if (this.#discoveryMode) {
        await this.stopDiscovery();
      }

      // Clear all intervals
      this.#syncIntervals.forEach(interval => clearInterval(interval));
      this.#syncIntervals.clear();
      
      // Clear all timeouts
      this.#connectionTimeouts.forEach(timeout => clearTimeout(timeout));
      this.#connectionTimeouts.clear();
      
      // Clear all data structures
      this.#groupChats.clear();
      this.#messageHandlers.clear();
      this.#readyHandlers.clear();
      this.#memberEventHandlers.clear();
      this.#lastMessageTimestamps.clear();
      this.#pendingMessages.clear();
      
      // Clear peer discovery state
      this.#discoveredPeers.clear();
      this.#peerHandlers.clear();
      this.#discoveryMode = false;
      
      // Reset connection state
      this.#connectionStatus = 'disconnected';
      this.#reconnectAttempts = 0;
      this.#reconnectDelay = 1000;
      
      // Clear auth state
      this.#authToken = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    try {
      // Notify about disconnection
      this.notifyConnectionStatusChange('disconnected');
      
      // If initialized, shutdown external component
      if (this.#initialized && this.#externalJami) {
        await this.#externalJami.shutdown();
      }
      
      // Clean up all resources asynchronously
      await this.cleanup();
      
      // Reset initialization state
      this.#initialized = false;
      this.#externalJami = null;
    } catch (error) {
      console.error('Failed to shutdown JamiService:', error);
      throw error;
    }
  }

  /**
   * Create a new game session
   */
  public async createGameSession(): Promise<string> {
    try {
      this.checkInitialized();
      if (!this.#externalJami) throw new Error('JamiService not initialized');
      
      const conversationId = await this.#externalJami.createConversation(this.#accountId);
      
      // Store session info and start sync
      this.#groupChats.set(conversationId, {
        id: conversationId,
        members: [this.#accountId],
        created: new Date()
      });

      // Initialize message sync for the conversation
      this.startMessageSync(conversationId);
      this.#lastMessageTimestamps.set(conversationId, Date.now());
      
      return conversationId;
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  }

  /**
   * Invite a player to a game session
   */
  public async inviteToGameSession(conversationId: string, playerId: string): Promise<boolean> {
    try {
      this.checkInitialized();
      if (!this.#externalJami) throw new Error('JamiService not initialized');
      if (!this.isAuthenticated()) throw new Error('Not authenticated');
      
      const success = await this.#externalJami.addConversationMember(
        this.#accountId,
        conversationId,
        playerId
      );
      
      if (success) {
        const group = this.#groupChats.get(conversationId);
        if (group) {
          group.members.push(playerId);

          // Ensure message sync is running for the conversation
          if (!this.#lastMessageTimestamps.has(conversationId)) {
            this.startMessageSync(conversationId);
            this.#lastMessageTimestamps.set(conversationId, Date.now());
          }
        }
      }
      
      return success;
    } catch (error) {
      console.error(`Failed to invite player ${playerId} to conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message in a game session
   */
  public async sendMessage(conversationId: string, message: string): Promise<string> {
    try {
      this.checkInitialized();
      if (!this.#externalJami) throw new Error('JamiService not initialized');
      if (!this.isAuthenticated()) throw new Error('Not authenticated');
      
      // Add timestamp to message
      const timestamp = Date.now();
      const messageWithTimestamp = JSON.stringify({
        content: message,
        timestamp,
        sender: this.#accountId
      });
      
      const messageId = await this.#externalJami.sendMessage(
        this.#accountId,
        conversationId,
        messageWithTimestamp
      );
      
      // Store latest timestamp
      this.#lastMessageTimestamps.set(conversationId, timestamp);
      
      return messageId;
    } catch (error) {
      console.error(`Failed to send message to conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Sync messages with peers
   */
  private async syncMessages(conversationId: string): Promise<void> {
    try {
      if (!this.#externalJami) return;
      
      // Get last message timestamp from peer
      const lastTimestamp = await this.#externalJami.getLastMessageTimestamp(this.#accountId, conversationId);
      const ourLastTimestamp = this.#lastMessageTimestamps.get(conversationId) || 0;
      
      if (lastTimestamp > ourLastTimestamp) {
        // Fetch missing messages
        const messages = await this.#externalJami.loadConversationMessages(
          this.#accountId,
          conversationId,
          undefined,
          100
        );
        
        // Process messages in order
        messages
          .filter(msg => {
            const parsed = JSON.parse(msg);
            return parsed.timestamp > ourLastTimestamp;
          })
          .sort((a, b) => JSON.parse(a).timestamp - JSON.parse(b).timestamp)
          .forEach(msg => {
            const parsed = JSON.parse(msg);
            const handlers = this.#messageHandlers.get(conversationId);
            if (handlers) {
              handlers.forEach(handler => {
                try {
                  handler(parsed.content, parsed.sender);
                } catch (error) {
                  console.error('Error in message handler:', error);
                }
              });
            }
            this.#lastMessageTimestamps.set(conversationId, parsed.timestamp);
          });
      }
    } catch (error) {
      console.error(`Failed to sync messages for conversation ${conversationId}:`, error);
    }
  }

  /**
   * Start message synchronization for a conversation
   */
  private startMessageSync(conversationId: string): void {
    setInterval(() => {
      this.syncMessages(conversationId);
    }, this.MESSAGE_SYNC_INTERVAL);
  }

  /**
   * Get members of a game session
   */
  /**
   * Subscribe to a group's messages
   */
  public subscribeToGroup(conversationId: string, handler: MessageHandler): void {
    let handlers = this.#messageHandlers.get(conversationId);
    if (!handlers) {
      handlers = new Set();
      this.#messageHandlers.set(conversationId, handlers);
    }
    handlers.add(handler);
  }

  /**
   * Unsubscribe from a group's messages
   */
  public unsubscribeFromGroup(conversationId: string, handler: MessageHandler): void {
    const handlers = this.#messageHandlers.get(conversationId);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Subscribe to conversation ready events
   */
  public onConversationReady(handler: (conversationId: string) => void): void {
    this.#readyHandlers.add(handler);
  }

  /**
   * Subscribe to member events
   */
  public onMemberEvent(handler: (conversationId: string, member: string, event: number) => void): void {
    this.#memberEventHandlers.add(handler);
  }

  /**
   * Get members of a game session
   */
  public async getGroupMembers(conversationId: string): Promise<string[]> {
    try {
      this.checkInitialized();
      if (!this.#externalJami) throw new Error('JamiService not initialized');
      return await this.#externalJami.getConversationMembers(this.#accountId, conversationId);
    } catch (error) {
      console.error(`Failed to get members of conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Leave a game session
   */
  public async leaveGameSession(conversationId: string): Promise<boolean> {
    try {
      this.checkInitialized();
      if (!this.#externalJami) throw new Error('JamiService not initialized');
      
      const success = await this.#externalJami.leaveConversation(this.#accountId, conversationId);
      if (success) {
        // Clean up all conversation resources
        this.cleanupConversation(conversationId);
        await this.#externalJami.removeConversation(this.#accountId, conversationId);
      }
      
      return success;
    } catch (error) {
      console.error(`Failed to leave conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Handler for incoming messages
   */
  private handleMessage(accountId: string, conversationId: string, message: any): void {
    try {
      const parsed = JSON.parse(message);
      const timestamp = parsed.timestamp;
      
      // Update last message timestamp
      const currentTimestamp = this.#lastMessageTimestamps.get(conversationId) || 0;
      if (timestamp > currentTimestamp) {
        this.#lastMessageTimestamps.set(conversationId, timestamp);
      }
      
      // Notify handlers
      const handlers = this.#messageHandlers.get(conversationId);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(parsed.content, parsed.sender);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  /**
   * Handler for conversation ready events
   */
  private handleConversationReady(accountId: string, conversationId: string): void {
    this.#readyHandlers.forEach(handler => {
      try {
        handler(conversationId);
      } catch (error) {
        console.error('Error in conversation ready handler:', error);
      }
    });
  }

  /**
   * Handler for member events
   */
  private handleMemberEvent(accountId: string, conversationId: string, member: string, event: number): void {
    // Handle member events
    this.#memberEventHandlers.forEach(handler => {
      try {
        handler(conversationId, member, event);
      } catch (error) {
        console.error('Error in member event handler:', error);
      }
    });

    // Reset timeout for member activity
    if (accountId !== this.#accountId) {
      this.startConnectionTimeout(accountId);
    }

    // Update group chat membership
    const chat = this.#groupChats.get(conversationId);
    if (chat) {
      switch (event) {
        case 0: // Member joined
          if (!chat.members.includes(member)) {
            chat.members.push(member);
          }
          break;
        case 1: // Member left
          chat.members = chat.members.filter(id => id !== member);
          if (chat.members.length === 0) {
            this.#groupChats.delete(conversationId);
          }
          break;
      }
    }
  }
  
  /**
   * Get the current account ID
   */
  public getAccountId(): string {
    return this.#accountId;
  }
}

export default JamiService;
