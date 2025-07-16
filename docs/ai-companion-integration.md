# AI Companion Integration Guide

## Overview

The AI Companion system provides intelligent assistance to players through machine learning and pattern recognition. The companion learns from player behavior and provides increasingly accurate suggestions as it levels up.

## Key Features

1. **Learning System**: Learns from route performance, market data, and player decisions
2. **Suggestion Engine**: Provides contextual suggestions for routes, trades, and warnings
3. **Level Progression**: 5 levels from Novice to Master with increasing capabilities
4. **Profit Bonuses**: Higher levels provide passive profit bonuses (up to 5% at Master level)
5. **Persistence**: AI state is saved to Supabase and persists across sessions

## Integration Steps

### 1. Database Setup

Run the following SQL in your Supabase dashboard to create the required tables:

```sql
CREATE TABLE IF NOT EXISTS ai_companions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  experience INTEGER DEFAULT 0,
  total_suggestions INTEGER DEFAULT 0,
  successful_suggestions INTEGER DEFAULT 0,
  accuracy DECIMAL(3,2) DEFAULT 0,
  learning_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  expected_profit DECIMAL(10,2),
  risk_level DECIMAL(3,2),
  action_required BOOLEAN DEFAULT false,
  suggested_action JSONB,
  accepted BOOLEAN DEFAULT false,
  successful BOOLEAN,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_companions_user_id ON ai_companions(user_id);
CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_created_at ON ai_suggestions(created_at);

-- Enable RLS
ALTER TABLE ai_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ai_companions_user_policy ON ai_companions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY ai_suggestions_user_policy ON ai_suggestions
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Component Integration

Add the AI Companion panel to your game layout:

```tsx
import { AICompanionPanel } from '@/app/components/game/AICompanionPanel';
import { useAICompanion } from '@/app/hooks/useAICompanion';

function GameLayout() {
  const { user } = useUser();
  const gameState = useGameState();
  
  const {
    companion,
    trackRoutePerformance,
    trackMarketData,
  } = useAICompanion({
    userId: user.id,
    autoInitialize: true,
    suggestionInterval: 30000, // 30 seconds
  });

  return (
    <div className="game-layout">
      {/* Your game content */}
      
      {companion && (
        <AICompanionPanel 
          userId={user.id}
          gameState={gameState}
        />
      )}
    </div>
  );
}
```

### 3. Track Performance Data

When a route is completed:

```tsx
const onRouteComplete = (routeData) => {
  const metrics: PerformanceMetrics = {
    routeId: routeData.id,
    startTime: routeData.startTime,
    endTime: new Date(),
    profit: calculateProfit(routeData),
    expenses: calculateExpenses(routeData),
    cargo: routeData.cargo.map(c => ({
      goodId: c.goodId,
      quantity: c.quantity,
      buyPrice: c.buyPrice,
      sellPrice: c.sellPrice,
    })),
    incidents: routeData.incidents || [],
    weatherConditions: routeData.weather,
    success: routeData.profit > 0,
  };
  
  trackRoutePerformance(metrics);
};
```

### 4. Update Market Data

When market prices change:

```tsx
const onMarketPriceUpdate = (market) => {
  trackMarketData(
    market.portId,
    market.goodId,
    market.currentPrice,
    market.volume
  );
};
```

### 5. Apply Profit Bonuses

When calculating profits:

```tsx
const calculateFinalProfit = (baseProfit: number) => {
  const { profitBonus } = useAIStore.getState();
  return baseProfit * (1 + profitBonus);
};
```

## AI Levels and Features

### Novice (0 XP)
- Basic route suggestions
- No bonuses
- Learning phase

### Competent (100 XP)
- Route optimization suggestions
- 10% accuracy bonus
- 1% profit bonus

### Experienced (500 XP)
- Market predictions
- 20% accuracy bonus
- 2% profit bonus

### Expert (1500 XP)
- Disaster warnings
- 35% accuracy bonus
- 3% profit bonus

### Master (5000 XP)
- Advanced strategies
- 50% accuracy bonus
- 5% profit bonus

## Customization

### Custom AI Names

```tsx
const { initializeAI } = useAIStore();
initializeAI(userId, "Captain's Assistant");
```

### Suggestion Intervals

```tsx
const ai = useAICompanion({
  userId: user.id,
  suggestionInterval: 60000, // Check every minute
});
```

### Custom Suggestion Handling

```tsx
const handleSuggestion = (suggestion: AISuggestion) => {
  if (suggestion.type === 'route' && suggestion.priority === 'high') {
    // Auto-accept high priority route suggestions
    acceptSuggestion(suggestion.id);
    navigateToRoute(suggestion.suggestedAction?.target);
  }
};
```

## Performance Considerations

1. **Learning Data Size**: The AI stores up to 100 price points per market insight
2. **Suggestion Frequency**: Default 30-second intervals, adjust based on game pace
3. **State Persistence**: Auto-saves every minute, manual saves on important events
4. **Memory Management**: Old route patterns are periodically cleaned up

## Troubleshooting

### AI Not Initializing
- Check user authentication
- Verify Supabase tables exist
- Check browser console for errors

### Suggestions Not Appearing
- Ensure game state is being passed to AI
- Check suggestion interval settings
- Verify AI has enough learning data

### Performance Issues
- Reduce suggestion interval
- Limit stored price history
- Use pagination for suggestion display

## Future Enhancements

1. **Voice Integration**: AI voice announcements for critical suggestions
2. **Multiplayer Sharing**: Learn from fleet-wide performance data
3. **Custom Training**: Players can train AI for specific strategies
4. **Visual Analytics**: Charts showing AI learning progress
5. **Achievement Integration**: Special achievements for AI mastery