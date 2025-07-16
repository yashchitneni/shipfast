import { useEmpireStore } from '../empireStore';
import { Asset, Ship, Plane, Warehouse, Specialist, Route, AssetType } from '../../../types/game';
import { shallow } from 'zustand/shallow';
import React from 'react';

// Selector hooks for optimized re-renders

// Player selectors
export const usePlayer = () => useEmpireStore(state => state.player);
export const usePlayerCash = () => useEmpireStore(state => state.player?.cash ?? 0);
export const usePlayerLevel = () => useEmpireStore(state => state.player?.level ?? 1);
export const usePlayerExperience = () => useEmpireStore(state => state.player?.experience ?? 0);

// Asset selectors
export const useAssets = () => useEmpireStore(state => state.assets, shallow);
export const useShips = () => useEmpireStore(state => Object.values(state.assets.ships), shallow);
export const usePlanes = () => useEmpireStore(state => Object.values(state.assets.planes), shallow);
export const useWarehouses = () => useEmpireStore(state => Object.values(state.assets.warehouses), shallow);
export const useSpecialists = () => useEmpireStore(state => Object.values(state.assets.specialists), shallow);

export const useAsset = (assetId: string | null): Asset | null => {
  return useEmpireStore(state => {
    if (!assetId) return null;
    
    // Search through all asset categories
    for (const category of Object.values(state.assets)) {
      if (category[assetId]) {
        return category[assetId];
      }
    }
    return null;
  });
};

export const useAssetsByType = (type: AssetType): Asset[] => {
  return useEmpireStore(state => {
    switch (type) {
      case AssetType.SHIP:
        return Object.values(state.assets.ships);
      case AssetType.PLANE:
        return Object.values(state.assets.planes);
      case AssetType.WAREHOUSE:
        return Object.values(state.assets.warehouses);
      case AssetType.SPECIALIST:
        return Object.values(state.assets.specialists);
      default:
        return [];
    }
  }, shallow);
};

export const useActiveAssets = (): Asset[] => {
  return useEmpireStore(state => {
    const allAssets = [
      ...Object.values(state.assets.ships),
      ...Object.values(state.assets.planes),
      ...Object.values(state.assets.warehouses),
      ...Object.values(state.assets.specialists)
    ];
    return allAssets.filter(asset => asset.isActive);
  }, shallow);
};

// Route selectors
export const useRoutes = () => useEmpireStore(state => Object.values(state.routes), shallow);
export const useActiveRoutes = () => useEmpireStore(state => 
  state.activeRoutes.map(id => state.routes[id]).filter(Boolean), 
  shallow
);

export const useRoute = (routeId: string | null): Route | null => {
  return useEmpireStore(state => routeId ? state.routes[routeId] || null : null);
};

export const useRoutesByAsset = (assetId: string): Route[] => {
  return useEmpireStore(state => {
    return Object.values(state.routes).filter(route => 
      route.assignedAssets.includes(assetId)
    );
  }, shallow);
};

// Market selectors
export const useMarket = () => useEmpireStore(state => state.market, shallow);
export const useMarketGoods = () => useEmpireStore(state => Object.values(state.market.goods), shallow);
export const useMarketEvents = () => useEmpireStore(state => state.market.events, shallow);

export const useMarketGood = (goodId: string) => {
  return useEmpireStore(state => state.market.goods[goodId]);
};

export const usePriceHistory = (goodId: string) => {
  return useEmpireStore(state => state.market.priceHistory[goodId] || [], shallow);
};

// AI Companion selectors
export const useAICompanion = () => useEmpireStore(state => state.aiCompanion);
export const useAISuggestions = () => useEmpireStore(state => state.aiCompanion?.suggestions || [], shallow);

export const useUnreadSuggestions = () => {
  return useEmpireStore(state => 
    state.aiCompanion?.suggestions.filter(s => !s.isRead) || [],
    shallow
  );
};

// Game state selectors
export const useGameSession = () => useEmpireStore(state => state.gameSession);
export const useSettings = () => useEmpireStore(state => state.settings, shallow);
export const useIsLoading = () => useEmpireStore(state => state.isLoading);
export const useError = () => useEmpireStore(state => state.error);

// Notification selectors
export const useNotifications = () => useEmpireStore(state => state.notifications, shallow);
export const useUnreadNotifications = () => {
  return useEmpireStore(state => 
    state.notifications.filter(n => !n.isRead),
    shallow
  );
};

