import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/app/store/useMarketStore';

// Price fluctuation hook - makes prices change every 5-15 seconds
export const usePriceFluctuation = (enabled: boolean = true) => {
  const { items, updateMarketCycle } = useMarketStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || items.size === 0) return;

    // Function to randomly update prices
    const fluctuatePrices = async () => {
      console.log('Price fluctuation cycle starting...');
      
      // Update each item's price with more dramatic changes
      const updatedItems = Array.from(items.values()).map(item => {
        // Random price change between -20% and +20%
        const changePercent = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2
        const priceChange = item.currentPrice * changePercent;
        const newPrice = Math.max(
          item.basePrice * 0.5, // Minimum 50% of base price
          Math.min(
            item.basePrice * 2.0, // Maximum 200% of base price
            item.currentPrice + priceChange
          )
        );

        // Also fluctuate supply and demand
        const supplyChange = (Math.random() - 0.5) * 0.2;
        const demandChange = (Math.random() - 0.5) * 0.3;

        return {
          ...item,
          currentPrice: Number(newPrice.toFixed(2)),
          supply: Math.max(100, item.supply * (1 + supplyChange)),
          demand: Math.max(100, item.demand * (1 + demandChange))
        };
      });

      // Update store with new prices
      const newItemsMap = new Map(updatedItems.map(item => [item.id, item]));
      useMarketStore.setState({ items: newItemsMap });

      // Skip database update for now - just do local fluctuation
      // This avoids the error and keeps prices changing in the UI
      // TODO: Re-enable once price_history table is confirmed to exist

      // Log some price changes for debugging
      const priceChanges = updatedItems.slice(0, 3).map(item => {
        const oldItem = items.get(item.id);
        const change = oldItem ? ((item.currentPrice - oldItem.currentPrice) / oldItem.currentPrice * 100).toFixed(1) : 0;
        return `${item.name}: $${oldItem?.currentPrice.toFixed(2)} → $${item.currentPrice.toFixed(2)} (${change}%)`;
      });
      console.log('Price changes:', priceChanges.join(' | '));
    };

    // Start with an immediate fluctuation
    fluctuatePrices();

    // Then fluctuate every 5-15 seconds
    const startRandomInterval = () => {
      const randomDelay = 5000 + Math.random() * 10000; // 5-15 seconds
      intervalRef.current = setTimeout(() => {
        fluctuatePrices();
        startRandomInterval(); // Schedule next fluctuation
      }, randomDelay);
    };

    startRandomInterval();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, items.size]);

  return {
    forceFluctuation: async () => {
      // Manual trigger for testing
      const { updateMarketCycle } = useMarketStore.getState();
      await updateMarketCycle();
    }
  };
};