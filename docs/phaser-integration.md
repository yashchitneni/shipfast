# Phaser.js Integration Documentation

## Overview

Flexport uses Phaser.js 3 for rendering the isometric game world, handling sprites, animations, and game physics. This document covers the integration between Phaser.js and our React/Next.js application, including best practices and patterns.

## Architecture

```
┌─────────────────────────────────────────────┐
│          React/Next.js App                  │
│        (UI Layer & State)                   │
├─────────────────────────────────────────────┤
│         Phaser Integration Layer            │
│    (GameCanvas Component & Bridge)          │
├─────────────────────────────────────────────┤
│           Phaser.js Engine                  │
│     (Scenes, GameObjects, Physics)         │
└─────────────────────────────────────────────┘
```

## Integration Setup

### 1. GameCanvas Component (`/components/game/GameCanvas.tsx`)

The main component that embeds Phaser into React:

```typescript
import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { WorldMapScene } from '@/lib/phaser/scenes/WorldMapScene'
import { PreloadScene } from '@/lib/phaser/scenes/PreloadScene'
import { useGameBridge } from '@/lib/phaser/hooks/useGameBridge'

interface GameCanvasProps {
  onReady?: (game: Phaser.Game) => void
  className?: string
}

export function GameCanvas({ onReady, className }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    // Phaser configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: '100%',
      height: '100%',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [PreloadScene, WorldMapScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: process.env.NODE_ENV === 'development',
        },
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },
      backgroundColor: '#1a1a2e',
    }

    // Create game instance
    gameRef.current = new Phaser.Game(config)

    // Wait for game to be ready
    gameRef.current.events.once('ready', () => {
      setIsReady(true)
      onReady?.(gameRef.current!)
    })

    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [onReady])

  // Bridge React state to Phaser
  useGameBridge(isReady ? gameRef.current : null)

  return (
    <div 
      ref={containerRef} 
      className={`game-canvas ${className || ''}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
```

### 2. Scene Management

#### PreloadScene (`/lib/phaser/scenes/PreloadScene.ts`)

Handles asset loading:

```typescript
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5)

    // Update progress
    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0xffffff, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
    })

    // Load assets
    this.loadAssets()
  }

  private loadAssets() {
    // Map tiles
    this.load.image('ocean', '/assets/tiles/ocean.png')
    this.load.image('land', '/assets/tiles/land.png')
    
    // Port sprites
    this.load.image('port-small', '/assets/sprites/port-small.png')
    this.load.image('port-medium', '/assets/sprites/port-medium.png')
    this.load.image('port-large', '/assets/sprites/port-large.png')
    
    // Asset sprites
    this.load.spritesheet('ship-container', '/assets/sprites/ship-container.png', {
      frameWidth: 64,
      frameHeight: 64
    })
    this.load.spritesheet('ship-tanker', '/assets/sprites/ship-tanker.png', {
      frameWidth: 80,
      frameHeight: 80
    })
    this.load.image('warehouse', '/assets/sprites/warehouse.png')
    
    // UI elements
    this.load.image('select-ring', '/assets/ui/select-ring.png')
    this.load.image('route-node', '/assets/ui/route-node.png')
    
    // Effects
    this.load.spritesheet('water-ripple', '/assets/effects/water-ripple.png', {
      frameWidth: 32,
      frameHeight: 32
    })
  }

  create() {
    // Create animations
    this.createAnimations()
    
    // Start main scene
    this.scene.start('WorldMapScene')
  }

  private createAnimations() {
    // Ship movement
    this.anims.create({
      key: 'ship-move',
      frames: this.anims.generateFrameNumbers('ship-container', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    })

    // Water effects
    this.anims.create({
      key: 'water-ripple',
      frames: this.anims.generateFrameNumbers('water-ripple', { start: 0, end: 9 }),
      frameRate: 15,
      repeat: 0
    })
  }
}
```

#### WorldMapScene (`/lib/phaser/scenes/WorldMapScene.ts`)

Main game scene:

```typescript
import { IsometricPlugin } from '@/lib/phaser/plugins/IsometricPlugin'
import { CameraController } from '@/lib/phaser/systems/CameraController'
import { AssetManager } from '@/lib/phaser/systems/AssetManager'
import { RouteManager } from '@/lib/phaser/systems/RouteManager'
import { Port, Asset, Route } from '@/types/game'

