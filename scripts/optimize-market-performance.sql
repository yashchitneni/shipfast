-- Performance optimization for market_items table

-- 1. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_market_items_category ON market_items(category);
CREATE INDEX IF NOT EXISTS idx_market_items_type ON market_items(type);
CREATE INDEX IF NOT EXISTS idx_market_items_name ON market_items(name);

-- 2. Add more market items if needed (you only have 8)
INSERT INTO market_items (
    name, type, category, base_price, current_price, 
    supply, demand, volatility, production_cost_modifier
) VALUES 
    -- More items to make the market richer
    ('Copper', 'GOODS', 'RAW_MATERIALS', 70, 70, 700, 600, 0.22, 1.1),
    ('Silver', 'GOODS', 'RAW_MATERIALS', 180, 180, 300, 350, 0.28, 1.4),
    ('Glass', 'GOODS', 'MANUFACTURED', 90, 90, 600, 700, 0.18, 1.3),
    ('Books', 'GOODS', 'CONSUMER', 35, 35, 1100, 1300, 0.12, 0.85),
    ('Electronics', 'GOODS', 'TECHNOLOGY', 400, 400, 200, 300, 0.4, 2.8),
    ('Machinery Parts', 'GOODS', 'TECHNOLOGY', 250, 250, 350, 450, 0.3, 2.2),
    ('Perfume', 'GOODS', 'LUXURY', 600, 600, 80, 120, 0.42, 3.2),
    ('Oil', 'GOODS', 'ENERGY', 85, 85, 1000, 1200, 0.35, 1.6),
    ('Natural Gas', 'GOODS', 'ENERGY', 65, 65, 1300, 1400, 0.32, 1.4),
    ('Wheat', 'GOODS', 'RAW_MATERIALS', 25, 25, 1800, 2000, 0.15, 0.75),
    ('Cotton', 'GOODS', 'RAW_MATERIALS', 35, 35, 1400, 1600, 0.18, 0.85),
    ('Rubber', 'GOODS', 'RAW_MATERIALS', 55, 55, 900, 1000, 0.2, 0.95)
ON CONFLICT (name) DO NOTHING;

-- 3. Analyze tables for query optimization
ANALYZE market_items;

-- 4. Check if we need to create the price_history table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    supply INTEGER NOT NULL,
    demand INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create a materialized view for faster category queries (optional)
-- This pre-calculates category summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS market_category_summary AS
SELECT 
    category,
    COUNT(*) as item_count,
    AVG(current_price) as avg_price,
    MIN(current_price) as min_price,
    MAX(current_price) as max_price
FROM market_items
GROUP BY category;

-- Refresh the view
REFRESH MATERIALIZED VIEW IF EXISTS market_category_summary;

-- 6. Verify performance improvement
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM market_items ORDER BY name;

-- Show final count
SELECT COUNT(*) as total_items FROM market_items;