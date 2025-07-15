import Phaser from 'phaser';
import { COLORS, ISOMETRIC_CONFIG, CAMERA_CONFIG } from '../config/gameConfig';
import { IsometricTileMap } from '../systems/IsometricTileMap';
import { CameraController } from '../systems/CameraController';

export class WorldMapScene extends Phaser.Scene {
  private isometricMap!: IsometricTileMap;
  private cameraController!: CameraController;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraDragStartX: number = 0;
  private cameraDragStartY: number = 0;
  
  // Lighting
  private ambientLight!: Phaser.GameObjects.Rectangle;
  private timeOfDay: number = 12; // 0-24 hours
  
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    // Set background color
    this.cameras.main.setBackgroundColor(COLORS.OCEAN_BLUE_HEX);
    
    // Create isometric tile map
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
    
    // Create UI overlay
    this.createUIOverlay();
    
    // Fade in
    this.cameras.main.fadeIn(500);
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
    
    // Touch support for mobile
    this.input.addPointer(2); // Support up to 3 touch points
  }

  private createLightingSystem(): void {
    // Create ambient light overlay
    this.ambientLight = this.add.rectangle(
      0, 0,
      this.cameras.main.width * 2,
      this.cameras.main.height * 2,
      COLORS.BLACK,
      0
    );
    this.ambientLight.setScrollFactor(0);
    this.ambientLight.setDepth(1000);
    this.ambientLight.setBlendMode(Phaser.BlendModes.MULTIPLY);
    
    // Update lighting based on time of day
    this.updateLighting();
  }

  private updateLighting(): void {
    // Calculate light intensity based on time of day
    let intensity = 0;
    
    if (this.timeOfDay < 6 || this.timeOfDay > 20) {
      // Night time
      intensity = 0.5;
    } else if (this.timeOfDay < 8 || this.timeOfDay > 18) {
      // Dawn/Dusk
      intensity = 0.3;
    } else {
      // Day time
      intensity = 0;
    }
    
    this.ambientLight.setAlpha(intensity);
    
    // Tint the scene based on time
    if (this.timeOfDay < 7 || this.timeOfDay > 19) {
      // Blue tint for night
      this.cameras.main.setTint(0x8888ff);
    } else if (this.timeOfDay < 9 || this.timeOfDay > 17) {
      // Orange tint for dawn/dusk
      this.cameras.main.setTint(0xffcc88);
    } else {
      // No tint for day
      this.cameras.main.clearTint();
    }
  }

  private createUIOverlay(): void {
    // Coordinates display
    const coordsText = this.add.text(10, 10, '', {
      fontSize: '14px',
      color: COLORS.WHITE_HEX,
      backgroundColor: COLORS.BLACK_HEX + '88',
      padding: { x: 5, y: 5 }
    });
    coordsText.setScrollFactor(0);
    coordsText.setDepth(2000);
    
    // Update coordinates on pointer move
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tileCoords = this.isometricMap.worldToTile(worldPoint.x, worldPoint.y);
      coordsText.setText(`World: ${Math.floor(worldPoint.x)}, ${Math.floor(worldPoint.y)}\nTile: ${tileCoords.x}, ${tileCoords.y}`);
    });
    
    // Zoom level display
    const zoomText = this.add.text(10, 70, '', {
      fontSize: '14px',
      color: COLORS.WHITE_HEX,
      backgroundColor: COLORS.BLACK_HEX + '88',
      padding: { x: 5, y: 5 }
    });
    zoomText.setScrollFactor(0);
    zoomText.setDepth(2000);
    
    // Time display
    const timeText = this.add.text(10, 110, '', {
      fontSize: '14px',
      color: COLORS.WHITE_HEX,
      backgroundColor: COLORS.BLACK_HEX + '88',
      padding: { x: 5, y: 5 }
    });
    timeText.setScrollFactor(0);
    timeText.setDepth(2000);
    
    // Update UI
    this.time.addEvent({
      delay: 100,
      callback: () => {
        zoomText.setText(`Zoom: ${(this.cameras.main.zoom * 100).toFixed(0)}%`);
        timeText.setText(`Time: ${Math.floor(this.timeOfDay)}:00`);
      },
      loop: true
    });
    
    // Instructions
    const instructions = this.add.text(this.cameras.main.width - 10, 10, 
      'Controls:\n' +
      'Drag: Pan camera\n' +
      'Scroll: Zoom\n' +
      'Arrow Keys: Move',
      {
        fontSize: '12px',
        color: COLORS.WHITE_HEX,
        backgroundColor: COLORS.BLACK_HEX + '88',
        padding: { x: 5, y: 5 },
        align: 'right'
      }
    );
    instructions.setOrigin(1, 0);
    instructions.setScrollFactor(0);
    instructions.setDepth(2000);
  }

  update(time: number, delta: number): void {
    // Update camera controller
    if (this.cameraController) {
      this.cameraController.update(delta);
    }
    
    // Update time of day (1 game hour = 10 real seconds for demo)
    this.timeOfDay += (delta / 10000);
    if (this.timeOfDay >= 24) {
      this.timeOfDay -= 24;
    }
    
    // Update lighting
    if (Math.floor(time / 1000) % 1 === 0) {
      this.updateLighting();
    }
  }
}