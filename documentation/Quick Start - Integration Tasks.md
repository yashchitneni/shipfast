# Quick Start Guide: Immediate Integration Tasks

## 🚨 CRITICAL: The Integration Problem

Your UI components are built but disconnected from real data. They're using mock data instead of the Zustand stores. This MUST be fixed before adding any new features.

## 🎯 Today's Priority Tasks

### 1. Fix MarketTradingPanel.tsx (2-3 hours)

**Current Problem**: Using `MOCK_MARKET_ITEMS` instead of real market data

**Quick Fix**:
```typescript
// REMOVE THIS:
const MOCK_MARKET_ITEMS = [...];

// ADD THIS:
import { useMarketStore } from '@/app/store/useMarketStore';

const MarketTradingPanel = () => {
  const { marketItems, buyItem, sellItem } = useMarketStore();
  
  // Use marketItems instead of MOCK_MARKET_ITEMS
  return (
    <div>
      {marketItems.map(item => (
        // Render real items
      ))}
    </div>
  );
};
```

### 2. Fix FinancialDashboard.tsx (2-3 hours)

**Current Problem**: Hardcoded revenue/expense data

**Quick Fix**:
```typescript
// REMOVE THIS:
const mockData = { revenue: 50000, expenses: 30000 };

// ADD THIS:
import { useEconomyStore } from '@/app/store/useEconomyStore';
import { useEmpireStore } from '@/src/store/empireStore';

const FinancialDashboard = () => {
  const { calculateRevenue, calculateExpenses } = useEconomyStore();
  const { placedAssets, routes } = useEmpireStore();
  
  const revenue = calculateRevenue(routes);
  const expenses = calculateExpenses(placedAssets);
  
  // Use real calculated values
};
```

### 3. Fix RouteManager.tsx (2-3 hours)

**Current Problem**: Using mock routes instead of store data

**Quick Fix**:
```typescript
// REMOVE THIS:
const MOCK_ROUTES = [...];

// ADD THIS:
import { useRouteStore } from '@/app/store/useRouteStore';

const RouteManager = () => {
  const { routes, createRoute, deleteRoute, assignAssetToRoute } = useRouteStore();
  
  // Use real routes from store
  return (
    <div>
      {Array.from(routes.values()).map(route => (
        // Render real routes
      ))}
    </div>
  );
};
```

## 🔧 State Management Cleanup (1 day)

### Unify Your Stores

You have multiple Zustand stores that need to work together:

```typescript
// src/store/empireStore.ts - MAIN STORE
export const useEmpireStore = create<EmpireState>(() => ({
  // This should be the root - other stores subscribe to it
}));

// app/store/useMarketStore.ts - CHILD STORE
export const useMarketStore = create<MarketState>(() => ({
  // Should update empireStore when prices change
}));

// app/store/useEconomyStore.ts - CHILD STORE  
export const useEconomyStore = create<EconomyState>(() => ({
  // Should read from empireStore for calculations
}));
```

### Quick Integration Pattern

```typescript
// In child stores, subscribe to parent:
const useMarketStore = create<MarketState>((set, get) => ({
  updatePrices: (newPrices) => {
    set({ prices: newPrices });
    
    // Also update parent store
    useEmpireStore.getState().setMarketPrices(newPrices);
  }
}));
```

## ✅ Verification Checklist

After each fix, verify:

1. **No Mock Data**: Search for "MOCK" in the file - should find nothing
2. **Store Connection**: Component imports and uses the appropriate store
3. **Data Persistence**: Actions in UI update the database via store
4. **No Console Errors**: Check browser console for errors
5. **Real-time Updates**: UI reflects changes immediately

## 🚀 Next Steps (After Integration)

Only after ALL components use real data:

1. **Phase 2.5**: Implement dynamic ports with zoom levels
2. **Phase 3**: Add market dynamics and events
3. **Phase 4**: Multiplayer features

## ⚠️ Common Pitfalls to Avoid

1. **Don't add features to broken components** - Fix integration first
2. **Don't create new mock data** - Use real stores
3. **Don't duplicate state** - Single source of truth
4. **Don't skip testing** - Verify each integration works

## 💡 Pro Tips

- Use React DevTools to inspect component props
- Use Zustand DevTools to monitor store changes
- Add console.logs temporarily to verify data flow
- Test one component at a time

## 📋 Today's Success Criteria

By end of day, you should have:
- [ ] MarketTradingPanel using real market data
- [ ] FinancialDashboard showing actual revenue/expenses
- [ ] RouteManager displaying real routes
- [ ] All mock data removed from these components
- [ ] Store actions updating the database

Remember: **Integration before Innovation!**