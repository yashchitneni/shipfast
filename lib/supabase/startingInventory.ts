import { createClient } from './client';
import { inventoryService } from './inventory';
import type { CreateInventoryItem } from '@/types/inventory';

const supabase = createClient();

interface StartingInventoryConfig {
  minItems: number;  // Minimum number of different items
  maxItems: number;  // Maximum number of different items
  minQuantity: number;  // Minimum quantity per item
  maxQuantity: number;  // Maximum quantity per item
  totalValueLimit: number;  // Maximum total value of starting inventory
  categories: string[];  // Which categories to include
}

const DEFAULT_CONFIG: StartingInventoryConfig = {
  minItems: 2,
  maxItems: 5,
  minQuantity: 10,
  maxQuantity: 100,
  totalValueLimit: 10000,  // $10k worth of starting inventory
  categories: ['RAW_MATERIALS', 'CONSUMER', 'ENERGY']  // Start with basic goods
};

export const startingInventoryService = {
  /**
   * Generate random starting inventory for a new player
   */
  async generateStartingInventory(
    playerId: string,
    locationId: string = 'port-1',
    config: Partial<StartingInventoryConfig> = {}
  ): Promise<boolean> {
    try {
      const cfg = { ...DEFAULT_CONFIG, ...config };
      
      console.log('Generating starting inventory for player:', playerId);
      
      // Check if player already has inventory
      const existingInventory = await inventoryService.getPlayerInventory(playerId);
      if (existingInventory.length > 0) {
        console.log('Player already has inventory, skipping generation');
        return true;
      }
      
      // Get available market items from allowed categories
      const { data: marketItems, error } = await supabase
        .from('market_items')
        .select('*')
        .in('category', cfg.categories)
        .order('current_price', { ascending: true });  // Start with cheaper items
        
      if (error || !marketItems || marketItems.length === 0) {
        console.error('Failed to fetch market items:', error);
        return false;
      }
      
      // Randomly select items
      const numItems = this.randomBetween(cfg.minItems, cfg.maxItems);
      const selectedItems = this.selectRandomItems(marketItems, numItems, cfg);
      
      console.log(`Selected ${selectedItems.length} items for starting inventory`);
      
      // Add each item to inventory
      for (const item of selectedItems) {
        await inventoryService.addToInventory(item);
      }
      
      console.log('Starting inventory generated successfully');
      return true;
      
    } catch (error) {
      console.error('Error generating starting inventory:', error);
      return false;
    }
  },
  
  /**
   * Select random items while respecting value limits
   */
  selectRandomItems(
    marketItems: any[],
    count: number,
    config: StartingInventoryConfig
  ): CreateInventoryItem[] {
    const selected: CreateInventoryItem[] = [];
    const shuffled = [...marketItems].sort(() => Math.random() - 0.5);
    let totalValue = 0;
    
    for (const marketItem of shuffled) {
      if (selected.length >= count) break;
      
      // Calculate random quantity
      const baseQuantity = this.randomBetween(config.minQuantity, config.maxQuantity);
      
      // Adjust quantity based on item price to respect value limit
      const itemPrice = marketItem.current_price || marketItem.base_price;
      const maxAffordableQuantity = Math.floor((config.totalValueLimit - totalValue) / itemPrice);
      const quantity = Math.min(baseQuantity, maxAffordableQuantity);
      
      if (quantity < config.minQuantity) continue;  // Skip if we can't afford minimum
      
      const itemValue = quantity * itemPrice;
      
      // Add item with slightly discounted acquisition price (85-95% of market)
      const discountFactor = 0.85 + Math.random() * 0.1;
      
      selected.push({
        playerId: '',  // Will be set by caller
        itemId: marketItem.id,
        quantity: quantity,
        locationType: 'port',
        locationId: 'port-1',
        acquiredPrice: itemPrice * discountFactor
      });
      
      totalValue += itemValue;
      
      // Stop if we're close to the value limit
      if (totalValue >= config.totalValueLimit * 0.9) break;
    }
    
    return selected;
  },
  
  /**
   * Generate random number between min and max (inclusive)
   */
  randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  /**
   * Initialize a new player with starting inventory
   */
  async initializeNewPlayer(
    playerId: string,
    startingCash: number = 50000
  ): Promise<boolean> {
    try {
      // Ensure player exists
      const { data: player, error: playerError } = await supabase
        .from('player')
        .select('user_id')
        .eq('user_id', playerId)
        .single();
        
      if (playerError || !player) {
        console.error('Player not found:', playerId);
        return false;
      }
      
      // Generate starting inventory
      const inventoryGenerated = await this.generateStartingInventory(playerId);
      
      if (!inventoryGenerated) {
        console.warn('Failed to generate starting inventory, but player was created');
      }
      
      // Log the starting inventory for debugging
      const inventory = await inventoryService.getPlayerInventory(playerId);
      console.log('Player starting inventory:', {
        playerId,
        itemCount: inventory.length,
        totalItems: inventory.reduce((sum, item) => sum + item.quantity, 0),
        estimatedValue: inventory.reduce((sum, item) => sum + (item.quantity * item.acquiredPrice), 0)
      });
      
      return true;
      
    } catch (error) {
      console.error('Error initializing new player:', error);
      return false;
    }
  }
};