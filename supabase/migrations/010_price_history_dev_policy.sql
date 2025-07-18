-- Allow anonymous users to insert price history for development
CREATE POLICY "Anon can insert price history (DEV ONLY)" ON price_history
    FOR INSERT TO anon WITH CHECK (true); 