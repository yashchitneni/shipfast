import * as Phaser from 'phaser';
import { PortDetailLayer } from './PortDetailLayer';
import { LODQuadTree } from './LODQuadTree';

interface LODConfig {
  detailThreshold: number;  // Zoom level to switch to detail view
  simpleThreshold: number;  // Zoom level to switch back to simple view
  fadeTransition: boolean;  // Enable fade transitions
  cullingPadding: number;   // Padding for culling calculations
}

interface PortAssetDisplay {
  assetId: string;
  type: string;
  sprite: Phaser.GameObjects.Sprite | null;
  label: Phaser.GameObjects.Text | null;
}

export class LODManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private config: LODConfig;
  private portLayers: Map<string, PortDetailLayer> = new Map();
  private currentZoom: number = 1;
  private lastZoom: number = 1;
  private isTransitioning: boolean = false;
  private portAssets: Map<string, PortAssetDisplay[]> = new Map();
  private quadTree: LODQuadTree | null = null;
  private worldBounds: Phaser.Geom.Rectangle;
  
  // Default configuration
  private readonly DEFAULT_CONFIG: LODConfig = {
    detailThreshold: 1.5,
    simpleThreshold: 1.2,
    fadeTransition: true,
    cullingPadding: 200
  };
  
  constructor(scene: Phaser.Scene, config?: Partial<LODConfig>) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    
    // Initialize world bounds (will be updated when ports are registered)
    this.worldBounds = new Phaser.Geom.Rectangle(-5000, -5000, 10000, 10000);
    
    // Listen for zoom changes
    this.setupZoomListener();
  }
  
  /**
   * Register a port with the LOD system
   */
  public registerPort(portData: any): void {
    const portDetail = {
      id: portData.id,
      name: portData.name,
      infrastructure: portData.infrastructure || {
        docks: 10,
        cranes: 20,
        warehouses: 5,
        railConnections: true,
        deepWaterAccess: true
      },
      position: portData.coordinates || portData.position
    };
    
    const layer = new PortDetailLayer(this.scene, portDetail);
    this.portLayers.set(portData.id, layer);
  }
  
  /**
   * Register multiple ports at once
   */
  public registerPorts(portsData: any[]): void {
    // Register all ports
    portsData.forEach(port => this.registerPort(port));
    
    // Build spatial index after all ports are registered
    this.buildSpatialIndex();
  }
  
  /**
   * Add asset displays for a specific port
   */
  public addPortAssets(portId: string, assets: any[]): void {
    const displays: PortAssetDisplay[] = assets.map(asset => ({
      assetId: asset.id,
      type: asset.type || 'ship',
      sprite: null,
      label: null
    }));
    
    this.portAssets.set(portId, displays);
  }
  
  /**
   * Setup zoom change listener
   */
  private setupZoomListener(): void {
    // Listen for camera zoom changes
    this.camera.on('zoomchange', (camera: Phaser.Cameras.Scene2D.Camera, zoom: number) => {
      this.handleZoomChange(zoom);
    });
    
    // Initial zoom state
    this.currentZoom = this.camera.zoom;
    this.lastZoom = this.camera.zoom;
  }
  
  /**
   * Handle zoom level changes
   */
  private handleZoomChange(newZoom: number): void {
    this.lastZoom = this.currentZoom;
    this.currentZoom = newZoom;
    
    // Check if we crossed a threshold
    const crossedToDetail = this.lastZoom < this.config.detailThreshold && 
                           this.currentZoom >= this.config.detailThreshold;
    const crossedToSimple = this.lastZoom >= this.config.simpleThreshold && 
                           this.currentZoom < this.config.simpleThreshold;
    
    if (crossedToDetail || crossedToSimple) {
      this.updateAllPortLOD();
    }
  }
  
  /**
   * Update LOD for all ports based on current zoom
   */
  private updateAllPortLOD(): void {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    this.portLayers.forEach((layer, portId) => {
      if (this.currentZoom >= this.config.detailThreshold) {
        // Switch to detail view
        if (!layer.isInDetailView()) {
          this.transitionToDetail(layer, portId);
        }
      } else if (this.currentZoom < this.config.simpleThreshold) {
        // Switch to simple view
        if (layer.isInDetailView()) {
          this.transitionToSimple(layer, portId);
        }
      }
    });
    
    // Reset transition flag after a delay
    this.scene.time.delayedCall(300, () => {
      this.isTransitioning = false;
    });
  }
  
  /**
   * Transition a port to detail view
   */
  private transitionToDetail(layer: PortDetailLayer, portId: string): void {
    if (this.config.fadeTransition) {
      // Fade out, switch, fade in
      this.scene.tweens.add({
        targets: layer,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          layer.showDetail();
          this.showPortAssets(portId);
          
          this.scene.tweens.add({
            targets: layer,
            alpha: 1,
            duration: 150
          });
        }
      });
    } else {
      layer.showDetail();
      this.showPortAssets(portId);
    }
  }
  
  /**
   * Transition a port to simple view
   */
  private transitionToSimple(layer: PortDetailLayer, portId: string): void {
    if (this.config.fadeTransition) {
      // Fade out, switch, fade in
      this.scene.tweens.add({
        targets: layer,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          layer.showSimple();
          this.hidePortAssets(portId);
          
          this.scene.tweens.add({
            targets: layer,
            alpha: 1,
            duration: 150
          });
        }
      });
    } else {
      layer.showSimple();
      this.hidePortAssets(portId);
    }
  }
  
  /**
   * Show assets at a port when in detail view
   */
  private showPortAssets(portId: string): void {
    const assets = this.portAssets.get(portId);
    if (!assets) return;
    
    const portLayer = this.portLayers.get(portId);
    if (!portLayer) return;
    
    const portX = portLayer.x;
    const portY = portLayer.y;
    
    assets.forEach((asset, index) => {
      // Create asset sprite if not exists
      if (!asset.sprite) {
        // Position assets in a grid around the port
        const angle = (index / assets.length) * Math.PI * 2;
        const radius = 60 + (index % 3) * 20;
        const x = portX + Math.cos(angle) * radius;
        const y = portY + Math.sin(angle) * radius;
        
        // Create ship/asset sprite or placeholder
        let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
        const textureKey = this.getAssetTexture(asset.type);
        
        if (this.scene.textures.exists(textureKey)) {
          sprite = this.scene.add.sprite(x, y, textureKey);
          sprite.setScale(0.5);
        } else {
          // Create placeholder graphic
          const graphics = this.scene.add.graphics();
          graphics.fillStyle(0x00A652, 0.8); // Cargo green
          graphics.fillRect(-15, -10, 30, 20);
          graphics.setPosition(x, y);
          sprite = graphics as any;
        }
        
        sprite.setDepth(650); // Above port details
        sprite.setAlpha(0);
        
        // Create label
        const label = this.scene.add.text(x, y + 20, asset.type, {
          fontSize: '10px',
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: { x: 4, y: 2 }
        });
        label.setOrigin(0.5, 0.5);
        label.setDepth(651);
        label.setAlpha(0);
        
        asset.sprite = sprite;
        asset.label = label;
        
        // Animate in
        this.scene.tweens.add({
          targets: [sprite, label],
          alpha: 1,
          scale: { from: 0.3, to: 0.5 },
          duration: 300,
          delay: index * 50,
          ease: 'Power2'
        });
      } else {
        // Show existing sprites
        asset.sprite.setVisible(true);
        asset.label?.setVisible(true);
        
        this.scene.tweens.add({
          targets: [asset.sprite, asset.label],
          alpha: 1,
          duration: 200
        });
      }
    });
  }
  
  /**
   * Hide assets at a port when in simple view
   */
  private hidePortAssets(portId: string): void {
    const assets = this.portAssets.get(portId);
    if (!assets) return;
    
    assets.forEach((asset) => {
      if (asset.sprite) {
        this.scene.tweens.add({
          targets: [asset.sprite, asset.label],
          alpha: 0,
          duration: 200,
          onComplete: () => {
            asset.sprite?.setVisible(false);
            asset.label?.setVisible(false);
          }
        });
      }
    });
  }
  
  /**
   * Get texture key for asset type
   */
  private getAssetTexture(type: string): string {
    // Map asset types to texture keys
    const textureMap: Record<string, string> = {
      'ship': 'ship-cargo',
      'cargo': 'ship-cargo',
      'tanker': 'ship-tanker',
      'container': 'ship-container',
      'warehouse': 'asset-warehouse',
      'crane': 'asset-crane',
      'default': 'ship-cargo'
    };
    
    return textureMap[type] || textureMap['default'];
  }
  
  /**
   * Build spatial index for efficient culling
   */
  private buildSpatialIndex(): void {
    // Calculate world bounds from all ports
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    this.portLayers.forEach(layer => {
      minX = Math.min(minX, layer.x - 100);
      minY = Math.min(minY, layer.y - 100);
      maxX = Math.max(maxX, layer.x + 100);
      maxY = Math.max(maxY, layer.y + 100);
    });
    
    // Update world bounds with some padding
    this.worldBounds = new Phaser.Geom.Rectangle(
      minX - 500,
      minY - 500,
      (maxX - minX) + 1000,
      (maxY - minY) + 1000
    );
    
    // Create new quadtree
    this.quadTree = new LODQuadTree(this.worldBounds);
    
    // Insert all ports into quadtree
    this.portLayers.forEach((layer, id) => {
      const bounds = new Phaser.Geom.Rectangle(
        layer.x - 50,
        layer.y - 50,
        100,
        100
      );
      this.quadTree!.insert({ id, bounds });
    });
    
    console.log(`Spatial index built with ${this.portLayers.size} ports`);
  }
  
  /**
   * Update culling for all port layers
   */
  public updateCulling(): void {
    const cameraBounds = new Phaser.Geom.Rectangle(
      this.camera.scrollX - this.config.cullingPadding,
      this.camera.scrollY - this.config.cullingPadding,
      this.camera.width / this.camera.zoom + (this.config.cullingPadding * 2),
      this.camera.height / this.camera.zoom + (this.config.cullingPadding * 2)
    );
    
    if (this.quadTree) {
      // Use quadtree for efficient culling
      const visiblePorts = this.quadTree.retrieve(cameraBounds);
      const visibleIds = new Set(visiblePorts.map(p => p.id));
      
      // Update visibility based on quadtree results
      this.portLayers.forEach((layer, id) => {
        const isInView = visibleIds.has(id);
        layer.setVisible(isInView);
      });
    } else {
      // Fallback to checking all ports
      this.portLayers.forEach(layer => {
        layer.updateVisibility(cameraBounds);
      });
    }
  }
  
  /**
   * Get current LOD state
   */
  public getLODState(): { zoom: number; isDetail: boolean } {
    return {
      zoom: this.currentZoom,
      isDetail: this.currentZoom >= this.config.detailThreshold
    };
  }
  
  /**
   * Force update all ports to current LOD
   */
  public forceUpdate(): void {
    this.updateAllPortLOD();
  }
  
  /**
   * Clean up
   */
  public destroy(): void {
    this.camera.off('zoomchange');
    
    this.portLayers.forEach(layer => layer.destroy());
    this.portLayers.clear();
    
    this.portAssets.forEach(assets => {
      assets.forEach(asset => {
        asset.sprite?.destroy();
        asset.label?.destroy();
      });
    });
    this.portAssets.clear();
  }
}