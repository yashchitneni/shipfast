import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  Good,
  GoodsCategory,
  MarketState,
  MarketCondition,
  PlayerFinancials,
  RouteProfit,
  FinancialRecord,
  Loan,
  CreditRating,
  EconomyModifiers,
  RouteCalculation,
  CompoundingGrowth,
  MonthlyFinancial,
  PricePoint
} from '@/app/lib/types/economy';

interface EconomyState {
  // Market state
  goods: Map<string, Good>;
  marketState: MarketState;
  
  // Player financials
  playerFinancials: PlayerFinancials;
  financialRecords: FinancialRecord[];
  
  // Economy modifiers
  economyModifiers: EconomyModifiers;
  
  // Actions
  initializeEconomy: () => void;
  updateMarketPrices: () => void;
  calculateRouteProfit: (calculation: RouteCalculation) => RouteProfit;
  calculateCompoundingGrowth: (growth: Omit<CompoundingGrowth, 'nextProfit'>) => number;
  recordTransaction: (record: Omit<FinancialRecord, 'id' | 'timestamp'>) => void;
  updateCreditRating: () => void;
  applyForLoan: (principal: number, termDays: number) => boolean;
  makePayment: (loanId: string, amount: number) => boolean;
  updateMonthlyFinancials: () => void;
  getGoodPrice: (goodId: string) => number;
  updateMarketCondition: (condition: MarketCondition) => void;
  applyDisasterPenalty: (penalty: number) => void;
  applySpecialistBonus: (bonus: number) => void;
  applyTimeEventEffects: (effects: { demandMultiplier?: number; priceMultiplier?: number; costMultiplier?: number }) => void;
  removeTimeEventEffects: () => void;
}

const INITIAL_CASH = 100000;
const BASE_RATE_PER_MILE = 2.5;
const VOLATILITY_RANGE = 0.4; // -20% to +20%

// Credit rating thresholds
const CREDIT_RATING_THRESHOLDS = {
  AAA: { maxDebtRatio: 0.1, minPaymentHistory: 1.0 },
  AA: { maxDebtRatio: 0.2, minPaymentHistory: 0.95 },
  A: { maxDebtRatio: 0.3, minPaymentHistory: 0.9 },
  BBB: { maxDebtRatio: 0.4, minPaymentHistory: 0.85 },
  BB: { maxDebtRatio: 0.5, minPaymentHistory: 0.8 },
  B: { maxDebtRatio: 0.6, minPaymentHistory: 0.75 },
  CCC: { maxDebtRatio: 0.7, minPaymentHistory: 0.7 },
  CC: { maxDebtRatio: 0.8, minPaymentHistory: 0.65 },
  C: { maxDebtRatio: 0.9, minPaymentHistory: 0.6 },
  D: { maxDebtRatio: 1.0, minPaymentHistory: 0.0 }
};

// Interest rates by credit rating
const INTEREST_RATES = {
  AAA: 0.03,
  AA: 0.035,
  A: 0.04,
  BBB: 0.05,
  BB: 0.065,
  B: 0.08,
  CCC: 0.10,
  CC: 0.125,
  C: 0.15,
  D: 0.20
};

