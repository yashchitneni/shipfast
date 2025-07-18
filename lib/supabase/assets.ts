import { createClient } from './client';
import { PlacedAsset, AssetDefinition } from '../../app/lib/types/assets';
import { Database } from './types/database.generated';

type DbAsset = Database['public']['Tables']['asset']['Row'];
type DbAssetInsert = Database['public']['Tables']['asset']['Insert'];
type DbAssetUpdate = Database['public']['Tables']['asset']['Update'];
type Json = Database['public']['Tables']['asset']['Row']['stats'];

export class AssetService {
  private supabase = createClient();

  async ensurePlayerExists(userId: string, username: string = 'Captain', initialCash: number = 1000000): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🔍 Checking if player exists:', userId);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - bypassing database');
        const playerKey = `dev_player_${userId}`;
        const existingPlayer = localStorage.getItem(playerKey);
        
        if (!existingPlayer) {
          const player = {
            user_id: userId,
            username,
            cash: initialCash,
            net_worth: initialCash,
            created_at: new Date().toISOString()
          };
          localStorage.setItem(playerKey, JSON.stringify(player));
          console.log('✅ Development player created in localStorage');
        } else {
          console.log('✅ Development player already exists in localStorage');
        }
        
        return { success: true, error: null };
      }
      
      // Production database flow
      const { data: existingPlayer, error: selectError } = await this.supabase
        .from('player')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error checking player existence:', selectError);
        return { success: false, error: selectError };
      }

      if (existingPlayer) {
        console.log('✅ Player already exists:', existingPlayer.user_id);
        return { success: true, error: null };
      }

      console.log('🔨 Creating new player:', userId);
      
      const { error: insertError } = await this.supabase
        .from('player')
        .insert({
          user_id: userId,
          username,
          cash: initialCash,
          net_worth: initialCash
        });

      if (insertError) {
        console.error('❌ Failed to create player:', insertError);
        return { success: false, error: insertError };
      }

      console.log('✅ Player created successfully');
      return { success: true, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in ensurePlayerExists:', error);
      return { success: false, error };
    }
  }

  async getPlayer(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      console.log('🔍 Getting player data for:', userId);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - reading from localStorage');
        const playerKey = `dev_player_${userId}`;
        const player = localStorage.getItem(playerKey);
        
        if (player) {
          const data = JSON.parse(player);
          console.log('✅ Development player data retrieved:', data.username);
          return { data, error: null };
        } else {
          console.log('❌ No development player found in localStorage');
          return { data: null, error: { message: 'Player not found in localStorage' } };
        }
      }
      
      // Production database flow
      const { data, error } = await this.supabase
        .from('player')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Failed to get player:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('✅ Player data retrieved:', data?.username);
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Unexpected error in getPlayer:', error);
      return { data: null, error };
    }
  }

  async getPlayerAssets(userId: string): Promise<PlacedAsset[]> {
    try {
      console.log('🔍 Getting assets for player:', userId);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - reading assets from localStorage');
        const assetsKey = `dev_assets_${userId}`;
        const assets = localStorage.getItem(assetsKey);
        
        if (assets) {
          const data = JSON.parse(assets);
          console.log(`✅ Retrieved ${data.length} development assets`);
          return data;
        } else {
          console.log('No development assets found in localStorage');
          return [];
        }
      }
      
      // Production database flow
      const { data, error } = await this.supabase
        .from('asset')
        .select('*')
        .eq('owner_id', userId);

      if (error) {
        console.error('❌ Failed to get player assets:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} assets for player`);
      
      return data.map(this.convertDbAssetToPlacedAsset);
    } catch (error) {
      console.error('❌ Unexpected error in getPlayerAssets:', error);
      return [];
    }
  }

  async createAsset(asset: PlacedAsset, definition?: any, playerId?: string): Promise<{ data?: any; error?: any }> {
    try {
      console.log('🔨 Creating asset:', asset.id);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - saving asset to localStorage');
        const assetsKey = `dev_assets_${asset.ownerId}`;
        const existingAssets = localStorage.getItem(assetsKey);
        const assets = existingAssets ? JSON.parse(existingAssets) : [];
        
        assets.push(asset);
        localStorage.setItem(assetsKey, JSON.stringify(assets));
        console.log('✅ Development asset created in localStorage');
        return { data: asset, error: null };
      }
      
      // Production database flow
      const { error } = await this.supabase
        .from('asset')
        .insert({
          asset_id: asset.id,
          owner_id: asset.ownerId,
          asset_type: asset.definitionId,
          assigned_route_id: asset.routeId,
          stats: {
            definitionId: asset.definitionId,
            position: asset.position,
            rotation: asset.rotation,
            portId: asset.portId,
            status: asset.status,
            health: asset.health,
            purchasedAt: asset.purchasedAt
          } as unknown as Json,
        });

      if (error) {
        console.error('❌ Failed to create asset:', error);
        return { data: null, error };
      }

      console.log('✅ Asset created successfully');
      return { data: asset, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in createAsset:', error);
      return { data: null, error };
    }
  }

  async updateAsset(assetId: string, updates: Partial<PlacedAsset>): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🔄 Updating asset:', assetId);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - updating asset in localStorage');
        // For development, we'll just return success
        // In a real implementation, we'd find and update the asset in localStorage
        console.log('✅ Development asset update simulated');
        return { success: true, error: null };
      }
      
      // Production database flow
      const { error } = await this.supabase
        .from('asset')
        .update({
          assigned_route_id: updates.routeId,
          stats: updates.status || updates.health || updates.position || updates.rotation ? {
            status: updates.status,
            health: updates.health,
            position: updates.position,
            rotation: updates.rotation
          } as unknown as Json : undefined
        })
        .eq('asset_id', assetId);

      if (error) {
        console.error('❌ Failed to update asset:', error);
        return { success: false, error };
      }

      console.log('✅ Asset updated successfully');
      return { success: true, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in updateAsset:', error);
      return { success: false, error };
    }
  }

  async deleteAsset(assetId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('🗑️ Deleting asset:', assetId);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - deleting asset from localStorage');
        console.log('✅ Development asset deletion simulated');
        return { success: true, error: null };
      }
      
      // Production database flow
      const { error } = await this.supabase
        .from('asset')
        .delete()
        .eq('asset_id', assetId);

      if (error) {
        console.error('❌ Failed to delete asset:', error);
        return { success: false, error };
      }

      console.log('✅ Asset deleted successfully');
      return { success: true, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in deleteAsset:', error);
      return { success: false, error };
    }
  }

  async deductPlayerCash(userId: string, amount: number): Promise<{ success: boolean; error?: any }> {
    try {
      console.log(`💰 Deducting $${amount} from player:`, userId);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - updating cash in localStorage');
        const playerKey = `dev_player_${userId}`;
        const player = localStorage.getItem(playerKey);
        
        if (player) {
          const playerData = JSON.parse(player);
          if (playerData.cash >= amount) {
            playerData.cash -= amount;
            localStorage.setItem(playerKey, JSON.stringify(playerData));
            console.log(`✅ Development cash deducted. New balance: $${playerData.cash}`);
            return { success: true };
          } else {
            console.log('❌ Insufficient funds in development mode');
            return { success: false, error: { message: 'Insufficient funds' } };
          }
        } else {
          console.log('❌ Player not found in localStorage');
          return { success: false, error: { message: 'Player not found' } };
        }
      }
      
      // Production database flow - use stored procedure
      const { data, error } = await this.supabase.rpc('deduct_player_cash', {
        player_id: userId,
        amount: amount
      });

      if (error) {
        console.error('❌ Failed to deduct player cash:', error);
        return { success: false, error };
      }

      console.log('✅ Player cash deducted successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Unexpected error in deductPlayerCash:', error);
      return { success: false, error };
    }
  }

  async addPlayerCash(userId: string, amount: number): Promise<{ success: boolean; error?: any }> {
    try {
      console.log(`💰 Adding $${amount} to player:`, userId);
      
      // Development bypass - use localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using development mode - updating cash in localStorage');
        const playerKey = `dev_player_${userId}`;
        const player = localStorage.getItem(playerKey);
        
        if (player) {
          const playerData = JSON.parse(player);
          playerData.cash += amount;
          localStorage.setItem(playerKey, JSON.stringify(playerData));
          console.log(`✅ Development cash added. New balance: $${playerData.cash}`);
          return { success: true };
        } else {
          console.log('❌ Player not found in localStorage');
          return { success: false, error: { message: 'Player not found' } };
        }
      }
      
      // Production database flow - use stored procedure
      const { data, error } = await this.supabase.rpc('add_player_cash', {
        player_id: userId,
        amount: amount
      });

      if (error) {
        console.error('❌ Failed to add player cash:', error);
        return { success: false, error };
      }

      console.log('✅ Player cash added successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Unexpected error in addPlayerCash:', error);
      return { success: false, error };
    }
  }

  private convertDbAssetToPlacedAsset(dbAsset: DbAsset): PlacedAsset {
    const stats = dbAsset.stats as any;
    return {
      id: dbAsset.asset_id,
      definitionId: stats?.definitionId || dbAsset.asset_type,
      ownerId: dbAsset.owner_id,
      position: stats?.position || { x: 0, y: 0 },
      rotation: stats?.rotation || 0,
      portId: stats?.portId,
      routeId: dbAsset.assigned_route_id || undefined,
      status: stats?.status || 'active',
      health: stats?.health || 100,
      purchasedAt: stats?.purchasedAt || Date.now(),
      customName: dbAsset.custom_name || undefined
    };
  }
}

export const assetService = new AssetService(); 