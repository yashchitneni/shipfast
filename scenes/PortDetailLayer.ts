import * as Phaser from 'phaser';
import { PortTooltip, PortTooltipData } from './PortTooltip';

interface PortInfrastructure {
  docks: number;
  cranes: number;
  warehouses: number;
  railConnections: boolean;
  deepWaterAccess: boolean;
}

interface PortDetail {
  id: string;
  name: string;
  infrastructure: PortInfrastructure;
  position: { x: number; y: number };
  country?: string;
  countryName?: string;
  capacity?: number;
  efficiency?: number;
  majorExports?: string[];
  majorImports?: string[];
}

export class PortDetailLayer extends Phaser.GameObjects.Container {
  private portId: string;
  private portDetail: PortDetail;
  private infrastructureSprites: Phaser.GameObjects.GameObject[] = [];
  private detailText: Phaser.GameObjects.Text | null = null;
  private isDetailView: boolean = false;
  private tooltip: PortTooltip | null = null;
  private portMarker: Phaser.GameObjects.Circle | null = null;
  
  // Visual constants
  private readonly DOCK_COLOR = 0x4A90E2;
  private readonly CRANE_COLOR = 0xF5A623;
  private readonly WAREHOUSE_COLOR = 0x7ED321;
  private readonly RAIL_COLOR = 0x9013FE;
  private readonly WATER_COLOR = 0x50E3C2;
  
  constructor(scene: Phaser.Scene, portDetail: PortDetail) {
    super(scene, portDetail.position.x, portDetail.position.y);
    
    this.portId = portDetail.id;
    this.portDetail = portDetail;
    
    // Add to scene
    scene.add.existing(this);
    
    // Initial setup
    this.setDepth(600); // Above map tiles but below UI
    this.createSimpleView();
  }
  
  /**
   * Create simple port icon view (global zoom level)
   */
  private createSimpleView(): void {
    // Simple golden port marker - smaller size
    this.portMarker = this.scene.add.circle(0, 0, 15, 0xFFD700, 0.9);
    this.portMarker.setStrokeStyle(2, 0xFFFFFF);
    
    console.log(`[PortDetailLayer] Creating port marker for ${this.portDetail.name} at world position (${this.x}, ${this.y})`);
    
    // Port name label
    const nameLabel = this.scene.add.text(0, -40, this.portDetail.name, {
      fontSize: '14px',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    });
    nameLabel.setOrigin(0.5, 0.5);
    
    // Add to container
    this.add([this.portMarker, nameLabel]);
    
    // Make sure the container is visible
    this.setVisible(true);
    this.setAlpha(1);
    
    // Make interactive
    this.portMarker.setInteractive({ useHandCursor: true });
    this.setupInteractivity(this.portMarker);
    
    // Setup tooltip if not already created
    if (!this.tooltip) {
      this.tooltip = new PortTooltip(this.scene);
    }
  }
  
