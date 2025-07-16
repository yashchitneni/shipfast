// Game types for the Empire Store

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  username: string;
  email: string;
  cash: number;
  level: number;
  experience: number;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type AssetType = 'ship' | 'plane' | 'warehouse' | 'infrastructure';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  ownerId: string;
  position: Position;
  status: 'active' | 'inactive' | 'maintenance' | 'transit';
  health: number;
  purchasedAt: number;
  customName?: string;
  updatedAt?: Date;
}

export interface Ship extends Asset {
  type: 'ship';
  subType: 'cargo' | 'tanker' | 'container' | 'passenger';
  capacity: number;
  speed: number;
  range: number;
  currentLocation?: string;
  destination?: string;
  routeId?: string;
  currentLoad?: number;
  updatedAt?: Date;
}

export interface Plane extends Asset {
  type: 'plane';
  subType: 'cargo' | 'passenger' | 'charter';
  capacity: number;
  speed: number;
  range: number;
  currentLocation?: string;
  destination?: string;
  routeId?: string;
  currentLoad?: number;
  updatedAt?: Date;
}

export interface Warehouse extends Asset {
  type: 'warehouse';
  subType: 'standard' | 'cold_storage' | 'distribution' | 'mega';
  storageCapacity: number;
  currentLoad: number;
  portId?: string;
  efficiency: number;
  areaEffect?: {
    radius: number;
    type: 'port_efficiency' | 'risk_reduction' | 'speed_boost';
    value: number;
  };
}

export interface Specialist {
  id: string;
  name: string;
  type: 'captain' | 'engineer' | 'navigator' | 'trader' | 'security';
  level: number;
  experience: number;
  skills: {
    efficiency: number;
    riskReduction: number;
    speedBoost: number;
    costReduction: number;
  };
  salary: number;
  assignedAssetId?: string;
  bonuses: Record<string, number>;
}

export interface Route {
  id: string;
  name: string;
  ownerId: string;
  startPort: string;
  endPort: string;
  waypoints: Position[];
  distance: number;
  dangerLevel: number;
  assignedAssets: string[];
  isActive: boolean;
  performanceData: {
    profitPerDay: number;
    disastersEncountered: number;
    totalTrips: number;
    averageTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketGood {
  id: string;
  name: string;
  category: 'raw' | 'manufactured' | 'luxury' | 'perishable';
  basePrice: number;
  currentPrice: number;
  supply: number;
  demand: number;
  volatility: number;
  icon: string;
}

export interface MarketEvent {
  id: string;
  type: 'price_surge' | 'supply_shortage' | 'demand_spike' | 'disaster' | 'opportunity';
  title: string;
  description: string;
  goodsAffected: string[];
  priceMultiplier: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  severity: 'low' | 'medium' | 'high';
}

export interface AICompanion {
  id: string;
  name: string;
  level: number;
  experience: number;
  personality: 'conservative' | 'balanced' | 'aggressive';
  riskTolerance: number;
  learningProgress: number;
  specializations: string[];
  trustLevel: number;
  lastInteraction: Date;
}

export interface AISuggestion {
  id: string;
  type: 'route_optimization' | 'asset_purchase' | 'market_opportunity' | 'risk_warning';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  potentialProfit?: number;
  potentialRisk?: number;
  actionRequired: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  autoSave: boolean;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  effectsVolume: number;
  notificationsEnabled: boolean;
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  language: string;
  notifications: {
    disasters: boolean;
    marketEvents: boolean;
    routeCompletion: boolean;
    lowCash: boolean;
    maintenance: boolean;
  };
  graphics: {
    quality: 'low' | 'medium' | 'high';
    showEffects: boolean;
    showWeather: boolean;
    showTrails: boolean;
  };
}

export interface GameSession {
  id: string;
  playerId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  gameYear: number;
  gameQuarter: number;
  cashStart: number;
  cashEnd?: number;
  assetsStart: number;
  assetsEnd?: number;
  routesCompleted: number;
  disastersEncountered: number;
  achievements: string[];
  saveData: any;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
}

export interface Transaction {
  id: string;
  playerId: string;
  type: 'asset_purchase' | 'asset_sale' | 'route_profit' | 'maintenance' | 'disaster_loss' | 'market_trade';
  amount: number;
  description: string;
  assetId?: string;
  routeId?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Scene Keys
export const SceneKeys = {
  PRELOADER: 'PreloaderScene',
  MAIN_MENU: 'MainMenuScene',
  WORLD_MAP: 'WorldMapScene',
  PORT_VIEW: 'PortViewScene',
  MARKET: 'MarketScene',
  ROUTE_PLANNER: 'RoutePlannerScene'
} as const;

// Asset Keys
export const AssetKeys = {
  // UI Assets
  UI_PANEL: 'ui-panel',
  UI_BUTTON: 'ui-button',
  UI_ICON_CASH: 'ui-icon-cash',
  UI_ICON_REPUTATION: 'ui-icon-reputation',
  
  // Map Assets
  MAP_OCEAN: 'map-ocean',
  MAP_LAND: 'map-land',
  
  // Port Assets
  PORT_SMALL: 'port-small',
  PORT_MEDIUM: 'port-medium',
  PORT_LARGE: 'port-large',
  
  // Ship Assets
  SHIP_CARGO: 'ship-cargo',
  SHIP_TANKER: 'ship-tanker',
  SHIP_CONTAINER: 'ship-container',
  
  // Effect Assets
  EFFECT_WAKE: 'effect-wake',
  EFFECT_STORM: 'effect-storm',
  EFFECT_EXPLOSION: 'effect-explosion',
  
  // Audio Assets
  AUDIO_OCEAN_AMBIENT: 'audio-ocean-ambient',
  AUDIO_PORT_AMBIENT: 'audio-port-ambient',
  AUDIO_SHIP_HORN: 'audio-ship-horn',
  AUDIO_CASH_REGISTER: 'audio-cash-register',
  AUDIO_ALARM: 'audio-alarm',
} as const;

// Game Events
export const GameEvents = {
  PLAYER_CASH_UPDATED: 'player-cash-updated',
  ASSET_PURCHASED: 'asset-purchased',
  ASSET_SOLD: 'asset-sold',
  ROUTE_COMPLETED: 'route-completed',
  DISASTER_OCCURRED: 'disaster-occurred',
  MARKET_EVENT: 'market-event',
  ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
  LEVEL_UP: 'level-up'
} as const; 