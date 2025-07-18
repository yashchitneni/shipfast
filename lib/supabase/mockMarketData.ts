import { MarketItem, MarketType, GoodsCategory } from '@/types/market';

// Mock market data for instant loading
export const mockMarketItems: MarketItem[] = [
  // Raw Materials
  {
    id: '1',
    name: 'Iron Ore',
    type: MarketType.GOODS,
    category: GoodsCategory.RAW_MATERIALS,
    basePrice: 50,
    currentPrice: 50,
    supply: 1000,
    demand: 800,
    volatility: 0.2,
    productionCostModifier: 1.0,
    lastUpdated: new Date()
  },
  {
    id: '2',
    name: 'Coal',
    type: MarketType.GOODS,
    category: GoodsCategory.RAW_MATERIALS,
    basePrice: 30,
    currentPrice: 30,
    supply: 1500,
    demand: 1200,
    volatility: 0.15,
    productionCostModifier: 0.8,
    lastUpdated: new Date()
  },
  {
    id: '3',
    name: 'Wood',
    type: MarketType.GOODS,
    category: GoodsCategory.RAW_MATERIALS,
    basePrice: 20,
    currentPrice: 20,
    supply: 2000,
    demand: 1800,
    volatility: 0.1,
    productionCostModifier: 0.7,
    lastUpdated: new Date()
  },
  // Manufactured Goods
  {
    id: '4',
    name: 'Steel Beams',
    type: MarketType.GOODS,
    category: GoodsCategory.MANUFACTURED,
    basePrice: 150,
    currentPrice: 150,
    supply: 500,
    demand: 600,
    volatility: 0.25,
    productionCostModifier: 1.5,
    lastUpdated: new Date()
  },
  {
    id: '5',
    name: 'Textiles',
    type: MarketType.GOODS,
    category: GoodsCategory.MANUFACTURED,
    basePrice: 80,
    currentPrice: 80,
    supply: 800,
    demand: 900,
    volatility: 0.2,
    productionCostModifier: 1.2,
    lastUpdated: new Date()
  },
  // Consumer Goods
  {
    id: '6',
    name: 'Food Supplies',
    type: MarketType.GOODS,
    category: GoodsCategory.CONSUMER,
    basePrice: 40,
    currentPrice: 40,
    supply: 1200,
    demand: 1500,
    volatility: 0.3,
    productionCostModifier: 0.9,
    lastUpdated: new Date()
  },
  {
    id: '7',
    name: 'Medicine',
    type: MarketType.GOODS,
    category: GoodsCategory.CONSUMER,
    basePrice: 200,
    currentPrice: 200,
    supply: 300,
    demand: 400,
    volatility: 0.35,
    productionCostModifier: 2.0,
    lastUpdated: new Date()
  },
  // Luxury Goods
  {
    id: '8',
    name: 'Spices',
    type: MarketType.GOODS,
    category: GoodsCategory.LUXURY,
    basePrice: 300,
    currentPrice: 300,
    supply: 200,
    demand: 250,
    volatility: 0.4,
    productionCostModifier: 2.5,
    lastUpdated: new Date()
  },
  {
    id: '9',
    name: 'Silk',
    type: MarketType.GOODS,
    category: GoodsCategory.LUXURY,
    basePrice: 500,
    currentPrice: 500,
    supply: 100,
    demand: 150,
    volatility: 0.45,
    productionCostModifier: 3.0,
    lastUpdated: new Date()
  }
];