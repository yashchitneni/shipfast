import { Route, RouteState } from '../types/route';
import { useRouteStore } from '../app/store/useRouteStore';
import { useEmpireStore } from '../src/store/empireStore';
import { RouteRenderSystem } from '../src/game/systems/RouteRenderSystem';

// Bridge between React route store and Phaser scene
export class RouteBridge {
  private scene: Phaser.Scene | null = null;
  private routeRenderSystem: RouteRenderSystem | null = null;
  private unsubscribeRoute: (() => void) | null = null;
  private unsubscribeRouteState: (() => void) | null = null;
  private unsubscribeSelection: (() => void) | null = null;
  
  constructor() {
    // Initialize subscriptions
    this.subscribeToStores();
  }

  // Set the active Phaser scene
  setScene(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create route render system for this scene
    if (this.scene) {
      this.routeRenderSystem = new RouteRenderSystem(this.scene);
      this.routeRenderSystem.initialize();
    }
  }

  // Subscribe to store changes
  private subscribeToStores() {
    // Subscribe to route changes
    this.unsubscribeRoute = useRouteStore.subscribe(
      (state) => state.routes,
      () => this.handleRouteUpdate()
    );

    // Subscribe to route state changes
    this.unsubscribeRouteState = useRouteStore.subscribe(
      (state) => state.routeStates,
      () => this.handleRouteStateUpdate()
    );

    // Subscribe to route selection changes
    this.unsubscribeSelection = useRouteStore.subscribe(
      (state) => state.selectedRouteId,
      (selectedRouteId) => this.handleRouteSelection(selectedRouteId)
    );
  }

  // Handle route updates
  private handleRouteUpdate() {
    if (!this.scene || !this.routeRenderSystem) return;
    
    // The RouteRenderSystem already has its own subscription
    // This is just for additional bridge-specific logic if needed
    console.log('Routes updated in bridge');
  }

  // Handle route state updates
  private handleRouteStateUpdate() {
    if (!this.scene || !this.routeRenderSystem) return;
    
    // The RouteRenderSystem already handles this
    // This is for additional bridge-specific logic
    const routeStore = useRouteStore.getState();
    
    // Emit events for active routes
    routeStore.routeStates.forEach((state, routeId) => {
      if (state.status === 'in-transit') {
        this.scene!.events.emit('route-active', { routeId, state });
      }
    });
  }

  // Handle route selection
  private handleRouteSelection(selectedRouteId: string | null) {
    if (!this.scene || !this.routeRenderSystem) return;
    
    this.routeRenderSystem.selectRoute(selectedRouteId);
    
    // Emit selection event
    if (selectedRouteId) {
      this.scene.events.emit('route-selected', selectedRouteId);
    }
  }

  // Create a new route preview
  startRouteCreation(originPortId: string) {
    const routeStore = useRouteStore.getState();
    routeStore.startRoutePreview(originPortId);
  }

  // Update route preview
  updateRoutePreview(destinationPortId: string, waypoints?: string[]) {
    const routeStore = useRouteStore.getState();
    routeStore.updateRoutePreview(destinationPortId, waypoints);
  }

  // Cancel route creation
  cancelRouteCreation() {
    const routeStore = useRouteStore.getState();
    routeStore.cancelRoutePreview();
  }

  // Confirm route creation
  async confirmRouteCreation(name: string) {
    const routeStore = useRouteStore.getState();
    const empireStore = useEmpireStore.getState();
    
    if (!routeStore.routePreview || !empireStore.player) {
      return { success: false, error: 'Invalid route preview or player' };
    }
    
    const result = await routeStore.createRoute({
      name,
      originPortId: routeStore.routePreview.originPortId,
      destinationPortId: routeStore.routePreview.destinationPortId,
      waypoints: routeStore.routePreview.waypoints
    }, empireStore.player.id);
    
    if (result.success) {
      routeStore.cancelRoutePreview();
    }
    
    return result;
  }

  // Get route render system
  getRouteRenderSystem(): RouteRenderSystem | null {
    return this.routeRenderSystem;
  }

  // Clean up
  destroy() {
    // Unsubscribe from stores
    if (this.unsubscribeRoute) {
      this.unsubscribeRoute();
      this.unsubscribeRoute = null;
    }
    
    if (this.unsubscribeRouteState) {
      this.unsubscribeRouteState();
      this.unsubscribeRouteState = null;
    }
    
    if (this.unsubscribeSelection) {
      this.unsubscribeSelection();
      this.unsubscribeSelection = null;
    }
    
    // Destroy route render system
    if (this.routeRenderSystem) {
      this.routeRenderSystem.destroy();
      this.routeRenderSystem = null;
    }
    
    this.scene = null;
  }
}

// Singleton instance
export const routeBridge = new RouteBridge();