# Database Schema Documentation

## Overview

Flexport uses Supabase (PostgreSQL) as its database backend. The schema is designed to support real-time multiplayer gameplay, persistent game state, and efficient querying for game mechanics.

## Core Tables

### 1. profiles
User profiles and authentication data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  last_seen TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  statistics JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen);
```

### 2. game_states
Core game state for each player.

```sql
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cash DECIMAL(12, 2) DEFAULT 50000.00,
  reputation INTEGER DEFAULT 50,
  game_quarter INTEGER DEFAULT 1,
  game_year INTEGER DEFAULT 2025,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  CONSTRAINT unique_active_game UNIQUE(player_id, is_active)
);

-- Indexes
CREATE INDEX idx_game_states_player ON game_states(player_id);
CREATE INDEX idx_game_states_active ON game_states(is_active);
```

### 3. assets
All player-owned assets (ships, planes, warehouses, etc.).

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id UUID NOT NULL REFERENCES game_states(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('ship', 'plane', 'warehouse', 'specialist', 'upgrade')),
  asset_subtype TEXT NOT NULL,
  name TEXT NOT NULL,
  position JSONB NOT NULL, -- {x: number, y: number, port_id: UUID}
  stats JSONB NOT NULL, -- {capacity, speed, efficiency, etc.}
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'in_transit', 'loading', 'maintenance', 'destroyed')),
  health INTEGER DEFAULT 100,
  assigned_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX idx_assets_game_state ON assets(game_state_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_route ON assets(assigned_route_id);
```

### 4. routes
Player-created shipping routes.

```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id UUID NOT NULL REFERENCES game_states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  origin_port_id UUID NOT NULL REFERENCES ports(id),
  destination_port_id UUID NOT NULL REFERENCES ports(id),
  waypoints JSONB DEFAULT '[]'::jsonb, -- Array of port IDs
  route_type TEXT NOT NULL CHECK (route_type IN ('sea', 'air', 'hybrid')),
  distance DECIMAL(10, 2) NOT NULL,
  base_profit_rate DECIMAL(10, 2) NOT NULL,
  risk_level INTEGER DEFAULT 1 CHECK (risk_level BETWEEN 1 AND 10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX idx_routes_game_state ON routes(game_state_id);
CREATE INDEX idx_routes_ports ON routes(origin_port_id, destination_port_id);
CREATE INDEX idx_routes_active ON routes(is_active);
```

### 5. ports
Global port locations (shared across all games).

```sql
CREATE TABLE ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'LAX', 'SHA', 'ROT'
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  position JSONB NOT NULL, -- {x: number, y: number}
  port_type TEXT[] NOT NULL DEFAULT ARRAY['sea'], -- ['sea'], ['air'], or ['sea', 'air']
  size TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large', 'mega')),
  base_demand JSONB NOT NULL, -- {goods_type: demand_level}
  facilities JSONB DEFAULT '{}'::jsonb, -- Available upgrades/facilities
  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_ports_code ON ports(code);
CREATE INDEX idx_ports_type ON ports(port_type);
CREATE INDEX idx_ports_region ON ports(region);
```

### 6. market_prices
Dynamic market prices for goods.

```sql
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_type TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  price_trend TEXT DEFAULT 'stable' CHECK (price_trend IN ('rising', 'falling', 'stable', 'volatile')),
  demand_level INTEGER DEFAULT 5 CHECK (demand_level BETWEEN 1 AND 10),
  supply_level INTEGER DEFAULT 5 CHECK (supply_level BETWEEN 1 AND 10),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  CONSTRAINT unique_goods_type UNIQUE(goods_type)
);

-- Indexes
CREATE INDEX idx_market_prices_goods ON market_prices(goods_type);
CREATE INDEX idx_market_prices_updated ON market_prices(last_updated);
```

