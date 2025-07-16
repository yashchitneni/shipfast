export interface RouteCalculation {
  baseProfit: number;
  modifiedProfit: number;
  efficiency: number;
  marketMultiplier: number;
  assetBonus: number;
  specialistBonus: number;
  totalProfit: number;
}

export type MarketCondition = 'boom' | 'normal' | 'recession' | 'crisis';

export interface EconomyState {
  playerFinancials: {
    cash: number;
    creditRating: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  marketState: {
    condition: MarketCondition;
    volatility: number;
    globalMultiplier: number;
  };
  goods: Array<{
    id: string;
    name: string;
    basePrice: number;
    currentPrice: number;
    demand: number;
    supply: number;
  }>;
}