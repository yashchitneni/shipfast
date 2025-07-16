import { useRouteStore } from '@/store/useRouteStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { useMarketStore } from '@/store/useMarketStore';
import { useAIStore } from '@/store/useAIStore';
import { useEmpireStore } from '../../../src/store/empireStore';
import type { Route, RouteEvent } from '@/types/route';
import type { PerformanceMetrics } from '@/types/ai-companion';
import type { Transaction } from '@/types/market';

/**
 * Central integration module for Phase 2 systems
 * Coordinates communication between Route, Economy, Market, and AI systems
 */
export class SystemIntegration {
  private static instance: SystemIntegration;
  private initialized = false;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SystemIntegration {
    if (!SystemIntegration.instance) {
      SystemIntegration.instance = new SystemIntegration();
    }
    return SystemIntegration.instance;
  }

  /**
   * Initialize all Phase 2 systems
   */
  async initialize(playerId: string) {
    if (this.initialized) return;

    console.log('🚀 Initializing Phase 2 Systems Integration...');

    try {
      // Initialize stores
      const routeStore = useRouteStore.getState();
      const economyStore = useEconomyStore.getState();
      const marketStore = useMarketStore.getState();
      const aiStore = useAIStore.getState();
      const empireStore = useEmpireStore.getState();

      // Initialize economy system
      economyStore.initializeEconomy();
      console.log('💰 Economy system initialized');

      // Initialize market system
      await marketStore.initializeMarket();
      console.log('📊 Market system initialized');

      // Load player routes
      await routeStore.loadPlayerRoutes(playerId);
      console.log('🚢 Route system initialized');

      // Initialize AI companion
      await aiStore.loadAIState(playerId);
      console.log('🤖 AI companion initialized');

      // Set up system connections
      this.setupRouteEconomyConnection();
      this.setupMarketEconomyConnection();
      this.setupAILearningConnection();
      this.setupRevenueGeneration();

      // Start periodic updates
      this.startPeriodicUpdates();

      this.initialized = true;
      console.log('✅ All Phase 2 systems integrated successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Phase 2 systems:', error);
      throw error;
    }
  }

  /**
   * Connect route system to economy for revenue generation
   */
  private setupRouteEconomyConnection() {
    const routeStore = useRouteStore.getState();
    const economyStore = useEconomyStore.getState();

    // Subscribe to route completion events
    useRouteStore.subscribe(
      (state) => state.routeEvents,
      (events) => {
        const latestEvent = events[0];
        if (latestEvent?.type === 'route_completed') {
          // Calculate and record route profit
          const route = routeStore.routes.get(latestEvent.routeId);
          if (route) {
            const profit = economyStore.calculateRouteProfit({
              distance: route.totalDistance,
              baseRatePerMile: 2.5,
              cargoValueMultiplier: 1.2,
              assetLevel: 1,
              specialistBonus: 0,
              marketConditions: economyStore.marketState.condition,
              maintenanceCostRate: 0.1
            });

            // Update player financials
            economyStore.recordTransaction({
              type: 'income',
              category: 'route-profit',
              amount: profit.totalProfit,
              description: `Route ${route.name} completed`,
              routeId: route.id
            });

            // Update AI learning
            this.updateAIFromRouteCompletion(route, profit.totalProfit);
          }
        }
      }
    );
  }

  /**
   * Connect market prices to economy calculations
   */
  private setupMarketEconomyConnection() {
    const marketStore = useMarketStore.getState();
    const economyStore = useEconomyStore.getState();

    // Subscribe to market transactions
    useMarketStore.subscribe(
      (state) => state.transactions,
      (transactions) => {
        const latestTx = transactions[transactions.length - 1];
        if (latestTx) {
          // Record transaction in economy
          economyStore.recordTransaction({
            type: latestTx.type === 'buy' ? 'expense' : 'income',
            category: 'market-trade',
            amount: latestTx.totalPrice,
            description: `${latestTx.type} ${latestTx.quantity} ${latestTx.itemId}`,
            marketTransactionId: latestTx.id
          });

          // Update AI market insights
          const aiStore = useAIStore.getState();
          const item = marketStore.items.get(latestTx.itemId);
          if (item) {
            aiStore.updateMarketInsights(
              'port-1', // TODO: Get actual port from transaction
              item.id,
              item.currentPrice,
              latestTx.quantity
            );
          }
        }
      }
    );

    // Update economy market condition based on market volatility
    useMarketStore.subscribe(
      (state) => state.marketDynamics,
      (dynamics) => {
        if (dynamics.demandVolatility > 0.3) {
          economyStore.updateMarketCondition('crisis');
        } else if (dynamics.demandVolatility > 0.2) {
          economyStore.updateMarketCondition('recession');
        } else if (dynamics.demandVolatility < 0.1) {
          economyStore.updateMarketCondition('boom');
        } else {
          economyStore.updateMarketCondition('normal');
        }
      }
    );
  }