export class WorldMapScene extends Phaser.Scene {
  // Plugins
  private isometric!: IsometricPlugin

  // Systems
  private cameraController!: CameraController
  private assetManager!: AssetManager
  private routeManager!: RouteManager

  // Game objects
  private mapContainer!: Phaser.GameObjects.Container
  private portsGroup!: Phaser.GameObjects.Group
  private assetsGroup!: Phaser.GameObjects.Group

  // State
  private ports: Map<string, Port> = new Map()
  private selectedObject: Phaser.GameObjects.GameObject | null = null

  constructor() {
    super({ key: 'WorldMapScene' })
  }

  create() {
    // Initialize isometric plugin
    this.isometric = new IsometricPlugin(this)
    
    // Create containers
    this.mapContainer = this.add.container(0, 0)
    
    // Initialize systems
    this.cameraController = new CameraController(this)
    this.assetManager = new AssetManager(this)
    this.routeManager = new RouteManager(this)
    
    // Create map
    this.createIsometricMap()
    
    // Set up interactions
    this.setupInteractions()
    
    // Connect to React state
    this.connectToReactState()
  }

  private createIsometricMap() {
    const mapData = this.cache.json.get('world-map')
    
    // Create ocean base
    for (let x = 0; x < mapData.width; x++) {
      for (let y = 0; y < mapData.height; y++) {
        const isoPos = this.isometric.cartesianToIsometric(x * 64, y * 64)
        const tile = this.add.image(isoPos.x, isoPos.y, 'ocean')
        tile.setDepth(isoPos.y)
        this.mapContainer.add(tile)
      }
    }
    
    // Create ports
    mapData.ports.forEach((portData: any) => {
      const port = this.createPort(portData)
      this.ports.set(port.id, port)
    })
  }

  private createPort(data: any): Port {
    const isoPos = this.isometric.cartesianToIsometric(data.x, data.y)
    
    const sprite = this.add.sprite(isoPos.x, isoPos.y, `port-${data.size}`)
    sprite.setInteractive()
    sprite.setData('id', data.id)
    sprite.setData('type', 'port')
    sprite.setDepth(isoPos.y + 1)
    
    this.mapContainer.add(sprite)
    this.portsGroup.add(sprite)
    
    // Add label
    const label = this.add.text(isoPos.x, isoPos.y - 40, data.name, {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    this.mapContainer.add(label)
    
    return {
      id: data.id,
      sprite,
      data
    }
  }

  private setupInteractions() {
    // Click handling
    this.input.on('gameobjectdown', this.handleObjectClick, this)
    
    // Hover effects
    this.input.on('gameobjectover', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Sprite) {
        gameObject.setTint(0xffff00)
      }
    })
    
    this.input.on('gameobjectout', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Sprite) {
        gameObject.clearTint()
      }
    })
  }

  private handleObjectClick(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
    const type = gameObject.getData('type')
    const id = gameObject.getData('id')
    
    // Emit event to React
    this.game.events.emit('objectClicked', { type, id })
    
    // Update selection
    this.selectObject(gameObject)
  }

  private selectObject(gameObject: Phaser.GameObjects.GameObject | null) {
    // Clear previous selection
    if (this.selectedObject) {
      this.clearSelection()
    }
    
    if (gameObject) {
      // Add selection indicator
      const sprite = gameObject as Phaser.GameObjects.Sprite
      const ring = this.add.image(sprite.x, sprite.y, 'select-ring')
      ring.setDepth(sprite.depth - 0.1)
      sprite.setData('selectionRing', ring)
      
      this.selectedObject = gameObject
    }
  }

  private clearSelection() {
    if (this.selectedObject) {
      const ring = this.selectedObject.getData('selectionRing')
      if (ring) {
        ring.destroy()
      }
      this.selectedObject = null
    }
  }

  // React integration methods
  public updateAssets(assets: Asset[]) {
    this.assetManager.updateAssets(assets)
  }

  public updateRoutes(routes: Route[]) {
    this.routeManager.updateRoutes(routes)
  }

  public setSelectedAsset(assetId: string | null) {
    if (!assetId) {
      this.clearSelection()
      return
    }
    
    const asset = this.assetManager.getAsset(assetId)
    if (asset) {
      this.selectObject(asset.sprite)
    }
  }

  update(time: number, delta: number) {
    // Update systems
    this.cameraController.update(delta)
    this.assetManager.update(delta)
    this.routeManager.update(delta)
  }
}
```

### 3. Game Systems

#### Camera Controller (`/lib/phaser/systems/CameraController.ts`)

Handles camera movement and zoom:

```typescript
export class CameraController {
  private scene: Phaser.Scene
  private camera: Phaser.Cameras.Scene2D.Camera
  private isDragging: boolean = false
  private dragStartX: number = 0
  private dragStartY: number = 0
  
