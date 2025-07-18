'use client';

import dynamic from 'next/dynamic';
import GameUI from '../../components/GameUI';
import { useEffect } from 'react';
import { useEmpireStore } from '../../src/store/empireStore';
import { loadAllAssetDefinitions, getMockPortNodes } from '../lib/assetLoader';
import { realtimeAssetSync } from '../../lib/supabase/realtime-assets';
import { ToastContainer } from '../components/ui/Toast';

// Type declaration for development testing
declare global {
  interface Window {
    useEmpireStore?: typeof useEmpireStore;
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
  const { loadAssetDefinitions, setPortNodes, loadPlayerAssets } = useEmpireStore();

  useEffect(() => {
    // Debug environment variables
    console.log('🔧 Environment check:');
    console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.log('- SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    // Initialize player data
    const store = useEmpireStore.getState();
    
    // Expose stores and integration to window for testing in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.useEmpireStore = useEmpireStore;
    }
    
    // Use consistent player ID throughout
    const playerId = '00000000-0000-0000-0000-000000000001';
    
    if (!store.player) {
      store.setPlayer({
        id: playerId,
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
      try {
        console.log('🚀 Starting asset system initialization...');
        
        // Load asset definitions
        const definitions = await loadAllAssetDefinitions();
        loadAssetDefinitions(definitions);
        console.log('✅ Asset definitions loaded:', definitions.length);
        
        // Set port nodes
        setPortNodes(getMockPortNodes());
        console.log('✅ Port nodes set');
        
        // Ensure player exists in database
        const { assetService } = await import('../../lib/supabase/assets');
        const result = await assetService.ensurePlayerExists(playerId, 'Test Captain', 50000);
        
        if (result.success) {
          console.log('✅ Player initialized successfully');
          
          // Load existing assets from database
          await loadPlayerAssets();
          console.log('✅ Player assets loaded');
          
          // Initialize real-time sync with consistent player ID
          await realtimeAssetSync.initialize(playerId);
          console.log('✅ Realtime sync initialized');
          
          console.log('🎉 Asset system initialization complete!');
        } else {
          console.error('❌ Failed to initialize player:', result.error);
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize asset system:', error);
      }
    };
    
    initAssets();
    
    // Cleanup on unmount
    return () => {
      realtimeAssetSync.cleanup();
    };
  }, [loadAssetDefinitions, setPortNodes, loadPlayerAssets]);

  return (
    <div className="h-screen w-full bg-ocean-blue relative overflow-hidden">
      {/* Game Canvas */}
      <GameCanvas />
      
      {/* Game UI Overlay */}
      <GameUI />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}