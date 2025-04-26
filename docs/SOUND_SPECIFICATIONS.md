# Sound and Haptic Feedback Specifications
*For RobinsAI.World Platform Games*

## Overview

This document outlines the standardized sound and haptic feedback system implemented across the RobinsAI.World platform games, including General Xiang Chinese Chess, MahCheungg, and future titles. The goal is to create a consistent, accessible, and engaging audio experience that enhances gameplay while maintaining platform-wide consistency.

## Sound Categories

Our sound system is divided into two main categories:

1. **Common Platform Sounds**: Consistent across all games and applications
2. **Game-Specific Sounds**: Unique to each game but following shared design principles

## Common Platform Sounds

These sounds are used for UI interactions and system events across all platform applications:

| Sound ID | Description | Duration | Character | Use Cases |
|----------|-------------|----------|-----------|-----------|
| `button-click` | Soft click | 50-100ms | Clean, subtle | Button presses, menu selections |
| `notification` | Gentle alert | 300-500ms | Bright, attention-grabbing | Toast notifications, alerts |
| `success` | Positive confirmation | 500-800ms | Uplifting, pleasant | Task completion, achievements |
| `error` | Error indication | 300-500ms | Discordant, cautionary | Invalid actions, errors |
| `toggle` | State change | 50-100ms | Mechanical, distinct | Switches, toggles, checkboxes |
| `copy` | Copy to clipboard | 100-200ms | Paper-like, crisp | Copy operations |
| `paste` | Paste from clipboard | 100-200ms | Soft landing, placement | Paste operations |
| `dialog-open` | Dialog appearance | 200-300ms | Expanding, revealing | Modal/dialog opening |
| `dialog-close` | Dialog dismissal | 150-250ms | Contracting, concluding | Modal/dialog closing |

## Game-Specific Sounds: General Xiang Chinese Chess

Sounds specific to the Xiangqi (Chinese Chess) experience:

| Sound ID | Description | Duration | Character | Use Cases |
|----------|-------------|----------|-----------|-----------|
| `piece-move` | Moving a piece | 200-300ms | Wooden, solid | Standard piece movement |
| `piece-capture` | Capturing a piece | 300-500ms | Impact, decisive | When a piece captures another |
| `check` | Check announcement | 400-600ms | Urgent, warning | When a player is in check |
| `game-start` | Game beginning | 800-1200ms | Ceremonial, anticipatory | Start of a new game |
| `game-end` | Game conclusion | 1000-1500ms | Resolving, conclusive | End of game (win/loss/draw) |
| `invalid-move` | Invalid move attempt | 200-300ms | Negative, blocking | When an illegal move is attempted |
| `piece-select` | Piece selection | 50-100ms | Light, responsive | When selecting a piece to move |

## Haptic Feedback Patterns

Haptic feedback (vibration) is synchronized with sounds for enhanced tactile experience:

| Interaction | Vibration Pattern (ms) | Intensity |
|-------------|------------------------|-----------|
| Button Click | 20 | Light |
| Notification | [20, 30, 20] | Medium |
| Success | [20, 30, 60] | Medium |
| Error | [60, 30, 60, 30] | Strong |
| Toggle | 10 | Very Light |
| Piece Move | 30 | Light |
| Piece Capture | [30, 20, 40] | Medium |
| Check | [40, 30, 40, 30] | Strong |
| Game Start | [20, 30, 20, 30, 60] | Medium-Strong |
| Game End | [60, 40, 80] | Strong |

## Technical Implementation

### Sound File Specifications
- **Format**: MP3 (primary), with OGG fallback for broader compatibility
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128-192kbps
- **Channels**: Stereo
- **Normalization**: -3dB peak

### File Structure
```
/public/sounds/
  ├── common/
  │   ├── button-click.mp3
  │   ├── notification.mp3
  │   ├── success.mp3
  │   └── ...
  ├── xiangqi/
  │   ├── piece-move.mp3
  │   ├── piece-capture.mp3
  │   └── ...
  └── mahcheungg/
      ├── tile-place.mp3
      ├── tile-draw.mp3
      └── ...
```

### Volume Control
- **Master Volume**: Global setting affecting all sounds
- **Default Level**: 70% (0.7)
- **Persistence**: Settings stored in localStorage

### Accessibility Considerations
- All sound feedback has corresponding visual feedback
- Sounds can be completely disabled via settings
- Haptic feedback can be independently enabled/disabled
- High contrast between UI sounds and game sounds

## User Settings

The following settings are available to users:

1. **Sound Effects**: Enable/disable all sounds
2. **Volume**: Control master volume (0-100%)
3. **Haptic Feedback**: Enable/disable vibration
4. **Sound Test**: Button to test current sound settings

## Integration with Knowledge Graph

Sound specifications are integrated with the hybrid Knowledge Graph (hKG) for consistent cross-platform implementation:

- **Neo4j**: Stores relationships between sounds, their usage contexts, and associated UI elements
- **Qdrant**: Embeds sound descriptions and characteristics for semantic retrieval
- **PostgreSQL**: Logs sound playback for analytics and user experience optimization

## Future Enhancements

1. **Spatial Audio**: Implementation of 3D audio for immersive gameplay
2. **Adaptive Soundscapes**: Dynamic background audio that responds to game state
3. **Custom Sound Packs**: Allow users to select different sound themes
4. **Voice Announcements**: Optional voice feedback for key game events
5. **Sound Visualization**: Visual representations of sounds for accessibility

---

*This specification is maintained as part of the RobinsAI.World-Admin documentation and serves as the authoritative reference for sound implementation across platform games.*

*Last Updated: April 2025*
