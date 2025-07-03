# Save/Load & AI Tutorial Update Checklist

*Date: 2025-07-02*

## Game Logic
- [✅] Add `isValidGameState` validation in `src/game/gameState.ts`.

## Board Component (`src/components/OptimizedInteractiveBoard.tsx`)
- [✅] Integrate `AIPlayer` and manage AI state.
- [✅] Automatically trigger AI moves when it's the AI's turn.
- [✅] Validate loaded game state using `isValidGameState`.
- [✅] Expose `startAIGame` and `startMiniChallenge` via `useImperativeHandle`.

## Walkthrough System
- [✅] Update `startWalkthrough` to accept `onComplete` callbacks in `src/contexts/WalkthroughContext.tsx`.
- [✅] Invoke callback from `endWalkthrough`.

## Tutorial UI
- [✅] Extend `TutorialCard` to accept `onMiniChallengeStart` prop.
- [✅] Trigger AI mini-challenge when walkthrough finishes.

## Page Integration (`src/app/page.tsx`)
- [✅] Add sidebar option to start an AI game.
- [✅] Pass mini-challenge callback to tutorial cards.

