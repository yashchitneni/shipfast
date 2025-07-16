# Revenue Generation System

The revenue generation system in Flexport automatically processes income and expenses based on active routes, asset assignments, and market conditions. It provides a realistic economic simulation where players must balance revenue generation with operational costs.

## Overview

The system operates on cycles (default: every game hour) and performs the following:

1. **Revenue Calculation**: Processes all active routes and calculates income based on:
   - Route distance and cargo capacity
   - Market prices for transported goods
   - Asset efficiency modifiers
   - Current market conditions

2. **Expense Tracking**: Deducts operational costs including:
   - Asset maintenance
   - Fuel costs
   - Port fees
   - Crew wages
   - Insurance

3. **Financial Reporting**: Generates comprehensive reports showing:
   - Revenue sources
   - Expense breakdowns
   - Route performance
   - Profit margins

## Architecture

### Core Components

```typescript
// Revenue Service (app/services/revenueService.ts)
- Manages revenue cycles
- Calculates route profits
- Tracks operating expenses
- Generates financial reports

// Revenue Hook (app/hooks/useRevenueGeneration.ts)
- Integrates with game loop
- Handles automatic processing
- Provides event callbacks
- Exposes revenue metrics

// UI Components
- RevenueDisplay: Real-time revenue monitoring
- FinancialReport: Detailed financial analytics
```

## Usage

### Basic Integration

```typescript
import { useRevenueGeneration } from '@/hooks/useRevenueGeneration';

function GameComponent() {
  const { 
    currentCycle,
    getRevenueRate,
    generateReport 
  } = useRevenueGeneration({
    enabled: true,
    onRevenueGenerated: (amount) => {
      console.log(`Revenue: +$${amount}`);
    },
    onExpenseIncurred: (amount) => {
      console.log(`Expense: -$${amount}`);
    }
  });
  
  // Display current revenue rate
  const revenuePerHour = getRevenueRate();
  
  // Generate 7-day report
  const weeklyReport = generateReport(7);
}
```

### Revenue Calculation Formula

```typescript
// Base Revenue = Route Revenue × Trips Completed
// Trips Completed = Cycle Time / Route Duration

// Final Revenue = Base Revenue × Modifiers
// Modifiers include:
// - Asset Efficiency: 1 + (Asset Level × 0.1)
// - Market Condition: Boom(1.3), Normal(1.0), Recession(0.7), Crisis(0.5)
// - Competition: 1 - Competition Pressure (default 0.1)
// - Specialist Bonuses: Additional multipliers from crew
```

### Expense Categories

1. **Maintenance Costs**
   - Calculated per hour for all assets
   - Based on asset definition maintenance cost
   - Always incurred regardless of usage

2. **Fuel Costs**
   - Only for assets in transit
   - Based on route distance and fuel efficiency
   - Calculated per trip completed

3. **Port Fees**
   - Charged per port visit
   - Number of stops × fee per stop
   - Higher for larger vessels

4. **Crew Wages**
   - Based on crew requirements
   - Paid per hour of operation
   - Increases with specialist crew

5. **Insurance**
   - Daily cost based on asset value
   - Typically 0.1% of asset cost per day
   - Required for all assets

## Configuration

The revenue system can be configured through the service:

```typescript
const revenueService = useRevenueService.getState();

revenueService.updateConfig({
  cycleIntervalMinutes: 60,      // Process every hour
  baseRevenueMultiplier: 1.0,    // Global revenue multiplier
  expenseMultiplier: 1.0,        // Global expense multiplier
  marketVolatilityImpact: 0.2,   // Market condition impact
  disasterImpactSeverity: 0.3,   // Disaster penalty
  competitionPressure: 0.1       // Competition reduction
});
```

## Events

The system emits events that can be subscribed to:

- `revenue-generated`: When income is processed
- `expense-incurred`: When costs are deducted
- `cycle-completed`: When a full cycle finishes
- `bonus-earned`: When special bonuses are awarded

## Financial Reports

Generate detailed reports for any time period:

```typescript
const report = generateReport(30); // 30-day report

// Report includes:
// - Total revenue/expenses/profit
// - Revenue by source type
// - Expenses by category
// - Top performing routes
// - Growth vs previous period
// - AI recommendations
```

## Best Practices

1. **Route Optimization**
   - Assign higher-level assets to longer routes
   - Consider fuel efficiency for route selection
   - Balance asset utilization across routes

2. **Cost Management**
   - Monitor maintenance costs for idle assets
   - Consider selling underutilized assets
   - Upgrade assets to improve efficiency

3. **Market Timing**
   - Increase operations during boom periods
   - Reduce activity during crises
   - Adjust routes based on market conditions

## Integration with Other Systems

The revenue system integrates with:

- **Economy Store**: Records all financial transactions
- **Route Store**: Processes active routes
- **Empire Store**: Updates player cash and assets
- **Time System**: Syncs with game time for cycles

## Performance Considerations

- Revenue cycles are processed asynchronously
- Only active routes with assigned assets generate revenue
- Expense calculations are optimized for large fleets
- Historical data is limited to prevent memory growth

## Testing

The system includes comprehensive tests:

```bash
npm test app/services/__tests__/revenueService.test.ts
```

## Future Enhancements

Planned improvements include:
- Contract-based revenue streams
- Dynamic pricing based on supply/demand
- Seasonal revenue variations
- Competitor AI economic pressure
- Investment opportunities
- Revenue sharing partnerships