  /**
   * Connect AI companion to learn from player actions
   */
  private setupAILearningConnection() {
    const aiStore = useAIStore.getState();
    const routeStore = useRouteStore.getState();
    const marketStore = useMarketStore.getState();

    // Learn from route state changes
    useRouteStore.subscribe(
      (state) => state.routeStates,
      (routeStates) => {
        // AI observes route performance
        routeStates.forEach((state, routeId) => {
          if (state.status === 'completed') {
            const route = routeStore.routes.get(routeId);
            if (route) {
              const metrics: PerformanceMetrics = {
                routeId,
                profit: route.profitability.netProfit,
                timeEfficiency: route.estimatedTime / (route.performance.averageTime || route.estimatedTime),
                incidents: [],
                cargo: [],
                success: true
              };
              aiStore.learnFromRoute(metrics);
            }
          }
        });
      }
    );

    // Generate AI suggestions periodically
    setInterval(() => {
      const gameState = {
        routes: Array.from(routeStore.routes.values()),
        market: Array.from(marketStore.items.values()),
        economy: useEconomyStore.getState().playerFinancials
      };
      aiStore.generateSuggestions(gameState);
    }, 30000); // Every 30 seconds
  }

  /**
   * Set up automatic revenue generation from active routes
   */
  private setupRevenueGeneration() {
    const routeStore = useRouteStore.getState();
    const economyStore = useEconomyStore.getState();
    const empireStore = useEmpireStore.getState();

    // Simulate route progress every 5 seconds
    setInterval(() => {
      const activeRoutes = routeStore.getActiveRoutes();
      
      activeRoutes.forEach(route => {
        const routeState = routeStore.routeStates.get(route.id);
        if (routeState && routeState.status === 'in_transit') {
          // Update route progress
          const newProgress = Math.min(routeState.progress + 5, 100);
          routeStore.updateRouteState(route.id, { progress: newProgress });

          // Complete route if finished
          if (newProgress >= 100) {
            routeStore.updateRouteState(route.id, { 
              status: 'completed',
              progress: 100 
            });

            // Add route completion event
            routeStore.addRouteEvent({
              type: 'route_completed',
              routeId: route.id,
              timestamp: new Date(),
              data: { profit: route.profitability.netProfit }
            });

            // Update empire store cash
            const currentCash = empireStore.player?.cash || 0;
            empireStore.updatePlayerCash(currentCash + route.profitability.netProfit);
          }
        } else if (routeState && routeState.status === 'idle' && route.assignedAssets.length > 0) {
          // Start route if idle with assets
          routeStore.updateRouteState(route.id, { 
            status: 'in_transit',
            progress: 0 
          });

          routeStore.addRouteEvent({
            type: 'route_started',
            routeId: route.id,
            timestamp: new Date(),
            data: { estimatedTime: route.estimatedTime }
          });
        }
      });
    }, 5000);
  }

  /**
   * Start periodic system updates
   */
  private startPeriodicUpdates() {
    // Update market prices every minute
    this.updateInterval = setInterval(() => {
      const marketStore = useMarketStore.getState();
      const economyStore = useEconomyStore.getState();

      // Update market cycle
      marketStore.updateMarketCycle();
      
      // Update economy market prices
      economyStore.updateMarketPrices();
      
      // Update monthly financials
      economyStore.updateMonthlyFinancials();
    }, 60000);
  }

  /**
   * Update AI learning from route completion
   */
  private updateAIFromRouteCompletion(route: Route, profit: number) {
    const aiStore = useAIStore.getState();
    const marketStore = useMarketStore.getState();

    // Create performance metrics
    const metrics: PerformanceMetrics = {
      routeId: route.id,
      profit,
      timeEfficiency: 1.0, // TODO: Calculate actual efficiency
      incidents: [],
      cargo: [], // TODO: Get actual cargo data
      success: profit > 0
    };

    // AI learns from the route
    aiStore.learnFromRoute(metrics);
    
    // Add experience based on profit
    aiStore.addExperience(Math.floor(profit / 100));
  }

  /**
   * Clean up and disconnect all systems
   */
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    const marketStore = useMarketStore.getState();
    marketStore.unsubscribeFromMarketUpdates();

    this.initialized = false;
    console.log('🧹 Phase 2 systems cleaned up');
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      systems: {
        routes: useRouteStore.getState().routes.size,
        economy: useEconomyStore.getState().playerFinancials.cash,
        market: useMarketStore.getState().items.size,
        ai: useAIStore.getState().companion?.level || 'Not initialized'
      }
    };
  }
}

// Export singleton instance
export const systemIntegration = SystemIntegration.getInstance();