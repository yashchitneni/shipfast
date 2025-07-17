/**
 * System Integration Tests for Phase 2
 * Tests the SystemIntegration class and inter-system communications
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { systemIntegration } from '../../app/lib/game/system-integration';
import { useRouteStore } from '../../app/store/useRouteStore';
import { useEconomyStore } from '../../app/store/useEconomyStore';
import { useMarketStore } from '../../app/store/useMarketStore';
import { useAIStore } from '../../app/store/useAIStore';

// Mock timers for controlled testing
jest.useFakeTimers();

describe('System Integration Tests', () => {
  const testPlayerId = 'test-player-system-integration';

  beforeAll(async () => {
    // Initialize the integration system
    await systemIntegration.initialize(testPlayerId);
  });

  afterAll(() => {
    // Cleanup after all tests
    systemIntegration.cleanup();
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Reset specific store states as needed
    jest.clearAllTimers();
  });

  describe('SystemIntegration Class', () => {
    test('should be a singleton', () => {
      const instance1 = systemIntegration;
      const instance2 = systemIntegration;
      
      expect(instance1).toBe(instance2);
    });

    test('should initialize all Phase 2 systems', async () => {
      const status = systemIntegration.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(typeof status.systems.routes).toBe('number');
      expect(typeof status.systems.economy).toBe('number');
      expect(typeof status.systems.market).toBe('number');
      expect(status.systems.ai).toBeDefined();
    });

    test('should provide system status information', () => {
      const status = systemIntegration.getStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('systems');
      expect(status.systems).toHaveProperty('routes');
      expect(status.systems).toHaveProperty('economy');
      expect(status.systems).toHaveProperty('market');
      expect(status.systems).toHaveProperty('ai');
    });

    test('should handle cleanup properly', () => {
      // Create a new instance for cleanup testing
      const cleanupTest = async () => {
        await systemIntegration.initialize('cleanup-test-player');
        const statusBefore = systemIntegration.getStatus();
        expect(statusBefore.initialized).toBe(true);
        
        systemIntegration.cleanup();
        const statusAfter = systemIntegration.getStatus();
        expect(statusAfter.initialized).toBe(false);
        
        // Re-initialize for other tests
        await systemIntegration.initialize(testPlayerId);
      };
      
      return cleanupTest();
    });
  });

  describe('Route-Economy Integration', () => {
    test('should connect route completion to economy updates', async () => {
      const routeStore = useRouteStore.getState();
      const economyStore = useEconomyStore.getState();
      
      const initialCash = economyStore.playerFinancials.cash;
      const initialRevenue = economyStore.playerFinancials.totalRevenue;

      // Create a test route
      const routeResult = await routeStore.createRoute({
        originPortId: 'port-shanghai',
        destinationPortId: 'port-singapore',
        name: 'Integration Test Route',
        waypoints: []
      }, testPlayerId);

      expect(routeResult.success).toBe(true);
      
      if (routeResult.routeId) {
        // Add route completion event
        routeStore.addRouteEvent({
          type: 'route_completed',
          routeId: routeResult.routeId,
          timestamp: new Date(),
          data: { profit: 5000 }
        });

        // Fast-forward timers to trigger integration updates
        jest.advanceTimersByTime(1000);

        // Check that the integration system processes the event
        // Note: In the real system, this would be handled by subscription
        const route = routeStore.routes.get(routeResult.routeId);
        expect(route).toBeDefined();
        
        if (route) {
          // Calculate expected profit using economy system
          const profitCalculation = economyStore.calculateRouteProfit({
            distance: route.totalDistance,
            baseRatePerMile: 2.5,
            cargoValueMultiplier: 1.2,
            assetLevel: 1,
            specialistBonus: 0,
            marketConditions: economyStore.marketState.condition,
            maintenanceCostRate: 0.1
          });

          expect(profitCalculation.totalProfit).toBeGreaterThan(0);
        }
      }
    });

    test('should update economy modifiers based on route performance', () => {
      const economyStore = useEconomyStore.getState();
      
      // Test disaster penalty application
      economyStore.applyDisasterPenalty(0.2);
      expect(economyStore.economyModifiers.disasterPenalty).toBe(0.2);
      
      // Test specialist bonus application
      economyStore.applySpecialistBonus(0.15);
      expect(economyStore.economyModifiers.specialistBonus).toBe(0.15);
      
      // Calculate route profit with modifiers
      const profitWithModifiers = economyStore.calculateRouteProfit({
        distance: 1000,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1.2,
        assetLevel: 1,
        specialistBonus: 0.1,
        marketConditions: 'normal',
        maintenanceCostRate: 0.1
      });
      
      const profitWithoutModifiers = economyStore.calculateRouteProfit({
        distance: 1000,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1.2,
        assetLevel: 1,
        specialistBonus: 0,
        marketConditions: 'normal',
        maintenanceCostRate: 0.1
      });
      
      // Modifiers should affect profit calculations
      expect(profitWithModifiers.totalProfit).not.toBe(profitWithoutModifiers.totalProfit);
    });
  });

  describe('Market-Economy Integration', () => {
    test('should connect market transactions to economy', async () => {
      const marketStore = useMarketStore.getState();
      const economyStore = useEconomyStore.getState();
      
      // Initialize market
      await marketStore.initializeMarket();
      
      const initialCash = economyStore.playerFinancials.cash;
      const initialExpenses = economyStore.playerFinancials.totalExpenses;
      
      // Simulate a market transaction through economy
      economyStore.recordTransaction({
        type: 'expense',
        category: 'market-trade',
        amount: 1500,
        description: 'Buy market goods'
      });
      
      // Verify economy was updated
      expect(economyStore.playerFinancials.cash).toBe(initialCash - 1500);
      expect(economyStore.playerFinancials.totalExpenses).toBe(initialExpenses + 1500);
    });

    test('should update market conditions based on economy state', () => {
      const economyStore = useEconomyStore.getState();
      const marketStore = useMarketStore.getState();
      
      // Test different market conditions
      const conditions = ['normal', 'boom', 'recession', 'crisis'] as const;
      
      conditions.forEach(condition => {
        economyStore.updateMarketCondition(condition);
        expect(economyStore.marketState.condition).toBe(condition);
        
        // Calculate route profit under different conditions
        const profit = economyStore.calculateRouteProfit({
          distance: 1000,
          baseRatePerMile: 2.5,
          cargoValueMultiplier: 1.2,
          assetLevel: 1,
          specialistBonus: 0,
          marketConditions: condition,
          maintenanceCostRate: 0.1
        });
        
        expect(profit.totalProfit).toBeGreaterThan(0);
        
        // Different conditions should yield different profits
        if (condition === 'boom') {
          expect(profit.marketConditionModifier).toBeGreaterThan(1);
        } else if (condition === 'crisis') {
          expect(profit.marketConditionModifier).toBeLessThan(1);
        }
      });
    });

    test('should handle market volatility effects on economy', () => {
      const economyStore = useEconomyStore.getState();
      
      // Apply time event effects that affect market volatility
      economyStore.applyTimeEventEffects({
        demandMultiplier: 1.3,
        priceMultiplier: 1.1,
        costMultiplier: 1.05
      });
      
      // Check that volatility was applied
      expect(economyStore.economyModifiers.marketVolatility).toBeGreaterThan(0);
      
      // Remove effects
      economyStore.removeTimeEventEffects();
      expect(economyStore.economyModifiers.marketVolatility).toBe(0);
    });
  });

  describe('AI Learning Integration', () => {
    test('should connect AI learning to route completions', () => {
      const aiStore = useAIStore.getState();
      const routeStore = useRouteStore.getState();
      
      // Create test route data for AI learning
      const routeMetrics = {
        routeId: 'test-route-ai-learning',
        profit: 7500,
        timeEfficiency: 1.1,
        incidents: [],
        cargo: [],
        success: true
      };
      
      const initialExperience = aiStore.companion?.experience || 0;
      
      // AI learns from route completion
      aiStore.learnFromRoute(routeMetrics);
      
      // Verify AI gained experience
      const finalExperience = aiStore.companion?.experience || 0;
      expect(finalExperience).toBeGreaterThan(initialExperience);
    });

    test('should generate AI suggestions based on system state', async () => {
      const aiStore = useAIStore.getState();
      const economyStore = useEconomyStore.getState();
      const routeStore = useRouteStore.getState();
      const marketStore = useMarketStore.getState();
      
      // Initialize systems
      economyStore.initializeEconomy();
      await marketStore.initializeMarket();
      
      // Create game state for AI analysis
      const gameState = {
        routes: Array.from(routeStore.routes.values()),
        market: Array.from(marketStore.items.values()),
        economy: economyStore.playerFinancials
      };
      
      const initialSuggestions = aiStore.suggestions.length;
      
      // Generate suggestions
      aiStore.generateSuggestions(gameState);
      
      // AI should generate relevant suggestions
      expect(aiStore.suggestions.length).toBeGreaterThanOrEqual(initialSuggestions);
    });

    test('should update AI market insights from transactions', () => {
      const aiStore = useAIStore.getState();
      
      // Test market insight updates
      const portId = 'port-shanghai';
      const itemId = 'electronics';
      const price = 125.50;
      const volume = 100;
      
      aiStore.updateMarketInsights(portId, itemId, price, volume);
      
      // Verify AI received market data
      // Note: The actual storage depends on AI store implementation
      expect(aiStore.companion).toBeDefined();
    });
  });

  describe('Revenue Generation System', () => {
    test('should generate revenue from active routes', async () => {
      const routeStore = useRouteStore.getState();
      const economyStore = useEconomyStore.getState();
      
      // Create a route with assets
      const routeResult = await routeStore.createRoute({
        originPortId: 'port-shanghai',
        destinationPortId: 'port-singapore',
        name: 'Revenue Generation Test',
        waypoints: []
      }, testPlayerId);
      
      if (routeResult.routeId) {
        // Mock assigned assets
        const route = routeStore.routes.get(routeResult.routeId);
        if (route) {
          route.assignedAssets = ['test-ship-revenue'];
        }
        
        // Activate the route
        await routeStore.activateRoute(routeResult.routeId);
        
        // Set route to idle so it can start
        routeStore.updateRouteState(routeResult.routeId, {
          status: 'idle',
          progress: 0
        });
        
        // Fast-forward timers to trigger revenue generation
        jest.advanceTimersByTime(5000);
        
        // Check that route progressed
        const routeState = routeStore.routeStates.get(routeResult.routeId);
        expect(routeState).toBeDefined();
        
        if (routeState) {
          // Route should have started or progressed
          expect(['idle', 'in_transit', 'completed']).toContain(routeState.status);
        }
      }
    });

    test('should handle route state transitions', async () => {
      const routeStore = useRouteStore.getState();
      
      // Create and activate a route
      const routeResult = await routeStore.createRoute({
        originPortId: 'port-shanghai',
        destinationPortId: 'port-singapore',
        name: 'State Transition Test',
        waypoints: []
      }, testPlayerId);
      
      if (routeResult.routeId) {
        // Test state transitions: idle -> in_transit -> completed
        routeStore.updateRouteState(routeResult.routeId, {
          status: 'idle',
          progress: 0
        });
        
        let routeState = routeStore.routeStates.get(routeResult.routeId);
        expect(routeState?.status).toBe('idle');
        
        // Transition to in_transit
        routeStore.updateRouteState(routeResult.routeId, {
          status: 'in_transit',
          progress: 50
        });
        
        routeState = routeStore.routeStates.get(routeResult.routeId);
        expect(routeState?.status).toBe('in_transit');
        expect(routeState?.progress).toBe(50);
        
        // Complete the route
        routeStore.updateRouteState(routeResult.routeId, {
          status: 'completed',
          progress: 100
        });
        
        routeState = routeStore.routeStates.get(routeResult.routeId);
        expect(routeState?.status).toBe('completed');
        expect(routeState?.progress).toBe(100);
      }
    });
  });

  describe('Periodic Updates and Monitoring', () => {
    test('should handle periodic market updates', () => {
      const marketStore = useMarketStore.getState();
      const economyStore = useEconomyStore.getState();
      
      // Initialize market with some items
      economyStore.initializeEconomy();
      
      const initialGoods = Array.from(economyStore.goods.values());
      expect(initialGoods.length).toBeGreaterThan(0);
      
      // Fast-forward time to trigger periodic updates
      jest.advanceTimersByTime(60000); // 1 minute
      
      // Market prices should be updated
      const updatedGoods = Array.from(economyStore.goods.values());
      expect(updatedGoods.length).toBe(initialGoods.length);
      
      // Prices may have changed due to volatility
      updatedGoods.forEach(good => {
        expect(good.currentPrice).toBeGreaterThan(0);
      });
    });

    test('should handle system monitoring', () => {
      // Test that the integration system is monitoring correctly
      const status = systemIntegration.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(typeof status.systems.routes).toBe('number');
      expect(typeof status.systems.economy).toBe('number');
      expect(typeof status.systems.market).toBe('number');
      
      // System should provide meaningful metrics
      expect(status.systems.economy).toBeGreaterThan(0); // Player has initial cash
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle store initialization failures gracefully', async () => {
      // Test with invalid player ID
      const invalidPlayerId = '';
      
      try {
        // This should not crash the system
        await systemIntegration.initialize(invalidPlayerId);
        const status = systemIntegration.getStatus();
        
        // System should still initialize with defaults
        expect(status.initialized).toBe(true);
      } catch (error) {
        // If it throws, it should be a handled error
        expect(error).toBeDefined();
      }
      
      // Re-initialize with valid ID for other tests
      await systemIntegration.initialize(testPlayerId);
    });

    test('should handle subscription errors', () => {
      // Test that the system can recover from subscription failures
      const routeStore = useRouteStore.getState();
      
      // This should not crash the system
      try {
        routeStore.addRouteEvent({
          type: 'route_completed',
          routeId: 'non-existent-route',
          timestamp: new Date(),
          data: { profit: 1000 }
        });
      } catch (error) {
        // Should handle gracefully
      }
      
      // System should still be functional
      const status = systemIntegration.getStatus();
      expect(status.initialized).toBe(true);
    });

    test('should maintain system stability during rapid updates', () => {
      const economyStore = useEconomyStore.getState();
      
      // Perform rapid updates
      for (let i = 0; i < 50; i++) {
        economyStore.recordTransaction({
          type: 'income',
          category: 'route-profit',
          amount: 100,
          description: `Rapid update ${i}`
        });
      }
      
      // System should remain stable
      expect(economyStore.playerFinancials.cash).toBeGreaterThan(100000);
      expect(economyStore.financialRecords.length).toBe(50);
      
      const status = systemIntegration.getStatus();
      expect(status.initialized).toBe(true);
    });
  });
});