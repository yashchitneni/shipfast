'use client';

import dynamic from 'next/dynamic';
import GameUI from '../../components/GameUI';
import { AssetManager } from '../components/assets/AssetManager';
import { useEffect, useState } from 'react';
import { useEmpireStore } from '../../src/store/empireStore';
import { loadAllAssetDefinitions, getMockPortNodes } from '../lib/assetLoader';
import { realtimeAssetSync } from '../../lib/supabase/realtime-assets';
import { systemIntegration } from '../lib/game/system-integration';
import { useRouteStore } from '../store/useRouteStore';
import { useEconomyStore } from '../store/useEconomyStore';
import { useMarketStore } from '../store/useMarketStore';
import { useAIStore } from '../store/useAIStore';

// Type declaration for development testing
declare global {
  interface Window {
    useEmpireStore?: typeof useEmpireStore;
    useRouteStore?: typeof useRouteStore;
    useEconomyStore?: typeof useEconomyStore;
    useMarketStore?: typeof useMarketStore;
    useAIStore?: typeof useAIStore;
    systemIntegration?: typeof systemIntegration;
  }
}

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
  const [showAssetManager, setShowAssetManager] = useState(false);
  const { loadAssetDefinitions, setPortNodes, setPlayerId, loadPlayerAssets } = useEmpireStore();

  useEffect(() => {
    // Initialize player data
    const store = useEmpireStore.getState();
    
    // Expose stores and integration to window for testing in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.useEmpireStore = useEmpireStore;
      window.useRouteStore = useRouteStore;
      window.useEconomyStore = useEconomyStore;
      window.useMarketStore = useMarketStore;
      window.useAIStore = useAIStore;
      window.systemIntegration = systemIntegration;
    }
    
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

    // Initialize sample market data
    store.updateMarketPrices([
      { good: 'Electronics', price: 1200, trend: 'up', change: 5.2 },
      { good: 'Oil', price: 85, trend: 'down', change: -2.1 },
      { good: 'Containers', price: 450, trend: 'stable', change: 0.3 },
      { good: 'Food', price: 320, trend: 'up', change: 3.7 },
    ]);

    // Initialize asset system
    const initAssets = async () => {
      // Load asset definitions
      const definitions = await loadAllAssetDefinitions();
      loadAssetDefinitions(definitions);
      
      // Set port nodes
      setPortNodes(getMockPortNodes());
      
      // Set player ID (in production, this would come from auth)
      // For now, we'll use a mock UUID that doesn't require auth
      const playerId = '00000000-0000-0000-0000-000000000001';
      setPlayerId(playerId);
      
      // Ensure player exists in database
      const { assetService } = await import('../../lib/supabase/assets');
      await assetService.ensurePlayerExists(playerId, 'Test Captain', 50000);
      
      // Load existing assets from database
      await loadPlayerAssets();
      
      // Initialize real-time sync
      await realtimeAssetSync.initialize('player-1');
      
      // Initialize Phase 2 systems
      try {
        await systemIntegration.initialize(playerId);
        console.log('Phase 2 systems integrated:', systemIntegration.getStatus());
        
        // Load player routes
        const routeStore = useRouteStore.getState();
        await routeStore.loadPlayerRoutes(playerId);
        console.log('Routes loaded');
      } catch (error) {
        console.error('Failed to initialize Phase 2 systems:', error);
      }
    };
    
    initAssets();
    
    // Cleanup on unmount
    return () => {
      realtimeAssetSync.cleanup();
      systemIntegration.cleanup();
    };
  }, [loadAssetDefinitions, setPortNodes, setPlayerId, loadPlayerAssets]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <GameCanvas />
      <GameUI />
      
      {/* Asset Manager Toggle Button */}
      <button
        onClick={() => setShowAssetManager(!showAssetManager)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
      >
        <span className="text-xl">🏗️</span>
        <span>{showAssetManager ? 'Hide' : 'Show'} Assets</span>
      </button>
      
      {/* Asset Manager */}
      {showAssetManager && <AssetManager />}
    </div>
  );
}