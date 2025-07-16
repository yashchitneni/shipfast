import * as Phaser from 'phaser';
import { useRouteStore } from '../../../app/store/useRouteStore';
import { useEmpireStore } from '../../store/empireStore';
import type { Route, RouteState } from '../../../types/route';
import type { PortNode } from '../../../app/lib/types/assets';

interface AnimatedShip {
  sprite: Phaser.GameObjects.Sprite;
  route: Route;
  progress: number;
  speed: number;
  path: Phaser.Curves.Path;
}

export class RouteRenderSystem {
  private scene: Phaser.Scene;
  private routeGraphics: Map<string, Phaser.GameObjects.Graphics>;
  private routeTexts: Map<string, Phaser.GameObjects.Text>;
  private assetSprites: Map<string, Phaser.GameObjects.Sprite>;
  private animatedShips: Map<string, AnimatedShip[]>;
  private updateInterval: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.routeGraphics = new Map();
    this.routeTexts = new Map();
    this.assetSprites = new Map();
    this.animatedShips = new Map();
    this.updateInterval = 0;
  }

  /**
   * Initialize the route rendering system
   */
  initialize() {
    // Subscribe to route changes
    useRouteStore.subscribe(
      (state) => state.routes,
      () => this.renderAllRoutes()
    );

    // Subscribe to route state changes
    useRouteStore.subscribe(
      (state) => state.routeStates,
      () => this.updateRouteStates()
    );

    // Initial render
    this.renderAllRoutes();
  }

  /**
   * Update route rendering every frame
   */
  update(time: number, delta: number) {
    this.updateInterval += delta;
    
    // Update asset positions every 100ms
    if (this.updateInterval > 100) {
      this.updateAssetPositions();
      this.updateAnimatedShips(delta);
      this.updateInterval = 0;
    }
  }

  /**
   * Render all active routes
   */
  private renderAllRoutes() {
    const routeStore = useRouteStore.getState();
    const empireStore = useEmpireStore.getState();
    const portNodes = empireStore.portNodes;
    
    // Clear existing graphics
    this.routeGraphics.forEach(graphics => graphics.destroy());
    this.routeGraphics.clear();
    
    // Render each active route
    routeStore.routes.forEach(route => {
      if (route.isActive) {
        this.renderRoute(route, portNodes);
        this.createAnimatedShips(route, portNodes);
      }
    });
  }

  /**
   * Render a single route
   */
  private renderRoute(route: Route, portNodes: PortNode[]) {
    const graphics = this.scene.add.graphics();
    this.routeGraphics.set(route.id, graphics);
    
    // Get port positions
    const originPort = portNodes.find(p => p.id === route.originPortId);
    const destPort = portNodes.find(p => p.id === route.destinationPortId);
    
    if (!originPort || !destPort) return;
    
    // Set depth for route graphics
    graphics.setDepth(5);
    
    // Draw route line with curved path
    const color = this.getRouteColor(route);
    graphics.lineStyle(3, color, 0.7);
    
    // Create curved path using bezier curves
    const path = new Phaser.Curves.Path(originPort.position.x, originPort.position.y);
    
    // Add waypoints to path
    const allPoints = [originPort];
    route.waypoints.forEach(waypointId => {
      const waypoint = portNodes.find(p => p.id === waypointId);
      if (waypoint) allPoints.push(waypoint);
    });
    allPoints.push(destPort);
    
    // Create curved segments between points
    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i].position;
      const end = allPoints[i + 1].position;
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // Add slight curve to make routes more visually appealing
      const curve = Math.sin(i * Math.PI / 2) * 20;
      const controlX = midX + curve;
      const controlY = midY - Math.abs(curve);
      
      path.quadraticBezierTo(controlX, controlY, end.x, end.y);
    }
    
    // Draw the path
    path.draw(graphics);
    
    // Draw route direction arrows
    this.drawDirectionArrows(graphics, originPort, destPort, route.waypoints, portNodes);
    
    // Add route label with profitability info
    const midX = (originPort.position.x + destPort.position.x) / 2;
    const midY = (originPort.position.y + destPort.position.y) / 2;
    
    const profitInfo = route.profitability.netProfit > 0 
      ? `+$${Math.round(route.profitability.netProfit).toLocaleString()}/day`
      : `-$${Math.abs(Math.round(route.profitability.netProfit)).toLocaleString()}/day`;
    
    const text = this.scene.add.text(midX, midY - 20, `${route.name}\n${profitInfo}`, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 4, y: 2 },
      align: 'center'
    });
    text.setOrigin(0.5);
    text.setDepth(6);
    
    // Make route interactive
    graphics.setInteractive(new Phaser.Geom.Rectangle(
      Math.min(originPort.position.x, destPort.position.x) - 50,
      Math.min(originPort.position.y, destPort.position.y) - 50,
      Math.abs(destPort.position.x - originPort.position.x) + 100,
      Math.abs(destPort.position.y - originPort.position.y) + 100
    ), Phaser.Geom.Rectangle.Contains);
    
    graphics.on('pointerover', () => {
      graphics.setAlpha(1);
      text.setScale(1.1);
    });
    
    graphics.on('pointerout', () => {
      graphics.setAlpha(0.7);
      text.setScale(1);
    });
    
    graphics.on('pointerdown', () => {
      this.selectRoute(route.id);
    });
    
    this.routeTexts.set(route.id, text);
  }

  /**
   * Get route color based on profitability
   */
  private getRouteColor(route: Route): number {
    const profitMargin = route.profitability.profitMargin;
    
    if (profitMargin > 20) return 0x00ff00; // Green - highly profitable
    if (profitMargin > 10) return 0xffff00; // Yellow - moderately profitable
    if (profitMargin > 0) return 0xff8800; // Orange - low profit
    return 0xff0000; // Red - unprofitable
  }

  /**
   * Draw direction arrows along the route
   */
  private drawDirectionArrows(
    graphics: Phaser.GameObjects.Graphics,
    origin: PortNode,
    destination: PortNode,
    waypoints: string[],
    portNodes: PortNode[]
  ) {
    const points: { x: number; y: number }[] = [origin.position];
    
    // Add waypoint positions
    waypoints.forEach(waypointId => {
      const waypoint = portNodes.find(p => p.id === waypointId);
      if (waypoint) {
        points.push(waypoint.position);
      }
    });
    
    points.push(destination.position);
    
    // Draw arrows between each segment
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // Calculate arrow angle
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      
      // Draw arrow
      graphics.save();
      graphics.translateCanvas(midX, midY);
      graphics.rotateCanvas(angle);
      graphics.fillStyle(0xffffff, 0.8);
      graphics.fillTriangle(-5, -5, 5, 0, -5, 5);
      graphics.restore();
    }
  }

  /**
   * Update route states (e.g., show progress)
   */
  private updateRouteStates() {
    const routeStore = useRouteStore.getState();
    const empireStore = useEmpireStore.getState();
    
    routeStore.routeStates.forEach((state, routeId) => {
      const route = routeStore.routes.get(routeId);
      if (!route || !route.isActive) return;
      
      // Update or create asset sprites for in-transit routes
      if (state.status === 'in-transit') {
        this.updateAssetSprite(route, state, empireStore.portNodes);
      }
    });
  }

  /**
   * Update or create asset sprite for a route
   */
  private updateAssetSprite(route: Route, state: RouteState, portNodes: PortNode[]) {
    let sprite = this.assetSprites.get(route.id);
    
    if (!sprite) {
      // Create new sprite
      sprite = this.scene.add.sprite(0, 0, 'ship-icon');
      sprite.setScale(0.5);
      this.assetSprites.set(route.id, sprite);
    }
    
    // Calculate position based on progress
    const originPort = portNodes.find(p => p.id === route.originPortId);
    const destPort = portNodes.find(p => p.id === route.destinationPortId);
    
    if (!originPort || !destPort) return;
    
    const progress = state.progress / 100;
    const x = originPort.position.x + (destPort.position.x - originPort.position.x) * progress;
    const y = originPort.position.y + (destPort.position.y - originPort.position.y) * progress;
    
    sprite.setPosition(x, y);
    
    // Rotate sprite to face direction
    const angle = Math.atan2(
      destPort.position.y - originPort.position.y,
      destPort.position.x - originPort.position.x
    );
    sprite.setRotation(angle);
  }

  /**
   * Update asset positions along routes
   */
  private updateAssetPositions() {
    const routeStore = useRouteStore.getState();
    const empireStore = useEmpireStore.getState();
    
    this.assetSprites.forEach((sprite, routeId) => {
      const route = routeStore.routes.get(routeId);
      const state = routeStore.routeStates.get(routeId);
      
      if (!route || !state || state.status !== 'in-transit') {
        sprite.setVisible(false);
        return;
      }
      
      sprite.setVisible(true);
      this.updateAssetSprite(route, state, empireStore.portNodes);
    });
  }

  /**
   * Handle route selection
   */
  selectRoute(routeId: string | null) {
    const routeStore = useRouteStore.getState();
    routeStore.selectRoute(routeId);
    
    // Highlight selected route
    this.routeGraphics.forEach((graphics, id) => {
      if (id === routeId) {
        graphics.setAlpha(1);
        graphics.setDepth(10);
      } else {
        graphics.setAlpha(0.5);
        graphics.setDepth(0);
      }
    });
  }

  /**
   * Create animated ships for a route
   */
  private createAnimatedShips(route: Route, portNodes: PortNode[]) {
    // Remove existing ships for this route
    const existingShips = this.animatedShips.get(route.id) || [];
    existingShips.forEach(ship => ship.sprite.destroy());
    
    // Create path for ships to follow
    const originPort = portNodes.find(p => p.id === route.originPortId);
    const destPort = portNodes.find(p => p.id === route.destinationPortId);
    if (!originPort || !destPort) return;
    
    const path = new Phaser.Curves.Path(originPort.position.x, originPort.position.y);
    
    // Add waypoints to path
    const allPoints = [originPort];
    route.waypoints.forEach(waypointId => {
      const waypoint = portNodes.find(p => p.id === waypointId);
      if (waypoint) allPoints.push(waypoint);
    });
    allPoints.push(destPort);
    
    // Create curved segments
    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i].position;
      const end = allPoints[i + 1].position;
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      const curve = Math.sin(i * Math.PI / 2) * 20;
      const controlX = midX + curve;
      const controlY = midY - Math.abs(curve);
      
      path.quadraticBezierTo(controlX, controlY, end.x, end.y);
    }
    
    // Create ships based on assigned assets
    const ships: AnimatedShip[] = [];
    const numShips = Math.min(route.assignedAssets.length || 1, 3); // Max 3 ships per route for performance
    
    for (let i = 0; i < numShips; i++) {
      const sprite = this.scene.add.sprite(0, 0, 'ship-icon');
      sprite.setScale(0.6);
      sprite.setDepth(7);
      sprite.setTint(this.getRouteColor(route));
      
      // Add simple wake effect using sprites
      const wakeContainer = this.scene.add.container(0, 0);
      wakeContainer.setDepth(6);
      
      // Create wake trail sprites
      const wakeSprites: Phaser.GameObjects.Sprite[] = [];
      for (let j = 0; j < 5; j++) {
        const wakeSprite = this.scene.add.sprite(0, 0, 'ship-icon');
        wakeSprite.setScale(0.2 - j * 0.03);
        wakeSprite.setAlpha(0.3 - j * 0.05);
        wakeSprite.setTint(0x6699ff);
        wakeSprites.push(wakeSprite);
        wakeContainer.add(wakeSprite);
      }
      
      // Store wake sprites with ship data
      (sprite as any).wakeSprites = wakeSprites;
      (sprite as any).wakeContainer = wakeContainer;
      
      ships.push({
        sprite,
        route,
        progress: (i * 0.33) % 1, // Distribute ships along route
        speed: 0.0001 + Math.random() * 0.0001, // Slight speed variation
        path
      });
    }
    
    this.animatedShips.set(route.id, ships);
  }
  
  /**
   * Update animated ships
   */
  private updateAnimatedShips(delta: number) {
    this.animatedShips.forEach((ships, routeId) => {
      const route = useRouteStore.getState().routes.get(routeId);
      if (!route || !route.isActive) {
        // Remove ships if route is no longer active
        ships.forEach(ship => {
          const wakeContainer = (ship.sprite as any).wakeContainer;
          if (wakeContainer) {
            wakeContainer.destroy(true);
          }
          ship.sprite.destroy();
        });
        this.animatedShips.delete(routeId);
        return;
      }
      
      ships.forEach(ship => {
        // Update progress
        ship.progress += ship.speed * delta;
        if (ship.progress > 1) {
          ship.progress = 0;
        }
        
        // Get position on path
        const point = ship.path.getPoint(ship.progress);
        if (point) {
          // Store previous positions for wake trail
          const prevX = ship.sprite.x;
          const prevY = ship.sprite.y;
          
          ship.sprite.setPosition(point.x, point.y);
          
          // Calculate rotation
          const nextProgress = Math.min(ship.progress + 0.01, 1);
          const nextPoint = ship.path.getPoint(nextProgress);
          if (nextPoint) {
            const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
            ship.sprite.setRotation(angle);
            
            // Update wake trail
            const wakeSprites = (ship.sprite as any).wakeSprites;
            const wakeContainer = (ship.sprite as any).wakeContainer;
            if (wakeSprites && wakeContainer) {
              // Position wake container at ship location
              wakeContainer.setPosition(point.x, point.y);
              
              // Update wake sprite positions
              for (let i = 0; i < wakeSprites.length; i++) {
                const wakeSprite = wakeSprites[i];
                const offset = (i + 1) * 15;
                wakeSprite.setPosition(
                  -Math.cos(angle) * offset,
                  -Math.sin(angle) * offset
                );
                wakeSprite.setRotation(angle);
              }
            }
          }
        }
      });
    });
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.routeGraphics.forEach(graphics => graphics.destroy());
    this.routeTexts.forEach(text => text.destroy());
    this.assetSprites.forEach(sprite => sprite.destroy());
    this.animatedShips.forEach(ships => {
      ships.forEach(ship => {
        // Destroy wake effects
        const wakeContainer = (ship.sprite as any).wakeContainer;
        if (wakeContainer) {
          wakeContainer.destroy(true);
        }
        ship.sprite.destroy();
      });
    });
    
    this.routeGraphics.clear();
    this.routeTexts.clear();
    this.assetSprites.clear();
    this.animatedShips.clear();
  }
}