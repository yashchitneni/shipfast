import { supabase } from './client';
import type {
  MarketItem,
  MarketType,
  PriceHistory,
  Transaction,
  MarketUpdateResult,
  GoodsCategory
} from '@/types/market';

// Market Items CRUD operations
export const marketService = {
  // Fetch all market items
  async getMarketItems(type?: MarketType): Promise<MarketItem[]> {
    try {
      let query = supabase
        .from('market_items')
        .select('*')
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        lastUpdated: new Date(item.last_updated)
      }));
    } catch (error) {
      console.error('Error fetching market items:', error);
      return [];
    }
  },

  // Get single market item
  async getMarketItem(itemId: string): Promise<MarketItem | null> {
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        lastUpdated: new Date(data.last_updated)
      } : null;
    } catch (error) {
      console.error('Error fetching market item:', error);
      return null;
    }
  },

  // Update market item prices
  async updateMarketPrices(items: MarketItem[]): Promise<boolean> {
    try {
      const updates = items.map(item => ({
        id: item.id,
        current_price: item.currentPrice,
        supply: item.supply,
        demand: item.demand,
        last_updated: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('market_items')
        .upsert(updates);

      if (error) throw error;
      
      // Store price history
      await this.recordPriceHistory(items);
      
      return true;
    } catch (error) {
      console.error('Error updating market prices:', error);
      return false;
    }
  },

  // Record price history
  async recordPriceHistory(items: MarketItem[]): Promise<boolean> {
    try {
      const historyRecords = items.map(item => ({
        item_id: item.id,
        price: item.currentPrice,
        supply: item.supply,
        demand: item.demand,
        timestamp: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('price_history')
        .insert(historyRecords);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error recording price history:', error);
      return false;
    }
  },

  // Get price history for an item
  async getPriceHistory(
    itemId: string,
    hoursBack: number = 24
  ): Promise<PriceHistory[]> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('item_id', itemId)
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      return data.map(record => ({
        itemId: record.item_id,
        price: record.price,
        supply: record.supply,
        demand: record.demand,
        timestamp: new Date(record.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  },

  // Process buy transaction
  async buyItem(
    itemId: string,
    quantity: number,
    playerId: string
  ): Promise<Transaction | null> {
    try {
      // Get current item data
      const item = await this.getMarketItem(itemId);
      if (!item || item.supply < quantity) return null;

      // Calculate transaction
      const price = item.currentPrice;
      const total = price * quantity;

      // Create transaction record
      const transaction: Omit<Transaction, 'id'> = {
        itemId,
        type: 'BUY',
        quantity,
        price,
        total,
        playerId,
        timestamp: new Date()
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          item_id: itemId,
          type: 'BUY',
          quantity,
          price,
          total,
          player_id: playerId,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update supply and demand
      await this.updateMarketDynamics(itemId, -quantity, quantity * 0.1);

      return {
        ...transaction,
        id: data.id
      };
    } catch (error) {
      console.error('Error processing buy transaction:', error);
      return null;
    }
  },

  // Process sell transaction
  async sellItem(
    itemId: string,
    quantity: number,
    playerId: string
  ): Promise<Transaction | null> {
    try {
      // Get current item data
      const item = await this.getMarketItem(itemId);
      if (!item) return null;

      // Calculate transaction
      const price = item.currentPrice * 0.9; // Sell at 90% of market price
      const total = price * quantity;

      // Create transaction record
      const transaction: Omit<Transaction, 'id'> = {
        itemId,
        type: 'SELL',
        quantity,
        price,
        total,
        playerId,
        timestamp: new Date()
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          item_id: itemId,
          type: 'SELL',
          quantity,
          price,
          total,
          player_id: playerId,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update supply and demand
      await this.updateMarketDynamics(itemId, quantity, -quantity * 0.1);

      return {
        ...transaction,
        id: data.id
      };
    } catch (error) {
      console.error('Error processing sell transaction:', error);
      return null;
    }
  },

  // Update market dynamics after transaction
  async updateMarketDynamics(
    itemId: string,
    supplyChange: number,
    demandChange: number
  ): Promise<boolean> {
    try {
      const item = await this.getMarketItem(itemId);
      if (!item) return false;

      const newSupply = Math.max(0, item.supply + supplyChange);
      const newDemand = Math.max(0, item.demand + demandChange);

      const { error } = await supabase
        .from('market_items')
        .update({
          supply: newSupply,
          demand: newDemand,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating market dynamics:', error);
      return false;
    }
  },

  // Get player transactions
  async getPlayerTransactions(
    playerId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('player_id', playerId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data.map(tx => ({
        id: tx.id,
        itemId: tx.item_id,
        type: tx.type,
        quantity: tx.quantity,
        price: tx.price,
        total: tx.total,
        playerId: tx.player_id,
        timestamp: new Date(tx.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching player transactions:', error);
      return [];
    }
  },

  // Initialize market with default items
  async initializeMarket(): Promise<boolean> {
    try {
      const defaultItems: Omit<MarketItem, 'id' | 'lastUpdated'>[] = [
        // Raw Materials
        {
          name: 'Iron Ore',
          type: MarketType.GOODS,
          category: GoodsCategory.RAW_MATERIALS,
          basePrice: 50,
          currentPrice: 50,
          supply: 1000,
          demand: 800,
          volatility: 0.2,
          productionCostModifier: 1.0
        },
        {
          name: 'Coal',
          type: MarketType.GOODS,
          category: GoodsCategory.RAW_MATERIALS,
          basePrice: 30,
          currentPrice: 30,
          supply: 1500,
          demand: 1200,
          volatility: 0.15,
          productionCostModifier: 0.8
        },
        // Manufactured Goods
        {
          name: 'Steel Beams',
          type: MarketType.GOODS,
          category: GoodsCategory.MANUFACTURED,
          basePrice: 150,
          currentPrice: 150,
          supply: 500,
          demand: 600,
          volatility: 0.25,
          productionCostModifier: 1.5
        },
        // Capital
        {
          name: 'Construction Equipment',
          type: MarketType.CAPITAL,
          basePrice: 5000,
          currentPrice: 5000,
          supply: 50,
          demand: 40,
          volatility: 0.1,
          productionCostModifier: 2.0
        },
        // Labor
        {
          name: 'Skilled Workers',
          type: MarketType.LABOR,
          basePrice: 100,
          currentPrice: 100,
          supply: 200,
          demand: 250,
          volatility: 0.3,
          productionCostModifier: 1.2
        },
        // Assets
        {
          name: 'Warehouse Space',
          type: MarketType.ASSETS,
          basePrice: 10000,
          currentPrice: 10000,
          supply: 20,
          demand: 25,
          volatility: 0.05,
          productionCostModifier: 3.0
        }
      ];

      const { error } = await supabase
        .from('market_items')
        .upsert(
          defaultItems.map(item => ({
            ...item,
            last_updated: new Date().toISOString()
          }))
        );

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error initializing market:', error);
      return false;
    }
  }
};