// Route calculation utilities for Flexport game

import { PortNode } from '../app/lib/types/assets';
import { RouteSegment, RouteProfitability } from '../types/route';

// Constants from CSDD
const FUEL_COST_PER_UNIT = 2.5;
const PORT_FEE_BASE = 500;
const CREW_COST_PER_HOUR = 100;
const INSURANCE_RATE = 0.05; // 5% of revenue
const CARGO_VALUE_PER_UNIT = 10;
const DISTANCE_BONUS_RATE = 0.001; // 0.1% per 100 nautical miles

// Calculate great circle distance between two points (nautical miles)
export const calculateNauticalDistance = (from: PortNode, to: PortNode): number => {
  // Convert pixel coordinates to approximate lat/lon
  // This is a simplified calculation - in production would use real coordinates
  const lat1 = (from.position.y / 100) * 90; // Scale to -90 to 90
  const lon1 = (from.position.x / 100) * 180; // Scale to -180 to 180
  const lat2 = (to.position.y / 100) * 90;
  const lon2 = (to.position.x / 100) * 180;
  
  const R = 3440.065; // Radius of Earth in nautical miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Minimum distance of 100nm for game balance
  return Math.max(100, distance);
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Calculate fuel consumption based on distance and efficiency
export const calculateFuelCost = (
  distance: number,
  fuelEfficiency: number,
  assetType: 'ship' | 'plane'
): number => {
  // Planes use more fuel per distance but travel faster
  const fuelMultiplier = assetType === 'plane' ? 1.5 : 1.0;
  const fuelUnits = (distance / fuelEfficiency) * fuelMultiplier;
  return fuelUnits * FUEL_COST_PER_UNIT;
};

// Calculate travel time based on distance and speed
export const calculateTravelTime = (
  distance: number,
  speed: number,
  assetType: 'ship' | 'plane'
): number => {
  // Add loading/unloading time
  const portTime = assetType === 'ship' ? 6 : 2; // Hours
  const travelTime = distance / speed;
  return travelTime + portTime;
};

// Calculate risk level for a route segment
export const calculateRiskLevel = (
  from: PortNode,
  to: PortNode,
  distance: number
): number => {
  let risk = 0;
  
  // Distance risk (longer routes = higher risk)
  risk += Math.min(distance / 100, 20); // Max 20% from distance
  
  // Cross-region risk
  if (from.region !== to.region) {
    risk += 15;
  }
  
  // Port capacity risk (smaller ports = higher risk)
  const avgCapacity = (from.capacity + to.capacity) / 2;
  if (avgCapacity < 1000) {
    risk += 10;
  } else if (avgCapacity < 5000) {
    risk += 5;
  }
  
  // Cap risk at 50%
  return Math.min(risk, 50);
};

// Calculate route segment details
export const calculateRouteSegment = (
  from: PortNode,
  to: PortNode,
  assetSpeed: number,
  fuelEfficiency: number,
  assetType: 'ship' | 'plane'
): RouteSegment => {
  const distance = calculateNauticalDistance(from, to);
  const estimatedTime = calculateTravelTime(distance, assetSpeed, assetType);
  const fuelCost = calculateFuelCost(distance, fuelEfficiency, assetType);
  const riskLevel = calculateRiskLevel(from, to, distance);
  
  return {
    from: from.id,
    to: to.id,
    distance,
    estimatedTime,
    fuelCost,
    riskLevel
  };
};

// Calculate complete route profitability
export const calculateRouteProfitability = (
  segments: RouteSegment[],
  capacity: number,
  maintenanceCostPerHour: number,
  assetType: 'ship' | 'plane'
): RouteProfitability => {
  // Calculate totals
  const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
  const totalTime = segments.reduce((sum, seg) => sum + seg.estimatedTime, 0);
  const totalFuelCost = segments.reduce((sum, seg) => sum + seg.fuelCost, 0);
  const maxRisk = Math.max(...segments.map(seg => seg.riskLevel));
  
  // Revenue calculation
  const baseRevenue = capacity * CARGO_VALUE_PER_UNIT;
  const distanceBonus = totalDistance * DISTANCE_BONUS_RATE;
  const riskMultiplier = 1 + (maxRisk / 100); // Higher risk = higher reward
  const revenue = baseRevenue * (1 + distanceBonus) * riskMultiplier;
  
  // Cost calculations
  const portFees = PORT_FEE_BASE * (segments.length + 1); // Origin + waypoints + destination
  const maintenanceCost = maintenanceCostPerHour * totalTime;
  const crewCost = CREW_COST_PER_HOUR * totalTime;
  const insuranceCost = revenue * INSURANCE_RATE;
  
  // Speed penalty for planes (higher operational costs)
  const operationalMultiplier = assetType === 'plane' ? 1.3 : 1.0;
  
  const costs = {
    fuel: totalFuelCost,
    maintenance: maintenanceCost * operationalMultiplier,
    portFees: portFees,
    crew: crewCost * operationalMultiplier,
    insurance: insuranceCost
  };
  
  const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const netProfit = revenue - totalCosts;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  const profitPerDay = totalTime > 0 ? (netProfit / totalTime) * 24 : 0;
  
  return {
    revenue,
    costs,
    netProfit,
    profitMargin,
    roi,
    profitPerDay
  };
};

// Validate route requirements
export const validateRouteRequirements = (
  route: {
    segments: RouteSegment[];
    originPortId: string;
    destinationPortId: string;
  },
  asset: {
    capacity: number;
    speed: number;
    range?: number;
    type: 'ship' | 'plane';
  },
  playerLicenses: string[],
  ownedPorts: string[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if route has valid endpoints
  if (!route.originPortId || !route.destinationPortId) {
    errors.push('Route must have origin and destination ports');
  }
  
  // Check if route is complete
  if (route.segments.length === 0) {
    errors.push('Route has no valid segments');
  }
  
  // Check asset capacity
  if (asset.capacity < 100) {
    errors.push('Asset capacity too low for profitable routes');
  }
  
  // Check range for planes
  if (asset.type === 'plane' && asset.range) {
    const maxSegmentDistance = Math.max(...route.segments.map(s => s.distance));
    if (maxSegmentDistance > asset.range) {
      errors.push('Route segment exceeds aircraft range');
    }
  }
  
  // Check port ownership (simplified - in real game would check actual requirements)
  const routePorts = [route.originPortId, route.destinationPortId];
  const hasPortAccess = routePorts.some(portId => ownedPorts.includes(portId));
  if (!hasPortAccess && ownedPorts.length > 0) {
    errors.push('No access to route ports');
  }
  
  // Check licenses (simplified)
  const totalDistance = route.segments.reduce((sum, seg) => sum + seg.distance, 0);
  if (totalDistance > 5000 && !playerLicenses.includes('international-shipping')) {
    errors.push('International shipping license required for long routes');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Find optimal waypoints for a route (simplified A* pathfinding)
export const findOptimalWaypoints = (
  origin: PortNode,
  destination: PortNode,
  allPorts: PortNode[],
  maxWaypoints: number = 2
): string[] => {
  // This is a simplified implementation
  // In production, would use proper pathfinding with:
  // - Actual geographic constraints
  // - Port availability and capacity
  // - Political/economic factors
  // - Weather patterns
  
  const directDistance = calculateNauticalDistance(origin, destination);
  
  // If direct route is short enough, no waypoints needed
  if (directDistance < 2000) {
    return [];
  }
  
  // Find ports that could serve as waypoints
  const potentialWaypoints = allPorts
    .filter(port => 
      port.id !== origin.id && 
      port.id !== destination.id &&
      port.capacity >= 1000 // Minimum capacity for waypoint
    )
    .map(port => {
      const distFromOrigin = calculateNauticalDistance(origin, port);
      const distToDestination = calculateNauticalDistance(port, destination);
      const totalDistance = distFromOrigin + distToDestination;
      const efficiency = directDistance / totalDistance; // Higher is better
      
      return {
        portId: port.id,
        efficiency,
        totalDistance
      };
    })
    .filter(wp => wp.efficiency > 0.7) // Only consider reasonably efficient waypoints
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, maxWaypoints);
  
  return potentialWaypoints.map(wp => wp.portId);
};

// Calculate estimated completion time for active route
export const calculateEstimatedArrival = (
  currentProgress: number, // 0-100
  totalTime: number, // hours
  startTime: Date
): Date => {
  const elapsedRatio = currentProgress / 100;
  const elapsedHours = totalTime * elapsedRatio;
  const remainingHours = totalTime - elapsedHours;
  
  const arrival = new Date(startTime);
  arrival.setHours(arrival.getHours() + totalTime);
  
  return arrival;
};

// Calculate current position along route
export const calculateCurrentPosition = (
  segments: RouteSegment[],
  currentSegmentIndex: number,
  segmentProgress: number, // 0-100
  ports: Map<string, PortNode>
): { x: number; y: number } => {
  if (segments.length === 0 || currentSegmentIndex >= segments.length) {
    return { x: 0, y: 0 };
  }
  
  const segment = segments[currentSegmentIndex];
  const fromPort = ports.get(segment.from);
  const toPort = ports.get(segment.to);
  
  if (!fromPort || !toPort) {
    return { x: 0, y: 0 };
  }
  
  // Linear interpolation between ports
  const ratio = segmentProgress / 100;
  const x = fromPort.position.x + (toPort.position.x - fromPort.position.x) * ratio;
  const y = fromPort.position.y + (toPort.position.y - fromPort.position.y) * ratio;
  
  return { x, y };
};