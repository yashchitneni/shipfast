// Player Inventory Types

export interface PlayerInventoryItem {
  id: string;
  playerId: string;
  itemId: string;
  quantity: number;
  locationType: 'port' | 'warehouse' | 'ship';
  locationId: string;
  acquiredPrice: number;
  acquiredAt: Date;
  lastUpdated: Date;
}

export interface RouteCargo {
  id: string;
  routeId: string;
  assetId: string;
  itemId: string;
  quantity: number;
  status: 'loading' | 'in_transit' | 'delivered' | 'cancelled';
  originPort: string;
  destinationPort: string;
  loadingPrice: number;
  expectedArrival: Date | null;
  actualArrival: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLocation {
  type: 'port' | 'warehouse' | 'ship';
  id: string;
  name: string;
  capacity?: number;
  currentLoad?: number;
}

export interface ProfitCalculation {
  itemId: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  transportCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

// Database insert/update types
export interface CreateInventoryItem {
  playerId: string;
  itemId: string;
  quantity: number;
  locationType: 'port' | 'warehouse' | 'ship';
  locationId: string;
  acquiredPrice: number;
}

export interface CreateRouteCargo {
  routeId: string;
  assetId: string;
  itemId: string;
  quantity: number;
  originPort: string;
  destinationPort: string;
  loadingPrice: number;
}

export interface InventoryTransfer {
  fromLocation: InventoryLocation;
  toLocation: InventoryLocation;
  itemId: string;
  quantity: number;
  playerId: string;
}