  // Zoom settings
  private minZoom: number = 0.5
  private maxZoom: number = 2
  private zoomStep: number = 0.1
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.camera = scene.cameras.main
    
    this.setupControls()
  }
  
  private setupControls() {
    const { input } = this.scene
    
    // Mouse wheel zoom
    input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const zoom = this.camera.zoom
      const newZoom = Phaser.Math.Clamp(
        zoom - (deltaY * this.zoomStep * 0.001),
        this.minZoom,
        this.maxZoom
      )
      
      this.smoothZoom(newZoom, pointer.worldX, pointer.worldY)
    })
    
    // Drag to pan
    input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isDragging = true
        this.dragStartX = pointer.x
        this.dragStartY = pointer.y
      }
    })
    
    input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = this.dragStartX - pointer.x
        const deltaY = this.dragStartY - pointer.y
        
        this.camera.scrollX += deltaX / this.camera.zoom
        this.camera.scrollY += deltaY / this.camera.zoom
        
        this.dragStartX = pointer.x
        this.dragStartY = pointer.y
      }
    })
    
    input.on('pointerup', () => {
      this.isDragging = false
    })
    
    // Keyboard controls
    const cursors = input.keyboard.createCursorKeys()
    const wasd = input.keyboard.addKeys('W,A,S,D')
    
    this.scene.events.on('update', () => {
      const speed = 5 / this.camera.zoom
      
      if (cursors.left.isDown || wasd.A.isDown) {
        this.camera.scrollX -= speed
      }
      if (cursors.right.isDown || wasd.D.isDown) {
        this.camera.scrollX += speed
      }
      if (cursors.up.isDown || wasd.W.isDown) {
        this.camera.scrollY -= speed
      }
      if (cursors.down.isDown || wasd.S.isDown) {
        this.camera.scrollY += speed
      }
    })
  }
  
  private smoothZoom(targetZoom: number, worldX: number, worldY: number) {
    this.scene.tweens.add({
      targets: this.camera,
      zoom: targetZoom,
      duration: 200,
      ease: 'Power2',
      onUpdate: () => {
        // Keep zoom centered on cursor
        this.camera.centerOn(worldX, worldY)
      }
    })
  }
  
  public focusOn(x: number, y: number, zoom?: number) {
    this.scene.tweens.add({
      targets: this.camera,
      scrollX: x - this.camera.width / 2,
      scrollY: y - this.camera.height / 2,
      zoom: zoom || this.camera.zoom,
      duration: 500,
      ease: 'Power2'
    })
  }
  
  public setBounds(x: number, y: number, width: number, height: number) {
    this.camera.setBounds(x, y, width, height)
  }
  
  update(delta: number) {
    // Additional camera logic if needed
  }
}
```

#### Asset Manager (`/lib/phaser/systems/AssetManager.ts`)

Manages game assets on the map:

```typescript
import { Asset, AssetType } from '@/types/game'

