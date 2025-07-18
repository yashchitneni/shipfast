-- Add a test player for development
-- This player ID matches the one used in the game initialization

-- Temporarily set role to bypass RLS
SET LOCAL ROLE postgres;

-- First, check if the player already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM player WHERE user_id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO player (
      user_id,
      username,
      email,
      cash,
      net_worth,
      level,
      experience,
      reputation,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Test Player',
      'test@example.com',
      100000,
      100000,
      1,
      0,
      50,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Test player created with ID: 00000000-0000-0000-0000-000000000001';
  ELSE
    RAISE NOTICE 'Test player already exists';
  END IF;
END $$;

-- Reset role
RESET ROLE; 