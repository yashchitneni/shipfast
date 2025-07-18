-- Enable Realtime for market_items table
-- This allows all players to receive price updates in real-time

-- Enable realtime for the market_items table
ALTER PUBLICATION supabase_realtime ADD TABLE market_items;

-- Verify realtime is enabled
SELECT 
    schemaname,
    tablename 
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime';

-- Test by updating a price (this should trigger realtime updates to all connected clients)
UPDATE market_items 
SET current_price = current_price * 1.05,
    last_updated = NOW()
WHERE name = 'Iron Ore'
LIMIT 1;

-- You should see the update in the browser console if realtime is working