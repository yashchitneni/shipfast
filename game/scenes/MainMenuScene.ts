import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';

export class MainMenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private playButton!: Phaser.GameObjects.Container;
  private settingsButton!: Phaser.GameObjects.Container;
  
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create ocean background effect
    this.createOceanBackground();

    // Title
    this.titleText = this.add.text(width / 2, height / 3, 'FLEXPORT', {
      fontSize: '72px',
      fontFamily: 'Arial Black',
      color: COLORS.WHITE_HEX,
      stroke: COLORS.OCEAN_BLUE_HEX,
      strokeThickness: 6
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setShadow(4, 4, COLORS.BLACK_HEX, 0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 80, 'Global Shipping Simulator', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: COLORS.WHITE_HEX
    });
    subtitle.setOrigin(0.5);

    // Play Button
    this.playButton = this.createButton(width / 2, height / 2 + 50, 'START GAME', () => {
      this.scene.start('WorldMapScene');
    });

    // Settings Button
    this.settingsButton = this.createButton(width / 2, height / 2 + 130, 'SETTINGS', () => {
      console.log('Settings clicked - not implemented yet');
    });

    // Version text
    const version = this.add.text(10, height - 10, 'v0.1.0 - Phase 1', {
      fontSize: '14px',
      color: COLORS.WHITE_HEX,
      alpha: 0.7
    });
    version.setOrigin(0, 1);

    // Add fade in effect
    this.cameras.main.fadeIn(500);
  }

  private createOceanBackground(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create gradient background
    const graphics = this.add.graphics();
    
    // Ocean gradient
    const gradient = graphics.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, COLORS.OCEAN_BLUE_HEX);
    gradient.addColorStop(0.5, '#005a8b');
    gradient.addColorStop(1, '#003d5c');
    
    graphics.fillGradientStyle(gradient);
    graphics.fillRect(0, 0, width, height);

    // Add wave pattern
    const waveGraphics = this.add.graphics();
    waveGraphics.lineStyle(2, COLORS.WHITE, 0.1);
    
    for (let y = 100; y < height; y += 50) {
      waveGraphics.beginPath();
      waveGraphics.moveTo(0, y);
      
      for (let x = 0; x <= width; x += 10) {
        const waveY = y + Math.sin((x + this.time.now * 0.001) * 0.02) * 10;
        waveGraphics.lineTo(x, waveY);
      }
      
      waveGraphics.strokePath();
    }

    // Animate waves
    this.tweens.add({
      targets: waveGraphics,
      alpha: { from: 0.1, to: 0.3 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.CARGO_GREEN, 0.8);
    bg.fillRoundedRect(-100, -25, 200, 50, 10);
    
    // Button border
    bg.lineStyle(2, COLORS.WHITE, 1);
    bg.strokeRoundedRect(-100, -25, 200, 50, 10);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: COLORS.WHITE_HEX
    });
    buttonText.setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(200, 50);
    button.setInteractive({ useHandCursor: true });

    // Hover effects
    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.CARGO_GREEN, 1);
      bg.fillRoundedRect(-100, -25, 200, 50, 10);
      bg.lineStyle(3, COLORS.WHITE, 1);
      bg.strokeRoundedRect(-100, -25, 200, 50, 10);
      button.setScale(1.05);
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.CARGO_GREEN, 0.8);
      bg.fillRoundedRect(-100, -25, 200, 50, 10);
      bg.lineStyle(2, COLORS.WHITE, 1);
      bg.strokeRoundedRect(-100, -25, 200, 50, 10);
      button.setScale(1);
    });

    button.on('pointerdown', () => {
      button.setScale(0.95);
    });

    button.on('pointerup', () => {
      button.setScale(1.05);
      callback();
    });

    return button;
  }
}