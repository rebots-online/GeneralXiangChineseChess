// MIT License word list - common, easy to spell English words
const commonWords = [
  // Animals
  "dog", "cat", "fox", "wolf", "bear", "deer", "frog", "bird", "fish", "duck",
  "goat", "lion", "tiger", "zebra", "snake", "eagle", "hawk", "swan", "crow", "owl",
  
  // Colors
  "red", "blue", "green", "gold", "pink", "black", "white", "gray", "brown", "teal",
  
  // Nature
  "tree", "lake", "rock", "hill", "moon", "star", "sun", "rain", "snow", "wind",
  "leaf", "seed", "rose", "pine", "oak", "moss", "sand", "wave", "fire", "ice",
  
  // Food
  "cake", "bread", "rice", "corn", "bean", "pear", "plum", "grape", "peach", "apple",
  "milk", "tea", "soup", "fish", "beef", "pork", "salt", "sugar", "honey", "mint",
  
  // Objects
  "book", "door", "key", "lamp", "desk", "chair", "clock", "phone", "pen", "cup",
  "bowl", "plate", "fork", "knife", "spoon", "ring", "hat", "coat", "shoe", "bag",
  
  // Adjectives
  "big", "small", "tall", "short", "fast", "slow", "hot", "cold", "new", "old",
  "good", "bad", "soft", "hard", "light", "dark", "loud", "quiet", "clean", "dirty",
  
  // Verbs
  "run", "walk", "jump", "swim", "fly", "sing", "dance", "read", "write", "talk",
  "eat", "drink", "sleep", "wake", "laugh", "smile", "cry", "think", "know", "see"
];

/**
 * Generates a memorable game code using three random words
 * @returns A string with three random words separated by hyphens
 */
export const generateWordGameCode = (): string => {
  const words: string[] = [];
  
  // Select three random words
  while (words.length < 3) {
    const randomIndex = Math.floor(Math.random() * commonWords.length);
    const word = commonWords[randomIndex];
    
    // Ensure no duplicate words
    if (!words.includes(word)) {
      words.push(word);
    }
  }
  
  // Join words with hyphens
  return words.join("-");
};

/**
 * Validates if a string is a valid word-based game code
 * @param code The code to validate
 * @returns True if the code is valid, false otherwise
 */
export const isValidWordGameCode = (code: string): boolean => {
  if (!code) return false;
  
  const words = code.split("-");
  
  // Check if we have exactly 3 words
  if (words.length !== 3) return false;
  
  // Check if all words are in our dictionary
  return words.every(word => commonWords.includes(word.toLowerCase()));
};

/**
 * Formats a word-based game code to ensure proper formatting
 * @param code The code to format
 * @returns A properly formatted game code
 */
export const formatWordGameCode = (code: string): string => {
  if (!code) return "";
  
  // Convert to lowercase and split by any separator (space, comma, hyphen, etc.)
  const words = code.toLowerCase().split(/[\s,-_]+/).filter(word => word.length > 0);
  
  // Take only the first 3 words if there are more
  const validWords = words.slice(0, 3);
  
  // Join with hyphens
  return validWords.join("-");
};
