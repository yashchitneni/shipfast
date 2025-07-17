'use client';

import React, { useState, useEffect } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useEmpireStore } from '@/src/store/empireStore';
import { useMarketStore } from '@/app/store/useMarketStore';
import type { GoodsCategory } from '@/types/market';

export const MarketTradingPanel: React.FC = () => {
  const { player, updatePlayerCash } = useEmpireStore();
  const { 
    items, 
    transactions, 
    isLoading, 
    error,
    initializeMarket,
    buyItem,
    sellItem,
    getItemsByCategory,
    getMarketTrends
  } = useMarketStore();
  
  const [selectedCategory, setSelectedCategory] = useState<GoodsCategory | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(1);

  // Initialize market on mount
  useEffect(() => {
    initializeMarket();
  }, [initializeMarket]);

  // Get filtered items from store
  const marketItems = selectedCategory === 'all' 
    ? Array.from(items.values())
    : getItemsByCategory(selectedCategory);

  const selectedMarketItem = selectedItem ? items.get(selectedItem) : null;

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!selectedItem || !player || !selectedMarketItem) return;

    const total = selectedMarketItem.currentPrice * tradeAmount;
    
    if (type === 'buy' && player.cash < total) {
      alert('Insufficient funds!');
      return;
    }

    try {
      const transaction = type === 'buy' 
        ? await buyItem(selectedItem, tradeAmount, player.id)
        : await sellItem(selectedItem, tradeAmount, player.id);

      if (transaction) {
        // Update player cash
        const cashChange = type === 'buy' ? -total : total;
        updatePlayerCash(cashChange);
        
        // Reset trade amount
        setTradeAmount(1);
      }
    } catch (err) {
      console.error('Trade error:', err);
      alert('Trade failed. Please try again.');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: GoodsCategory) => {
    switch (category) {
      case 'RAW_MATERIALS': return 'bg-amber-100 text-amber-800';
      case 'MANUFACTURED': return 'bg-blue-100 text-blue-800';
      case 'CONSUMER': return 'bg-green-100 text-green-800';
      case 'TECHNOLOGY': return 'bg-purple-100 text-purple-800';
      case 'LUXURY': return 'bg-pink-100 text-pink-800';
      case 'ENERGY': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Panel title="Market Trading" className="mb-4">
        {/* Category Filter */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory('RAW_MATERIALS')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'RAW_MATERIALS'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Raw Materials
          </button>
          <button
            onClick={() => setSelectedCategory('MANUFACTURED')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'MANUFACTURED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manufactured
          </button>
          <button
            onClick={() => setSelectedCategory('CONSUMER')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'CONSUMER'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Consumer Goods
          </button>
          <button
            onClick={() => setSelectedCategory('TECHNOLOGY')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'TECHNOLOGY'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Technology
          </button>
        </div>

        {/* Market Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-gray-500">Loading market data...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
            {marketItems.map(item => {
              const trend = getMarketTrends(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedItem === item.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-white border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTrendIcon(trend.trend)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                          {item.category.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${item.currentPrice.toFixed(2)}</p>
                      <p className={`text-sm font-medium ${
                        trend.trend === 'up' ? 'text-green-600' : 
                        trend.trend === 'down' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {trend.trend === 'up' ? '+' : ''}{trend.percentageChange.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Trading Interface */}
      {selectedMarketItem && (
        <Panel title={`Trade ${selectedMarketItem.name}`} className="mb-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Price</label>
                <p className="text-2xl font-bold">${selectedMarketItem.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Available</label>
                <p className="text-2xl">{selectedMarketItem.supply.toFixed(0)} units</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade Quantity
              </label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setTradeAmount(Math.max(1, tradeAmount - 10))}
                  variant="secondary"
                  size="small"
                >
                  -10
                </Button>
                <Button
                  onClick={() => setTradeAmount(Math.max(1, tradeAmount - 1))}
                  variant="secondary"
                  size="small"
                >
                  -1
                </Button>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 text-center border border-gray-300 rounded-md"
                />
                <Button
                  onClick={() => setTradeAmount(tradeAmount + 1)}
                  variant="secondary"
                  size="small"
                >
                  +1
                </Button>
                <Button
                  onClick={() => setTradeAmount(tradeAmount + 10)}
                  variant="secondary"
                  size="small"
                >
                  +10
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold">${(selectedMarketItem.currentPrice * tradeAmount).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleTrade('buy')}
                variant="primary"
                className="w-full"
                disabled={!player || player.cash < selectedMarketItem.currentPrice * tradeAmount || isLoading}
              >
                Buy
              </Button>
              <Button
                onClick={() => handleTrade('sell')}
                variant="secondary"
                className="w-full"
                disabled={isLoading}
              >
                Sell
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Recent Transactions */}
      <Panel title="Recent Transactions" className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map(transaction => {
              const item = items.get(transaction.marketItemId);
              return (
                <div
                  key={transaction.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`font-medium ${
                        transaction.type === 'BUY' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'BUY' ? 'Bought' : 'Sold'}
                      </span>
                      <span className="ml-2">
                        {transaction.quantity} {item?.name || 'Unknown Item'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${transaction.totalPrice.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        ${transaction.pricePerUnit.toFixed(2)}/unit
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(transaction.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default MarketTradingPanel;