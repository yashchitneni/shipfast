-- Add price tracking to transactions table
-- This records the actual price the player saw when they made the trade

-- Add column to track the market price at transaction time
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS actual_market_price DECIMAL(10,2);

-- Add column to track price variance from base
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS price_variance_percent DECIMAL(5,2);

-- Function to validate transaction prices
CREATE OR REPLACE FUNCTION validate_transaction_price()
RETURNS TRIGGER AS $$
DECLARE
    v_base_price DECIMAL(10,2);
    v_min_price DECIMAL(10,2);
    v_max_price DECIMAL(10,2);
BEGIN
    -- Get base price for the item
    SELECT base_price INTO v_base_price
    FROM market_items
    WHERE id = NEW.item_id;
    
    -- Set acceptable range (40% to 250% of base price)
    v_min_price := v_base_price * 0.4;
    v_max_price := v_base_price * 2.5;
    
    -- Validate the transaction price
    IF NEW.price_per_unit < v_min_price OR NEW.price_per_unit > v_max_price THEN
        RAISE EXCEPTION 'Transaction price % is outside acceptable range [%, %] for base price %', 
            NEW.price_per_unit, v_min_price, v_max_price, v_base_price;
    END IF;
    
    -- Record the actual market price and variance
    NEW.actual_market_price := NEW.price_per_unit;
    NEW.price_variance_percent := ((NEW.price_per_unit - v_base_price) / v_base_price) * 100;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price validation
DROP TRIGGER IF EXISTS validate_transaction_price_trigger ON transactions;
CREATE TRIGGER validate_transaction_price_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_price();

-- View to analyze price trends from actual transactions
CREATE OR REPLACE VIEW market_price_trends AS
SELECT 
    mi.name as item_name,
    mi.category,
    mi.base_price,
    DATE_TRUNC('hour', t.timestamp) as hour,
    AVG(t.actual_market_price) as avg_traded_price,
    MIN(t.actual_market_price) as min_traded_price,
    MAX(t.actual_market_price) as max_traded_price,
    COUNT(*) as trade_count,
    AVG(t.price_variance_percent) as avg_variance_percent
FROM transactions t
JOIN market_items mi ON t.item_id = mi.id
WHERE t.timestamp > NOW() - INTERVAL '7 days'
GROUP BY mi.name, mi.category, mi.base_price, DATE_TRUNC('hour', t.timestamp)
ORDER BY hour DESC, trade_count DESC;

-- View to detect suspicious trading patterns
CREATE OR REPLACE VIEW suspicious_trades AS
SELECT 
    p.username,
    mi.name as item_name,
    t.type as transaction_type,
    t.price_per_unit,
    mi.base_price,
    t.price_variance_percent,
    t.quantity,
    t.total_price,
    t.timestamp
FROM transactions t
JOIN market_items mi ON t.item_id = mi.id
JOIN player p ON t.player_id = p.user_id
WHERE ABS(t.price_variance_percent) > 80  -- More than 80% variance from base
ORDER BY t.timestamp DESC;

-- Update existing transactions to set actual_market_price
UPDATE transactions 
SET actual_market_price = price_per_unit,
    price_variance_percent = ((price_per_unit - mi.base_price) / mi.base_price) * 100
FROM market_items mi
WHERE transactions.item_id = mi.id
  AND transactions.actual_market_price IS NULL;