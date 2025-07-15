# Flexport Game Architecture

## Project Structure

```
/workspaces/shipfast/
├── app/                    # Next.js 15 app directory
│   ├── game/              # Game page
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── GameCanvas.tsx    # Phaser game container
│   └── GameUI.tsx        # Game UI overlay
├── scenes/               # Phaser scenes
│   ├── PreloaderScene.ts # Asset loading
│   └── WorldMapScene.ts  # Main game world
├── scripts/              # Game configuration
│   └── gameConfig.ts     # Phaser configuration
├── assets/               # Game assets
│   ├── images/          # Sprites and textures
│   ├── audio/           # Sound effects and music
│   └── sprites/         # Sprite sheets
├── data/                # Game data
│   └── gameConstants.ts # Configuration constants
├── hooks/               # Custom React hooks
│   └── useGameLoop.ts   # Game loop management
├── utils/               # Utility functions
│   ├── store.ts         # Zustand state management
│   └── gameCalculations.ts # Game logic helpers
└── types/               # TypeScript definitions
    └── game.ts          # Game-specific types
```

## Technology Stack

- **Frontend Framework**: Next.js 15.4.1
- **Game Engine**: Phaser.js 3.x
- **State Management**: Zustand 5.x
- **Styling**: Tailwind CSS 4.x
- **Language**: TypeScript 5.x
- **Backend**: Supabase (configured)

## Architecture Overview

### Hybrid Client-Server Model
- **Client**: Browser-based game with Phaser.js canvas and React UI
- **Server**: Supabase for data persistence and real-time updates

### Frontend Architecture

#### Phaser.js (Game Canvas)
- Renders the isometric game world
- Handles ship movements and animations
- Manages visual effects and disasters
- Runs the core game loop

#### React/Next.js (User Interface)
- Renders all UI dashboards and panels
- Displays player stats and market data
- Handles menus and notifications
- Manages the AI Companion interface

### State Management

Using Zustand for centralized state management:
- Single source of truth for game data
- Automatic UI updates on state changes
- Persistence for save/load functionality
- Integration between React and Phaser

### Key Features Implemented

1. **Project Setup**
   - Next.js 15.4.1 with TypeScript
   - Phaser.js 3.x integration
   - Tailwind CSS with custom game colors

2. **Game Core**
   - Preloader scene with loading screen
   - World map scene with isometric view
   - Basic ship and port rendering
   - Camera controls (pan and zoom)

3. **UI System**
   - Top bar with player stats
   - Bottom panel navigation
   - Side panels for market, fleet, ports, and AI
   - Responsive game canvas

4. **State Management**
   - Zustand store with game state
   - Player data management
   - Ship and port tracking
   - Market price system

5. **Utilities**
   - Game calculations (distance, profit, etc.)
   - Custom hooks for game loops
   - Type definitions for game entities
   - Configuration constants

## Color Palette (from Visual Style Guide)

- **Ocean Blue**: #0077BE
- **Cargo Green**: #228B22  
- **Alert Red**: #DC143C
- **Gold Yellow**: #FFD700
- **Port Orange**: #FF4500
- **Dashboard Blue**: #1E90FF

## Next Steps

1. Implement Supabase integration
2. Add more Phaser scenes (Port, Battle)
3. Create ship movement system
4. Build market simulation
5. Add sound effects and music
6. Implement save/load functionality
7. Create AI companion system
8. Add multiplayer features