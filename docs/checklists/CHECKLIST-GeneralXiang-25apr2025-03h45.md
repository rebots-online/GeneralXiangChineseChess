# General Xiang Chinese Chess - Development Checklist

## Phase 1: Project Setup and Core UI Components
- [ ] Configure environment variables for API keys
- [ ] Set up project structure (components, lib, hooks, etc.)
- Board Component Refactoring:
    - [ ] Refactor board representation to place pieces ON intersections instead of in spaces
    - [ ] Update board grid to 10x9 dimensions with proper line rendering
    - [ ] Implement river and palace visual indicators
    - [ ] Create proper coordinate system for piece placement
- Piece Components:
    - [ ] Design and implement piece components with traditional Chinese characters
    - [ ] Create proper styling for red and black pieces
    - [ ] Implement piece selection and highlighting
    - [ ] Add animations for piece movement and capture

## Phase 2: Game Logic Implementation
- Core Game Rules:
    - [✅] Implement piece movement rules for all piece types
    - [✅] Add movement validation logic
    - [✅] Implement capture mechanics
    - [✅] Add check and checkmate detection
- Special Rules:
    - [✅] Implement the "flying general" rule
    - [✅] Add the "general confined to palace" rule
    - [✅] Implement the "elephant cannot cross river" rule
    - [✅] Add the "horse leg obstruction" rule
- Game Flow:
    - [✅] Implement turn-based gameplay
    - [✅] Add game start and end conditions
    - [✅] Implement draw conditions
    - [✅] Add game result determination
- Move Generation and Validation:
    - [✅] Create utility functions for generating legal moves
    - [✅] Implement move validation system
    - [✅] Add special move validation for each piece type
    - [✅] Implement position evaluation functions

## Phase 3: AI Integration
- AI Player Implementation:
    - [✅] Create AIPlayer class implementing the Player interface
    - [✅] Implement basic decision-making logic
    - [✅] Add difficulty levels
    - [✅] Implement personality traits for AI players
- Genkit Integration:
    - [✅] Set up Genkit with Google's Gemini model
    - [✅] Implement analyze-game-state flow
    - [✅] Create suggest-move flow
    - [✅] Develop generate-opening-tutorial flow
- AI Opponent Features:
    - [✅] Implement AI move selection algorithm
    - [✅] Add thinking time simulation
    - [✅] Create AI personality profiles
    - [✅] Implement adaptive difficulty based on player skill

## Phase 4: Jami Integration for Networking
- Jami SDK Integration:
    - [✅] Set up Jami SDK in the project
    - [✅] Implement basic Jami connection management
    - [✅] Add user authentication with Jami
    - [✅] Create peer discovery for LAN play
  - Game State Transport:
    - [✅] Implement game state serialization
    - [✅] Create message embedding system for game state
    - [✅] Add multicast messaging for state updates
    - [✅] Implement conflict resolution with timestamps
  - Communication Features:
    - [✅] Add text chat functionality
    - [ ] Implement voice chat integration
    - [ ] Add video chat capabilities
    - [ ] Create emoji and reaction system
- Connection Management:
    - [✅] Implement connection status monitoring
    - [✅] Add reconnection logic
    - [✅] Create timeout fallbacks for disconnected players
    - [✅] Implement game state recovery after disconnection

## Phase 5: Subscription and Payment Integration
- RevenueCat Integration:
    - [X] Configure subscription tiers
    - [X] Implement subscription management
    - [X] Add feature gating based on subscription level
- Authentication System:
    - [X] Create user profile management
    - [X] Add session management
    - [X] Implement secure token storage
- Payment Processing:
    - [X] Integrate Stripe for payment processing
    - [X] Add WebLN for crypto payments
    - [X] Implement subscription upgrade/downgrade logic
    - [X] Create receipt and transaction history
- Billing Interface Standardization:
    - [X] Create standardized billing interface that works across games
    - [X] Implement modular permissions system for different purchase types
    - [X] Design flexible pricing models for various bundle offerings
    - [X] Maintain consistent UI/UX while allowing for subtle theming differences

## Phase 6: Teaching Module
- Tutorial System:
    - [ ] Create interactive tutorial framework
    - [ ] Implement step-by-step guides for beginners
    - [ ] Add interactive exercises
    - [ ] Create progress tracking system
- Opening Strategies:
    - [ ] Implement opening strategy tutorials
    - [ ] Create interactive opening practice
    - [ ] Add opening database
    - [ ] Implement opening explorer
- Advanced Techniques:
    - [ ] Create tutorials for tactical patterns
    - [ ] Implement endgame scenario practice
    - [ ] Add problem-solving exercises
    - [ ] Create skill assessment system

## Phase 7: UI Refinement and User Experience
- UI Polish:
    - [ ] Refine board and piece visuals
    - [ ] Implement responsive design for different devices
    - [ ] Add animations and transitions
    - [ ] Create dark/light mode toggle
- Game Controls:
    - [ ] Implement game control panel
    - [ ] Add undo/redo functionality
    - [ ] Create game settings menu
    - [ ] Implement save/load game feature
- Accessibility:
    - [ ] Add keyboard navigation
    - [ ] Implement screen reader support
    - [ ] Create high-contrast mode
    - [ ] Add customizable text size
- Localization:
    - [ ] Implement multi-language support
    - [ ] Add translations for major languages
    - [ ] Create localized tutorials
    - [ ] Implement region-specific features

## Phase 8: Testing and Deployment
- Unit Testing:
    - [ ] Create tests for game logic
    - [ ] Implement tests for AI components
    - [ ] Add tests for networking features
    - [ ] Create tests for subscription system
- Integration Testing:
    - [ ] Test game flow end-to-end
    - [ ] Verify multiplayer functionality
    - [ ] Test subscription tier features
    - [ ] Validate payment processing
- Performance Optimization:
    - [ ] Optimize rendering performance
    - [ ] Improve state management efficiency
    - [ ] Reduce network payload size
    - [ ] Implement caching strategies
- Deployment:
    - [ ] Configure production build
    - [ ] Implement analytics
    - [ ] Set up error tracking
    - [ ] Create backup and recovery procedures
- PWA Preparation:
    - [ ] Configure service workers
    - [ ] Add manifest file
    - [ ] Implement offline functionality
    - [ ] Add install prompts
- App Store Preparation:
    - [ ] Prepare app store assets
    - [ ] Create app store listings
    - [ ] Plan for review process
    - [ ] Set up update pipeline
