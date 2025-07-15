import Phaser from 'phaser';
import { SceneKeys, AssetKeys, GameEvents } from '../types/game';
import { useGameStore } from '../utils/store';

export default class WorldMapScene extends Phaser.Scene {
  private ports: Phaser.GameObjects.Image[] = [];
  private ships: Phaser.GameObjects.Image[] = [];
  private selectedShip: Phaser.GameObjects.Image | null = null;
  private routeGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SceneKeys.WORLD_MAP });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Create ocean background
    this.add.tileSprite(0, 0, width * 2, height * 2, AssetKeys.MAP_OCEAN)
      .setOrigin(0, 0);

    // Create route graphics layer
    this.routeGraphics = this.add.graphics();

    // Create sample ports
    this.createSamplePorts();

    // Create sample ships
    this.createSampleShips();

    // Setup camera
    this.setupCamera();

    // Setup input handlers
    this.setupInputHandlers();

    // Connect to Zustand store
    this.connectToStore();
  }

  private createSamplePorts(): void {
    const portData = [
      { x: 200, y: 200, size: AssetKeys.PORT_LARGE, name: 'Los Angeles' },
      { x: 800, y: 150, size: AssetKeys.PORT_MEDIUM, name: 'Shanghai' },
      { x: 600, y: 400, size: AssetKeys.PORT_MEDIUM, name: 'Singapore' },
      { x: 400, y: 350, size: AssetKeys.PORT_SMALL, name: 'Mumbai' },
    ];

    portData.forEach((data) => {
      const port = this.add.image(data.x, data.y, data.size)
        .setInteractive()
        .setData('name', data.name);

      port.on('pointerover', () => {
        port.setScale(1.1);
        this.showTooltip(data.name, port.x, port.y - 40);
      });

      port.on('pointerout', () => {
        port.setScale(1);
        this.hideTooltip();
      });

      port.on('pointerdown', () => {
        this.events.emit(GameEvents.PORT_SELECTED, data.name);
        useGameStore.getState().setSelectedPort(data.name);
      });

      this.ports.push(port);
    });
  }

  private createSampleShips(): void {
    const shipData = [
      { x: 250, y: 250, type: AssetKeys.SHIP_CARGO, id: 'ship-1' },
      { x: 750, y: 200, type: AssetKeys.SHIP_TANKER, id: 'ship-2' },
    ];

    shipData.forEach((data) => {
      const ship = this.add.image(data.x, data.y, data.type)
        .setInteractive()
        .setData('id', data.id);

      ship.on('pointerdown', () => {
        this.selectShip(ship);
      });

      this.ships.push(ship);
    });
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
    useGameStore.getState().setSelectedShip(shipId);
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, 1600, 1200);
    
    // Enable camera drag
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.rightButtonDown()) {
        camera.scrollX -= pointer.velocity.x / camera.zoom;
        camera.scrollY -= pointer.velocity.y / camera.zoom;
      }
    });

    // Enable zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const zoom = camera.zoom;
      camera.zoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.5, 2);
    });
  }

  private setupInputHandlers(): void {
    // Right-click to create routes
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() && this.selectedShip) {
        this.createRoute(this.selectedShip.x, this.selectedShip.y, pointer.worldX, pointer.worldY);
      }
    });

    // ESC to deselect
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.selectedShip) {
        this.selectedShip.clearTint();
        this.selectedShip = null;
        useGameStore.getState().setSelectedShip(null);
      }
    });
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

  private connectToStore(): void {
    // Subscribe to store changes
    const unsubscribe = useGameStore.subscribe((state) => {
      // Update game based on state changes
      if (state.isPaused) {
        this.scene.pause();
      } else {
        this.scene.resume();
      }
    });

    // Cleanup on scene shutdown
    this.events.once('shutdown', () => {
      unsubscribe();
    });
  }

  private tooltipText: Phaser.GameObjects.Text | null = null;
  private tooltipBg: Phaser.GameObjects.Rectangle | null = null;

  private showTooltip(text: string, x: number, y: number): void {
    this.hideTooltip();

    this.tooltipBg = this.add.rectangle(x, y, text.length * 10 + 20, 30, 0x000000, 0.8)
      .setStrokeStyle(2, 0xFFD700);
    
    this.tooltipText = this.add.text(x, y, text, {
      fontSize: '14px',
      color: '#FFFFFF',
    }).setOrigin(0.5, 0.5);
  }

  private hideTooltip(): void {
    this.tooltipText?.destroy();
    this.tooltipBg?.destroy();
    this.tooltipText = null;
    this.tooltipBg = null;
  }

  update(time: number, delta: number): void {
    // Update ship animations
    this.ships.forEach((ship) => {
      // Add gentle bobbing effect
      ship.y += Math.sin(time * 0.001 + ship.x) * 0.1;
    });
  }
}