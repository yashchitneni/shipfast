# Component Architecture Documentation

## Overview

Flexport's frontend is built with a hybrid architecture combining React/Next.js for UI components and Phaser.js for game rendering. This document outlines the component structure, patterns, and best practices.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│          Next.js App Router Layer           │
│         (Pages, Layouts, Routing)           │
├─────────────────────────────────────────────┤
│            React UI Layer                   │
│    (Dashboards, Panels, Controls)          │
├─────────────────────────────────────────────┤
│         State Management Layer              │
│           (Zustand Stores)                  │
├─────────────────────────────────────────────┤
│          Phaser Game Layer                  │
│    (Game Canvas, Sprites, Physics)         │
├─────────────────────────────────────────────┤
│           Supabase Layer                    │
│    (Database, Realtime, Auth)              │
└─────────────────────────────────────────────┘
```

## Component Structure

### 1. Page Components (`/app`)

#### Main Game Page (`/app/page.tsx`)
```typescript
// The main game container that combines UI and Phaser canvas
export default function GamePage() {
  return (
    <GameLayout>
      <GameCanvas />
      <UIOverlay />
    </GameLayout>
  )
}
```

#### Layout Components (`/app/layout.tsx`)
```typescript
// Root layout with providers and global setup
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 2. Game Components (`/components/game`)

#### GameCanvas Component
Integrates Phaser.js with React lifecycle.

```typescript
interface GameCanvasProps {
  onGameReady?: (game: Phaser.Game) => void
  config?: Partial<Phaser.Types.Core.GameConfig>
}

export function GameCanvas({ onGameReady, config }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize Phaser game
    // Connect to Zustand stores
    // Set up event listeners
  }, [])

  return <div ref={containerRef} className="game-canvas" />
}
```

#### WorldMap Component
Manages the isometric map rendering.

```typescript
export class WorldMapScene extends Phaser.Scene {
  private mapData: MapData
  private assetManager: AssetManager
  private routeRenderer: RouteRenderer

  preload() {
    // Load sprites, tiles, and assets
  }

  create() {
    // Set up isometric map
    // Initialize camera controls
    // Create port nodes
    // Set up interaction handlers
  }

  update(time: number, delta: number) {
    // Update animations
    // Handle camera movement
    // Process route animations
  }
}
```

#### AssetSprite Component
Represents game assets on the map.

```typescript
export class AssetSprite extends Phaser.GameObjects.Sprite {
  private assetData: Asset
  private healthBar: HealthBar
  
  constructor(scene: Phaser.Scene, x: number, y: number, asset: Asset) {
    super(scene, x, y, asset.spriteKey)
    // Set up sprite properties
    // Add animations
    // Create health indicator
  }

  updatePosition(x: number, y: number, duration: number) {
    // Animate movement
  }

  setStatus(status: AssetStatus) {
    // Update visual state
  }
}
```

### 3. UI Components (`/components/ui`)

#### Dashboard Components

```typescript
// Market Dashboard
export function MarketDashboard() {
  const { prices, trends } = useMarketStore()
  
  return (
    <Panel title="Global Market">
      <PriceChart data={prices} />
      <TrendIndicators trends={trends} />
      <MarketActions />
    </Panel>
  )
}

// Asset Management Panel
export function AssetPanel() {
  const { assets, selectedAsset } = useGameStore()
  
  return (
    <Panel title="Assets">
      <AssetList assets={assets} />
      <AssetDetails asset={selectedAsset} />
      <AssetActions />
    </Panel>
  )
}

// Route Builder
export function RouteBuilder() {
  const { isBuilding, currentRoute } = useRouteStore()
  
  return (
    <Panel title="Route Builder" collapsible>
      <RouteMap />
      <RouteStats route={currentRoute} />
      <RouteActions />
    </Panel>
  )
}
```

#### Control Components

