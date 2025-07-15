import { Position, Route, Ship, Port } from '../types/game';

/**
 * Calculate the distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate travel time for a ship between two positions
 */
export function calculateTravelTime(
  distance: number,
  shipSpeed: number,
  weatherModifier: number = 1.0
): number {
  return (distance / shipSpeed) * weatherModifier;
}

/**
 * Calculate profit for a trade route
 */
export function calculateProfit(
  buyPrice: number,
  sellPrice: number,
  quantity: number,
  transportCost: number
): number {
  const revenue = sellPrice * quantity;
  const cost = (buyPrice * quantity) + transportCost;
  return revenue - cost;
}

/**
 * Calculate ship maintenance cost
 */
export function calculateMaintenanceCost(ship: Ship): number {
  const baseCost = {
    cargo: 1000,
    tanker: 1500,
    container: 2000,
  };
  
  const ageFactor = 1.0; // Will increase with ship age
  const conditionFactor = 1.0; // Will increase with ship damage
  
  return baseCost[ship.type] * ageFactor * conditionFactor;
}

/**
 * Calculate market price with fluctuation
 */
export function calculateMarketPrice(
  basePrice: number,
  demand: number,
  supply: number,
  volatility: number = 0.1
): number {
  const demandSupplyRatio = demand / Math.max(supply, 1);
  const priceFactor = Math.pow(demandSupplyRatio, 0.5); // Square root for smoother changes
  const randomFactor = 1 + (Math.random() - 0.5) * volatility;
  
  return Math.round(basePrice * priceFactor * randomFactor);
}

/**
 * Calculate reputation change based on contract completion
 */
export function calculateReputationChange(
  contractValue: number,
  completionTime: number,
  deadline: number,
  isCompleted: boolean
): number {
  if (!isCompleted) {
    return -10; // Penalty for failed contracts
  }
  
  const baseGain = Math.floor(contractValue / 10000); // 1 point per 10k value
  const timeBonus = completionTime < deadline * 0.8 ? 2 : 0; // Bonus for early completion
  
  return baseGain + timeBonus;
}

/**
 * Generate a route between two ports with waypoints
 */
export function generateRoute(
  startPort: Port,
  endPort: Port,
  avoidStorms: boolean = true
): Route {
  const waypoints: Position[] = [startPort.position];
  
  // Simple pathfinding - can be enhanced with A* or similar
  const segments = 5;
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = startPort.position.x + (endPort.position.x - startPort.position.x) * t;
    const y = startPort.position.y + (endPort.position.y - startPort.position.y) * t;
    
    // Add some curve to the route
    const curveOffset = Math.sin(t * Math.PI) * 50;
    waypoints.push({
      x: x + curveOffset,
      y: y + curveOffset * 0.5,
    });
  }
  
  waypoints.push(endPort.position);
  
  const distance = calculateTotalRouteDistance(waypoints);
  
  return {
    id: `route-${startPort.id}-${endPort.id}`,
    name: `${startPort.name} to ${endPort.name}`,
    startPort: startPort.id,
    endPort: endPort.id,
    distance,
    dangerLevel: Math.floor(Math.random() * 5), // Placeholder
    waypoints,
  };
}

/**
 * Calculate total distance of a route through waypoints
 */
export function calculateTotalRouteDistance(waypoints: Position[]): number {
  let totalDistance = 0;
  
  for (let i = 1; i < waypoints.length; i++) {
    totalDistance += calculateDistance(waypoints[i - 1], waypoints[i]);
  }
  
  return totalDistance;
}

/**
 * Check if a position is within a disaster area
 */
export function isInDisasterArea(
  position: Position,
  disasterCenter: Position,
  disasterRadius: number
): boolean {
  const distance = calculateDistance(position, disasterCenter);
  return distance <= disasterRadius;
}

/**
 * Calculate experience needed for next level
 */
export function calculateExperienceForLevel(level: number): number {
  return level * level * 100;
}

/**
 * Format game time to display string
 */
export function formatGameTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}