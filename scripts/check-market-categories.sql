-- Check available market categories and items
-- Run this to verify your market has the right categories for starting inventory

-- 1. Show all available categories with item counts
SELECT 
    category,
    COUNT(*) as item_count,
    MIN(current_price) as min_price,
    MAX(current_price) as max_price,
    ROUND(AVG(current_price)::numeric, 2) as avg_price
FROM market_items
GROUP BY category
ORDER BY category;

-- 2. Show cheap items suitable for starting inventory
SELECT 
    name,
    category,
    current_price,
    CASE 
        WHEN current_price < 50 THEN '50-100 units'
        WHEN current_price < 200 THEN '20-50 units'
        WHEN current_price < 500 THEN '10-25 units'
        ELSE 'Too expensive'
    END as starting_quantity_range
FROM market_items
WHERE current_price < 500
AND category IN ('RAW_MATERIALS', 'CONSUMER', 'ENERGY')
ORDER BY category, current_price;

-- 3. If no items found, check all categories
SELECT DISTINCT category 
FROM market_items 
ORDER BY category;

-- 4. If you need to add the missing categories, here's sample data:
-- Only run this if you don't have these items already!
/*
INSERT INTO market_items (name, type, category, base_price, current_price, supply, demand, volatility, production_cost_modifier)
VALUES 
    -- Raw Materials
    ('Iron Ore', 'GOODS', 'RAW_MATERIALS', 45, 45, 1000, 800, 0.2, 1.0),
    ('Copper', 'GOODS', 'RAW_MATERIALS', 65, 65, 800, 900, 0.25, 1.1),
    ('Lumber', 'GOODS', 'RAW_MATERIALS', 35, 35, 1200, 1000, 0.15, 0.9),
    
    -- Consumer Goods
    ('Consumer Electronics', 'GOODS', 'CONSUMER', 150, 150, 500, 600, 0.3, 1.5),
    ('Textiles', 'GOODS', 'CONSUMER', 80, 80, 700, 750, 0.2, 1.2),
    ('Food Products', 'GOODS', 'CONSUMER', 40, 40, 1500, 1400, 0.35, 1.0),
    
    -- Energy
    ('Crude Oil', 'GOODS', 'ENERGY', 70, 70, 900, 950, 0.4, 1.3),
    ('Natural Gas', 'GOODS', 'ENERGY', 55, 55, 1100, 1050, 0.35, 1.1),
    ('Coal', 'GOODS', 'ENERGY', 30, 30, 1300, 1200, 0.2, 0.8)
ON CONFLICT (name) DO NOTHING;
*/