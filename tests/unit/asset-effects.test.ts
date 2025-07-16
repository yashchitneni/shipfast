/**
 * Phase 2: Asset Effects System Tests
 * Tests the area effects and bonuses from warehouses and asset networks
 */

import { AssetEffectsService } from '../../app/services/assetEffectsService';
import { AssetDefinition, PlacedAsset, Position } from '../../app/lib/types/assets';

describe('Asset Effects System', () => {
  const mockWarehouseDefinition: AssetDefinition = {
    id: 'warehouse-mega',
    name: 'Mega Distribution Hub',
    type: 'warehouse',
    subType: 'storage-facility',
    category: 'storage',
    cost: 2000000,
    maintenanceCost: 20000,
    capacity: 50000,
    storageCapacity: 50000,
    efficiency: 0.95,
    description: 'A massive automated hub',
    areaEffect: {
      radius: 200,
      type: 'port_efficiency',
      value: 0.10
    },
    bonuses: {
      efficiency: 0.15,
      capacity: 5000,
      portEfficiencyBoost: 0.10
    }
  };

  const mockPlacedWarehouse: PlacedAsset = {
    id: 'placed-warehouse-1',
    definitionId: 'warehouse-mega',
    ownerId: 'player-1',
    position: { x: 100, y: 100 },
    rotation: 0,
    status: 'active',
    health: 100,
    purchasedAt: Date.now()
  };

  const mockPorts = [
    { id: 'port-1', position: { x: 150, y: 150 } }, // Within range
    { id: 'port-2', position: { x: 500, y: 500 } }  // Out of range
  ];

  describe('Distance Calculation', () => {
    it('should calculate correct distance between positions', () => {
      const pos1: Position = { x: 0, y: 0 };
      const pos2: Position = { x: 3, y: 4 };
      
      // Using private method via any cast for testing
      const distance = (AssetEffectsService as any).calculateDistance(pos1, pos2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });
  });

  describe('Area Effects', () => {
    it('should calculate area effects for warehouses', () => {
      const assetDefinitions = new Map([
        ['warehouse-mega', mockWarehouseDefinition]
      ]);

      const effects = AssetEffectsService.calculateAreaEffects(
        [mockPlacedWarehouse],
        assetDefinitions,
        mockPorts
      );

      expect(effects.size).toBe(1);
      const warehouseEffects = effects.get('placed-warehouse-1');
      expect(warehouseEffects).toBeDefined();
      expect(warehouseEffects?.length).toBe(1); // Only port-1 should be in range
      expect(warehouseEffects?.[0].targetId).toBe('port-1');
      expect(warehouseEffects?.[0].effectType).toBe('port_efficiency');
      expect(warehouseEffects?.[0].effectValue).toBe(0.10);
    });

    it('should not affect targets outside radius', () => {
      const assetDefinitions = new Map([
        ['warehouse-mega', mockWarehouseDefinition]
      ]);

      const effects = AssetEffectsService.calculateAreaEffects(
        [mockPlacedWarehouse],
        assetDefinitions,
        mockPorts
      );

      const warehouseEffects = effects.get('placed-warehouse-1');
      const affectedTargets = warehouseEffects?.map(e => e.targetId) || [];
      
      expect(affectedTargets).toContain('port-1');
      expect(affectedTargets).not.toContain('port-2');
    });
  });

  describe('Cumulative Effects', () => {
    it('should calculate cumulative effects from multiple sources', () => {
      const effectsMap = new Map([
        ['warehouse-1', [
          { targetId: 'port-1', targetType: 'port' as const, effectType: 'port_efficiency', effectValue: 0.05, distance: 50 }
        ]],
        ['warehouse-2', [
          { targetId: 'port-1', targetType: 'port' as const, effectType: 'port_efficiency', effectValue: 0.08, distance: 75 }
        ]]
      ]);

      const cumulativeEffects = AssetEffectsService.getCumulativeEffects(
        'port-1',
        'port',
        effectsMap
      );

      expect(cumulativeEffects.get('port_efficiency')).toBe(0.13);
    });
  });

  describe('Efficiency Calculations', () => {
    it('should apply port efficiency boost correctly', () => {
      const baseEfficiency = 0.80;
      const boostPercentage = 0.10;
      
      const boostedEfficiency = AssetEffectsService.applyPortEfficiencyBoost(
        baseEfficiency,
        boostPercentage
      );

      expect(boostedEfficiency).toBeCloseTo(0.88, 10); // 0.80 * 1.10
    });

    it('should calculate utilization penalty correctly', () => {
      expect(AssetEffectsService.calculateUtilizationPenalty(0.7)).toBe(0); // No penalty under 80%
      expect(AssetEffectsService.calculateUtilizationPenalty(0.85)).toBe(0.05); // 5% penalty at 80-90%
      expect(AssetEffectsService.calculateUtilizationPenalty(0.92)).toBe(0.10); // 10% penalty at 90-95%
      expect(AssetEffectsService.calculateUtilizationPenalty(0.98)).toBe(0.20); // 20% penalty above 95%
    });
  });

  describe('Storage Network Bonus', () => {
    it('should calculate warehouse network bonus', () => {
      const warehouses: PlacedAsset[] = [
        {
          id: 'w1', definitionId: 'warehouse-small', ownerId: 'player-1',
          position: { x: 0, y: 0 }, rotation: 0, status: 'active',
          health: 100, purchasedAt: Date.now()
        },
        {
          id: 'w2', definitionId: 'warehouse-medium', ownerId: 'player-1',
          position: { x: 100, y: 100 }, rotation: 0, status: 'active',
          health: 100, purchasedAt: Date.now()
        },
        {
          id: 'w3', definitionId: 'warehouse-large', ownerId: 'player-1',
          position: { x: 200, y: 200 }, rotation: 0, status: 'active',
          health: 100, purchasedAt: Date.now()
        }
      ];

      const definitions = new Map([
        ['warehouse-small', { type: 'warehouse', storageCapacity: 5000 } as AssetDefinition],
        ['warehouse-medium', { type: 'warehouse', storageCapacity: 15000 } as AssetDefinition],
        ['warehouse-large', { type: 'warehouse', storageCapacity: 30000 } as AssetDefinition]
      ]);

      const networkBonus = AssetEffectsService.calculateStorageNetworkBonus(
        warehouses,
        definitions
      );

      // 3 warehouses = 2% network bonus for 2 additional warehouses = 4%
      // 50,000 total capacity = 5 * 1% scale bonus = 5%
      // Total = 9%
      expect(networkBonus).toBe(0.09);
    });

    it('should cap network bonus at maximum values', () => {
      // Create 15 warehouses to test network cap
      const warehouses: PlacedAsset[] = Array.from({ length: 15 }, (_, i) => ({
        id: `w${i}`, definitionId: 'warehouse-mega', ownerId: 'player-1',
        position: { x: i * 10, y: 0 }, rotation: 0, status: 'active',
        health: 100, purchasedAt: Date.now()
      }));

      const definitions = new Map([
        ['warehouse-mega', { type: 'warehouse', storageCapacity: 50000 } as AssetDefinition]
      ]);

      const networkBonus = AssetEffectsService.calculateStorageNetworkBonus(
        warehouses,
        definitions
      );

      // Network bonus should cap at 20% (10 additional warehouses max)
      // Scale bonus should cap at 10% (750k capacity)
      // Total = 30%
      expect(networkBonus).toBeCloseTo(0.30, 10);
    });
  });

  describe('Cargo Storage Validation', () => {
    it('should validate cargo types for specialized warehouses', () => {
      const specializedWarehouse: AssetDefinition = {
        id: 'warehouse-specialized',
        name: 'Specialized Storage',
        type: 'warehouse',
        subType: 'storage-facility',
        category: 'storage',
        cost: 750000,
        maintenanceCost: 7500,
        capacity: 10000,
        storageCapacity: 10000,
        efficiency: 0.88,
        description: 'Temperature-controlled storage'
      };

      expect(AssetEffectsService.canStoreCargoType(specializedWarehouse, 'perishable')).toBe(true);
      expect(AssetEffectsService.canStoreCargoType(specializedWarehouse, 'temperature-controlled')).toBe(true);
      expect(AssetEffectsService.canStoreCargoType(specializedWarehouse, 'general')).toBe(false);
      expect(AssetEffectsService.canStoreCargoType(specializedWarehouse, 'hazardous')).toBe(false);
    });

    it('should validate cargo types for regular warehouses', () => {
      const regularWarehouse: AssetDefinition = {
        id: 'warehouse-medium',
        name: 'Medium Storage Facility',
        type: 'warehouse',
        subType: 'storage-facility',
        category: 'storage',
        cost: 500000,
        maintenanceCost: 5000,
        capacity: 15000,
        storageCapacity: 15000,
        efficiency: 0.85,
        description: 'Standard warehouse'
      };

      expect(AssetEffectsService.canStoreCargoType(regularWarehouse, 'general')).toBe(true);
      expect(AssetEffectsService.canStoreCargoType(regularWarehouse, 'electronics')).toBe(true);
      expect(AssetEffectsService.canStoreCargoType(regularWarehouse, 'hazardous')).toBe(false);
      expect(AssetEffectsService.canStoreCargoType(regularWarehouse, 'oversized')).toBe(false);
    });
  });
});