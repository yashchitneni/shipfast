-- Verify Starting Inventory Setup
-- Run these queries after setting up the starting inventory system

-- 1. Check if functions and triggers are installed
SELECT 
    'Functions' as type,
    routine_name as name,
    'Installed' as status
FROM information_schema.routines 
WHERE routine_name IN ('generate_starting_inventory', 'on_player_created')
UNION ALL
SELECT 
    'Triggers' as type,
    trigger_name as name,
    'Installed' as status
FROM information_schema.triggers 
WHERE trigger_name = 'give_starting_inventory';

-- 2. Show inventory summary for all players
SELECT 
    p.username,
    p.created_at as player_joined,
    COUNT(DISTINCT pi.item_id) as different_items,
    SUM(pi.quantity) as total_units,
    ROUND(SUM(pi.quantity * pi.acquired_price)::numeric, 2) as inventory_value,
    ROUND(SUM(pi.quantity * mi.current_price * 0.9)::numeric, 2) as sell_value,
    ROUND(SUM(pi.quantity * (mi.current_price * 0.9 - pi.acquired_price))::numeric, 2) as potential_profit
FROM player p
LEFT JOIN player_inventory pi ON p.user_id = pi.player_id
LEFT JOIN market_items mi ON pi.item_id = mi.id
GROUP BY p.user_id, p.username, p.created_at
ORDER BY p.created_at DESC;

-- 3. Show detailed inventory for most recent player
WITH recent_player AS (
    SELECT user_id, username 
    FROM player 
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    rp.username,
    mi.name as item_name,
    mi.category,
    pi.quantity,
    ROUND(pi.acquired_price::numeric, 2) as bought_at,
    ROUND(mi.current_price::numeric, 2) as market_price,
    ROUND(mi.current_price * 0.9::numeric, 2) as sell_price,
    ROUND((mi.current_price * 0.9 - pi.acquired_price) * pi.quantity::numeric, 2) as profit_if_sold
FROM recent_player rp
JOIN player_inventory pi ON rp.user_id = pi.player_id
JOIN market_items mi ON pi.item_id = mi.id
ORDER BY mi.category, mi.name;

-- 4. Test creating a new player (will auto-generate inventory)
-- Uncomment to test:
/*
INSERT INTO player (user_id, username, email, cash)
VALUES (
    gen_random_uuid(),
    'AutoInventoryTest' || floor(random() * 1000),
    'autoinv' || floor(random() * 1000) || '@test.com',
    50000
)
RETURNING username, user_id;
*/

-- 5. Manually generate inventory for a specific player
-- Replace YOUR-PLAYER-ID with actual ID:
/*
SELECT generate_starting_inventory('YOUR-PLAYER-ID-HERE');
*/