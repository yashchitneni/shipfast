-- Allow anonymous users to access the test player for development
-- REMOVE THESE IN PRODUCTION!

-- Allow anon to view the test player
CREATE POLICY "Anon can view test player (DEV ONLY)" ON player
    FOR SELECT TO anon 
    USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Allow anon to update the test player
CREATE POLICY "Anon can update test player (DEV ONLY)" ON player
    FOR UPDATE TO anon 
    USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Also update the transactions policy to allow anon to create transactions with test player
CREATE POLICY "Anon can create transactions with test player (DEV ONLY)" ON transactions
    FOR INSERT TO anon 
    WITH CHECK (player_id = '00000000-0000-0000-0000-000000000001'); 