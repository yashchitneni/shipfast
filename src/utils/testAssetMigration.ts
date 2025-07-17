/**
 * Test script for asset migration functionality
 */

import { useEmpireStore } from '../store/empireStore';
import { AssetType } from '../types/game';
import type { Ship } from '../types/game';

export function testAssetMigration() {
  const store = useEmpireStore.getState();
  
  console.log('=== Asset Migration Test ===');
  
  // Check if legacy data is present
  const hasLegacyData = store.isLegacyDataPresent();
  console.log('Legacy data present:', hasLegacyData);
  
  // Create some test legacy data
  const testShip: Ship = {
    id: 'test-ship-001',
    name: 'Test Cargo Ship',
    type: AssetType.SHIP,
    ownerId: 'test-player',
    purchasedAt: new Date(),
    purchasePrice: 50000,
    maintenanceCost: 500,
    status: 'ACTIVE',
    condition: 85,
    currentPosition: { x: 100, y: 200 },
    createdAt: new Date(),
    updatedAt: new Date(),
    capacity: 2500,
    speed: 25,
    fuelCapacity: 1500,
    fuelLevel: 1200,
    cargoHold: {},
    currentRoute: 'route-001',
    currentPort: 'port-singapore',
    isActive: true,
    efficiency: 90
  };
  
  // Add test ship to legacy structure
  store.addAsset(testShip);
  
  // Check counts before migration
  console.log('\nBefore migration:');
  console.log('Legacy ships:', Object.keys(store.getState().assets.ships).length);
  console.log('PlacedAssets:', store.getState().placedAssets.size);
  
  // Perform migration
  console.log('\nPerforming migration...');
  store.migrateLegacyAssets();
  
  // Check counts after migration
  console.log('\nAfter migration:');
  console.log('Legacy ships:', Object.keys(store.getState().assets.ships).length);
  console.log('PlacedAssets:', store.getState().placedAssets.size);
  
  // Verify the migrated asset
  const migratedAsset = store.getState().placedAssets.get('test-ship-001');
  if (migratedAsset) {
    console.log('\nMigrated asset details:');
    console.log('- ID:', migratedAsset.id);
    console.log('- Definition ID:', migratedAsset.definitionId);
    console.log('- Position:', migratedAsset.position);
    console.log('- Status:', migratedAsset.status);
    console.log('- Health:', migratedAsset.health);
    console.log('- Port ID:', migratedAsset.portId);
    console.log('- Route ID:', migratedAsset.routeId);
  }
  
  // Test hooks
  const ships = store.getAssetsByType('ship' as any);
  console.log('\nShips via getAssetsByType:', ships.length);
  
  console.log('\n=== Test Complete ===');
}