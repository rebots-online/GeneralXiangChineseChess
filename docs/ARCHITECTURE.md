# General Xiang Architecture

## Overview
General Xiang is a web-based Chinese Chess (Xiangqi) application built with Next.js, React, and Tailwind CSS. The application is designed to be responsive, accessible, and educational, with a focus on helping users learn the game while providing an engaging playing experience.

## Component Structure

### Core Components
- **InteractiveBoard**: The main game board component that renders the Xiangqi board, pieces, and handles interactions.
- **Sidebar**: Navigation component that provides access to game options and learning resources.
- **TutorialCard**: Educational component that provides step-by-step walkthroughs of game concepts.

### State Management
- **Local State**: React's useState and useEffect hooks for component-level state.
- **Persistence**: localStorage for saving user preferences (theme, sidebar state).
- **Future**: Potential implementation of Context API or Redux for global state management.

## UI Framework
- **Shadcn/UI**: A collection of reusable components built on Radix UI.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Custom Components**: Extended UI components for game-specific needs.

## Responsive Design
- Mobile-first approach with responsive breakpoints.
- Collapsible sidebar for smaller screens.
- Adaptive layout for different device sizes.

## Theme System
- Light and dark mode support.
- Persistent theme preference.
- Automatic system preference detection.

## Game Logic
- Board representation using a 2D array.
- Piece movement validation based on Xiangqi rules.
- Game state management for tracking turns, captures, and game progress.

## Tutorial System
- Walkthrough-style onboarding experience.
- Highlighting specific board elements during tutorials.
- Step-by-step guides for learning game concepts.

## Future Architecture Considerations
- **PWA Support**: Service workers for offline functionality.
- **Multiplayer**: WebSocket integration for real-time gameplay.
- **AI Opponents**: Implementation of game AI with varying difficulty levels.
- **Analytics**: Tracking user progress and game statistics.

## Deployment
- **Development**: Local development server.
- **Production**: Static site generation with Next.js.
- **Future**: Potential serverless functions for multiplayer support.
