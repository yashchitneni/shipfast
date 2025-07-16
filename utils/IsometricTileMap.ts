import * as Phaser from 'phaser';
import { ImageMapProcessor } from './ImageMapProcessor';

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
  private mapWidth: number = 400;
  private mapHeight: number = 200;
  private tiles: Phaser.GameObjects.Container;
  private tileData: TileData[][] = [];
  private imageProcessor: ImageMapProcessor;
  private portNodes: Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    region: string;
    connectedRoutes: string[];
  }> = [];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tiles = scene.add.container(0, 0);
    this.imageProcessor = new ImageMapProcessor(scene, 'world-map', this.mapWidth, this.mapHeight);
  }

  /**
   * Initialize the map by processing the world map image
   */
  async initialize(): Promise<void> {
    // Process the image to generate tile data (image already loaded in scene preload)
    const mapData = await this.imageProcessor.processImage();
    
    // Convert processed data to TileData format
    this.tileData = mapData.tileData.map(row => 
      row.map(tile => ({
        type: tile.type,
        elevation: tile.elevation,
        accessible: tile.accessible
      }))
    );
    
    // Store ports for later use
    this.portNodes = mapData.ports.map(port => ({
      id: port.id,
      name: port.name,
      position: port.position,
      region: port.region,
      connectedRoutes: port.connectedRoutes
    }));
    
    console.log(`Loaded world map with ${mapData.ports.length} ports`);
  }

  create(): void {
    // For backward compatibility, use procedural generation if not initialized
    if (this.tileData.length === 0) {
      console.log('Using procedural generation - image not loaded yet');
      this.generateMapData();
      this.createTiles();
    } else {
      // If already initialized with image data, just create tiles
      this.createTiles();
    }
  }

  /**
   * Get port nodes for use in WorldMapScene
   */
  getPortNodes(): Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    region: string;
    connectedRoutes: string[];
  }> {
    return this.portNodes;
  }

  private generateMapData(): void {
    // Initialize all tiles as ocean
    for (let y = 0; y < this.mapHeight; y++) {
      this.tileData[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        this.tileData[y][x] = {
          type: 'ocean',
          elevation: 0,
          accessible: true
        };
      }
    }
    
    // Apply continental land masses
    this.generateContinents();
    
    // Generate ports along coastlines
    this.generatePorts();
  }

  private generateContinents(): void {
    // North America
    // Alaska
    this.fillLandArea(20, 50, 20, 35);
    this.fillLandArea(25, 40, 35, 40);
    
    // Canada
    this.fillLandArea(40, 140, 30, 50);
    this.fillLandArea(50, 130, 50, 60);
    this.fillLandArea(60, 120, 60, 70);
    
    // USA
    this.fillLandArea(60, 130, 70, 80);
    this.fillLandArea(65, 125, 80, 90);
    this.fillLandArea(70, 115, 90, 95);
    
    // Florida
    this.fillLandArea(110, 116, 90, 98);
    
    // Mexico
    this.fillLandArea(80, 100, 95, 110);
    this.fillLandArea(75, 95, 110, 120);
    this.fillLandArea(70, 85, 120, 125);
    
    // Central America
    this.fillLandArea(70, 80, 125, 135);
    
    // South America
    // Venezuela/Colombia
    this.fillLandArea(90, 110, 130, 140);
    this.fillLandArea(85, 115, 140, 150);
    
    // Brazil bulge
    this.fillLandArea(90, 130, 150, 160);
    this.fillLandArea(95, 135, 160, 170);
    this.fillLandArea(90, 130, 170, 180);
    
    // Southern cone
    this.fillLandArea(100, 120, 180, 190);
    this.fillLandArea(105, 115, 190, 200);
    this.fillLandArea(108, 112, 200, 210);
    
    // Europe
    // Norway/Sweden
    this.fillLandArea(180, 195, 20, 40);
    this.fillLandArea(185, 190, 40, 50);
    
    // UK/Ireland
    this.fillLandArea(170, 180, 40, 55);
    
    // Western Europe
    this.fillLandArea(175, 195, 50, 65);
    this.fillLandArea(180, 200, 60, 70);
    
    // Spain/Portugal
    this.fillLandArea(170, 180, 65, 75);
    
    // Italy
    this.fillLandArea(190, 195, 70, 80);
    
    // Greece/Balkans
    this.fillLandArea(195, 205, 70, 80);
    
    // Africa
    // Mediterranean coast
    this.fillLandArea(170, 210, 75, 85);
    this.fillLandArea(165, 220, 85, 95);
    
    // Sahara width
    this.fillLandArea(160, 230, 95, 105);
    
    // West Africa bulge
    this.fillLandArea(155, 180, 105, 115);
    this.fillLandArea(150, 190, 115, 125);
    
    // Central Africa
    this.fillLandArea(165, 220, 125, 140);
    this.fillLandArea(170, 215, 140, 155);
    
    // Southern Africa
    this.fillLandArea(180, 210, 155, 170);
    this.fillLandArea(190, 205, 170, 180);
    this.fillLandArea(195, 200, 180, 185);
    
    // Middle East
    this.fillLandArea(205, 230, 70, 85);
    this.fillLandArea(210, 235, 85, 95);
    
    // Arabian Peninsula
    this.fillLandArea(215, 235, 95, 110);
    
    // Asia
    // Russia/Siberia
    this.fillLandArea(200, 360, 20, 60);
    
    // Central Asia
    this.fillLandArea(220, 280, 60, 80);
    
    // India
    this.fillLandArea(250, 270, 80, 110);
    this.fillLandArea(255, 265, 110, 115);
    
    // China
    this.fillLandArea(280, 340, 50, 90);
    this.fillLandArea(290, 330, 90, 100);
    
    // Southeast Asia
    this.fillLandArea(290, 330, 100, 120);
    
    // Indonesia
    this.fillLandArea(300, 340, 120, 130);
    
    // Japan
    this.fillLandArea(340, 350, 65, 85);
    
    // Philippines
    this.fillLandArea(330, 340, 100, 115);
    
    // Australia
    // Main continent
    this.fillLandArea(320, 360, 140, 170);
    this.fillLandArea(325, 355, 170, 180);
    
    // Tasmania
    this.fillLandArea(340, 350, 180, 185);
    
    // New Zealand
    this.fillLandArea(370, 380, 175, 190);
    
    // Notable Islands
    // Greenland
    this.fillLandArea(140, 160, 15, 35);
    
    // Madagascar
    this.fillLandArea(230, 240, 160, 180);
    
    // Sri Lanka
    this.fillLandArea(270, 275, 115, 120);
    
    // British Isles detail
    this.fillLandArea(172, 178, 42, 52); // Great Britain
    this.fillLandArea(168, 172, 44, 50); // Ireland
    
    // Caribbean islands
    this.fillLandArea(105, 115, 100, 110); // Cuba
    this.fillLandArea(115, 120, 105, 110); // Hispaniola
    this.fillLandArea(120, 125, 108, 112); // Puerto Rico
  }

  private fillLandArea(minX: number, maxX: number, minY: number, maxY: number): void {
    for (let y = minY; y <= maxY && y < this.mapHeight; y++) {
      for (let x = minX; x <= maxX && x < this.mapWidth; x++) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
          // Add some natural variation to coastlines
          const edgeDistance = Math.min(
            x - minX, maxX - x, y - minY, maxY - y
          );
          
          // Create more natural coastlines with some randomness
          const shouldBeLand = edgeDistance > 0 || 
            (edgeDistance === 0 && Math.random() > 0.3);
          
          if (shouldBeLand) {
            this.tileData[y][x] = {
              type: 'land',
              elevation: 1,
              accessible: false
            };
          }
        }
      }
    }
  }

  private generatePorts(): void {
    // Generate ports along coastlines of major continents with updated coordinates
    const portLocations = [
      // North America ports
      { x: 30, y: 45 }, // Alaska
      { x: 50, y: 55 }, // Western Canada
      { x: 80, y: 65 }, // Vancouver area
      { x: 70, y: 85 }, // Seattle area
      { x: 75, y: 95 }, // San Francisco area
      { x: 85, y: 105 }, // Los Angeles area
      { x: 130, y: 75 }, // New York area
      { x: 125, y: 85 }, // Miami area
      { x: 115, y: 95 }, // Florida
      { x: 95, y: 100 }, // Gulf Coast
      { x: 85, y: 110 }, // Mexico Gulf
      
      // South America ports
      { x: 95, y: 135 }, // Venezuela
      { x: 110, y: 145 }, // Colombia
      { x: 125, y: 155 }, // Brazil northeast
      { x: 130, y: 165 }, // Brazil east
      { x: 115, y: 175 }, // Brazil south
      { x: 110, y: 185 }, // Argentina
      { x: 105, y: 195 }, // Chile
      
      // Europe ports
      { x: 175, y: 45 }, // UK
      { x: 185, y: 55 }, // Netherlands
      { x: 190, y: 60 }, // Germany
      { x: 175, y: 70 }, // Spain
      { x: 195, y: 75 }, // Italy
      { x: 200, y: 75 }, // Greece
      { x: 185, y: 35 }, // Norway
      
      // Africa ports
      { x: 175, y: 80 }, // Morocco
      { x: 165, y: 90 }, // West Africa
      { x: 160, y: 110 }, // West Africa bulge
      { x: 220, y: 90 }, // Egypt
      { x: 215, y: 130 }, // East Africa
      { x: 200, y: 165 }, // South Africa west
      { x: 210, y: 170 }, // South Africa east
      { x: 235, y: 165 }, // Madagascar
      
      // Middle East ports
      { x: 220, y: 80 }, // Turkey
      { x: 230, y: 85 }, // Lebanon
      { x: 235, y: 105 }, // UAE
      
      // Asia ports
      { x: 280, y: 45 }, // Russia Pacific
      { x: 340, y: 55 }, // Japan
      { x: 330, y: 75 }, // China east
      { x: 290, y: 85 }, // China south
      { x: 260, y: 95 }, // India west
      { x: 270, y: 105 }, // India east
      { x: 320, y: 110 }, // Southeast Asia
      { x: 330, y: 125 }, // Indonesia
      { x: 335, y: 110 }, // Philippines
      
      // Australia ports
      { x: 330, y: 155 }, // Western Australia
      { x: 350, y: 165 }, // Eastern Australia
      { x: 345, y: 175 }, // Southern Australia
      { x: 375, y: 185 }, // New Zealand
      
      // Caribbean
      { x: 110, y: 105 }, // Cuba
      { x: 118, y: 108 }, // Puerto Rico
    ];
    
    // Place ports at specified locations if they're on coastlines
    portLocations.forEach(location => {
      if (this.isCoastline(location.x, location.y)) {
        this.tileData[location.y][location.x] = {
          type: 'port',
          elevation: 1,
          accessible: true
        };
      }
    });
  }

  private isCoastline(x: number, y: number): boolean {
    // Check if this tile is land and has at least one ocean neighbor
    if (this.tileData[y][x].type !== 'land') {
      return false;
    }
    
    const neighbors = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1]
    ];
    
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
        if (this.tileData[ny][nx].type === 'ocean') {
          return true;
        }
      }
    }
    
    return false;
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

  getTileData(): TileData[][] {
    return this.tileData;
  }
  
  getMapDimensions(): { width: number; height: number } {
    return { width: this.mapWidth, height: this.mapHeight };
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