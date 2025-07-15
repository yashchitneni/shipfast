-- Function to deduct cash from player
CREATE OR REPLACE FUNCTION deduct_player_cash(
    player_id UUID,
    amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE player
    SET cash = cash - amount
    WHERE user_id = player_id AND cash >= amount;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient funds or player not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add cash to player
CREATE OR REPLACE FUNCTION add_player_cash(
    player_id UUID,
    amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE player
    SET cash = cash + amount
    WHERE user_id = player_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update player net worth
CREATE OR REPLACE FUNCTION calculate_player_net_worth(player_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_assets_value INTEGER;
    total_cash INTEGER;
    net_worth INTEGER;
BEGIN
    -- Get player's cash
    SELECT cash INTO total_cash
    FROM player
    WHERE user_id = player_id;
    
    -- Calculate total asset values (simplified - you can expand this)
    SELECT COALESCE(SUM((stats->>'value')::INTEGER), 0) INTO total_assets_value
    FROM asset
    WHERE owner_id = player_id;
    
    -- Calculate net worth
    net_worth := total_cash + total_assets_value;
    
    -- Update player's net worth
    UPDATE player
    SET net_worth = net_worth
    WHERE user_id = player_id;
    
    RETURN net_worth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant exclusive license
CREATE OR REPLACE FUNCTION grant_exclusive_license(
    player_id UUID,
    license_type TEXT,
    bonuses JSONB
)
RETURNS VOID AS $$
BEGIN
    UPDATE player
    SET ai_companion_state = ai_companion_state || 
        jsonb_build_object('licenses', 
            COALESCE(ai_companion_state->'licenses', '[]'::jsonb) || 
            jsonb_build_array(
                jsonb_build_object(
                    'type', license_type,
                    'bonuses', bonuses,
                    'granted_at', NOW()
                )
            )
        )
    WHERE user_id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update AI companion progress
CREATE OR REPLACE FUNCTION update_ai_companion_progress(
    player_id UUID,
    xp_gained INTEGER
)
RETURNS JSONB AS $$
DECLARE
    current_state JSONB;
    current_level INTEGER;
    current_xp INTEGER;
    new_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current AI state
    SELECT ai_companion_state INTO current_state
    FROM player
    WHERE user_id = player_id;
    
    -- Extract current values
    current_level := (current_state->>'level')::INTEGER;
    current_xp := COALESCE((current_state->>'experience')::INTEGER, 0);
    
    -- Calculate new XP
    new_xp := current_xp + xp_gained;
    
    -- Calculate new level (100 XP per level)
    new_level := current_level + (new_xp / 100);
    new_xp := new_xp % 100;
    
    -- Update state
    current_state := current_state || 
        jsonb_build_object(
            'level', new_level,
            'experience', new_xp,
            'learning_progress', LEAST((new_level::FLOAT / 10), 1.0)
        );
    
    -- Save updated state
    UPDATE player
    SET ai_companion_state = current_state
    WHERE user_id = player_id;
    
    RETURN current_state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process route profits
CREATE OR REPLACE FUNCTION process_route_profits(
    route_id UUID,
    profit INTEGER,
    disasters_encountered INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    route_owner UUID;
    performance JSONB;
BEGIN
    -- Get route owner and current performance data
    SELECT owner_id, performance_data INTO route_owner, performance
    FROM route
    WHERE route.route_id = process_route_profits.route_id;
    
    -- Update performance data
    performance := performance || 
        jsonb_build_object(
            'total_profit', COALESCE((performance->>'total_profit')::INTEGER, 0) + profit,
            'disasters_encountered', COALESCE((performance->>'disasters_encountered')::INTEGER, 0) + disasters_encountered,
            'last_profit', profit,
            'last_run', NOW()
        );
    
    -- Update route
    UPDATE route
    SET performance_data = performance
    WHERE route.route_id = process_route_profits.route_id;
    
    -- Add profit to player's cash
    PERFORM add_player_cash(route_owner, profit);
    
    -- Update AI companion with experience
    PERFORM update_ai_companion_progress(route_owner, 10); -- 10 XP per route completion
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION deduct_player_cash TO authenticated;
GRANT EXECUTE ON FUNCTION add_player_cash TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_player_net_worth TO authenticated;
GRANT EXECUTE ON FUNCTION grant_exclusive_license TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_companion_progress TO authenticated;
GRANT EXECUTE ON FUNCTION process_route_profits TO authenticated;