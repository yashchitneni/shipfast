'use client';

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import gameConfig from '../scripts/gameConfig';
import PreloaderScene from '../scenes/PreloaderScene';
import WorldMapScene from '../scenes/WorldMapScene';
import { useEmpireStore } from '../src/store/empireStore';

export default function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get store state and actions
  const { isPaused, gameSpeed, setPlayer, placedAssets, loadPlayerAssets } = useEmpireStore();

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Enhanced config with asset system integration
    const config = {
      ...gameConfig,
      parent: containerRef.current,
      scene: [PreloaderScene, WorldMapScene],
      callbacks: {
        postBoot: (game: Phaser.Game) => {
          // Set up game-store integration
          setupStoreIntegration(game);
          
          // Initialize player if not exists
          const store = useEmpireStore.getState();
          if (!store.player) {
            store.setPlayer({
              id: 'player-1',
              username: 'Captain',
              email: 'captain@example.com',
              cash: 50000,
              level: 1,
              experience: 0,
              achievements: [],
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          
          // Load player assets
          loadPlayerAssets();
        }
      }
    };

    // Create game instance
    gameRef.current = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [loadPlayerAssets, setPlayer]);

  const setupStoreIntegration = (game: Phaser.Game) => {
    // Listen for camera updates from Phaser
    game.events.on('cameramove', (camera: Phaser.Cameras.Scene2D.Camera) => {
      // Update store with camera position if needed
      // This could be used for UI elements that need camera info
    });
    
    // Listen for asset changes
    game.events.on('assetPlaced', (assetData: any) => {
      console.log('Asset placed:', assetData);
    });
    
    // Listen for scene events
    game.events.on('sceneready', (scene: Phaser.Scene) => {
      if (scene.scene.key === 'WorldMapScene') {
        // WorldMapScene is ready - asset system can now interact with it
        console.log('WorldMapScene ready for asset system');
      }
    });
  };

  // Handle pause/resume from store
  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('WorldMapScene');
      if (scene) {
        if (isPaused) {
          scene.scene.pause();
        } else {
          scene.scene.resume();
        }
      }
    }
  }, [isPaused]);

  // Handle game speed changes
  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('WorldMapScene');
      if (scene) {
        // Adjust game speed - this could affect time progression, animations, etc.
        scene.physics?.world?.setFPS(60 * gameSpeed);
      }
    }
  }, [gameSpeed]);

  // Handle asset changes
  useEffect(() => {
    if (gameRef.current && placedAssets.size > 0) {
      const scene = gameRef.current.scene.getScene('WorldMapScene');
      if (scene) {
        // Notify the scene about asset changes
        scene.events.emit('assetsUpdated', Array.from(placedAssets.values()));
      }
    }
  }, [placedAssets]);

  return (
    <div
      ref={containerRef}
      id="game-container"
      className="w-full h-full relative bg-ocean-blue"
      style={{ minHeight: '600px' }}
    />
  );
}