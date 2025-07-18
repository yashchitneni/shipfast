-- Quick script to give all players starting inventory
-- Run this in Supabase SQL Editor

-- First, let's see current players
SELECT user_id, username, cash FROM player;

-- Give all existing players starting inventory
DO $$
DECLARE
    player_record RECORD;
    v_iron_ore_id UUID;
    v_coal_id UUID;
BEGIN
    -- Get item IDs
    SELECT id INTO v_iron_ore_id FROM market_items WHERE name = 'Iron Ore' LIMIT 1;
    SELECT id INTO v_coal_id FROM market_items WHERE name = 'Coal' LIMIT 1;
    
    FOR player_record IN SELECT user_id FROM player LOOP
        -- Check if player already has inventory
        IF NOT EXISTS (
            SELECT 1 FROM player_inventory WHERE player_id = player_record.user_id
        ) THEN
            -- Give Iron Ore
            IF v_iron_ore_id IS NOT NULL THEN
                INSERT INTO player_inventory (
                    player_id, item_id, quantity, location_type, location_id, acquired_price
                ) VALUES (
                    player_record.user_id, v_iron_ore_id, 50, 'port', 'port-1', 40.00
                );
            END IF;
            
            -- Give Coal
            IF v_coal_id IS NOT NULL THEN
                INSERT INTO player_inventory (
                    player_id, item_id, quantity, location_type, location_id, acquired_price
                ) VALUES (
                    player_record.user_id, v_coal_id, 100, 'port', 'port-1', 25.00
                );
            END IF;
            
            RAISE NOTICE 'Gave starting inventory to player %', player_record.user_id;
        END IF;
    END LOOP;
END $$;

-- Verify what players now have
SELECT 
    p.username,
    mi.name as item_name,
    pi.quantity,
    pi.acquired_price as bought_at,
    mi.current_price as current_price,
    ROUND((mi.current_price - pi.acquired_price) * pi.quantity, 2) as potential_profit
FROM player p
JOIN player_inventory pi ON p.user_id = pi.player_id
JOIN market_items mi ON pi.item_id = mi.id
ORDER BY p.username, mi.name;