-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create player table
CREATE TABLE player (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    cash INTEGER NOT NULL DEFAULT 1000000,
    net_worth INTEGER NOT NULL DEFAULT 1000000,
    ai_companion_state JSONB NOT NULL DEFAULT '{"level": 1, "risk_tolerance": 0.5, "learning_progress": 0}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create asset table
CREATE TABLE asset (
    asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES player(user_id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL,
    custom_name TEXT,
    stats JSONB NOT NULL DEFAULT '{}',
    maintenance_cost INTEGER NOT NULL DEFAULT 0,
    assigned_route_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create route table
CREATE TABLE route (
    route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES player(user_id) ON DELETE CASCADE,
    origin_port_id TEXT NOT NULL,
    destination_port_id TEXT NOT NULL,
    performance_data JSONB NOT NULL DEFAULT '{"profit_per_day": 0, "disasters_encountered": 0}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for assigned_route_id after route table is created
ALTER TABLE asset ADD CONSTRAINT asset_assigned_route_id_fkey 
    FOREIGN KEY (assigned_route_id) REFERENCES route(route_id) ON DELETE SET NULL;

-- Create specialist table
CREATE TABLE specialist (
    specialist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialist_type TEXT NOT NULL,
    effect_bonuses JSONB NOT NULL DEFAULT '{}',
    base_salary INTEGER NOT NULL DEFAULT 10000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create player_specialists junction table
CREATE TABLE player_specialists (
    player_id UUID NOT NULL REFERENCES player(user_id) ON DELETE CASCADE,
    specialist_id UUID NOT NULL REFERENCES specialist(specialist_id) ON DELETE CASCADE,
    hired_date DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (player_id, specialist_id)
);

-- Create world_state table (singleton)
CREATE TABLE world_state (
    world_id TEXT PRIMARY KEY DEFAULT 'main',
    market_conditions JSONB NOT NULL DEFAULT '{}',
    active_disasters JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create auction table
CREATE TABLE auction (
    auction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_type TEXT NOT NULL,
    opportunity_details JSONB NOT NULL DEFAULT '{}',
    current_bid INTEGER NOT NULL DEFAULT 0,
    highest_bidder_id UUID REFERENCES player(user_id) ON DELETE SET NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_asset_owner_id ON asset(owner_id);
CREATE INDEX idx_asset_assigned_route_id ON asset(assigned_route_id);
CREATE INDEX idx_route_owner_id ON route(owner_id);
CREATE INDEX idx_auction_end_time ON auction(end_time);
CREATE INDEX idx_auction_highest_bidder_id ON auction(highest_bidder_id);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_player_updated_at BEFORE UPDATE ON player
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_updated_at BEFORE UPDATE ON asset
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_updated_at BEFORE UPDATE ON route
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_state_updated_at BEFORE UPDATE ON world_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_updated_at BEFORE UPDATE ON auction
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial world state
INSERT INTO world_state (world_id, market_conditions, active_disasters)
VALUES ('main', '{"regions": {}}', '[]')
ON CONFLICT (world_id) DO NOTHING;