import { createClient } from './client';
import { useEmpireStore } from '../../src/store/empireStore';
import { PlacedAsset } from '../../app/lib/types/assets';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeAssetSync {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private playerId: string | null = null;
  private isEnabled = process.env.NODE_ENV === 'production'; // Disable in development

  // Initialize real-time sync for a player
  async initialize(playerId: string) {
    this.playerId = playerId;
    
    if (!this.isEnabled) {
      console.log('🔄 Realtime sync disabled in development mode');
      return;
    }
    
    try {
      console.log('🔄 Initializing realtime sync for player:', playerId);
      
      // Clean up existing channel if any
      if (this.channel) {
        await this.cleanup();
      }

      // Create a channel for asset updates
      this.channel = this.supabase.channel('assets-sync', {
        config: {
          broadcast: {
            self: false, // Don't receive own broadcasts
          },
        },
      });

      // Subscribe to database changes for assets
      this.channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'asset',
          },
          (payload) => {
            this.handleAssetChange(payload);
          }
        )
        .on('broadcast', { event: 'asset-update' }, (payload) => {
          this.handleBroadcast(payload);
        })
        .subscribe((status) => {
          console.log('📡 Realtime subscription status:', status);
        });
        
      console.log('✅ Realtime sync initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize realtime sync:', error);
    }
  }

  // Handle database changes
  private async handleAssetChange(payload: any) {
    if (!this.isEnabled) return;
    
    try {
      const store = useEmpireStore.getState();
      console.log('📡 Asset change received:', payload.eventType, payload.new?.asset_id);
      
      // Handle different event types
      switch (payload.eventType) {
        case 'INSERT':
          // Convert database asset to PlacedAsset format
          const newAsset = this.convertDbAssetToPlacedAsset(payload.new);
          if (newAsset) {
            store.placedAssets.set(newAsset.id, newAsset);
          }
          break;
          
        case 'UPDATE':
          // Update existing asset
          const updatedAsset = this.convertDbAssetToPlacedAsset(payload.new);
          if (updatedAsset) {
            store.placedAssets.set(updatedAsset.id, updatedAsset);
          }
          break;
          
        case 'DELETE':
          // Remove asset
          if (payload.old?.asset_id) {
            store.placedAssets.delete(payload.old.asset_id);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error handling asset change:', error);
    }
  }

  // Handle broadcast messages (for instant updates)
  private handleBroadcast(payload: any) {
    if (!this.isEnabled) return;

    const { type, data } = payload.payload;
    
    switch (type) {
      case 'asset-moved':
        // Handle real-time asset movement
        this.updateAssetPosition(data.assetId, data.position);
        break;
        
      case 'route-assigned':
        // Handle route assignment
        this.updateAssetRoute(data.assetId, data.routeId);
        break;
        
      case 'market-update':
        // Handle market price updates
        console.log('Market update:', data);
        break;
    }
  }

  // Broadcast asset movement
  async broadcastAssetMove(assetId: string, position: { x: number; y: number }) {
    if (!this.isEnabled) return;
    if (!this.channel) return;
    
    await this.channel.send({
      type: 'broadcast',
      event: 'asset-update',
      payload: {
        type: 'asset-moved',
        data: { assetId, position },
      },
    });
  }

  // Broadcast route assignment
  async broadcastRouteAssignment(assetId: string, routeId: string) {
    if (!this.isEnabled) return;
    if (!this.channel) return;
    
    await this.channel.send({
      type: 'broadcast',
      event: 'asset-update',
      payload: {
        type: 'route-assigned',
        data: { assetId, routeId },
      },
    });
  }

  // Update asset position locally
  private updateAssetPosition(assetId: string, position: { x: number; y: number }) {
    if (!this.isEnabled) return;
    const store = useEmpireStore.getState();
    const asset = store.placedAssets.get(assetId);
    if (asset) {
      const updatedAssets = new Map(store.placedAssets);
      updatedAssets.set(assetId, { ...asset, position });
      // Update store without triggering DB update
      useEmpireStore.setState({ placedAssets: updatedAssets });
    }
  }

  // Update asset route locally
  private updateAssetRoute(assetId: string, routeId: string) {
    if (!this.isEnabled) return;
    const store = useEmpireStore.getState();
    const asset = store.placedAssets.get(assetId);
    if (asset) {
      const updatedAssets = new Map(store.placedAssets);
      updatedAssets.set(assetId, { ...asset, routeId });
      // Update store without triggering DB update
      useEmpireStore.setState({ placedAssets: updatedAssets });
    }
  }

  // Clean up subscriptions
  async cleanup() {
    if (!this.isEnabled) return;
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // Helper to convert database asset to PlacedAsset format
  private convertDbAssetToPlacedAsset(dbAsset: any): PlacedAsset | null {
    if (!dbAsset || !dbAsset.asset_id) {
      console.warn('Received invalid asset data for conversion:', dbAsset);
      return null;
    }

         const asset: PlacedAsset = {
       id: dbAsset.asset_id,
       definitionId: dbAsset.stats?.definitionId || '',
       ownerId: dbAsset.owner_id,
       position: dbAsset.stats?.position || { x: 0, y: 0 },
       rotation: dbAsset.stats?.rotation || 0,
       portId: dbAsset.stats?.portId,
       routeId: dbAsset.assigned_route_id,
       status: dbAsset.stats?.status || 'active',
       health: dbAsset.stats?.health || 100,
       purchasedAt: dbAsset.stats?.purchasedAt || Date.now(),
       customName: dbAsset.custom_name,
     };

    return asset;
  }
}

// Singleton instance
export const realtimeAssetSync = new RealtimeAssetSync(); 