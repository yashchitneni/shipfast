import { createClient } from './client';
import { useEmpireStore } from '../../src/store/empireStore';
import { PlacedAsset } from '../../app/lib/types/assets';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeAssetSync {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private playerId: string | null = null;

  // Initialize real-time sync for a player
  async initialize(playerId: string) {
    this.playerId = playerId;
    
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
      .subscribe();
  }

  // Handle database changes
  private async handleAssetChange(payload: any) {
    const store = useEmpireStore.getState();
    
    switch (payload.eventType) {
      case 'INSERT':
        // Another player created an asset
        if (payload.new.owner_id !== this.playerId) {
          // In multiplayer, you might want to show other players' assets
          console.log('Another player created an asset:', payload.new);
        }
        break;
        
      case 'UPDATE':
        // Asset was updated
        if (payload.new.owner_id === this.playerId) {
          // Update local state if it's our asset
          const stats = payload.new.stats as any;
          const updatedAsset: Partial<PlacedAsset> = {
            customName: payload.new.custom_name,
            routeId: payload.new.assigned_route_id,
            status: stats.status,
            health: stats.health,
            position: stats.position,
            rotation: stats.rotation,
          };
          
          // Update the asset in local store without triggering another DB update
          const currentAssets = new Map(store.placedAssets);
          const existingAsset = currentAssets.get(payload.new.asset_id);
          if (existingAsset) {
            currentAssets.set(payload.new.asset_id, {
              ...existingAsset,
              ...updatedAsset,
            });
            // Force re-render without DB call
            if (store.player?.id) {
              store.setPlayerId(store.player.id);
            }
          }
        }
        break;
        
      case 'DELETE':
        // Asset was deleted
        if (payload.old.owner_id === this.playerId) {
          // Remove from local state
          const currentAssets = new Map(store.placedAssets);
          currentAssets.delete(payload.old.asset_id);
          // Force re-render without DB call
          if (store.player?.id) {
            store.setPlayerId(store.player.id);
          }
        }
        break;
    }
  }

  // Handle broadcast messages (for instant updates)
  private handleBroadcast(payload: any) {
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
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// Singleton instance
export const realtimeAssetSync = new RealtimeAssetSync(); 