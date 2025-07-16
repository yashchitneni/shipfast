// Economy type definitions for Flexport game

export type GoodsCategory = 'raw-materials' | 'manufactured-goods' | 'luxury-goods' | 'perishable-goods';
export type MarketCondition = 'boom' | 'normal' | 'recession' | 'crisis';
export type CreditRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';

export interface Good {
  id: string;
  name: string;
  category: GoodsCategory;
  baseCost: number;
  totalDemand: number;
  totalSupply: number;
  volatilityModifier: number;
  requiresRefrigeration: boolean;
  currentPrice?: number;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface MarketState {
  condition: MarketCondition;
  volatilityFactor: number;
  globalDemandModifier: number;
  globalSupplyModifier: number;
  lastUpdate: number;
}

export interface RouteProfit {
  routeId: string;
  baseProfit: number;
  assetEfficiencyModifier: number;
  marketConditionModifier: number;
  maintenanceCostModifier: number;
  totalProfit: number;
  timestamp: number;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  timestamp: number;
  routeId?: string;
  assetId?: string;
}

export interface Loan {
  id: string;
  principal: number;
  interestRate: number;
  termDays: number;
  startDate: number;
  remainingBalance: number;
  monthlyPayment: number;
  status: 'active' | 'paid' | 'defaulted';
}

export interface PlayerFinancials {
  cash: number;
  netWorth: number;
  creditRating: CreditRating;
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  debtToAssetRatio: number;
  loans: Loan[];
  monthlyFinancials: MonthlyFinancial[];
}

export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  maintenanceCosts: number;
  loanPayments: number;
  operatingCosts: number;
}

export interface EconomyModifiers {
  assetEfficiency: number;
  specialistBonus: number;
  marketVolatility: number;
  disasterPenalty: number;
  competitionPressure: number;
  governmentSubsidy: number;
}

export interface RouteCalculation {
  distance: number;
  baseRatePerMile: number;
  cargoValueMultiplier: number;
  assetLevel: number;
  specialistBonus: number;
  marketConditions: MarketCondition;
  maintenanceCostRate: number;
}

export interface CompoundingGrowth {
  currentProfit: number;
  baseRate: number;
  laborBonuses: number;
  aiBonus: number;
  disasterPenalties: number;
  loanInterestRates: number;
  timeDays: number;
  nextProfit: number;
}