import { renderHook, act } from '@testing-library/react';
import { useRevenueService } from '../revenueService';
import { useEconomyStore } from '@/store/useEconomyStore';
import { useRouteStore } from '@/store/useRouteStore';
import { useEmpireStore } from '../../../src/store/empireStore';
import type { Route } from '@/lib/types/economy';
import type { PlacedAsset, AssetDefinition } from '@/lib/types/assets';

// Mock the stores
jest.mock('@/store/useEconomyStore');
jest.mock('@/store/useRouteStore');
jest.mock('../../../src/store/empireStore');

describe('RevenueService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useEconomyStore.getState as jest.Mock).mockReturnValue({
      marketState: {
        condition: 'normal',
        volatilityFactor: 1.0,
        globalDemandModifier: 1.0,
        globalSupplyModifier: 1.0,
        lastUpdate: Date.now()
      },
      recordTransaction: jest.fn(),
      updateMonthlyFinancials: jest.fn()
    });
    
    (useRouteStore.getState as jest.Mock).mockReturnValue({
      getActiveRoutes: jest.fn().mockReturnValue([])
    });
    
    (useEmpireStore.getState as jest.Mock).mockReturnValue({
      assetDefinitions: new Map(),
      placedAssets: new Map()
    });
  });
  
  describe('initializeService', () => {
    it('should initialize operating costs for transport assets', () => {
      const mockAssetDef: AssetDefinition = {
        id: 'cargo-ship',
        name: 'Cargo Ship',
        type: 'ship',
        category: 'transport',
        cost: 100000,
        maintenanceCost: 2400, // $100/hour
        level: 1,
        requirements: {},
        stats: {
          capacity: 1000,
          speed: 20,
          fuelEfficiency: 10,
          crewRequired: 5
        }
      };
      
      const assetMap = new Map([['cargo-ship', mockAssetDef]]);
      
      (useEmpireStore.getState as jest.Mock).mockReturnValue({
        assetDefinitions: assetMap,
        placedAssets: new Map()
      });
      
      const { result } = renderHook(() => useRevenueService());
      
      act(() => {
        result.current.initializeService();
      });
      
      const costs = result.current.assetOperatingCosts.get('cargo-ship');
      expect(costs).toBeDefined();
      expect(costs?.maintenancePerHour).toBe(100); // 2400/24
      expect(costs?.fuelPerMile).toBe(0.1); // 1/10
      expect(costs?.crewCostPerHour).toBe(250); // 5 crew * 50
      expect(costs?.insurancePerDay).toBe(100); // 0.1% of 100000
      expect(costs?.portFeesPerStop).toBe(500);
    });
  });
  
  describe('processRouteRevenue', () => {
    it('should calculate revenue based on route trips and modifiers', () => {
      const mockRoute: Route = {
        id: 'route-1',
        ownerId: 'player-1',
        name: 'Test Route',
        originPortId: 'port-a',
        destinationPortId: 'port-b',
        waypoints: [],
        segments: [],
        totalDistance: 1000,
        estimatedTime: 24, // 24 hours
        assignedAssets: ['asset-1'],
        isActive: true,
        requirements: {},
        profitability: {
          revenue: 10000,
          costs: { fuel: 1000, maintenance: 500, portFees: 500, crew: 500, insurance: 200 },
          netProfit: 7300,
          profitMargin: 73,
          roi: 270,
          profitPerDay: 7300
        },
        performance: {
          totalTrips: 0,
          successfulTrips: 0,
          failedTrips: 0,
          averageProfit: 0,
          totalProfit: 0,
          averageTime: 0,
          onTimePercentage: 100,
          disastersEncountered: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockAsset: PlacedAsset = {
        id: 'asset-1',
        definitionId: 'cargo-ship',
        ownerId: 'player-1',
        position: { x: 100, y: 100 },
        rotation: 0,
        portId: 'port-a',
        status: 'transit',
        health: 100,
        purchasedAt: Date.now()
      };
      
      const mockAssetDef: AssetDefinition = {
        id: 'cargo-ship',
        name: 'Cargo Ship',
        type: 'ship',
        category: 'transport',
        cost: 100000,
        maintenanceCost: 2400,
        level: 2, // Level 2 ship
        requirements: {},
        stats: {
          capacity: 1000,
          speed: 20
        }
      };
      
      const assetMap = new Map([['cargo-ship', mockAssetDef]]);
      
      (useEmpireStore.getState as jest.Mock).mockReturnValue({
        assetDefinitions: assetMap,
        placedAssets: new Map([['asset-1', mockAsset]])
      });
      
      const { result } = renderHook(() => useRevenueService());
      
      // Set last processed time to 48 hours ago (2 trips possible)
      result.current.lastProcessedTime = Date.now() - (48 * 60 * 60 * 1000);
      
      const revenues = result.current.processRouteRevenue(mockRoute, [mockAsset]);
      
      expect(revenues).toHaveLength(1);
      expect(revenues[0].type).toBe('route');
      expect(revenues[0].routeId).toBe('route-1');
      expect(revenues[0].assetId).toBe('asset-1');
      expect(revenues[0].baseAmount).toBe(20000); // 2 trips * 10000 revenue
      
      // Check modifiers
      const efficiencyMod = revenues[0].modifiers.find(m => m.type === 'efficiency');
      expect(efficiencyMod?.value).toBe(1.2); // Level 2 = 1 + (2 * 0.1)
      
      const marketMod = revenues[0].modifiers.find(m => m.type === 'market');
      expect(marketMod?.value).toBe(1.0); // Normal market
      
      const competitionMod = revenues[0].modifiers.find(m => m.type === 'competition');
      expect(competitionMod?.value).toBe(0.9); // 1 - 0.1 default competition
      
      // Final amount should be base * all modifiers
      expect(revenues[0].finalAmount).toBeCloseTo(20000 * 1.2 * 1.0 * 0.9); // 21600
    });
  });
  
  describe('calculateExpenses', () => {
    it('should calculate all expense categories correctly', () => {
      const mockAsset: PlacedAsset = {
        id: 'asset-1',
        definitionId: 'cargo-ship',
        ownerId: 'player-1',
        position: { x: 100, y: 100 },
        rotation: 0,
        portId: 'port-a',
        routeId: 'route-1',
        status: 'transit',
        health: 100,
        purchasedAt: Date.now()
      };
      
      const mockRoute: Route = {
        id: 'route-1',
        ownerId: 'player-1',
        name: 'Test Route',
        originPortId: 'port-a',
        destinationPortId: 'port-b',
        waypoints: [],
        segments: [
          { from: 'port-a', to: 'port-b', distance: 1000, estimatedTime: 24, fuelCost: 1000, riskLevel: 10 }
        ],
        totalDistance: 1000,
        estimatedTime: 24,
        assignedAssets: ['asset-1'],
        isActive: true,
        requirements: {},
        profitability: {
          revenue: 10000,
          costs: { fuel: 1000, maintenance: 500, portFees: 500, crew: 500, insurance: 200 },
          netProfit: 7300,
          profitMargin: 73,
          roi: 270,
          profitPerDay: 7300
        },
        performance: {
          totalTrips: 0,
          successfulTrips: 0,
          failedTrips: 0,
          averageProfit: 0,
          totalProfit: 0,
          averageTime: 0,
          onTimePercentage: 100,
          disastersEncountered: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockAssetDef: AssetDefinition = {
        id: 'cargo-ship',
        name: 'Cargo Ship',
        type: 'ship',
        category: 'transport',
        cost: 100000,
        maintenanceCost: 2400,
        level: 1,
        requirements: {},
        stats: {}
      };
      
      (useEmpireStore.getState as jest.Mock).mockReturnValue({
        assetDefinitions: new Map([['cargo-ship', mockAssetDef]]),
        placedAssets: new Map([['asset-1', mockAsset]])
      });
      
      const { result } = renderHook(() => useRevenueService());
      
      act(() => {
        result.current.initializeService();
      });
      
      // Set last processed time to 24 hours ago
      result.current.lastProcessedTime = Date.now() - (24 * 60 * 60 * 1000);
      
      const expenses = result.current.calculateExpenses([mockAsset], [mockRoute]);
      
      // Should have maintenance, insurance, fuel, crew, and port fees
      expect(expenses.length).toBeGreaterThan(0);
      
      const maintenanceExpense = expenses.find(e => e.type === 'maintenance');
      expect(maintenanceExpense).toBeDefined();
      expect(maintenanceExpense?.amount).toBeCloseTo(2400); // 100/hr * 24hr
      
      const insuranceExpense = expenses.find(e => e.type === 'insurance');
      expect(insuranceExpense).toBeDefined();
      expect(insuranceExpense?.amount).toBe(100); // 0.1% of 100000 per day
      
      const fuelExpense = expenses.find(e => e.type === 'fuel');
      expect(fuelExpense).toBeDefined();
      expect(fuelExpense?.routeId).toBe('route-1');
      
      const crewExpense = expenses.find(e => e.type === 'crew');
      expect(crewExpense).toBeDefined();
      
      const portFeesExpense = expenses.find(e => e.type === 'port-fees');
      expect(portFeesExpense).toBeDefined();
    });
  });
  
  describe('generateFinancialReport', () => {
    it('should generate comprehensive financial report', () => {
      const { result } = renderHook(() => useRevenueService());
      
      // Add some mock cycle history
      const mockCycle = {
        id: 'cycle-1',
        startTime: Date.now() - 3600000, // 1 hour ago
        endTime: Date.now(),
        status: 'completed' as const,
        revenues: [],
        expenses: [],
        netIncome: 5000,
        summary: {
          totalRevenue: 10000,
          totalExpenses: 5000,
          netProfit: 5000,
          revenueByType: { route: 10000 },
          expensesByCategory: { maintenance: 2000, fuel: 3000 },
          topPerformingRoutes: [
            {
              routeId: 'route-1',
              routeName: 'Test Route',
              revenue: 10000,
              expenses: 5000,
              profit: 5000,
              profitMargin: 0.5,
              trips: 1
            }
          ],
          assetUtilization: 0.8
        }
      };
      
      act(() => {
        result.current.cycleHistory = [mockCycle];
      });
      
      const report = result.current.generateFinancialReport(7);
      
      expect(report.totalRevenue).toBe(10000);
      expect(report.totalExpenses).toBe(5000);
      expect(report.netProfit).toBe(5000);
      expect(report.profitMargin).toBe(0.5);
      expect(report.routePerformance).toHaveLength(1);
      expect(report.recommendations).toBeDefined();
    });
  });
});