/**
 * Asset Migration Utilities
 * 
 * Provides utilities for migrating from the legacy asset structure
 * to the modern placedAssets Map structure.
 */

import { AssetType } from '../types/game';
import type { Ship, Plane, Warehouse, Specialist, Asset } from '../types/game';
import type { PlacedAsset } from '../../app/lib/types/assets';

/**
 * Converts a legacy asset to the modern PlacedAsset format
 */
export function legacyAssetToPlacedAsset(
  asset: Asset,
  definitionId: string
): PlacedAsset {
  const baseAsset: PlacedAsset = {
    id: asset.id,
    definitionId,
    ownerId: asset.ownerId || 'unknown',
    position: asset.currentPosition || { x: 0, y: 0 },
    rotation: 0,
    status: asset.status === 'ACTIVE' ? 'active' : 
            asset.status === 'INACTIVE' ? 'inactive' : 
            asset.status === 'MAINTENANCE' ? 'maintenance' : 
            'active',
    health: asset.condition || 100,
    purchasedAt: asset.purchasedAt?.getTime() || Date.now(),
    customName: asset.customName
  };

  // Handle specific asset type properties
  if (asset.type === AssetType.SHIP || asset.type === AssetType.PLANE) {
    const transportAsset = asset as Ship | Plane;
    if (transportAsset.currentRoute) {
      baseAsset.routeId = transportAsset.currentRoute;
      baseAsset.status = 'transit';
    }
    if (transportAsset.currentPosition) {
      baseAsset.position = transportAsset.currentPosition;
    }
  }

  if (asset.type === AssetType.WAREHOUSE) {
    const warehouseAsset = asset as Warehouse;
    if (warehouseAsset.location) {
      baseAsset.portId = warehouseAsset.location;
    }
  }

  return baseAsset;
}

/**
 * Determines the definition ID for a legacy asset
 */
export function getDefinitionIdForLegacyAsset(asset: Asset): string {
  // Map asset properties to definition IDs
  // This is a simplified mapping - in production, this would need to be more sophisticated
  
  switch (asset.type) {
    case AssetType.SHIP:
      const ship = asset as Ship;
      // Map based on capacity/class
      if (ship.capacity <= 1000) return 'ship-cargo-small';
      if (ship.capacity <= 5000) return 'ship-cargo-medium';
      return 'ship-cargo-large';
      
    case AssetType.PLANE:
      const plane = asset as Plane;
      // Map based on range/capacity
      if (plane.range <= 500) return 'plane-cargo-small';
      if (plane.range <= 2000) return 'plane-cargo-medium';
      return 'plane-cargo-large';
      
    case AssetType.WAREHOUSE:
      const warehouse = asset as Warehouse;
      // Map based on capacity
      if (warehouse.capacity <= 10000) return 'warehouse-small';
      if (warehouse.capacity <= 50000) return 'warehouse-medium';
      return 'warehouse-large';
      
    case AssetType.SPECIALIST:
      const specialist = asset as Specialist;
      // Map based on specialty
      switch (specialist.specialty) {
        case 'NEGOTIATOR': return 'specialist-negotiator';
        case 'LOGISTICS': return 'specialist-logistics';
        case 'ENGINEER': return 'specialist-engineer';
        case 'FINANCE': return 'specialist-finance';
        default: return 'specialist-general';
      }
      
    default:
      return 'unknown-asset';
  }
}

/**
 * Migrates all legacy assets to the modern format
 */
export function migrateLegacyAssets(legacyAssets: {
  ships: Record<string, Ship>;
  planes: Record<string, Plane>;
  warehouses: Record<string, Warehouse>;
  specialists: Record<string, Specialist>;
}): Map<string, PlacedAsset> {
  const placedAssets = new Map<string, PlacedAsset>();

  // Migrate ships
  Object.values(legacyAssets.ships).forEach(ship => {
    const definitionId = getDefinitionIdForLegacyAsset(ship);
    const placedAsset = legacyAssetToPlacedAsset(ship, definitionId);
    placedAssets.set(placedAsset.id, placedAsset);
  });

  // Migrate planes
  Object.values(legacyAssets.planes).forEach(plane => {
    const definitionId = getDefinitionIdForLegacyAsset(plane);
    const placedAsset = legacyAssetToPlacedAsset(plane, definitionId);
    placedAssets.set(placedAsset.id, placedAsset);
  });

  // Migrate warehouses
  Object.values(legacyAssets.warehouses).forEach(warehouse => {
    const definitionId = getDefinitionIdForLegacyAsset(warehouse);
    const placedAsset = legacyAssetToPlacedAsset(warehouse, definitionId);
    placedAssets.set(placedAsset.id, placedAsset);
  });

  // Migrate specialists
  Object.values(legacyAssets.specialists).forEach(specialist => {
    const definitionId = getDefinitionIdForLegacyAsset(specialist);
    const placedAsset = legacyAssetToPlacedAsset(specialist, definitionId);
    placedAssets.set(placedAsset.id, placedAsset);
  });

  return placedAssets;
}

/**
 * Creates a proxy that redirects legacy asset access to placedAssets
 */