export const useEconomyStore = create<EconomyState>()(
  devtools(
    persist(
      (set, get) => ({
        goods: new Map(),
        marketState: {
          condition: 'normal',
          volatilityFactor: 1.0,
          globalDemandModifier: 1.0,
          globalSupplyModifier: 1.0,
          lastUpdate: Date.now()
        },
        
        playerFinancials: {
          cash: INITIAL_CASH,
          netWorth: INITIAL_CASH,
          creditRating: 'BBB',
          totalRevenue: 0,
          totalExpenses: 0,
          profitMargin: 0,
          debtToAssetRatio: 0,
          loans: [],
          monthlyFinancials: []
        },
        
        financialRecords: [],
        
        economyModifiers: {
          assetEfficiency: 1.0,
          specialistBonus: 0,
          marketVolatility: 0,
          disasterPenalty: 0,
          competitionPressure: 0,
          governmentSubsidy: 0
        },
        
        initializeEconomy: () => {
          const initialGoods: Good[] = [
            {
              id: 'electronics',
              name: 'Electronics',
              category: 'manufactured-goods',
              baseCost: 120,
              totalDemand: 1500,
              totalSupply: 1200,
              volatilityModifier: 0.02,
              requiresRefrigeration: false,
              priceHistory: []
            },
            {
              id: 'coffee',
              name: 'Coffee',
              category: 'raw-materials',
              baseCost: 30,
              totalDemand: 2000,
              totalSupply: 2200,
              volatilityModifier: 0.015,
              requiresRefrigeration: false,
              priceHistory: []
            },
            {
              id: 'luxury-watches',
              name: 'Luxury Watches',
              category: 'luxury-goods',
              baseCost: 500,
              totalDemand: 300,
              totalSupply: 250,
              volatilityModifier: 0.05,
              requiresRefrigeration: false,
              priceHistory: []
            },
            {
              id: 'fresh-fruit',
              name: 'Fresh Fruit',
              category: 'perishable-goods',
              baseCost: 15,
              totalDemand: 3000,
              totalSupply: 2800,
              volatilityModifier: 0.03,
              requiresRefrigeration: true,
              priceHistory: []
            }
          ];
          
          const goodsMap = new Map(initialGoods.map(good => [good.id, good]));
          set({ goods: goodsMap });
          
          // Calculate initial prices
          get().updateMarketPrices();
        },
        
        updateMarketPrices: () => {
          const { goods, marketState, economyModifiers } = get();
          const updatedGoods = new Map(goods);
          
          updatedGoods.forEach((good, id) => {
            // Price Formula: Price = (BaseCost + ProductionCostModifier) * (Demand / Supply) * (1 + VolatilityModifier)
            const productionCostModifier = 0; // Could be expanded based on raw material prices
            const demandSupplyRatio = good.totalDemand / good.totalSupply;
            
            // Apply volatility (-20% to +20%)
            const volatility = (Math.random() - 0.5) * VOLATILITY_RANGE * good.volatilityModifier;
            
            // Apply market condition modifier
            let marketModifier = 1;
            switch (marketState.condition) {
              case 'boom':
                marketModifier = 1.2;
                break;
              case 'recession':
                marketModifier = 0.8;
                break;
              case 'crisis':
                marketModifier = 0.6;
                break;
            }
            
            const price = (good.baseCost + productionCostModifier) * 
                         demandSupplyRatio * 
                         (1 + volatility + economyModifiers.marketVolatility) * 
                         marketModifier;
            
            good.currentPrice = Math.max(1, price); // Ensure price never goes below 1
            
            // Update price history
            good.priceHistory.push({
              timestamp: Date.now(),
              price: good.currentPrice,
              volume: 0
            });
            
            // Keep only last 100 price points
            if (good.priceHistory.length > 100) {
              good.priceHistory = good.priceHistory.slice(-100);
            }
          });
          
          set({ 
            goods: updatedGoods,
            marketState: { ...marketState, lastUpdate: Date.now() }
          });
        },
        
        calculateRouteProfit: (calculation: RouteCalculation): RouteProfit => {
          const { economyModifiers } = get();
          
          // Base Route Profit = (Distance × Base Rate per Mile) × Cargo Value Multiplier
          const baseProfit = calculation.distance * calculation.baseRatePerMile * calculation.cargoValueMultiplier;
          
          // Asset Efficiency Modifier = 1 + (Asset Level × 0.1) + (Specialist Bonus × 0.05)
          const assetEfficiencyModifier = 1 + (calculation.assetLevel * 0.1) + 
                                         (calculation.specialistBonus * 0.05) + 
                                         economyModifiers.specialistBonus;
          
          // Market condition modifier
          let marketConditionModifier = 1;
          switch (calculation.marketConditions) {
            case 'boom':
              marketConditionModifier = 1.3;
              break;
            case 'recession':
              marketConditionModifier = 0.7;
              break;
            case 'crisis':
              marketConditionModifier = 0.5;
              break;
          }
          
          // Apply disaster penalty
          const disasterModifier = 1 - economyModifiers.disasterPenalty;
          
          // Total Profit = Base Profit × Efficiency × Market Conditions × (1 - Maintenance Cost Rate)
          const totalProfit = baseProfit * 
                            assetEfficiencyModifier * 
                            marketConditionModifier * 
                            disasterModifier *
                            (1 - calculation.maintenanceCostRate);
          
          const routeProfit: RouteProfit = {
            routeId: `route-${Date.now()}`,
            baseProfit,
            assetEfficiencyModifier,
            marketConditionModifier: marketConditionModifier * disasterModifier,
            maintenanceCostModifier: 1 - calculation.maintenanceCostRate,
            totalProfit,
            timestamp: Date.now()
          };
          
          // Record the income
          get().recordTransaction({
            type: 'income',
            category: 'route-profit',
            amount: totalProfit,
            description: `Route profit calculation`,
            routeId: routeProfit.routeId
          });
          
          return routeProfit;
        },
        
        calculateCompoundingGrowth: (growth: Omit<CompoundingGrowth, 'nextProfit'>): number => {
          // Formula: NextProfit = CurrentProfit * (1 + (Rate / 365))^Time
          // Rate = BaseRate + Sum(LaborBonuses) + AIBonus - Sum(DisasterPenalties) - Sum(LoanInterestRates)
          const rate = growth.baseRate + 
                      growth.laborBonuses + 
                      growth.aiBonus - 
                      growth.disasterPenalties - 
                      growth.loanInterestRates;
          
          const dailyRate = rate / 365;
          const nextProfit = growth.currentProfit * Math.pow(1 + dailyRate, growth.timeDays);
          
          return nextProfit;
        },
        
        recordTransaction: (record: Omit<FinancialRecord, 'id' | 'timestamp'>) => {
          const transaction: FinancialRecord = {
            ...record,
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
          };
          
          set(state => {
            const newRecords = [...state.financialRecords, transaction];
            const playerFinancials = { ...state.playerFinancials };
            
            if (record.type === 'income') {
              playerFinancials.cash += record.amount;
              playerFinancials.totalRevenue += record.amount;
            } else {
              playerFinancials.cash -= record.amount;
              playerFinancials.totalExpenses += record.amount;
            }
            
            // Update profit margin
            if (playerFinancials.totalRevenue > 0) {
              playerFinancials.profitMargin = 
                (playerFinancials.totalRevenue - playerFinancials.totalExpenses) / 
                playerFinancials.totalRevenue;
            }
            
            return {
              financialRecords: newRecords,
              playerFinancials
            };
          });
        },
        
        updateCreditRating: () => {
          const { playerFinancials } = get();
          const { debtToAssetRatio, loans } = playerFinancials;
          
          // Calculate payment history score
          const totalPayments = loans.filter(l => l.status !== 'active').length;
          const successfulPayments = loans.filter(l => l.status === 'paid').length;
          const paymentHistoryScore = totalPayments > 0 ? successfulPayments / totalPayments : 1;
          
          // Determine credit rating based on debt ratio and payment history
          let newRating: CreditRating = 'D';
          
          for (const [rating, thresholds] of Object.entries(CREDIT_RATING_THRESHOLDS)) {
            if (debtToAssetRatio <= thresholds.maxDebtRatio && 
                paymentHistoryScore >= thresholds.minPaymentHistory) {
              newRating = rating as CreditRating;
              break;
            }
          }
          
          set(state => ({
            playerFinancials: {
              ...state.playerFinancials,
              creditRating: newRating
            }
          }));
        },
        
        applyForLoan: (principal: number, termDays: number): boolean => {
          const { playerFinancials } = get();
          const interestRate = INTEREST_RATES[playerFinancials.creditRating];
          
          // Check if player qualifies for the loan
          const totalDebt = playerFinancials.loans
            .filter(l => l.status === 'active')
            .reduce((sum, loan) => sum + loan.remainingBalance, 0);
          
          const newTotalDebt = totalDebt + principal;
          const newDebtRatio = newTotalDebt / playerFinancials.netWorth;
          
          // Reject if debt ratio would be too high
          if (newDebtRatio > 0.8) {
            return false;
          }
          
          const loan: Loan = {
            id: `loan-${Date.now()}`,
            principal,
            interestRate,
            termDays,
            startDate: Date.now(),
            remainingBalance: principal,
            monthlyPayment: (principal * (1 + interestRate)) / (termDays / 30),
            status: 'active'
          };
          
          set(state => ({
            playerFinancials: {
              ...state.playerFinancials,
              cash: state.playerFinancials.cash + principal,
              loans: [...state.playerFinancials.loans, loan]
            }
          }));
          
          // Record the loan as income
          get().recordTransaction({
            type: 'income',
            category: 'loan',
            amount: principal,
            description: `Loan approved: ${principal} at ${(interestRate * 100).toFixed(1)}% interest`
          });
          
          return true;
        },
        
        makePayment: (loanId: string, amount: number): boolean => {
          const { playerFinancials } = get();
          
          if (playerFinancials.cash < amount) {
            return false;
          }
          
          const loanIndex = playerFinancials.loans.findIndex(l => l.id === loanId);
          if (loanIndex === -1) {
            return false;
          }
          
          const loan = { ...playerFinancials.loans[loanIndex] };
          loan.remainingBalance -= amount;
          
          if (loan.remainingBalance <= 0) {
            loan.status = 'paid';
            loan.remainingBalance = 0;
          }
          
          const updatedLoans = [...playerFinancials.loans];
          updatedLoans[loanIndex] = loan;
          
          set(state => ({
            playerFinancials: {
              ...state.playerFinancials,
              loans: updatedLoans
            }
          }));
          
          // Record the payment
          get().recordTransaction({
            type: 'expense',
            category: 'loan-payment',
            amount,
            description: `Loan payment for ${loanId}`
          });
          
          // Update credit rating after payment
          get().updateCreditRating();
          
          return true;
        },
        
        updateMonthlyFinancials: () => {
          const { financialRecords, playerFinancials } = get();
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          // Calculate monthly totals from financial records
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
          
          const monthRecords = financialRecords.filter(
            r => r.timestamp >= monthStart && r.timestamp <= monthEnd
          );
          
          const revenue = monthRecords
            .filter(r => r.type === 'income')
            .reduce((sum, r) => sum + r.amount, 0);
          
          const expenses = monthRecords
            .filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0);
          
          const maintenanceCosts = monthRecords
            .filter(r => r.type === 'expense' && r.category === 'maintenance')
            .reduce((sum, r) => sum + r.amount, 0);
          
          const loanPayments = monthRecords
            .filter(r => r.type === 'expense' && r.category === 'loan-payment')
            .reduce((sum, r) => sum + r.amount, 0);
          
          const operatingCosts = expenses - maintenanceCosts - loanPayments;
          
          const monthlyFinancial: MonthlyFinancial = {
            month: currentMonth,
            revenue,
            expenses,
            profit: revenue - expenses,
            maintenanceCosts,
            loanPayments,
            operatingCosts
          };
          
          // Update or add monthly financial record
          const monthlyFinancials = [...playerFinancials.monthlyFinancials];
          const existingIndex = monthlyFinancials.findIndex(m => m.month === currentMonth);
          
          if (existingIndex >= 0) {
            monthlyFinancials[existingIndex] = monthlyFinancial;
          } else {
            monthlyFinancials.push(monthlyFinancial);
          }
          
          // Keep only last 12 months
          if (monthlyFinancials.length > 12) {
            monthlyFinancials.shift();
          }
          
          set(state => ({
            playerFinancials: {
              ...state.playerFinancials,
              monthlyFinancials
            }
          }));
        },
        
        getGoodPrice: (goodId: string): number => {
          const { goods } = get();
          const good = goods.get(goodId);
          return good?.currentPrice || 0;
        },
        
        updateMarketCondition: (condition: MarketCondition) => {
          set(state => ({
            marketState: {
              ...state.marketState,
              condition
            }
          }));
        },
        
        applyDisasterPenalty: (penalty: number) => {
          set(state => ({
            economyModifiers: {
              ...state.economyModifiers,
              disasterPenalty: Math.min(0.5, penalty) // Cap at 50% penalty
            }
          }));
        },
        
        applySpecialistBonus: (bonus: number) => {
          set(state => ({
            economyModifiers: {
              ...state.economyModifiers,
              specialistBonus: bonus
            }
          }));
        },
        
        applyTimeEventEffects: (effects: { demandMultiplier?: number; priceMultiplier?: number; costMultiplier?: number }) => {
          set(state => {
            const updatedGoods = new Map(state.goods);
            
            // Apply demand and price multipliers to all goods
            updatedGoods.forEach((good) => {
              if (effects.demandMultiplier) {
                good.totalDemand = good.totalDemand * effects.demandMultiplier;
              }
              if (effects.priceMultiplier && good.currentPrice) {
                good.currentPrice = good.currentPrice * effects.priceMultiplier;
              }
            });
            
            // Apply cost multiplier to economy modifiers
            const newModifiers = { ...state.economyModifiers };
            if (effects.costMultiplier) {
              newModifiers.marketVolatility = (effects.costMultiplier - 1) * 0.5; // Convert to volatility factor
            }
            
            return {
              goods: updatedGoods,
              economyModifiers: newModifiers
            };
          });
          
          // Trigger price update to reflect changes
          get().updateMarketPrices();
        },
        
        removeTimeEventEffects: () => {
          // Reset market volatility from time events
          set(state => ({
            economyModifiers: {
              ...state.economyModifiers,
              marketVolatility: 0
            }
          }));
          
          // Recalculate prices without event effects
          get().updateMarketPrices();
        }
      }),
      {
        name: 'economy-store',
        version: 1,
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const { state } = JSON.parse(str);
            return {
              state: {
                ...state,
                goods: new Map(state.goods || [])
              }
            };
          },
          setItem: (name, value) => {
            const { state } = value as any;
            const serialized = {
              state: {
                ...state,
                goods: Array.from(state.goods.entries())
              }
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          },
          removeItem: (name) => localStorage.removeItem(name)
        }
      }
    )
  )
);