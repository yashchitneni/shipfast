-- Migration for enhanced asset system with planes and warehouses
-- Adds specific columns for better performance and querying

-- Add new columns to asset table for enhanced properties
ALTER TABLE asset ADD COLUMN IF NOT EXISTS position JSONB;
ALTER TABLE asset ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;
ALTER TABLE asset ADD COLUMN IF NOT EXISTS port_id TEXT;
ALTER TABLE asset ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'transit'));
ALTER TABLE asset ADD COLUMN IF NOT EXISTS health INTEGER DEFAULT 100 CHECK (health >= 0 AND health <= 100);
ALTER TABLE asset ADD COLUMN IF NOT EXISTS current_load INTEGER DEFAULT 0;
ALTER TABLE asset ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE asset ADD COLUMN IF NOT EXISTS last_maintenance TIMESTAMPTZ;

-- Create placed_assets view for easier querying
CREATE OR REPLACE VIEW placed_assets AS
SELECT 
    a.asset_id,
    a.owner_id,
    a.asset_type,
    a.custom_name,
    a.stats,
    a.position,
    a.rotation,
    a.port_id,
    a.status,
    a.health,
    a.current_load,
    a.destination,
    a.created_at,
    a.last_maintenance,
    p.username as owner_name
FROM asset a
JOIN player p ON a.owner_id = p.user_id
WHERE a.position IS NOT NULL;

-- Create indexes for spatial queries and performance
CREATE INDEX IF NOT EXISTS idx_asset_position ON asset USING GIN (position);
CREATE INDEX IF NOT EXISTS idx_asset_port_id ON asset(port_id);
CREATE INDEX IF NOT EXISTS idx_asset_status ON asset(status);
CREATE INDEX IF NOT EXISTS idx_asset_type ON asset(asset_type);

-- Function to calculate area effects (e.g., warehouse efficiency boost to nearby ports)
CREATE OR REPLACE FUNCTION calculate_area_effects(asset_position JSONB, effect_radius NUMERIC)
RETURNS TABLE(affected_port_id TEXT, distance NUMERIC) AS $$
BEGIN
    -- This is a placeholder implementation
    -- In a real system, this would calculate distances to all ports
    -- and return those within the effect radius
    RETURN QUERY
    SELECT 
        'port-example'::TEXT as affected_port_id,
        50.0::NUMERIC as distance
    WHERE effect_radius > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get asset capacity utilization
CREATE OR REPLACE FUNCTION get_asset_utilization(asset_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    asset_record RECORD;
    capacity NUMERIC;
    current_load NUMERIC;
BEGIN
    SELECT a.stats->>'capacity', a.current_load
    INTO capacity, current_load
    FROM asset a
    WHERE a.asset_id = get_asset_utilization.asset_id;
    
    IF capacity IS NULL OR capacity = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN COALESCE(current_load, 0) / capacity::NUMERIC;
END;
$$ LANGUAGE plpgsql;

-- Add comment documentation
COMMENT ON COLUMN asset.position IS 'JSON object with x and y coordinates for placed assets';
COMMENT ON COLUMN asset.rotation IS 'Rotation angle in degrees (0-360)';
COMMENT ON COLUMN asset.port_id IS 'ID of the port this asset is snapped to (if applicable)';
COMMENT ON COLUMN asset.status IS 'Current operational status of the asset';
COMMENT ON COLUMN asset.health IS 'Asset health/condition percentage (0-100)';
COMMENT ON COLUMN asset.current_load IS 'Current cargo or storage utilization';
COMMENT ON COLUMN asset.destination IS 'Destination port/location for assets in transit';
COMMENT ON COLUMN asset.last_maintenance IS 'Timestamp of last maintenance performed';