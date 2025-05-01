# General Xiang: Chinese Chess Project Resume

## Current Status
The General Xiang Chinese Chess application is currently in development with the following features implemented:

- Interactive Xiangqi board with proper piece placement
- Dark/Light mode toggle with persistent preferences
- Responsive design for various screen sizes
- Collapsible sidebar navigation with hamburger menu
- Palace diagonal lines (3×3 size) and river markings with proper styling
- Piece rendering with traditional Chinese characters
- Sound effects for game actions with volume control
- Basic game mechanics including piece movement, capture, and turn-based play

## Next Steps
The following tasks are planned for immediate implementation:

1. **Game Mechanics**
   - Add game history and notation
   - Implement special rules (perpetual check, etc.)
   - Add save/load game functionality

2. **Multiplayer Features**
   - Fix Jami integration for online multiplayer
   - Implement basic AI for single player
   - Add user accounts and profiles

3. **Tutorial Content**
   - Complete step-by-step guides for basic rules
   - Add opening strategy tutorials
   - Add advanced tactics tutorials

4. **Infrastructure**
   - Set up MCP servers for hybrid Knowledge Graph
   - Configure for Windows environment
   - Fix sidepanel load/save game functionality

## Branding Guidelines
- The project should be branded as 'General Xiang: Learn Chinese Chess & Play Opponent Across the Globe'
- The Xiangqi board includes palace diagonal lines, river markings with phrases 'River of the Chu' and 'Border of the Han'
- Small crosses mark the starting points of soldiers and cannons

## Future Plans
- Convert the web app to PWA for mobile installation
- Create Android store listing
- Implement AI opponents with varying difficulty levels

## Technical Debt
- Refactor the board rendering for better performance
- Improve responsive design for very small screens
- Optimize dark mode implementation
- Fix MCP server configuration for Windows environment (see `docs\MCP_SERVER_CONFIGURATION.md`)
- Resolve Jami integration issues (see `docs\JAMI_INTEGRATION_ISSUES.md` and `docs\JAMI_WINDOWS_DIAGNOSTIC_CHECKLIST.md`)
- Fix sidepanel load/save game functionality
- Implement proper error handling for network operations
