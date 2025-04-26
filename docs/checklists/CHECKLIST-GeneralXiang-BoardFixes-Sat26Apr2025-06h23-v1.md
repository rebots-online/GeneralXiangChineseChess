# General Xiang: Board Fixes Checklist

*Version: v1*
*Date: Saturday, April 26, 2025 - 06:23*

## Walkthrough and UI Improvements

### Walkthrough Visibility
- [x] Fix Step 4 in the introductory walkthrough to ensure it's visible above the board
- [x] Implement proper z-indexing to keep walkthrough content in the top layer
- [x] Add auto-scroll feature to ensure relevant content is in view

### Annotation Visibility
- [x] Add glow effect to annotation boxes similar to board elements
- [x] Increase contrast between annotation boxes and background
- [x] Add subtle animation when new annotations appear to draw attention

### Billing Interface Standardization
- [ ] Create standardized billing interface that works across all games
- [ ] Implement modular permissions system for different purchase types
- [ ] Design flexible pricing models for various bundle offerings
- [ ] Maintain consistent UI/UX while allowing for subtle theming differences

### About/Help Sections
- [x] Remove Jami logo from the game interface
- [x] Add proper About and Help sections to the menu
- [x] Include information about the decentralized platform
- [x] Ensure proper attribution based on Jami's license requirements

### Sidebar Menu Planning
- [x] Reorganize sidebar menu with better structure
- [x] Add Settings/Preferences section
- [x] Add About/Help section
- [ ] Consider adding User Profile/Account section if applicable

## Project Organization
- [x] Create docs/ folder with appropriate subfolders
- [x] Move existing documentation to appropriate folders
- [x] Create new GAMES-BILLING-REVENUECAT-MODULES document
- [x] Implement new timestamp protocol for filenames

## Implementation Priority
1. Walkthrough visibility fixes
2. Annotation box improvements
3. About/Help sections
4. Billing interface design
5. Sidebar menu reorganization

## Notes
- The walkthrough should be fully modal, preventing all interaction with game elements during the tutorial
- Billing interface should support modular permissions across games
- About/Help sections should include information about the decentralized platform
- Consider subtle theming variations between different game categories
