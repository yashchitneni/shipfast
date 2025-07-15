import { createClient } from './client';
import { PlacedAsset, AssetDefinition } from '../../app/lib/types/assets';
import { Database } from './types/database.generated';

type DbAsset = Database['public']['Tables']['asset']['Row'];
type DbAssetInsert = Database['public']['Tables']['asset']['Insert'];
type DbAssetUpdate = Database['public']['Tables']['asset']['Update'];
type Json = Database['public']['Tables']['asset']['Row']['stats'];

export class AssetService {
  private supabase = createClient();

  async ensurePlayerExists(userId: string, username: string = 'Captain', initialCash: number = 50000): Promise<{ success: boolean; error: any }> {
    // Try to get the player first
    const { data: existingPlayer } = await this.supabase
      .from('player')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      return { success: true, error: null };
    }

    // Create player if they don't exist
    const { error } = await this.supabase
      .from('player')
      .insert({
        user_id: userId,
        username,
        cash: initialCash,
        net_worth: initialCash
      });

    return { success: !error, error };
  }

  async getPlayer(userId: string): Promise<{ data: any | null; error: any }> {
    const { data, error } = await this.supabase
      .from('player')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data, error };
  }

  async createAsset(asset: PlacedAsset, definition: AssetDefinition, userId: string): Promise<{ data: DbAsset | null; error: any }> {
    const dbAsset: DbAssetInsert = {
      asset_id: asset.id,
      owner_id: userId,
      asset_type: definition.type,
      custom_name: asset.customName,
      stats: {
        definitionId: asset.definitionId,
        position: { x: asset.position.x, y: asset.position.y },
        rotation: asset.rotation,
        portId: asset.portId,
        status: asset.status,
        health: asset.health,
        purchasedAt: asset.purchasedAt,
        capacity: definition.capacity,
        speed: definition.speed,
        range: definition.range,
        efficiency: definition.efficiency
      } as Json,
      maintenance_cost: definition.maintenanceCost,
      assigned_route_id: asset.routeId || null
    };

    const { data, error } = await this.supabase
      .from('asset')
      .insert(dbAsset)
      .select()
      .single();

    return { data, error };
  }

  async updateAsset(assetId: string, updates: Partial<PlacedAsset>): Promise<{ data: DbAsset | null; error: any }> {
    const dbUpdate: DbAssetUpdate = {};
    
    if (updates.customName !== undefined) dbUpdate.custom_name = updates.customName;
    if (updates.routeId !== undefined) dbUpdate.assigned_route_id = updates.routeId;
    
    // Update stats JSON
    if (updates.position || updates.rotation || updates.status || updates.health) {
      const { data: currentAsset } = await this.supabase
        .from('asset')
        .select('stats')
        .eq('asset_id', assetId)
        .single();
      
      if (currentAsset) {
        const currentStats = currentAsset.stats as any;
        dbUpdate.stats = {
          ...currentStats,
          ...(updates.position && { position: { x: updates.position.x, y: updates.position.y } }),
          ...(updates.rotation !== undefined && { rotation: updates.rotation }),
          ...(updates.status && { status: updates.status }),
          ...(updates.health !== undefined && { health: updates.health })
        } as Json;
      }
    }

    const { data, error } = await this.supabase
      .from('asset')
      .update(dbUpdate)
      .eq('asset_id', assetId)
      .select()
      .single();

    return { data, error };
  }

  async deleteAsset(assetId: string): Promise<{ error: any }> {
    const { error } = await this.supabase
      .from('asset')
      .delete()
      .eq('asset_id', assetId);

    return { error };
  }

  async getPlayerAssets(userId: string): Promise<{ data: DbAsset[] | null; error: any }> {
    const { data, error } = await this.supabase
      .from('asset')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async deductPlayerCash(userId: string, amount: number): Promise<{ success: boolean; error: any }> {
    const { error } = await this.supabase.rpc('deduct_player_cash', {
      player_id: userId,
      amount
    });

    return { success: !error, error };
  }

  async addPlayerCash(userId: string, amount: number): Promise<{ success: boolean; error: any }> {
    const { error } = await this.supabase.rpc('add_player_cash', {
      player_id: userId,
      amount
    });

    return { success: !error, error };
  }

  async calculateNetWorth(userId: string): Promise<{ data: number | null; error: any }> {
    const { data, error } = await this.supabase.rpc('calculate_player_net_worth', {
      player_id: userId
    });

    return { data, error };
  }
}

export const assetService = new AssetService(); 