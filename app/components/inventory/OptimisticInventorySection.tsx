'use client';

import React, { useEffect, useState } from 'react';
import { Panel } from '../ui/Panel';
import { inventoryService } from '../../../lib/supabase/inventory';
import { useEmpireStore } from '../../../src/store/empireStore';
import { useMarketStore } from '../../store/useMarketStore';
import type { PlayerInventoryItem } from '../../../types/inventory';

interface ExtendedInventoryItem extends PlayerInventoryItem {
  itemName?: string;
  currentPrice?: number;
  profit?: number;
}

interface OptimisticInventorySectionProps {
  optimisticInventory?: Map<string, number>;
}

export const OptimisticInventorySection: React.FC<OptimisticInventorySectionProps> = ({ 
  optimisticInventory 
}) => {
  const { player } = useEmpireStore();
  const { items: marketItems, onTransactionComplete } = useMarketStore();
  const [serverInventory, setServerInventory] = useState<ExtendedInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    if (!player) return;
    
    try {
      setLoading(true);
      const items = await inventoryService.getInventoryAtLocation(player.id, 'port-1');
      
      // Enhance with market data
      const enhancedItems: ExtendedInventoryItem[] = items.map(item => {
        const marketItem = marketItems.get(item.itemId);
        return {
          ...item,
          itemName: marketItem?.name || 'Unknown Item',
          currentPrice: marketItem?.currentPrice || 0,
          profit: marketItem ? (marketItem.currentPrice * 0.9 - item.acquiredPrice) * item.quantity : 0
        };
      });
      
      setServerInventory(enhancedItems);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Merge server inventory with optimistic updates
  const getMergedInventory = (): ExtendedInventoryItem[] => {
    if (!optimisticInventory || optimisticInventory.size === 0) {
      return serverInventory;
    }

    // Create a map of server items for easy lookup
    const serverItemsMap = new Map<string, ExtendedInventoryItem>();
    serverInventory.forEach(item => {
      serverItemsMap.set(item.itemId, item);
    });

    // Update quantities with optimistic values
    const mergedItems: ExtendedInventoryItem[] = [];
    
    // First, update existing items with optimistic quantities
    serverInventory.forEach(item => {
      const optimisticQty = optimisticInventory.get(item.itemId);
      if (optimisticQty !== undefined && optimisticQty !== item.quantity) {
        const marketItem = marketItems.get(item.itemId);
        mergedItems.push({
          ...item,
          quantity: optimisticQty,
          profit: marketItem ? (marketItem.currentPrice * 0.9 - item.acquiredPrice) * optimisticQty : 0
        });
      } else {
        mergedItems.push(item);
      }
    });

    // Then, add any new items from optimistic state
    optimisticInventory.forEach((quantity, itemId) => {
      if (!serverItemsMap.has(itemId) && quantity > 0) {
        const marketItem = marketItems.get(itemId);
        if (marketItem) {
          mergedItems.push({
            id: `optimistic-${itemId}`,
            playerId: player!.id,
            itemId: itemId,
            quantity: quantity,
            locationType: 'port',
            locationId: 'port-1',
            acquiredPrice: marketItem.currentPrice,
            acquiredAt: new Date(),
            lastUpdated: new Date(),
            itemName: marketItem.name,
            currentPrice: marketItem.currentPrice,
            profit: 0 // New items have no profit yet
          });
        }
      }
    });

    // Filter out items with 0 quantity
    return mergedItems.filter(item => item.quantity > 0);
  };

  useEffect(() => {
    if (!player) return;
    loadInventory();
  }, [player]);
  
  // Subscribe to transaction events to reload inventory after buy/sell
  useEffect(() => {
    const unsubscribe = onTransactionComplete(() => {
      loadInventory();
    });
    
    return unsubscribe;
  }, [onTransactionComplete]);

  // Update profit calculations when market prices change
  useEffect(() => {
    if (!player || loading) return;
    
    const enhancedItems: ExtendedInventoryItem[] = serverInventory.map(item => {
      const marketItem = marketItems.get(item.itemId);
      return {
        ...item,
        itemName: marketItem?.name || item.itemName || 'Unknown Item',
        currentPrice: marketItem?.currentPrice || item.currentPrice || 0,
        profit: marketItem ? (marketItem.currentPrice * 0.9 - item.acquiredPrice) * item.quantity : 0
      };
    });
    
    setServerInventory(enhancedItems);
  }, [marketItems]);

  const displayInventory = getMergedInventory();

  if (loading) {
    return (
      <Panel title="Your Inventory" className="mb-4">
        <p className="text-gray-500">Loading inventory...</p>
      </Panel>
    );
  }

  if (displayInventory.length === 0) {
    return (
      <Panel title="Your Inventory" className="mb-4">
        <p className="text-gray-500">No items in inventory at this location</p>
      </Panel>
    );
  }

  return (
    <Panel title="Your Inventory" className="mb-4">
      <div className="space-y-2">
        {displayInventory.map((item) => {
          const profit = item.profit || 0;
          const profitPercent = item.quantity > 0 && item.acquiredPrice > 0 
            ? ((profit / (item.acquiredPrice * item.quantity)) * 100).toFixed(1)
            : '0.0';
          
          return (
            <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{item.itemName}</h4>
                  <p className="text-sm text-gray-600">
                    {item.quantity} units @ ${item.acquiredPrice.toFixed(2)} each
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current: ${item.currentPrice?.toFixed(2) || '?'}</p>
                  <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)} ({profitPercent}%)
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center font-semibold">
            <span>Total Potential Profit:</span>
            <span className={displayInventory.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
              ${displayInventory.reduce((sum, item) => sum + (item.profit || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
};