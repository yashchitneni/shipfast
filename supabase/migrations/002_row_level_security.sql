-- Enable Row Level Security for all tables
ALTER TABLE player ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE route ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction ENABLE ROW LEVEL SECURITY;

-- Player table policies
-- Players can only read and update their own data
CREATE POLICY "Players can view own profile" ON player
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Players can update own profile" ON player
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Players can insert own profile" ON player
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Asset table policies
-- Players can only manage their own assets
CREATE POLICY "Players can view own assets" ON asset
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Players can create own assets" ON asset
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Players can update own assets" ON asset
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Players can delete own assets" ON asset
    FOR DELETE USING (auth.uid() = owner_id);

-- Route table policies
-- Players can only manage their own routes
CREATE POLICY "Players can view own routes" ON route
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Players can create own routes" ON route
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Players can update own routes" ON route
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Players can delete own routes" ON route
    FOR DELETE USING (auth.uid() = owner_id);

-- Specialist table policies
-- All authenticated users can view specialists (they're shared)
CREATE POLICY "All users can view specialists" ON specialist
    FOR SELECT TO authenticated USING (true);

-- Player_specialists table policies
-- Players can only manage their own specialist hires
CREATE POLICY "Players can view own specialists" ON player_specialists
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Players can hire specialists" ON player_specialists
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can fire specialists" ON player_specialists
    FOR DELETE USING (auth.uid() = player_id);

-- World_state table policies
-- All authenticated users can read world state
CREATE POLICY "All users can read world state" ON world_state
    FOR SELECT TO authenticated USING (true);

-- Only service role can update world state (via Edge Functions)
-- No policy needed as service role bypasses RLS

-- Auction table policies
-- All authenticated users can view active auctions
CREATE POLICY "All users can view auctions" ON auction
    FOR SELECT TO authenticated USING (true);

-- Service role will handle auction updates via Edge Functions
-- No direct user update policies needed

-- Additional policies for competitive features
-- Players can view other players' basic info (for leaderboards)
CREATE POLICY "Players can view other players basic info" ON player
    FOR SELECT TO authenticated 
    USING (true)
    WITH CHECK (auth.uid() = user_id);

-- Create a view for public player stats (leaderboard)
CREATE VIEW public_player_stats AS
SELECT 
    username,
    net_worth,
    (ai_companion_state->>'level')::int as ai_level
FROM player
ORDER BY net_worth DESC;

-- Grant access to the view
GRANT SELECT ON public_player_stats TO authenticated;