// Route type definitions for Flexport game

import { Position } from '../app/lib/types/assets';

export interface RoutePort {
  id: string;
  name: string;
  position: Position;
  region: string;
  type: 'origin' | 'destination' | 'waypoint';
  arrivalTime?: Date;
  departureTime?: Date;
}

export interface RouteSegment {
  from: string; // Port ID
  to: string; // Port ID
  distance: number; // in nautical miles
  estimatedTime: number; // in hours
  fuelCost: number;
  riskLevel: number; // 0-100
}

export interface RouteValidation {
  isComplete: boolean;
  hasValidPorts: boolean;
  isOwned: boolean;
  meetsRequirements: boolean;
  errors: string[];
  warnings: string[];
}

export interface RouteProfitability {
  revenue: number;
  costs: {
    fuel: number;
    maintenance: number;
    portFees: number;
    crew: number;
    insurance: number;
  };
  netProfit: number;
  profitMargin: number; // percentage
  roi: number; // return on investment
  profitPerDay: number;
}

export interface RoutePerformance {
  totalTrips: number;
  successfulTrips: number;
  failedTrips: number;
  averageProfit: number;
  totalProfit: number;
  averageTime: number;
  onTimePercentage: number;
  disastersEncountered: number;
}

export interface RouteRequirements {
  minAssetCapacity?: number;
  minAssetSpeed?: number;
  requiredLicenses?: string[];
  requiredPorts?: string[];
  maxRiskLevel?: number;
}

export interface Route {
  id: string;
  ownerId: string;
  name: string;
  originPortId: string;
  destinationPortId: string;
  waypoints: string[]; // Port IDs
  segments: RouteSegment[];
  totalDistance: number;
  estimatedTime: number; // total hours
  assignedAssets: string[]; // Asset IDs
  isActive: boolean;
  requirements: RouteRequirements;
  profitability: RouteProfitability;
  performance: RoutePerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteCreationData {
  name: string;
  originPortId: string;
  destinationPortId: string;
  waypoints?: string[];
}

export interface RouteUpdateData {
  name?: string;
  waypoints?: string[];
  isActive?: boolean;
  assignedAssets?: string[];
}

export interface RouteCalculationParams {
  originPortId: string;
  destinationPortId: string;
  waypoints?: string[];
  assetType: 'ship' | 'plane';
  assetCapacity: number;
  assetSpeed: number;
  fuelEfficiency: number;
}

export interface RouteOptimizationResult {
  suggestedWaypoints: string[];
  estimatedSavings: number;
  timeReduction: number;
  fuelSavings: number;
  riskReduction: number;
}

// Route state for real-time tracking
export interface RouteState {
  routeId: string;
  currentSegmentIndex: number;
  progress: number; // 0-100
  estimatedArrival: Date;
  currentPosition: Position;
  status: 'idle' | 'in-transit' | 'loading' | 'unloading' | 'delayed' | 'completed';
  delayReason?: string;
  weatherConditions?: {
    windSpeed: number;
    waveHeight: number;
    visibility: number;
  };
}

// Route events for historical tracking
export interface RouteEvent {
  id: string;
  routeId: string;
  type: 'departure' | 'arrival' | 'delay' | 'incident' | 'completion';
  portId?: string;
  timestamp: Date;
  description: string;
  impact?: {
    timeLost?: number;
    costIncurred?: number;
    revenueImpact?: number;
  };
}