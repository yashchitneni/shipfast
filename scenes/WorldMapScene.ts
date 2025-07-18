import * as Phaser from 'phaser';
import { SceneKeys, AssetKeys, GameEvents } from '../types/game';
import { useEmpireStore } from '../src/store/empireStore';
import { assetBridge } from '../utils/assetBridge';
import { IsometricTileMap } from '../utils/IsometricTileMap';
import { CameraController } from '../utils/CameraController';
import { minimapBridge } from '../utils/minimapBridge';
import { LODManager } from './LODManager';

// Create a simple route render system interface for now
interface RouteRenderSystem {
  update(time: number, delta: number): void;
}

// Simple route bridge implementation
const routeBridge = {
  setScene: (scene: Phaser.Scene) => {
    console.log('Route bridge set scene:', scene.scene.key);
  },
  getRouteRenderSystem: (): RouteRenderSystem => ({
    update: (time: number, delta: number) => {
      // Simple route rendering update
    }
  }),
  startRouteCreation: (portId: string) => {
    console.log('Starting route creation from port:', portId);
  },
  updateRoutePreview: (portId: string) => {
    console.log('Updating route preview to port:', portId);
  },
  destroy: () => {
    console.log('Route bridge destroyed');
  }
};

// Simple port bridge implementation
const portBridge = {
  setScene: (scene: Phaser.Scene) => {
    console.log('Port bridge set scene:', scene.scene.key);
  },
  destroy: () => {
    console.log('Port bridge destroyed');
  }
};

// Visual Style Guide colors
const COLORS = {
  OCEAN_BLUE: 0x0077BE,
  OCEAN_BLUE_HEX: '#0077BE',
  CARGO_GREEN: 0x00A652,
  CARGO_GREEN_HEX: '#00A652',
  SHIPPING_RED: 0xE03C31,
  SHIPPING_RED_HEX: '#E03C31',
  SUNSET_ORANGE: 0xFF6F61,
  SUNSET_ORANGE_HEX: '#FF6F61',
  NEUTRAL_GRAY: 0x808080,
  NEUTRAL_GRAY_HEX: '#808080',
  WHITE: 0xFFFFFF,
  WHITE_HEX: '#FFFFFF',
  BLACK: 0x000000,
  BLACK_HEX: '#000000'
};

// Camera configuration
const CAMERA_CONFIG = {
  zoomMin: 0.1,
  zoomMax: 2.0,
  zoomStep: 0.1,
  panSpeed: 5,
  smoothFactor: 0.95,
  initialZoom: 0.15
};

/**
 * @class WorldMapScene
 * @description The main Phaser scene that renders the interactive game world.
 * It is responsible for:
 * - Creating and rendering the isometric tile map.
 * - Managing camera controls (pan, zoom).
 * - Handling user input on the game canvas.
 * - Displaying game objects like ports and assets (via bridges).
 * - Connecting with the Zustand store via bridges to keep the visual state in sync.
 */
export default class WorldMapScene extends Phaser.Scene {
  private isometricMap!: IsometricTileMap;
  private cameraController!: CameraController;
  private routeRenderSystem!: RouteRenderSystem;
  private lodManager!: LODManager;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraDragStartX: number = 0;
  private cameraDragStartY: number = 0;
  private hasDraggedSignificantly: boolean = false;
  
  // Lighting
  private ambientLight!: Phaser.GameObjects.Rectangle;
  private timeOfDay: number = 12; // 0-24 hours
  
  // Legacy ship and port system (for compatibility)
  private ports: Phaser.GameObjects.Image[] = [];
  private ships: Phaser.GameObjects.Image[] = [];
  
  // UI elements
  private selectedShip: Phaser.GameObjects.Image | null = null;
  private routeGraphics!: Phaser.GameObjects.Graphics;
  private tooltip: Phaser.GameObjects.Text | null = null;
  
  // Asset placement
  private ghostSprite: Phaser.GameObjects.Image | null = null;
  private unsubscribeAssetToPlace: (() => void) | null = null;
  private validPlacementIndicator!: Phaser.GameObjects.Graphics;
  
  constructor() {
    super({ key: SceneKeys.WORLD_MAP });
  }

