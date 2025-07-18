'use client';

import React from 'react';
import { useEmpireStore } from '@/src/store/empireStore';
import { useMarketStore } from '@/app/store/useMarketStore';

interface InventoryStatusProps {
  itemId: string;
  locationId: string;
  optimisticQuantity?: number | null;
}

export const InventoryStatus: React.FC<InventoryStatusProps> = ({ itemId, locationId, optimisticQuantity }) => {
  const { player } = useEmpireStore();
  const { onTransactionComplete } = useMarketStore();
  const [serverQuantity, setServerQuantity] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Use optimistic quantity if available, otherwise use server quantity
  const quantity = optimisticQuantity !== undefined ? optimisticQuantity : serverQuantity;

  const fetchInventory = async () => {
    if (!player) {
      setLoading(false);
      return;
    }

    try {
      // Dynamic import to avoid server-side execution
      const { inventoryService } = await import('@/lib/supabase/inventory');
      const inventory = await inventoryService.getInventoryAtLocation(player.id, locationId);
      const item = inventory.find(inv => inv.itemId === itemId);
      setServerQuantity(item?.quantity || 0);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setServerQuantity(0);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInventory();
  }, [player, itemId, locationId]);
  
  // Subscribe to transaction events to refresh quantity
  React.useEffect(() => {
    const unsubscribe = onTransactionComplete(() => {
      fetchInventory();
    });
    
    return unsubscribe;
  }, [onTransactionComplete]);

  if (loading) {
    return <span className="text-xs text-gray-500">Loading...</span>;
  }

  if (!player) {
    return <span className="text-xs text-gray-500">Login to see inventory</span>;
  }

  return (
    <span className={`text-xs font-medium ${quantity !== null && quantity > 0 ? 'text-green-600' : 'text-gray-400'}`}>
      You own: {quantity || 0} units
    </span>
  );
};