### 7. transactions
Financial transaction history.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id UUID NOT NULL REFERENCES game_states(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'loan', 'investment')),
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  related_entity_id UUID, -- References to assets, routes, etc.
  related_entity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX idx_transactions_game_state ON transactions(game_state_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created ON transactions(created_at);
```

### 8. ai_companions
AI companion state and learning data.

```sql
CREATE TABLE ai_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id UUID UNIQUE NOT NULL REFERENCES game_states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality_type TEXT NOT NULL DEFAULT 'balanced',
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  training_data JSONB DEFAULT '{}'::jsonb,
  suggestions_history JSONB DEFAULT '[]'::jsonb,
  risk_tolerance DECIMAL(3, 2) DEFAULT 0.50 CHECK (risk_tolerance BETWEEN 0 AND 1),
  specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  trust_level INTEGER DEFAULT 50 CHECK (trust_level BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX idx_ai_companions_game_state ON ai_companions(game_state_id);
```

### 9. events
Game events (disasters, market changes, etc.).

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('disaster', 'market', 'political', 'technological', 'opportunity')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  affected_routes UUID[] DEFAULT ARRAY[]::UUID[],
  effects JSONB NOT NULL, -- {price_modifier: 0.8, route_risk: +3, etc.}
  duration_quarters INTEGER DEFAULT 1,
  start_quarter INTEGER NOT NULL,
  start_year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_time ON events(start_year, start_quarter);
```

### 10. auctions
Multiplayer auction system.

```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_type TEXT NOT NULL CHECK (auction_type IN ('asset', 'route_license', 'contract', 'specialist')),
  item_data JSONB NOT NULL,
  starting_bid DECIMAL(12, 2) NOT NULL,
  current_bid DECIMAL(12, 2),
  current_bidder_id UUID REFERENCES game_states(id) ON DELETE SET NULL,
  bid_increment DECIMAL(12, 2) DEFAULT 100.00,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  winner_id UUID REFERENCES game_states(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_auctions_type ON auctions(auction_type);
```

### 11. contracts
Long-term shipping contracts.

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id UUID NOT NULL REFERENCES game_states(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('delivery', 'supply', 'exclusive')),
  client_name TEXT NOT NULL,
  goods_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  origin_port_id UUID REFERENCES ports(id),
  destination_port_id UUID REFERENCES ports(id),
  deadline_quarter INTEGER NOT NULL,
  deadline_year INTEGER NOT NULL,
  penalty_amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  completion_percentage DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX idx_contracts_game_state ON contracts(game_state_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_deadline ON contracts(deadline_year, deadline_quarter);
```

## Real-time Subscriptions

Enable real-time features using Supabase Realtime:

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE market_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
```

## Row Level Security (RLS)

Example RLS policies for game_states:

```sql
-- Enable RLS
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Players can only see their own game states
CREATE POLICY "Players can view own game states" ON game_states
  FOR SELECT USING (auth.uid() = player_id);

-- Players can only update their own game states
CREATE POLICY "Players can update own game states" ON game_states
  FOR UPDATE USING (auth.uid() = player_id);

-- Players can create their own game states
CREATE POLICY "Players can create game states" ON game_states
  FOR INSERT WITH CHECK (auth.uid() = player_id);
```

## Functions and Triggers

### Update timestamp trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_game_states_updated_at BEFORE UPDATE ON game_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Calculate route profitability
```sql
CREATE OR REPLACE FUNCTION calculate_route_profit(
  p_distance DECIMAL,
  p_cargo_value DECIMAL,
  p_efficiency DECIMAL,
  p_risk_modifier DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN p_distance * p_cargo_value * p_efficiency * (1 - (p_risk_modifier * 0.1));
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

1. Run migrations in order
2. Seed initial port data
3. Set up RLS policies
4. Configure real-time subscriptions
5. Create initial market prices

## Performance Considerations

- Use partial indexes for frequently filtered queries
- Implement table partitioning for transactions if volume grows
- Use materialized views for complex analytics
- Monitor query performance with pg_stat_statements

## Backup Strategy

- Daily automated backups via Supabase
- Point-in-time recovery enabled
- Export critical game state data weekly
- Test restore procedures monthly