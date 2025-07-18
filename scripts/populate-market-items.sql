-- Quick script to populate market items if they're missing
-- Run this in Supabase SQL Editor

-- Check current market items
SELECT COUNT(*) as total_items FROM market_items;

-- If empty, populate with basic items
INSERT INTO market_items (
    name, type, category, base_price, current_price, 
    supply, demand, volatility, production_cost_modifier
) VALUES 
    -- Raw Materials
    ('Iron Ore', 'GOODS', 'RAW_MATERIALS', 50, 50, 1000, 800, 0.2, 1.0),
    ('Coal', 'GOODS', 'RAW_MATERIALS', 30, 30, 1500, 1200, 0.15, 0.8),
    ('Wood', 'GOODS', 'RAW_MATERIALS', 20, 20, 2000, 1800, 0.1, 0.7),
    ('Stone', 'GOODS', 'RAW_MATERIALS', 15, 15, 2500, 2000, 0.08, 0.6),
    
    -- Manufactured Goods
    ('Steel Beams', 'GOODS', 'MANUFACTURED', 150, 150, 500, 600, 0.25, 1.5),
    ('Textiles', 'GOODS', 'MANUFACTURED', 80, 80, 800, 900, 0.2, 1.2),
    ('Tools', 'GOODS', 'MANUFACTURED', 120, 120, 400, 500, 0.22, 1.4),
    
    -- Consumer Goods
    ('Food Supplies', 'GOODS', 'CONSUMER', 40, 40, 1200, 1500, 0.3, 0.9),
    ('Clothing', 'GOODS', 'CONSUMER', 60, 60, 900, 1000, 0.18, 1.1),
    ('Medicine', 'GOODS', 'CONSUMER', 200, 200, 300, 400, 0.35, 2.0),
    
    -- Luxury Goods
    ('Spices', 'GOODS', 'LUXURY', 300, 300, 200, 250, 0.4, 2.5),
    ('Silk', 'GOODS', 'LUXURY', 500, 500, 100, 150, 0.45, 3.0),
    ('Jewelry', 'GOODS', 'LUXURY', 1000, 1000, 50, 80, 0.5, 4.0)
ON CONFLICT (name) DO UPDATE SET
    current_price = EXCLUDED.current_price,
    supply = EXCLUDED.supply,
    demand = EXCLUDED.demand;

-- Verify items are loaded
SELECT 
    name, 
    category, 
    base_price, 
    current_price,
    supply,
    demand
FROM market_items
ORDER BY category, name;