export function createLegacyAssetProxy(
  placedAssets: Map<string, PlacedAsset>,
  assetType: AssetType
): Record<string, any> {
  return new Proxy({}, {
    get: (target, prop: string) => {
      // Find the asset in placedAssets
      for (const [id, asset] of placedAssets) {
        if (id === prop) {
          // Convert back to legacy format for compatibility
          return placedAssetToLegacyAsset(asset, assetType);
        }
      }
      return undefined;
    },
    
    has: (target, prop: string) => {
      return placedAssets.has(prop);
    },
    
    ownKeys: () => {
      // Return all asset IDs of the specified type
      const keys: string[] = [];
      for (const [id, asset] of placedAssets) {
        const definitionId = asset.definitionId;
        if (isAssetTypeMatch(definitionId, assetType)) {
          keys.push(id);
        }
      }
      return keys;
    },
    
    getOwnPropertyDescriptor: (target, prop: string) => {
      if (placedAssets.has(prop)) {
        return {
          configurable: true,
          enumerable: true,
          value: target[prop as keyof typeof target]
        };
      }
      return undefined;
    }
  });
}

/**
 * Converts a PlacedAsset back to legacy format for compatibility
 */
export function placedAssetToLegacyAsset(
  asset: PlacedAsset,
  assetType: AssetType
): Asset {
  const baseAsset = {
    id: asset.id,
    name: asset.customName || `${assetType} ${asset.id}`,
    type: assetType,
    ownerId: asset.ownerId,
    purchasedAt: new Date(asset.purchasedAt),
    purchasePrice: 0, // Would need to look up from definition
    maintenanceCost: 0, // Would need to look up from definition
    status: asset.status === 'active' ? 'ACTIVE' as const :
            asset.status === 'inactive' ? 'INACTIVE' as const :
            asset.status === 'maintenance' ? 'MAINTENANCE' as const :
            'ACTIVE' as const,
    condition: asset.health,
    currentPosition: asset.position,
    createdAt: new Date(asset.purchasedAt),
    updatedAt: new Date()
  };

  // Add type-specific properties
  switch (assetType) {
    case AssetType.SHIP:
      return {
        ...baseAsset,
        capacity: 1000, // Default values - would need to look up from definition
        speed: 20,
        fuelCapacity: 1000,
        fuelLevel: 800,
        cargoHold: {},
        currentRoute: asset.routeId,
        currentPort: asset.portId
      } as Ship;
      
    case AssetType.PLANE:
      return {
        ...baseAsset,
        capacity: 100,
        speed: 500,
        range: 1000,
        fuelEfficiency: 10,
        cargoHold: {},
        currentRoute: asset.routeId,
        currentAirport: asset.portId
      } as Plane;
      
    case AssetType.WAREHOUSE:
      return {
        ...baseAsset,
        capacity: 10000,
        usedCapacity: 0,
        location: asset.portId || '',
        inventory: {},
        securityLevel: 'BASIC' as const
      } as Warehouse;
      
    case AssetType.SPECIALIST:
      return {
        ...baseAsset,
        specialty: 'LOGISTICS' as const, // Would need to determine from definitionId
        level: 1,
        experience: 0,
        skills: {},
        assignedTo: asset.routeId
      } as Specialist;
      
    default:
      return baseAsset as Asset;
  }
}

/**
 * Checks if a definition ID matches an asset type
 */
function isAssetTypeMatch(definitionId: string, assetType: AssetType): boolean {
  switch (assetType) {
    case AssetType.SHIP:
      return definitionId.startsWith('ship-');
    case AssetType.PLANE:
      return definitionId.startsWith('plane-');
    case AssetType.WAREHOUSE:
      return definitionId.startsWith('warehouse-');
    case AssetType.SPECIALIST:
      return definitionId.startsWith('specialist-');
    default:
      return false;
  }
}

/**
 * Validates that all assets have been successfully migrated
 */
export function validateMigration(
  legacyAssets: {
    ships: Record<string, Ship>;
    planes: Record<string, Plane>;
    warehouses: Record<string, Warehouse>;
    specialists: Record<string, Specialist>;
  },
  placedAssets: Map<string, PlacedAsset>
): { success: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check all ships migrated
  Object.keys(legacyAssets.ships).forEach(id => {
    if (!placedAssets.has(id)) {
      errors.push(`Ship ${id} not found in migrated assets`);
    }
  });
  
  // Check all planes migrated
  Object.keys(legacyAssets.planes).forEach(id => {
    if (!placedAssets.has(id)) {
      errors.push(`Plane ${id} not found in migrated assets`);
    }
  });
  
  // Check all warehouses migrated
  Object.keys(legacyAssets.warehouses).forEach(id => {
    if (!placedAssets.has(id)) {
      errors.push(`Warehouse ${id} not found in migrated assets`);
    }
  });
  
  // Check all specialists migrated
  Object.keys(legacyAssets.specialists).forEach(id => {
    if (!placedAssets.has(id)) {
      errors.push(`Specialist ${id} not found in migrated assets`);
    }
  });
  
  return {
    success: errors.length === 0,
    errors
  };
}