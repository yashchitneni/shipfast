'use client';

import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useEmpireStore } from '@/src/store/empireStore';

interface MarketItem {
  id: string;
  good: string;
  price: number;
  available: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  category: 'raw' | 'manufactured' | 'consumer' | 'special';
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  good: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  timestamp: Date;
}

export const MarketTradingPanel: React.FC = () => {
  const { marketPrices, player, updatePlayerCash } = useEmpireStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Expand market items with more details
  const marketItems: MarketItem[] = [
    { id: '1', good: 'Electronics', price: 1200, available: 150, trend: 'up', change: 5.2, category: 'manufactured' },
    { id: '2', good: 'Oil', price: 85, available: 500, trend: 'down', change: -2.1, category: 'raw' },
    { id: '3', good: 'Containers', price: 450, available: 300, trend: 'stable', change: 0.3, category: 'manufactured' },
    { id: '4', good: 'Food', price: 320, available: 400, trend: 'up', change: 3.7, category: 'consumer' },
    { id: '5', good: 'Steel', price: 750, available: 200, trend: 'down', change: -1.5, category: 'raw' },
    { id: '6', good: 'Textiles', price: 280, available: 350, trend: 'up', change: 2.8, category: 'consumer' },
    { id: '7', good: 'Machinery', price: 2500, available: 50, trend: 'stable', change: 0.5, category: 'manufactured' },
    { id: '8', good: 'Chemicals', price: 950, available: 180, trend: 'up', change: 4.1, category: 'special' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? marketItems 
    : marketItems.filter(item => item.category === selectedCategory);

  const handleTrade = (type: 'buy' | 'sell') => {
    if (!selectedItem || !player) return;

    const total = selectedItem.price * tradeAmount;
    
    if (type === 'buy' && player.cash < total) {
      alert('Insufficient funds!');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      good: selectedItem.good,
      quantity: tradeAmount,
      pricePerUnit: selectedItem.price,
      total,
      timestamp: new Date()
    };

    setTransactions([newTransaction, ...transactions]);
    
    // Update player cash
    const cashChange = type === 'buy' ? -total : total;
    updatePlayerCash(player.cash + cashChange);
    
    // Reset trade amount
    setTradeAmount(1);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'raw': return 'bg-amber-100 text-amber-800';
      case 'manufactured': return 'bg-blue-100 text-blue-800';
      case 'consumer': return 'bg-green-100 text-green-800';
      case 'special': return 'bg-purple-100 text-purple-800';
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
            onClick={() => setSelectedCategory('raw')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'raw'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Raw Materials
          </button>
          <button
            onClick={() => setSelectedCategory('manufactured')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'manufactured'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manufactured
          </button>
          <button
            onClick={() => setSelectedCategory('consumer')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'consumer'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Consumer Goods
          </button>
          <button
            onClick={() => setSelectedCategory('special')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === 'special'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Special
          </button>
        </div>

        {/* Market Items Grid */}
        <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedItem?.id === item.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTrendIcon(item.trend)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.good}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${item.price}</p>
                  <p className={`text-sm font-medium ${
                    item.trend === 'up' ? 'text-green-600' : 
                    item.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {item.trend === 'up' ? '+' : ''}{item.change}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Trading Interface */}
      {selectedItem && (
        <Panel title={`Trade ${selectedItem.good}`} className="mb-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Price</label>
                <p className="text-2xl font-bold">${selectedItem.price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Available</label>
                <p className="text-2xl">{selectedItem.available} units</p>
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
              <p className="text-2xl font-bold">${(selectedItem.price * tradeAmount).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleTrade('buy')}
                variant="primary"
                className="w-full"
                disabled={!player || player.cash < selectedItem.price * tradeAmount}
              >
                Buy
              </Button>
              <Button
                onClick={() => handleTrade('sell')}
                variant="secondary"
                className="w-full"
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
            {transactions.slice(0, 10).map(transaction => (
              <div
                key={transaction.id}
                className="p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-medium ${
                      transaction.type === 'buy' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'buy' ? 'Bought' : 'Sold'}
                    </span>
                    <span className="ml-2">{transaction.quantity} {transaction.good}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${transaction.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      ${transaction.pricePerUnit}/unit
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {transaction.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default MarketTradingPanel;