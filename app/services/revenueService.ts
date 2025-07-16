import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  RevenueSource,
  RevenueModifier,
  ExpenseCategory,
  RevenueCycle,
  RevenueSummary,
  RoutePerformance,
  RevenueGenerationConfig,
  AssetOperatingCost,
  RevenueEvent,
  FinancialReport
} from '@/lib/types/revenue';
import type { Route, RouteProfit, FinancialRecord } from '@/lib/types/economy';
import type { PlacedAsset, AssetDefinition } from '@/lib/types/assets';
import { useEconomyStore } from '@/store/useEconomyStore';
import { useRouteStore } from '@/store/useRouteStore';
import { useEmpireStore } from '../../src/store/empireStore';

interface RevenueServiceState {
  // Configuration
  config: RevenueGenerationConfig;
  
  // Current cycle
  currentCycle: RevenueCycle | null;
  cycleHistory: RevenueCycle[];
  
  // Asset costs
  assetOperatingCosts: Map<string, AssetOperatingCost>;
  
  // Events
  revenueEvents: RevenueEvent[];
  
  // Processing state
  isProcessing: boolean;
  lastProcessedTime: number;
  nextCycleTime: number;
  
  // Actions
  initializeService: () => void;
  startRevenueCycle: () => Promise<void>;
  processRouteRevenue: (route: Route, assets: PlacedAsset[]) => RevenueSource[];
  calculateExpenses: (assets: PlacedAsset[], routes: Route[]) => ExpenseCategory[];
  completeRevenueCycle: () => Promise<void>;
  generateFinancialReport: (periodDays: number) => FinancialReport;
  updateConfig: (config: Partial<RevenueGenerationConfig>) => void;
  setAssetOperatingCost: (assetId: string, costs: AssetOperatingCost) => void;
  addRevenueEvent: (event: Omit<RevenueEvent, 'id' | 'timestamp'>) => void;
}

// Default configuration
const DEFAULT_CONFIG: RevenueGenerationConfig = {
  cycleIntervalMinutes: 60, // Process revenue every hour (game time)
  baseRevenueMultiplier: 1.0,
  expenseMultiplier: 1.0,
  marketVolatilityImpact: 0.2,
  disasterImpactSeverity: 0.3,
  competitionPressure: 0.1
};

