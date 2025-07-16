import * as Phaser from 'phaser';
import { SceneKeys, AssetKeys, GameEvents } from '../types/game';
import { useEmpireStore } from '../src/store/empireStore';
import { assetBridge } from '../utils/assetBridge';
import { routeBridge } from '../utils/routeBridge';
import { portBridge } from '../utils/portBridge';
import { IsometricTileMap } from '../utils/IsometricTileMap';
import { CameraController } from '../utils/CameraController';
import { useRouteStore } from '../app/store/useRouteStore';

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
  zoomMin: 0.5,
  zoomMax: 2.0,
  zoomStep: 0.1,
  panSpeed: 5,
  smoothFactor: 0.95
};

export default class WorldMapScene extends Phaser.Scene {
  private isometricMap!: IsometricTileMap;
  private cameraController!: CameraController;
  private routeRenderSystem!: RouteRenderSystem;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraDragStartX: number = 0;
  private cameraDragStartY: number = 0;
  
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
  
  constructor() {
    super({ key: SceneKeys.WORLD_MAP });
  }

  create(): void {
    // Create isometric map with procedural generation
    this.isometricMap = new IsometricTileMap(this);
    this.isometricMap.create();
    
    // Set up camera
    this.setupCamera();
    
    // Create camera controller
    this.cameraController = new CameraController(this.cameras.main);
    
    // Set up input handlers
    this.setupInputHandlers();
    
    // Create lighting system
    this.createLightingSystem();
    
    // Create route graphics layer
    this.routeGraphics = this.add.graphics();
    
    // Initialize asset bridge with this scene
    assetBridge.setScene(this);
    
    // Initialize route bridge with this scene
    routeBridge.setScene(this);
    
    // Initialize port bridge with this scene
    portBridge.setScene(this);
    
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
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    
    // Set initial zoom
    camera.setZoom(1);
    
    // Center on map
    camera.centerOn(0, 0);
    
    // Set bounds (will be adjusted based on map size)
    const mapBounds = this.isometricMap.getMapBounds();
    camera.setBounds(
      mapBounds.x - 500,
      mapBounds.y - 500,
      mapBounds.width + 1000,
      mapBounds.height + 1000
    );
  }

  private setupInputHandlers(): void {
    // Mouse wheel zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const camera = this.cameras.main;
      const zoom = camera.zoom;
      
      if (deltaY > 0) {
        // Zoom out
        camera.setZoom(Math.max(CAMERA_CONFIG.zoomMin, zoom - CAMERA_CONFIG.zoomStep));
      } else {
        // Zoom in
        camera.setZoom(Math.min(CAMERA_CONFIG.zoomMax, zoom + CAMERA_CONFIG.zoomStep));
      }
    });
    
    // Mouse drag pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isDragging = true;
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
        
        this.cameras.main.setScroll(
          this.cameraDragStartX + dragX,
          this.cameraDragStartY + dragY
        );
      }
    });
    
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
    
    // Keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      this.cameraController.setCursors(cursors);
    }
    
    // ESC to deselect
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.selectedShip) {
        this.selectedShip.clearTint();
        this.selectedShip = null;
        useEmpireStore.getState().setSelectedShip(null);
      }
    });
    
    // Touch support for mobile
    this.input.addPointer(2); // Support up to 3 touch points
  }

  private createLightingSystem(): void {
    const { width, height } = this.cameras.main;
    
    // Create ambient light overlay
    this.ambientLight = this.add.rectangle(0, 0, width * 4, height * 4, 0x000000, 0.3);
    this.ambientLight.setOrigin(0, 0);
    this.ambientLight.setScrollFactor(0);
    this.ambientLight.setDepth(1000);
    
    // Initial lighting update
    this.updateLighting();
  }

  private updateLighting(): void {
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
        const routeStore = useRouteStore.getState();
        
        if (routeStore.routeCreationMode) {
          if (!routeStore.routePreview) {
            // Start route creation
            routeBridge.startRouteCreation(portId);
          } else {
            // Complete route creation
            routeBridge.updateRoutePreview(portId);
          }
        }
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

  update(time: number, delta: number): void {
    // Update camera controller
    if (this.cameraController) {
      this.cameraController.update(delta);
    }
    
    // Update route render system
    if (this.routeRenderSystem) {
      this.routeRenderSystem.update(time, delta);
    }
    
    // Update time of day (24-hour cycle over 10 minutes)
    this.timeOfDay += 0.004; // Adjust speed as needed
    if (this.timeOfDay >= 24) {
      this.timeOfDay = 0;
    }
    
    // Update lighting
    if (Math.floor(time / 1000) % 1 === 0) {
      this.updateLighting();
    }
    
    // Update ship animations (legacy compatibility)
    this.ships.forEach((ship) => {
      // Add gentle bobbing effect
      ship.y += Math.sin(time * 0.001 + ship.x) * 0.1;
    });
  }

  shutdown(): void {
    // Clean up asset bridge
    assetBridge.destroy();
    
    // Clean up route bridge (which includes route render system)
    routeBridge.destroy();
    
    // Clean up port bridge
    portBridge.destroy();
  }
}