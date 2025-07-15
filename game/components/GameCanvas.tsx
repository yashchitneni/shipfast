'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../config/gameConfig';
import { useGameStore } from '../store/gameStore';

export function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get store actions
  const { startGame, setCameraPosition, setCameraZoom } = useGameStore();

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Create Phaser game instance
    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
      callbacks: {
        postBoot: (game) => {
          // Set up game-store integration
          setupStoreIntegration(game);
          setIsLoading(false);
          startGame();
        }
      }
    };

    gameRef.current = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [startGame]);

  const setupStoreIntegration = (game: Phaser.Game) => {
    // Listen for camera updates from Phaser
    game.events.on('cameramove', (camera: Phaser.Cameras.Scene2D.Camera) => {
      setCameraPosition({ x: camera.scrollX, y: camera.scrollY });
      setCameraZoom(camera.zoom);
    });

    // Add more integration as needed
  };

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div 
        ref={containerRef} 
        id="game-container"
        className="w-full h-full"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-2xl">Loading Flexport...</div>
        </div>
      )}
    </div>
  );
}