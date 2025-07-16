-- AI Companion System Tables
-- Stores AI companion state and learning data for each player

-- AI companion states
CREATE TABLE IF NOT EXISTS ai_companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Navigator AI',
    level TEXT NOT NULL CHECK (level IN ('novice', 'apprentice', 'journeyman', 'expert', 'master', 'legendary')),
    experience INTEGER NOT NULL DEFAULT 0,
    total_suggestions INTEGER NOT NULL DEFAULT 0,
    successful_suggestions INTEGER NOT NULL DEFAULT 0,
    accuracy DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Route patterns learned by AI
CREATE TABLE IF NOT EXISTS ai_route_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID NOT NULL REFERENCES ai_companions(id) ON DELETE CASCADE,
    route_id UUID NOT NULL,
    start_port TEXT NOT NULL,
    end_port TEXT NOT NULL,
    average_profit_margin DECIMAL(5,2) DEFAULT 0.00,
    success_rate DECIMAL(3,2) DEFAULT 0.00,
    optimal_goods TEXT[] DEFAULT '{}',
    best_time_of_day INTEGER,
    weather_preference TEXT,
    times_used INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market insights collected by AI
CREATE TABLE IF NOT EXISTS ai_market_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID NOT NULL REFERENCES ai_companions(id) ON DELETE CASCADE,
    port_id TEXT NOT NULL,
    good_id TEXT NOT NULL,
    demand_pattern TEXT CHECK (demand_pattern IN ('stable', 'rising', 'falling', 'volatile')),
    best_buy_times INTEGER[] DEFAULT '{}',
    best_sell_times INTEGER[] DEFAULT '{}',
    profit_potential DECIMAL(5,2) DEFAULT 0.00,
    last_analyzed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(companion_id, port_id, good_id)
);

-- Price history for AI analysis
CREATE TABLE IF NOT EXISTS ai_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID NOT NULL REFERENCES ai_market_insights(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    volume INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Disaster predictions
CREATE TABLE IF NOT EXISTS ai_disaster_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID NOT NULL REFERENCES ai_companions(id) ON DELETE CASCADE,
    disaster_type TEXT NOT NULL,
    location TEXT NOT NULL,
    predicted_date TIMESTAMPTZ NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.50,
    actual_occurred BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI suggestions
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID NOT NULL REFERENCES ai_companions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('route', 'trade', 'upgrade', 'warning')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_profit DECIMAL(10,2),
    risk_level DECIMAL(3,2) DEFAULT 0.50,
    action_required BOOLEAN DEFAULT false,
    action_type TEXT,
    action_target TEXT,
    action_timing TEXT,
    action_reasoning TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Learning events for AI improvement
CREATE TABLE IF NOT EXISTS ai_learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID NOT NULL REFERENCES ai_companions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    experience_gained INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_companions_user ON ai_companions(user_id);
CREATE INDEX idx_ai_route_patterns_companion ON ai_route_patterns(companion_id);
CREATE INDEX idx_ai_market_insights_companion ON ai_market_insights(companion_id);
CREATE INDEX idx_ai_suggestions_companion_status ON ai_suggestions(companion_id, status);
CREATE INDEX idx_ai_price_history_insight ON ai_price_history(insight_id);
CREATE INDEX idx_ai_price_history_timestamp ON ai_price_history(timestamp);

-- Row Level Security
ALTER TABLE ai_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_route_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_disaster_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own AI companion"
    ON ai_companions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their AI's route patterns"
    ON ai_route_patterns FOR SELECT
    USING (companion_id IN (SELECT id FROM ai_companions WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their AI's market insights"
    ON ai_market_insights FOR SELECT
    USING (companion_id IN (SELECT id FROM ai_companions WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their AI's price history"
    ON ai_price_history FOR SELECT
    USING (insight_id IN (
        SELECT id FROM ai_market_insights 
        WHERE companion_id IN (SELECT id FROM ai_companions WHERE user_id = auth.uid())
    ));

CREATE POLICY "Users can view their AI's predictions"
    ON ai_disaster_predictions FOR SELECT
    USING (companion_id IN (SELECT id FROM ai_companions WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their AI's suggestions"
    ON ai_suggestions FOR ALL
    USING (companion_id IN (SELECT id FROM ai_companions WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their AI's learning events"
    ON ai_learning_events FOR SELECT
    USING (companion_id IN (SELECT id FROM ai_companions WHERE user_id = auth.uid()));

-- Functions for AI operations
CREATE OR REPLACE FUNCTION update_ai_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_companions
    SET accuracy = CASE 
        WHEN total_suggestions > 0 THEN successful_suggestions::DECIMAL / total_suggestions
        ELSE 0
    END,
    updated_at = NOW()
    WHERE id = NEW.companion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_accuracy_trigger
AFTER UPDATE OF successful_suggestions, total_suggestions ON ai_companions
FOR EACH ROW
EXECUTE FUNCTION update_ai_accuracy();

-- Function to add experience and check for level up
CREATE OR REPLACE FUNCTION add_ai_experience(
    p_companion_id UUID,
    p_experience INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_current_level TEXT;
    v_new_level TEXT;
    v_total_exp INTEGER;
BEGIN
    -- Add experience
    UPDATE ai_companions
    SET experience = experience + p_experience,
        updated_at = NOW()
    WHERE id = p_companion_id
    RETURNING level, experience INTO v_current_level, v_total_exp;
    
    -- Check for level up
    v_new_level := CASE
        WHEN v_total_exp >= 100000 THEN 'legendary'
        WHEN v_total_exp >= 50000 THEN 'master'
        WHEN v_total_exp >= 25000 THEN 'expert'
        WHEN v_total_exp >= 10000 THEN 'journeyman'
        WHEN v_total_exp >= 5000 THEN 'apprentice'
        ELSE 'novice'
    END;
    
    -- Update level if changed
    IF v_new_level != v_current_level THEN
        UPDATE ai_companions
        SET level = v_new_level
        WHERE id = p_companion_id;
        
        RETURN jsonb_build_object(
            'leveled_up', true,
            'old_level', v_current_level,
            'new_level', v_new_level,
            'experience', v_total_exp
        );
    END IF;
    
    RETURN jsonb_build_object(
        'leveled_up', false,
        'level', v_current_level,
        'experience', v_total_exp
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old price history
CREATE OR REPLACE FUNCTION cleanup_old_price_history()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_price_history
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;