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
    // Simple golden port marker
    this.portMarker = this.scene.add.circle(0, 0, 25, 0xFFD700, 0.8);
    this.portMarker.setStrokeStyle(3, 0xFFFFFF);
    
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
    
    // Background water area for port
    const waterArea = this.scene.add.rectangle(0, 0, 300, 250, this.WATER_COLOR, 0.2);
    waterArea.setStrokeStyle(2, this.WATER_COLOR);
    this.add(waterArea);
    
    // Dock area
    const dockWidth = Math.min(infra.docks * 2, 200);
    const dockArea = this.scene.add.rectangle(-50, -80, dockWidth, 30, this.DOCK_COLOR, 0.7);
    dockArea.setStrokeStyle(2, this.DOCK_COLOR);
    this.add(dockArea);
    this.infrastructureSprites.push(dockArea);
    
    // Individual docks
    const docksPerRow = 10;
    const dockSpacing = 18;
    for (let i = 0; i < Math.min(infra.docks, 20); i++) {
      const row = Math.floor(i / docksPerRow);
      const col = i % docksPerRow;
      const x = -90 + col * dockSpacing;
      const y = -75 + row * 15;
      
      const dock = this.scene.add.rectangle(x, y, 15, 8, this.DOCK_COLOR);
      dock.setStrokeStyle(1, 0xFFFFFF);
      this.add(dock);
      this.infrastructureSprites.push(dock);
    }
    
    // Cranes
    const cranesPerRow = 8;
    const craneSpacing = 25;
    for (let i = 0; i < Math.min(infra.cranes, 16); i++) {
      const row = Math.floor(i / cranesPerRow);
      const col = i % cranesPerRow;
      const x = -85 + col * craneSpacing;
      const y = -40 + row * 30;
      
      // Crane base
      const craneBase = this.scene.add.rectangle(x, y, 8, 8, this.CRANE_COLOR);
      // Crane arm
      const craneArm = this.scene.add.line(0, 0, x, y - 4, x + 15, y - 12, this.CRANE_COLOR, 1);
      craneArm.setLineWidth(2);
      
      this.add([craneBase, craneArm]);
      this.infrastructureSprites.push(craneBase, craneArm);
    }
    
    // Warehouses
    const warehousesPerRow = 5;
    const warehouseSpacing = 45;
    for (let i = 0; i < Math.min(infra.warehouses, 10); i++) {
      const row = Math.floor(i / warehousesPerRow);
      const col = i % warehousesPerRow;
      const x = -90 + col * warehouseSpacing;
      const y = 20 + row * 40;
      
      const warehouse = this.scene.add.rectangle(x, y, 35, 30, this.WAREHOUSE_COLOR, 0.7);
      warehouse.setStrokeStyle(2, this.WAREHOUSE_COLOR);
      
      // Warehouse roof
      const roof = this.scene.add.triangle(x, y - 20, 0, 0, -20, 10, 20, 10, 0x5A8F29, 0.8);
      
      this.add([warehouse, roof]);
      this.infrastructureSprites.push(warehouse, roof);
    }
    
    // Rail connections
    if (infra.railConnections) {
      const railY = 90;
      const rail1 = this.scene.add.line(0, 0, -100, railY, 100, railY, this.RAIL_COLOR, 0.8);
      rail1.setLineWidth(3);
      const rail2 = this.scene.add.line(0, 0, -100, railY + 5, 100, railY + 5, this.RAIL_COLOR, 0.8);
      rail2.setLineWidth(3);
      
      // Rail ties
      for (let i = -90; i <= 90; i += 20) {
        const tie = this.scene.add.rectangle(i, railY + 2.5, 12, 8, 0x4A3C28, 0.6);
        this.add(tie);
        this.infrastructureSprites.push(tie);
      }
      
      this.add([rail1, rail2]);
      this.infrastructureSprites.push(rail1, rail2);
    }
    
    // Deep water access indicator
    if (infra.deepWaterAccess) {
      const deepWaterIcon = this.scene.add.circle(-120, -80, 15, 0x1E88E5, 0.8);
      deepWaterIcon.setStrokeStyle(2, 0x0D47A1);
      
      const anchorIcon = this.scene.add.text(-120, -80, '⚓', {
        fontSize: '16px',
        color: '#FFFFFF'
      });
      anchorIcon.setOrigin(0.5, 0.5);
      
      this.add([deepWaterIcon, anchorIcon]);
      this.infrastructureSprites.push(deepWaterIcon, anchorIcon);
    }
    
    // Port name and details
    const detailBg = this.scene.add.rectangle(0, -120, 250, 40, 0x000000, 0.8);
    detailBg.setStrokeStyle(2, 0xFFD700);
    
    this.detailText = this.scene.add.text(0, -120, this.portDetail.name, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFD700',
      align: 'center'
    });
    this.detailText.setOrigin(0.5, 0.5);
    
    const statsText = this.scene.add.text(0, 120, 
      `Docks: ${infra.docks} | Cranes: ${infra.cranes} | Warehouses: ${infra.warehouses}`,
      {
        fontSize: '12px',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 10, y: 5 }
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