export class AssetManager {
  private scene: Phaser.Scene
  private assets: Map<string, AssetSprite> = new Map()
  private assetGroup: Phaser.GameObjects.Group
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.assetGroup = scene.add.group()
  }
  
  public updateAssets(assets: Asset[]) {
    // Remove assets that no longer exist
    const assetIds = new Set(assets.map(a => a.id))
    this.assets.forEach((sprite, id) => {
      if (!assetIds.has(id)) {
        this.removeAsset(id)
      }
    })
    
    // Update or create assets
    assets.forEach(asset => {
      if (this.assets.has(asset.id)) {
        this.updateAsset(asset)
      } else {
        this.createAsset(asset)
      }
    })
  }
  
  private createAsset(asset: Asset) {
    const sprite = new AssetSprite(this.scene, asset)
    
    this.assets.set(asset.id, sprite)
    this.assetGroup.add(sprite)
    
    // Add click handler
    sprite.on('pointerdown', () => {
      this.scene.game.events.emit('assetClicked', asset.id)
    })
    
    // Animate entrance
    sprite.setScale(0)
    this.scene.tweens.add({
      targets: sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    })
  }
  
  private updateAsset(asset: Asset) {
    const sprite = this.assets.get(asset.id)
    if (!sprite) return
    
    sprite.updateData(asset)
    
    // Update position if changed
    if (sprite.x !== asset.position.x || sprite.y !== asset.position.y) {
      this.scene.tweens.add({
        targets: sprite,
        x: asset.position.x,
        y: asset.position.y,
        duration: 1000,
        ease: 'Power2'
      })
    }
  }
  
  private removeAsset(id: string) {
    const sprite = this.assets.get(id)
    if (!sprite) return
    
    // Animate removal
    this.scene.tweens.add({
      targets: sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        sprite.destroy()
        this.assets.delete(id)
      }
    })
  }
  
  public getAsset(id: string): AssetSprite | undefined {
    return this.assets.get(id)
  }
  
  update(delta: number) {
    // Update all assets
    this.assets.forEach(asset => {
      asset.update(delta)
    })
  }
}

// Asset sprite class
class AssetSprite extends Phaser.GameObjects.Container {
  private asset: Asset
  private sprite: Phaser.GameObjects.Sprite
  private healthBar: Phaser.GameObjects.Graphics
  private statusIcon?: Phaser.GameObjects.Image
  
  constructor(scene: Phaser.Scene, asset: Asset) {
    super(scene, asset.position.x, asset.position.y)
    
    this.asset = asset
    
    // Create sprite
    this.sprite = scene.add.sprite(0, 0, this.getSpriteKey())
    this.add(this.sprite)
    
    // Create health bar
    this.healthBar = scene.add.graphics()
    this.updateHealthBar()
    this.add(this.healthBar)
    
    // Make interactive
    this.setSize(this.sprite.width, this.sprite.height)
    this.setInteractive()
    
    // Set depth based on position
    this.setDepth(this.y)
    
    scene.add.existing(this)
  }
  
  private getSpriteKey(): string {
    return `${this.asset.type}-${this.asset.subtype}`
  }
  
  private updateHealthBar() {
    const width = 40
    const height = 4
    const x = -width / 2
    const y = -this.sprite.height / 2 - 10
    
    this.healthBar.clear()
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.5)
    this.healthBar.fillRect(x, y, width, height)
    
    // Health
    const healthPercent = this.asset.health / 100
    const healthColor = healthPercent > 0.6 ? 0x00ff00 : 
                       healthPercent > 0.3 ? 0xffff00 : 0xff0000
    
