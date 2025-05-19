import { GameState } from '@/game/gameState';

/**
 * Types of transposition table entries
 */
export enum EntryType {
  EXACT, // Exact score
  LOWER_BOUND, // Lower bound score (alpha cutoff)
  UPPER_BOUND  // Upper bound score (beta cutoff)
}

/**
 * Transposition table entry
 */
export interface TableEntry {
  hash: string;         // Position hash
  depth: number;        // Search depth
  score: number;        // Evaluation score
  type: EntryType;      // Type of score (exact, lower bound, upper bound)
  bestMove?: string;    // Best move found in string format
  timestamp: number;    // When the entry was created
}

/**
 * Simple hash function for game state
 * Generates a string hash based on piece positions
 */
export function hashGameState(gameState: GameState): string {
  // Create a string representation of the board position
  const pieces = gameState.board.pieces.map(p => 
    `${p.type}${p.side}${p.position[0]},${p.position[1]}`
  ).sort().join('|');
  
  // Include the current turn in the hash
  return `${pieces}|turn:${gameState.currentTurn}`;
}

/**
 * Transposition table implementation
 * Used to cache previously evaluated positions
 */
export class TranspositionTable {
  private table: Map<string, TableEntry>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 10000) {
    this.table = new Map<string, TableEntry>();
    this.maxSize = maxSize;
  }

  /**
   * Store an entry in the table
   */
  public store(
    hash: string, 
    depth: number, 
    score: number, 
    type: EntryType, 
    bestMove?: string
  ): void {
    // Check if table is full
    if (this.table.size >= this.maxSize) {
      this.evictOldEntries();
    }

    // Store the entry
    this.table.set(hash, {
      hash,
      depth,
      score,
      type,
      bestMove,
      timestamp: Date.now()
    });
  }

  /**
   * Look up an entry in the table
   */
  public lookup(hash: string, depth: number): TableEntry | null {
    const entry = this.table.get(hash);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Only use entries that have equal or greater depth
    if (entry.depth >= depth) {
      this.hits++;
      return entry;
    }

    this.misses++;
    return null;
  }

  /**
   * Evict old entries when table is full
   * Simple strategy: remove oldest entries
   */
  private evictOldEntries(): void {
    // Sort entries by timestamp and remove oldest 20%
    const entries: [string, TableEntry][] = Array.from(this.table.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove the oldest 20% of entries
    const entriesToRemove = Math.floor(this.maxSize * 0.2);
    for (let i = 0; i < entriesToRemove; i++) {
      if (entries[i]) {
        this.table.delete(entries[i][0]);
      }
    }
  }

  /**
   * Clear the table
   */
  public clear(): void {
    this.table.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get table statistics
   */
  public getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const totalLookups = this.hits + this.misses;
    const hitRate = totalLookups === 0 ? 0 : this.hits / totalLookups;
    
    return {
      size: this.table.size,
      hits: this.hits,
      misses: this.misses,
      hitRate
    };
  }

  /**
   * Resize the table
   */
  public resize(newSize: number): void {
    this.maxSize = newSize;
    if (this.table.size > this.maxSize) {
      this.evictOldEntries();
    }
  }
}