  /**
   * @method preload
   * @description Load assets before the scene starts
   */
  preload(): void {
    // Load the pixel art world map
    this.load.image('world-map', '/world-map.png');
    
    // Load port data
    this.load.json('port-data', '/assets/definitions/ports.json');
    
    // Note: Ship assets will be loaded when available
    // For now, the LOD system will use placeholder graphics
  }

  /**
   * @method create
   * @description Called once when the scene is created. This method sets up the initial
   * state of the game world, including the map, camera, input handlers, and bridges.
   */
  create(): void {
    // Create isometric map with image-based generation
    this.isometricMap = new IsometricTileMap(this);
    
    // Initialize the map with image data first, then create
    this.isometricMap.initialize().then(() => {
      // Now create the visual tiles
      this.isometricMap.create();
      
      // Add both map containers to the scene
      const containers = this.isometricMap.getContainers();
      this.add.existing(containers.tiles);
      this.add.existing(containers.sprites);
      
      // Set up camera
      this.setupCamera();
      
      // Initialize sprite visibility based on initial zoom
      this.isometricMap.updateZoom(CAMERA_CONFIG.initialZoom);
      console.log(`[WorldMapScene] Initial zoom: ${CAMERA_CONFIG.initialZoom}`);
      
      // Create camera controller
      this.cameraController = new CameraController(this.cameras.main);
      
      // Initialize LOD Manager BEFORE extracting ports
      this.lodManager = new LODManager(this, {
        detailThreshold: 1.5,
        simpleThreshold: 1.2,
        fadeTransition: true,
        cullingPadding: 300
      });
      
      // Extract ports from the isometric map and store them (after LOD manager is initialized)
      this.extractPortsFromMap();
      
      // Set up input handlers
      this.setupInputHandlers();
      
      // Create lighting system
      this.createLightingSystem();
      
      // Create route graphics layer
      this.routeGraphics = this.add.graphics();
      
      // Create valid placement indicator graphics
      this.validPlacementIndicator = this.add.graphics();
      this.validPlacementIndicator.setDepth(999);
      
      // Initialize asset bridge with this scene
      assetBridge.setScene(this);
      
      // Initialize route bridge with this scene
      routeBridge.setScene(this);
      
      // Initialize port bridge with this scene
      portBridge.setScene(this);
      
      // Initialize minimap bridge with this scene
      minimapBridge.setScene(this);
      
      // Get route render system from bridge
      this.routeRenderSystem = routeBridge.getRouteRenderSystem()!;
      
      // Create UI overlay
      this.createUIOverlay();
      
      // Connect to Zustand store
      this.connectToStore();
      
      // Load player assets from database
      this.loadPlayerAssets();
      
      // Set up asset bridge event listeners
      this.setupAssetBridgeEvents();
      
      // Set up route bridge event listeners
      this.setupRouteBridgeEvents();
      
      // Set up asset placement subscription
      this.setupAssetPlacement();
      
      // Set up minimap
      this.setupMinimap();
      
      // Set up zoom controls
      this.setupZoomControls();
      
      // Set up port event handlers
      this.setupPortEvents();
      
      // Emit scene ready event
      this.game.events.emit('sceneready', this);
    });
  }

  /**
   * @private
   * @method setupCamera
   * @description Initializes the main camera, setting its initial zoom, position, and boundaries.
   */
  private setupCamera(): void {
    const camera = this.cameras.main;
    
    // Set initial zoom to show more of the larger map
    camera.setZoom(CAMERA_CONFIG.initialZoom);
    
    // Center on map (adjust for larger map)
    camera.centerOn(0, 0);
    
    // Set bounds with more generous padding for the larger map
    const mapBounds = this.isometricMap.getMapBounds();
    camera.setBounds(
      mapBounds.x - 500,
      mapBounds.y - 500,
      mapBounds.width + 1000,
      mapBounds.height + 1000
    );
  }

