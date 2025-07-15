// Asset loader utility for loading JSON definitions

import { AssetDefinition } from './types/assets';

// Import JSON files
import shipsData from '../assets/definitions/ships.json';
import planesData from '../assets/definitions/planes.json';
import warehousesData from '../assets/definitions/warehouses.json';
import infrastructureData from '../assets/definitions/infrastructure.json';

export async function loadAllAssetDefinitions(): Promise<AssetDefinition[]> {
  const allDefinitions: AssetDefinition[] = [];
  
  // Load ships
  if (shipsData.ships) {
    allDefinitions.push(...shipsData.ships as AssetDefinition[]);
  }
  
  // Load planes
  if (planesData.planes) {
    allDefinitions.push(...planesData.planes as AssetDefinition[]);
  }
  
  // Load warehouses
  if (warehousesData.warehouses) {
    allDefinitions.push(...warehousesData.warehouses as AssetDefinition[]);
  }
  
  // Load infrastructure
  if (infrastructureData.infrastructure) {
    allDefinitions.push(...infrastructureData.infrastructure as AssetDefinition[]);
  }
  
  return allDefinitions;
}

export function loadAssetsByType(type: string): AssetDefinition[] {
  switch (type) {
    case 'ship':
      return shipsData.ships as AssetDefinition[];
    case 'plane':
      return planesData.planes as AssetDefinition[];
    case 'warehouse':
      return warehousesData.warehouses as AssetDefinition[];
    case 'infrastructure':
      return infrastructureData.infrastructure as AssetDefinition[];
    default:
      return [];
  }
}

export function getAssetById(id: string): AssetDefinition | null {
  const allAssets = [
    ...shipsData.ships,
    ...planesData.planes,
    ...warehousesData.warehouses,
    ...infrastructureData.infrastructure
  ];
  
  return (allAssets.find(asset => asset.id === id) as AssetDefinition) || null;
}

// Mock port data - in a real game this would come from a map/database
export function getMockPortNodes() {
  return [
    {
      id: 'port-oakland',
      name: 'Port of Oakland',
      position: { x: 100, y: 200 },
      region: 'North America',
      capacity: 10000,
      connectedRoutes: []
    },
    {
      id: 'port-shanghai',
      name: 'Port of Shanghai',
      position: { x: 800, y: 300 },
      region: 'Asia',
      capacity: 20000,
      connectedRoutes: []
    },
    {
      id: 'port-rotterdam',
      name: 'Port of Rotterdam',
      position: { x: 450, y: 150 },
      region: 'Europe',
      capacity: 15000,
      connectedRoutes: []
    },
    {
      id: 'port-singapore',
      name: 'Port of Singapore',
      position: { x: 750, y: 450 },
      region: 'Asia',
      capacity: 18000,
      connectedRoutes: []
    },
    {
      id: 'port-losangeles',
      name: 'Port of Los Angeles',
      position: { x: 50, y: 350 },
      region: 'North America',
      capacity: 12000,
      connectedRoutes: []
    }
  ];
}