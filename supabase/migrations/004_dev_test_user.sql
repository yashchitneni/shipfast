-- Development only: Create a test user without auth
-- This should be removed in production

-- Temporarily disable the foreign key constraint
ALTER TABLE player DROP CONSTRAINT IF EXISTS player_user_id_fkey;

-- Insert test player
INSERT INTO player (user_id, username, cash, net_worth)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Captain', 50000, 50000)
ON CONFLICT (user_id) DO UPDATE
SET cash = EXCLUDED.cash,
    net_worth = EXCLUDED.net_worth;

-- For development, we'll skip re-adding the foreign key
-- In production, this would be:
-- ALTER TABLE player ADD CONSTRAINT player_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; 