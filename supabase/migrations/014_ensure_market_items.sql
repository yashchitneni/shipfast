-- Migration: Ensure market items exist in database
-- This populates the market_items table with starter data if empty

-- Only insert if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM market_items LIMIT 1) THEN
        INSERT INTO market_items (
            name, type, category, base_price, current_price, 
            supply, demand, volatility, production_cost_modifier
        ) VALUES 
            -- Raw Materials
            ('Iron Ore', 'GOODS', 'RAW_MATERIALS', 50, 50, 1000, 800, 0.2, 1.0),
            ('Coal', 'GOODS', 'RAW_MATERIALS', 30, 30, 1500, 1200, 0.15, 0.8),
            ('Wood', 'GOODS', 'RAW_MATERIALS', 20, 20, 2000, 1800, 0.1, 0.7),
            ('Stone', 'GOODS', 'RAW_MATERIALS', 15, 15, 2500, 2000, 0.08, 0.6),
            ('Copper', 'GOODS', 'RAW_MATERIALS', 70, 70, 700, 600, 0.22, 1.1),
            
            -- Manufactured Goods
            ('Steel Beams', 'GOODS', 'MANUFACTURED', 150, 150, 500, 600, 0.25, 1.5),
            ('Textiles', 'GOODS', 'MANUFACTURED', 80, 80, 800, 900, 0.2, 1.2),
            ('Tools', 'GOODS', 'MANUFACTURED', 120, 120, 400, 500, 0.22, 1.4),
            ('Glass', 'GOODS', 'MANUFACTURED', 90, 90, 600, 700, 0.18, 1.3),
            
            -- Consumer Goods
            ('Food Supplies', 'GOODS', 'CONSUMER', 40, 40, 1200, 1500, 0.3, 0.9),
            ('Clothing', 'GOODS', 'CONSUMER', 60, 60, 900, 1000, 0.18, 1.1),
            ('Medicine', 'GOODS', 'CONSUMER', 200, 200, 300, 400, 0.35, 2.0),
            ('Books', 'GOODS', 'CONSUMER', 35, 35, 1100, 1300, 0.12, 0.85),
            
            -- Technology
            ('Electronics', 'GOODS', 'TECHNOLOGY', 400, 400, 200, 300, 0.4, 2.8),
            ('Machinery Parts', 'GOODS', 'TECHNOLOGY', 250, 250, 350, 450, 0.3, 2.2),
            
            -- Luxury Goods
            ('Spices', 'GOODS', 'LUXURY', 300, 300, 200, 250, 0.4, 2.5),
            ('Silk', 'GOODS', 'LUXURY', 500, 500, 100, 150, 0.45, 3.0),
            ('Jewelry', 'GOODS', 'LUXURY', 1000, 1000, 50, 80, 0.5, 4.0),
            ('Perfume', 'GOODS', 'LUXURY', 600, 600, 80, 120, 0.42, 3.2),
            
            -- Energy
            ('Oil', 'GOODS', 'ENERGY', 85, 85, 1000, 1200, 0.35, 1.6),
            ('Natural Gas', 'GOODS', 'ENERGY', 65, 65, 1300, 1400, 0.32, 1.4);
            
        RAISE NOTICE 'Market items populated successfully';
    ELSE
        RAISE NOTICE 'Market items already exist, skipping population';
    END IF;
END $$;

-- Add index for faster queries if not exists
CREATE INDEX IF NOT EXISTS idx_market_items_category ON market_items(category);
CREATE INDEX IF NOT EXISTS idx_market_items_type ON market_items(type);

-- Verify items exist
SELECT COUNT(*) as total_items, 
       COUNT(DISTINCT category) as categories,
       MIN(base_price) as min_price,
       MAX(base_price) as max_price
FROM market_items;