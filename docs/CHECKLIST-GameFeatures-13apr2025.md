# General Xiang Chinese Chess - Feature Checklist
*Last Updated: April 13, 2025*

## Core Game Features

- [✅] Basic game board with proper 3x3 palace diagonals
- [✅] Piece movement according to Xiangqi rules
- [✅] Turn-based gameplay
- [✅] Check and checkmate detection
- [✅] Player name customization
- [✅] Sound and haptic feedback
- [✅] Dark/light mode toggle
- [✅] Move history display
- [✅] Undo move functionality

## Multiplayer Features

- [✅] Game code generation for hosting
- [✅] Clipboard integration for sharing codes
- [✅] Join game functionality
- [ ] Jami-based game state multicaster implementation
- [ ] **Player-to-player text chat**
  - [ ] Always-present chat interface below the board
  - [ ] Emoji support
  - [ ] Sound effect buttons for quick reactions
  - [ ] Typing indicators
  - [ ] Message history
  - [ ] Optional audio call button
  - [ ] Optional video call button
- [ ] Spectator mode for observers

## User Experience

- [✅] Toast notifications for user actions
- [✅] Responsive design for different screen sizes
- [✅] Improved walkthrough annotations with better readability
- [ ] Comprehensive tutorial mode
- [ ] Accessibility features (screen reader support, keyboard navigation)
- [ ] Localization support (multiple languages)
- [ ] User preferences persistence

## Visual and Audio

- [✅] Sound settings panel
- [✅] Haptic feedback toggle
- [✅] Volume control
- [✅] Basic placeholder sounds for all game actions
- [ ] Professional sound recordings (current sounds are basic placeholders)
- [ ] Background music options
- [ ] Additional sound packs
- [ ] Piece animation effects
- [ ] Board themes and customization
- [ ] Player avatars (.glb format)

## Account and Monetization

- [ ] RevenueCat account setup
- [ ] User profile management
- [ ] Game history and statistics
- [ ] Premium features (additional themes, sound packs)
- [ ] Decentralized metadata storage

## Platform Integration

- [ ] PWA conversion for offline play
- [ ] Google Play Store listing preparation
- [ ] Android app packaging
- [ ] iOS app packaging
- [ ] Cross-platform save synchronization

## Technical Improvements

- [ ] Performance optimization for mobile devices
- [ ] Reduced bundle size
- [ ] Improved loading times
- [ ] Offline functionality
- [ ] Automated testing suite

## Documentation

- [✅] Sound architecture documentation
- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
- [ ] Contribution guidelines

## Implementation Notes

### Sound System Status

The current sound implementation uses basic placeholder sounds generated with simple sine waves:

1. **Current Implementation**:
   - Basic placeholder sounds for all game actions (piece movement, captures, etc.)
   - Simple sine wave tones with different frequencies and durations
   - Located in `/public/sounds/common/` and `/public/sounds/xiangqi/`
   - Generated using ffmpeg with the script in `/scripts/generate-placeholder-sounds.sh`

2. **Required Improvements**:
   - Replace placeholder sounds with professional recordings
   - Source authentic wooden piece sounds, traditional Chinese music elements
   - Consider licensing options from sources mentioned in the sound architecture document
   - Implement more complex sound variations for repeated actions

3. **Priority Sounds to Replace**:
   - Piece movement and capture sounds (most frequently heard)
   - Game start/end sounds (important for player experience)
   - UI interaction sounds (buttons, toggles, etc.)

These placeholder sounds serve as functional proof of concept but should be replaced with high-quality recordings before release.

### Player-to-Player Text Chat

The text chat feature should be implemented with the following considerations:

1. **UI Placement**:
   - Primary option: Collapsible panel below the game board
   - Alternative: Side panel that can be toggled on smaller screens

2. **Core Functionality**:
   - Real-time messaging using the Jami multicaster
   - Message persistence during the game session
   - Simple text formatting (bold, italic)
   - Emoji picker
   - Sound effect buttons for quick reactions (applause, thinking, etc.)

3. **Integration Points**:
   - Initialize chat when game connection is established
   - Link chat session to game code
   - Preserve chat history with game state

4. **Technical Approach**:
   - Use the same Jami connection as the game state multicaster
   - Implement message queue for offline/reconnection scenarios
   - Add typing indicators with debounce
   - Include timestamp and sender information with each message

5. **UI Components Needed**:
   - Chat container
   - Message list with auto-scroll
   - Input field with send button
   - Emoji picker component
   - Sound effect button panel
   - Audio/video call buttons
   - Collapse/expand toggle

6. **Accessibility Considerations**:
   - Screen reader support for messages
   - Keyboard shortcuts for common actions
   - High contrast mode compatibility
   - Message notifications for visually impaired users

This feature will significantly enhance player engagement and provide a seamless communication channel that keeps users on the platform rather than requiring external messaging apps.

---

*This checklist will be updated as features are implemented and new requirements are identified.*
