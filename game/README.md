# Flexport Game Module

This module contains the Phaser.js game implementation for the Flexport video game.

## Structure

- `/config` - Game configuration and constants
- `/scenes` - Phaser scenes (PreloadScene, MainMenuScene, WorldMapScene)
- `/systems` - Game systems (IsometricTileMap, CameraController)
- `/components` - React components for game integration
- `/store` - Zustand store for game state management
- `/assets` - Game assets (images, tilemaps, audio)
- `/utils` - Utility functions

## Key Features Implemented

1. **Phaser Game Engine Setup**
   - Main game configuration with responsive scaling
   - Scene hierarchy (Preload → MainMenu → WorldMap)
   - Asset loading system with progress display

2. **Isometric World Map**
   - 2:1 isometric tile ratio
   - Procedurally generated islands and ocean
   - Port placement system
   - Tile elevation and 3D appearance

3. **Camera Controls**
   - Mouse drag to pan
   - Mouse wheel to zoom
   - Keyboard arrow keys for movement
   - Smooth camera movement with inertia

4. **Map Boundaries**
   - Constrained camera movement
   - Dynamic bounds based on map size

5. **Basic Lighting System**
   - Day/night cycle
   - Ambient lighting changes
   - Scene tinting based on time of day

6. **Zustand Integration**
   - Game state management
   - Ship and port data structures
   - Persistent storage support
   - React-Phaser state synchronization

## Visual Style Guide Colors

All colors follow the Flexport brand guidelines:
- Ocean Blue (#0077BE)
- Cargo Green (#00A652)
- Shipping Red (#E03C31)
- Sunset Orange (#FF6F61)
- Neutral Gray (#808080)

## Next Steps

- Add ship entities and movement
- Implement port interaction system
- Add trade and cargo mechanics
- Create UI overlays for inventory and stats
- Add sound effects and music
- Implement save/load functionality