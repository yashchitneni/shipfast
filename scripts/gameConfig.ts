import Phaser from 'phaser';
import { SceneKeys } from '../types/game';

// Import scenes
import PreloaderScene from '../scenes/PreloaderScene';
import WorldMapScene from '../scenes/WorldMapScene';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0077BE', // Ocean Blue from Visual Style Guide
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    min: {
      width: 800,
      height: 600,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: process.env.NODE_ENV === 'development',
    },
  },
  scene: [
    PreloaderScene,
    WorldMapScene,
  ],
  render: {
    antialiasGL: true,
    pixelArt: false,
  },
  audio: {
    disableWebAudio: false,
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
};

export default gameConfig;