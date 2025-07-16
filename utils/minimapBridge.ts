import { EventEmitter } from 'events';

interface MinimapData {
  tileData: Array<Array<{ type: 'ocean' | 'land' | 'port' }>>;
  mapDimensions: { width: number; height: number };
  cameraViewport: { x: number; y: number; width: number; height: number };
}

class MinimapBridge extends EventEmitter {
  private scene: Phaser.Scene | null = null;
  private minimapData: MinimapData | null = null;

  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  updateMinimapData(data: Partial<MinimapData>): void {
    this.minimapData = {
      ...this.minimapData,
      ...data
    } as MinimapData;
    
    this.emit('minimap-update', this.minimapData);
  }

  updateCameraViewport(viewport: { x: number; y: number; width: number; height: number }): void {
    if (this.minimapData) {
      // Check if viewport actually changed to prevent infinite loops
      const currentViewport = this.minimapData.cameraViewport;
      if (currentViewport && 
          Math.abs(currentViewport.x - viewport.x) < 1 &&
          Math.abs(currentViewport.y - viewport.y) < 1 &&
          Math.abs(currentViewport.width - viewport.width) < 1 &&
          Math.abs(currentViewport.height - viewport.height) < 1) {
        return; // No significant change, don't emit
      }
      
      this.minimapData.cameraViewport = viewport;
      this.emit('viewport-update', viewport);
    }
  }

  handleMinimapClick(worldX: number, worldY: number): void {
    if (this.scene) {
      this.scene.events.emit('minimap-click', { x: worldX, y: worldY });
    }
  }

  destroy(): void {
    this.removeAllListeners();
    this.scene = null;
    this.minimapData = null;
  }
}

export const minimapBridge = new MinimapBridge();