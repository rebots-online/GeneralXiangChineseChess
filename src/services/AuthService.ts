// User authentication states
export enum AuthState {
  UNKNOWN = 'unknown',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated'
}

// User interface
export interface User {
  id: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authState: AuthState = AuthState.UNKNOWN;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign in anonymously (for free users)
   * @returns Promise that resolves with the user
   */
  public async signInAnonymously(): Promise<User> {
    try {
      // Generate a unique ID for anonymous users
      const anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
      
      // Create an anonymous user
      const user: User = {
        id: anonymousId,
        isAnonymous: true
      };
      
      // Set the current user
      this.currentUser = user;
      this.authState = AuthState.AUTHENTICATED;
      
      return user;
    } catch (error) {
      console.error('Failed to sign in anonymously:', error);
      this.authState = AuthState.UNAUTHENTICATED;
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * This is a placeholder - in a real app, you would integrate with Firebase, Auth0, etc.
   * @param email User's email
   * @param password User's password
   * @returns Promise that resolves with the user
   */
  public async signInWithEmailPassword(email: string, password: string): Promise<User> {
    try {
      // In a real app, you would authenticate with your auth provider here
      // For now, we'll just create a user with the email
      const userId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
      
      const user: User = {
        id: userId,
        email: email,
        displayName: email.split('@')[0],
        isAnonymous: false
      };
      
      // Set the current user
      this.currentUser = user;
      this.authState = AuthState.AUTHENTICATED;
      
      return user;
    } catch (error) {
      console.error('Failed to sign in with email and password:', error);
      this.authState = AuthState.UNAUTHENTICATED;
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    try {
      // Clear the current user
      this.currentUser = null;
      this.authState = AuthState.UNAUTHENTICATED;
      
      // In a real app, you would sign out from your auth provider here
      
      return;
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }

  /**
   * Get the current user
   * @returns The current user or null if not authenticated
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get the current authentication state
   * @returns The current authentication state
   */
  public getAuthState(): AuthState {
    return this.authState;
  }

  /**
   * Check if the user is authenticated
   * @returns True if the user is authenticated, false otherwise
   */
  public isAuthenticated(): boolean {
    return this.authState === AuthState.AUTHENTICATED;
  }
}

export default AuthService;
