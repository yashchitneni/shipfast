-- Starting inventory system for new players
-- This gives each new player a randomized set of starting items

-- Function to generate starting inventory for a player
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
        -- Cheaper items get more quantity
        IF v_item.current_price < 50 THEN
            v_quantity := 50 + floor(random() * 50)::integer; -- 50-100 units
        ELSIF v_item.current_price < 200 THEN
            v_quantity := 20 + floor(random() * 30)::integer; -- 20-50 units
        ELSE
            v_quantity := 10 + floor(random() * 15)::integer; -- 10-25 units
        END IF;
        
        -- Check if adding this would exceed value limit
        IF v_total_value + (v_quantity * v_item.current_price) > v_max_value THEN
            -- Adjust quantity to fit within limit
            v_quantity := floor((v_max_value - v_total_value) / v_item.current_price)::integer;
            
            -- Skip if quantity would be too small
            IF v_quantity < 5 THEN
                CONTINUE;
            END IF;
        END IF;
        
        -- Insert into inventory with a small discount (85-95% of market price)
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
        
        -- Stop if we've reached value limit
        IF v_total_value >= v_max_value * 0.9 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Generated % items worth ~$% for player %', 
        v_item_count, round(v_total_value), p_player_id;
END;
$$;

-- Trigger to give starting inventory to new players
CREATE OR REPLACE FUNCTION on_player_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Generate starting inventory for the new player
    PERFORM generate_starting_inventory(NEW.user_id);
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS give_starting_inventory ON player;
CREATE TRIGGER give_starting_inventory
    AFTER INSERT ON player
    FOR EACH ROW
    EXECUTE FUNCTION on_player_created();

-- For existing players without inventory, generate it now
DO $$
DECLARE
    v_player RECORD;
BEGIN
    FOR v_player IN (
        SELECT p.user_id
        FROM player p
        LEFT JOIN player_inventory pi ON p.user_id = pi.player_id
        WHERE pi.id IS NULL
        GROUP BY p.user_id
    )
    LOOP
        PERFORM generate_starting_inventory(v_player.user_id);
    END LOOP;
END;
$$;

-- Verify the system works
SELECT 
    p.username,
    COUNT(DISTINCT pi.item_id) as item_types,
    SUM(pi.quantity) as total_items,
    ROUND(SUM(pi.quantity * pi.acquired_price)::numeric, 2) as inventory_value
FROM player p
LEFT JOIN player_inventory pi ON p.user_id = pi.player_id
GROUP BY p.user_id, p.username;