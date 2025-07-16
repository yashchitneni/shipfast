import React from 'react';
import { useEmpireStore, EmpireState } from '../store/empireStore';
import { Asset, Route, MarketGood, MarketEvent, Ship, Plane } from '../../types/game';

// Event types for Phaser-React communication
export enum BridgeEvent {
  // State sync events
  STATE_UPDATED = 'STATE_UPDATED',
  ASSET_SELECTED = 'ASSET_SELECTED',
  ROUTE_SELECTED = 'ROUTE_SELECTED',
  
  // Asset events
  ASSET_ADDED = 'ASSET_ADDED',
  ASSET_UPDATED = 'ASSET_UPDATED',
  ASSET_REMOVED = 'ASSET_REMOVED',
  ASSET_MOVED = 'ASSET_MOVED',
  
  // Route events
  ROUTE_ADDED = 'ROUTE_ADDED',
  ROUTE_UPDATED = 'ROUTE_UPDATED',
  ROUTE_REMOVED = 'ROUTE_REMOVED',
  ROUTE_ACTIVATED = 'ROUTE_ACTIVATED',
  ROUTE_DEACTIVATED = 'ROUTE_DEACTIVATED',
  
  // Market events
  MARKET_UPDATE = 'MARKET_UPDATE',
  MARKET_EVENT_TRIGGERED = 'MARKET_EVENT_TRIGGERED',
  
  // Game events
  DISASTER_OCCURRED = 'DISASTER_OCCURRED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  LEVEL_UP = 'LEVEL_UP',
  
  // UI events from Phaser
  MAP_CLICKED = 'MAP_CLICKED',
  ASSET_CLICKED = 'ASSET_CLICKED',
  ROUTE_CLICKED = 'ROUTE_CLICKED',
  PORT_CLICKED = 'PORT_CLICKED',
  
  // Camera events
  CAMERA_MOVED = 'CAMERA_MOVED',
  ZOOM_CHANGED = 'ZOOM_CHANGED'
}

// Bridge payload types
export interface BridgePayload {
  event: BridgeEvent;
  data: any;
  timestamp: number;
}

// State synchronization bridge
export class StateBridge {
  private static instance: StateBridge;
  private eventEmitter: EventTarget;
  private stateSubscribers: Map<string, () => void> = new Map();
  private phaserScene: any = null;
  
  private constructor() {
    this.eventEmitter = new EventTarget();
    this.setupStateSubscriptions();
  }
  
  static getInstance(): StateBridge {
    if (!StateBridge.instance) {
      StateBridge.instance = new StateBridge();
    }
    return StateBridge.instance;
  }
  
  // Set Phaser scene reference
  setPhaserScene(scene: any) {
    this.phaserScene = scene;
    this.syncFullState();
  }
  
  // Get current state snapshot
  getStateSnapshot(): Partial<EmpireState> {
    const state = useEmpireStore.getState();
    return {
      player: state.player,
      assets: state.assets,
      routes: state.routes,
      activeRoutes: state.activeRoutes,
      market: state.market,
      selectedAssetId: state.selectedAssetId,
      selectedRouteId: state.selectedRouteId
    };
  }
  
  // Setup Zustand subscriptions
  private setupStateSubscriptions() {
    const store = useEmpireStore;
    
    // Subscribe to player changes
    const unsubPlayer = store.subscribe(
      (state) => state.player,
      (player) => {
        this.emit(BridgeEvent.STATE_UPDATED, { player });
      }
    );
    this.stateSubscribers.set('player', unsubPlayer);
    
    // Subscribe to asset changes
    const unsubAssets = store.subscribe(
      (state) => state.assets,
      (assets) => {
        this.emit(BridgeEvent.STATE_UPDATED, { assets });
      }
    );
    this.stateSubscribers.set('assets', unsubAssets);
    
    // Subscribe to route changes
    const unsubRoutes = store.subscribe(
      (state) => state.routes,
      (routes) => {
        this.emit(BridgeEvent.STATE_UPDATED, { routes });
      }
    );
    this.stateSubscribers.set('routes', unsubRoutes);
    
    // Subscribe to market changes
    const unsubMarket = store.subscribe(
      (state) => state.market,
      (market) => {
        this.emit(BridgeEvent.MARKET_UPDATE, market);
      }
    );
    this.stateSubscribers.set('market', unsubMarket);
    
    // Subscribe to selection changes
    const unsubSelectedAsset = store.subscribe(
      (state) => state.selectedAssetId,
      (assetId) => {
        this.emit(BridgeEvent.ASSET_SELECTED, { assetId });
      }
    );
    this.stateSubscribers.set('selectedAsset', unsubSelectedAsset);
    
    const unsubSelectedRoute = store.subscribe(
      (state) => state.selectedRouteId,
      (routeId) => {
        this.emit(BridgeEvent.ROUTE_SELECTED, { routeId });
      }
    );
    this.stateSubscribers.set('selectedRoute', unsubSelectedRoute);
  }
  
