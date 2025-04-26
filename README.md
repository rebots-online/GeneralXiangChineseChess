# General Xiang: Learn Chinese Chess & Play Opponents Across the Globe

A modern implementation of the traditional Chinese Chess (Xiangqi) game, built with Next.js and Jami for peer-to-peer communication. Learn the ancient game of Chinese Chess and connect with players worldwide.

## Features

- Interactive Chinese Chess board with traditional piece designs
- AI opponents with adjustable difficulty levels
- Peer-to-peer multiplayer using Jami
- Interactive tutorials and learning resources
- Subscription tiers with RevenueCat integration

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
- `ARCHITECTURE-GeneralXiang-v1-Sat26apr2025-06h30.md`
- `GAMES-BILLING-REVENUECAT-MODULES-v1-Sat26apr2025-06h23.md`

## Architecture

General Xiang follows the same architecture as MahCheungg, using Jami for both player communication and game state transport. See the documentation in the `docs/architecture/` directory for more details.