```typescript
// Game Speed Control
export function SpeedControl() {
  const { speed, setSpeed, isPaused, togglePause } = useTimeStore()
  
  return (
    <div className="speed-control">
      <Button onClick={togglePause}>
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </Button>
      <Slider 
        value={speed} 
        onChange={setSpeed}
        min={0.5}
        max={3}
        step={0.5}
      />
    </div>
  )
}

// Cash Display
export function CashDisplay() {
  const cash = useGameStore((state) => state.cash)
  
  return (
    <div className="cash-display">
      <CashIcon />
      <AnimatedNumber value={cash} format="currency" />
    </div>
  )
}
```

#### Modal Components

```typescript
// Purchase Modal
export function PurchaseModal({ asset, onConfirm, onCancel }: PurchaseModalProps) {
  const cash = useGameStore((state) => state.cash)
  const canAfford = cash >= asset.price
  
  return (
    <Modal title="Confirm Purchase" onClose={onCancel}>
      <AssetPreview asset={asset} />
      <PriceBreakdown asset={asset} />
      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={() => onConfirm(asset)}
          disabled={!canAfford}
        >
          Purchase ${asset.price}
        </Button>
      </div>
    </Modal>
  )
}
```

### 4. Layout Components (`/components/layouts`)

#### Game Layout
Main game container with responsive design.

```typescript
export function GameLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  return (
    <div className="game-layout">
      <TopBar />
      <div className="game-content">
        <Sidebar open={sidebarOpen} onToggle={setSidebarOpen} />
        <main className="game-main">
          {children}
        </main>
      </div>
      <BottomBar />
    </div>
  )
}
```

## Component Patterns

### 1. Container/Presenter Pattern

Separate logic from presentation:

```typescript
// Container (handles logic)
export function AssetListContainer() {
  const assets = useGameStore((state) => state.assets)
  const selectedId = useGameStore((state) => state.selectedAssetId)
  const selectAsset = useGameStore((state) => state.selectAsset)
  
  return (
    <AssetListView
      assets={assets}
      selectedId={selectedId}
      onSelect={selectAsset}
    />
  )
}

// Presenter (pure UI)
export function AssetListView({ assets, selectedId, onSelect }: AssetListViewProps) {
  return (
    <ul className="asset-list">
      {assets.map((asset) => (
        <AssetListItem
          key={asset.id}
          asset={asset}
          isSelected={asset.id === selectedId}
          onClick={() => onSelect(asset.id)}
        />
      ))}
    </ul>
  )
}
```

### 2. Compound Components

Group related components:

```typescript
export const Panel = {
  Root: PanelRoot,
  Header: PanelHeader,
  Body: PanelBody,
  Footer: PanelFooter,
}

// Usage
<Panel.Root>
  <Panel.Header title="Market Overview" />
  <Panel.Body>
    <MarketContent />
  </Panel.Body>
  <Panel.Footer>
    <MarketActions />
  </Panel.Footer>
</Panel.Root>
```

### 3. Render Props Pattern

For flexible rendering:

```typescript
export function DataTable<T>({ 
  data, 
  columns, 
  renderRow 
}: DataTableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => renderRow(item, index))}
      </tbody>
    </table>
  )
}
```

## State Integration

### Connecting React to Phaser

```typescript
// Bridge between React state and Phaser
export function useGameBridge() {
  const gameInstance = useGameInstance()
  const gameState = useGameStore()
  
  // Sync state changes to Phaser
  useEffect(() => {
    if (gameInstance) {
      gameInstance.events.emit('stateUpdate', gameState)
    }
  }, [gameState, gameInstance])
  
  // Listen to Phaser events
  useEffect(() => {
    if (gameInstance) {
      gameInstance.events.on('assetClicked', (asset: Asset) => {
        gameState.selectAsset(asset.id)
      })
    }
  }, [gameInstance])
}
```

### Real-time Updates

```typescript
// Subscribe to Supabase real-time
export function useRealtimeMarket() {
  const updatePrices = useMarketStore((state) => state.updatePrices)
  
  useEffect(() => {
    const channel = supabase
      .channel('market-prices')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'market_prices' },
        (payload) => {
          updatePrices(payload.new)
        }
      )
      .subscribe()
      
    return () => {
      channel.unsubscribe()
    }
  }, [])
}
```

