# State Management Architecture Explained

## Overview

We use a **hybrid state management** approach combining:
- **Zustand** for client-side state management
- **Supabase** as the server-side database (source of truth)
- **Event-driven updates** to keep UI in sync

## State Stores

### 1. Empire Store (`useEmpireStore`)
**Location**: `/src/store/empireStore.ts`
**Manages**: Player data, cash, empire-level state
```javascript
{
  player: { id, username, cash, empire },
  updatePlayerCash: (amount) => // Updates cash locally
}
```

### 2. Market Store (`useMarketStore`)
**Location**: `/app/store/useMarketStore.ts`
**Manages**: Market items, prices, transactions
```javascript
{
  items: Map<itemId, MarketItem>,  // All market items
  transactions: Transaction[],      // Recent transactions
  transactionListeners: [],         // Event callbacks
  
  // Actions
  buyItem: async () => {},
  sellItem: async () => {},
  onTransactionComplete: () => {},  // Subscribe to events
}
```

### 3. Component State (React)
**Manages**: UI-specific state
```javascript
const [playerInventory, setPlayerInventory] = useState()  // Local cache
const [isProcessing, setIsProcessing] = useState()        // Loading states
const [tradeAmount, setTradeAmount] = useState()          // Form inputs
```

## Data Flow Example: Buying an Item

### Step 1: User Clicks "Buy"
```javascript
// In MarketTradingPanel.tsx
handleTrade('buy')
  ↓
setIsProcessing('buy')  // Shows "Processing..." on button
```

### Step 2: Call Market Store
```javascript
const transaction = await buyItem(itemId, quantity, playerId)
```

### Step 3: Market Store → Server
```javascript
// In useMarketStore.ts
buyItem: async (itemId, quantity, playerId) => {
  // 1. Send to Supabase
  const transaction = await marketService.buyItem(...)
  
  // 2. Update local state optimistically
  set({
    items: newItems,        // Update supply/demand
    transactions: [...],    // Add transaction
  })
  
  // 3. Notify listeners after delay
  setTimeout(() => {
    notifyTransactionComplete()
  }, 300)
}
```

### Step 4: Server Updates Database
```javascript
// In markets.ts service
buyItem: async () => {
  // 1. Insert transaction
  await supabase.from('transactions').insert(...)
  
  // 2. Update market dynamics
  await updateMarketDynamics(...)
  
  // 3. Add to player inventory
  await inventoryService.addToInventory(...)
}
```

### Step 5: UI Components Update
```javascript
// Transaction completes → Market store notifies → Components reload

// In MarketTradingPanel.tsx
setTimeout(() => {
  loadPlayerInventory()  // Fetch fresh data from server
}, 500)

// In InventoryStatus.tsx
useEffect(() => {
  const unsubscribe = onTransactionComplete(() => {
    fetchInventory()  // Refetch when notified
  })
}, [])
```

## State Synchronization

### Client State (Zustand)
- **Purpose**: Fast UI updates, caching
- **Contains**: Market prices, recent transactions
- **Updates**: Immediately for optimistic UI

### Server State (Supabase)
- **Purpose**: Source of truth, persistence
- **Contains**: Player inventory, actual ownership, balances
- **Updates**: On every transaction

### Synchronization Strategy
1. **Optimistic Updates**: Update UI immediately
2. **Server Confirmation**: Wait for server response
3. **Refetch Data**: Get fresh state from server
4. **Event Notification**: Tell all components to update

## Real Example: Selling 10 Consumer Goods

```
1. USER ACTION
   Click "Sell" → tradeAmount = 10

2. CLIENT STATE
   setIsProcessing('sell')
   Button shows "Processing..."

3. MARKET STORE
   sellItem(itemId, 10, playerId)
   → Calls server API
   → Updates local supply (+10)
   → Updates local demand (-1)

4. SERVER (Supabase)
   - DELETE 10 units from player_inventory
   - UPDATE market_items SET supply = supply + 10
   - INSERT INTO transactions
   - UPDATE player SET cash = cash + saleAmount

5. CLIENT RESPONSE
   - Update player cash locally
   - Wait 500ms
   - Reload inventory from server
   - Notify all listeners

6. UI UPDATES
   - InventorySection refetches → Shows new quantities
   - InventoryStatus refetches → "You own: X units" updates
   - MarketTradingPanel → Inventory map updates
   - Transaction appears in Recent Transactions
```

## Why This Architecture?

### Benefits
1. **Server Authority**: Server always has correct data
2. **Fast UI**: Optimistic updates feel instant
3. **Consistency**: Event system keeps everything in sync
4. **Simple**: Clear separation of concerns

### Trade-offs
1. **Network Delays**: Need to wait for server
2. **Complexity**: Multiple state sources to manage
3. **Race Conditions**: Need careful timing (hence delays)

## Key Principles

1. **Server is Truth**: Always fetch fresh data after mutations
2. **Optimistic UI**: Update locally first, verify later
3. **Event-Driven**: Components subscribe to changes
4. **Defensive Coding**: Delays ensure server has updated
5. **Clear Loading States**: User always knows what's happening