import { PlacedAsset, AssetDefinition } from '../app/lib/types/assets';
import { useEmpireStore } from '../src/store/empireStore';

// Bridge between React asset store and Phaser scene
export class AssetBridge {
  private scene: Phaser.Scene | null = null;
  private assetSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    // Subscribe to asset store changes
    this.subscribeToStore();
  }

  // Set the active Phaser scene
  setScene(scene: Phaser.Scene) {
    this.scene = scene;
    // Ensure Maps are properly initialized before syncing
    this.ensureMapsInitialized();
    // Sync existing assets when scene is set
    this.syncAllAssets();
  }

  // Ensure Maps are properly initialized (fixes serialization issues)
  private ensureMapsInitialized() {
    const store = useEmpireStore.getState();
    
    // Fix placedAssets if it's not a Map
    if (!store.placedAssets || typeof store.placedAssets.entries !== 'function') {
      console.log('Reinitializing placedAssets as Map');
      useEmpireStore.setState({ placedAssets: new Map() });
    }
    
    // Fix assetDefinitions if it's not a Map
    if (!store.assetDefinitions || typeof store.assetDefinitions.get !== 'function') {
      console.log('Reinitializing assetDefinitions as Map');
      useEmpireStore.setState({ assetDefinitions: new Map() });
    }
  }

  // Subscribe to asset store changes
  private subscribeToStore() {
    this.unsubscribe = useEmpireStore.subscribe(() => {
      if (this.scene) {
        // Ensure Maps are properly initialized before syncing
        this.ensureMapsInitialized();
        this.syncAllAssets();
      }
    });
  }

  // Sync all assets from store to Phaser
  private syncAllAssets() {
    if (!this.scene) return;

    const store = useEmpireStore.getState();
    const placedAssets = store.placedAssets;
    const definitions = store.assetDefinitions;

    // Safety check: ensure placedAssets is a Map
    if (!placedAssets || typeof placedAssets.entries !== 'function') {
      console.warn('❌ placedAssets is not a Map or is undefined:', placedAssets);
      return;
    }

    // Safety check: ensure definitions is a Map
    if (!definitions || typeof definitions.get !== 'function') {
      console.warn('❌ assetDefinitions is not a Map or is undefined:', definitions);
      return;
    }

    // Remove sprites for deleted assets
    for (const [assetId, sprite] of this.assetSprites.entries()) {
      if (!placedAssets.has(assetId)) {
        sprite.destroy();
        this.assetSprites.delete(assetId);
      }
    }

    // Add or update sprites for current assets
    for (const [assetId, asset] of placedAssets.entries()) {
      const definition = definitions.get(asset.definitionId);
      if (!definition) continue;

      if (this.assetSprites.has(assetId)) {
        // Update existing sprite
        this.updateAssetSprite(asset, definition);
      } else {
        // Create new sprite
        this.createAssetSprite(asset, definition);
      }
    }
  }

  // Create a sprite for an asset
  private createAssetSprite(asset: PlacedAsset, definition: AssetDefinition) {
    if (!this.scene) return;

    // Get sprite key based on asset type
    const spriteKey = this.getSpriteKey(definition);
    
    // Create sprite at asset position
    const sprite = this.scene.add.sprite(
      asset.position.x,
      asset.position.y,
      spriteKey
    );

    // Set sprite properties
    sprite.setRotation(Phaser.Math.DegToRad(asset.rotation));
    sprite.setScale(0.5); // Adjust scale as needed
    sprite.setDepth(10); // Above map but below UI
    
    // Add status indicator
    if (asset.status !== 'active') {
      sprite.setTint(this.getStatusTint(asset.status));
    }

    // Make interactive
    sprite.setInteractive();
    sprite.on('pointerdown', () => this.handleAssetClick(asset.id));

    // Store reference
    this.assetSprites.set(asset.id, sprite);
  }

  // Update an existing asset sprite
  private updateAssetSprite(asset: PlacedAsset, definition: AssetDefinition) {
    const sprite = this.assetSprites.get(asset.id);
    if (!sprite) return;

    // Update position
    sprite.setPosition(asset.position.x, asset.position.y);
    
    // Update rotation
    sprite.setRotation(Phaser.Math.DegToRad(asset.rotation));
    
    // Update tint based on status
    if (asset.status !== 'active') {
      sprite.setTint(this.getStatusTint(asset.status));
    } else {
      sprite.clearTint();
    }
  }

  // Get sprite key for asset type
  private getSpriteKey(definition: AssetDefinition): string {
    // Map asset types to Phaser sprite keys
    switch (definition.type) {
      case 'ship':
        return definition.subType === 'tanker' ? 'ship-tanker' : 'ship-cargo';
      case 'plane':
        return 'plane-cargo';
      case 'warehouse':
        return 'warehouse';
      case 'infrastructure':
        return 'infrastructure';
      default:
        return 'ship-cargo'; // fallback
    }
  }

  // Get tint color for asset status
  private getStatusTint(status: PlacedAsset['status']): number {
    switch (status) {
      case 'inactive':
        return 0x808080; // Gray
      case 'maintenance':
        return 0xffff00; // Yellow
      case 'transit':
        return 0x00ff00; // Green
      default:
        return 0xffffff; // White (no tint)
    }
  }

  // Handle asset click
  private handleAssetClick(assetId: string) {
    console.log('Asset clicked:', assetId);
    // Update the empire store with selected asset
    useEmpireStore.getState().setSelectedAsset(assetId);
    // Emit event for UI components
    if (this.scene) {
      this.scene.events.emit('asset-selected', assetId);
    }
  }

  // Clean up
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Destroy all sprites
    for (const sprite of this.assetSprites.values()) {
      sprite.destroy();
    }
    this.assetSprites.clear();
    
    this.scene = null;
  }
}

// Singleton instance
export const assetBridge = new AssetBridge(); 