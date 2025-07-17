# State Management Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the current fragmented store architecture to the unified empire store.

## Migration Phases

### Phase 1: Setup and Testing (Week 1)

#### 1.1 Create Unified Store Structure
- [x] Create `empireStore.unified.ts` with all slices
- [ ] Set up comprehensive test suite
- [ ] Create migration utilities
- [ ] Set up performance monitoring

#### 1.2 Parallel Implementation
- [ ] Run both old and new stores in parallel
- [ ] Add state synchronization middleware
- [ ] Monitor for discrepancies

### Phase 2: Component Migration (Weeks 2-3)

#### 2.1 Market Components
**Priority: HIGH - Most duplication**

Old stores to migrate:
- `useMarketStore`
- `useEconomyStore` (market-related parts)

Components to update:
```typescript
// Before
import { useMarketStore } from '@/store/useMarketStore';
import { useEconomyStore } from '@/store/useEconomyStore';

const MarketPanel = () => {
  const items = useMarketStore(state => state.items);
  const goods = useEconomyStore(state => state.goods);
  // ...
};

// After
import { useMarketItems, useGoods } from '@/store/empireStore.unified';

const MarketPanel = () => {
  const items = useMarketItems();
  const goods = useGoods();
  // ...
};
```

Migration checklist:
- [ ] MarketPanel component
- [ ] PriceChart component
- [ ] TransactionHistory component
- [ ] MarketAnalytics component
- [ ] GoodsTrading component

#### 2.2 Route Components
**Priority: MEDIUM**

Old store to migrate:
- `useRouteStore`

Components to update:
```typescript
// Before
import { useRouteStore } from '@/store/useRouteStore';

const RouteManager = () => {
  const routes = useRouteStore(state => state.routes);
  const createRoute = useRouteStore(state => state.createRoute);
  // ...
};

// After
import { useRoutes, useUnifiedEmpireStore } from '@/store/empireStore.unified';

const RouteManager = () => {
  const routes = useRoutes();
  const createRoute = useUnifiedEmpireStore(state => state.createRoute);
  // ...
};
```

Migration checklist:
- [ ] RouteManager component
- [ ] RouteCreator component
- [ ] RouteOptimizer component
- [ ] RouteAnalytics component

#### 2.3 AI Components
**Priority: MEDIUM**

Old store to migrate:
- `useAIStore`

Components to update:
```typescript
// Before
import { useAIStore } from '@/store/useAIStore';

const AICompanionPanel = () => {
  const companion = useAIStore(state => state.companion);
  const suggestions = useAIStore(state => state.suggestions);
  // ...
};

// After
import { useAICompanion, useAISuggestions } from '@/store/empireStore.unified';

const AICompanionPanel = () => {
  const companion = useAICompanion();
  const suggestions = useAISuggestions();
  // ...
};
```

Migration checklist:
- [ ] AICompanionPanel component
- [ ] SuggestionsList component
- [ ] AILevelProgress component
- [ ] AISettings component

#### 2.4 Time Components
**Priority: LOW - Mostly independent**

Old store to migrate:
- `timeStore`

Components to update:
```typescript
// Before
import { useTimeStore } from '@/stores/timeStore';

const TimeControl = () => {
  const speed = useTimeStore(state => state.speed);
  const setSpeed = useTimeStore(state => state.setSpeed);
  // ...
};

// After
import { useGameSpeed, useUnifiedEmpireStore } from '@/store/empireStore.unified';

const TimeControl = () => {
  const speed = useGameSpeed();
  const setSpeed = useUnifiedEmpireStore(state => state.setGameSpeed);
  // ...
};
```

Migration checklist:
- [ ] TimeControl component
- [ ] Calendar component
- [ ] EventTimeline component
- [ ] SeasonIndicator component

### Phase 3: Store Removal (Week 4)

#### 3.1 Remove Old Stores
- [ ] Delete `useMarketStore.ts`
- [ ] Delete `useEconomyStore.ts`
- [ ] Delete `useRouteStore.ts`
- [ ] Delete `useAIStore.ts`
- [ ] Delete `timeStore.ts`

#### 3.2 Update Imports
- [ ] Global search and replace old imports
- [ ] Update test files
- [ ] Update utility functions

#### 3.3 Clean Up
- [ ] Remove migration utilities
- [ ] Remove synchronization middleware
- [ ] Update documentation

## Migration Utilities

### State Synchronization Middleware

```typescript
// src/store/migrationMiddleware.ts
export const createSyncMiddleware = () => {
  return (config: any) => (set: any, get: any, api: any) =>
    config(
      (args: any) => {
        // Call original set
        set(args);
        
        // Sync to unified store
        const state = get();
        if (state.marketItems) {
          useUnifiedEmpireStore.setState({
            marketItems: state.marketItems
          });
        }
      },
      get,
      api
    );
};
```

### Migration Helpers