    this.healthBar.fillStyle(healthColor, 1)
    this.healthBar.fillRect(x, y, width * healthPercent, height)
  }
  
  public updateData(asset: Asset) {
    this.asset = asset
    this.updateHealthBar()
    
    // Update status icon
    if (asset.status !== 'idle') {
      if (!this.statusIcon) {
        this.statusIcon = this.scene.add.image(20, -20, `status-${asset.status}`)
        this.add(this.statusIcon)
      } else {
        this.statusIcon.setTexture(`status-${asset.status}`)
      }
    } else if (this.statusIcon) {
      this.statusIcon.destroy()
      this.statusIcon = undefined
    }
  }
  
  update(delta: number) {
    // Animate based on status
    if (this.asset.status === 'in_transit') {
      this.sprite.angle += 0.1 * delta
    }
  }
}
```

### 4. React-Phaser Bridge

#### Bridge Hook (`/lib/phaser/hooks/useGameBridge.ts`)

Synchronizes React state with Phaser:

```typescript
import { useEffect } from 'react'
import { useGameStore } from '@/lib/store/gameStore'
import { useUIStore } from '@/lib/store/uiStore'
import { useMarketStore } from '@/lib/store/marketStore'

export function useGameBridge(game: Phaser.Game | null) {
  const gameStore = useGameStore()
  const uiStore = useUIStore()
  const marketStore = useMarketStore()
  
  // Sync game state to Phaser
  useEffect(() => {
    if (!game) return
    
    const worldMap = game.scene.getScene('WorldMapScene') as any
    if (!worldMap) return
    
    // Update assets
    worldMap.updateAssets(gameStore.assets)
    
    // Update routes
    worldMap.updateRoutes(gameStore.routes)
    
    // Update selection
    worldMap.setSelectedAsset(gameStore.selectedAssetId)
    
  }, [game, gameStore.assets, gameStore.routes, gameStore.selectedAssetId])
  
  // Handle Phaser events
  useEffect(() => {
    if (!game) return
    
    const handleAssetClick = (assetId: string) => {
      gameStore.selectAsset(assetId)
      uiStore.openModal('asset-details', { assetId })
    }
    
    const handleObjectClick = ({ type, id }: { type: string; id: string }) => {
      switch (type) {
        case 'asset':
          handleAssetClick(id)
          break
        case 'port':
          if (uiStore.activeTool === 'route-builder') {
            // Add port to route
            useRouteStore.getState().selectPort(id)
          }
          break
      }
    }
    
    const handleMapClick = (worldPos: { x: number; y: number }) => {
      switch (uiStore.activeTool) {
        case 'place-asset':
          // Handle asset placement
          break
        case 'route-builder':
          // Handle route point placement
          break
      }
    }
    
    // Subscribe to events
    game.events.on('assetClicked', handleAssetClick)
    game.events.on('objectClicked', handleObjectClick)
    game.events.on('mapClicked', handleMapClick)
    
    return () => {
      game.events.off('assetClicked', handleAssetClick)
      game.events.off('objectClicked', handleObjectClick)
      game.events.off('mapClicked', handleMapClick)
    }
  }, [game, uiStore.activeTool])
  
  // Sync camera state
  useEffect(() => {
    if (!game) return
    
    const worldMap = game.scene.getScene('WorldMapScene') as any
    if (!worldMap) return
    
    const camera = worldMap.cameras.main
    
    // Update camera from UI state
    camera.scrollX = uiStore.cameraPosition.x
    camera.scrollY = uiStore.cameraPosition.y
    camera.zoom = uiStore.cameraZoom
    
    // Listen for camera changes
    const updateCamera = () => {
      uiStore.updateCamera(
        { x: camera.scrollX, y: camera.scrollY },
        camera.zoom
      )
    }
    
    camera.on('followupdate', updateCamera)
    
    return () => {
      camera.off('followupdate', updateCamera)
    }
  }, [game, uiStore.cameraPosition, uiStore.cameraZoom])
}
```

## Performance Optimization

### 1. Object Pooling

```typescript
export class ObjectPool<T extends Phaser.GameObjects.GameObject> {
  private pool: T[] = []
  private createFn: () => T
  
