'use client';

import React, { useState, useEffect } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useEmpireStore } from '@/src/store/empireStore';
import { useMarketStore } from '@/app/store/useMarketStore';
// Removed local price fluctuation - using Supabase Realtime instead
import { InventorySection } from '../inventory/InventorySection';
import { InventoryStatus } from './InventoryStatus';
import { toast } from '../ui/Toast';
import { GoodsCategory } from '@/types/market';
import { inventoryService } from '@/lib/supabase/inventory';

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
    buyItemOptimistic,
    sellItemOptimistic,
    getItemsByCategory,
    getMarketTrends,
    onTransactionComplete
  } = useMarketStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(1);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [playerInventory, setPlayerInventory] = useState<Map<string, number>>(new Map());
  const [isProcessing, setIsProcessing] = useState<'buy' | 'sell' | null>(null);
  const [useOptimisticUI, setUseOptimisticUI] = useState(true); // Toggle for testing

  // Price fluctuation now handled by Supabase Realtime - all players see same prices

  // Load player inventory
  const loadPlayerInventory = async () => {
    if (!player) return;
    
    try {
      const inventory = await inventoryService.getInventoryAtLocation(player.id, 'port-1');
      const inventoryMap = new Map<string, number>();
      inventory.forEach(item => {
        inventoryMap.set(item.itemId, item.quantity);
      });
      setPlayerInventory(inventoryMap);
    } catch (error) {
      console.error('Failed to load player inventory:', error);
    }
  };

  // Initialize market on mount
  useEffect(() => {
    console.time('Market initialization total time');
    initializeMarket().then(() => {
      console.timeEnd('Market initialization total time');
    });
  }, [initializeMarket]);
  
  // Load inventory on mount and when player changes
  useEffect(() => {
    loadPlayerInventory();
  }, [player]);
  
  // Reload inventory when transactions complete
  useEffect(() => {
    const unsubscribe = onTransactionComplete(() => {
      loadPlayerInventory();
    });
    
    return unsubscribe;
  }, [onTransactionComplete]);

  // Get filtered items from store
  const marketItems = selectedCategory === 'all' 
    ? Array.from(items.values())
    : getItemsByCategory(selectedCategory as GoodsCategory);

  const selectedMarketItem = selectedItem ? items.get(selectedItem) : null;
  
  // Clear trade error when selecting new item
  useEffect(() => {
    setTradeError(null);
  }, [selectedItem]);

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!selectedItem || !player || !selectedMarketItem) {
      toast.error('Please select an item and ensure you are logged in.');
      return;
    }

    const total = selectedMarketItem.currentPrice * tradeAmount;
    setTradeError(null); // Clear any previous errors
    setIsProcessing(type); // Set loading state
    
    if (type === 'buy' && player.cash < total) {
      const errorMsg = `Insufficient funds! You need $${total.toLocaleString()} but only have $${player.cash.toLocaleString()}.`;
      setTradeError(errorMsg);
      toast.error(errorMsg);
      setIsProcessing(null);
      return;
    }

    if (type === 'sell') {
      try {
        if (useOptimisticUI) {
          // Optimistic UI: Update immediately
          const expectedRevenue = selectedMarketItem.currentPrice * 0.9 * tradeAmount;
          
          // Update UI immediately
          updatePlayerCash(expectedRevenue);
          setPlayerInventory(prev => {
            const newMap = new Map(prev);
            const currentQty = newMap.get(selectedItem) || 0;
            newMap.set(selectedItem, currentQty - tradeAmount);
            return newMap;
          });
          
          // Show success immediately
          toast.success(`Successfully sold ${tradeAmount} ${selectedMarketItem.name} for $${expectedRevenue.toLocaleString()}!`);
          setTradeAmount(1);
          
          // Then verify with server
          const transaction = await sellItemOptimistic(selectedItem, tradeAmount, player.id);
          
          if (!transaction) {
            // Rollback if failed
            updatePlayerCash(-expectedRevenue);
            loadPlayerInventory(); // Reload correct inventory
            toast.error('Sale failed - changes reverted');
          }
        } else {
          // Traditional approach: Wait for server
          console.log('Attempting sell transaction...');
          const transaction = await sellItem(selectedItem, tradeAmount, player.id);
          
          if (transaction) {
            updatePlayerCash(transaction.totalPrice);
            setTradeAmount(1);
            
            setTimeout(() => {
              loadPlayerInventory();
            }, 500);
            
            toast.success(`Successfully sold ${tradeAmount} ${selectedMarketItem.name} for $${transaction.totalPrice.toLocaleString()}!`);
          }
        }
      } catch (err) {
        console.error('=== SELL ERROR DETAILS ===');
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setTradeError(`Unable to sell: ${errorMessage}`);
        toast.error(`Unable to sell: ${errorMessage}`);
      } finally {
        setIsProcessing(null);
      }
      return;
    }

    // Buy logic
    try {
      if (useOptimisticUI) {
        // Optimistic UI: Update immediately
        updatePlayerCash(-total);
        setPlayerInventory(prev => {
          const newMap = new Map(prev);
          const currentQty = newMap.get(selectedItem) || 0;
          newMap.set(selectedItem, currentQty + tradeAmount);
          return newMap;
        });
        
        // Show success immediately
        toast.success(`Successfully purchased ${tradeAmount} ${selectedMarketItem.name} for $${total.toLocaleString()}!`);
        setTradeAmount(1);
        
        // Then verify with server
        const transaction = await buyItemOptimistic(selectedItem, tradeAmount, player.id, player.cash);
        
        if (!transaction) {
          // Rollback if failed
          updatePlayerCash(total);
          loadPlayerInventory(); // Reload correct inventory
          toast.error('Purchase failed - changes reverted');
        }
      } else {
        // Traditional approach: Wait for server
        console.log(`Attempting ${type} transaction:`, {
          itemId: selectedItem,
          quantity: tradeAmount,
          playerId: player.id,
          total: total
        });
        
        const transaction = await buyItem(selectedItem, tradeAmount, player.id);

        if (transaction) {
          console.log('Transaction successful:', transaction);
          updatePlayerCash(-total);
          setTradeAmount(1);
          
          setTimeout(() => {
            loadPlayerInventory();
          }, 500);
          
          toast.success(`Successfully purchased ${tradeAmount} ${selectedMarketItem.name} for $${total.toLocaleString()}!`);
        } else {
          throw new Error('Transaction returned null - check console for details');
        }
      }
    } catch (err) {
      console.error('Trade error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setTradeError(`Trade failed: ${errorMessage}`);
      toast.error(`Trade failed: ${errorMessage}`);
    } finally {
      setIsProcessing(null);
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
      {/* Player Inventory */}
      <InventorySection />
      
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
            onClick={() => setSelectedCategory(GoodsCategory.RAW_MATERIALS)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === GoodsCategory.RAW_MATERIALS
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Raw Materials
          </button>
          <button
            onClick={() => setSelectedCategory(GoodsCategory.MANUFACTURED)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === GoodsCategory.MANUFACTURED
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manufactured
          </button>
          <button
            onClick={() => setSelectedCategory(GoodsCategory.CONSUMER)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === GoodsCategory.CONSUMER
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Consumer Goods
          </button>
          <button
            onClick={() => setSelectedCategory(GoodsCategory.TECHNOLOGY)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === GoodsCategory.TECHNOLOGY
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
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${item.category ? getCategoryColor(item.category) : 'bg-gray-100 text-gray-800'}`}>
                            {item.category ? item.category.toLowerCase().replace('_', ' ') : 'uncategorized'}
                          </span>
                          <InventoryStatus 
                            itemId={item.id} 
                            locationId="port-1"
                            optimisticQuantity={playerInventory.get(item.id) || 0}
                          />
                        </div>
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

      {/* Optimistic UI Toggle */}
      <div className="mb-4 flex items-center justify-end">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useOptimisticUI}
            onChange={(e) => setUseOptimisticUI(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-600">
            Instant UI Updates {useOptimisticUI ? '⚡' : '🐌'}
          </span>
        </label>
      </div>

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
                Trade Quantity {playerInventory.has(selectedItem) && (
                  <span className="text-sm text-gray-500 ml-2">
                    (You own: {playerInventory.get(selectedItem)} units)
                  </span>
                )}
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

            {/* Inline error display */}
            {tradeError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  {tradeError}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleTrade('buy')}
                variant="primary"
                className="w-full"
                disabled={!player || player.cash < selectedMarketItem.currentPrice * tradeAmount || isLoading || isProcessing !== null}
                loading={isProcessing === 'buy'}
              >
                {isProcessing === 'buy' ? 'Processing...' : 'Buy'}
              </Button>
              <Button
                onClick={() => handleTrade('sell')}
                variant={
                  playerInventory.has(selectedItem) && playerInventory.get(selectedItem)! >= tradeAmount 
                    ? "primary" 
                    : "secondary"
                }
                className="w-full"
                disabled={isLoading || !playerInventory.has(selectedItem) || playerInventory.get(selectedItem)! < tradeAmount || isProcessing !== null}
                loading={isProcessing === 'sell'}
                title={
                  !player ? 'Login required' : 
                  !playerInventory.has(selectedItem) ? 'You do not own this item' :
                  playerInventory.get(selectedItem)! < tradeAmount ? `You only have ${playerInventory.get(selectedItem)} units` :
                  'Sell items from your inventory'
                }
              >
                {isProcessing === 'sell' ? 'Processing...' : 'Sell'}
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