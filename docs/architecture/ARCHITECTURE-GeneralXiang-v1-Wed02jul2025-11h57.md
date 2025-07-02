# GeneralXiang Architecture Snapshot - Wed 02 Jul 2025

This document provides a high-level view of the repository structure after recent maintenance.

## Top-level directories

- `.github` – workflow definitions
- `docs` – documentation (architecture, billing, checklists, roadmaps)
- `public` – static assets
- `src` – application source
- `scripts` – build/deployment scripts

## Key source subdirectories

- `src/ai` – AI related utilities
- `src/app` – Next.js app routes
- `src/components` – React components
- `src/contexts` – React contexts
- `src/game` – game logic and state
- `src/hooks` – custom hooks
- `src/lib` – helper libraries (sound etc.)
- `src/services` – service classes (auth, billing, etc.)
- `src/styles` – global styles
- `src/utils` – utility functions

This snapshot reflects the project structure after fixing TypeScript errors and adjusting Jest configuration.
