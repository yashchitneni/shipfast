import Phaser from 'phaser';
import { WorldMapScene } from '../scenes/WorldMapScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';

// Visual Style Guide colors
export const COLORS = {
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

// Game configuration
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: COLORS.OCEAN_BLUE_HEX,
  
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 640,
      height: 360
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  
  scene: [PreloadScene, MainMenuScene, WorldMapScene],
  
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  
  input: {
    activePointers: 3,
    smoothFactor: 0
  },
  
  fps: {
    target: 60,
    forceSetTimeOut: false
  }
};

// Isometric configuration
export const ISOMETRIC_CONFIG = {
  tileWidth: 128,
  tileHeight: 64,
  ratio: 2, // 2:1 isometric ratio
  angle: 26.565 // Standard isometric angle in degrees
};

// Camera configuration
export const CAMERA_CONFIG = {
  zoomMin: 0.5,
  zoomMax: 2.0,
  zoomStep: 0.1,
  panSpeed: 5,
  smoothFactor: 0.95
};