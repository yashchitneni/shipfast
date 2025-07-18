-- Debug script to check market items structure
-- Run this in Supabase SQL Editor to diagnose the issue

-- Check if market_items table exists and has data
SELECT COUNT(*) as total_items FROM market_items;

-- Show first 5 market items with all columns
SELECT * FROM market_items LIMIT 5;

-- Check if price_history table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'price_history'
) as price_history_exists;

-- If price_history doesn't exist, create it
CREATE TABLE IF NOT EXISTS price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    supply INTEGER NOT NULL,
    demand INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_price_history_item_timestamp 
ON price_history(item_id, timestamp DESC);

-- Check market items have valid IDs
SELECT 
    id,
    name,
    current_price,
    CASE 
        WHEN id IS NULL THEN 'NULL ID!'
        WHEN id::text = '' THEN 'EMPTY ID!'
        ELSE 'Valid ID'
    END as id_status
FROM market_items;

-- Enable RLS on price_history if not already enabled
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access (dev mode)
CREATE POLICY IF NOT EXISTS "Anon can manage price history (DEV)" 
ON price_history FOR ALL TO anon WITH CHECK (true);