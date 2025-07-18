# Inventory Sell Error Debug Guide

## Problem
When clicking "Sell" on any market item, the player gets:
- "Player does not own this item at location: 'port-1'"
- "Failed to complete sale" error
- Console shows circular error logging

## Root Cause
The player has **no inventory items** in the database. The sell function correctly checks if the player owns the item before allowing the sale, but since the player_inventory table is empty, all sell attempts fail.

## Debug Logs Added

### 1. MarketTradingPanel.tsx
```javascript
console.log('=== MARKET TRADING PANEL: SELL ATTEMPT ===');
console.log('Player:', player);
console.log('Selected item ID:', selectedItem);
console.log('Selected market item:', selectedMarketItem);
```

### 2. markets.ts (sellItem)
```javascript
console.log('=== SELL ITEM DEBUG START ===');
console.log('sellItem called with:', { itemId, quantity, playerId, locationId, clientPrice });
console.log('Player inventory response:', playerInventory);
console.log('Inventory count:', playerInventory.length);
```

### 3. inventory.ts (getInventoryAtLocation)
```javascript
console.log('=== INVENTORY SERVICE: getInventoryAtLocation ===');
console.log('Parameters:', { playerId, locationId });
console.log('Supabase query response:', { data, error });
```

## Expected Console Output
When you click sell, you should see:
1. Player ID and selected item details
2. Inventory query to Supabase
3. Empty inventory array response
4. Error message about not owning the item

## Solution

### Option 1: Run Starting Inventory Script (Recommended)
```sql
-- Give player starting inventory
INSERT INTO player_inventory (player_id, item_id, quantity, location_type, location_id, acquired_price)
SELECT 
  '00000000-0000-0000-0000-000000000001', -- Your player ID
  id,
  CASE 
    WHEN current_price < 100 THEN 50
    WHEN current_price < 500 THEN 20
    ELSE 10
  END as quantity,
  'port' as location_type,
  'port-1' as location_id,
  current_price * 0.9 as acquired_price
FROM market_items
LIMIT 5;
```

### Option 2: Buy Items First
Players need to buy items before they can sell them. However, with $50,000 starting cash, they can't afford most items.

### Option 3: Adjust Starting Cash
Update player starting cash to $500,000 so they can buy items:
```sql
UPDATE player 
SET cash = 500000 
WHERE user_id = '00000000-0000-0000-0000-000000000001';
```

## Testing Steps
1. Open browser console
2. Navigate to game
3. Open Market tab
4. Click on any item
5. Click Sell
6. Check console logs to see the debug flow
7. Run one of the solutions above
8. Try selling again - should work!

## Circular Error Issue
The "circular error" in console happens because:
1. Error is thrown in sellItem
2. Caught and re-thrown
3. Caught again in UI and logged
4. Creates nested error logging

This is just verbose logging, not an actual circular reference.