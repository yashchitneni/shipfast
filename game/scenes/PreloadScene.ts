import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingScreen();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  private createLoadingScreen(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Progress box (background)
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(COLORS.NEUTRAL_GRAY, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '24px Arial',
      color: COLORS.WHITE_HEX
    });
    this.loadingText.setOrigin(0.5, 0.5);

    // Percent text
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      font: '18px Arial',
      color: COLORS.WHITE_HEX
    });
    this.percentText.setOrigin(0.5, 0.5);

    // Asset text
    this.assetText = this.add.text(width / 2, height / 2 + 50, '', {
      font: '16px Arial',
      color: COLORS.WHITE_HEX
    });
    this.assetText.setOrigin(0.5, 0.5);
  }

  private setupLoadingEvents(): void {
    // Update progress bar
    this.load.on('progress', (value: number) => {
      this.percentText.setText(Math.floor(value * 100) + '%');
      this.progressBar.clear();
      this.progressBar.fillStyle(COLORS.CARGO_GREEN, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 - 15,
        300 * value,
        30
      );
    });

    // Update file loading text
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.assetText.setText('Loading: ' + file.key);
    });

    // Complete handler
    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
      this.percentText.destroy();
      this.assetText.destroy();
      
      // Start the main menu scene
      this.scene.start('MainMenuScene');
    });
  }

  private loadAssets(): void {
    // Load placeholder assets for now
    // In production, replace these with actual game assets
    
    // Create placeholder textures
    this.createPlaceholderTextures();
    
    // Load tilemap data (will be added later)
    // this.load.tilemapTiledJSON('worldmap', 'assets/tilemaps/worldmap.json');
    
    // Load images
    // this.load.image('ocean-tile', 'assets/images/tiles/ocean.png');
    // this.load.image('land-tile', 'assets/images/tiles/land.png');
    // this.load.image('port-tile', 'assets/images/tiles/port.png');
    
    // Load sprites
    // this.load.spritesheet('ship', 'assets/images/sprites/ship.png', {
    //   frameWidth: 64,
    //   frameHeight: 64
    // });
    
    // Load audio
    // this.load.audio('ocean-ambience', 'assets/audio/ocean-ambience.mp3');
    // this.load.audio('port-horn', 'assets/audio/port-horn.mp3');
  }

  private createPlaceholderTextures(): void {
    // Create placeholder textures for development
    
    // Ocean tile
    this.load.on('start', () => {
      const oceanGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      oceanGraphics.fillStyle(COLORS.OCEAN_BLUE);
      oceanGraphics.fillRect(0, 0, 128, 64);
      oceanGraphics.generateTexture('ocean-tile', 128, 64);
      oceanGraphics.destroy();
      
      // Land tile
      const landGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      landGraphics.fillStyle(COLORS.CARGO_GREEN);
      landGraphics.fillRect(0, 0, 128, 64);
      landGraphics.generateTexture('land-tile', 128, 64);
      landGraphics.destroy();
      
      // Port tile
      const portGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      portGraphics.fillStyle(COLORS.SHIPPING_RED);
      portGraphics.fillRect(0, 0, 128, 64);
      portGraphics.generateTexture('port-tile', 128, 64);
      portGraphics.destroy();
      
      // Ship placeholder
      const shipGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      shipGraphics.fillStyle(COLORS.WHITE);
      shipGraphics.fillRect(0, 0, 64, 64);
      shipGraphics.fillStyle(COLORS.SHIPPING_RED);
      shipGraphics.fillTriangle(32, 10, 10, 54, 54, 54);
      shipGraphics.generateTexture('ship', 64, 64);
      shipGraphics.destroy();
    });
  }

  create(): void {
    // This will be called after preload completes
    // The complete handler will transition to MainMenuScene
  }
}