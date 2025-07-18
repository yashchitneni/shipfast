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

export const InventorySection: React.FC = () => {
  const { player } = useEmpireStore();
  const { items: marketItems, onTransactionComplete } = useMarketStore();
  const [inventory, setInventory] = useState<ExtendedInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    if (!player) return;
    
    try {
      setLoading(true);
      // Get inventory at current location (assuming port-1 for now)
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
      
      setInventory(enhancedItems);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
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

  // Reload inventory when market items change (prices update)
  useEffect(() => {
    if (!player || loading) return;
    
    // Update profit calculations when market prices change
    const enhancedItems: ExtendedInventoryItem[] = inventory.map(item => {
      const marketItem = marketItems.get(item.itemId);
      return {
        ...item,
        itemName: marketItem?.name || item.itemName || 'Unknown Item',
        currentPrice: marketItem?.currentPrice || item.currentPrice || 0,
        profit: marketItem ? (marketItem.currentPrice * 0.9 - item.acquiredPrice) * item.quantity : 0
      };
    });
    
    setInventory(enhancedItems);
  }, [marketItems]);

  if (loading) {
    return (
      <Panel title="Your Inventory" className="mb-4">
        <p className="text-gray-500">Loading inventory...</p>
      </Panel>
    );
  }

  if (inventory.length === 0) {
    return (
      <Panel title="Your Inventory" className="mb-4">
        <p className="text-gray-500">No items in inventory at this location</p>
      </Panel>
    );
  }

  return (
    <Panel title="Your Inventory" className="mb-4">
      <div className="space-y-2">
        {inventory.map((item) => {
          const profit = item.profit || 0;
          const profitPercent = ((profit / (item.acquiredPrice * item.quantity)) * 100).toFixed(1);
          
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
            <span className={inventory.reduce((sum, item) => sum + (item.profit || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
              ${inventory.reduce((sum, item) => sum + (item.profit || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
};