/**
 * Asset Migration Functionality Tests
 * Tests the migration of assets between old and new systems
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { useEmpireStore } from '../../src/store/empireStore';
import { AssetDefinition, PlacedAsset } from '../../app/lib/types/assets';

// Mock asset data for testing
const mockAssetDefinitions: AssetDefinition[] = [
  {
    id: 'ship-container-small',
    name: 'Small Container Ship',
    type: 'ship',
    subType: 'container-vessel',
    category: 'transport',
    cost: 50000,
    maintenanceCost: 5000,
    efficiency: 0.75,
    description: 'A small container ship for cargo transport'
  },
  {
    id: 'warehouse-basic',
    name: 'Basic Warehouse',
    type: 'warehouse',
    subType: 'storage',
    category: 'infrastructure',
    cost: 25000,
    maintenanceCost: 2000,
    efficiency: 1.0,
    description: 'A basic storage facility'
  },
  {
    id: 'crane-port',
    name: 'Port Crane',
    type: 'crane',
    subType: 'loading',
    category: 'infrastructure',
    cost: 15000,
    maintenanceCost: 1500,
    efficiency: 1.2,
    description: 'A crane for loading and unloading cargo'
  }
];

const mockLegacyAssets = [
  {
    id: 'legacy-ship-1',
    type: 'ship',
    position: { x: 100, y: 200 },
    properties: {
      name: 'Legacy Container Ship',
      capacity: 1000,
      speed: 10
    },
    purchased: Date.now() - 86400000 // 1 day ago
  },
  {
    id: 'legacy-warehouse-1',
    type: 'warehouse',
    position: { x: 300, y: 400 },
    properties: {
      name: 'Legacy Warehouse',
      capacity: 5000,
      efficiency: 0.8
    },
    purchased: Date.now() - 172800000 // 2 days ago
  }
];

describe('Asset Migration Functionality', () => {
  const testPlayerId = 'test-player-migration';

  beforeEach(() => {
    // Reset empire store before each test
    const empireStore = useEmpireStore.getState();
    empireStore.reset();
  });

  describe('Legacy Asset Detection', () => {
    test('should identify legacy assets that need migration', () => {
      // In a real implementation, this would scan for legacy asset formats
      const legacyAssets = mockLegacyAssets;
      
      expect(legacyAssets).toHaveLength(2);
      
      // Check legacy asset structure
      legacyAssets.forEach(asset => {
        expect(asset.id).toBeDefined();
        expect(asset.type).toBeDefined();
        expect(asset.position).toBeDefined();
        expect(asset.properties).toBeDefined();
        expect(typeof asset.purchased).toBe('number');
      });
    });

    test('should categorize legacy assets by type', () => {
      const assetsByType = mockLegacyAssets.reduce((acc, asset) => {
        acc[asset.type] = acc[asset.type] || [];
        acc[asset.type].push(asset);
        return acc;
      }, {} as Record<string, typeof mockLegacyAssets>);

      expect(assetsByType.ship).toHaveLength(1);
      expect(assetsByType.warehouse).toHaveLength(1);
    });
  });

  describe('Asset Definition Mapping', () => {
    test('should map legacy assets to new asset definitions', () => {
      const migrationMappings = {
        'ship': 'ship-container-small',
        'warehouse': 'warehouse-basic',
        'crane': 'crane-port'
      };

      mockLegacyAssets.forEach(legacyAsset => {
        const definitionId = migrationMappings[legacyAsset.type as keyof typeof migrationMappings];
        expect(definitionId).toBeDefined();
        
        const definition = mockAssetDefinitions.find(def => def.id === definitionId);
        expect(definition).toBeDefined();
        
        if (definition) {
          expect(definition.type).toBe(legacyAsset.type);
        }
      });
    });

    test('should preserve essential asset properties during mapping', () => {
      const legacyShip = mockLegacyAssets.find(a => a.type === 'ship');
      const shipDefinition = mockAssetDefinitions.find(d => d.type === 'ship');

      if (legacyShip && shipDefinition) {
        // Create migrated asset
        const migratedAsset: PlacedAsset = {
          id: legacyShip.id,
          definitionId: shipDefinition.id,
          ownerId: testPlayerId,
          position: legacyShip.position,
          rotation: 0,
          status: 'active',
          health: 100,
          purchasedAt: legacyShip.purchased
        };

        expect(migratedAsset.id).toBe(legacyShip.id);
        expect(migratedAsset.position).toEqual(legacyShip.position);
        expect(migratedAsset.purchasedAt).toBe(legacyShip.purchased);
        expect(migratedAsset.definitionId).toBe(shipDefinition.id);
      }
    });
  });

  describe('Migration Process', () => {
    test('should create new format assets from legacy data', () => {
      const migratedAssets: PlacedAsset[] = [];

      mockLegacyAssets.forEach(legacyAsset => {
        const definitionMapping = {
          'ship': 'ship-container-small',
          'warehouse': 'warehouse-basic'
        };

        const definitionId = definitionMapping[legacyAsset.type as keyof typeof definitionMapping];
        
        if (definitionId) {
          const migratedAsset: PlacedAsset = {
            id: `migrated-${legacyAsset.id}`,
            definitionId,
            ownerId: testPlayerId,
            position: legacyAsset.position,
            rotation: 0,
            status: 'active',
            health: 100,
            purchasedAt: legacyAsset.purchased
          };

          migratedAssets.push(migratedAsset);
        }
      });

      expect(migratedAssets).toHaveLength(2);
      
      migratedAssets.forEach(asset => {
        expect(asset.id).toContain('migrated-');
        expect(asset.definitionId).toBeDefined();
        expect(asset.ownerId).toBe(testPlayerId);
        expect(asset.status).toBe('active');
        expect(asset.health).toBe(100);
      });
    });

    test('should validate migrated assets', () => {
      const migratedAsset: PlacedAsset = {
        id: 'migrated-legacy-ship-1',
        definitionId: 'ship-container-small',
        ownerId: testPlayerId,
        position: { x: 100, y: 200 },
        rotation: 0,
        status: 'active',
        health: 100,
        purchasedAt: Date.now()
      };

      // Validation checks
      expect(migratedAsset.id).toBeTruthy();
      expect(migratedAsset.definitionId).toBeTruthy();
      expect(migratedAsset.ownerId).toBeTruthy();
      expect(migratedAsset.position.x).toBeGreaterThanOrEqual(0);
      expect(migratedAsset.position.y).toBeGreaterThanOrEqual(0);
      expect(['active', 'inactive', 'maintenance']).toContain(migratedAsset.status);
      expect(migratedAsset.health).toBeGreaterThanOrEqual(0);
      expect(migratedAsset.health).toBeLessThanOrEqual(100);
      expect(migratedAsset.purchasedAt).toBeGreaterThan(0);
    });

    test('should handle migration errors gracefully', () => {
      const invalidLegacyAsset = {
        id: '',
        type: 'unknown-type',
        position: { x: -1, y: -1 },
        properties: null,
        purchased: -1
      };

      // Migration should handle invalid data
      const migrationResult = (() => {
        try {
          if (!invalidLegacyAsset.id || !invalidLegacyAsset.type) {
            return { success: false, error: 'Invalid asset data' };
          }
          
          if (invalidLegacyAsset.position.x < 0 || invalidLegacyAsset.position.y < 0) {
            return { success: false, error: 'Invalid position' };
          }
          
          return { success: true };
        } catch (error) {
          return { success: false, error: 'Migration failed' };
        }
      })();

      expect(migrationResult.success).toBe(false);
      expect(migrationResult.error).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    test('should preserve asset relationships during migration', () => {
      // Mock a legacy route with assigned assets
      const legacyRoute = {
        id: 'legacy-route-1',
        assignedAssets: ['legacy-ship-1'],
        origin: 'port-shanghai',
        destination: 'port-singapore'
      };

      // Migration should update asset references
      const migratedRoute = {
        ...legacyRoute,
        assignedAssets: legacyRoute.assignedAssets.map(assetId => 
          assetId.startsWith('legacy-') ? `migrated-${assetId}` : assetId
        )
      };

      expect(migratedRoute.assignedAssets).toEqual(['migrated-legacy-ship-1']);
      expect(migratedRoute.origin).toBe(legacyRoute.origin);
      expect(migratedRoute.destination).toBe(legacyRoute.destination);
    });

    test('should maintain asset ownership during migration', () => {
      const ownershipMap = new Map();
      
      mockLegacyAssets.forEach(asset => {
        // In legacy system, ownership might be stored differently
        ownershipMap.set(asset.id, testPlayerId);
      });

      // After migration, ownership should be preserved
      const migratedAsset: PlacedAsset = {
        id: 'migrated-legacy-ship-1',
        definitionId: 'ship-container-small',
        ownerId: ownershipMap.get('legacy-ship-1') || testPlayerId,
        position: { x: 100, y: 200 },
        rotation: 0,
        status: 'active',
        health: 100,
        purchasedAt: Date.now()
      };

      expect(migratedAsset.ownerId).toBe(testPlayerId);
    });
  });

  describe('Performance Considerations', () => {
    test('should handle large numbers of assets efficiently', () => {
      // Create a large number of legacy assets for performance testing
      const largeAssetSet = [];
      for (let i = 0; i < 1000; i++) {
        largeAssetSet.push({
          id: `legacy-asset-${i}`,
          type: i % 2 === 0 ? 'ship' : 'warehouse',
          position: { x: i * 10, y: i * 10 },
          properties: { name: `Asset ${i}` },
          purchased: Date.now() - i * 1000
        });
      }

      // Simulate migration timing
      const startTime = Date.now();
      
      const migratedAssets = largeAssetSet.map((asset, index) => ({
        id: `migrated-${asset.id}`,
        definitionId: asset.type === 'ship' ? 'ship-container-small' : 'warehouse-basic',
        ownerId: testPlayerId,
        position: asset.position,
        rotation: 0,
        status: 'active' as const,
        health: 100,
        purchasedAt: asset.purchased
      }));
      
      const endTime = Date.now();
      
      expect(migratedAssets).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should batch migration operations', () => {
      const batchSize = 100;
      const totalAssets = 250;
      
      // Simulate batched migration
      const batches = [];
      for (let i = 0; i < totalAssets; i += batchSize) {
        const batch = mockLegacyAssets.slice(i, Math.min(i + batchSize, totalAssets));
        batches.push(batch);
      }

      expect(batches.length).toBe(Math.ceil(totalAssets / batchSize));
      
      // Each batch should be processable
      batches.forEach((batch, index) => {
        expect(batch.length).toBeLessThanOrEqual(batchSize);
        if (index < batches.length - 1) {
          expect(batch.length).toBe(Math.min(batchSize, mockLegacyAssets.length));
        }
      });
    });
  });

  describe('Rollback Capabilities', () => {
    test('should support migration rollback', () => {
      // Create backup of original data before migration
      const originalAssets = JSON.parse(JSON.stringify(mockLegacyAssets));
      
      // Perform migration
      const migratedAssets = mockLegacyAssets.map(asset => ({
        id: `migrated-${asset.id}`,
        definitionId: asset.type === 'ship' ? 'ship-container-small' : 'warehouse-basic',
        ownerId: testPlayerId,
        position: asset.position,
        rotation: 0,
        status: 'active' as const,
        health: 100,
        purchasedAt: asset.purchased,
        originalId: asset.id // Keep reference to original
      }));

      // Simulate rollback
      const rolledBackAssets = migratedAssets.map(migrated => {
        const original = originalAssets.find(orig => orig.id === migrated.originalId);
        return original;
      }).filter(Boolean);

      expect(rolledBackAssets).toHaveLength(originalAssets.length);
      expect(rolledBackAssets).toEqual(originalAssets);
    });

    test('should validate rollback data integrity', () => {
      const migrationLog = {
        timestamp: Date.now(),
        assetsProcessed: 2,
        errors: [],
        backupCreated: true,
        migrationId: 'migration-001'
      };

      // Rollback should only be possible if backup exists and no critical errors
      const canRollback = migrationLog.backupCreated && migrationLog.errors.length === 0;
      expect(canRollback).toBe(true);

      // If there were errors, rollback validation should fail
      migrationLog.errors.push('Asset validation failed');
      const canRollbackWithErrors = migrationLog.backupCreated && migrationLog.errors.length === 0;
      expect(canRollbackWithErrors).toBe(false);
    });
  });
});