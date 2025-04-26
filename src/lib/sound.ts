/**
 * Sound and haptic feedback utility for General Xiang and other platform games
 * 
 * This module provides a consistent sound experience across the platform
 * with both common admin sounds and game-specific sounds.
 */

// Check if the Web Audio API is available
const isAudioSupported = typeof window !== 'undefined' && 'AudioContext' in window;

// Check if the vibration API is available
const isVibrationSupported = typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator;

// Create audio context when needed (must be created after user interaction)
let audioContext: AudioContext | null = null;

// Sound cache to avoid reloading the same sounds
const soundCache: Record<string, AudioBuffer> = {};

// Volume settings
const DEFAULT_VOLUME = 0.7;
let masterVolume = DEFAULT_VOLUME;
let soundEnabled = true;
let hapticsEnabled = true;

// Base paths for sounds
const COMMON_SOUNDS_PATH = '/sounds/common/';
const XIANGQI_SOUNDS_PATH = '/sounds/xiangqi/';

// Common platform sounds
export enum CommonSoundType {
  BUTTON_CLICK = 'button-click',
  NOTIFICATION = 'notification',
  SUCCESS = 'success',
  ERROR = 'error',
  TOGGLE = 'toggle',
  COPY = 'copy',
  PASTE = 'paste',
  DIALOG_OPEN = 'dialog-open',
  DIALOG_CLOSE = 'dialog-close',
}

// Game-specific sounds for Xiangqi
export enum XiangqiSoundType {
  PIECE_MOVE = 'piece-move',
  PIECE_CAPTURE = 'piece-capture',
  CHECK = 'check',
  GAME_START = 'game-start',
  GAME_END = 'game-end',
  INVALID_MOVE = 'invalid-move',
  PIECE_SELECT = 'piece-select',
}

// Initialize the audio context (must be called after user interaction)
export const initAudio = (): void => {
  if (isAudioSupported && !audioContext) {
    audioContext = new AudioContext();
    
    // Load common sounds into cache
    Object.values(CommonSoundType).forEach(sound => {
      loadSound(`${COMMON_SOUNDS_PATH}${sound}.mp3`, sound);
    });
    
    // Load game-specific sounds into cache
    Object.values(XiangqiSoundType).forEach(sound => {
      loadSound(`${XIANGQI_SOUNDS_PATH}${sound}.mp3`, sound);
    });
  }
};

// Load a sound file into the cache
const loadSound = async (url: string, id: string): Promise<void> => {
  if (!audioContext) return;
  
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    soundCache[id] = audioBuffer;
  } catch (error) {
    console.warn(`Failed to load sound: ${url}`, error);
  }
};

// Play a sound with optional volume override
export const playSound = (sound: CommonSoundType | XiangqiSoundType, volumeOverride?: number): void => {
  if (!soundEnabled || !audioContext) return;
  
  // Initialize audio if not already done
  if (!audioContext) {
    initAudio();
    if (!audioContext) return; // Still not available
  }
  
  // Resume audio context if it's suspended (browser policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const buffer = soundCache[sound];
  if (!buffer) {
    // If sound is not cached yet, try to load it on demand
    const isCommonSound = Object.values(CommonSoundType).includes(sound as CommonSoundType);
    const path = isCommonSound 
      ? `${COMMON_SOUNDS_PATH}${sound}.mp3` 
      : `${XIANGQI_SOUNDS_PATH}${sound}.mp3`;
    
    loadSound(path, sound).then(() => {
      playSound(sound, volumeOverride); // Try again after loading
    });
    return;
  }
  
  // Create and configure source
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Create gain node for volume control
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volumeOverride !== undefined ? volumeOverride : masterVolume;
  
  // Connect nodes
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Play the sound
  source.start(0);
};

// Trigger haptic feedback (vibration)
export const vibrate = (pattern: number | number[]): void => {
  if (!hapticsEnabled || !isVibrationSupported) return;
  
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('Vibration failed:', error);
  }
};

// Combined sound and haptic feedback for common actions
export const playFeedback = (
  sound: CommonSoundType | XiangqiSoundType, 
  vibrationPattern?: number | number[],
  volumeOverride?: number
): void => {
  playSound(sound, volumeOverride);
  
  if (vibrationPattern) {
    vibrate(vibrationPattern);
  }
};

// Predefined feedback patterns for common interactions
export const Feedback = {
  buttonClick: () => playFeedback(CommonSoundType.BUTTON_CLICK, 20),
  notification: () => playFeedback(CommonSoundType.NOTIFICATION, [20, 30, 20]),
  success: () => playFeedback(CommonSoundType.SUCCESS, [20, 30, 60]),
  error: () => playFeedback(CommonSoundType.ERROR, [60, 30, 60, 30]),
  toggle: () => playFeedback(CommonSoundType.TOGGLE, 10),
  copy: () => playFeedback(CommonSoundType.COPY, 20),
  paste: () => playFeedback(CommonSoundType.PASTE, 20),
  dialogOpen: () => playFeedback(CommonSoundType.DIALOG_OPEN, 30),
  dialogClose: () => playFeedback(CommonSoundType.DIALOG_CLOSE, 20),
  
  // Game-specific feedback
  pieceMove: () => playFeedback(XiangqiSoundType.PIECE_MOVE, 30),
  pieceCapture: () => playFeedback(XiangqiSoundType.PIECE_CAPTURE, [30, 20, 40]),
  check: () => playFeedback(XiangqiSoundType.CHECK, [40, 30, 40, 30]),
  gameStart: () => playFeedback(XiangqiSoundType.GAME_START, [20, 30, 20, 30, 60]),
  gameEnd: () => playFeedback(XiangqiSoundType.GAME_END, [60, 40, 80]),
  invalidMove: () => playFeedback(XiangqiSoundType.INVALID_MOVE, 60),
  pieceSelect: () => playFeedback(XiangqiSoundType.PIECE_SELECT, 15),
};

// Settings management
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
  localStorage.setItem('soundEnabled', enabled.toString());
};

export const setHapticsEnabled = (enabled: boolean): void => {
  hapticsEnabled = enabled;
  localStorage.setItem('hapticsEnabled', enabled.toString());
};

export const setMasterVolume = (volume: number): void => {
  masterVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  localStorage.setItem('masterVolume', masterVolume.toString());
};

// Load settings from localStorage
export const loadSoundSettings = (): void => {
  if (typeof window === 'undefined') return;
  
  const storedSoundEnabled = localStorage.getItem('soundEnabled');
  if (storedSoundEnabled !== null) {
    soundEnabled = storedSoundEnabled === 'true';
  }
  
  const storedHapticsEnabled = localStorage.getItem('hapticsEnabled');
  if (storedHapticsEnabled !== null) {
    hapticsEnabled = storedHapticsEnabled === 'true';
  }
  
  const storedVolume = localStorage.getItem('masterVolume');
  if (storedVolume !== null) {
    masterVolume = parseFloat(storedVolume);
  }
};

// Initialize settings when module is loaded
if (typeof window !== 'undefined') {
  loadSoundSettings();
}
