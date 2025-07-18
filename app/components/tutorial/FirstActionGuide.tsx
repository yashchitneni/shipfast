'use client';

import React, { useState } from 'react';
import { useEmpireStore } from '../../../src/store/empireStore';
import { Button } from '../ui/Button';

export const FirstActionGuide: React.FC = () => {
  const { player } = useEmpireStore();
  const [dismissed, setDismissed] = useState(false);

  // Only show for new players with starting cash
  if (!player || player.cash !== 1000000 || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white p-6 rounded-lg shadow-2xl max-w-md">
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
        <Button
          onClick={() => setDismissed(true)}
          variant="secondary"
          size="small"
          className="bg-white text-blue-600 hover:bg-gray-100"
        >
          Got it! Let\'s trade!
        </Button>
      </div>
    </div>
  );
};