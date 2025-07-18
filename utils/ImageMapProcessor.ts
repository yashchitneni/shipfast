import * as Phaser from 'phaser';

interface TileData {
  type: 'ocean' | 'land' | 'port';
  elevation: number;
  accessible: boolean;
}

interface ProcessedMapData {
  tileData: TileData[][];
  mapWidth: number;
  mapHeight: number;
  ports: Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    region: string;
    capacity: number;
    connectedRoutes: string[];
  }>;
}

/**
 * ImageMapProcessor - Converts pixel art world map to tile data
 * 
 * This class processes the High Detail Pixel Art World Map and converts it into
 * tile data that can be used by the IsometricTileMap system.
 */
export class ImageMapProcessor {
  private scene: Phaser.Scene;
  private imageKey: string;
  private targetWidth: number;
  private targetHeight: number;

  constructor(scene: Phaser.Scene, imageKey: string = 'world-map', targetWidth: number = 400, targetHeight: number = 200) {
    this.scene = scene;
    this.imageKey = imageKey;
    this.targetWidth = targetWidth;
    this.targetHeight = targetHeight;
  }

  /**
   * Load the world map image (no longer needed - loaded in scene preload)
   */
  preload(): void {
    // Image is now loaded in the scene's preload method
  }

  /**
   * Process the loaded image and convert to tile data
   */
  async processImage(): Promise<ProcessedMapData> {
    console.log('Processing image:', this.imageKey);
    
    // Check if texture exists
    if (!this.scene.textures.exists(this.imageKey)) {
      console.error(`Texture '${this.imageKey}' not found!`);
      throw new Error(`Texture '${this.imageKey}' not found`);
    }
    
    const image = this.scene.add.image(0, 0, this.imageKey);
    const texture = image.texture;
    const canvas = texture.getSourceImage() as HTMLCanvasElement;
    
    console.log('Image dimensions:', canvas.width, 'x', canvas.height);
    
    // Create a temporary canvas to process the image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Set canvas size to match our target dimensions
    tempCanvas.width = this.targetWidth;
    tempCanvas.height = this.targetHeight;
    
    // Draw the image scaled to our target size
    tempCtx.drawImage(canvas, 0, 0, this.targetWidth, this.targetHeight);
    
    // Get image data
    const imageData = tempCtx.getImageData(0, 0, this.targetWidth, this.targetHeight);
    const data = imageData.data;
    
    // Initialize tile data array
    const tileData: TileData[][] = [];
    for (let y = 0; y < this.targetHeight; y++) {
      tileData[y] = [];
      for (let x = 0; x < this.targetWidth; x++) {
        tileData[y][x] = {
          type: 'ocean',
          elevation: 0,
          accessible: true
        };
      }
    }
    
    // Process each pixel
    let landCount = 0;
    let oceanCount = 0;
    
    for (let y = 0; y < this.targetHeight; y++) {
      for (let x = 0; x < this.targetWidth; x++) {
        const index = (y * this.targetWidth + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        // Sample some pixels for debugging
        if (x % 50 === 0 && y % 50 === 0) {
          console.log(`Pixel at (${x},${y}): RGB(${r},${g},${b})`);
        }
        
        // Determine tile type based on color
        // The image appears to have green land (RGB ~100-150, 200-255, 100-150)
        // and blue ocean (RGB ~100-150, 100-150, 200-255)
        if (this.isLandColor(r, g, b)) {
          tileData[y][x] = {
            type: 'land',
            elevation: 1,
            accessible: true
          };
          landCount++;
        } else {
          tileData[y][x] = {
            type: 'ocean',
            elevation: 0,
            accessible: true
          };
          oceanCount++;
        }
      }
    }
    
    console.log(`Processed ${this.targetWidth}x${this.targetHeight} map: ${landCount} land tiles, ${oceanCount} ocean tiles`);
    
    // Generate strategic ports along coastlines
    const ports = this.generatePorts(tileData);
    
    // Mark port locations in tile data
    ports.forEach(port => {
      const x = Math.floor(port.position.x);
      const y = Math.floor(port.position.y);
      if (x >= 0 && x < this.targetWidth && y >= 0 && y < this.targetHeight) {
        tileData[y][x] = {
          type: 'port',
          elevation: 0,
          accessible: true
        };
      }
    });
    
    // Clean up temporary image
    image.destroy();
    
    return {
      tileData,
      mapWidth: this.targetWidth,
      mapHeight: this.targetHeight,
      ports
    };
  }

  /**
   * Determine if a pixel color represents land
   */
  private isLandColor(r: number, g: number, b: number): boolean {
    // The pixel art map uses green for land (RGB ~106,190,48)
    // and blue for ocean (RGB ~91,110,225)
    // Green channel should be significantly higher than blue
    return g > b && g > 150;
  }

  /**
   * Generate strategic port locations from ports.json
   */
  private generatePorts(tileData: TileData[][]): Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    region: string;
    capacity: number;
    connectedRoutes: string[];
  }> {
    const ports: Array<{
      id: string;
      name: string;
      position: { x: number; y: number };
      region: string;
      capacity: number;
      connectedRoutes: string[];
    }> = [];
    
    // Load port data from JSON
    const portData = this.scene.cache.json.get('port-data');
    if (!portData || !portData.ports) {
      console.warn('No port data found, using default locations');
      return [];
    }
    
    // Assuming the coordinates in ports.json are based on a ~4000x3000 map
    // We need to scale them down to our 400x200 tile system
    const scaleX = this.targetWidth / 4000;
    const scaleY = this.targetHeight / 3000;
    
    console.log(`[ImageMapProcessor] Scaling ports from original coordinates to ${this.targetWidth}x${this.targetHeight} with scale ${scaleX}x${scaleY}`);
    
    // Process each port from the JSON data
    portData.ports.forEach((port: any) => {
      // Scale coordinates to our tile system
      const originalX = port.coordinates.x;
      const originalY = port.coordinates.y;
      const scaledX = Math.floor(originalX * scaleX);
      const scaledY = Math.floor(originalY * scaleY);
      
      console.log(`[ImageMapProcessor] Port ${port.name}: Original (${originalX}, ${originalY}) → Scaled (${scaledX}, ${scaledY})`);
      
      // Check if location is valid and near coast
      if (this.isValidPortLocation(tileData, scaledX, scaledY)) {
        ports.push({
          id: port.id,
          name: port.name,
          position: { x: scaledX, y: scaledY },
          region: port.countryName || 'Unknown',
          capacity: Math.floor(port.capacity / 100), // Scale capacity for game balance
          connectedRoutes: []
        });
        
        console.log(`[ImageMapProcessor] ✓ Added port: ${port.name} at (${scaledX}, ${scaledY})`);
      } else {
        console.log(`[ImageMapProcessor] ✗ Skipped port: ${port.name} - invalid location at (${scaledX}, ${scaledY})`);
      }
    });
    
    console.log(`Generated ${ports.length} ports from JSON data`);
    return ports;
  }

  /**
   * Check if a location is valid for a port (near coastline)
   */
  private isValidPortLocation(tileData: TileData[][], x: number, y: number): boolean {
    if (x < 0 || x >= this.targetWidth || y < 0 || y >= this.targetHeight) {
      return false;
    }
    
    // Check if current tile is ocean or land
    const currentTile = tileData[y][x];
    
    // Port should be in ocean or on coast
    if (currentTile.type === 'land') {
      // Check if there's ocean nearby (coastline)
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          if (checkX >= 0 && checkX < this.targetWidth && 
              checkY >= 0 && checkY < this.targetHeight) {
            if (tileData[checkY][checkX].type === 'ocean') {
              return true;
            }
          }
        }
      }
      return false;
    } else {
      // Ocean tile - check if there's land nearby
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          if (checkX >= 0 && checkX < this.targetWidth && 
              checkY >= 0 && checkY < this.targetHeight) {
            if (tileData[checkY][checkX].type === 'land') {
              return true;
            }
          }
        }
      }
      return false;
    }
  }
} 