  /**
   * Create detailed infrastructure view (zoomed in)
   */
  private createDetailView(): void {
    const infra = this.portDetail.infrastructure;
    
    // Clear existing objects
    this.removeAll(true);
    this.infrastructureSprites = [];
    
    // Background water area for port - sized to match a tile (64x32)
    const tileWidth = 64;
    const tileHeight = 32;
    const waterArea = this.scene.add.rectangle(0, 0, tileWidth, tileHeight, this.WATER_COLOR, 0.2);
    waterArea.setStrokeStyle(1, this.WATER_COLOR);
    this.add(waterArea);
    
    // Dock area - scaled to fit within tile
    const dockWidth = Math.min(infra.docks * 0.5, tileWidth * 0.7);
    const dockArea = this.scene.add.rectangle(-tileWidth * 0.2, -tileHeight * 0.3, dockWidth, 8, this.DOCK_COLOR, 0.7);
    dockArea.setStrokeStyle(1, this.DOCK_COLOR);
    this.add(dockArea);
    this.infrastructureSprites.push(dockArea);
    
    // Individual docks - scaled down to fit within tile
    const docksPerRow = 5;
    const dockSpacing = 6;
    for (let i = 0; i < Math.min(infra.docks, 5); i++) {
      const row = Math.floor(i / docksPerRow);
      const col = i % docksPerRow;
      const x = -tileWidth * 0.3 + col * dockSpacing;
      const y = -tileHeight * 0.2 + row * 4;
      
      const dock = this.scene.add.rectangle(x, y, 4, 3, this.DOCK_COLOR);
      dock.setStrokeStyle(0.5, 0xFFFFFF);
      this.add(dock);
      this.infrastructureSprites.push(dock);
    }
    
    // Cranes - scaled down
    const cranesPerRow = 4;
    const craneSpacing = 8;
    for (let i = 0; i < Math.min(infra.cranes, 4); i++) {
      const row = Math.floor(i / cranesPerRow);
      const col = i % cranesPerRow;
      const x = -tileWidth * 0.3 + col * craneSpacing;
      const y = 0 + row * 8;
      
      // Crane base
      const craneBase = this.scene.add.rectangle(x, y, 3, 3, this.CRANE_COLOR);
      // Crane arm
      const craneArm = this.scene.add.line(0, 0, x, y - 2, x + 5, y - 5, this.CRANE_COLOR, 1);
      craneArm.setLineWidth(1);
      
      this.add([craneBase, craneArm]);
      this.infrastructureSprites.push(craneBase, craneArm);
    }
    
    // Warehouses - scaled down
    const warehousesPerRow = 3;
    const warehouseSpacing = 12;
    for (let i = 0; i < Math.min(infra.warehouses, 3); i++) {
      const row = Math.floor(i / warehousesPerRow);
      const col = i % warehousesPerRow;
      const x = tileWidth * 0.1 + col * warehouseSpacing;
      const y = -tileHeight * 0.1 + row * 10;
      
      const warehouse = this.scene.add.rectangle(x, y, 8, 6, this.WAREHOUSE_COLOR, 0.7);
      warehouse.setStrokeStyle(1, this.WAREHOUSE_COLOR);
      
      // Warehouse roof
      const roof = this.scene.add.triangle(x, y - 4, 0, 0, -4, 2, 4, 2, 0x5A8F29, 0.8);
      
      this.add([warehouse, roof]);
      this.infrastructureSprites.push(warehouse, roof);
    }
    
    // Rail connections - scaled down
    if (infra.railConnections) {
      const railY = tileHeight * 0.4;
      const rail1 = this.scene.add.line(0, 0, -tileWidth * 0.4, railY, tileWidth * 0.4, railY, this.RAIL_COLOR, 0.8);
      rail1.setLineWidth(1);
      const rail2 = this.scene.add.line(0, 0, -tileWidth * 0.4, railY + 2, tileWidth * 0.4, railY + 2, this.RAIL_COLOR, 0.8);
      rail2.setLineWidth(1);
      
      // Rail ties
      for (let i = -tileWidth * 0.3; i <= tileWidth * 0.3; i += 8) {
        const tie = this.scene.add.rectangle(i, railY + 1, 3, 2, 0x4A3C28, 0.6);
        this.add(tie);
        this.infrastructureSprites.push(tie);
      }
      
      this.add([rail1, rail2]);
      this.infrastructureSprites.push(rail1, rail2);
    }
    
    // Deep water access indicator - scaled down
    if (infra.deepWaterAccess) {
      const deepWaterIcon = this.scene.add.circle(-tileWidth * 0.4, -tileHeight * 0.3, 5, 0x1E88E5, 0.8);
      deepWaterIcon.setStrokeStyle(1, 0x0D47A1);
      
      const anchorIcon = this.scene.add.text(-tileWidth * 0.4, -tileHeight * 0.3, '⚓', {
        fontSize: '8px',
        color: '#FFFFFF'
      });
      anchorIcon.setOrigin(0.5, 0.5);
      
      this.add([deepWaterIcon, anchorIcon]);
      this.infrastructureSprites.push(deepWaterIcon, anchorIcon);
    }
    
    // Port name and details - scaled down
    const detailBg = this.scene.add.rectangle(0, -tileHeight * 0.7, tileWidth * 0.8, 12, 0x000000, 0.8);
    detailBg.setStrokeStyle(1, 0xFFD700);
    
    this.detailText = this.scene.add.text(0, -tileHeight * 0.7, this.portDetail.name, {
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#FFD700',
      align: 'center'
    });
    this.detailText.setOrigin(0.5, 0.5);
    
    const statsText = this.scene.add.text(0, tileHeight * 0.7, 
      `D:${infra.docks} C:${infra.cranes} W:${infra.warehouses}`,
      {
        fontSize: '8px',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 4, y: 2 }
      }
    );
    statsText.setOrigin(0.5, 0.5);
    
