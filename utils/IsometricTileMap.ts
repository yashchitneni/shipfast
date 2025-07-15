import Phaser from 'phaser';

// Configuration constants
const ISOMETRIC_CONFIG = {
  tileWidth: 64,
  tileHeight: 32
};

const COLORS = {
  OCEAN_BLUE: 0x0077BE,
  CARGO_GREEN: 0x00A652,
  SHIPPING_RED: 0xE03C31,
  NEUTRAL_GRAY: 0x808080
};

interface TileData {
  type: 'ocean' | 'land' | 'port';
  elevation: number;
  accessible: boolean;
}

export class IsometricTileMap {
  private scene: Phaser.Scene;
  private mapWidth: number = 50;
  private mapHeight: number = 50;
  private tiles: Phaser.GameObjects.Container;
  private tileData: TileData[][] = [];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tiles = scene.add.container(0, 0);
  }

  create(): void {
    // Generate map data
    this.generateMapData();
    
    // Create visual tiles
    this.createTiles();
  }

  private generateMapData(): void {
    // Initialize tile data array
    for (let y = 0; y < this.mapHeight; y++) {
      this.tileData[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        // Generate procedural map with islands
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - this.mapWidth / 2, 2) + 
          Math.pow(y - this.mapHeight / 2, 2)
        );
        
        // Create islands using noise-like pattern
        const islandNoise = 
          Math.sin(x * 0.1) * Math.cos(y * 0.1) +
          Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2 +
          Math.random() * 0.5;
        
        const isLand = islandNoise > 0.5 && distanceFromCenter < this.mapWidth * 0.4;
        const isPort = isLand && Math.random() < 0.1 && this.hasOceanNeighbor(x, y);
        
        this.tileData[y][x] = {
          type: isPort ? 'port' : (isLand ? 'land' : 'ocean'),
          elevation: isLand ? 1 : 0,
          accessible: !isLand || isPort
        };
      }
    }
    
    // Smooth the map
    this.smoothMap();
  }

  private hasOceanNeighbor(x: number, y: number): boolean {
    const neighbors = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1]
    ];
    
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
        if (!this.tileData[ny] || !this.tileData[ny][nx] || this.tileData[ny][nx].type === 'ocean') {
          return true;
        }
      }
    }
    
    return false;
  }

  private smoothMap(): void {
    // Apply smoothing to make more natural looking coastlines
    const newTileData: TileData[][] = [];
    
    for (let y = 0; y < this.mapHeight; y++) {
      newTileData[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        const landNeighbors = this.countLandNeighbors(x, y);
        const currentTile = this.tileData[y][x];
        
        if (currentTile.type === 'ocean' && landNeighbors >= 5) {
          newTileData[y][x] = {
            type: 'land',
            elevation: 1,
            accessible: false
          };
        } else if (currentTile.type === 'land' && landNeighbors <= 3) {
          newTileData[y][x] = {
            type: 'ocean',
            elevation: 0,
            accessible: true
          };
        } else {
          newTileData[y][x] = currentTile;
        }
      }
    }
    
    this.tileData = newTileData;
  }

  private countLandNeighbors(x: number, y: number): number {
    let count = 0;
    const neighbors = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1]
    ];
    
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
        if (this.tileData[ny][nx].type !== 'ocean') {
          count++;
        }
      }
    }
    
    return count;
  }

  private createTiles(): void {
    // Create tiles in correct draw order for isometric view
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tileData[y][x];
        const worldPos = this.tileToWorld(x, y);
        
        // Create tile graphics
        const tileGraphics = this.scene.add.graphics();
        
        // Draw tile based on type
        const color = this.getTileColor(tile.type);
        const elevation = tile.elevation * 20;
        
        // Draw tile face
        this.drawIsometricTile(tileGraphics, 0, -elevation, color);
        
        // Draw tile edges for elevation
        if (elevation > 0) {
          this.drawTileEdges(tileGraphics, 0, -elevation, elevation, color);
        }
        
        // Add to container
        tileGraphics.setPosition(worldPos.x, worldPos.y);
        this.tiles.add(tileGraphics);
        
        // Add interactive highlighting
        const hitArea = new Phaser.Geom.Polygon([
          0, 0,
          ISOMETRIC_CONFIG.tileWidth / 2, ISOMETRIC_CONFIG.tileHeight / 2,
          0, ISOMETRIC_CONFIG.tileHeight,
          -ISOMETRIC_CONFIG.tileWidth / 2, ISOMETRIC_CONFIG.tileHeight / 2
        ]);
        
        tileGraphics.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
        
        tileGraphics.on('pointerover', () => {
          tileGraphics.clear();
          this.drawIsometricTile(tileGraphics, 0, -elevation, color, 0xFFFFFF, 0.3);
          if (elevation > 0) {
            this.drawTileEdges(tileGraphics, 0, -elevation, elevation, color);
          }
        });
        
        tileGraphics.on('pointerout', () => {
          tileGraphics.clear();
          this.drawIsometricTile(tileGraphics, 0, -elevation, color);
          if (elevation > 0) {
            this.drawTileEdges(tileGraphics, 0, -elevation, elevation, color);
          }
        });
      }
    }
  }

  private drawIsometricTile(
    graphics: Phaser.GameObjects.Graphics, 
    x: number, 
    y: number, 
    color: number,
    highlightColor?: number,
    highlightAlpha?: number
  ): void {
    const halfWidth = ISOMETRIC_CONFIG.tileWidth / 2;
    const halfHeight = ISOMETRIC_CONFIG.tileHeight / 2;
    
    // Draw tile
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x + halfWidth, y + halfHeight);
    graphics.lineTo(x, y + ISOMETRIC_CONFIG.tileHeight);
    graphics.lineTo(x - halfWidth, y + halfHeight);
    graphics.closePath();
    graphics.fillPath();
    
    // Draw highlight if specified
    if (highlightColor !== undefined && highlightAlpha !== undefined) {
      graphics.fillStyle(highlightColor, highlightAlpha);
      graphics.fillPath();
    }
    
    // Draw outline
    graphics.lineStyle(1, 0x000000, 0.2);
    graphics.strokePath();
  }

  private drawTileEdges(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    height: number,
    color: number
  ): void {
    const halfWidth = ISOMETRIC_CONFIG.tileWidth / 2;
    const halfHeight = ISOMETRIC_CONFIG.tileHeight / 2;
    const darkerColor = Phaser.Display.Color.ValueToColor(color).darken(20).color;
    
    // Draw left edge
    graphics.fillStyle(darkerColor, 1);
    graphics.beginPath();
    graphics.moveTo(x - halfWidth, y + halfHeight);
    graphics.lineTo(x, y + ISOMETRIC_CONFIG.tileHeight);
    graphics.lineTo(x, y + ISOMETRIC_CONFIG.tileHeight + height);
    graphics.lineTo(x - halfWidth, y + halfHeight + height);
    graphics.closePath();
    graphics.fillPath();
    
    // Draw right edge
    const darkestColor = Phaser.Display.Color.ValueToColor(color).darken(40).color;
    graphics.fillStyle(darkestColor, 1);
    graphics.beginPath();
    graphics.moveTo(x, y + ISOMETRIC_CONFIG.tileHeight);
    graphics.lineTo(x + halfWidth, y + halfHeight);
    graphics.lineTo(x + halfWidth, y + halfHeight + height);
    graphics.lineTo(x, y + ISOMETRIC_CONFIG.tileHeight + height);
    graphics.closePath();
    graphics.fillPath();
  }

  private getTileColor(type: 'ocean' | 'land' | 'port'): number {
    switch (type) {
      case 'ocean':
        return COLORS.OCEAN_BLUE;
      case 'land':
        return COLORS.CARGO_GREEN;
      case 'port':
        return COLORS.SHIPPING_RED;
      default:
        return COLORS.NEUTRAL_GRAY;
    }
  }

  tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
    const x = (tileX - tileY) * (ISOMETRIC_CONFIG.tileWidth / 2);
    const y = (tileX + tileY) * (ISOMETRIC_CONFIG.tileHeight / 2);
    return { x, y };
  }

  worldToTile(worldX: number, worldY: number): { x: number; y: number } {
    const tileX = Math.floor((worldX / (ISOMETRIC_CONFIG.tileWidth / 2) + worldY / (ISOMETRIC_CONFIG.tileHeight / 2)) / 2);
    const tileY = Math.floor((worldY / (ISOMETRIC_CONFIG.tileHeight / 2) - worldX / (ISOMETRIC_CONFIG.tileWidth / 2)) / 2);
    return { x: tileX, y: tileY };
  }

  getMapBounds(): { x: number; y: number; width: number; height: number } {
    const topLeft = this.tileToWorld(0, 0);
    const topRight = this.tileToWorld(this.mapWidth - 1, 0);
    const bottomLeft = this.tileToWorld(0, this.mapHeight - 1);
    const bottomRight = this.tileToWorld(this.mapWidth - 1, this.mapHeight - 1);
    
    const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
} 