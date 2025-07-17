-- Migration: Convert legacy asset structure to placedAssets format
-- This migration handles the conversion of old asset data to the new unified structure

-- Create a temporary table to hold migrated assets
CREATE TEMP TABLE migrated_assets AS
SELECT 
  a.asset_id,
  a.owner_id,
  a.asset_type,
  a.stats,
  a.custom_name,
  a.assigned_route_id,
  a.created_at,
  a.updated_at,
  -- Map old asset types to new definition IDs
  CASE 
    -- Ships
    WHEN a.asset_type = 'ship' AND (a.stats->>'capacity')::int <= 1000 THEN 'ship-cargo-small'
    WHEN a.asset_type = 'ship' AND (a.stats->>'capacity')::int <= 5000 THEN 'ship-cargo-medium'
    WHEN a.asset_type = 'ship' THEN 'ship-cargo-large'
    -- Planes
    WHEN a.asset_type = 'plane' AND (a.stats->>'range')::int <= 500 THEN 'plane-cargo-small'
    WHEN a.asset_type = 'plane' AND (a.stats->>'range')::int <= 2000 THEN 'plane-cargo-medium'
    WHEN a.asset_type = 'plane' THEN 'plane-cargo-large'
    -- Warehouses
    WHEN a.asset_type = 'warehouse' AND (a.stats->>'capacity')::int <= 10000 THEN 'warehouse-small'
    WHEN a.asset_type = 'warehouse' AND (a.stats->>'capacity')::int <= 50000 THEN 'warehouse-medium'
    WHEN a.asset_type = 'warehouse' THEN 'warehouse-large'
    -- Specialists
    WHEN a.asset_type = 'specialist' AND a.stats->>'specialty' = 'NEGOTIATOR' THEN 'specialist-negotiator'
    WHEN a.asset_type = 'specialist' AND a.stats->>'specialty' = 'LOGISTICS' THEN 'specialist-logistics'
    WHEN a.asset_type = 'specialist' AND a.stats->>'specialty' = 'ENGINEER' THEN 'specialist-engineer'
    WHEN a.asset_type = 'specialist' AND a.stats->>'specialty' = 'FINANCE' THEN 'specialist-finance'
    WHEN a.asset_type = 'specialist' THEN 'specialist-general'
    ELSE 'unknown-asset'
  END as definition_id,
  -- Extract position data
  COALESCE(
    a.stats->'currentPosition',
    jsonb_build_object('x', 0, 'y', 0)
  ) as position,
  -- Extract rotation (default to 0)
  COALESCE((a.stats->>'rotation')::float, 0) as rotation,
  -- Extract port/location info
  CASE
    WHEN a.asset_type = 'warehouse' THEN a.stats->>'location'
    WHEN a.asset_type IN ('ship', 'plane') THEN a.stats->>'currentPort'
    ELSE NULL
  END as port_id,
  -- Extract status
  CASE
    WHEN a.stats->>'status' = 'ACTIVE' THEN 'active'
    WHEN a.stats->>'status' = 'INACTIVE' THEN 'inactive'
    WHEN a.stats->>'status' = 'MAINTENANCE' THEN 'maintenance'
    WHEN a.assigned_route_id IS NOT NULL THEN 'transit'
    ELSE 'active'
  END as status,
  -- Extract health/condition
  COALESCE((a.stats->>'condition')::int, 100) as health
FROM assets a
WHERE a.stats->>'migrated' IS NULL OR a.stats->>'migrated' = 'false';

-- Update the assets table with new structure
UPDATE assets a
SET 
  stats = jsonb_build_object(
    'definitionId', m.definition_id,
    'position', m.position,
    'rotation', m.rotation,
    'portId', m.port_id,
    'status', m.status,
    'health', m.health,
    'purchasedAt', extract(epoch from a.created_at) * 1000,
    'migrated', true,
    -- Preserve any additional data from old stats
    'legacy', a.stats
  )
FROM migrated_assets m
WHERE a.asset_id = m.asset_id;

-- Create indexes for better performance with new structure
CREATE INDEX IF NOT EXISTS idx_assets_definition_id ON assets ((stats->>'definitionId'));
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets ((stats->>'status'));
CREATE INDEX IF NOT EXISTS idx_assets_port_id ON assets ((stats->>'portId'));

-- Add migration marker
INSERT INTO migrations (name, executed_at) 
VALUES ('002_migrate_legacy_assets', NOW())
ON CONFLICT (name) DO NOTHING;

-- Log migration summary
DO $$
DECLARE
  migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM migrated_assets;
  RAISE NOTICE 'Migrated % assets to new structure', migrated_count;
END $$;