'use client';

import dynamic from 'next/dynamic';
import GameUI from '../../components/GameUI';
import { useEffect } from 'react';
import { useGameStore } from '../../utils/store';

// Dynamically import GameCanvas to avoid SSR issues with Phaser
const GameCanvas = dynamic(() => import('../../components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-ocean-blue flex items-center justify-center">
      <div className="text-white text-2xl">Loading Flexport...</div>
    </div>
  ),
});

export default function GamePage() {
  useEffect(() => {
    // Initialize player data
    const store = useGameStore.getState();
    if (!store.player) {
      store.setPlayer({
        id: 'player-1',
        name: 'Captain',
        cash: 50000,
        reputation: 50,
        level: 1,
        experience: 0,
      });
    }

    // Initialize sample market data
    store.updateMarketPrices([
      { good: 'Electronics', price: 1200, trend: 'up', change: 5.2 },
      { good: 'Oil', price: 85, trend: 'down', change: -2.1 },
      { good: 'Containers', price: 450, trend: 'stable', change: 0.3 },
      { good: 'Food', price: 320, trend: 'up', change: 3.7 },
    ]);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <GameCanvas />
      <GameUI />
    </div>
  );
}