  // Emit event to both React and Phaser
  emit(event: BridgeEvent, data: any) {
    const payload: BridgePayload = {
      event,
      data,
      timestamp: Date.now()
    };
    
    // Emit to React listeners
    const customEvent = new CustomEvent('bridge-event', { detail: payload });
    this.eventEmitter.dispatchEvent(customEvent);
    
    // Emit to Phaser if scene is available
    if (this.phaserScene && this.phaserScene.events) {
      this.phaserScene.events.emit(event, data);
    }
  }
  
  // Listen to events from either side
  on(event: BridgeEvent | 'bridge-event', callback: (data: any) => void): () => void {
    const handler = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (event === 'bridge-event' || (e.detail && e.detail.event === event)) {
          callback(event === 'bridge-event' ? e.detail : e.detail.data);
        }
      }
    };
    
    this.eventEmitter.addEventListener('bridge-event', handler);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.removeEventListener('bridge-event', handler);
    };
  }
  
  // Sync full state to Phaser
  syncFullState() {
    if (this.phaserScene) {
      const state = this.getStateSnapshot();
      this.phaserScene.events.emit(BridgeEvent.STATE_UPDATED, state);
    }
  }
  
  // Handle events from Phaser
  handlePhaserEvent(event: BridgeEvent, data: any) {
    const store = useEmpireStore.getState();
    
    switch (event) {
      case BridgeEvent.ASSET_CLICKED:
        store.setSelectedAsset(data.assetId);
        break;
        
      case BridgeEvent.ROUTE_CLICKED:
        store.setSelectedRoute(data.routeId);
        break;
        
      case BridgeEvent.MAP_CLICKED:
        // Clear selections
        store.setSelectedAsset(null);
        store.setSelectedRoute(null);
        break;
        
      case BridgeEvent.ASSET_MOVED:
        // Update asset position
        if (data.assetId && data.position) {
          store.updateAsset(data.assetId, {
            currentLocation: data.position
          });
        }
        break;
        
      case BridgeEvent.DISASTER_OCCURRED:
        // Handle disaster event
        store.addNotification({
          type: 'WARNING',
          title: 'Disaster!',
          message: data.message,
          isRead: false
        });
        break;
        
      default:
        // Emit to React listeners
        this.emit(event, data);
    }
  }
  
  // Asset-specific methods
  getAssetPosition(assetId: string): { x: number; y: number } | null {
    const state = useEmpireStore.getState();
    const allAssets = [
      ...Object.values(state.assets.ships),
      ...Object.values(state.assets.planes)
    ];
    
    const asset = allAssets.find(a => a.id === assetId);
    if (asset && 'currentLocation' in asset && asset.currentLocation) {
      // Parse location to coordinates
      // This would need to map port/location names to actual coordinates
      return this.locationToCoordinates(asset.currentLocation);
    }
    
    return null;
  }
  
  getRouteAssets(routeId: string): Asset[] {
    const state = useEmpireStore.getState();
    const route = state.routes[routeId];
    if (!route) return [];
    
    const allAssets = [
      ...Object.values(state.assets.ships),
      ...Object.values(state.assets.planes)
    ];
    
    return allAssets.filter(asset => 
      route.assignedAssets.includes(asset.id)
    );
  }
  
  // Convert location names to map coordinates
  private locationToCoordinates(location: string): { x: number; y: number } {
    // This would be replaced with actual port coordinate mapping
    const portCoordinates: Record<string, { x: number; y: number }> = {
      'Shanghai': { x: 1200, y: 450 },
      'Singapore': { x: 1100, y: 600 },
      'Los Angeles': { x: 200, y: 400 },
      'Rotterdam': { x: 800, y: 300 },
      'Dubai': { x: 950, y: 500 },
      // ... more ports
    };
    
    return portCoordinates[location] || { x: 0, y: 0 };
  }
  
  // Animation helpers
  animateAssetMovement(assetId: string, from: string, to: string, duration: number) {
    const fromCoords = this.locationToCoordinates(from);
    const toCoords = this.locationToCoordinates(to);
    
    if (this.phaserScene && fromCoords && toCoords) {
      this.phaserScene.events.emit('ANIMATE_ASSET', {
        assetId,
        from: fromCoords,
        to: toCoords,
        duration
      });
    }
  }
  
  // Cleanup
  destroy() {
    // Unsubscribe from all state subscriptions
    this.stateSubscribers.forEach(unsub => unsub());
    this.stateSubscribers.clear();
    
    // Clear Phaser reference
    this.phaserScene = null;
  }
}

// Export singleton instance
export const stateBridge = StateBridge.getInstance();

// React hook for using the state bridge
export function useStateBridge() {
  const [events, setEvents] = React.useState<BridgePayload[]>([]);
  
  React.useEffect(() => {
    const unsubscribe = stateBridge.on('bridge-event', (payload: BridgePayload) => {
      setEvents(prev => [...prev, payload]);
    });
    
    return unsubscribe;
  }, []);
  
  return {
    bridge: stateBridge,
    events,
    emit: (event: BridgeEvent, data: any) => stateBridge.emit(event, data)
  };
}