```typescript
// src/store/migrationHelpers.ts

// Helper to migrate market data
export const migrateMarketData = () => {
  const marketStore = useMarketStore.getState();
  const economyStore = useEconomyStore.getState();
  
  useUnifiedEmpireStore.setState({
    marketItems: marketStore.items,
    goods: economyStore.goods,
    priceHistory: marketStore.priceHistory,
    marketDynamics: marketStore.marketDynamics,
    economyModifiers: economyStore.economyModifiers
  });
};

// Helper to migrate route data
export const migrateRouteData = () => {
  const routeStore = useRouteStore.getState();
  
  useUnifiedEmpireStore.setState({
    routes: routeStore.routes,
    routeStates: routeStore.routeStates,
    routeEvents: routeStore.routeEvents,
    activeRoutes: routeStore.activeRoutes
  });
};

// Master migration function
export const migrateAllStores = () => {
  migrateMarketData();
  migrateRouteData();
  // ... other migrations
};
```

## Testing Strategy

### 1. Unit Tests

```typescript
// src/store/__tests__/unifiedStore.test.ts
describe('Unified Empire Store', () => {
  describe('Market Slice', () => {
    it('should update market prices correctly', () => {
      const { updateMarketPrices } = useUnifiedEmpireStore.getState();
      updateMarketPrices();
      
      const goods = useUnifiedEmpireStore.getState().goods;
      expect(goods.size).toBeGreaterThan(0);
    });
  });
  
  describe('Cross-Slice Interactions', () => {
    it('should calculate route profit using market prices', () => {
      const { calculateRouteProfit } = useUnifiedEmpireStore.getState();
      const profit = calculateRouteProfit('route-1');
      
      expect(profit).toBeGreaterThanOrEqual(0);
    });
  });
});
```

### 2. Integration Tests

```typescript
// src/store/__tests__/migration.test.ts
describe('Store Migration', () => {
  it('should maintain data integrity during migration', () => {
    // Set up old stores with test data
    useMarketStore.setState({ items: testMarketItems });
    useRouteStore.setState({ routes: testRoutes });
    
    // Run migration
    migrateAllStores();
    
    // Verify data in unified store
    const unifiedState = useUnifiedEmpireStore.getState();
    expect(unifiedState.marketItems).toEqual(testMarketItems);
    expect(unifiedState.routes).toEqual(testRoutes);
  });
});
```

### 3. Performance Tests

```typescript
// src/store/__tests__/performance.test.ts
describe('Store Performance', () => {
  it('should reduce re-renders with unified store', () => {
    // Measure re-renders with old architecture
    const oldRenders = measureRenders(() => {
      useMarketStore.setState({ items: newItems });
      useEconomyStore.setState({ goods: newGoods });
    });
    
    // Measure re-renders with unified store
    const newRenders = measureRenders(() => {
      useUnifiedEmpireStore.setState({
        marketItems: newItems,
        goods: newGoods
      });
    });
    
    expect(newRenders).toBeLessThan(oldRenders);
  });
});
```

## Performance Monitoring

### Metrics to Track

1. **Re-render Count**: Components should re-render less frequently
2. **Memory Usage**: Should decrease due to no duplication
3. **Update Latency**: State updates should be faster
4. **Bundle Size**: Should decrease after removing old stores

### Monitoring Code

```typescript
// src/utils/performanceMonitor.ts
export const monitorStorePerformance = () => {
  let updateCount = 0;
  let renderCount = 0;
  
  // Monitor state updates
  useUnifiedEmpireStore.subscribe(() => {
    updateCount++;
    console.log(`State update #${updateCount}`);
  });
  
  // Monitor component renders (in components)
  useEffect(() => {
    renderCount++;
    console.log(`Component render #${renderCount}`);
  });
  
  // Report metrics
  setInterval(() => {
    console.log({
      updatesPerMinute: updateCount,
      rendersPerMinute: renderCount
    });
    updateCount = 0;
    renderCount = 0;
  }, 60000);
};
```

## Rollback Plan

If issues arise during migration:

1. **Keep Old Stores**: Don't delete old stores immediately
2. **Feature Flags**: Use feature flags to switch between old/new
3. **Gradual Rollout**: Migrate one component at a time
4. **Monitor Errors**: Set up error tracking for migration issues

```typescript
// src/utils/featureFlags.ts
export const useStore = () => {
  const useUnifiedStore = getFeatureFlag('USE_UNIFIED_STORE');
  
  if (useUnifiedStore) {
    return useUnifiedEmpireStore;
  } else {
    // Return old store based on context
    return useMarketStore; // or other stores
  }
};
```

## Success Criteria

Migration is complete when:

1. ✅ All components use unified store
2. ✅ No duplicate state exists
3. ✅ Performance metrics improve by >20%
4. ✅ All tests pass
5. ✅ No increase in bug reports
6. ✅ Developer satisfaction improves

## Support

For questions during migration:
1. Check this guide first
2. Review test examples
3. Contact the architecture team
4. Document any issues encountered