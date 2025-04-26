# Cross-Platform Sound Architecture
*For RobinsAI.World Platform Games*

## Overview

This document outlines the cross-platform sound and haptic feedback architecture for RobinsAI.World games, designed to work consistently across Web, Android, iOS, Windows, macOS, and Linux platforms. The architecture prioritizes compatibility, performance, and consistent user experience.

## Architecture Design

### Core Principles

1. **Platform Agnostic**: Core functionality works across all target platforms
2. **Progressive Enhancement**: Basic functionality everywhere, enhanced features where supported
3. **Fallback Mechanisms**: Graceful degradation when specific features aren't available
4. **Lazy Loading**: Sounds loaded on demand to minimize initial load time
5. **Consistent API**: Uniform interface regardless of underlying implementation

### Technical Stack

The sound system uses a layered architecture:

```
┌─────────────────────────────────────────┐
│             Application Layer            │
│  (Game-specific sound triggers & logic)  │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│             Sound Manager API            │
│    (Unified interface for all sounds)    │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│         Platform Adapter Layer           │
│  (Platform-specific implementations)     │
└───────────────────┬─────────────────────┘
                    │
┌─────────┬─────────▼─────────┬───────────┐
│  Web     │  Mobile Native   │  Desktop  │
│  Audio   │  Audio Systems   │  Audio    │
│  API     │  (Android/iOS)   │  APIs     │
└─────────┴─────────┬─────────┴───────────┘
                    │
┌───────────────────▼─────────────────────┐
│             Sound Assets                 │
│    (MP3/OGG/WAV in optimized formats)    │
└─────────────────────────────────────────┘
```

## Implementation Details

### 1. Web Implementation (React/Next.js)

```typescript
// Using Web Audio API for browser environments
class WebAudioAdapter implements AudioAdapter {
  private context: AudioContext;
  private buffers: Map<string, AudioBuffer>;
  
  constructor() {
    this.context = new AudioContext();
    this.buffers = new Map();
  }
  
  async loadSound(id: string, url: string): Promise<void> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffers.set(id, audioBuffer);
  }
  
  playSound(id: string, volume: number): void {
    const buffer = this.buffers.get(id);
    if (!buffer) return;
    
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    source.start(0);
  }
  
  vibrate(pattern: number[]): void {
    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}
```

### 2. React Native Implementation (Android/iOS)

```typescript
// Using React Native Sound and Vibration APIs
import Sound from 'react-native-sound';
import { Vibration } from 'react-native';

class ReactNativeAudioAdapter implements AudioAdapter {
  private sounds: Map<string, Sound>;
  
  constructor() {
    this.sounds = new Map();
    Sound.setCategory('Playback');
  }
  
  loadSound(id: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(url, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          reject(error);
        } else {
          this.sounds.set(id, sound);
          resolve();
        }
      });
    });
  }
  
  playSound(id: string, volume: number): void {
    const sound = this.sounds.get(id);
    if (!sound) return;
    
    sound.setVolume(volume);
    sound.play();
  }
  
  vibrate(pattern: number[]): void {
    Vibration.vibrate(pattern);
  }
}
```

### 3. Desktop Implementation (Electron)

```typescript
// Using Electron's audio capabilities
import { ipcRenderer } from 'electron';

class ElectronAudioAdapter implements AudioAdapter {
  loadSound(id: string, url: string): Promise<void> {
    return ipcRenderer.invoke('load-sound', { id, url });
  }
  
  playSound(id: string, volume: number): void {
    ipcRenderer.send('play-sound', { id, volume });
  }
  
  vibrate(pattern: number[]): void {
    // Most desktops don't support vibration
    // Could potentially use gamepad rumble if available
    ipcRenderer.send('rumble-gamepad', pattern);
  }
}
```

### 4. Unified Sound Manager

