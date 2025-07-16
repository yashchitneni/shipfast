// Asset type definitions for Flexport game

export type AssetCategory = 'transport' | 'storage' | 'support' | 'financial';
export type AssetType = 'ship' | 'plane' | 'warehouse' | 'infrastructure';
export type AssetSubType = 
  | 'container-vessel' 
  | 'tanker' 
  | 'cargo-aircraft'
  | 'passenger-aircraft' 
  | 'storage-facility'
  | 'distribution-center'
  | 'route'
  | 'license'
  | 'specialist';

export interface Position {
  x: number;
  y: number;
}

export interface PortNode {
  id: string;
  name: string;
  position: Position;
  region: string;
  capacity: number;
  connectedRoutes: string[];
}

export interface AssetDefinition {
  id: string;
  name: string;
  type: AssetType;
  subType: AssetSubType;
  category: AssetCategory;
  cost: number;
  maintenanceCost: number;
  capacity?: number; // For transport assets: cargo capacity
  storageCapacity?: number; // For warehouses: storage capacity
  speed?: number; // Movement speed for transport assets
  range?: number; // Maximum range for planes/ships
  efficiency: number;
  description: string;
  requirements?: {
    minLevel?: number;
    licenses?: string[];
    ports?: string[];
  };
  bonuses?: {
    efficiency?: number;
    speed?: number;
    capacity?: number;
    riskReduction?: number;
    portEfficiencyBoost?: number; // Warehouse boost to nearby ports
  };
  areaEffect?: { // Area effect for warehouses
    radius: number;
    type: 'port_efficiency' | 'risk_reduction' | 'speed_boost';
    value: number;
  };
}

export interface PlacedAsset {
  id: string;
  definitionId: string;
  ownerId: string;
  position: Position;
  rotation: number;
  portId?: string; // For port-snapped assets
  routeId?: string; // For assets assigned to routes
  status: 'active' | 'inactive' | 'maintenance' | 'transit';
  health: number;
  purchasedAt: number;
  lastMaintenance?: number;
  customName?: string;
  currentLoad?: number; // Current cargo/storage utilization
  destination?: string; // For transport assets in transit
}

export interface AssetPreview {
  definitionId: string;
  position: Position;
  rotation: number;
  isValid: boolean;
  snapToPort?: string;
  validationErrors?: string[];
}

export interface AssetValidation {
  canAfford: boolean;
  meetsRequirements: boolean;
  hasValidPosition: boolean;
  noConflicts: boolean;
  errors: string[];
  warnings: string[];
}

export interface AssetStats {
  totalAssets: number;
  assetsByType: Record<AssetType, number>;
  assetsByCategory: Record<AssetCategory, number>;
  totalValue: number;
  totalMaintenance: number;
  utilizationRate: number;
}