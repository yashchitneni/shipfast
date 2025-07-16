# Economy System Documentation

## Overview

The Flexport economy system implements a comprehensive financial simulation with dynamic market pricing, profit calculations, and financial management features. The system is built using Zustand for state management and includes all the formulas specified in the CSDD document.

## Key Components

### 1. Market System

#### Goods Categories
- **Raw Materials**: High volume, low margin, low volatility (e.g., Coffee)
- **Manufactured Goods**: Medium volume, medium margin, medium volatility (e.g., Electronics)
- **Luxury Goods**: Low volume, high margin, high volatility (e.g., Luxury Watches)
- **Perishable Goods**: Require refrigeration, high spoilage risk (e.g., Fresh Fruit)

#### Price Calculation Formula
```typescript
Price = (BaseCost + ProductionCostModifier) * (Demand / Supply) * (1 + VolatilityModifier) * MarketConditionModifier
```

### 2. Profit Calculation System

#### Route Profit Formula
```typescript
// Base calculation
BaseProfit = Distance × BaseRatePerMile × CargoValueMultiplier

// Efficiency modifier
AssetEfficiency = 1 + (AssetLevel × 0.1) + (SpecialistBonus × 0.05)

// Total profit
TotalProfit = BaseProfit × AssetEfficiency × MarketConditions × (1 - MaintenanceCostRate)
```

#### Market Condition Modifiers
- **Boom**: +30% profit modifier
- **Normal**: No modifier
- **Recession**: -30% profit modifier
- **Crisis**: -50% profit modifier

### 3. Financial Management

#### Credit Rating System
- Ratings: AAA, AA, A, BBB, BB, B, CCC, CC, C, D
- Based on debt-to-asset ratio and payment history
- Affects loan interest rates

#### Interest Rates by Credit Rating
- AAA: 3.0%
- AA: 3.5%
- A: 4.0%
- BBB: 5.0%
- BB: 6.5%
- B: 8.0%
- CCC: 10.0%
- CC: 12.5%
- C: 15.0%
- D: 20.0%

### 4. Compounding Growth

#### Formula
```typescript
NextProfit = CurrentProfit * (1 + (Rate / 365))^Time

Where:
Rate = BaseRate + LaborBonuses + AIBonus - DisasterPenalties - LoanInterestRates
```

## Store Actions

### Market Actions
- `initializeEconomy()`: Sets up initial goods and market state
- `updateMarketPrices()`: Recalculates all goods prices based on current conditions
- `updateMarketCondition(condition)`: Changes the global market condition
- `getGoodPrice(goodId)`: Returns current price for a specific good

### Financial Actions
- `calculateRouteProfit(calculation)`: Calculates profit for a route with all modifiers
- `calculateCompoundingGrowth(growth)`: Calculates compound growth over time
- `recordTransaction(record)`: Records income or expense transaction
- `updateMonthlyFinancials()`: Updates monthly financial summaries

### Loan Management
- `applyForLoan(principal, termDays)`: Apply for a loan based on credit rating
- `makePayment(loanId, amount)`: Make a payment on an existing loan
- `updateCreditRating()`: Recalculates credit rating based on financial health

### Modifier Actions
- `applyDisasterPenalty(penalty)`: Applies disaster penalty (capped at 50%)
- `applySpecialistBonus(bonus)`: Applies specialist bonus to calculations

## Usage Example

```typescript
import { useEconomyStore } from '@/store';

// Initialize the economy
const { initializeEconomy, calculateRouteProfit } = useEconomyStore();
initializeEconomy();

// Calculate route profit
const routeCalculation = {
  distance: 1500,
  baseRatePerMile: 2.5,
  cargoValueMultiplier: 1.8,
  assetLevel: 3,
  specialistBonus: 2,
  marketConditions: 'normal',
  maintenanceCostRate: 0.15
};

const profit = calculateRouteProfit(routeCalculation);
console.log('Route profit:', profit.totalProfit);
```

## Testing

The economy system includes comprehensive tests covering:
- Market price calculations
- Profit formulas
- Financial transactions
- Credit rating system
- Loan management
- Market condition effects
- Disaster penalties

Run tests with:
```bash
npm test app/store/__tests__/useEconomyStore.test.ts
```

## Demo Pages

- `/economy-demo`: Full economy dashboard with market prices and financial overview
- Components:
  - `EconomyDashboard`: Complete financial overview and market state
  - `RouteProfitCalculator`: Interactive profit calculator with formula breakdown

## Future Enhancements

1. **Production Cost Modifiers**: Link raw material prices to manufactured goods
2. **Market Events**: Random events affecting supply/demand
3. **Competition System**: Other players affecting market prices
4. **Government Subsidies**: Bonuses for green technology
5. **Advanced Financial Instruments**: Futures, options, insurance
6. **Regional Markets**: Different prices in different regions
7. **Seasonal Variations**: Time-based demand changes