```typescript
// Platform-agnostic Sound Manager
class SoundManager {
  private adapter: AudioAdapter;
  private enabled: boolean = true;
  private volume: number = 0.7;
  private hapticsEnabled: boolean = true;
  
  constructor() {
    // Select appropriate adapter based on platform
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.adapter = new WebAudioAdapter();
    } else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      this.adapter = new ReactNativeAudioAdapter();
    } else if (typeof window !== 'undefined' && 'electron' in window) {
      this.adapter = new ElectronAudioAdapter();
    } else {
      // Fallback silent implementation
      this.adapter = new NoopAudioAdapter();
    }
    
    this.loadSettings();
  }
  
  // Load user preferences
  private loadSettings(): void {
    // Implementation varies by platform
    // Web uses localStorage
    // React Native uses AsyncStorage
    // Electron uses electron-store
  }
  
  // Public API methods
  async preloadSounds(sounds: {id: string, url: string}[]): Promise<void> {
    for (const sound of sounds) {
      await this.adapter.loadSound(sound.id, sound.url);
    }
  }
  
  play(id: string, volumeOverride?: number): void {
    if (!this.enabled) return;
    this.adapter.playSound(id, volumeOverride ?? this.volume);
  }
  
  vibrate(pattern: number[]): void {
    if (!this.hapticsEnabled) return;
    this.adapter.vibrate(pattern);
  }
  
  // Settings methods
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    // Save setting
  }
  
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    // Save setting
  }
  
  setHapticsEnabled(enabled: boolean): void {
    this.hapticsEnabled = enabled;
    // Save setting
  }
}
```

## Asset Optimization for Cross-Platform

### Audio Format Strategy

| Platform | Primary Format | Fallback Format | Notes |
|----------|---------------|-----------------|-------|
| Web | MP3 | OGG | OGG for Firefox/Chrome, MP3 for Safari |
| iOS | MP3 | M4A | M4A for better iOS performance |
| Android | OGG | MP3 | OGG for smaller size on Android |
| Desktop | MP3 | WAV | WAV for highest quality when bandwidth not an issue |

### Asset Loading Strategy

1. **Progressive Loading**: Essential sounds loaded first, others on demand
2. **Preloading**: Critical sounds preloaded during idle time
3. **Caching**: Sounds cached after first load
4. **Compression**: Different compression levels based on platform capabilities

## Platform-Specific Considerations

### Web (PWA)
- Use Web Audio API for precise timing and effects
- Implement AudioContext resuming after user interaction (browser policy)
- Provide visual feedback for all sounds (accessibility)
- Use small file sizes optimized for bandwidth

### Android
- Support different audio focus modes (DUCK, PAUSE, etc.)
- Handle audio interruptions (calls, notifications)
- Optimize for wide range of device capabilities
- Use Android's native SoundPool for short sounds

### iOS
- Respect silent mode switch
- Handle audio session categories properly
- Support background audio appropriately
- Optimize for AVAudioEngine

### Desktop (Windows/macOS/Linux)
- Support system-wide volume controls
- Handle multi-output devices
- Optimize for lower latency
- Support accessibility features

## Integration with RevenueCat

The sound system integrates with RevenueCat for premium sound packs:

