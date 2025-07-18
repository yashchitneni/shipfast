-- Create price_history table if it doesn't exist
-- This table is optional - the game works without it

CREATE TABLE IF NOT EXISTS price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    supply INTEGER NOT NULL,
    demand INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_price_history_item_timestamp 
ON price_history(item_id, timestamp DESC);

-- Enable RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Dev policy for anonymous access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'price_history' 
        AND policyname = 'Anon can manage price history (DEV)'
    ) THEN
        CREATE POLICY "Anon can manage price history (DEV)" 
        ON price_history FOR ALL TO anon WITH CHECK (true);
    END IF;
END $$;

-- Verify it was created
SELECT 
    'price_history table exists' as status,
    COUNT(*) as row_count 
FROM price_history;