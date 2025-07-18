-- Give new players starting inventory so they can participate in trading immediately
-- This should be run after player creation or can be added to player initialization

-- Function to give starting inventory to a player
CREATE OR REPLACE FUNCTION give_starting_inventory(p_player_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_iron_ore_id UUID;
    v_coal_id UUID;
BEGIN
    -- Get item IDs
    SELECT id INTO v_iron_ore_id FROM market_items WHERE name = 'Iron Ore' LIMIT 1;
    SELECT id INTO v_coal_id FROM market_items WHERE name = 'Coal' LIMIT 1;
    
    -- Give player some starting goods at low prices (so they can profit)
    IF v_iron_ore_id IS NOT NULL THEN
        INSERT INTO player_inventory (
            player_id, item_id, quantity, location_type, location_id, acquired_price
        ) VALUES (
            p_player_id, v_iron_ore_id, 50, 'port', 'port-1', 40.00  -- Bought at $40, can sell when price goes up
        ) ON CONFLICT (player_id, item_id, location_id) DO UPDATE
        SET quantity = player_inventory.quantity + 50;
    END IF;
    
    IF v_coal_id IS NOT NULL THEN
        INSERT INTO player_inventory (
            player_id, item_id, quantity, location_type, location_id, acquired_price
        ) VALUES (
            p_player_id, v_coal_id, 100, 'port', 'port-1', 25.00  -- Bought at $25, can sell when price goes up
        ) ON CONFLICT (player_id, item_id, location_id) DO UPDATE
        SET quantity = player_inventory.quantity + 100;
    END IF;
    
    RAISE NOTICE 'Starting inventory given to player %', p_player_id;
END;
$$;

-- Give all existing players starting inventory
DO $$
DECLARE
    player_record RECORD;
BEGIN
    FOR player_record IN SELECT user_id FROM player LOOP
        -- Check if player already has inventory
        IF NOT EXISTS (
            SELECT 1 FROM player_inventory WHERE player_id = player_record.user_id
        ) THEN
            PERFORM give_starting_inventory(player_record.user_id);
        END IF;
    END LOOP;
END $$;

-- Add trigger to automatically give new players starting inventory
CREATE OR REPLACE FUNCTION give_new_player_inventory()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM give_starting_inventory(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'new_player_inventory_trigger'
    ) THEN
        CREATE TRIGGER new_player_inventory_trigger
        AFTER INSERT ON player
        FOR EACH ROW
        EXECUTE FUNCTION give_new_player_inventory();
    END IF;
END $$;

-- Verify starting inventory
SELECT 
    p.username,
    pi.location_id,
    mi.name as item_name,
    pi.quantity,
    pi.acquired_price,
    mi.current_price,
    ROUND((mi.current_price - pi.acquired_price) * pi.quantity, 2) as potential_profit
FROM player p
JOIN player_inventory pi ON p.user_id = pi.player_id
JOIN market_items mi ON pi.item_id = mi.id
ORDER BY p.username, mi.name;