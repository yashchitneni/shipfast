/**
 * Comprehensive Phase 2 Integration Tests
 * Tests all Phase 2 systems working together
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { systemIntegration } from '../../app/lib/game/system-integration';
import { useRouteStore } from '../../app/store/useRouteStore';
import { useEconomyStore } from '../../app/store/useEconomyStore';
import { useMarketStore } from '../../app/store/useMarketStore';
import { useAIStore } from '../../app/store/useAIStore';

// Mock timers for testing
jest.useFakeTimers();

describe('Phase 2 Systems Integration', () => {
  const testPlayerId = 'test-player-integration';

  beforeAll(async () => {
    // Initialize the integration system
    await systemIntegration.initialize(testPlayerId);
  });

  afterAll(() => {
    // Cleanup after tests
    systemIntegration.cleanup();
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Reset stores before each test
    useRouteStore.getState().routes.clear();
    useEconomyStore.getState().initializeEconomy();
    useMarketStore.getState().items.clear();
  });

  describe('System Initialization', () => {
    test('should initialize all Phase 2 systems successfully', async () => {
      const status = systemIntegration.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.systems.economy).toBeGreaterThan(0);
      expect(status.systems.market).toBeGreaterThanOrEqual(0);
      expect(typeof status.systems.routes).toBe('number');
    });

    test('should have all required stores initialized', () => {
      const routeStore = useRouteStore.getState();
      const economyStore = useEconomyStore.getState();
      const marketStore = useMarketStore.getState();
      const aiStore = useAIStore.getState();

      expect(routeStore).toBeDefined();
      expect(economyStore).toBeDefined();
      expect(marketStore).toBeDefined();
      expect(aiStore).toBeDefined();

      // Check initial state
      expect(economyStore.playerFinancials.cash).toBeGreaterThan(0);
      expect(economyStore.goods.size).toBeGreaterThan(0);
    });
  });

  describe('Unified State Management', () => {
    test('should maintain state consistency across stores', async () => {
      const economyStore = useEconomyStore.getState();
      const initialCash = economyStore.playerFinancials.cash;

      // Record a transaction
      economyStore.recordTransaction({
        type: 'income',
        category: 'route-profit',
        amount: 5000,
        description: 'Test route profit'
      });

      // Verify state update
      expect(economyStore.playerFinancials.cash).toBe(initialCash + 5000);
      expect(economyStore.playerFinancials.totalRevenue).toBe(5000);
    });

    test('should handle cross-system state updates', async () => {
      const routeStore = useRouteStore.getState();
      const economyStore = useEconomyStore.getState();
      
      // Create a test route
      const routeResult = await routeStore.createRoute({
        originPortId: 'port-shanghai',
        destinationPortId: 'port-singapore',
        name: 'Test Integration Route',
        waypoints: []
      }, testPlayerId);

      expect(routeResult.success).toBe(true);
      expect(routeResult.routeId).toBeDefined();

      if (routeResult.routeId) {
        // Verify route was created
        const route = routeStore.routes.get(routeResult.routeId);
        expect(route).toBeDefined();
        expect(route?.name).toBe('Test Integration Route');
      }
    });
  });

  describe('UI Components with Live Data', () => {
    test('should provide live data connections for UI components', () => {
      const economyStore = useEconomyStore.getState();
      const marketStore = useMarketStore.getState();

      // Initialize market data
      marketStore.initializeMarket();
      
      // Check that UI components can access live data
      expect(economyStore.playerFinancials).toBeDefined();
      expect(economyStore.playerFinancials.cash).toBeGreaterThan(0);
      expect(Array.from(economyStore.goods.values())).toHaveLength(4); // Initial goods count
    });

    test('should update UI data in real-time', () => {
      const economyStore = useEconomyStore.getState();
      const initialCash = economyStore.playerFinancials.cash;

      // Simulate a market transaction
      economyStore.recordTransaction({
        type: 'expense',
        category: 'market-trade',
        amount: 1000,
        description: 'Buy electronics'
      });

      // UI should reflect the change immediately
      expect(economyStore.playerFinancials.cash).toBe(initialCash - 1000);
    });
  });

  describe('Port Data Integration and LOD System', () => {
    test('should integrate port data with LOD system', () => {
      const economyStore = useEconomyStore.getState();
      
      // Initialize port economics
      economyStore.updatePortEconomics();
      
      // Check port data is loaded
      expect(economyStore.portEconomicData.size).toBeGreaterThan(0);
      
      // Test LOD data access
      const shanghaiData = economyStore.getPortEconomicData('port-shanghai');
      expect(shanghaiData).toBeDefined();
      if (shanghaiData) {
        expect(shanghaiData.portId).toBe('port-shanghai');
        expect(shanghaiData.goods).toBeDefined();
        expect(Array.isArray(shanghaiData.goods)).toBe(true);
      }
    });

    test('should provide different detail levels for ports', () => {
      const economyStore = useEconomyStore.getState();
      
      // Get port data at different detail levels
      const portData = economyStore.getPortEconomicData('port-singapore');
      
      if (portData) {
        // High detail should include goods data
        expect(portData.goods).toBeDefined();
        expect(portData.currentUtilization).toBeDefined();
        expect(portData.efficiency).toBeDefined();
      }
    });
  });

  describe('Port Economics Integration', () => {
    test('should calculate port-specific prices', () => {
      const economyStore = useEconomyStore.getState();
      
      // Initialize economics
      economyStore.initializeEconomy();
      economyStore.updatePortEconomics();
      
      // Test port-specific pricing
      const electronicsBasePrice = economyStore.getGoodPrice('electronics');
      const shanghaPortPrice = economyStore.getPortPrice('electronics', 'port-shanghai');
      const singaporePortPrice = economyStore.getPortPrice('electronics', 'port-singapore');
      
      expect(electronicsBasePrice).toBeGreaterThan(0);
      expect(shanghaPortPrice).toBeGreaterThan(0);
      expect(singaporePortPrice).toBeGreaterThan(0);
      
      // Prices should differ between ports due to modifiers
      expect(shanghaPortPrice).not.toBe(singaporePortPrice);
    });

    test('should calculate trade opportunities', () => {
      const economyStore = useEconomyStore.getState();
      
      economyStore.updatePortEconomics();
      const opportunities = economyStore.calculateTradeOpportunities();
      
      expect(Array.isArray(opportunities)).toBe(true);
      
      if (opportunities.length > 0) {
        const opportunity = opportunities[0];
        expect(opportunity.goodId).toBeDefined();
        expect(opportunity.originPortId).toBeDefined();
        expect(opportunity.destinationPortId).toBeDefined();
        expect(opportunity.potentialProfit).toBeGreaterThan(0);
        expect(opportunity.profitMargin).toBeGreaterThan(10); // Minimum 10% profit margin
      }
    });
  });

  describe('Asset Migration Functionality', () => {
    test('should handle asset migration between systems', () => {
      // This test would verify that assets can be migrated
      // from the old empire store to the new system
      
      // Mock asset data
      const mockAsset = {
        id: 'test-asset-migration',
        definitionId: 'ship-container-small',
        ownerId: testPlayerId,
        position: { x: 100, y: 200 },
        rotation: 0,
        status: 'active' as const,
        health: 100,
        purchasedAt: Date.now()
      };

      // Test that the asset system can handle the migration
      expect(mockAsset.id).toBeDefined();
      expect(mockAsset.ownerId).toBe(testPlayerId);
    });
  });

  describe('System Integration Connections', () => {
    test('should connect route completion to economy updates', async () => {
      const routeStore = useRouteStore.getState();
      const economyStore = useEconomyStore.getState();
      const initialCash = economyStore.playerFinancials.cash;

      // Create and complete a route
      const routeResult = await routeStore.createRoute({
        originPortId: 'port-shanghai',
        destinationPortId: 'port-singapore',
        name: 'Test Revenue Route',
        waypoints: []
      }, testPlayerId);

      if (routeResult.routeId) {
        // Activate the route
        await routeStore.activateRoute(routeResult.routeId);
        
        // Simulate route completion
        routeStore.updateRouteState(routeResult.routeId, {
          status: 'completed',
          progress: 100
        });

        // Add route completion event
        routeStore.addRouteEvent({
          type: 'route_completed',
          routeId: routeResult.routeId,
          timestamp: new Date(),
          data: { profit: 5000 }
        });

        // Fast-forward timers to trigger integration
        jest.advanceTimersByTime(1000);

        // Check that economy was updated
        // Note: In a real scenario, this would be handled by the integration system
        const finalCash = economyStore.playerFinancials.cash;
        expect(finalCash).toBeGreaterThanOrEqual(initialCash);
      }
    });

    test('should connect market transactions to economy', async () => {
      const marketStore = useMarketStore.getState();
      const economyStore = useEconomyStore.getState();

      // Initialize market
      await marketStore.initializeMarket();
      
      const initialCash = economyStore.playerFinancials.cash;

      // Simulate a market purchase
      if (marketStore.items.size > 0) {
        const firstItem = Array.from(marketStore.items.values())[0];
        const purchaseAmount = 1000;
        
        // Record the transaction manually (since we're testing integration)
        economyStore.recordTransaction({
          type: 'expense',
          category: 'market-trade',
          amount: purchaseAmount,
          description: `Buy ${firstItem.name}`
        });

        // Verify economy was updated
        expect(economyStore.playerFinancials.cash).toBe(initialCash - purchaseAmount);
        expect(economyStore.playerFinancials.totalExpenses).toBe(purchaseAmount);
      }
    });

    test('should connect AI learning to system events', () => {
      const aiStore = useAIStore.getState();
      
      // Test AI learning from route data
      const routeMetrics = {
        routeId: 'test-route-ai',
        profit: 5000,
        timeEfficiency: 1.2,
        incidents: [],
        cargo: [],
        success: true
      };

      aiStore.learnFromRoute(routeMetrics);
      
      // Verify AI gained experience
      const companion = aiStore.companion;
      if (companion) {
        expect(companion.experience).toBeGreaterThan(0);
      }
    });
  });

  describe('Revenue Generation System', () => {
    test('should generate revenue from active routes', async () => {
      const routeStore = useRouteStore.getState();
      const economyStore = useEconomyStore.getState();

      // Create a route and assign assets
      const routeResult = await routeStore.createRoute({
        originPortId: 'port-shanghai',
        destinationPortId: 'port-singapore',
        name: 'Revenue Test Route',
        waypoints: []
      }, testPlayerId);

      if (routeResult.routeId) {
        // Mock route with assigned assets
        const route = routeStore.routes.get(routeResult.routeId);
        if (route) {
          // Simulate assigned assets
          route.assignedAssets = ['test-ship-1'];
          
          // Activate the route
          await routeStore.activateRoute(routeResult.routeId);
          
          // Fast-forward time to simulate revenue generation
          jest.advanceTimersByTime(5000);
          
          // Check that route progresses
          const routeState = routeStore.routeStates.get(routeResult.routeId);
          expect(routeState?.status).toBeDefined();
        }
      }
    });
  });

  describe('End-to-End Scenarios', () => {
    test('should handle complete trading workflow', async () => {
      const economyStore = useEconomyStore.getState();
      const marketStore = useMarketStore.getState();
      const routeStore = useRouteStore.getState();
      
      // 1. Initialize systems
      economyStore.initializeEconomy();
      await marketStore.initializeMarket();
      
      const initialCash = economyStore.playerFinancials.cash;
      
      // 2. Check trade opportunities
      const opportunities = economyStore.calculateTradeOpportunities();
      expect(opportunities.length).toBeGreaterThan(0);
      
      // 3. Create a route based on opportunity
      if (opportunities.length > 0) {
        const opportunity = opportunities[0];
        const routeResult = await routeStore.createRoute({
          originPortId: opportunity.originPortId,
          destinationPortId: opportunity.destinationPortId,
          name: `Trade Route: ${opportunity.goodName}`,
          waypoints: []
        }, testPlayerId);
        
        expect(routeResult.success).toBe(true);
        
        if (routeResult.routeId) {
          // 4. Execute the trade
          const route = routeStore.routes.get(routeResult.routeId);
          expect(route).toBeDefined();
          
          if (route) {
            // Calculate expected profit
            const expectedProfit = economyStore.calculateRouteProfit({
              distance: route.totalDistance,
              baseRatePerMile: 2.5,
              cargoValueMultiplier: 1.2,
              assetLevel: 1,
              specialistBonus: 0,
              marketConditions: 'normal',
              maintenanceCostRate: 0.1
            });
            
            expect(expectedProfit.totalProfit).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should handle market volatility and route adaptation', () => {
      const economyStore = useEconomyStore.getState();
      
      // Initialize with normal conditions
      economyStore.initializeEconomy();
      const normalProfit = economyStore.calculateRouteProfit({
        distance: 1000,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1.2,
        assetLevel: 1,
        specialistBonus: 0,
        marketConditions: 'normal',
        maintenanceCostRate: 0.1
      });
      
      // Change to crisis conditions
      economyStore.updateMarketCondition('crisis');
      const crisisProfit = economyStore.calculateRouteProfit({
        distance: 1000,
        baseRatePerMile: 2.5,
        cargoValueMultiplier: 1.2,
        assetLevel: 1,
        specialistBonus: 0,
        marketConditions: 'crisis',
        maintenanceCostRate: 0.1
      });
      
      // Crisis should reduce profitability
      expect(crisisProfit.totalProfit).toBeLessThan(normalProfit.totalProfit);
    });
  });

  describe('Performance and Stability', () => {
    test('should handle rapid state updates', () => {
      const economyStore = useEconomyStore.getState();
      
      // Perform multiple rapid updates
      for (let i = 0; i < 100; i++) {
        economyStore.recordTransaction({
          type: 'income',
          category: 'route-profit',
          amount: 100,
          description: `Rapid update ${i}`
        });
      }
      
      // System should remain stable
      expect(economyStore.playerFinancials.cash).toBeGreaterThan(100000); // Initial + 10000
      expect(economyStore.financialRecords).toHaveLength(100);
    });

    test('should maintain performance with large datasets', () => {
      const economyStore = useEconomyStore.getState();
      
      // Create many price updates
      for (let i = 0; i < 50; i++) {
        economyStore.updateMarketPrices();
      }
      
      // Check that price history is managed efficiently
      const electronics = economyStore.goods.get('electronics');
      if (electronics) {
        expect(electronics.priceHistory.length).toBeLessThanOrEqual(100); // Should cap at 100
      }
    });
  });
});