// Revenue generation type definitions for Flexport game

import type { RouteProfit, FinancialRecord } from './economy';

export interface RevenueSource {
  id: string;
  type: 'route' | 'contract' | 'market-trade' | 'service';
  routeId?: string;
  assetId?: string;
  description: string;
  baseAmount: number;
  modifiers: RevenueModifier[];
  finalAmount: number;
  timestamp: number;
}

export interface RevenueModifier {
  type: 'efficiency' | 'market' | 'specialist' | 'disaster' | 'competition' | 'bonus';
  value: number; // Multiplier (e.g., 1.2 for +20%)
  description: string;
}

export interface ExpenseCategory {
  type: 'maintenance' | 'fuel' | 'port-fees' | 'crew' | 'insurance' | 'loan-payment' | 'upgrades';
  amount: number;
  description: string;
  assetId?: string;
  routeId?: string;
  timestamp: number;
}

export interface RevenueCycle {
  id: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  revenues: RevenueSource[];
  expenses: ExpenseCategory[];
  netIncome: number;
  summary: RevenueSummary;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueByType: Record<string, number>;
  expensesByCategory: Record<string, number>;
  topPerformingRoutes: RoutePerformance[];
  assetUtilization: number;
}

export interface RoutePerformance {
  routeId: string;
  routeName: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  trips: number;
}

export interface RevenueGenerationConfig {
  cycleIntervalMinutes: number; // How often to process revenue (game time)
  baseRevenueMultiplier: number;
  expenseMultiplier: number;
  marketVolatilityImpact: number;
  disasterImpactSeverity: number;
  competitionPressure: number;
}

export interface AssetOperatingCost {
  assetId: string;
  maintenancePerHour: number;
  fuelPerMile: number;
  crewCostPerHour: number;
  insurancePerDay: number;
  portFeesPerStop: number;
}

export interface RevenueEvent {
  id: string;
  type: 'revenue-generated' | 'expense-incurred' | 'cycle-completed' | 'bonus-earned';
  amount: number;
  description: string;
  metadata: {
    cycleId?: string;
    routeId?: string;
    assetId?: string;
    modifiers?: RevenueModifier[];
  };
  timestamp: number;
}

export interface FinancialReport {
  periodStart: number;
  periodEnd: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  revenueGrowth: number; // Percentage vs previous period
  expenseGrowth: number;
  topRevenueSources: RevenueSource[];
  majorExpenses: ExpenseCategory[];
  routePerformance: RoutePerformance[];
  recommendations: string[];
}