## Performance Optimization

### 1. Component Memoization

```typescript
// Memoize expensive components
export const AssetList = memo(function AssetList({ assets }: AssetListProps) {
  return (
    // Component implementation
  )
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.assets.length === nextProps.assets.length
})
```

### 2. Lazy Loading

```typescript
// Lazy load heavy components
const MarketAnalytics = lazy(() => import('./MarketAnalytics'))

export function AnalyticsPanel() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MarketAnalytics />
    </Suspense>
  )
}
```

### 3. Virtual Scrolling

```typescript
// Use virtual scrolling for large lists
import { VirtualList } from '@tanstack/react-virtual'

export function LargeAssetList({ assets }: { assets: Asset[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })
  
  return (
    <div ref={parentRef} className="asset-list-container">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <AssetListItem
            key={virtualItem.key}
            asset={assets[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

## Testing Strategy

### Unit Tests

```typescript
// Component testing with React Testing Library
describe('AssetPanel', () => {
  it('displays asset list', () => {
    const { getByText } = render(<AssetPanel />)
    expect(getByText('Assets')).toBeInTheDocument()
  })
  
  it('shows selected asset details', () => {
    const mockAsset = { id: '1', name: 'Pacific Runner' }
    useGameStore.setState({ selectedAsset: mockAsset })
    
    const { getByText } = render(<AssetPanel />)
    expect(getByText('Pacific Runner')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
// Test component interactions
describe('Route Builder Integration', () => {
  it('creates route when ports are selected', async () => {
    const { user } = renderWithProviders(<RouteBuilder />)
    
    await user.click(screen.getByText('Select Origin'))
    await user.click(screen.getByText('Los Angeles'))
    
    await user.click(screen.getByText('Select Destination'))
    await user.click(screen.getByText('Shanghai'))
    
    await user.click(screen.getByText('Create Route'))
    
    expect(screen.getByText('Route created successfully')).toBeInTheDocument()
  })
})
```

## Styling Guidelines

### Tailwind CSS Classes

```typescript
// Consistent styling patterns
export const styles = {
  panel: 'bg-gray-900 border border-gray-700 rounded-lg shadow-xl',
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded',
  },
  input: 'bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white',
}
```

### Component Styling

```typescript
// Use CSS modules for component-specific styles
import styles from './AssetCard.module.css'

export function AssetCard({ asset }: AssetCardProps) {
  return (
    <div className={styles.card}>
      <img src={asset.image} className={styles.image} />
      <div className={styles.content}>
        <h3 className={styles.title}>{asset.name}</h3>
        <p className={styles.stats}>
          Capacity: {asset.capacity}
        </p>
      </div>
    </div>
  )
}
```

## Accessibility

### ARIA Labels

```typescript
export function RouteMap() {
  return (
    <div 
      role="application"
      aria-label="Interactive route map"
      tabIndex={0}
    >
      {/* Map content */}
    </div>
  )
}
```

### Keyboard Navigation

```typescript
export function AssetGrid() {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        // Navigate to next asset
        break
      case 'Enter':
        // Select current asset
        break
    }
  }
  
  return (
    <div onKeyDown={handleKeyDown}>
      {/* Grid content */}
    </div>
  )
}
```

## Best Practices

1. **Keep components focused** - Single responsibility principle
2. **Use TypeScript** - Type safety prevents bugs
3. **Optimize renders** - Use memo, useMemo, useCallback appropriately
4. **Handle loading states** - Show skeletons or spinners
5. **Error boundaries** - Graceful error handling
6. **Responsive design** - Mobile-first approach
7. **Test coverage** - Unit and integration tests
8. **Documentation** - JSDoc comments for complex components
9. **Performance monitoring** - React DevTools profiler
10. **Accessibility** - WCAG 2.1 compliance