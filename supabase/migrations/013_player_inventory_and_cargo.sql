-- Migration: Add player inventory and route cargo tables for economy system
-- These tables enable players to own goods and transport them via ships

-- Player Inventory table - tracks what goods each player owns
CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player(user_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  location_type TEXT NOT NULL CHECK (location_type IN ('port', 'warehouse', 'ship')),
  location_id TEXT NOT NULL, -- Can be port_id, asset_id for warehouse/ship
  acquired_price DECIMAL(10, 2) NOT NULL, -- Track purchase price for profit calculation
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, item_id, location_id) -- One entry per item per location
);

-- Route Cargo table - tracks goods being transported on routes
CREATE TABLE IF NOT EXISTS route_cargo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES route(route_id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES asset(asset_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'loading' CHECK (status IN ('loading', 'in_transit', 'delivered', 'cancelled')),
  origin_port TEXT NOT NULL,
  destination_port TEXT NOT NULL,
  loading_price DECIMAL(10, 2) NOT NULL, -- Price when loaded for profit tracking
  expected_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_player_inventory_player ON player_inventory(player_id);
CREATE INDEX idx_player_inventory_location ON player_inventory(location_type, location_id);
CREATE INDEX idx_player_inventory_item ON player_inventory(item_id);
CREATE INDEX idx_route_cargo_route ON route_cargo(route_id);
CREATE INDEX idx_route_cargo_asset ON route_cargo(asset_id);
CREATE INDEX idx_route_cargo_status ON route_cargo(status);

-- Enable Row Level Security
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_cargo ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_inventory
-- Players can only see and manage their own inventory
CREATE POLICY "Players can view own inventory" ON player_inventory
  FOR SELECT
  TO authenticated
  USING (auth.uid() = player_id);

CREATE POLICY "Players can insert own inventory" ON player_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own inventory" ON player_inventory
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can delete own inventory" ON player_inventory
  FOR DELETE
  TO authenticated
  USING (auth.uid() = player_id);

-- RLS Policies for route_cargo
-- Players can only see cargo on their own routes/assets
CREATE POLICY "Players can view own cargo" ON route_cargo
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM route r 
      WHERE r.route_id = route_cargo.route_id 
      AND r.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM asset a 
      WHERE a.asset_id = route_cargo.asset_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert cargo on own routes" ON route_cargo
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM route r 
      WHERE r.id = route_id 
      AND r.player_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM asset a 
      WHERE a.asset_id = asset_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own cargo" ON route_cargo
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM asset a 
      WHERE a.asset_id = route_cargo.asset_id 
      AND a.owner_id = auth.uid()
    )
  );

-- Development policies (REMOVE IN PRODUCTION)
CREATE POLICY "Anon can view all inventory (DEV)" ON player_inventory
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can manage inventory (DEV)" ON player_inventory
  FOR ALL TO anon WITH CHECK (true);

CREATE POLICY "Anon can view all cargo (DEV)" ON route_cargo
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can manage cargo (DEV)" ON route_cargo
  FOR ALL TO anon WITH CHECK (true);

-- Helper function to transfer goods from market to player inventory
CREATE OR REPLACE FUNCTION purchase_goods_to_inventory(
  p_player_id UUID,
  p_item_id UUID,
  p_quantity INTEGER,
  p_location_type TEXT,
  p_location_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_inventory_id UUID;
  v_current_price DECIMAL;
BEGIN
  -- Get current market price
  SELECT current_price INTO v_current_price
  FROM market_items
  WHERE id = p_item_id;
  
  -- Check if player already has this item at this location
  SELECT id INTO v_inventory_id
  FROM player_inventory
  WHERE player_id = p_player_id
    AND item_id = p_item_id
    AND location_id = p_location_id;
  
  IF v_inventory_id IS NOT NULL THEN
    -- Update existing inventory
    UPDATE player_inventory
    SET quantity = quantity + p_quantity,
        last_updated = NOW()
    WHERE id = v_inventory_id;
  ELSE
    -- Create new inventory entry
    INSERT INTO player_inventory (
      player_id, item_id, quantity, 
      location_type, location_id, acquired_price
    )
    VALUES (
      p_player_id, p_item_id, p_quantity,
      p_location_type, p_location_id, v_current_price
    )
    RETURNING id INTO v_inventory_id;
  END IF;
  
  RETURN v_inventory_id;
END;
$$;

-- Function to load cargo onto a ship
CREATE OR REPLACE FUNCTION load_cargo_to_ship(
  p_route_id UUID,
  p_asset_id UUID,
  p_item_id UUID,
  p_quantity INTEGER,
  p_origin_port TEXT,
  p_destination_port TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_cargo_id UUID;
  v_current_price DECIMAL;
  v_travel_time INTERVAL;
BEGIN
  -- Get current market price at origin
  SELECT current_price INTO v_current_price
  FROM market_items
  WHERE id = p_item_id;
  
  -- Estimate travel time (simplified - 1 day per 1000km)
  -- In real implementation, calculate based on route distance and ship speed
  v_travel_time := INTERVAL '3 days';
  
  -- Create cargo entry
  INSERT INTO route_cargo (
    route_id, asset_id, item_id, quantity,
    status, origin_port, destination_port,
    loading_price, expected_arrival
  )
  VALUES (
    p_route_id, p_asset_id, p_item_id, p_quantity,
    'loading', p_origin_port, p_destination_port,
    v_current_price, NOW() + v_travel_time
  )
  RETURNING id INTO v_cargo_id;
  
  -- Update ship's current load
  UPDATE asset
  SET current_load = current_load + p_quantity
  WHERE id = p_asset_id;
  
  RETURN v_cargo_id;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_player_inventory_updated_at 
  BEFORE UPDATE ON player_inventory
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_cargo_updated_at 
  BEFORE UPDATE ON route_cargo
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE player_inventory IS 'Tracks goods owned by players at various locations';
COMMENT ON TABLE route_cargo IS 'Tracks goods being transported on trade routes';
COMMENT ON COLUMN player_inventory.location_type IS 'Where the goods are stored: port, warehouse, or ship';
COMMENT ON COLUMN player_inventory.acquired_price IS 'Purchase price for profit/loss calculation';
COMMENT ON COLUMN route_cargo.loading_price IS 'Market price when loaded, used to calculate profit on delivery';