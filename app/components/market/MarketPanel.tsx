'use client';

import React, { useState } from 'react';
import { useMarketStore } from '@/app/store/useMarketStore';

interface MarketPanelProps {
  playerId: string;
  playerCash: number;
  onTransaction: (amount: number) => void;
}

export function MarketPanel({ playerId, playerCash, onTransaction }: MarketPanelProps) {
  const { items } = useMarketStore();
  const [activeTab, setActiveTab] = useState<'GOODS' | 'CAPITAL' | 'ASSETS' | 'LABOR'>('GOODS');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const marketTypes = [
    { id: 'GOODS', name: 'Goods', icon: '📦', description: 'Raw materials & manufactured items' },
    { id: 'CAPITAL', name: 'Capital', icon: '🏭', description: 'Equipment & machinery' },
    { id: 'ASSETS', name: 'Assets', icon: '🏢', description: 'Real estate & infrastructure' },
    { id: 'LABOR', name: 'Labor', icon: '👷', description: 'Workers & services' }
  ] as const;

  const allItems = Array.from(items.values());
  const filteredMarkets = allItems.filter(item => item.type === activeTab);
  const selectedItem = selectedItemId ? items.get(selectedItemId) : null;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Market Type Tabs */}
      <div className="flex border-b border-gray-200">
        {marketTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveTab(type.id)}
            className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
              activeTab === type.id
                ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="text-2xl mb-1">{type.icon}</div>
            <div className="text-sm font-semibold">{type.name}</div>
            <div className="text-xs opacity-75">{type.description}</div>
          </button>
        ))}
      </div>

      <div className="flex h-96">
        {/* Market List */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">{activeTab} Markets</h3>
            {filteredMarkets.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <p>No {activeTab.toLowerCase()} items available</p>
                <p className="text-sm">Items will appear as markets become active</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMarkets.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedItem?.id === item.id
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">${item.currentPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          item.currentPrice > item.basePrice ? 'text-green-600' : 
                          item.currentPrice < item.basePrice ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {item.currentPrice > item.basePrice ? '↗' : item.currentPrice < item.basePrice ? '↘' : '→'} 
                          {(item.volatility * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trading Panel */}
        <div className="w-1/2">
          {selectedItem ? (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Trading: {selectedItem.name}</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span>Current Price:</span>
                    <span className="font-bold text-blue-600">${selectedItem.currentPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span>Supply:</span>
                    <span className="font-medium">{selectedItem.supply}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span>Demand:</span>
                    <span className="font-medium">{selectedItem.demand}</span>
                  </div>
                </div>
                <div className="pt-4 text-center text-gray-500">
                  <p>Trading functionality coming soon!</p>
                  <p className="text-sm">Full trading interface will be implemented in Phase 2</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Select an item to start trading</p>
                <p className="text-sm">Choose from the {activeTab.toLowerCase()} items on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Market Summary */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-600">Total Items: </span>
            <span className="font-medium">{filteredMarkets.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Active Type: </span>
            <span className="font-medium">{activeTab}</span>
          </div>
          <div>
            <span className="text-gray-600">Available Cash: </span>
            <span className="font-medium text-green-600">
              ${playerCash.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}