export const useRevenueService = create<RevenueServiceState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      config: DEFAULT_CONFIG,
      currentCycle: null,
      cycleHistory: [],
      assetOperatingCosts: new Map(),
      revenueEvents: [],
      isProcessing: false,
      lastProcessedTime: Date.now(),
      nextCycleTime: Date.now() + DEFAULT_CONFIG.cycleIntervalMinutes * 60 * 1000,
      
      initializeService: () => {
        const empireStore = useEmpireStore.getState();
        const assetDefinitions = Array.from(empireStore.assetDefinitions.values());
        
        // Initialize operating costs for each asset type
        const costs = new Map<string, AssetOperatingCost>();
        assetDefinitions.forEach(def => {
          if (def.category === 'transport') {
            costs.set(def.id, {
              assetId: def.id,
              maintenancePerHour: def.maintenanceCost / 24, // Daily to hourly
              fuelPerMile: def.stats?.fuelEfficiency ? 1 / def.stats.fuelEfficiency : 0.1,
              crewCostPerHour: def.stats?.crewRequired ? def.stats.crewRequired * 50 : 100,
              insurancePerDay: def.cost * 0.001, // 0.1% of asset value per day
              portFeesPerStop: 500 // Base port fee
            });
          }
        });
        
        set({ assetOperatingCosts: costs });
      },
      
      startRevenueCycle: async () => {
        const state = get();
        if (state.isProcessing) return;
        
        set({ isProcessing: true });
        
        const empireStore = useEmpireStore.getState();
        const routeStore = useRouteStore.getState();
        const economyStore = useEconomyStore.getState();
        
        // Create new cycle
        const cycleId = `cycle-${Date.now()}`;
        const cycle: RevenueCycle = {
          id: cycleId,
          startTime: state.lastProcessedTime,
          endTime: Date.now(),
          status: 'processing',
          revenues: [],
          expenses: [],
          netIncome: 0,
          summary: {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            revenueByType: {},
            expensesByCategory: {},
            topPerformingRoutes: [],
            assetUtilization: 0
          }
        };
        
        set({ currentCycle: cycle });
        
        // Get active routes and their assigned assets
        const activeRoutes = routeStore.getActiveRoutes();
        const placedAssets = Array.from(empireStore.placedAssets.values());
        
        // Process revenue for each active route
        let totalRevenues: RevenueSource[] = [];
        const routePerformance: RoutePerformance[] = [];
        
        for (const route of activeRoutes) {
          const routeAssets = placedAssets.filter(asset => 
            route.assignedAssets.includes(asset.id)
          );
          
          if (routeAssets.length > 0) {
            const routeRevenues = state.processRouteRevenue(route, routeAssets);
            totalRevenues = [...totalRevenues, ...routeRevenues];
            
            // Calculate route performance
            const routeRevenue = routeRevenues.reduce((sum, r) => sum + r.finalAmount, 0);
            const routeExpenses = routeAssets.reduce((sum, asset) => {
              const opCost = state.assetOperatingCosts.get(asset.definitionId);
              if (!opCost) return sum;
              
              // Estimate expenses based on route
              const hourlyExpense = opCost.maintenancePerHour + opCost.crewCostPerHour;
              const mileageExpense = route.totalDistance * opCost.fuelPerMile;
              const portExpense = route.segments.length * opCost.portFeesPerStop;
              
              return sum + (hourlyExpense * route.estimatedTime) + mileageExpense + portExpense;
            }, 0);
            
            routePerformance.push({
              routeId: route.id,
              routeName: route.name,
              revenue: routeRevenue,
              expenses: routeExpenses,
              profit: routeRevenue - routeExpenses,
              profitMargin: routeRevenue > 0 ? (routeRevenue - routeExpenses) / routeRevenue : 0,
              trips: Math.floor((cycle.endTime - cycle.startTime) / (route.estimatedTime * 3600000))
            });
          }
        }
        
        // Calculate all expenses
        const expenses = state.calculateExpenses(placedAssets, activeRoutes);
        
        // Update cycle with results
        const totalRevenueAmount = totalRevenues.reduce((sum, r) => sum + r.finalAmount, 0);
        const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        const updatedCycle: RevenueCycle = {
          ...cycle,
          revenues: totalRevenues,
          expenses,
          netIncome: totalRevenueAmount - totalExpenseAmount,
          summary: {
            totalRevenue: totalRevenueAmount,
            totalExpenses: totalExpenseAmount,
            netProfit: totalRevenueAmount - totalExpenseAmount,
            revenueByType: totalRevenues.reduce((acc, r) => {
              acc[r.type] = (acc[r.type] || 0) + r.finalAmount;
              return acc;
            }, {} as Record<string, number>),
            expensesByCategory: expenses.reduce((acc, e) => {
              acc[e.type] = (acc[e.type] || 0) + e.amount;
              return acc;
            }, {} as Record<string, number>),
            topPerformingRoutes: routePerformance
              .sort((a, b) => b.profit - a.profit)
              .slice(0, 5),
            assetUtilization: placedAssets.filter(a => a.status === 'transit').length / 
                            placedAssets.filter(a => {
                              const def = empireStore.assetDefinitions.get(a.definitionId);
                              return def?.category === 'transport';
                            }).length
          }
        };
        
        set({ currentCycle: updatedCycle });
        
        // Record transactions in economy store
        if (totalRevenueAmount > 0) {
          economyStore.recordTransaction({
            type: 'income',
            category: 'revenue-cycle',
            amount: totalRevenueAmount,
            description: `Revenue cycle ${cycleId} - Total revenue from ${activeRoutes.length} routes`
          });
          
          // Add revenue event
          state.addRevenueEvent({
            type: 'revenue-generated',
            amount: totalRevenueAmount,
            description: `Generated revenue from ${totalRevenues.length} sources`,
            metadata: { cycleId }
          });
        }
        
        if (totalExpenseAmount > 0) {
          economyStore.recordTransaction({
            type: 'expense',
            category: 'operating-costs',
            amount: totalExpenseAmount,
            description: `Revenue cycle ${cycleId} - Operating expenses`
          });
          
          // Add expense event
          state.addRevenueEvent({
            type: 'expense-incurred',
            amount: totalExpenseAmount,
            description: `Incurred ${expenses.length} expense categories`,
            metadata: { cycleId }
          });
        }
        
        // Complete the cycle
        await state.completeRevenueCycle();
      },
      
      processRouteRevenue: (route: Route, assets: PlacedAsset[]): RevenueSource[] => {
        const state = get();
        const economyStore = useEconomyStore.getState();
        const empireStore = useEmpireStore.getState();
        
        const revenues: RevenueSource[] = [];
        const cycleTime = Date.now() - state.lastProcessedTime;
        const cycleHours = cycleTime / (1000 * 60 * 60);
        
        // Calculate how many trips could be completed in this cycle
        const tripsCompleted = Math.floor(cycleHours / route.estimatedTime);
        
        if (tripsCompleted > 0) {
          assets.forEach(asset => {
            const assetDef = empireStore.assetDefinitions.get(asset.definitionId);
            if (!assetDef || assetDef.category !== 'transport') return;
            
            // Base revenue calculation
            const capacity = assetDef.stats?.capacity || 1000;
            const speed = assetDef.stats?.speed || 20;
            const baseRevenue = route.profitability.revenue * tripsCompleted;
            
            // Calculate modifiers
            const modifiers: RevenueModifier[] = [];
            
            // Asset efficiency modifier
            const efficiencyModifier = 1 + (assetDef.level * 0.1);
            modifiers.push({
              type: 'efficiency',
              value: efficiencyModifier,
              description: `Level ${assetDef.level} asset efficiency`
            });
            
            // Market condition modifier
            const marketModifier = economyStore.marketState.condition === 'boom' ? 1.3 :
                                 economyStore.marketState.condition === 'recession' ? 0.7 :
                                 economyStore.marketState.condition === 'crisis' ? 0.5 : 1.0;
            modifiers.push({
              type: 'market',
              value: marketModifier,
              description: `Market ${economyStore.marketState.condition}`
            });
            
            // Competition pressure
            const competitionModifier = 1 - state.config.competitionPressure;
            modifiers.push({
              type: 'competition',
              value: competitionModifier,
              description: 'Competition pressure'
            });
            
            // Calculate final amount
            const finalAmount = modifiers.reduce((amount, mod) => amount * mod.value, baseRevenue);
            
            revenues.push({
              id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'route',
              routeId: route.id,
              assetId: asset.id,
              description: `Route ${route.name} - ${tripsCompleted} trips completed`,
              baseAmount: baseRevenue,
              modifiers,
              finalAmount,
              timestamp: Date.now()
            });
          });
        }
        
        return revenues;
      },
      
      calculateExpenses: (assets: PlacedAsset[], routes: Route[]): ExpenseCategory[] => {
        const state = get();
        const empireStore = useEmpireStore.getState();
        const expenses: ExpenseCategory[] = [];
        
        const cycleTime = Date.now() - state.lastProcessedTime;
        const cycleHours = cycleTime / (1000 * 60 * 60);
        const cycleDays = cycleHours / 24;
        
        // Calculate expenses for each asset
        assets.forEach(asset => {
          const assetDef = empireStore.assetDefinitions.get(asset.definitionId);
          if (!assetDef) return;
          
          const opCost = state.assetOperatingCosts.get(asset.definitionId);
          if (!opCost) return;
          
          // Maintenance costs (always incurred)
          expenses.push({
            type: 'maintenance',
            amount: opCost.maintenancePerHour * cycleHours * state.config.expenseMultiplier,
            description: `Maintenance for ${assetDef.name}`,
            assetId: asset.id,
            timestamp: Date.now()
          });
          
          // Insurance costs
          expenses.push({
            type: 'insurance',
            amount: opCost.insurancePerDay * cycleDays,
            description: `Insurance for ${assetDef.name}`,
            assetId: asset.id,
            timestamp: Date.now()
          });
          
          // If asset is assigned to a route, calculate operational expenses
          if (asset.routeId && asset.status === 'transit') {
            const route = routes.find(r => r.id === asset.routeId);
            if (route) {
              const tripsCompleted = Math.floor(cycleHours / route.estimatedTime);
              
              if (tripsCompleted > 0) {
                // Fuel costs
                expenses.push({
                  type: 'fuel',
                  amount: route.totalDistance * opCost.fuelPerMile * tripsCompleted,
                  description: `Fuel for ${tripsCompleted} trips on ${route.name}`,
                  assetId: asset.id,
                  routeId: route.id,
                  timestamp: Date.now()
                });
                
                // Crew costs
                expenses.push({
                  type: 'crew',
                  amount: opCost.crewCostPerHour * route.estimatedTime * tripsCompleted,
                  description: `Crew wages for ${assetDef.name}`,
                  assetId: asset.id,
                  routeId: route.id,
                  timestamp: Date.now()
                });
                
                // Port fees
                expenses.push({
                  type: 'port-fees',
                  amount: opCost.portFeesPerStop * route.segments.length * tripsCompleted,
                  description: `Port fees for ${route.segments.length} stops`,
                  assetId: asset.id,
                  routeId: route.id,
                  timestamp: Date.now()
                });
              }
            }
          }
        });
        
        return expenses;
      },
      
      completeRevenueCycle: async () => {
        const state = get();
        const cycle = state.currentCycle;
        if (!cycle) return;
        
        // Mark cycle as completed
        const completedCycle: RevenueCycle = {
          ...cycle,
          status: 'completed'
        };
        
        // Add to history
        const history = [...state.cycleHistory, completedCycle];
        
        // Keep only last 100 cycles
        if (history.length > 100) {
          history.shift();
        }
        
        // Calculate next cycle time
        const nextTime = Date.now() + (state.config.cycleIntervalMinutes * 60 * 1000);
        
        set({
          currentCycle: null,
          cycleHistory: history,
          isProcessing: false,
          lastProcessedTime: Date.now(),
          nextCycleTime: nextTime
        });
        
        // Add completion event
        state.addRevenueEvent({
          type: 'cycle-completed',
          amount: cycle.netIncome,
          description: `Revenue cycle completed with net income: $${cycle.netIncome.toLocaleString()}`,
          metadata: { cycleId: cycle.id }
        });
        
        // Update monthly financials in economy store
        useEconomyStore.getState().updateMonthlyFinancials();
      },
      
      generateFinancialReport: (periodDays: number): FinancialReport => {
        const state = get();
        const periodMs = periodDays * 24 * 60 * 60 * 1000;
        const periodStart = Date.now() - periodMs;
        
        // Filter cycles within the period
        const periodCycles = state.cycleHistory.filter(
          cycle => cycle.endTime >= periodStart
        );
        
        // Aggregate data
        let totalRevenue = 0;
        let totalExpenses = 0;
        const revenuesBySource: RevenueSource[] = [];
        const expensesByCategory: ExpenseCategory[] = [];
        const routeStats = new Map<string, RoutePerformance>();
        
        periodCycles.forEach(cycle => {
          totalRevenue += cycle.summary.totalRevenue;
          totalExpenses += cycle.summary.totalExpenses;
          
          // Collect top revenue sources
          cycle.revenues.forEach(rev => {
            if (rev.finalAmount > 1000) { // Only significant revenues
              revenuesBySource.push(rev);
            }
          });
          
          // Aggregate route performance
          cycle.summary.topPerformingRoutes.forEach(perf => {
            const existing = routeStats.get(perf.routeId);
            if (existing) {
              existing.revenue += perf.revenue;
              existing.expenses += perf.expenses;
              existing.profit += perf.profit;
              existing.trips += perf.trips;
            } else {
              routeStats.set(perf.routeId, { ...perf });
            }
          });
        });
        
        // Calculate growth (compare to previous period)
        const prevPeriodStart = periodStart - periodMs;
        const prevPeriodCycles = state.cycleHistory.filter(
          cycle => cycle.endTime >= prevPeriodStart && cycle.endTime < periodStart
        );
        
        const prevRevenue = prevPeriodCycles.reduce((sum, c) => sum + c.summary.totalRevenue, 0);
        const prevExpenses = prevPeriodCycles.reduce((sum, c) => sum + c.summary.totalExpenses, 0);
        
        const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const expenseGrowth = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;
        
        // Generate recommendations
        const recommendations: string[] = [];
        const profitMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0;
        
        if (profitMargin < 0.1) {
          recommendations.push('Profit margins are low. Consider optimizing routes or reducing expenses.');
        }
        if (expenseGrowth > revenueGrowth) {
          recommendations.push('Expenses growing faster than revenue. Review operating costs.');
        }
        
        const topRoutes = Array.from(routeStats.values())
          .sort((a, b) => b.profit - a.profit);
        
        if (topRoutes.length > 0 && topRoutes[0].profitMargin > 0.3) {
          recommendations.push(`Route "${topRoutes[0].routeName}" is highly profitable. Consider expanding similar routes.`);
        }
        
        return {
          periodStart,
          periodEnd: Date.now(),
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          profitMargin,
          cashFlow: totalRevenue - totalExpenses,
          revenueGrowth,
          expenseGrowth,
          topRevenueSources: revenuesBySource
            .sort((a, b) => b.finalAmount - a.finalAmount)
            .slice(0, 10),
          majorExpenses: expensesByCategory
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10),
          routePerformance: topRoutes.slice(0, 10),
          recommendations
        };
      },
      
      updateConfig: (config: Partial<RevenueGenerationConfig>) => set(state => ({
        config: { ...state.config, ...config }
      })),
      
      setAssetOperatingCost: (assetId: string, costs: AssetOperatingCost) => set(state => {
        const newCosts = new Map(state.assetOperatingCosts);
        newCosts.set(assetId, costs);
        return { assetOperatingCosts: newCosts };
      }),
      
      addRevenueEvent: (eventData: Omit<RevenueEvent, 'id' | 'timestamp'>) => set(state => {
        const event: RevenueEvent = {
          ...eventData,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        
        const events = [event, ...state.revenueEvents];
        
        // Keep only last 500 events
        if (events.length > 500) {
          events.pop();
        }
        
        return { revenueEvents: events };
      })
    }))
  )
);