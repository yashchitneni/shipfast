/**
 * Port Data Generators for Development and Testing
 * These utilities generate realistic port, market, and economic data
 * based on the comprehensive port definitions
 */

import portData from '@/app/assets/definitions/ports.json';
import marketGoods from '@/app/assets/definitions/market-goods.json';
import portEconomics from '@/app/assets/definitions/port-economics.json';

export interface GeneratedPortData {
  portId: string;
  portName: string;
  country: string;
  currentCapacity: number;
  utilization: number;
  goods: GeneratedGoodData[];
  infrastructure: {
    docks: { total: number; available: number };
    cranes: { total: number; operational: number };
    warehouses: { total: number; capacity: number; used: number };
  };
}

export interface GeneratedGoodData {
  goodId: string;
  name: string;
  currentPrice: number;
  basePrice: number;
  supply: number;
  demand: number;
  trend: 'rising' | 'falling' | 'stable';
  inventory: number;
}

export interface GeneratedRouteData {
  routeId: string;
  originPort: string;
  destinationPort: string;
  distance: number;
  estimatedDuration: number;
  profitability: number;
  recommendedGoods: string[];
}

/**
 * Generate realistic port data with current market conditions
 */
export function generatePortData(portId: string): GeneratedPortData | null {
  const port = portData.ports.find(p => p.id === portId);
  if (!port) return null;

  const region = portEconomics.portRegionMapping[portId as keyof typeof portEconomics.portRegionMapping];
  const regionalModifiers = portEconomics.portEconomics.regionalModifiers[region] || {};
  
  // Generate infrastructure status
  const utilizationRate = 0.6 + Math.random() * 0.3; // 60-90% utilization
  const operationalRate = 0.85 + Math.random() * 0.15; // 85-100% operational
  
  // Generate goods data based on port's imports/exports
  const relevantGoods = [
    ...port.majorExports.map(g => ({ id: g, type: 'export' })),
    ...port.majorImports.map(g => ({ id: g, type: 'import' }))
  ];

  const goods: GeneratedGoodData[] = relevantGoods.map(({ id, type }) => {
    const goodDef = marketGoods.marketGoods.find(g => g.id === id);
    if (!goodDef) return null;

    const regionalMod = regionalModifiers[id] || { supply: 1, demand: 1 };
    const portMod = port.economicModifiers[id] || 1;
    
    // Calculate supply and demand
    const baseSupply = 1000 + Math.random() * 4000;
    const baseDemand = 1000 + Math.random() * 4000;
    
    const supply = type === 'export' 
      ? baseSupply * regionalMod.supply * 1.3 
      : baseSupply * regionalMod.supply * 0.7;
      
    const demand = type === 'import'
      ? baseDemand * regionalMod.demand * 1.3
      : baseDemand * regionalMod.demand * 0.7;
    
    // Calculate price based on supply/demand
    const supplyDemandRatio = supply / demand;
    const priceModifier = Math.pow(1 / supplyDemandRatio, 0.5);
    // Clamp price modifier to prevent extreme values
    const clampedPriceModifier = Math.min(Math.max(priceModifier, 0.4), 2.0);
    const currentPrice = goodDef.basePrice * portMod * clampedPriceModifier * (0.9 + Math.random() * 0.2);
    
    // Determine trend
    const trend = supplyDemandRatio > 1.1 ? 'falling' : supplyDemandRatio < 0.9 ? 'rising' : 'stable';
    
    return {
      goodId: id,
      name: goodDef.name,
      currentPrice: Math.round(currentPrice * 100) / 100,
      basePrice: goodDef.basePrice,
      supply: Math.round(supply),
      demand: Math.round(demand),
      trend,
      inventory: Math.round(baseSupply * 0.3 * Math.random())
    };
  }).filter(Boolean) as GeneratedGoodData[];

  return {
    portId: port.id,
    portName: port.name,
    country: port.countryName,
    currentCapacity: Math.round(port.capacity * utilizationRate),
    utilization: Math.round(utilizationRate * 100),
    goods,
    infrastructure: {
      docks: {
        total: port.infrastructure.docks,
        available: Math.round(port.infrastructure.docks * (1 - utilizationRate))
      },
      cranes: {
        total: port.infrastructure.cranes,
        operational: Math.round(port.infrastructure.cranes * operationalRate)
      },
      warehouses: {
        total: port.infrastructure.warehouses,
        capacity: port.infrastructure.warehouses * 10000,
        used: Math.round(port.infrastructure.warehouses * 10000 * utilizationRate)
      }
    }
  };
}

/**
 * Generate route profitability data between two ports
 */
