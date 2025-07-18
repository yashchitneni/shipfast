# Architecture Decision: Client-Side Price Fluctuation

## Decision
Use client-side price fluctuation with server-side transaction logging.

## How It Works

### 1. Price Generation (Frontend)
```typescript
// Prices fluctuate randomly on each client
// Base prices from database provide starting point
// Each player sees slightly different prices at any moment
// Creates natural arbitrage opportunities
```

### 2. Transaction Recording (Backend)
```typescript
// When player buys/sells:
// - Use the price they see at that moment
// - Record actual transaction price in database
// - This becomes the "historical fact"
```

### 3. Data Flow
```
Database (Base Prices) → Frontend (Fluctuating Display) → Transaction (Locked Price) → Database (Historical Record)
```

## Benefits

1. **Performance**: No database writes for price updates
2. **Reliability**: No errors from failed price syncs
3. **Gameplay**: More dynamic and responsive
4. **Scalability**: Can handle many players
5. **Simplicity**: Less code, fewer failure points

## Potential Issues & Solutions

### Issue 1: Price Manipulation
**Risk**: Players could modify client-side prices
**Solution**: 
- Validate prices server-side within acceptable ranges
- Flag suspicious transactions (e.g., buying at 10% of base price)
- Set min/max bounds (50%-200% of base price)

### Issue 2: Player Synchronization
**Risk**: Players see different prices
**Solution**: 
- This is actually a feature! Creates realistic market
- Different information = trading opportunities
- Just like real markets

### Issue 3: Historical Analysis
**Risk**: No central price history
**Solution**:
- Transaction history shows actual traded prices
- Can reconstruct market trends from transactions
- More realistic than artificial price history

### Issue 4: Multiplayer Trading
**Risk**: Direct player-to-player trades need agreed prices
**Solution**:
- Use transaction price from seller's view
- Or average both players' prices
- Or create "market orders" that execute at current price

## Implementation Changes

### 1. Modify Transaction Recording
```sql
-- Add actual_price to transactions table
ALTER TABLE transactions 
ADD COLUMN actual_market_price DECIMAL(10,2);

-- This records what the market showed when traded
```

### 2. Price Validation Service
```typescript
// Validate prices are within acceptable range
function validateTransactionPrice(
  itemId: string, 
  submittedPrice: number, 
  basePrice: number
): boolean {
  const minPrice = basePrice * 0.4;  // 40% of base
  const maxPrice = basePrice * 2.5;  // 250% of base
  return submittedPrice >= minPrice && submittedPrice <= maxPrice;
}
```

### 3. Suspicious Activity Detection
```sql
-- Query to find suspicious trades
SELECT * FROM transactions 
WHERE actual_market_price < (base_price * 0.5) 
   OR actual_market_price > (base_price * 2.0);
```

## Future Enhancements

1. **Regional Price Variations**
   - Different ports have different base prices
   - Creates trade routes

2. **Event-Driven Fluctuations**
   - Wars increase weapon prices
   - Seasons affect food prices
   - News events cause spikes

3. **Market Depth**
   - Large trades affect local prices more
   - Supply/demand actually matters

4. **Price Discovery**
   - Players' trades influence base prices over time
   - True market dynamics emerge

## Conclusion

Client-side price fluctuation with server-side transaction logging is the optimal approach for this game. It provides better performance, reliability, and gameplay while maintaining data integrity for actual transactions.