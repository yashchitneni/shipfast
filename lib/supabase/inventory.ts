import { createClient } from './client';
import type {
  PlayerInventoryItem,
  RouteCargo,
  CreateInventoryItem,
  CreateRouteCargo,
  InventoryTransfer,
  ProfitCalculation
} from '@/types/inventory';

const supabase = createClient();

export const inventoryService = {
  // Get player's inventory across all locations
  async getPlayerInventory(playerId: string): Promise<PlayerInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('player_inventory')
        .select('*')
        .eq('player_id', playerId)
        .order('acquired_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        playerId: item.player_id,
        itemId: item.item_id,
        quantity: item.quantity,
        locationType: item.location_type,
        locationId: item.location_id,
        acquiredPrice: parseFloat(item.acquired_price),
        acquiredAt: new Date(item.acquired_at),
        lastUpdated: new Date(item.last_updated)
      }));
    } catch (error) {
      console.error('Error fetching player inventory:', error);
      return [];
    }
  },

  // Get inventory counts for specific items at a location (optimized for market display)
  async getInventoryCounts(
    playerId: string,
    locationId: string,
    itemIds: string[]
  ): Promise<Map<string, number>> {
    try {
      const { data, error } = await supabase
        .from('player_inventory')
        .select('item_id, quantity')
        .eq('player_id', playerId)
        .eq('location_id', locationId)
        .in('item_id', itemIds);

      if (error) {
        console.error('Error fetching inventory counts:', error);
        return new Map();
      }

      const countsMap = new Map<string, number>();
      data?.forEach(item => {
        countsMap.set(item.item_id, item.quantity);
      });

      return countsMap;
    } catch (error) {
      console.error('Error in getInventoryCounts:', error);
      return new Map();
    }
  },

  // Get inventory at a specific location
  async getInventoryAtLocation(
    playerId: string, 
    locationId: string
  ): Promise<PlayerInventoryItem[]> {
    try {
      console.log('=== INVENTORY SERVICE: getInventoryAtLocation ===');
      console.log('Parameters:', { playerId, locationId });
      
      const { data, error } = await supabase
        .from('player_inventory')
        .select('*')
        .eq('player_id', playerId)
        .eq('location_id', locationId);

      console.log('Supabase query response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No inventory items found for player at location');
        return [];
      }

      const mappedItems = data.map(item => ({
        id: item.id,
        playerId: item.player_id,
        itemId: item.item_id,
        quantity: item.quantity,
        locationType: item.location_type,
        locationId: item.location_id,
        acquiredPrice: parseFloat(item.acquired_price),
        acquiredAt: new Date(item.acquired_at || Date.now()),
        lastUpdated: new Date(item.last_updated || item.updated_at || Date.now())
      }));
      
      console.log('Mapped inventory items:', mappedItems);
      return mappedItems;
    } catch (error) {
      console.error('Error fetching location inventory:', error);
      return [];
    }
  },

  // Add items to inventory (after buying from market)
  async addToInventory(item: CreateInventoryItem): Promise<PlayerInventoryItem | null> {
    try {
      // Check if player already has this item at this location
      const { data: existing } = await supabase
        .from('player_inventory')
        .select('*')
        .eq('player_id', item.playerId)
        .eq('item_id', item.itemId)
        .eq('location_id', item.locationId)
        .single();

      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from('player_inventory')
          .update({
            quantity: existing.quantity + item.quantity,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return this.mapInventoryItem(data);
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('player_inventory')
          .insert({
            player_id: item.playerId,
            item_id: item.itemId,
            quantity: item.quantity,
            location_type: item.locationType,
            location_id: item.locationId,
            acquired_price: item.acquiredPrice
          })
          .select()
          .single();

        if (error) throw error;
        return this.mapInventoryItem(data);
      }
    } catch (error) {
      console.error('Error adding to inventory:', error);
      return null;
    }
  },

  // Remove items from inventory (for selling or loading onto ships)
  async removeFromInventory(
    playerId: string,
    itemId: string,
    locationId: string,
    quantity: number
  ): Promise<boolean> {
    try {
      // Get current inventory
      const { data: current } = await supabase
        .from('player_inventory')
        .select('*')
        .eq('player_id', playerId)
        .eq('item_id', itemId)
        .eq('location_id', locationId)
        .single();

      if (!current || current.quantity < quantity) {
        console.error('Insufficient inventory');
        return false;
      }

      if (current.quantity === quantity) {
        // Remove entire entry
        const { error } = await supabase
          .from('player_inventory')
          .delete()
          .eq('id', current.id);

        if (error) throw error;
      } else {
        // Update quantity
        const { error } = await supabase
          .from('player_inventory')
          .update({
            quantity: current.quantity - quantity,
            last_updated: new Date().toISOString()
          })
          .eq('id', current.id);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error removing from inventory:', error);
      return false;
    }
  },

  // Load cargo onto a ship
  async loadCargo(cargo: CreateRouteCargo): Promise<RouteCargo | null> {
    try {
      const { data, error } = await supabase
        .from('route_cargo')
        .insert({
          route_id: cargo.routeId,
          asset_id: cargo.assetId,
          item_id: cargo.itemId,
          quantity: cargo.quantity,
          origin_port: cargo.originPort,
          destination_port: cargo.destinationPort,
          loading_price: cargo.loadingPrice,
          status: 'loading',
          expected_arrival: this.calculateArrival(cargo.originPort, cargo.destinationPort)
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapCargo(data);
    } catch (error) {
      console.error('Error loading cargo:', error);
      return null;
    }
  },

  // Get cargo on a specific route
  async getRouteCargo(routeId: string): Promise<RouteCargo[]> {
    try {
      const { data, error } = await supabase
        .from('route_cargo')
        .select('*')
        .eq('route_id', routeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapCargo);
    } catch (error) {
      console.error('Error fetching route cargo:', error);
      return [];
    }
  },

  // Update cargo status
  async updateCargoStatus(
    cargoId: string,
    status: RouteCargo['status']
  ): Promise<boolean> {
    try {
      const updates: any = { status };
      
      if (status === 'delivered') {
        updates.actual_arrival = new Date().toISOString();
      }

      const { error } = await supabase
        .from('route_cargo')
        .update(updates)
        .eq('id', cargoId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating cargo status:', error);
      return false;
    }
  },

  // Calculate profit for delivered cargo
  calculateProfit(
    cargo: RouteCargo,
    salePrice: number,
    transportCost: number = 0
  ): ProfitCalculation {
    const purchaseTotal = cargo.loadingPrice * cargo.quantity;
    const saleTotal = salePrice * cargo.quantity;
    const grossProfit = saleTotal - purchaseTotal;
    const netProfit = grossProfit - transportCost;
    const profitMargin = (netProfit / purchaseTotal) * 100;

    return {
      itemId: cargo.itemId,
      quantity: cargo.quantity,
      purchasePrice: cargo.loadingPrice,
      salePrice,
      transportCost,
      grossProfit,
      netProfit,
      profitMargin
    };
  },

  // Helper functions
  private mapInventoryItem(data: any): PlayerInventoryItem {
    return {
      id: data.id,
      playerId: data.player_id,
      itemId: data.item_id,
      quantity: data.quantity,
      locationType: data.location_type,
      locationId: data.location_id,
      acquiredPrice: parseFloat(data.acquired_price),
      acquiredAt: new Date(data.acquired_at),
      lastUpdated: new Date(data.last_updated)
    };
  },

  private mapCargo(data: any): RouteCargo {
    return {
      id: data.id,
      routeId: data.route_id,
      assetId: data.asset_id,
      itemId: data.item_id,
      quantity: data.quantity,
      status: data.status,
      originPort: data.origin_port,
      destinationPort: data.destination_port,
      loadingPrice: parseFloat(data.loading_price),
      expectedArrival: data.expected_arrival ? new Date(data.expected_arrival) : null,
      actualArrival: data.actual_arrival ? new Date(data.actual_arrival) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Simple arrival calculation (in real game, use route distance and ship speed)
  private calculateArrival(origin: string, destination: string): string {
    const travelDays = 3; // Simplified - would calculate based on actual distance
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + travelDays);
    return arrival.toISOString();
  }
};