```typescript
// Example of premium sound pack integration
class PremiumSoundManager extends SoundManager {
  private premiumSounds: Set<string> = new Set();
  private purchases: RevenueCatPurchases;
  
  constructor(purchases: RevenueCatPurchases) {
    super();
    this.purchases = purchases;
    this.initializePremiumContent();
  }
  
  private async initializePremiumContent(): Promise<void> {
    const customerInfo = await this.purchases.getCustomerInfo();
    
    if (customerInfo.entitlements.active['premium_sounds']) {
      // User has premium sounds entitlement
      await this.loadPremiumSoundPack();
    }
    
    // Listen for purchases
    this.purchases.addCustomerInfoUpdateListener((info) => {
      if (info.entitlements.active['premium_sounds']) {
        this.loadPremiumSoundPack();
      }
    });
  }
  
  private async loadPremiumSoundPack(): Promise<void> {
    // Load premium sounds
    const premiumSounds = [
      { id: 'premium_move', url: 'sounds/premium/move.mp3' },
      { id: 'premium_capture', url: 'sounds/premium/capture.mp3' },
      // ...more premium sounds
    ];
    
    await this.preloadSounds(premiumSounds);
    
    // Mark these sounds as premium
    premiumSounds.forEach(sound => this.premiumSounds.add(sound.id));
  }
  
  // Override play method to check for premium sounds
  play(id: string, volumeOverride?: number): void {
    // If trying to play a premium sound without entitlement, use standard sound
    if (id.startsWith('premium_') && !this.premiumSounds.has(id)) {
      // Fall back to standard sound
      const standardId = id.replace('premium_', '');
      super.play(standardId, volumeOverride);
    } else {
      super.play(id, volumeOverride);
    }
  }
}
```

## Decentralized Metadata Storage

Sound preferences and custom sound packs can be stored in decentralized storage:

```typescript
// Integration with decentralized storage
class DecentralizedSoundManager extends SoundManager {
  private ipfsClient: IPFSClient;
  
  constructor(ipfsClient: IPFSClient) {
    super();
    this.ipfsClient = ipfsClient;
  }
  
  async loadUserSoundPack(cid: string): Promise<void> {
    try {
      // Load sound pack manifest from IPFS
      const manifest = await this.ipfsClient.cat(`${cid}/manifest.json`);
      const soundPack = JSON.parse(manifest.toString());
      
      // Load each sound from the pack
      for (const sound of soundPack.sounds) {
        const soundData = await this.ipfsClient.cat(`${cid}/${sound.file}`);
        const blob = new Blob([soundData], { type: sound.mimeType });
        const url = URL.createObjectURL(blob);
        
        await this.loadSound(sound.id, url);
      }
    } catch (error) {
      console.error('Failed to load sound pack from IPFS:', error);
    }
  }
  
  // Save user preferences to decentralized storage
  async savePreferences(): Promise<string> {
    const preferences = {
      volume: this.volume,
      enabled: this.enabled,
      hapticsEnabled: this.hapticsEnabled,
      // Other preferences
    };
    
    const cid = await this.ipfsClient.add(JSON.stringify(preferences));
    return cid;
  }
}
```

## Performance Benchmarks

| Platform | Load Time | Memory Usage | CPU Usage | Battery Impact |
|----------|-----------|--------------|-----------|----------------|
| Web (Chrome) | <100ms | ~5MB | <1% | Minimal |
| Web (Safari) | <120ms | ~6MB | <1% | Minimal |
| Android | <80ms | ~4MB | <2% | Low |
| iOS | <60ms | ~3MB | <1% | Very Low |
| Windows | <50ms | ~8MB | <1% | N/A |
| macOS | <40ms | ~7MB | <1% | Low |

## Implementation Roadmap

1. **Phase 1**: Core sound system with basic platform support
   - Web Audio API implementation
   - Basic sound preloading
   - Volume and mute controls

2. **Phase 2**: Enhanced platform support
   - React Native integration
   - Electron desktop support
   - Haptic feedback implementation

3. **Phase 3**: Advanced features
   - Premium sound packs via RevenueCat
   - Decentralized preferences storage
   - 3D spatial audio for immersive games

4. **Phase 4**: Optimization and expansion
   - Performance optimization
   - Additional sound packs
   - Advanced audio effects (reverb, EQ, etc.)

## Conclusion

This cross-platform sound architecture provides a consistent, high-quality audio experience across all target platforms while maintaining optimal performance and flexibility. The modular design allows for easy extension and platform-specific optimizations while presenting a unified API to game developers.

---

*This architecture document is maintained as part of the RobinsAI.World-Admin documentation and serves as the technical specification for sound implementation across platform games.*

*Last Updated: April 2025*