  constructor(createFn: () => T, initialSize: number = 10) {
    this.createFn = createFn
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = createFn()
      obj.setActive(false).setVisible(false)
      this.pool.push(obj)
    }
  }
  
  acquire(): T {
    let obj = this.pool.find(o => !o.active)
    
    if (!obj) {
      obj = this.createFn()
    }
    
    obj.setActive(true).setVisible(true)
    return obj
  }
  
  release(obj: T) {
    obj.setActive(false).setVisible(false)
    
    if (!this.pool.includes(obj)) {
      this.pool.push(obj)
    }
  }
}
```

### 2. Culling and LOD

```typescript
export class CullingSystem {
  private scene: Phaser.Scene
  private camera: Phaser.Cameras.Scene2D.Camera
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.camera = scene.cameras.main
  }
  
  cullObjects(objects: Phaser.GameObjects.GameObject[]) {
    const bounds = this.camera.getBounds()
    
    objects.forEach(obj => {
      if (obj instanceof Phaser.GameObjects.Sprite) {
        const inView = Phaser.Geom.Rectangle.Overlaps(
          bounds,
          obj.getBounds()
        )
        
        obj.setVisible(inView)
        
        // LOD based on zoom
        if (inView) {
          const lod = this.camera.zoom < 0.75 ? 'low' : 
                     this.camera.zoom < 1.5 ? 'medium' : 'high'
          
          this.updateLOD(obj, lod)
        }
      }
    })
  }
  
  private updateLOD(obj: Phaser.GameObjects.Sprite, lod: string) {
    // Update texture or detail level based on LOD
    const baseTexture = obj.getData('baseTexture')
    if (baseTexture) {
      obj.setTexture(`${baseTexture}-${lod}`)
    }
  }
}
```

### 3. Batch Rendering

```typescript
export class BatchRenderer {
  private scene: Phaser.Scene
  private renderTexture: Phaser.GameObjects.RenderTexture
  
  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene
    this.renderTexture = scene.add.renderTexture(0, 0, width, height)
  }
  
  batchDraw(objects: Phaser.GameObjects.GameObject[]) {
    this.renderTexture.clear()
    
    // Sort by texture to minimize state changes
    const sorted = objects.sort((a, b) => {
      const texA = (a as any).texture?.key || ''
      const texB = (b as any).texture?.key || ''
      return texA.localeCompare(texB)
    })
    
    // Draw all objects to render texture
    sorted.forEach(obj => {
      this.renderTexture.draw(obj)
    })
  }
}
```

## Custom Plugins

### Isometric Plugin (`/lib/phaser/plugins/IsometricPlugin.ts`)

```typescript
export class IsometricPlugin {
  private scene: Phaser.Scene
  private tileWidth: number = 64
  private tileHeight: number = 32
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  cartesianToIsometric(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - y) * (this.tileWidth / 2),
      y: (x + y) * (this.tileHeight / 2)
    }
  }
  
  isometricToCartesian(x: number, y: number): { x: number; y: number } {
    const tileX = x / (this.tileWidth / 2)
    const tileY = y / (this.tileHeight / 2)
    
    return {
      x: (tileX + tileY) / 2,
      y: (tileY - tileX) / 2
    }
  }
  
  getTileAt(worldX: number, worldY: number): { x: number; y: number } {
    const cart = this.isometricToCartesian(worldX, worldY)
    return {
      x: Math.floor(cart.x / this.tileWidth),
      y: Math.floor(cart.y / this.tileHeight)
    }
  }
  
  snapToGrid(worldX: number, worldY: number): { x: number; y: number } {
    const tile = this.getTileAt(worldX, worldY)
    return this.cartesianToIsometric(
      tile.x * this.tileWidth,
      tile.y * this.tileHeight
    )
  }
}
```

## Testing Phaser Integration

### Unit Tests

```typescript
import { IsometricPlugin } from '@/lib/phaser/plugins/IsometricPlugin'

