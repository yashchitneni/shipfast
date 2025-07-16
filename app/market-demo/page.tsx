'use client';

import React, { useState } from 'react';
import { MarketPanel } from '@/app/components/market/MarketPanel';
import { useMarketStore } from '@/app/store/useMarketStore';

export default function MarketDemoPage() {
  // Demo player state
  const [playerCash, setPlayerCash] = useState(50000);
  const playerId = 'demo-player-123';

  const { updateMarketCycle, lastUpdateCycle } = useMarketStore();

  const handleTransaction = (amount: number) => {
    setPlayerCash(prev => Math.max(0, prev + amount));
  };

  const handleManualUpdate = async () => {
    const result = await updateMarketCycle();
    if (result) {
      console.log('Market updated:', result);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Flexport Market System Demo
        </h1>

        {/* Player Info Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Demo Player</h2>
            <p className="text-gray-600">ID: {playerId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Available Cash</p>
            <p className="text-2xl font-bold text-green-600">
              ${playerCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Market Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Market Controls</h3>
              <p className="text-sm text-gray-600">
                Last Update: {lastUpdateCycle.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleManualUpdate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Manual Market Update
            </button>
          </div>
        </div>

        {/* Market Panel */}
        <MarketPanel
          playerId={playerId}
          playerCash={playerCash}
          onTransaction={handleTransaction}
        />

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How to Use the Market System
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Click on market type tabs to browse different categories</li>
            <li>• Select an item to view its details and market trends</li>
            <li>• Use the trading panel to buy or sell items</li>
            <li>• Watch how supply, demand, and prices change over time</li>
            <li>• Markets auto-update every 60 seconds (or use manual update)</li>
          </ul>
          
          <h4 className="text-md font-semibold text-blue-900 mt-4 mb-2">
            Market Types:
          </h4>
          <ul className="space-y-1 text-blue-800 text-sm">
            <li><strong>GOODS:</strong> Raw materials, manufactured items, luxury goods</li>
            <li><strong>CAPITAL:</strong> Equipment and machinery for production</li>
            <li><strong>ASSETS:</strong> Real estate and infrastructure</li>
            <li><strong>LABOR:</strong> Workers and services</li>
          </ul>
        </div>
      </div>
    </div>
  );
}