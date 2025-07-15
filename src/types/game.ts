// Game type definitions for Flexport

// Player types
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

// Asset types
export enum AssetType {
  SHIP = 'SHIP',
  PLANE = 'PLANE',
  WAREHOUSE = 'WAREHOUSE',
  SPECIALIST = 'SPECIALIST'
}

export enum ShipType {
  CONTAINER = 'CONTAINER',
  TANKER = 'TANKER',
  BULK_CARRIER = 'BULK_CARRIER'
}

export enum PlaneType {
  CARGO = 'CARGO',
  EXPRESS = 'EXPRESS'
}

export interface BaseAsset {
  id: string;
  playerId: string;
  name: string;
  type: AssetType;
  purchasePrice: number;
  maintenanceCost: number;
  efficiency: number; // 0-100
  condition: number; // 0-100
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ship extends BaseAsset {
  type: AssetType.SHIP;
  shipType: ShipType;
  capacity: number;
  speed: number; // knots
  fuelEfficiency: number;
  currentLocation?: string;
  currentRoute?: string;
}

export interface Plane extends BaseAsset {
  type: AssetType.PLANE;
  planeType: PlaneType;
  capacity: number;
  speed: number; // km/h
  fuelEfficiency: number;
  range: number; // km
  currentLocation?: string;
  currentRoute?: string;
}

export interface Warehouse extends BaseAsset {
  type: AssetType.WAREHOUSE;
  location: string;
  capacity: number;
  usedCapacity: number;
  securityLevel: number;
  automationLevel: number;
}

export interface Specialist extends BaseAsset {
  type: AssetType.SPECIALIST;
  specialization: string;
  skillLevel: number;
  salary: number;
  assignedTo?: string; // Asset ID
}

export type Asset = Ship | Plane | Warehouse | Specialist;

// Route types
export enum RouteType {
  SEA = 'SEA',
  AIR = 'AIR',
  HYBRID = 'HYBRID'
}

export interface RouteNode {
  id: string;
  location: string;
  arrivalTime?: Date;
  departureTime?: Date;
}

export interface Route {
  id: string;
  playerId: string;
  name: string;
  type: RouteType;
  origin: string;
  destination: string;
  waypoints: RouteNode[];
  distance: number;
  estimatedTime: number; // hours
  profitability: number;
  risk: number; // 0-100
  efficiency: number; // 0-100
  isActive: boolean;
  assignedAssets: string[]; // Asset IDs
  createdAt: Date;
  updatedAt: Date;
}

// Market types
export interface MarketGood {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  currentPrice: number;
  volatility: number;
  demand: number;
  supply: number;
  lastUpdated: Date;
}

export interface MarketEvent {
  id: string;
  type: 'PRICE_SURGE' | 'PRICE_CRASH' | 'SHORTAGE' | 'OVERSUPPLY' | 'DISASTER';
  affectedGoods: string[];
  affectedRoutes: string[];
  impact: number; // -100 to 100
  duration: number; // hours
  startTime: Date;
  endTime: Date;
  description: string;
}

// AI Companion types
export enum AICompanionMood {
  HAPPY = 'HAPPY',
  NEUTRAL = 'NEUTRAL',
  CONCERNED = 'CONCERNED',
  EXCITED = 'EXCITED',
  FRUSTRATED = 'FRUSTRATED'
}

export interface AICompanion {
  id: string;
  playerId: string;
  name: string;
  level: number;
  experience: number;
  mood: AICompanionMood;
  loyalty: number; // 0-100
  riskTolerance: number; // 0-100
  focusAreas: string[];
  trainingData: {
    successfulRoutes: number;
    failedRoutes: number;
    profitGenerated: number;
    disastersHandled: number;
  };
  suggestions: AISuggestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AISuggestion {
  id: string;
  type: 'ROUTE' | 'ASSET' | 'MARKET' | 'RISK';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  potentialProfit?: number;
  riskLevel?: number;
  createdAt: Date;
  expiresAt: Date;
  isRead: boolean;
  isActedUpon: boolean;
}

// Game state types
export interface GameSettings {
  soundEnabled: boolean;
  musicVolume: number;
  effectsVolume: number;
  notificationsEnabled: boolean;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // minutes
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  language: string;
}

export interface GameSession {
  id: string;
  playerId: string;
  startTime: Date;
  lastSaveTime: Date;
  playTime: number; // seconds
  isActive: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'ACHIEVEMENT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
}

// Transaction types
export interface Transaction {
  id: string;
  playerId: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'LOAN';
  category: string;
  amount: number;
  description: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: Date;
}