# Starting Inventory System Setup Guide

## Overview
This guide walks you through setting up the automatic starting inventory system that gives new players randomized items worth up to $10,000 when they join the game.

## Step 1: Run the Starting Inventory Migration

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the entire contents of `/supabase/migrations/014_starting_inventory_system.sql`
5. Click "Run" to execute the migration

This migration creates:
- A function `generate_starting_inventory()` that creates randomized starting items
- A trigger that automatically calls this function when a new player is created
- Initial inventory for any existing players who don't have items

## Step 2: Verify the Installation

Run this query to check if the system is working:

```sql
-- Check if the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'generate_starting_inventory';

-- Check if the trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'give_starting_inventory';

-- Check existing player inventories
SELECT 
    p.username,
    COUNT(DISTINCT pi.item_id) as item_types,
    SUM(pi.quantity) as total_items,
    ROUND(SUM(pi.quantity * pi.acquired_price)::numeric, 2) as inventory_value
FROM player p
LEFT JOIN player_inventory pi ON p.user_id = pi.player_id
GROUP BY p.user_id, p.username;
```

## Step 3: Test with a New Player

To test the automatic inventory generation:

```sql
-- Create a test player
INSERT INTO player (user_id, username, email, cash)
VALUES (
    gen_random_uuid(),
    'TestPlayer' || floor(random() * 1000),
    'test' || floor(random() * 1000) || '@example.com',
    50000
);

-- Check their inventory (should be auto-generated)
SELECT 
    p.username,
    mi.name as item_name,
    pi.quantity,
    pi.acquired_price,
    mi.current_price
FROM player p
JOIN player_inventory pi ON p.user_id = pi.player_id
JOIN market_items mi ON pi.item_id = mi.id
WHERE p.username LIKE 'TestPlayer%'
ORDER BY p.created_at DESC
LIMIT 20;
```

## Step 4: Manually Generate Inventory (Optional)

If you need to manually give a player starting inventory:

```sql
-- Replace with actual player ID
SELECT generate_starting_inventory('YOUR-PLAYER-ID-HERE');
```

## Step 5: Customize Starting Inventory (Optional)

To adjust the starting inventory parameters, modify these values in the function:

```sql
-- In the generate_starting_inventory function:
v_max_value DECIMAL(10,2) := 10000; -- Change max value (default $10k)
v_max_items INTEGER := 5; -- Change max different item types

-- To change which categories are included:
WHERE category IN ('RAW_MATERIALS', 'CONSUMER', 'ENERGY')

-- To change price limits:
AND current_price < 500  -- Only items under $500
```

## How It Works

1. **Automatic Trigger**: When a new player is created, the trigger fires automatically
2. **Random Selection**: The function randomly selects 2-5 items from cheap categories
3. **Quantity Calculation**: 
   - Items < $50: 50-100 units
   - Items $50-$200: 20-50 units
   - Items > $200: 10-25 units
4. **Value Limit**: Total value won't exceed $10,000
5. **Discount Price**: Items are acquired at 85-95% of market price (allows profit)

## Troubleshooting

### Players Still Have No Inventory
1. Check if the player was created before the trigger was installed
2. Run the manual generation command for that player
3. Verify the market_items table has items in the allowed categories

### Function Not Found Error
1. Ensure the migration script ran successfully
2. Check for any error messages in the SQL editor
3. Verify you're in the correct schema (usually 'public')

### Starting Inventory Too Low/High
1. Adjust the `v_max_value` parameter in the function
2. Modify the quantity calculations based on price ranges
3. Change the allowed categories or price limits

## Next Steps

After setting up starting inventory:
1. Test the market trading functionality
2. Deploy the market update edge function
3. Set up the cron job for automatic price updates
4. Enable realtime on the market_items table

## Monitoring

To monitor the starting inventory system:

```sql
-- View recent inventory generations
SELECT 
    p.username,
    p.created_at as player_joined,
    COUNT(pi.id) as items_received,
    SUM(pi.quantity) as total_units,
    ROUND(SUM(pi.quantity * pi.acquired_price)::numeric, 2) as total_value
FROM player p
LEFT JOIN player_inventory pi ON p.user_id = pi.player_id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
GROUP BY p.user_id, p.username, p.created_at
ORDER BY p.created_at DESC;
```