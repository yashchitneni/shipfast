-- Enable RLS for market tables
ALTER TABLE market_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Market items policies
-- All authenticated users can view market items
CREATE POLICY "All users can view market items" ON market_items
    FOR SELECT TO authenticated USING (true);

-- Only service role can manage market items (for now)
-- In production, you might want to allow certain admin users
CREATE POLICY "Service role can insert market items" ON market_items
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update market items" ON market_items
    FOR UPDATE TO service_role USING (true);

CREATE POLICY "Service role can delete market items" ON market_items
    FOR DELETE TO service_role USING (true);

-- Transactions policies
-- Players can view their own transactions
CREATE POLICY "Players can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = player_id);

-- Players can create transactions (buying/selling)
CREATE POLICY "Players can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Price history policies
-- All authenticated users can view price history
CREATE POLICY "All users can view price history" ON price_history
    FOR SELECT TO authenticated USING (true);

-- Only service role can insert price history (automatic from market updates)
CREATE POLICY "Service role can insert price history" ON price_history
    FOR INSERT TO service_role WITH CHECK (true);

-- For development/testing: Allow anonymous users to manage market items
-- REMOVE THESE IN PRODUCTION!
CREATE POLICY "Anon can insert market items (DEV ONLY)" ON market_items
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update market items (DEV ONLY)" ON market_items
    FOR UPDATE TO anon USING (true);

CREATE POLICY "Anon can view market items (DEV ONLY)" ON market_items
    FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can create transactions (DEV ONLY)" ON transactions
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can view all transactions (DEV ONLY)" ON transactions
    FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can view price history (DEV ONLY)" ON price_history
    FOR SELECT TO anon USING (true); 