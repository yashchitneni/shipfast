-- QUICK SETUP: Starting Inventory System
-- Run this entire script in Supabase SQL Editor

-- Step 1: Create the starting inventory function
CREATE OR REPLACE FUNCTION generate_starting_inventory(p_player_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_item RECORD;
    v_quantity INTEGER;
    v_total_value DECIMAL(10,2) := 0;
    v_max_value DECIMAL(10,2) := 10000; -- $10k worth of starting inventory
    v_item_count INTEGER := 0;
    v_max_items INTEGER := 5;
BEGIN
    -- Check if player already has inventory
    IF EXISTS (SELECT 1 FROM player_inventory WHERE player_id = p_player_id) THEN
        RAISE NOTICE 'Player % already has inventory', p_player_id;
        RETURN;
    END IF;
    
    -- Select random items from cheap categories
    FOR v_item IN (
        SELECT id, name, current_price, category
        FROM market_items
        WHERE category IN ('RAW_MATERIALS', 'CONSUMER', 'ENERGY')
        AND current_price < 500  -- Only items under $500
        ORDER BY RANDOM()
        LIMIT v_max_items
    )
    LOOP
        -- Calculate random quantity based on item price
        IF v_item.current_price < 50 THEN
            v_quantity := 50 + floor(random() * 50)::integer; -- 50-100 units
        ELSIF v_item.current_price < 200 THEN
            v_quantity := 20 + floor(random() * 30)::integer; -- 20-50 units
        ELSE
            v_quantity := 10 + floor(random() * 15)::integer; -- 10-25 units
        END IF;
        
        -- Check if adding this would exceed value limit
        IF v_total_value + (v_quantity * v_item.current_price) > v_max_value THEN
            v_quantity := floor((v_max_value - v_total_value) / v_item.current_price)::integer;
            
            IF v_quantity < 5 THEN
                CONTINUE;
            END IF;
        END IF;
        
        -- Insert into inventory with a small discount
        INSERT INTO player_inventory (
            player_id,
            item_id,
            quantity,
            location_type,
            location_id,
            acquired_price
        ) VALUES (
            p_player_id,
            v_item.id,
            v_quantity,
            'port',
            'port-1',
            v_item.current_price * (0.85 + random() * 0.1)
        );
        
        v_total_value := v_total_value + (v_quantity * v_item.current_price);
        v_item_count := v_item_count + 1;
        
        IF v_total_value >= v_max_value * 0.9 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Generated % items worth ~$% for player %', 
        v_item_count, round(v_total_value), p_player_id;
END;
$$;

-- Step 2: Create the trigger function
CREATE OR REPLACE FUNCTION on_player_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM generate_starting_inventory(NEW.user_id);
    RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS give_starting_inventory ON player;
CREATE TRIGGER give_starting_inventory
    AFTER INSERT ON player
    FOR EACH ROW
    EXECUTE FUNCTION on_player_created();

-- Step 4: Give inventory to existing players who don't have any
DO $$
DECLARE
    v_player RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_player IN (
        SELECT p.user_id, p.username
        FROM player p
        LEFT JOIN player_inventory pi ON p.user_id = pi.player_id
        WHERE pi.id IS NULL
        GROUP BY p.user_id, p.username
    )
    LOOP
        PERFORM generate_starting_inventory(v_player.user_id);
        v_count := v_count + 1;
        RAISE NOTICE 'Generated inventory for player: %', v_player.username;
    END LOOP;
    
    RAISE NOTICE 'Total players updated: %', v_count;
END;
$$;

-- Step 5: Verify the setup
SELECT 
    'Setup Complete!' as status,
    COUNT(DISTINCT p.user_id) as total_players,
    COUNT(DISTINCT CASE WHEN pi.id IS NOT NULL THEN p.user_id END) as players_with_inventory,
    COUNT(pi.id) as total_inventory_items,
    ROUND(AVG(inv_summary.total_value)::numeric, 2) as avg_inventory_value
FROM player p
LEFT JOIN player_inventory pi ON p.user_id = pi.player_id
LEFT JOIN LATERAL (
    SELECT 
        p2.user_id,
        SUM(pi2.quantity * pi2.acquired_price) as total_value
    FROM player p2
    JOIN player_inventory pi2 ON p2.user_id = pi2.player_id
    WHERE p2.user_id = p.user_id
    GROUP BY p2.user_id
) inv_summary ON true;

-- Step 6: Show sample inventory for verification
SELECT 
    p.username,
    mi.name as item_name,
    mi.category,
    pi.quantity,
    ROUND(pi.acquired_price::numeric, 2) as acquired_price,
    ROUND(mi.current_price::numeric, 2) as market_price,
    ROUND((mi.current_price * 0.9 - pi.acquired_price)::numeric * pi.quantity, 2) as potential_profit
FROM player p
JOIN player_inventory pi ON p.user_id = pi.player_id
JOIN market_items mi ON pi.item_id = mi.id
WHERE p.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY p.created_at DESC, mi.name
LIMIT 20;