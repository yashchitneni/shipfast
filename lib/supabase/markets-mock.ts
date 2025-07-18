import type {
  MarketItem,
  PriceHistory,
  Transaction
} from '@/types/market';
import {
  MarketType,
  GoodsCategory
} from '@/types/market';

// Mock data for testing
const mockMarketItems: MarketItem[] = [
  {
    id: '1',
    name: 'Electronics',
    type: MarketType.GOODS,
    category: GoodsCategory.TECHNOLOGY,
    basePrice: 1000,
    currentPrice: 1200,
    supply: 500,
    demand: 600,
    volatility: 0.2,
    productionCostModifier: 1.2,
    lastUpdated: new Date()
  },
  {
    id: '2',
    name: 'Crude Oil',
    type: MarketType.GOODS,
    category: GoodsCategory.ENERGY,
    basePrice: 80,
    currentPrice: 85,
    supply: 10000,
    demand: 9500,
    volatility: 0.3,
    productionCostModifier: 0.8,
    lastUpdated: new Date()
  },
  {
    id: '3',
    name: 'Steel',
    type: MarketType.GOODS,
    category: GoodsCategory.RAW_MATERIALS,
    basePrice: 500,
    currentPrice: 520,
    supply: 2000,
    demand: 2200,
    volatility: 0.15,
    productionCostModifier: 1.0,
    lastUpdated: new Date()
  },
  {
    id: '4',
    name: 'Consumer Goods',
    type: MarketType.GOODS,
    category: GoodsCategory.CONSUMER,
    basePrice: 200,
    currentPrice: 210,
    supply: 5000,
    demand: 4800,
    volatility: 0.1,
    productionCostModifier: 0.9,
    lastUpdated: new Date()
  }
];

let mockTransactions: Transaction[] = [];
let transactionIdCounter = 1;

export const marketServiceMock = {
  async getMarketItems(type?: MarketType): Promise<MarketItem[]> {
    console.log('🔧 Using mock market data (Supabase unavailable)');
    if (type) {
      return mockMarketItems.filter(item => item.type === type);
    }
    return [...mockMarketItems];
  },

  async getMarketItem(itemId: string): Promise<MarketItem | null> {
    return mockMarketItems.find(item => item.id === itemId) || null;
  },

  async updateMarketPrices(items: MarketItem[]): Promise<boolean> {
    // Update mock items
    items.forEach(updatedItem => {
      const index = mockMarketItems.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        mockMarketItems[index] = { ...updatedItem, lastUpdated: new Date() };
      }
    });
    return true;
  },

  async recordPriceHistory(items: MarketItem[]): Promise<boolean> {
    // Mock implementation - just return true
    return true;
  },

  async getPriceHistory(itemId: string, hoursBack: number = 24): Promise<PriceHistory[]> {
    // Generate mock price history
    const item = mockMarketItems.find(i => i.id === itemId);
    if (!item) return [];

    const history: PriceHistory[] = [];
    const now = new Date();
    
    for (let i = 0; i < hoursBack; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const priceVariation = 1 + (Math.random() - 0.5) * item.volatility;
      history.push({
        itemId,
        price: item.basePrice * priceVariation,
        supply: item.supply + Math.floor((Math.random() - 0.5) * 100),
        demand: item.demand + Math.floor((Math.random() - 0.5) * 100),
        timestamp
      });
    }
    
    return history.reverse();
  },

  async buyItem(itemId: string, quantity: number, playerId: string): Promise<Transaction | null> {
    const item = mockMarketItems.find(i => i.id === itemId);
    if (!item || item.supply < quantity) return null;

    const transaction: Transaction = {
      id: String(transactionIdCounter++),
      marketItemId: itemId,
      type: 'BUY',
      quantity,
      pricePerUnit: item.currentPrice,
      totalPrice: item.currentPrice * quantity,
      playerId,
      timestamp: new Date()
    };

    // Update item supply
    item.supply -= quantity;
    item.demand += Math.floor(quantity * 0.1);
    
    mockTransactions.push(transaction);
    return transaction;
  },

  async sellItem(itemId: string, quantity: number, playerId: string): Promise<Transaction | null> {
    const item = mockMarketItems.find(i => i.id === itemId);
    if (!item) return null;

    const sellPrice = item.currentPrice * 0.9; // 90% of market price
    const transaction: Transaction = {
      id: String(transactionIdCounter++),
      marketItemId: itemId,
      type: 'SELL',
      quantity,
      pricePerUnit: sellPrice,
      totalPrice: sellPrice * quantity,
      playerId,
      timestamp: new Date()
    };

    // Update item supply
    item.supply += quantity;
    item.demand = Math.max(0, item.demand - Math.floor(quantity * 0.1));
    
    mockTransactions.push(transaction);
    return transaction;
  },

  async updateMarketDynamics(itemId: string, supplyChange: number, demandChange: number): Promise<boolean> {
    const item = mockMarketItems.find(i => i.id === itemId);
    if (!item) return false;

    item.supply = Math.max(0, item.supply + supplyChange);
    item.demand = Math.max(0, item.demand + demandChange);
    return true;
  },

  async getPlayerTransactions(playerId: string, limit: number = 50): Promise<Transaction[]> {
    return mockTransactions
      .filter(tx => tx.playerId === playerId)
      .slice(-limit)
      .reverse();
  },

  async initializeMarket(): Promise<boolean> {
    console.log('✅ Mock market initialized');
    return true;
  }
}; 