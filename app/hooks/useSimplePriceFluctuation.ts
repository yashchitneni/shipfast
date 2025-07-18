import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/app/store/useMarketStore';

/**
 * Simple price fluctuation hook that only updates local state
 * No database calls - just UI updates for dynamic trading
 */
export const useSimplePriceFluctuation = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fluctuatePrices = () => {
      // Get current state directly
      const state = useMarketStore.getState();
      const { items } = state;
      
      if (!items || items.size === 0) return;

      console.log('Price fluctuation cycle starting...');
      
      // Create new items with fluctuated prices
      const updatedItems = new Map<string, any>();
      
      items.forEach((item, id) => {
        // Skip invalid items
        if (!item || !item.currentPrice || !item.basePrice) return;
        
        // Random price change between -20% and +20%
        const changePercent = (Math.random() - 0.5) * 0.4;
        const priceChange = item.currentPrice * changePercent;
        
        const newPrice = Math.max(
          item.basePrice * 0.5, // Min 50% of base
          Math.min(
            item.basePrice * 2.0, // Max 200% of base
            item.currentPrice + priceChange
          )
        );

        // Also fluctuate supply and demand slightly
        const supplyChange = (Math.random() - 0.5) * 0.1; // ±5%
        const demandChange = (Math.random() - 0.5) * 0.15; // ±7.5%

        updatedItems.set(id, {
          ...item,
          currentPrice: Number(newPrice.toFixed(2)),
          supply: Math.max(100, Math.round(item.supply * (1 + supplyChange))),
          demand: Math.max(100, Math.round(item.demand * (1 + demandChange))),
          lastUpdated: new Date()
        });
      });

      // Update store directly - no async, no database
      useMarketStore.setState({ items: updatedItems });

      // Log first 3 price changes
      const changes: string[] = [];
      let count = 0;
      updatedItems.forEach((newItem, id) => {
        if (count >= 3) return;
        const oldItem = items.get(id);
        if (oldItem && newItem) {
          const change = ((newItem.currentPrice - oldItem.currentPrice) / oldItem.currentPrice * 100).toFixed(1);
          changes.push(`${newItem.name}: $${oldItem.currentPrice.toFixed(2)} → $${newItem.currentPrice.toFixed(2)} (${change}%)`);
          count++;
        }
      });
      
      if (changes.length > 0) {
        console.log('Price changes:', changes.join(' | '));
      }
    };

    // Initial fluctuation
    fluctuatePrices();

    // Set up interval with random timing
    const startRandomInterval = () => {
      const randomDelay = 5000 + Math.random() * 10000; // 5-15 seconds
      intervalRef.current = setTimeout(() => {
        fluctuatePrices();
        startRandomInterval(); // Schedule next
      }, randomDelay);
    };

    startRandomInterval();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled]);

  return {
    // Manual trigger for testing
    triggerFluctuation: () => {
      const state = useMarketStore.getState();
      if (state.items && state.items.size > 0) {
        console.log('Manual price fluctuation triggered');
        // Re-run the effect
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
        }
      }
    }
  };
};