  /**
   * @private
   * @method setupInputHandlers
   * @description Configures all user input listeners for the scene, including
   * mouse wheel for zooming, pointer dragging for panning, and keyboard controls.
   */
  private setupInputHandlers(): void {
    // Mouse wheel zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const camera = this.cameras.main;
      const zoom = camera.zoom;
      
      let newZoom;
      if (deltaY > 0) {
        // Zoom out
        newZoom = Math.max(CAMERA_CONFIG.zoomMin, zoom - CAMERA_CONFIG.zoomStep);
      } else {
        // Zoom in
        newZoom = Math.min(CAMERA_CONFIG.zoomMax, zoom + CAMERA_CONFIG.zoomStep);
      }
      
      camera.setZoom(newZoom);
      
      // Update sprite visibility based on zoom
      this.isometricMap.updateZoom(newZoom);
      console.log(`[WorldMapScene] Zoom changed to: ${newZoom}`);
      
      // Emit zoom change event for UI synchronization
      camera.emit('zoomchange', newZoom);
      minimapBridge.emit('zoom-update', newZoom);
    });
    
    // Mouse drag pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isDragging = true;
        this.hasDraggedSignificantly = false;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraDragStartX = this.cameras.main.scrollX;
        this.cameraDragStartY = this.cameras.main.scrollY;
      }
      
      // Right-click to create routes (legacy compatibility)
      if (pointer.rightButtonDown() && this.selectedShip) {
        this.createRoute(this.selectedShip.x, this.selectedShip.y, pointer.worldX, pointer.worldY);
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && pointer.leftButtonDown()) {
        const dragX = this.dragStartX - pointer.x;
        const dragY = this.dragStartY - pointer.y;
        
        // Check if we've dragged significantly (more than 10 pixels to be more forgiving)
        const dragDistance = Math.sqrt(dragX * dragX + dragY * dragY);
        if (dragDistance > 10 && !this.hasDraggedSignificantly) {
          this.hasDraggedSignificantly = true;
        }
        
        this.cameras.main.setScroll(
          this.cameraDragStartX + dragX,
          this.cameraDragStartY + dragY
        );
      }
    });
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // Only clear selected port if we weren't dragging significantly and clicked on empty area
      if (this.isDragging && !this.hasDraggedSignificantly && pointer.leftButtonReleased()) {
        const hitObjects = this.input.hitTestPointer(pointer);
        if (hitObjects.length === 0) {
          const store = useEmpireStore.getState();
          store.setSelectedPort(null);
        }
      }
      
      // Reset drag state
      this.isDragging = false;
      this.hasDraggedSignificantly = false;
    });
    
    // Keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      this.cameraController.setCursors(cursors);
    }
    
        // ESC to deselect or cancel placement
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        const store = useEmpireStore.getState();
        
        // Cancel asset placement if active
        if (store.assetToPlace) {
          store.setAssetToPlace(null);
          return;
        }
        
        // Close port panel if open
        if (store.selectedPort) {
          store.setSelectedPort(null);
          return;
        }
        
        // Otherwise deselect ship
        if (this.selectedShip) {
          this.selectedShip.clearTint();
          this.selectedShip = null;
          store.setSelectedShip(null);
        }
      });
    }
    
    // Touch support for mobile
    this.input.addPointer(2); // Support up to 3 touch points
  }

  private createLightingSystem(): void {
    // Disabled lighting system for now - it was creating a dark overlay
    // We can re-enable this later with better visual settings
    /*
    const { width, height } = this.cameras.main;
    
    // Create ambient light overlay
    this.ambientLight = this.add.rectangle(0, 0, width * 4, height * 4, 0x000000, 0.3);
    this.ambientLight.setOrigin(0, 0);
    this.ambientLight.setScrollFactor(0);
    this.ambientLight.setDepth(1000);
    
    // Initial lighting update
    this.updateLighting();
    */
  }

  private updateLighting(): void {
    // Disabled along with lighting system
    /*
    // Calculate lighting based on time of day
    let lightIntensity = 0.1;
    
    if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
      // Day time (6 AM to 6 PM)
      lightIntensity = 0.1;
    } else if (this.timeOfDay >= 19 || this.timeOfDay <= 5) {
      // Night time (7 PM to 5 AM)
      lightIntensity = 0.5;
    } else {
      // Twilight
      lightIntensity = 0.3;
    }
    
    this.ambientLight.setAlpha(lightIntensity);
    */
  }



  private selectShip(ship: Phaser.GameObjects.Image): void {
    // Deselect previous ship
    if (this.selectedShip) {
      this.selectedShip.clearTint();
    }

    // Select new ship
    this.selectedShip = ship;
    ship.setTint(0x32CD32); // Highlight Green

    const shipId = ship.getData('id');
    this.events.emit(GameEvents.SHIP_SELECTED, shipId);
    useEmpireStore.getState().setSelectedShip(shipId);
  }

  private createRoute(startX: number, startY: number, endX: number, endY: number): void {
    this.routeGraphics.lineStyle(2, 0xFFD700, 0.8); // Gold dashed line
    
    // Create dashed line effect
    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    const segments = Math.floor(distance / 20);
    
    for (let i = 0; i < segments; i += 2) {
      const t1 = i / segments;
      const t2 = Math.min((i + 1) / segments, 1);
      
      const x1 = Phaser.Math.Interpolation.Linear([startX, endX], t1);
      const y1 = Phaser.Math.Interpolation.Linear([startY, endY], t1);
      const x2 = Phaser.Math.Interpolation.Linear([startX, endX], t2);
      const y2 = Phaser.Math.Interpolation.Linear([startY, endY], t2);
      
      this.routeGraphics.beginPath();
      this.routeGraphics.moveTo(x1, y1);
      this.routeGraphics.lineTo(x2, y2);
      this.routeGraphics.strokePath();
    }

    // Move ship along route
    if (this.selectedShip) {
      this.tweens.add({
        targets: this.selectedShip,
        x: endX,
        y: endY,
        duration: distance * 10,
        ease: 'Linear',
      });
    }
  }

  private createUIOverlay(): void {
    // Create time display
    const timeText = this.add.text(20, 20, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 }
    });
    timeText.setScrollFactor(0);
    timeText.setDepth(2000);
    
    // Update time display
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const hours = Math.floor(this.timeOfDay);
        const minutes = Math.floor((this.timeOfDay - hours) * 60);
        timeText.setText(`Time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      },
      loop: true
    });
    
    // Create asset count display
    const assetCountText = this.add.text(20, 60, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 }
    });
    assetCountText.setScrollFactor(0);
    assetCountText.setDepth(2000);
    
    // Update asset count display
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        const store = useEmpireStore.getState();
        const assetCount = store.placedAssets.size;
        assetCountText.setText(`Assets: ${assetCount}`);
      },
      loop: true
    });
  }

  private loadPlayerAssets(): void {
    // Load player assets from the empire store
    const store = useEmpireStore.getState();
    if (store.player?.id) {
      store.loadPlayerAssets();
    }
  }

  private setupAssetBridgeEvents(): void {
    // Listen for asset selection events from the bridge
    this.events.on('asset-selected', (assetId: string) => {
      console.log('Asset selected in scene:', assetId);
      // You can add additional visual feedback here
    });
  }
  
  private setupRouteBridgeEvents(): void {
    // Listen for route selection events
    this.events.on('route-selected', (routeId: string) => {
      console.log('Route selected in scene:', routeId);
    });
    
    // Listen for active route events
    this.events.on('route-active', (data: { routeId: string; state: any }) => {
      console.log('Route active:', data.routeId);
    });
    
    // Handle port clicks for route creation
    this.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: any) => {
      if (gameObject.getData('type') === 'port') {
        const portId = gameObject.getData('id');
        console.log('Port clicked:', portId);
        
        // Simple port interaction - can be expanded later
        routeBridge.startRouteCreation(portId);
      }
    });
  }

  private connectToStore(): void {
    // Subscribe to store changes for game state
    const unsubscribe = useEmpireStore.subscribe((state) => {
      // Handle pause/resume
      if (state.isPaused) {
        this.scene.pause();
      } else {
        this.scene.resume();
      }
      
      // Handle game speed changes
      this.physics.world.timeScale = state.gameSpeed;
    });
    
    // Store unsubscribe function for cleanup
    this.events.once('shutdown', unsubscribe);
  }
  
  private setupAssetPlacement(): void {
    // Subscribe to assetToPlace changes
    this.unsubscribeAssetToPlace = useEmpireStore.subscribe(
      (state) => state.assetToPlace,
      (assetToPlace) => {
        if (assetToPlace) {
          this.createGhostSprite(assetToPlace);
        } else {
          this.destroyGhostSprite();
        }
      }
    );
    
    // Clean up subscription on shutdown
    this.events.once('shutdown', () => {
      if (this.unsubscribeAssetToPlace) {
        this.unsubscribeAssetToPlace();
      }
    });
  }
  
  private createGhostSprite(definitionId: string): void {
    const store = useEmpireStore.getState();
    const definition = store.assetDefinitions.get(definitionId);
    
    if (!definition) {
      console.error('Asset definition not found:', definitionId);
      return;
    }
    
    // Destroy existing ghost sprite if any
    this.destroyGhostSprite();
    
    // Create a simple colored rectangle as the ghost sprite for now
    // In a real implementation, you'd load the actual asset sprite
    const color = definition.type === 'ship' ? 0x00A652 : 0x0077BE;
    this.ghostSprite = this.add.image(0, 0, AssetKeys.SHIP_CARGO);
    this.ghostSprite.setAlpha(0.5);
    this.ghostSprite.setDepth(1000);
    this.ghostSprite.setTint(color);
    
    // Make it follow the mouse
    this.input.on('pointermove', this.updateGhostPosition, this);
    this.input.on('pointerdown', this.handleAssetPlacement, this);
  }
  
  private destroyGhostSprite(): void {
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
    
    // Clear placement indicator
    this.validPlacementIndicator.clear();
    
    // Remove event listeners
    this.input.off('pointermove', this.updateGhostPosition, this);
    this.input.off('pointerdown', this.handleAssetPlacement, this);
  }
  
  private updateGhostPosition(pointer: Phaser.Input.Pointer): void {
    if (!this.ghostSprite) return;
    
    const store = useEmpireStore.getState();
    
    // If we have an asset preview (from port selection), position at that port
    if (store.assetPreview) {
      this.ghostSprite.setPosition(store.assetPreview.position.x, store.assetPreview.position.y);
      this.ghostSprite.setTint(0x00FF00); // Green for valid placement
      
      // Update visual feedback
      this.validPlacementIndicator.clear();
      this.validPlacementIndicator.lineStyle(3, 0x00FF00, 0.8);
      this.validPlacementIndicator.strokeCircle(store.assetPreview.position.x, store.assetPreview.position.y, 50);
    } else {
      // Original behavior for non-ship assets
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.ghostSprite.setPosition(worldPoint.x, worldPoint.y);
      
      // Check if near a port
      const snapPort = store.checkPortSnap({ x: worldPoint.x, y: worldPoint.y }, 100);
      
      // Update visual feedback
      this.validPlacementIndicator.clear();
      
      if (snapPort) {
        // Snap to port position
        this.ghostSprite.setPosition(snapPort.position.x, snapPort.position.y);
        this.ghostSprite.setTint(0x00FF00); // Green for valid placement
        
        // Draw a circle around the port to indicate valid placement
        this.validPlacementIndicator.lineStyle(3, 0x00FF00, 0.8);
        this.validPlacementIndicator.strokeCircle(snapPort.position.x, snapPort.position.y, 50);
      } else {
        this.ghostSprite.setTint(0xFF0000); // Red for invalid placement
      }
    }
  }
  
  /**
   * @private
   * @method handleAssetPlacement
   * @description Event handler for when the player clicks to place an asset.
   * It checks for a valid snap-to-port location and calls the store action to finalize the placement.
   * @param {Phaser.Input.Pointer} pointer - The pointer event object.
   */
  private handleAssetPlacement(pointer: Phaser.Input.Pointer): void {
    if (!this.ghostSprite || !pointer.leftButtonDown()) return;
    
    const store = useEmpireStore.getState();
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Check if we already have a preview (from port selection)
    if (store.assetPreview) {
      // Asset is already positioned at the selected port, just place it
      store.placeAsset().then((result) => {
        if (result.success) {
          console.log('Asset placed successfully!');
          store.setAssetToPlace(null);
        } else {
          console.error('Failed to place asset:', result.error);
        }
      });
    } else {
      // Original snap-to-port behavior for non-ship assets
      const snapPort = store.checkPortSnap({ x: worldPoint.x, y: worldPoint.y }, 100);
      
      if (snapPort && store.assetToPlace) {
        // Start the preview at the port position
        store.startAssetPreview(store.assetToPlace, snapPort.position);
        
        // Place the asset
        store.placeAsset().then((result) => {
          if (result.success) {
            console.log('Asset placed successfully!');
            store.setAssetToPlace(null);
          } else {
            console.error('Failed to place asset:', result.error);
          }
        });
      }
    }
  }

  private showTooltip(text: string, x: number, y: number): void {
    this.hideTooltip();

    this.tooltip = this.add.text(x, y, text, {
      fontSize: '14px',
      color: '#FFFFFF',
    }).setOrigin(0.5, 0.5);
  }

  private hideTooltip(): void {
    this.tooltip?.destroy();
    this.tooltip = null;
  }

  /**
   * @method update
   * @description The main game loop, called on every frame.
   * It's responsible for continuous updates, such as moving the camera,
   * updating animations, and checking for real-time events.
   * @param {number} time - The current game time in milliseconds.
   * @param {number} delta - The delta time in milliseconds since the last frame.
   */
  update(time: number, delta: number): void {
    // Update camera controller
    if (this.cameraController) {
      this.cameraController.update(delta);
    }
    
    // Update route render system
    if (this.routeRenderSystem) {
      this.routeRenderSystem.update(time, delta);
    }
    
    // Update LOD culling (throttled to every 50ms for performance)
    if (this.lodManager && Math.floor(time) % 50 < delta) {
      this.lodManager.updateCulling();
    }
    
    // Update minimap viewport (throttled to every 100ms)
    if (Math.floor(time) % 100 < delta) {
      this.updateMinimapViewport();
    }
    
    // Update time of day (24-hour cycle over 10 minutes)
    this.timeOfDay += 0.004; // Adjust speed as needed
    if (this.timeOfDay >= 24) {
      this.timeOfDay = 0;
    }
    
    // Update lighting - disabled for now
    /*
    if (Math.floor(time / 1000) % 1 === 0) {
      this.updateLighting();
    }
    */
    
    // Update ship animations (legacy compatibility)
    this.ships.forEach((ship) => {
      // Add gentle bobbing effect
      ship.y += Math.sin(time * 0.001 + ship.x) * 0.1;
    });
  }

  private extractPortsFromMap(): void {
    const store = useEmpireStore.getState();
    
    // Load port data from JSON
    const portData = this.cache.json.get('port-data');
    if (portData && portData.ports) {
      // Convert ports to world coordinates before registering with LOD manager
      const portsWithWorldCoords = portData.ports.map((port: any) => {
        // Scale from 4000x3000 to 400x200 tile system
        const scaleX = 400 / 4000;
        const scaleY = 200 / 3000;
        const tileX = Math.floor(port.coordinates.x * scaleX);
        const tileY = Math.floor(port.coordinates.y * scaleY);
        
        // Convert to world coordinates
        const worldPos = this.isometricMap.tileToWorld(tileX, tileY);
        
        return {
          ...port,
          coordinates: worldPos,
          position: worldPos
        };
      });
      
      // Register ports with LOD manager using world coordinates
      this.lodManager.registerPorts(portsWithWorldCoords);
      
      // Convert port data for store
      const worldPortNodes: Array<{
        id: string;
        name: string;
        position: { x: number; y: number };
        region: string;
        capacity: number;
        connectedRoutes: string[];
      }> = [];
      
      portData.ports.forEach((port: any) => {
        // The coordinates from ports.json are in the 4000x3000 system
        // We need to scale them to our 400x200 tile system
        const scaleX = 400 / 4000;
        const scaleY = 200 / 3000;
        const tileX = Math.floor(port.coordinates.x * scaleX);
        const tileY = Math.floor(port.coordinates.y * scaleY);
        
        // Convert tile coordinates to world coordinates
        const worldPos = this.isometricMap.tileToWorld(tileX, tileY);
        
        const worldPortNode = {
          id: port.id,
          name: port.name,
          position: worldPos,
          region: port.countryName || 'Unknown',
          capacity: port.capacity || 100,
          connectedRoutes: []
        };
        
        worldPortNodes.push(worldPortNode);
      });
      
      // Register all ports with the empire store
      console.log(`[WorldMapScene] Loaded ${worldPortNodes.length} ports from JSON data`);
      console.log(`[WorldMapScene] Sample ports:`, worldPortNodes.slice(0, 3).map(p => `${p.name} at (${p.position.x}, ${p.position.y})`));
      
      // Log camera bounds for debugging
      const camera = this.cameras.main;
      console.log(`[WorldMapScene] Camera bounds: x=${camera.scrollX}, y=${camera.scrollY}, width=${camera.width}, height=${camera.height}, zoom=${camera.zoom}`);
      
      store.setPortNodes(worldPortNodes);
      
      // Load any placed assets for ports
      this.loadPortAssets();
    } else {
      // Fallback to extracting from map
      const portNodes = this.isometricMap.getPortNodes();
      
      // Convert to world coordinates and create port markers
      const worldPortNodes: Array<{
        id: string;
        name: string;
        position: { x: number; y: number };
        region: string;
        capacity: number;
        connectedRoutes: string[];
      }> = [];
      
      portNodes.forEach(portNode => {
        // Convert tile coordinates to world coordinates
        const worldPos = this.isometricMap.tileToWorld(portNode.position.x, portNode.position.y);
        
        // Create a port node with world coordinates
        const worldPortNode = {
          id: portNode.id,
          name: portNode.name,
          position: { x: worldPos.x, y: worldPos.y },
          region: portNode.region,
          capacity: 100,
          connectedRoutes: portNode.connectedRoutes
        };
        
        worldPortNodes.push(worldPortNode);
        
        // Register with LOD manager
        this.lodManager.registerPort({
          id: portNode.id,
          name: portNode.name,
          coordinates: worldPortNode.position,
          infrastructure: {
            docks: Math.floor(Math.random() * 50) + 10,
            cranes: Math.floor(Math.random() * 100) + 20,
            warehouses: Math.floor(Math.random() * 30) + 5,
            railConnections: Math.random() > 0.5,
            deepWaterAccess: Math.random() > 0.3
          }
        });
      });
      
      // Register all found ports with the empire store
      console.log(`[WorldMapScene] Found ${worldPortNodes.length} ports in the map`);
      store.setPortNodes(worldPortNodes);
    }
  }
  
  private loadPortAssets(): void {
    const store = useEmpireStore.getState();
    
    // Get all placed assets
    const placedAssets = Array.from(store.placedAssets.values());
    
    // Group assets by port
    const assetsByPort = new Map<string, any[]>();
    
    placedAssets.forEach(asset => {
      if (asset.portId) {
        if (!assetsByPort.has(asset.portId)) {
          assetsByPort.set(asset.portId, []);
        }
        
        const assetDef = store.assetDefinitions.get(asset.definitionId);
        assetsByPort.get(asset.portId)!.push({
          id: asset.id,
          type: assetDef?.type || 'ship',
          name: assetDef?.name || 'Unknown Asset',
          status: asset.status
        });
      }
    });
    
    // Register assets with LOD manager
    assetsByPort.forEach((assets, portId) => {
      this.lodManager.addPortAssets(portId, assets);
    });
  }
  
  // Port marker creation is now handled by LOD system
  
  private zoomToPort(portNode: { id: string; name: string; position: { x: number; y: number } }): void {
    const store = useEmpireStore.getState();
    
    // Cancel any active asset placement
    if (store.assetToPlace) {
      store.setAssetToPlace(null);
    }
    
    // Use camera controller to pan and zoom
    this.cameraController.panTo(portNode.position.x, portNode.position.y);
    this.cameraController.zoomTo(1.5);
    
    // Show land sprite at this specific port location
    this.showLandSpriteAtPort(portNode);
    
    // Emit event for UI to show port management panel
    this.events.emit('port-focused', portNode);
    
    // Store the focused port in the empire store
    store.setSelectedPort(portNode.id);
  }
  
  /**
   * @private
   * @method showLandSpriteAtPort
   * @description Placeholder method - sprites have been removed from the game
   * @param {Object} portNode - The port node with position information
   */
  private showLandSpriteAtPort(portNode: { id: string; name: string; position: { x: number; y: number } }): void {
    // Sprites have been removed - this method is now a no-op
    // The tile-based aesthetic is maintained without additional sprites
  }
  
  private setupMinimap(): void {
    // Send initial tile data to minimap
    const tileData = this.isometricMap.getTileData();
    const mapDimensions = this.isometricMap.getMapDimensions();
    
    if (tileData && mapDimensions && tileData.length > 0) {
      minimapBridge.updateMinimapData({
        tileData,
        mapDimensions
      });
      
      // Send initial viewport
      this.updateMinimapViewport();
    }
    
    // Listen for minimap clicks
    this.events.on('minimap-click', (position: { x: number; y: number }) => {
      this.cameraController.panTo(position.x, position.y);
    });

    minimapBridge.on('zoom-in', () => {
      this.cameraController.zoomTo(this.cameras.main.zoom + CAMERA_CONFIG.zoomStep);
    });
    minimapBridge.on('zoom-out', () => {
      this.cameraController.zoomTo(this.cameras.main.zoom - CAMERA_CONFIG.zoomStep);
    });
    minimapBridge.on('world-view', () => {
      this.cameraController.zoomTo(CAMERA_CONFIG.initialZoom);
      this.cameraController.panTo(0, 0);
    });
    
    // Update camera viewport on camera move (throttled)
    let lastViewportUpdate = 0;
    this.cameras.main.on('followupdate', () => {
      const now = Date.now();
      if (now - lastViewportUpdate > 100) { // Throttle to 10 FPS
        this.updateMinimapViewport();
        lastViewportUpdate = now;
      }
    });
  }
  
  private setupZoomControls(): void {
    // Listen for zoom control events
    this.events.on('zoom-in', () => {
      const camera = this.cameras.main;
      const currentZoom = camera.zoom;
      const newZoom = Math.min(CAMERA_CONFIG.zoomMax, currentZoom + CAMERA_CONFIG.zoomStep);
      
      camera.setZoom(newZoom);
      this.isometricMap.updateZoom(newZoom);
      camera.emit('zoomchange', newZoom);
    });
    
    this.events.on('zoom-out', () => {
      const camera = this.cameras.main;
      const currentZoom = camera.zoom;
      const newZoom = Math.max(CAMERA_CONFIG.zoomMin, currentZoom - CAMERA_CONFIG.zoomStep);
      
      camera.setZoom(newZoom);
      this.isometricMap.updateZoom(newZoom);
      camera.emit('zoomchange', newZoom);
    });
    
    this.events.on('world-view', () => {
      const camera = this.cameras.main;
      
      // Reset to world view with zoom level that shows the entire map
      camera.setZoom(CAMERA_CONFIG.initialZoom);
      this.isometricMap.updateZoom(CAMERA_CONFIG.initialZoom);
      camera.centerOn(0, 0);
      camera.emit('zoomchange', CAMERA_CONFIG.initialZoom);
      
      // Clear selected port
      const store = useEmpireStore.getState();
      store.setSelectedPort(null);
    });
  }
  
  private setupPortEvents(): void {
    // Handle port selection
    this.events.on('port-selected', (portId: string) => {
      const store = useEmpireStore.getState();
      store.setSelectedPort(portId);
    });
    
    // Handle zoom to port
    this.events.on('zoom-to-port', (data: { id: string; position: { x: number; y: number } }) => {
      this.zoomToPort({
        id: data.id,
        name: '',
        position: data.position
      });
    });
  }
  
  private updateMinimapViewport(): void {
    // Throttle minimap updates to prevent infinite loops
    if (!minimapBridge || typeof minimapBridge.updateCameraViewport !== 'function') {
      return;
    }
    
    const camera = this.cameras.main;
    const viewport = {
      x: camera.scrollX,
      y: camera.scrollY,
      width: camera.width / camera.zoom,
      height: camera.height / camera.zoom
    };
    
    minimapBridge.updateCameraViewport(viewport);
  }

  shutdown(): void {
    // Clean up LOD manager
    if (this.lodManager) {
      this.lodManager.destroy();
    }
    
    // Sprites have been removed - no cleanup needed
    
    // Clean up asset bridge
    assetBridge.destroy();
    
    // Clean up route bridge (which includes route render system)
    routeBridge.destroy();
    
    // Clean up port bridge
    portBridge.destroy();
    
    // Clean up minimap bridge
    minimapBridge.destroy();
  }
}