-- Direct SQL script to create inventory tables
-- Run this in Supabase Studio SQL Editor or via CLI when Docker is running

-- First, check if tables already exist
DO $$ 
BEGIN
    -- Check for player_inventory table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_inventory') THEN
        RAISE NOTICE 'Creating player_inventory table...';
        
        -- Create player_inventory table
        CREATE TABLE player_inventory (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          player_id UUID NOT NULL REFERENCES player(user_id) ON DELETE CASCADE,
          item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE RESTRICT,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          location_type TEXT NOT NULL CHECK (location_type IN ('port', 'warehouse', 'ship')),
          location_id TEXT NOT NULL,
          acquired_price DECIMAL(10, 2) NOT NULL,
          acquired_at TIMESTAMPTZ DEFAULT NOW(),
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(player_id, item_id, location_id)
        );
        
        -- Create indexes
        CREATE INDEX idx_player_inventory_player ON player_inventory(player_id);
        CREATE INDEX idx_player_inventory_location ON player_inventory(location_type, location_id);
        CREATE INDEX idx_player_inventory_item ON player_inventory(item_id);
        
        RAISE NOTICE 'player_inventory table created successfully';
    ELSE
        RAISE NOTICE 'player_inventory table already exists';
    END IF;

    -- Check for route_cargo table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'route_cargo') THEN
        RAISE NOTICE 'Creating route_cargo table...';
        
        -- Create route_cargo table
        CREATE TABLE route_cargo (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          route_id UUID NOT NULL REFERENCES route(route_id) ON DELETE CASCADE,
          asset_id UUID NOT NULL REFERENCES asset(asset_id) ON DELETE CASCADE,
          item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE RESTRICT,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          status TEXT NOT NULL DEFAULT 'loading' CHECK (status IN ('loading', 'in_transit', 'delivered', 'cancelled')),
          origin_port TEXT NOT NULL,
          destination_port TEXT NOT NULL,
          loading_price DECIMAL(10, 2) NOT NULL,
          expected_arrival TIMESTAMPTZ,
          actual_arrival TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_route_cargo_route ON route_cargo(route_id);
        CREATE INDEX idx_route_cargo_asset ON route_cargo(asset_id);
        CREATE INDEX idx_route_cargo_status ON route_cargo(status);
        
        RAISE NOTICE 'route_cargo table created successfully';
    ELSE
        RAISE NOTICE 'route_cargo table already exists';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_cargo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Player inventory policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_inventory' AND policyname = 'Players can view own inventory') THEN
        CREATE POLICY "Players can view own inventory" ON player_inventory
          FOR SELECT TO authenticated USING (auth.uid() = player_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_inventory' AND policyname = 'Players can insert own inventory') THEN
        CREATE POLICY "Players can insert own inventory" ON player_inventory
          FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_inventory' AND policyname = 'Players can update own inventory') THEN
        CREATE POLICY "Players can update own inventory" ON player_inventory
          FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_inventory' AND policyname = 'Players can delete own inventory') THEN
        CREATE POLICY "Players can delete own inventory" ON player_inventory
          FOR DELETE TO authenticated USING (auth.uid() = player_id);
    END IF;
    
    -- Dev policies for anonymous access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_inventory' AND policyname = 'Anon can view all inventory (DEV)') THEN
        CREATE POLICY "Anon can view all inventory (DEV)" ON player_inventory
          FOR SELECT TO anon USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_inventory' AND policyname = 'Anon can manage inventory (DEV)') THEN
        CREATE POLICY "Anon can manage inventory (DEV)" ON player_inventory
          FOR ALL TO anon WITH CHECK (true);
    END IF;
END $$;

-- Add table comments
COMMENT ON TABLE player_inventory IS 'Tracks goods owned by players at various locations';
COMMENT ON TABLE route_cargo IS 'Tracks goods being transported on trade routes';

-- Test the tables by inserting sample data
DO $$
DECLARE
    test_player_id UUID;
    test_item_id UUID;
BEGIN
    -- Get a test player
    SELECT user_id INTO test_player_id FROM player LIMIT 1;
    
    -- Get a test market item
    SELECT id INTO test_item_id FROM market_items WHERE name = 'Iron Ore' LIMIT 1;
    
    IF test_player_id IS NOT NULL AND test_item_id IS NOT NULL THEN
        -- Try to insert test inventory
        INSERT INTO player_inventory (
            player_id, item_id, quantity, location_type, location_id, acquired_price
        ) VALUES (
            test_player_id, test_item_id, 100, 'port', 'port-1', 50.00
        ) ON CONFLICT (player_id, item_id, location_id) DO NOTHING;
        
        RAISE NOTICE 'Test data inserted successfully';
    ELSE
        RAISE NOTICE 'No test data inserted - missing player or market items';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting test data: %', SQLERRM;
END $$;

-- Verify tables were created
SELECT 
    'player_inventory' as table_name,
    COUNT(*) as row_count 
FROM player_inventory
UNION ALL
SELECT 
    'route_cargo' as table_name,
    COUNT(*) as row_count 
FROM route_cargo;