/**
 * VectorClock
 * 
 * A vector clock implementation for distributed event ordering and conflict resolution.
 * Vector clocks are used to establish a partial ordering of events in a distributed system.
 */

/**
 * VectorClock class
 */
class VectorClock {
  private clock: Map<string, number> = new Map();
  
  /**
   * Constructor
   * @param players Initial list of players to include in the vector clock
   */
  constructor(players: string[] = []) {
    // Initialize the clock with zero values for each player
    players.forEach(player => {
      this.clock.set(player, 0);
    });
  }
  
  /**
   * Add a player to the vector clock
   * @param player The player ID to add
   */
  public addPlayer(player: string): void {
    if (!this.clock.has(player)) {
      this.clock.set(player, 0);
    }
  }
  
  /**
   * Remove a player from the vector clock
   * @param player The player ID to remove
   */
  public removePlayer(player: string): void {
    this.clock.delete(player);
  }
  
  /**
   * Increment the clock value for a player
   * @param player The player ID to increment
   * @returns The new clock value
   */
  public increment(player: string): number {
    // Add the player if not already present
    this.addPlayer(player);
    
    // Increment the clock value
    const value = this.clock.get(player)! + 1;
    this.clock.set(player, value);
    
    return value;
  }
  
  /**
   * Get the clock value for a player
   * @param player The player ID
   * @returns The clock value, or 0 if the player is not in the clock
   */
  public getValue(player: string): number {
    return this.clock.get(player) || 0;
  }
  
  /**
   * Check if this vector clock is concurrent with another vector clock
   * @param other The other vector clock
   * @returns True if the clocks are concurrent, false otherwise
   */
  public isConcurrentWith(other: VectorClock): boolean {
    let thisGreater = false;
    let otherGreater = false;
    
    // Check all players in this clock
    for (const [player, value] of this.clock.entries()) {
      const otherValue = other.getValue(player);
      
      if (value > otherValue) {
        thisGreater = true;
      } else if (value < otherValue) {
        otherGreater = true;
      }
      
      // If we've found that both clocks have greater values for different players,
      // they are concurrent
      if (thisGreater && otherGreater) {
        return true;
      }
    }
    
    // Check all players in the other clock that are not in this clock
    for (const [player, value] of other.clock.entries()) {
      if (!this.clock.has(player) && value > 0) {
        otherGreater = true;
      }
      
      // If we've found that both clocks have greater values for different players,
      // they are concurrent
      if (thisGreater && otherGreater) {
        return true;
      }
    }
    
    // If we get here, one clock is greater than or equal to the other
    return false;
  }
  
  /**
   * Check if this vector clock is less than another vector clock
   * @param other The other vector clock
   * @returns True if this clock is less than the other, false otherwise
   */
  public isLessThan(other: VectorClock): boolean {
    let someStrictlyLess = false;
    
    // Check all players in this clock
    for (const [player, value] of this.clock.entries()) {
      const otherValue = other.getValue(player);
      
      if (value > otherValue) {
        // If any value in this clock is greater, it's not less than the other
        return false;
      } else if (value < otherValue) {
        someStrictlyLess = true;
      }
    }
    
    // Check all players in the other clock that are not in this clock
    for (const [player, value] of other.clock.entries()) {
      if (!this.clock.has(player) && value > 0) {
        someStrictlyLess = true;
      }
    }
    
    // This clock is less than the other if at least one value is strictly less
    // and no value is greater
    return someStrictlyLess;
  }
  
  /**
   * Merge this vector clock with another vector clock
   * @param other The other vector clock
   * @returns This vector clock after merging
   */
  public merge(other: VectorClock): VectorClock {
    // Merge all players from the other clock
    for (const [player, value] of other.clock.entries()) {
      const thisValue = this.getValue(player);
      
      // Take the maximum value for each player
      this.clock.set(player, Math.max(thisValue, value));
    }
    
    return this;
  }
  
  /**
   * Serialize the vector clock to a string
   * @returns The serialized vector clock
   */
  public serialize(): string {
    return JSON.stringify(Array.from(this.clock.entries()));
  }
  
  /**
   * Deserialize a vector clock from a string
   * @param serialized The serialized vector clock
   * @returns A new vector clock
   */
  public static deserialize(serialized: string): VectorClock {
    const entries = JSON.parse(serialized) as [string, number][];
    const clock = new VectorClock();
    
    // Set the clock values from the entries
    entries.forEach(([player, value]) => {
      clock.clock.set(player, value);
    });
    
    return clock;
  }
  
  /**
   * Create a copy of this vector clock
   * @returns A new vector clock with the same values
   */
  public clone(): VectorClock {
    const clone = new VectorClock();
    
    // Copy all values
    for (const [player, value] of this.clock.entries()) {
      clone.clock.set(player, value);
    }
    
    return clone;
  }
}

export default VectorClock;