describe('IsometricPlugin', () => {
  let plugin: IsometricPlugin
  let mockScene: any
  
  beforeEach(() => {
    mockScene = {
      add: jest.fn(),
      cameras: { main: {} }
    }
    plugin = new IsometricPlugin(mockScene)
  })
  
  it('converts cartesian to isometric coordinates', () => {
    const iso = plugin.cartesianToIsometric(64, 64)
    expect(iso.x).toBe(0)
    expect(iso.y).toBe(64)
  })
  
  it('converts isometric to cartesian coordinates', () => {
    const cart = plugin.isometricToCartesian(0, 64)
    expect(cart.x).toBe(64)
    expect(cart.y).toBe(64)
  })
  
  it('snaps coordinates to grid', () => {
    const snapped = plugin.snapToGrid(35, 40)
    expect(snapped.x).toBe(32)
    expect(snapped.y).toBe(32)
  })
})
```

### Integration Tests

```typescript
import { render, waitFor } from '@testing-library/react'
import { GameCanvas } from '@/components/game/GameCanvas'

describe('GameCanvas Integration', () => {
  it('initializes Phaser game', async () => {
    const onReady = jest.fn()
    
    render(<GameCanvas onReady={onReady} />)
    
    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: expect.any(Object),
          events: expect.any(Object)
        })
      )
    })
  })
  
  it('responds to state changes', async () => {
    const { rerender } = render(<GameCanvas />)
    
    // Update game state
    useGameStore.setState({
      assets: [{ id: '1', type: 'ship', position: { x: 100, y: 100 } }]
    })
    
    rerender(<GameCanvas />)
    
    // Verify Phaser scene updated
    await waitFor(() => {
      const game = (window as any).game
      const scene = game?.scene.getScene('WorldMapScene')
      expect(scene?.assetManager.getAsset('1')).toBeDefined()
    })
  })
})
```

## Best Practices

1. **Scene Management**: Keep scenes focused and modular
2. **Asset Loading**: Use texture atlases for better performance
3. **Object Pooling**: Reuse game objects to reduce GC pressure
4. **Event System**: Use Phaser's event system for decoupling
5. **State Sync**: Keep React as source of truth, Phaser as renderer
6. **Performance**: Profile regularly with Phaser's debug tools
7. **Mobile**: Test touch controls and performance on devices
8. **Memory**: Clean up properly in destroy methods
9. **Animations**: Use Phaser's animation system for smooth motion
10. **Physics**: Only enable physics for objects that need it

## Troubleshooting

### Common Issues

1. **Black Screen**: Check asset paths and loading errors
2. **Performance**: Enable WebGL, check texture sizes
3. **Memory Leaks**: Ensure proper cleanup in destroy methods
4. **State Sync**: Verify bridge is updating correctly
5. **Input Issues**: Check interactive areas and depth sorting

### Debug Tools

```typescript
// Enable debug mode
const config = {
  physics: {
    arcade: {
      debug: true
    }
  },
  render: {
    showDebug: true,
    showFPS: true
  }
}

// Custom debug overlay
export class DebugOverlay extends Phaser.Scene {
  create() {
    this.add.text(10, 10, '', { color: '#00ff00' })
      .setScrollFactor(0)
      .setDepth(Number.MAX_SAFE_INTEGER)
  }
  
  update() {
    const text = this.children.list[0] as Phaser.GameObjects.Text
    text.setText([
      `FPS: ${this.game.loop.actualFps.toFixed(2)}`,
      `Objects: ${this.children.list.length}`,
      `Camera: ${this.cameras.main.scrollX.toFixed(0)}, ${this.cameras.main.scrollY.toFixed(0)}`,
      `Zoom: ${this.cameras.main.zoom.toFixed(2)}`
    ])
  }
}
```