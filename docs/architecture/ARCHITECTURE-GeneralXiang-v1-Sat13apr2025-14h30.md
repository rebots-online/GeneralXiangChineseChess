# General Zhang: Architecture Overview
*Version 1.0 - April 13, 2025*

## Introduction

General Zhang (formerly General Xiang) is a modern implementation of the traditional Chinese Chess (Xiangqi) game, built with Next.js and designed for both educational and competitive play. This document outlines the current architecture and implementation details of the project.

## System Architecture

The application follows a client-side architecture with Next.js, with plans for peer-to-peer multiplayer functionality using Jami for decentralized communication.

### Core Components

1. **Frontend Framework**
   - Next.js 15.2.3 with Turbopack
   - React for component-based UI
   - TypeScript for type safety

2. **UI Components**
   - Shadcn UI for consistent design elements
   - Custom board rendering for Xiangqi
   - Responsive design for mobile and desktop

3. **Game Logic**
   - Pure TypeScript implementation of Xiangqi rules
   - Move validation and game state management
   - History tracking for undo functionality

4. **Multiplayer (Planned)**
   - Jami-based peer-to-peer communication
   - Game state synchronization
   - Text chat with optional audio/video

5. **Monetization (Planned)**
   - RevenueCat integration for subscription management
   - Tiered access to features and content

## Board Implementation

The Xiangqi board is implemented with the following key features:

1. **Board Structure**
   - 9 columns × 10 rows grid
   - Pieces positioned on intersections (not in spaces)
   - River boundary between rows 4 and 5
   - Palace areas with diagonal lines

2. **Rendering Approach**
   - SVG-based grid lines
   - Absolute positioning for precise placement
   - Separate rendering of grid, pieces, and indicators
   - Dark/light mode support

3. **Piece Design**
   - Traditional Chinese characters for pieces
   - Color-coded for red and blue sides
   - Visual indicators for selected pieces and valid moves
   - Accessibility attributes for screen readers

4. **Interaction Model**
   - Click-based piece selection and movement
   - Visual feedback for valid moves
   - Capture indicators for opponent pieces

## User Interface

The application features a clean, intuitive interface with:

1. **Game Controls**
   - New game, save game, load game options
   - Undo move functionality
   - Theme toggle (dark/light mode)
   - Sound settings

2. **Player Information**
   - Player names and sides
   - Turn indicators
   - Game status messages

3. **Game History**
   - Move notation display
   - Scrollable history panel

4. **Multiplayer Features (Planned)**
   - Game code generation and sharing
   - Join game functionality
   - Chat interface

## Future Enhancements

Planned enhancements include:

1. **Avatar System Integration**
   - Shared avatar system across platform games
   - Ghibli-style avatar editor
   - User profile persistence

2. **Tutorial System**
   - Interactive walkthroughs
   - Step-by-step learning guides
   - Rule explanations

3. **Mobile Optimization**
   - PWA implementation
   - Google Play Store listing
   - Touch-optimized controls

4. **Monetization**
   - Premium features
   - Subscription management
   - In-app purchases

## Technical Debt and Known Issues

Current technical considerations include:

1. **Performance Optimization**
   - Board rendering efficiency
   - State management optimization

2. **Accessibility Improvements**
   - Enhanced keyboard navigation
   - Screen reader support
   - Color contrast compliance

3. **Testing Coverage**
   - Unit tests for game logic
   - Integration tests for UI components
   - End-to-end testing

## Conclusion

The General Zhang Chinese Chess implementation provides a solid foundation for an engaging and educational gaming experience. The architecture supports both current functionality and planned enhancements, with a focus on performance, accessibility, and user experience.
