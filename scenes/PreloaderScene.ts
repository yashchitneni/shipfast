import * as Phaser from 'phaser';
import { SceneKeys, AssetKeys } from '../types/game';

export default class PreloaderScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKeys.PRELOADER });
  }

  preload(): void {
    this.createLoadingScreen();
    this.loadAssets();
  }

  private createLoadingScreen(): void {
    const { width, height } = this.cameras.main;

    // Add loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Flexport...', {
      font: '32px Arial',
      color: '#FFFFFF',
    });
    this.loadingText.setOrigin(0.5, 0.5);

    // Loading bar background
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 0.8);
    this.loadingBar.fillRect(width / 2 - 200, height / 2, 400, 20);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading events
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xFFD700, 1); // Gold from Visual Style Guide
      this.progressBar.fillRect(width / 2 - 200, height / 2, 400 * value, 20);
      
      this.loadingText.setText(`Loading: ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.loadingBar.destroy();
      this.loadingText.setText('Starting game...');
      
      // Automatically transition to world map after brief delay
      this.time.delayedCall(500, () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });
  }

  private loadAssets(): void {
    // Load placeholder assets for now
    // In production, these would be actual asset files
    
    // Create placeholder textures
    this.load.on('filecomplete', () => {
      // Asset loaded
    });

    // Generate placeholder graphics for development
    this.createPlaceholderAssets();
  }

  private createPlaceholderAssets(): void {
    // Create colored rectangles as placeholder assets
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);

    // Ships
    graphics.fillStyle(0x228B22); // Cargo Green
    graphics.fillRect(0, 0, 64, 32);
    graphics.generateTexture(AssetKeys.SHIP_CARGO, 64, 32);
    graphics.clear();

    graphics.fillStyle(0x1E90FF); // Dashboard Blue
    graphics.fillRect(0, 0, 64, 32);
    graphics.generateTexture(AssetKeys.SHIP_TANKER, 64, 32);
    graphics.clear();

    graphics.fillStyle(0xDC143C); // Alert Red
    graphics.fillRect(0, 0, 80, 40);
    graphics.generateTexture(AssetKeys.SHIP_CONTAINER, 80, 40);
    graphics.clear();

    // Ports
    graphics.fillStyle(0xFF4500); // Port Orange
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture(AssetKeys.PORT_SMALL, 32, 32);
    graphics.clear();

    graphics.fillStyle(0xFF4500);
    graphics.fillCircle(24, 24, 24);
    graphics.generateTexture(AssetKeys.PORT_MEDIUM, 48, 48);
    graphics.clear();

    graphics.fillStyle(0xFF4500);
    graphics.fillCircle(32, 32, 32);
    graphics.generateTexture(AssetKeys.PORT_LARGE, 64, 64);
    graphics.clear();

    // Ocean tile
    graphics.fillStyle(0x0077BE); // Ocean Blue
    graphics.fillRect(0, 0, 128, 128);
    graphics.generateTexture(AssetKeys.MAP_OCEAN, 128, 128);
    graphics.clear();

    // Ship icon for route visualization
    graphics.fillStyle(0xFFFFFF); // White
    graphics.fillTriangle(16, 0, 0, 32, 32, 32);
    graphics.generateTexture('ship-icon', 32, 32);

    graphics.destroy();
  }

  create(): void {
    // No longer requires click to start - handled automatically in load complete event
  }
}