// Transaction selectors
export const useTransactions = (limit?: number) => {
  return useEmpireStore(state => {
    const transactions = state.transactions;
    return limit ? transactions.slice(0, limit) : transactions;
  }, shallow);
};

export const useTransactionsByType = (type: string) => {
  return useEmpireStore(state => 
    state.transactions.filter(t => t.type === type),
    shallow
  );
};

// Selection selectors
export const useSelectedAsset = (): Asset | null => {
  const assetId = useEmpireStore(state => state.selectedAssetId);
  return useAsset(assetId);
};

export const useSelectedRoute = (): Route | null => {
  const routeId = useEmpireStore(state => state.selectedRouteId);
  return useRoute(routeId);
};

// Computed selectors
export const useTotalAssets = () => {
  return useEmpireStore(state => {
    const ships = Object.keys(state.assets.ships).length;
    const planes = Object.keys(state.assets.planes).length;
    const warehouses = Object.keys(state.assets.warehouses).length;
    const specialists = Object.keys(state.assets.specialists).length;
    return ships + planes + warehouses + specialists;
  });
};

export const useTotalMaintenanceCost = () => {
  return useEmpireStore(state => {
    const allAssets = [
      ...Object.values(state.assets.ships),
      ...Object.values(state.assets.planes),
      ...Object.values(state.assets.warehouses),
      ...Object.values(state.assets.specialists)
    ];
    
    return allAssets.reduce((total, asset) => {
      if (asset.isActive) {
        // Higher maintenance for lower condition
        const conditionMultiplier = 1 + ((100 - asset.condition) / 100);
        return total + (asset.maintenanceCost * conditionMultiplier);
      }
      return total;
    }, 0);
  });
};

export const useNetWorth = () => {
  return useEmpireStore(state => {
    const cash = state.player?.cash || 0;
    
    const allAssets = [
      ...Object.values(state.assets.ships),
      ...Object.values(state.assets.planes),
      ...Object.values(state.assets.warehouses),
      ...Object.values(state.assets.specialists)
    ];
    
    const assetValue = allAssets.reduce((total, asset) => {
      // Asset value depreciates based on condition
      const depreciatedValue = asset.purchasePrice * (asset.condition / 100);
      return total + depreciatedValue;
    }, 0);
    
    return cash + assetValue;
  });
};

// Complex computed selectors with memoization
export const useRouteEfficiency = (routeId: string) => {
  return useEmpireStore(state => {
    const route = state.routes[routeId];
    if (!route) return 0;
    
    // Get assigned assets
    const assets = route.assignedAssets
      .map(id => {
        for (const category of Object.values(state.assets)) {
          if (category[id]) return category[id];
        }
        return null;
      })
      .filter(Boolean) as Asset[];
    
    if (assets.length === 0) return 0;
    
    // Calculate average efficiency of assigned assets
    const avgEfficiency = assets.reduce((sum, asset) => sum + asset.efficiency, 0) / assets.length;
    
    // Factor in route efficiency
    return (route.efficiency + avgEfficiency) / 2;
  });
};

export const useMarketTrends = (goodId: string, periods: number = 10) => {
  return useEmpireStore(state => {
    const history = state.market.priceHistory[goodId] || [];
    const recent = history.slice(-periods);
    
    if (recent.length < 2) return { trend: 'stable', change: 0 };
    
    const first = recent[0].price;
    const last = recent[recent.length - 1].price;
    const change = ((last - first) / first) * 100;
    
    let trend: 'rising' | 'falling' | 'stable';
    if (change > 5) trend = 'rising';
    else if (change < -5) trend = 'falling';
    else trend = 'stable';
    
    return { trend, change };
  });
};

// Performance monitoring hook
export const useStorePerformance = () => {
  const [metrics, setMetrics] = React.useState({
    subscriptions: 0,
    updates: 0,
    avgUpdateTime: 0
  });
  
  React.useEffect(() => {
    let updateCount = 0;
    let totalTime = 0;
    
    const unsubscribe = useEmpireStore.subscribe(() => {
      const start = performance.now();
      updateCount++;
      
      // Measure update time
      requestAnimationFrame(() => {
        const updateTime = performance.now() - start;
        totalTime += updateTime;
        
        setMetrics({
          subscriptions: useEmpireStore.getState().notifications.length, // Example metric
          updates: updateCount,
          avgUpdateTime: totalTime / updateCount
        });
      });
    });
    
    return unsubscribe;
  }, []);
  
  return metrics;
};