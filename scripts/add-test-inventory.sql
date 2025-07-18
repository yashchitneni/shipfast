-- Quick script to add test inventory for the player
-- This gives the player a few items to test selling functionality

-- First, verify the player exists
SELECT user_id, username, cash FROM player WHERE username = 'Captain';

-- Add some inventory items for testing
-- Using common/cheap items so player can test selling
INSERT INTO player_inventory (player_id, item_id, quantity, location_type, location_id, acquired_price)
SELECT 
  p.user_id,
  mi.id,
  CASE 
    WHEN mi.name = 'Iron Ore' THEN 100  -- Lots of cheap raw materials
    WHEN mi.name = 'Coal' THEN 150
    WHEN mi.name = 'Consumer Goods' THEN 50
    WHEN mi.name = 'Crude Oil' THEN 75
    ELSE 25
  END as quantity,
  'port' as location_type,
  'port-1' as location_id,
  mi.current_price * 0.85 as acquired_price  -- Bought at 85% of current price for profit
FROM player p
CROSS JOIN market_items mi
WHERE p.username = 'Captain'
  AND mi.name IN ('Iron Ore', 'Coal', 'Consumer Goods', 'Crude Oil', 'Electronics')
ON CONFLICT (player_id, item_id, location_id) 
DO UPDATE SET 
  quantity = player_inventory.quantity + EXCLUDED.quantity,
  acquired_price = (player_inventory.acquired_price * player_inventory.quantity + EXCLUDED.acquired_price * EXCLUDED.quantity) / (player_inventory.quantity + EXCLUDED.quantity);

-- Verify inventory was added
SELECT 
  pi.id,
  mi.name as item_name,
  pi.quantity,
  pi.acquired_price,
  mi.current_price,
  ROUND((mi.current_price - pi.acquired_price) * pi.quantity, 2) as potential_profit
FROM player_inventory pi
JOIN market_items mi ON pi.item_id = mi.id
JOIN player p ON pi.player_id = p.user_id
WHERE p.username = 'Captain'
ORDER BY potential_profit DESC;