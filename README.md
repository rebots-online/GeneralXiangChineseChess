# General Zhang: Learn Chinese Chess & Play Opponents Across the Globe

A modern implementation of the traditional Chinese Chess (Xiangqi) game, built with Next.js and planned Jami integration for peer-to-peer communication. Learn the ancient game of Chinese Chess and connect with players worldwide.

## Features

- Interactive Chinese Chess board with traditional piece designs
- Authentic board layout with pieces positioned on intersections
- Proper palace diagonals and river boundary markings
- Dark/light mode theme support
- Planned features:
  - AI opponents with adjustable difficulty levels
  - Peer-to-peer multiplayer using Jami
  - Interactive tutorials and learning resources
  - Subscription tiers with RevenueCat integration
  - Integration with shared avatar system

## Development

To get started with development:

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open [http://localhost:9002](http://localhost:9002) in your browser

## Project Structure

The project follows a structured organization with documentation using a standardized naming convention:

```bash
docs/
├── architecture/    # System design and architectural documents
├── billing/         # Revenue and payment system documentation
├── checklists/      # Development checklists and progress tracking
└── roadmaps/        # Future development plans and roadmaps
```

## Documentation Naming Convention

All documentation follows the format:
`DOCUMENT-TYPE-ProjectName-v#-DayDDmmmYYYY-HHhMM.md`

For example:

- `ARCHITECTURE-GeneralZhang-v1-Sat13apr2025-14h30.md`
- `ROADMAP-GeneralZhang-v1-Sat13apr2025-14h35.md`
- `CHECKLIST-GeneralZhang-v1-Sat13apr2025-14h40.md`

## Architecture

General Zhang follows a client-side architecture with Next.js, with plans for peer-to-peer multiplayer functionality using Jami for decentralized communication. The game features:

- SVG-based board rendering with proper Xiangqi layout
- TypeScript implementation of game rules and logic
- React component-based UI with Shadcn UI elements
- Planned integration with shared platform services

See the documentation in the `docs/architecture/` directory for more details.
