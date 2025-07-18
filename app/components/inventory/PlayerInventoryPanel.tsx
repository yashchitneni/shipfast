'use client';

import React, { useState, useEffect } from 'react';
import { Panel } from '../ui/Panel';
import { useEmpireStore } from '@/src/store/empireStore';
import { inventoryService } from '@/lib/supabase/inventory';
import { useMarketStore } from '@/app/store/useMarketStore';
import type { PlayerInventoryItem } from '@/types/inventory';

export const PlayerInventoryPanel: React.FC = () => {
  const { player } = useEmpireStore();
  const { items: marketItems } = useMarketStore();
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Load player inventory
  useEffect(() => {
    if (!player?.id) return;

    const loadInventory = async () => {
      try {
        setIsLoading(true);
        const data = await inventoryService.getPlayerInventory(player.id);
        setInventory(data);
        setError(null);
      } catch (err) {
        console.error('Error loading inventory:', err);
        setError('Failed to load inventory');
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadInventory, 30000);
    return () => clearInterval(interval);
  }, [player?.id]);

  // Filter inventory by location
  const filteredInventory = selectedLocation === 'all' 
    ? inventory 
    : inventory.filter(item => item.locationId === selectedLocation);

  // Get unique locations
  const locations = Array.from(new Set(inventory.map(item => item.locationId)));

  // Calculate total value
  const totalValue = filteredInventory.reduce((sum, item) => {
    const marketItem = marketItems.get(item.itemId);
    const currentPrice = marketItem?.currentPrice || item.acquiredPrice;
    return sum + (currentPrice * item.quantity);
  }, 0);

  const totalCost = filteredInventory.reduce((sum, item) => {
    return sum + (item.acquiredPrice * item.quantity);
  }, 0);

  const unrealizedProfit = totalValue - totalCost;

  return (
    <div className="h-full flex flex-col">
      <Panel title="Player Inventory" className="flex-1">
        {/* Location Filter */}
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedLocation('all')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedLocation === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Locations
            </button>
            {locations.map(location => (
              <button
                key={location}
                onClick={() => setSelectedLocation(location)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedLocation === location
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Total Cost</p>
            <p className="text-lg font-bold">${totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Current Value</p>
            <p className="text-lg font-bold">${totalValue.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded ${unrealizedProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-sm text-gray-600">Unrealized P/L</p>
            <p className={`text-lg font-bold ${unrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {unrealizedProfit >= 0 ? '+' : ''} ${unrealizedProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Inventory Items */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">Loading inventory...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-red-500">{error}</div>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">
              {selectedLocation === 'all' 
                ? 'No items in inventory. Buy goods from the market!'
                : `No items at ${selectedLocation}`}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredInventory.map(item => {
              const marketItem = marketItems.get(item.itemId);
              const currentPrice = marketItem?.currentPrice || item.acquiredPrice;
              const profit = (currentPrice - item.acquiredPrice) * item.quantity;
              const profitPercent = ((currentPrice - item.acquiredPrice) / item.acquiredPrice) * 100;

              return (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {marketItem?.name || 'Unknown Item'}
                      </h4>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} units @ ${item.acquiredPrice.toFixed(2)}/unit
                        </p>
                        <p className="text-sm text-gray-600">
                          Location: {item.locationType} - {item.locationId}
                        </p>
                        <p className="text-xs text-gray-400">
                          Acquired: {new Date(item.acquiredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-600">Current Price</p>
                      <p className="text-lg font-bold">${currentPrice.toFixed(2)}</p>
                      <p className={`text-sm font-medium ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {profit >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
                        <br />
                        (${profit.toLocaleString()})
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default PlayerInventoryPanel;