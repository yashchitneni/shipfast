-- Update the category constraint to match TypeScript enum
ALTER TABLE market_items DROP CONSTRAINT IF EXISTS market_items_category_check;

ALTER TABLE market_items ADD CONSTRAINT market_items_category_check 
CHECK (category IN ('RAW_MATERIALS', 'MANUFACTURED', 'CONSUMER', 'TECHNOLOGY', 'LUXURY', 'ENERGY')); 