// Game-specific types for Flexport

export interface Position {
  x: number;
  y: number;
}

export interface Route {
  id: string;
  name: string;
  startPort: string;
  endPort: string;
  distance: number;
  dangerLevel: number; // 0-10 scale
  waypoints: Position[];
}

export interface Good {
  id: string;
  name: string;
  category: 'raw' | 'manufactured' | 'luxury' | 'perishable';
  basePrice: number;
  weight: number;
  icon: string;
}

export interface Disaster {
  id: string;
  type: 'storm' | 'piracy' | 'mechanical' | 'market_crash';
  severity: number; // 1-10 scale
  affectedArea?: Position & { radius: number };
  duration: number; // in game minutes
  startTime: Date;
}

export interface Staff {
  id: string;
  name: string;
  role: 'captain' | 'navigator' | 'engineer' | 'trader';
  skill: number; // 1-10 scale
  salary: number;
  shipId?: string;
}

export interface Contract {
  id: string;
  clientName: string;
  good: string;
  quantity: number;
  originPort: string;
  destinationPort: string;
  payment: number;
  deadline: Date;
  penalty: number;
  status: 'available' | 'accepted' | 'completed' | 'failed';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  requirement: {
    type: 'cash' | 'ships' | 'contracts' | 'reputation';
    value: number;
  };
}

// Phaser Scene Keys
export enum SceneKeys {
  PRELOADER = 'PreloaderScene',
  MAIN_MENU = 'MainMenuScene',
  WORLD_MAP = 'WorldMapScene',
  PORT = 'PortScene',
  BATTLE = 'BattleScene',
}

// Game Events
export enum GameEvents {
  SHIP_SELECTED = 'ship-selected',
  PORT_SELECTED = 'port-selected',
  ROUTE_CREATED = 'route-created',
  MARKET_UPDATE = 'market-update',
  DISASTER_START = 'disaster-start',
  DISASTER_END = 'disaster-end',
  CONTRACT_ACCEPTED = 'contract-accepted',
  CONTRACT_COMPLETED = 'contract-completed',
  CASH_CHANGED = 'cash-changed',
  SHIP_ARRIVED = 'ship-arrived',
  GAME_PAUSED = 'game-paused',
  GAME_RESUMED = 'game-resumed',
}

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