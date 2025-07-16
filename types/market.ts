// Market System Types for Flexport Trading

export enum MarketType {
  GOODS = 'GOODS',
  CAPITAL = 'CAPITAL',
  ASSETS = 'ASSETS',
  LABOR = 'LABOR'
}

export enum GoodsCategory {
  RAW_MATERIALS = 'RAW_MATERIALS',
  MANUFACTURED = 'MANUFACTURED',
  LUXURY = 'LUXURY',
  PERISHABLE = 'PERISHABLE'
}

export interface MarketItem {
  id: string;
  name: string;
  type: MarketType;
  category?: GoodsCategory;
  basePrice: number;
  currentPrice: number;
  supply: number;
  demand: number;
  volatility: number; // 0-1 range for price fluctuation
  productionCostModifier: number;
  lastUpdated: Date;
}

export interface PriceHistory {
  itemId: string;
  price: number;
  supply: number;
  demand: number;
  timestamp: Date;
}

export interface Transaction {
  id: string;
  itemId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  playerId: string;
  timestamp: Date;
}

export interface MarketDynamics {
  supplyGrowthRate: number;
  demandVolatility: number;
  priceElasticity: number;
  seasonalModifiers: Record<string, number>;
}

export interface MarketState {
  items: Map<string, MarketItem>;
  priceHistory: Map<string, PriceHistory[]>;
  transactions: Transaction[];
  lastUpdateCycle: Date;
  marketDynamics: MarketDynamics;
}

// Market calculation interfaces
export interface PriceCalculationParams {
  baseCost: number;
  productionCostModifier: number;
  supply: number;
  demand: number;
  volatilityModifier: number;
}

export interface MarketUpdateResult {
  updatedItems: MarketItem[];
  priceChanges: Array<{
    itemId: string;
    oldPrice: number;
    newPrice: number;
    percentageChange: number;
  }>;
  timestamp: Date;
}