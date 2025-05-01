# General Zhang: Learn Chinese Chess & Play Opponents Across the Globe

A modern implementation of the traditional Chinese Chess (Xiangqi) game, built with Next.js and planned Jami integration for peer-to-peer communication. Learn the ancient game of Chinese Chess and connect with players worldwide.

## Features

- Interactive Chinese Chess board with traditional piece designs
- Authentic board layout with pieces positioned on intersections
- Proper palace diagonals and river boundary markings
- Dark/light mode theme support
- Interactive tutorials with step-by-step walkthroughs
- Sound effects and haptic feedback
- Performance-optimized rendering
- Responsive design for all screen sizes
- Planned features:
  - AI opponents with adjustable difficulty levels
  - Peer-to-peer multiplayer using Jami
  - Advanced learning resources
  - Subscription tiers with RevenueCat integration
  - Integration with shared avatar system

## Development

To get started with development:

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.development` file with required environment variables
4. Run the development server with `npm run dev`
5. Open [http://localhost:9002](http://localhost:9002) in your browser

## Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Production Build

To create a production build:

1. Create a `.env.production` file with required environment variables
2. Run the production build script:

```bash
# On Unix/Linux/macOS
chmod +x scripts/build-production.sh
./scripts/build-production.sh

# On Windows
# Use Git Bash or WSL to run the script
```

Alternatively, you can run the build commands manually:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

## Deployment

The application is configured for deployment on various platforms:

### Vercel

The easiest way to deploy is using Vercel:

1. Connect your repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy with the default settings

### Docker

A Dockerfile is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t general-zhang .

# Run the container
docker run -p 3000:3000 general-zhang
```

### Manual Deployment

For manual deployment to a Node.js server:

1. Build the application as described above
2. Copy the `.next` directory, `public` directory, and `package.json` to your server
3. Run `npm ci --production` to install production dependencies
4. Start the server with `npm start`

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
