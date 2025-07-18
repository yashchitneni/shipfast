import { createClient } from './client';
import { inventoryService } from './inventory';

// Create client once and reuse
const supabase = createClient();
import type {
  MarketItem,
  PriceHistory,
  Transaction,
  MarketUpdateResult
} from '@/types/market';
import {
  MarketType,
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
      
      if (!data || data.length === 0) {
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as MarketType,
        category: item.category as GoodsCategory,
        basePrice: item.base_price,
        currentPrice: item.current_price,
        supply: item.supply,
        demand: item.demand,
        volatility: item.volatility,
        productionCostModifier: item.production_cost_modifier,
        lastUpdated: new Date(item.last_updated || Date.now())
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
      // Validate input
      if (!items || items.length === 0) {
        console.log('No items to update');
        return true;
      }

      const updates = items.map(item => ({
        id: item.id,
        current_price: item.currentPrice,
        supply: item.supply,
        demand: item.demand,
        last_updated: new Date().toISOString()
      }));

      console.log(`Updating ${updates.length} market items...`);

      const { error } = await supabase
        .from('market_items')
        .upsert(updates);

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }
      
      // Store price history (but don't fail the whole update if this fails)
      try {
        await this.recordPriceHistory(items);
      } catch (historyError) {
        console.warn('Failed to record price history:', historyError);
        // Continue anyway - price update is more important than history
      }
      
      return true;
    } catch (error) {
      console.error('Error updating market prices:', error instanceof Error ? error.message : 'Unknown error', error);
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
    playerId: string,
    clientPrice?: number  // Price from client-side
  ): Promise<Transaction | null> {
    try {
      console.log('buyItem called with:', { itemId, quantity, playerId });
      
      // Get current item data
      const item = await this.getMarketItem(itemId);
      console.log('Retrieved item:', item);
      
      if (!item) {
        console.error('Item not found:', itemId);
        return null;
      }
      
      if (item.supply < quantity) {
        console.error('Insufficient supply:', { available: item.supply, requested: quantity });
        return null;
      }

      // Use client price if provided, otherwise fall back to database price
      const price = clientPrice || item.currentPrice;
      const total = price * quantity;
      
      console.log('Transaction details:', { price, total, quantity });

      // Create transaction record
      const transactionInsert = {
        item_id: itemId,
        type: 'BUY',
        quantity,
        price_per_unit: price,
        total_price: total,
        player_id: playerId,
        timestamp: new Date().toISOString()
      };
      
      console.log('Inserting transaction:', transactionInsert);

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionInsert)
        .select()
        .single();

      if (error) {
        console.error('Supabase transaction insert error:', error);
        throw error;
      }
      
      console.log('Transaction inserted successfully:', data);

      // Update supply and demand
      const updateResult = await this.updateMarketDynamics(itemId, -quantity, quantity * 0.1);
      console.log('Market dynamics update result:', updateResult);

      // Add to player inventory at their current port (default to 'port-1' for now)
      // In a real implementation, this would use the player's actual location
      const inventoryResult = await inventoryService.addToInventory({
        playerId,
        itemId,
        quantity,
        locationType: 'port',
        locationId: 'port-1', // TODO: Get player's current port from game state
        acquiredPrice: price
      });
      
      console.log('Added to player inventory:', inventoryResult);

      const transaction: Transaction = {
        id: data.id,
        marketItemId: itemId,
        type: 'BUY',
        quantity,
        pricePerUnit: price,
        totalPrice: total,
        playerId,
        timestamp: new Date()
      };

      return transaction;
    } catch (error) {
      console.error('Error processing buy transaction:', error instanceof Error ? error.message : 'Unknown error', error);
      throw error; // Re-throw to let the UI handle it properly
    }
  },

  // Process sell transaction (now with inventory check)
  async sellItem(
    itemId: string,
    quantity: number,
    playerId: string,
    locationId: string = 'port-1', // TODO: Get from player's current location
    clientPrice?: number  // Price from client-side
  ): Promise<Transaction | null> {
    try {
      console.log('=== SELL ITEM DEBUG START ===');
      console.log('sellItem called with:', { itemId, quantity, playerId, locationId, clientPrice });
      
      // First check if player has the item in inventory
      console.log('Fetching player inventory at location:', locationId);
      const playerInventory = await inventoryService.getInventoryAtLocation(playerId, locationId);
      console.log('Player inventory response:', playerInventory);
      console.log('Inventory count:', playerInventory.length);
      console.log('Inventory items:', playerInventory.map(inv => ({
        itemId: inv.itemId,
        quantity: inv.quantity,
        locationId: inv.locationId
      })));
      
      const inventoryItem = playerInventory.find(inv => inv.itemId === itemId);
      console.log('Looking for itemId:', itemId);
      console.log('Found inventory item:', inventoryItem);
      
      if (!inventoryItem) {
        // This is an expected case - player trying to sell something they don't own
        // Log only in debug mode, not as error
        console.log('Player inventory check: No item found');
        console.log('Details:', { playerId, itemId, locationId, inventoryCount: playerInventory.length });
        
        // Return a user-friendly error without throwing
        throw new Error('You do not own this item at your current location');
      }
      
      if (inventoryItem.quantity < quantity) {
        console.error('Insufficient inventory:', { available: inventoryItem.quantity, requested: quantity });
        throw new Error(`You only have ${inventoryItem.quantity} units available to sell`);
      }
      
      // Get current market data
      const item = await this.getMarketItem(itemId);
      if (!item) {
        throw new Error('Market item not found');
      }

      // Use client price if provided (with 90% modifier), otherwise fall back to database price
      const basePrice = clientPrice || item.currentPrice;
      const price = basePrice * 0.9;  // Sell at 90% of market price
      const total = price * quantity;
      
      // Calculate profit
      const profit = (price - inventoryItem.acquiredPrice) * quantity;
      console.log('Sale profit calculation:', {
        acquiredPrice: inventoryItem.acquiredPrice,
        salePrice: price,
        quantity: quantity,
        profit: profit
      });

      // Remove from inventory first
      const removed = await inventoryService.removeFromInventory(
        playerId,
        itemId,
        locationId,
        quantity
      );
      
      if (!removed) {
        throw new Error('Failed to remove items from inventory');
      }

      // Create transaction record
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          item_id: itemId,
          type: 'SELL',
          quantity,
          price_per_unit: price,
          total_price: total,
          player_id: playerId,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update market supply and demand
      await this.updateMarketDynamics(itemId, quantity, -quantity * 0.1);
      
      console.log('Sell transaction successful:', {
        transactionId: data.id,
        profit: profit,
        total: total
      });

      return {
        id: data.id,
        marketItemId: itemId,
        type: 'SELL',
        quantity,
        pricePerUnit: price,
        totalPrice: total,
        playerId,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error processing sell transaction:', error instanceof Error ? error.message : 'Unknown error', error);
      throw error; // Re-throw to let UI handle it
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
        marketItemId: tx.item_id,
        type: tx.type,
        quantity: tx.quantity,
        pricePerUnit: tx.price_per_unit,
        totalPrice: tx.total_price,
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
      // Check if market already has items
      const { count } = await supabase
        .from('market_items')
        .select('*', { count: 'exact', head: true });
      
      if (count && count > 0) {
        console.log(`Market already initialized with ${count} items`);
        return true;
      }
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
            name: item.name,
            type: item.type,
            category: item.category,
            base_price: item.basePrice,
            current_price: item.currentPrice,
            supply: item.supply,
            demand: item.demand,
            volatility: item.volatility,
            production_cost_modifier: item.productionCostModifier,
            last_updated: new Date().toISOString()
          }))
        );

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error initializing market:', error instanceof Error ? error.message : 'Unknown error', error);
      return false;
    }
  }
};