'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import gameConfig from '../scripts/gameConfig';
import PreloaderScene from '../scenes/PreloaderScene';
import WorldMapScene from '../scenes/WorldMapScene';

export default function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Add scenes to config
    const config = {
      ...gameConfig,
      parent: containerRef.current,
      scene: [PreloaderScene, WorldMapScene],
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
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-container"
      className="w-full h-full relative bg-ocean-blue"
      style={{ minHeight: '600px' }}
    />
  );
}