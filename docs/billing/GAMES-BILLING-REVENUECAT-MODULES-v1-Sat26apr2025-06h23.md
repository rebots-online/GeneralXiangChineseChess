# Games Billing System with RevenueCat - Modular Permissions

*Document Version: v1*  
*Created: Saturday, April 26, 2025 - 06:23*

## Overview

This document outlines the standardized billing interface and modular permissions system for the General Xiang gaming platform. The system is designed to provide a consistent user experience across different games while allowing for flexible pricing models and purchase options.

## Core Principles

1. **Unified Billing Interface**: All games share a consistent billing UI/UX while allowing for subtle theming differences between game categories.
2. **Modular Permissions**: Permissions are managed at both the platform and individual game levels.
3. **Flexible Pricing Models**: Support for various pricing structures including individual purchases, bundles, and subscriptions.
4. **Cross-Game Entitlements**: Enable offerings like "Any 3 games for $X/month" with efficient permission management.

## Game Categories & Theming

While maintaining a consistent platform experience, subtle theming variations will differentiate game categories:

- **Chinese Traditional Games** (Xiangqi, Mahjong): Traditional Chinese aesthetic with red/gold accents
- **Card Games** (Euchre, etc.): Card-themed visuals with green/red accents
- **Board Games** (Backgammon, Pente): Wooden board aesthetic with natural tones
- **Casino Games**: Vegas-inspired styling with vibrant colors

## RevenueCat Integration

### Product Structure

Products in RevenueCat will follow this hierarchy:

```
- Platform Entitlements
  - All Access Pass
  - Game Category Passes
    - Chinese Games Pass
    - Card Games Pass
    - Board Games Pass
    - Casino Games Pass
  
- Individual Game Entitlements
  - General Xiang (Chinese Chess)
  - MahCheungg (Mahjong)
  - Pente
  - Backgammon
  - Euchre
  - etc.
```

### Offering Types

1. **Individual Game Purchase**
   - One-time purchase for permanent access to a specific game
   - Monthly/annual subscription for a specific game with premium features

2. **Category Bundles**
   - Access to all games within a specific category
   - Available as subscription or one-time purchase

3. **Mix & Match Bundles**
   - "Choose any X games" subscription model
   - Implemented using a counter entitlement in RevenueCat

4. **All Access Pass**
   - Access to all games on the platform
   - Premium tier with additional features across all games

## Permission Management System

The permission system will operate on two levels:

### Platform-Level Permissions

- Managed by the core platform
- Controls access to game categories and bundles
- Handles cross-game entitlements

### Game-Level Permissions

- Specific features within each game
- Premium content or modes
- In-game purchases or upgrades

## Implementation Guidelines

### RevenueCat Configuration

1. **Offerings Structure**:
   - Create offerings for individual games, categories, and bundles
   - Set up entitlement mapping for cross-game access

2. **Entitlement Verification**:
   - Check entitlements at app launch
   - Verify specific game access when launching a game
   - Cache entitlement status with appropriate refresh intervals

### UI Implementation

1. **Store/Billing Interface**:
   - Consistent layout across all games
   - Game-specific theming applied through color schemes and visual elements
   - Clear indication of owned/accessible games

2. **Purchase Flow**:
   - Streamlined purchase process with minimal steps
   - Clear presentation of bundle options and savings
   - Seamless authentication and receipt validation

## Technical Architecture

```
┌─────────────────────────────────┐
│       Platform Core Layer       │
│  (Authentication, Permissions)  │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│     RevenueCat Integration      │
│  (Products, Offerings, Receipts)│
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│    Game-Specific Permissions    │
│   (Feature Access, Content)     │
└─────────────────────────────────┘
```

## Implementation Roadmap

1. **Phase 1**: Basic RevenueCat integration with individual game purchases
2. **Phase 2**: Category bundles and subscription options
3. **Phase 3**: Mix & match bundles and cross-game entitlements
4. **Phase 4**: Advanced features (family sharing, promotional offers)

## Testing Strategy

- Test purchase flows across all supported platforms
- Verify entitlement persistence across app restarts
- Test subscription renewal and expiration scenarios
- Validate bundle access and permissions

## Conclusion

This modular billing system provides a flexible foundation for monetizing the gaming platform while maintaining a consistent user experience. The architecture allows for easy addition of new games and pricing models as the platform evolves.
