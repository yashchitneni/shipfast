// Asset type definitions for Flexport game

export type AssetCategory = 'transport' | 'storage' | 'support' | 'financial';
export type AssetType = 'ship' | 'plane' | 'warehouse' | 'infrastructure';
export type AssetSubType = 
  | 'container-vessel' 
  | 'tanker' 
  | 'cargo-aircraft' 
  | 'storage-facility'
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
  capacity?: number;
  speed?: number;
  range?: number;
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