    this.add([detailBg, this.detailText, statsText]);
    
    // Animate entrance
    this.animateDetailEntrance();
  }
  
  /**
   * Animate the entrance of detail view elements
   */
  private animateDetailEntrance(): void {
    this.infrastructureSprites.forEach((sprite, index) => {
      sprite.setScale(0);
      sprite.setAlpha(0);
      
      this.scene.tweens.add({
        targets: sprite,
        scale: 1,
        alpha: 1,
        duration: 300,
        delay: index * 20,
        ease: 'Power2'
      });
    });
  }
  
  /**
   * Setup interactivity for the port
   */
  private setupInteractivity(target: Phaser.GameObjects.GameObject): void {
    target.on('pointerover', () => {
      this.scene.tweens.add({
        targets: target,
        scale: 1.1,
        duration: 200,
        ease: 'Power2'
      });
      
      // Show tooltip in simple view
      if (!this.isDetailView && this.tooltip) {
        const tooltipData: PortTooltipData = {
          name: this.portDetail.name,
          country: this.portDetail.countryName || this.portDetail.country || 'Unknown',
          capacity: this.portDetail.capacity || 10000,
          efficiency: this.portDetail.efficiency || 0.85,
          majorExports: this.portDetail.majorExports || ['General Cargo'],
          majorImports: this.portDetail.majorImports || ['General Cargo']
        };
        
        // Get world position
        const worldPos = this.getWorldTransformMatrix();
        this.tooltip.show(worldPos.tx, worldPos.ty, tooltipData);
      }
    });
    
    target.on('pointerout', () => {
      this.scene.tweens.add({
        targets: target,
        scale: 1.0,
        duration: 200,
        ease: 'Power2'
      });
      
      // Hide tooltip
      if (this.tooltip) {
        this.tooltip.hide();
      }
    });
    
    // Handle clicks
    target.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        // Emit port selection event
        this.scene.events.emit('port-selected', this.portId);
        
        // Zoom to port if in simple view
        if (!this.isDetailView) {
          this.scene.events.emit('zoom-to-port', {
            id: this.portId,
            position: this.portDetail.position
          });
        }
      }
    });
  }
  
  /**
   * Switch to detail view
   */
  public showDetail(): void {
    if (this.isDetailView) return;
    
    this.isDetailView = true;
    this.createDetailView();
  }
  
  /**
   * Switch to simple view
   */
  public showSimple(): void {
    if (!this.isDetailView) return;
    
    this.isDetailView = false;
    this.removeAll(true);
    this.infrastructureSprites = [];
    this.createSimpleView();
  }
  
  /**
   * Update visibility based on camera bounds
   */
  public updateVisibility(cameraBounds: Phaser.Geom.Rectangle): void {
    const isInView = cameraBounds.contains(this.x, this.y);
    this.setVisible(isInView);
  }
  
  /**
   * Get the current view state
   */
  public isInDetailView(): boolean {
    return this.isDetailView;
  }
  
  /**
   * Cleanup
   */
  public destroy(): void {
    this.removeAll(true);
    super.destroy();
  }
}