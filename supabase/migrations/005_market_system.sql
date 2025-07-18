-- Market System Tables for Flexport Trading

-- Market Items table
CREATE TABLE IF NOT EXISTS market_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('GOODS', 'CAPITAL', 'ASSETS', 'LABOR')),
  category TEXT CHECK (category IN ('RAW_MATERIALS', 'MANUFACTURED', 'LUXURY', 'PERISHABLE')),
  base_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  supply INTEGER NOT NULL DEFAULT 0,
  demand INTEGER NOT NULL DEFAULT 0,
  volatility DECIMAL(3, 2) NOT NULL DEFAULT 0.1 CHECK (volatility >= 0 AND volatility <= 1),
  production_cost_modifier DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price History table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  supply INTEGER NOT NULL,
  demand INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES market_items(id),
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  player_id UUID NOT NULL REFERENCES player(user_id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Dynamics configuration table
CREATE TABLE IF NOT EXISTS market_dynamics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supply_growth_rate DECIMAL(5, 3) DEFAULT 0.02,
  demand_volatility DECIMAL(5, 3) DEFAULT 0.15,
  price_elasticity DECIMAL(5, 3) DEFAULT 1.2,
  seasonal_modifiers JSONB DEFAULT '{"spring": 1.1, "summer": 1.2, "fall": 0.9, "winter": 0.8}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_market_items_type ON market_items(type);
CREATE INDEX idx_market_items_category ON market_items(category);
CREATE INDEX idx_price_history_item_timestamp ON price_history(item_id, timestamp DESC);
CREATE INDEX idx_transactions_player ON transactions(player_id, timestamp DESC);
CREATE INDEX idx_transactions_item ON transactions(item_id, timestamp DESC);

-- Row Level Security
ALTER TABLE market_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_dynamics ENABLE ROW LEVEL SECURITY;

-- Market items are readable by all authenticated users
CREATE POLICY "market_items_read_policy" ON market_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Price history is readable by all authenticated users
CREATE POLICY "price_history_read_policy" ON price_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Transactions are readable only by the player who made them
CREATE POLICY "transactions_read_policy" ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = player_id::text);

-- Players can insert their own transactions
CREATE POLICY "transactions_insert_policy" ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = player_id::text);

-- Market dynamics readable by all authenticated users
CREATE POLICY "market_dynamics_read_policy" ON market_dynamics
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to calculate market price
CREATE OR REPLACE FUNCTION calculate_market_price(
  p_base_cost DECIMAL,
  p_production_modifier DECIMAL,
  p_supply INTEGER,
  p_demand INTEGER,
  p_volatility DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  cost_base DECIMAL;
  supply_demand_ratio DECIMAL;
  volatility_factor DECIMAL;
  final_price DECIMAL;
BEGIN
  -- Calculate base cost with production modifier
  cost_base := p_base_cost * p_production_modifier;
  
  -- Calculate supply/demand ratio
  IF p_supply > 0 THEN
    supply_demand_ratio := p_demand::DECIMAL / p_supply::DECIMAL;
  ELSE
    supply_demand_ratio := 2.0; -- Cap at 2x if no supply
  END IF;
  
  -- Add volatility
  volatility_factor := 1 + (random() - 0.5) * p_volatility;
  
  -- Calculate final price with minimum threshold
  final_price := GREATEST(
    cost_base * 0.5, -- Minimum 50% of cost base
    cost_base * supply_demand_ratio * volatility_factor
  );
  
  RETURN ROUND(final_price, 2);
END;
$$;

-- Function to update market cycle
CREATE OR REPLACE FUNCTION update_market_cycle()
RETURNS TABLE (
  item_id UUID,
  old_price DECIMAL,
  new_price DECIMAL,
  price_change_percent DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  dynamics_record RECORD;
  item_record RECORD;
BEGIN
  -- Get active market dynamics
  SELECT * INTO dynamics_record
  FROM market_dynamics
  WHERE active = true
  LIMIT 1;
  
  -- Update each market item
  FOR item_record IN SELECT * FROM market_items LOOP
    -- Calculate new supply and demand
    UPDATE market_items
    SET 
      supply = supply * (1 + dynamics_record.supply_growth_rate),
      demand = demand * (1 + (random() - 0.5) * dynamics_record.demand_volatility),
      current_price = calculate_market_price(
        base_price,
        production_cost_modifier,
        supply,
        demand,
        volatility
      ),
      last_updated = NOW()
    WHERE id = item_record.id
    RETURNING 
      id,
      item_record.current_price,
      current_price,
      ((current_price - item_record.current_price) / item_record.current_price * 100)
    INTO item_id, old_price, new_price, price_change_percent;
    
    -- Record price history
    INSERT INTO price_history (item_id, price, supply, demand)
    SELECT id, current_price, supply, demand
    FROM market_items
    WHERE id = item_record.id;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_market_dynamics_updated_at BEFORE UPDATE ON market_dynamics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();