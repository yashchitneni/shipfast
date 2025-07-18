# Optimistic UI Design for Market Trading

## The Concept

**Optimistic UI** = Show success immediately, verify with server later

```
Current Flow (Slow):
User Click → Wait for Server → Update UI → Show Success

Optimistic Flow (Fast):
User Click → Update UI Immediately → Server Request → Verify/Rollback
```

## Implementation Strategy

### 1. Immediate UI Updates

```javascript
// When user clicks "Buy 5 Iron Ore"
handleBuy() {
  // 1. Update UI immediately
  setPlayerInventory(prev => ({
    ...prev,
    'iron-ore': (prev['iron-ore'] || 0) + 5
  }))
  
  setPlayerCash(prev => prev - (5 * itemPrice))
  
  // 2. Show success immediately
  toast.success('Purchase successful!')
  
  // 3. Then verify with server
  try {
    const result = await buyItem(...)
    // Server confirmed - we're good!
  } catch (error) {
    // Server rejected - rollback!
    rollbackTransaction()
    toast.error('Purchase failed - reverting')
  }
}
```

### 2. Rollback Strategy

```javascript
// Store the "before" state
const rollbackState = {
  inventory: { ...playerInventory },
  cash: player.cash,
  marketSupply: item.supply
}

// If server fails, revert everything
const rollbackTransaction = () => {
  setPlayerInventory(rollbackState.inventory)
  setPlayerCash(rollbackState.cash)
  setMarketSupply(rollbackState.marketSupply)
}
```

### 3. Conflict Resolution

What if server returns different values than expected?

```javascript
// Expected: Buy 5 units for $100
// Server says: Actually bought 3 units for $60 (only 3 available)

const reconcileWithServer = (serverResponse) => {
  // Always trust server
  setPlayerInventory(serverResponse.newInventory)
  setPlayerCash(serverResponse.newCash)
  
  // Notify user of difference
  if (serverResponse.quantity < requestedQuantity) {
    toast.info(`Only ${serverResponse.quantity} units were available`)
  }
}
```

## Benefits

1. **Instant Feedback**: UI feels lightning fast
2. **Better UX**: No waiting for simple actions
3. **Handles Failures**: Graceful rollback if needed
4. **Server Authority**: Server still has final say

## Edge Cases to Handle

### 1. Partial Success
- User buys 10, but only 7 available
- Show initial success, then update with actual amount

### 2. Price Changes
- User sees $10, but price changed to $12
- Show purchase, then adjust cash if needed

### 3. Network Failures
- Request never reaches server
- Rollback after timeout

### 4. Race Conditions
- Multiple players buying same item
- Server handles conflicts, client adjusts

## Implementation Plan

### Phase 1: Basic Optimistic Updates
- Update inventory/cash immediately
- Rollback on server error
- Simple success/failure states

### Phase 2: Smart Reconciliation
- Handle partial successes
- Show differences to user
- Smooth animations for corrections

### Phase 3: Advanced Features
- Predictive inventory based on trends
- Queue multiple transactions
- Offline support with sync

## Code Example: Full Optimistic Buy

```javascript
const handleOptimisticBuy = async (itemId, quantity) => {
  // 1. Capture current state for rollback
  const rollback = captureCurrentState()
  
  // 2. Calculate expected changes
  const expectedCost = item.price * quantity
  const expectedInventory = currentInventory + quantity
  
  // 3. Apply optimistic updates
  updateUI({
    inventory: expectedInventory,
    cash: currentCash - expectedCost,
    supply: item.supply - quantity
  })
  
  // 4. Show immediate feedback
  showPendingTransaction(itemId, quantity)
  
  try {
    // 5. Send to server
    const serverResponse = await api.buyItem(itemId, quantity)
    
    // 6. Reconcile with server truth
    if (serverResponse.quantity !== quantity) {
      // Partial success
      updateUI(serverResponse.actualState)
      toast.info(`Purchased ${serverResponse.quantity} of ${quantity} requested`)
    }
    
    // 7. Confirm transaction
    confirmTransaction(serverResponse.transactionId)
    
  } catch (error) {
    // 8. Rollback on failure
    updateUI(rollback)
    toast.error('Purchase failed - reverting')
    cancelPendingTransaction()
  }
}
```

## UI Indicators

### During Optimistic Update
- Subtle loading indicator (not blocking)
- "Pending" badge on transaction
- Slightly faded values that are unconfirmed

### After Confirmation
- Remove loading indicators
- Solid values
- Success animation

### On Rollback
- Smooth animation back to original
- Clear error message
- Explanation of what happened