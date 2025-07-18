-- Give players starting inventory to enable selling
-- This script should be run after the player_inventory table is created

-- First, get the player ID and some market items
WITH player_data AS (
  SELECT user_id FROM player WHERE username = 'Captain' LIMIT 1
),
market_items_sample AS (
  SELECT id, name, current_price
  FROM market_items 
  WHERE category IN ('RAW_MATERIALS', 'CONSUMER')
  ORDER BY current_price ASC
  LIMIT 5
)
-- Insert starting inventory for the player
INSERT INTO player_inventory (player_id, item_id, quantity, location_type, location_id, acquired_price)
SELECT 
  p.user_id,
  m.id,
  CASE 
    WHEN m.current_price < 100 THEN 50  -- More quantity for cheap items
    WHEN m.current_price < 500 THEN 20  -- Medium quantity for mid-price items
    ELSE 10  -- Less quantity for expensive items
  END as quantity,
  'port' as location_type,
  'port-1' as location_id,
  m.current_price * 0.9 as acquired_price  -- Acquired at 10% discount to ensure profit
FROM player_data p
CROSS JOIN market_items_sample m
ON CONFLICT (player_id, item_id, location_id) DO NOTHING;

-- Show what was added
SELECT 
  pi.id,
  p.username,
  mi.name as item_name,
  pi.quantity,
  pi.location_id,
  pi.acquired_price,
  mi.current_price,
  (mi.current_price - pi.acquired_price) * pi.quantity as potential_profit
FROM player_inventory pi
JOIN player p ON pi.player_id = p.user_id
JOIN market_items mi ON pi.item_id = mi.id
ORDER BY potential_profit DESC;