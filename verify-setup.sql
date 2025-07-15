-- Check if test player exists
SELECT user_id, username, cash FROM player WHERE user_id = 'player-1';

-- Check for any assets
SELECT COUNT(*) as asset_count FROM asset;

-- Show functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
