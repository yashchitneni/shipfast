'use client';

import React, { useState, useEffect } from 'react';
import { useEmpireStore } from '../../../src/store/empireStore';

export const FirstActionGuide: React.FC = () => {
  const { player } = useEmpireStore();
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    console.log('[FirstActionGuide] Component mounted, checking localStorage...');
    const isDismissed = localStorage.getItem('tutorial-dismissed');
    console.log('[FirstActionGuide] localStorage tutorial-dismissed:', isDismissed);
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    console.log('[FirstActionGuide] Dismiss button clicked!');
    setDismissed(true);
    localStorage.setItem('tutorial-dismissed', 'true');
    console.log('[FirstActionGuide] Tutorial dismissed and saved to localStorage');
  };

  // Only show for new players with starting cash
  if (!player || player.cash !== 1000000 || dismissed) {
    console.log('[FirstActionGuide] Not showing tutorial:', { 
      hasPlayer: !!player, 
      playerCash: player?.cash, 
      dismissed 
    });
    return null;
  }

  console.log('[FirstActionGuide] Rendering tutorial guide...');

  return (
    <div 
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-6 rounded-lg shadow-2xl max-w-md pointer-events-auto"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        console.log('[FirstActionGuide] Div clicked, event:', e);
        e.stopPropagation();
      }}
    >
      <button
        onClick={(e) => {
          console.log('[FirstActionGuide] X button clicked!');
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors p-1"
        style={{ zIndex: 10000 }}
        aria-label="Close tutorial"
        type="button"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h3 className="text-xl font-bold mb-3">🎯 Welcome to Maritime Trading!</h3>
      
      <div className="space-y-3 text-sm">
        <p>✅ <strong>You start with $1,000,000 and free goods!</strong></p>
        
        <div className="bg-blue-700 p-3 rounded">
          <p className="font-semibold mb-1">Your First Trade:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the <strong>Market</strong> button below</li>
            <li>Check your inventory at the top</li>
            <li>Watch prices change (every 5-15 seconds)</li>
            <li>Sell when prices go up (green)</li>
            <li>Buy when prices drop (red)</li>
          </ol>
        </div>
        
        <p className="text-yellow-200">
          💡 <strong>Tip:</strong> Start by selling your Coal or Iron Ore when prices rise above what you paid!
        </p>
        
        <p className="text-green-200">
          🚢 <strong>Goal:</strong> Trade goods to earn $25,000 more, then buy your first ship!
        </p>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={(e) => {
            console.log('[FirstActionGuide] Got it button clicked!');
            e.stopPropagation();
            handleDismiss();
          }}
          className="px-4 py-2 bg-white text-blue-600 font-semibold rounded hover:bg-gray-100 transition-colors shadow-md pointer-events-auto"
          style={{ position: 'relative', zIndex: 10000 }}
          type="button"
        >
          Got it! Let's trade!
        </button>
      </div>
    </div>
  );
};