export function generateRouteData(originPortId: string, destPortId: string): GeneratedRouteData | null {
  const originPort = portData.ports.find(p => p.id === originPortId);
  const destPort = portData.ports.find(p => p.id === destPortId);
  
  if (!originPort || !destPort) return null;
  
  // Calculate distance (simplified)
  const dx = originPort.coordinates.x - destPort.coordinates.x;
  const dy = originPort.coordinates.y - destPort.coordinates.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Estimate duration (20 knots average speed)
  const estimatedDuration = Math.round((distance / 20) * 24); // hours
  
  // Find profitable goods (exports from origin that are imports at destination)
  const profitableGoods = originPort.majorExports.filter(
    good => destPort.majorImports.includes(good)
  );
  
  // If no direct matches, find any goods that could be traded
  const tradableGoods = profitableGoods.length > 0 ? profitableGoods : originPort.majorExports.slice(0, 3);
  
  // Calculate base profitability
  const baseProfitability = profitableGoods.length > 0 ? 0.15 : 0.05;
  const distanceModifier = Math.max(0.5, 1 - (distance / 5000));
  const profitability = baseProfitability * distanceModifier * (0.8 + Math.random() * 0.4);
  
  return {
    routeId: `${originPortId}-${destPortId}`,
    originPort: originPort.name,
    destinationPort: destPort.name,
    distance: Math.round(distance),
    estimatedDuration,
    profitability: Math.round(profitability * 100) / 100,
    recommendedGoods: tradableGoods.slice(0, 3)
  };
}

/**
 * Generate market conditions for a specific good across all ports
 */
export function generateGlobalMarketData(goodId: string) {
  const good = marketGoods.marketGoods.find(g => g.id === goodId);
  if (!good) return null;
  
  const marketData = portData.ports.map(port => {
    const portMarket = generatePortData(port.id);
    if (!portMarket) return null;
    
    const goodData = portMarket.goods.find(g => g.goodId === goodId);
    const isExporter = port.majorExports.includes(goodId);
    const isImporter = port.majorImports.includes(goodId);
    
    return {
      portId: port.id,
      portName: port.name,
      country: port.country,
      role: isExporter ? 'exporter' : isImporter ? 'importer' : 'neutral',
      price: goodData?.currentPrice || good.basePrice,
      supply: goodData?.supply || 0,
      demand: goodData?.demand || 0,
      trend: goodData?.trend || 'stable'
    };
  }).filter(Boolean);
  
  return {
    goodId,
    goodName: good.name,
    category: good.category,
    globalAveragePrice: marketData.reduce((sum, m) => sum + m!.price, 0) / marketData.length,
    topExporters: marketData
      .filter(m => m!.role === 'exporter')
      .sort((a, b) => b!.supply - a!.supply) // Sort descending for top exporters
      .slice(0, 5),
    topImporters: marketData
      .filter(m => m!.role === 'importer')
      .sort((a, b) => b!.demand - a!.demand)
      .slice(0, 5),
    priceRange: {
      min: Math.min(...marketData.map(m => m!.price)),
      max: Math.max(...marketData.map(m => m!.price))
    }
  };
}

/**
 * Generate a complete market snapshot for development
 */
export function generateMarketSnapshot() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    ports: portData.ports.map(port => generatePortData(port.id)).filter(Boolean),
    topGoods: marketGoods.marketGoods
      .slice(0, 10)
      .map(good => ({
        id: good.id,
        name: good.name,
        averagePrice: good.basePrice * (0.8 + Math.random() * 0.4),
        volatility: good.volatility,
        category: good.category
      })),
    economicIndicators: {
      globalDemand: 0.8 + Math.random() * 0.4,
      shippingIndex: 0.7 + Math.random() * 0.3,
      fuelPrice: 80 + Math.random() * 40,
      containerAvailability: 0.85 + Math.random() * 0.15
    }
  };
  
  return snapshot;
}

/**
 * Generate test transactions for a player
 */
export function generateTestTransactions(playerId: string, count: number = 10) {
  const transactions = [];
  const goods = marketGoods.marketGoods.slice(0, 15); // Use top 15 goods
  const ports = portData.ports.slice(0, 10); // Use top 10 ports
  
  for (let i = 0; i < count; i++) {
    const good = goods[Math.floor(Math.random() * goods.length)];
    const port = ports[Math.floor(Math.random() * ports.length)];
    const isBuy = Math.random() > 0.5;
    const quantity = Math.floor(10 + Math.random() * 90);
    const priceVariation = 0.9 + Math.random() * 0.2;
    const price = good.basePrice * priceVariation;
    
    transactions.push({
      id: `test-tx-${Date.now()}-${i}`,
      playerId,
      portId: port.id,
      goodId: good.id,
      type: isBuy ? 'buy' : 'sell',
      quantity,
      price: Math.round(price * 100) / 100,
      total: Math.round(price * quantity * 100) / 100,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return transactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Generate disaster event for testing
 */
export function generateDisasterEvent() {
  const disasterTypes = Object.keys(portEconomics.portEconomics.disasterEffects);
  const disasterType = disasterTypes[Math.floor(Math.random() * disasterTypes.length)];
  const disaster = portEconomics.portEconomics.disasterEffects[disasterType as keyof typeof portEconomics.portEconomics.disasterEffects];
  
  const affectedPorts = portData.ports
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(1 + Math.random() * 3));
  
  return {
    id: `disaster-${Date.now()}`,
    type: disasterType,
    severity: Math.random() > 0.7 ? 'major' : Math.random() > 0.3 ? 'moderate' : 'minor',
    affectedPorts: affectedPorts.map(p => p.id),
    effects: disaster,
    startTime: new Date().toISOString(),
    estimatedDuration: disaster.duration * (0.5 + Math.random()),
    economicImpact: {
      priceIncrease: disaster.priceSpike || disaster.priceIncrease || 1,
      capacityReduction: disaster.capacityReduction || 1,
      affectedGoods: disaster.affectedGoods
    }
  };
}