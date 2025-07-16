import { renderHook, act } from '@testing-library/react';
import { useEconomyStore } from '../useEconomyStore';
import type { RouteCalculation } from '@/lib/types/economy';

describe('useEconomyStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset the store
    useEconomyStore.setState({
      goods: new Map(),
      marketState: {
        condition: 'normal',
        volatilityFactor: 1.0,
        globalDemandModifier: 1.0,
        globalSupplyModifier: 1.0,
        lastUpdate: Date.now()
      },
      playerFinancials: {
        cash: 100000,
        netWorth: 100000,
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
      }
    });
  });

  describe('initializeEconomy', () => {
    it('should initialize goods with correct categories', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.initializeEconomy();
      });

      expect(result.current.goods.size).toBe(4);
      expect(result.current.goods.get('electronics')?.category).toBe('manufactured-goods');
      expect(result.current.goods.get('coffee')?.category).toBe('raw-materials');
      expect(result.current.goods.get('luxury-watches')?.category).toBe('luxury-goods');
      expect(result.current.goods.get('fresh-fruit')?.category).toBe('perishable-goods');
    });

    it('should calculate initial prices', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.initializeEconomy();
      });

      const electronics = result.current.goods.get('electronics');
      expect(electronics?.currentPrice).toBeDefined();
      expect(electronics?.currentPrice).toBeGreaterThan(0);
    });
  });

  describe('calculateRouteProfit', () => {
    it('should calculate base route profit correctly', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      const calculation: RouteCalculation = {
        distance: 1000,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1.5,
        assetLevel: 3,
        specialistBonus: 2,
        marketConditions: 'normal',
        maintenanceCostRate: 0.1
      };

      let routeProfit;
      act(() => {
        routeProfit = result.current.calculateRouteProfit(calculation);
      });

      // Base profit = 1000 * 2.5 * 1.5 = 3750
      expect(routeProfit!.baseProfit).toBe(3750);
      
      // Asset efficiency = 1 + (3 * 0.1) + (2 * 0.05) = 1.4
      expect(routeProfit!.assetEfficiencyModifier).toBe(1.4);
      
      // Total profit = 3750 * 1.4 * 1 * 0.9 = 4725
      expect(routeProfit!.totalProfit).toBe(4725);
    });

    it('should apply market condition modifiers', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      const boomCalculation: RouteCalculation = {
        distance: 1000,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1,
        assetLevel: 0,
        specialistBonus: 0,
        marketConditions: 'boom',
        maintenanceCostRate: 0
      };

      let boomProfit;
      act(() => {
        boomProfit = result.current.calculateRouteProfit(boomCalculation);
      });

      // Boom modifier = 1.3
      expect(boomProfit!.marketConditionModifier).toBe(1.3);
      expect(boomProfit!.totalProfit).toBe(2500 * 1 * 1.3);
    });

    it('should apply disaster penalties', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.applyDisasterPenalty(0.2);
      });

      const calculation: RouteCalculation = {
        distance: 1000,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1,
        assetLevel: 0,
        specialistBonus: 0,
        marketConditions: 'normal',
        maintenanceCostRate: 0
      };

      let routeProfit;
      act(() => {
        routeProfit = result.current.calculateRouteProfit(calculation);
      });

      // Disaster modifier = 1 - 0.2 = 0.8
      expect(routeProfit!.totalProfit).toBe(2500 * 1 * 1 * 0.8);
    });
  });

  describe('calculateCompoundingGrowth', () => {
    it('should calculate compound growth correctly', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      const growth = {
        currentProfit: 10000,
        baseRate: 0.05,
        laborBonuses: 0.02,
        aiBonus: 0.01,
        disasterPenalties: 0.01,
        loanInterestRates: 0.02,
        timeDays: 365
      };

      let nextProfit;
      act(() => {
        nextProfit = result.current.calculateCompoundingGrowth(growth);
      });

      // Rate = 0.05 + 0.02 + 0.01 - 0.01 - 0.02 = 0.05
      // Next profit = 10000 * (1 + 0.05/365)^365 ≈ 10512.67
      expect(nextProfit).toBeCloseTo(10512.67, 0);
    });
  });

  describe('updateMarketPrices', () => {
    it('should update prices based on supply and demand', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.initializeEconomy();
      });

      const electronics = result.current.goods.get('electronics');
      const initialPrice = electronics?.currentPrice || 0;

      // Increase demand
      act(() => {
        const updatedGoods = new Map(result.current.goods);
        const good = updatedGoods.get('electronics')!;
        good.totalDemand = 2000;
        good.totalSupply = 1000;
        useEconomyStore.setState({ goods: updatedGoods });
        result.current.updateMarketPrices();
      });

      const newElectronics = result.current.goods.get('electronics');
      expect(newElectronics?.currentPrice).toBeGreaterThan(initialPrice);
    });

    it('should apply market condition effects', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.initializeEconomy();
        result.current.updateMarketCondition('boom');
        result.current.updateMarketPrices();
      });

      const electronics = result.current.goods.get('electronics');
      expect(electronics?.currentPrice).toBeDefined();
      
      // Prices should be higher during boom
      act(() => {
        result.current.updateMarketCondition('crisis');
        result.current.updateMarketPrices();
      });

      const crisisElectronics = result.current.goods.get('electronics');
      expect(crisisElectronics?.currentPrice).toBeLessThan(electronics?.currentPrice || 0);
    });
  });

  describe('financial management', () => {
    it('should record transactions correctly', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.recordTransaction({
          type: 'income',
          category: 'route-profit',
          amount: 5000,
          description: 'Test route profit'
        });
      });

      expect(result.current.financialRecords).toHaveLength(1);
      expect(result.current.playerFinancials.cash).toBe(105000);
      expect(result.current.playerFinancials.totalRevenue).toBe(5000);

      act(() => {
        result.current.recordTransaction({
          type: 'expense',
          category: 'maintenance',
          amount: 1000,
          description: 'Ship maintenance'
        });
      });

      expect(result.current.financialRecords).toHaveLength(2);
      expect(result.current.playerFinancials.cash).toBe(104000);
      expect(result.current.playerFinancials.totalExpenses).toBe(1000);
      expect(result.current.playerFinancials.profitMargin).toBeCloseTo(0.8, 1);
    });

    it('should handle loan applications', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      let loanApproved;
      act(() => {
        loanApproved = result.current.applyForLoan(50000, 365);
      });

      expect(loanApproved).toBe(true);
      expect(result.current.playerFinancials.cash).toBe(150000);
      expect(result.current.playerFinancials.loans).toHaveLength(1);
      expect(result.current.playerFinancials.loans[0].principal).toBe(50000);
    });

    it('should reject loans with high debt ratio', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.applyForLoan(70000, 365);
      });

      let loanApproved;
      act(() => {
        loanApproved = result.current.applyForLoan(100000, 365);
      });

      expect(loanApproved).toBe(false);
    });

    it('should make loan payments', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.applyForLoan(50000, 365);
      });

      const loanId = result.current.playerFinancials.loans[0].id;
      
      let paymentSuccessful;
      act(() => {
        paymentSuccessful = result.current.makePayment(loanId, 5000);
      });

      expect(paymentSuccessful).toBe(true);
      expect(result.current.playerFinancials.loans[0].remainingBalance).toBe(45000);
    });

    it('should update credit rating', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      // Good credit behavior
      act(() => {
        result.current.applyForLoan(10000, 365);
        const loanId = result.current.playerFinancials.loans[0].id;
        
        // Pay off the loan
        result.current.makePayment(loanId, 10500);
        result.current.updateCreditRating();
      });

      expect(['AAA', 'AA', 'A']).toContain(result.current.playerFinancials.creditRating);
    });
  });

  describe('economy modifiers', () => {
    it('should apply specialist bonus', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.applySpecialistBonus(0.15);
      });

      expect(result.current.economyModifiers.specialistBonus).toBe(0.15);
    });

    it('should cap disaster penalty at 50%', () => {
      const { result } = renderHook(() => useEconomyStore());
      
      act(() => {
        result.current.applyDisasterPenalty(0.75);
      });

      expect(result.current.economyModifiers.disasterPenalty).toBe(0.5);
    });
  });
});