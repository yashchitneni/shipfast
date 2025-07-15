# State Management Documentation

## Overview

Flexport uses Zustand for state management, providing a lightweight, TypeScript-friendly solution that bridges React UI components with the Phaser.js game engine. This document outlines our state architecture, patterns, and best practices.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│            Supabase Backend                 │
│        (Source of Truth)                    │
└─────────────────┬───────────────────────────┘
                  │ Real-time Updates
┌─────────────────▼───────────────────────────┐
│           Zustand Stores                    │
│  (Client-side State Management)             │
├─────────────────────────────────────────────┤
│ • GameStore    • MarketStore               │
│ • UIStore      • AIStore                   │
│ • RouteStore   • EventStore                │
└─────┬───────────────────────────┬───────────┘
      │                           │
┌─────▼─────────┐         ┌──────▼──────────┐
│  React UI     │         │  Phaser Game    │
│  Components    │         │    Engine       │
└───────────────┘         └─────────────────┘
```

## Core Stores

### 1. GameStore (`/lib/store/gameStore.ts`)

Manages core game state including player data, assets, and routes.

```typescript
interface GameState {
  // Player data
  playerId: string | null
  cash: number
  reputation: number
  gameQuarter: number
  gameYear: number
  
  // Assets
  assets: Asset[]
  selectedAssetId: string | null
  
  // Routes
  routes: Route[]
  selectedRouteId: string | null
  
  // Actions
  initialize: (playerId: string) => Promise<void>
  updateCash: (amount: number) => void
  purchaseAsset: (asset: AssetPurchase) => Promise<Asset>
  sellAsset: (assetId: string) => Promise<void>
  selectAsset: (assetId: string | null) => void
  createRoute: (route: RouteCreation) => Promise<Route>
  deleteRoute: (routeId: string) => Promise<void>
  assignAssetToRoute: (assetId: string, routeId: string) => Promise<void>
  
  // Subscriptions
  subscribeToUpdates: () => () => void
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        playerId: null,
        cash: 0,
        reputation: 50,
        gameQuarter: 1,
        gameYear: 2025,
        assets: [],
        selectedAssetId: null,
        routes: [],
        selectedRouteId: null,

        // Initialize game state from Supabase
        initialize: async (playerId) => {
          const gameState = await fetchGameState(playerId)
          set({
            playerId,
            cash: gameState.cash,
            reputation: gameState.reputation,
            gameQuarter: gameState.gameQuarter,
            gameYear: gameState.gameYear,
            assets: gameState.assets,
            routes: gameState.routes,
          })
        },

        // Update cash with validation
        updateCash: (amount) => {
          set((state) => ({
            cash: Math.max(0, state.cash + amount)
          }))
        },

        // Purchase asset with backend sync
        purchaseAsset: async (purchase) => {
          const { cash } = get()
          if (cash < purchase.price) {
            throw new Error('Insufficient funds')
          }

          const asset = await createAsset(purchase)
          set((state) => ({
            assets: [...state.assets, asset],
            cash: state.cash - purchase.price
          }))
          
          return asset
        },

        // Other actions...
      }),
      {
        name: 'game-storage',
        partialize: (state) => ({
          playerId: state.playerId,
          selectedAssetId: state.selectedAssetId,
          selectedRouteId: state.selectedRouteId,
        })
      }
    )
  )
)
```

### 2. UIStore (`/lib/store/uiStore.ts`)

Manages UI state including panels, modals, and user preferences.

```typescript
interface UIState {
  // Panels
  isPanelOpen: Record<PanelType, boolean>
  activeTool: ToolType | null
  
  // Modals
  activeModal: ModalType | null
  modalData: any
  
  // Camera
  cameraPosition: { x: number; y: number }
  cameraZoom: number
  
  // Preferences
  soundEnabled: boolean
  musicEnabled: boolean
  showTutorial: boolean
  theme: 'light' | 'dark'
  
  // Actions
  togglePanel: (panel: PanelType) => void
  openModal: (modal: ModalType, data?: any) => void
  closeModal: () => void
  setActiveTool: (tool: ToolType | null) => void
  updateCamera: (position: { x: number; y: number }, zoom: number) => void
  toggleSound: () => void
  toggleMusic: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      isPanelOpen: {
        market: true,
        assets: true,
        routes: false,
        ai: false,
        settings: false,
      },
      activeTool: null,
      activeModal: null,
      modalData: null,
      cameraPosition: { x: 0, y: 0 },
      cameraZoom: 1,
      soundEnabled: true,
      musicEnabled: true,
      showTutorial: true,
      theme: 'dark',

      // Toggle panel visibility
      togglePanel: (panel) => {
        set((state) => ({
          isPanelOpen: {
            ...state.isPanelOpen,
            [panel]: !state.isPanelOpen[panel]
          }
        }))
      },

      // Modal management
      openModal: (modal, data) => {
        set({ activeModal: modal, modalData: data })
      },

      closeModal: () => {
        set({ activeModal: null, modalData: null })
      },

      // Other actions...
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        isPanelOpen: state.isPanelOpen,
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        theme: state.theme,
      })
    }
  )
)
```

### 3. MarketStore (`/lib/store/marketStore.ts`)

Manages market data, prices, and trading operations.

```typescript
interface MarketState {
  // Prices
  prices: Record<GoodsType, MarketPrice>
  priceHistory: Record<GoodsType, PricePoint[]>
  
  // Orders
  activeOrders: Order[]
  orderHistory: Order[]
  
  // Auctions
  activeAuctions: Auction[]
  myBids: Bid[]
  
  // Actions
  updatePrices: (prices: MarketPrice[]) => void
  placeOrder: (order: OrderRequest) => Promise<Order>
  cancelOrder: (orderId: string) => Promise<void>
  placeBid: (auctionId: string, amount: number) => Promise<Bid>
  
  // Subscriptions
  subscribeToMarket: () => () => void
}

export const useMarketStore = create<MarketState>()((set, get) => ({
  // Initial state
  prices: {},
  priceHistory: {},
  activeOrders: [],
  orderHistory: [],
  activeAuctions: [],
  myBids: [],

  // Update prices from real-time feed
  updatePrices: (newPrices) => {
    set((state) => {
      const updatedPrices = { ...state.prices }
      const updatedHistory = { ...state.priceHistory }

      newPrices.forEach((price) => {
        updatedPrices[price.goodsType] = price
        
        // Update history
        if (!updatedHistory[price.goodsType]) {
          updatedHistory[price.goodsType] = []
        }
        updatedHistory[price.goodsType].push({
          price: price.currentPrice,
          timestamp: Date.now()
        })
        
        // Keep only last 100 points
        if (updatedHistory[price.goodsType].length > 100) {
          updatedHistory[price.goodsType].shift()
        }
      })

      return { prices: updatedPrices, priceHistory: updatedHistory }
    })
  },

  // Place market order
  placeOrder: async (orderRequest) => {
    const order = await createMarketOrder(orderRequest)
    set((state) => ({
      activeOrders: [...state.activeOrders, order]
    }))
    return order
  },

  // Subscribe to real-time market updates
  subscribeToMarket: () => {
    const channel = supabase
      .channel('market-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'market_prices' },
        (payload) => {
          get().updatePrices([payload.new as MarketPrice])
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'auctions' },
        (payload) => {
          set((state) => ({
            activeAuctions: [...state.activeAuctions, payload.new as Auction]
          }))
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }
}))
```

### 4. RouteStore (`/lib/store/routeStore.ts`)

Manages route creation, editing, and optimization.

```typescript
interface RouteState {
  // Building
  isBuilding: boolean
  buildingRoute: Partial<Route> | null
  selectedPorts: string[]
  
  // Validation
  routeValidation: ValidationResult | null
  profitEstimate: ProfitEstimate | null
  
  // Actions
  startBuilding: () => void
  cancelBuilding: () => void
  selectPort: (portId: string) => void
  removePort: (portId: string) => void
  validateRoute: () => Promise<ValidationResult>
  estimateProfit: () => Promise<ProfitEstimate>
  saveRoute: () => Promise<Route>
}

export const useRouteStore = create<RouteState>()((set, get) => ({
  // Initial state
  isBuilding: false,
  buildingRoute: null,
  selectedPorts: [],
  routeValidation: null,
  profitEstimate: null,

  // Start route building mode
  startBuilding: () => {
    set({
      isBuilding: true,
      buildingRoute: {},
      selectedPorts: [],
      routeValidation: null,
      profitEstimate: null
    })
  },

  // Select port for route
  selectPort: (portId) => {
    set((state) => {
      const ports = [...state.selectedPorts, portId]
      
      // Auto-validate when we have origin and destination
      if (ports.length >= 2) {
        setTimeout(() => get().validateRoute(), 0)
      }
      
      return { selectedPorts: ports }
    })
  },

  // Validate current route
  validateRoute: async () => {
    const { selectedPorts } = get()
    if (selectedPorts.length < 2) return null

    const validation = await validateRouteAPI({
      originId: selectedPorts[0],
      destinationId: selectedPorts[selectedPorts.length - 1],
      waypoints: selectedPorts.slice(1, -1)
    })

    set({ routeValidation: validation })
    
    if (validation.isValid) {
      get().estimateProfit()
    }
    
    return validation
  },

  // Other actions...
}))
```

### 5. AIStore (`/lib/store/aiStore.ts`)

Manages AI companion state and interactions.

```typescript
interface AIState {
  // Companion
  companion: AICompanion | null
  isThinking: boolean
  
  // Suggestions
  activeSuggestions: Suggestion[]
  suggestionHistory: Suggestion[]
  
  // Training
  trainingQueue: TrainingData[]
  learningProgress: number
  
  // Actions
  initialize: (gameStateId: string) => Promise<void>
  requestSuggestion: (context: SuggestionContext) => Promise<Suggestion[]>
  trainFromOutcome: (outcome: OutcomeData) => Promise<void>
  acceptSuggestion: (suggestionId: string) => Promise<void>
  dismissSuggestion: (suggestionId: string) => void
}

export const useAIStore = create<AIState>()((set, get) => ({
  // Initial state
  companion: null,
  isThinking: false,
  activeSuggestions: [],
  suggestionHistory: [],
  trainingQueue: [],
  learningProgress: 0,

  // Initialize AI companion
  initialize: async (gameStateId) => {
    const companion = await fetchAICompanion(gameStateId)
    set({ companion })
  },

  // Request AI suggestions
  requestSuggestion: async (context) => {
    set({ isThinking: true })
    
    try {
      const suggestions = await getAISuggestions(context)
      set((state) => ({
        activeSuggestions: suggestions,
        suggestionHistory: [...state.suggestionHistory, ...suggestions],
        isThinking: false
      }))
      return suggestions
    } catch (error) {
      set({ isThinking: false })
      throw error
    }
  },

  // Train AI from game outcomes
  trainFromOutcome: async (outcome) => {
    set((state) => ({
      trainingQueue: [...state.trainingQueue, outcome]
    }))
    
    // Process training in batches
    const { trainingQueue } = get()
    if (trainingQueue.length >= 5) {
      await processTrainingBatch(trainingQueue)
      set({ trainingQueue: [], learningProgress: get().learningProgress + 1 })
    }
  }
}))
```

## State Synchronization

### React to Phaser Bridge

```typescript
// Bridge hook for syncing state between React and Phaser
export function useGameBridge(game: Phaser.Game | null) {
  const gameState = useGameStore()
  const uiState = useUIStore()
  
  // Sync game state to Phaser
  useEffect(() => {
    if (!game) return
    
    const scene = game.scene.getScene('WorldMap') as WorldMapScene
    if (!scene) return
    
    // Update Phaser with new assets
    scene.updateAssets(gameState.assets)
    
    // Update routes
    scene.updateRoutes(gameState.routes)
    
    // Update selection
    scene.setSelectedAsset(gameState.selectedAssetId)
    
  }, [game, gameState.assets, gameState.routes, gameState.selectedAssetId])
  
  // Listen to Phaser events
  useEffect(() => {
    if (!game) return
    
    const handleAssetClick = (assetId: string) => {
      gameState.selectAsset(assetId)
    }
    
    const handleMapClick = (position: { x: number; y: number }) => {
      if (uiState.activeTool === 'place-asset') {
        // Handle asset placement
      }
    }
    
    game.events.on('assetClicked', handleAssetClick)
    game.events.on('mapClicked', handleMapClick)
    
    return () => {
      game.events.off('assetClicked', handleAssetClick)
      game.events.off('mapClicked', handleMapClick)
    }
  }, [game, uiState.activeTool])
}
```

### Supabase Real-time Integration

```typescript
// Hook for real-time subscriptions
export function useRealtimeSubscriptions() {
  const marketStore = useMarketStore()
  const gameStore = useGameStore()
  
  useEffect(() => {
    // Subscribe to market updates
    const unsubMarket = marketStore.subscribeToMarket()
    
    // Subscribe to game state updates
    const unsubGame = gameStore.subscribeToUpdates()
    
    return () => {
      unsubMarket()
      unsubGame()
    }
  }, [])
}
```

## Patterns and Best Practices

### 1. Selectors for Derived State

```typescript
// Create selectors for computed values
export const gameSelectors = {
  getTotalAssetValue: (state: GameState) => 
    state.assets.reduce((sum, asset) => sum + asset.value, 0),
    
  getActiveRoutes: (state: GameState) =>
    state.routes.filter(route => route.isActive),
    
  getAssetsByType: (state: GameState, type: AssetType) =>
    state.assets.filter(asset => asset.type === type),
    
  getNetWorth: (state: GameState) =>
    state.cash + gameSelectors.getTotalAssetValue(state)
}

// Usage in components
export function NetWorthDisplay() {
  const netWorth = useGameStore(gameSelectors.getNetWorth)
  return <div>Net Worth: ${netWorth}</div>
}
```

### 2. Middleware for Logging

```typescript
// Development logging middleware
const logger = (config: StateCreator<any>) => (set: any, get: any, api: any) =>
  config(
    (args: any) => {
      console.log('Previous state:', get())
      set(args)
      console.log('New state:', get())
    },
    get,
    api
  )

// Apply in development
export const useGameStore = create<GameState>()(
  process.env.NODE_ENV === 'development' ? logger(storeConfig) : storeConfig
)
```

### 3. Optimistic Updates

```typescript
// Optimistic update pattern
purchaseAsset: async (purchase) => {
  const tempId = `temp-${Date.now()}`
  
  // Optimistically add asset
  set((state) => ({
    assets: [...state.assets, { ...purchase, id: tempId, status: 'pending' }],
    cash: state.cash - purchase.price
  }))
  
  try {
    const asset = await createAsset(purchase)
    
    // Replace temp asset with real one
    set((state) => ({
      assets: state.assets.map(a => a.id === tempId ? asset : a)
    }))
    
    return asset
  } catch (error) {
    // Revert on error
    set((state) => ({
      assets: state.assets.filter(a => a.id !== tempId),
      cash: state.cash + purchase.price
    }))
    throw error
  }
}
```

### 4. Atomic Updates

```typescript
// Ensure atomic updates for related state
transferAssetToRoute: (assetId: string, fromRouteId: string, toRouteId: string) => {
  set((state) => ({
    routes: state.routes.map(route => {
      if (route.id === fromRouteId) {
        return {
          ...route,
          assignedAssets: route.assignedAssets.filter(id => id !== assetId)
        }
      }
      if (route.id === toRouteId) {
        return {
          ...route,
          assignedAssets: [...route.assignedAssets, assetId]
        }
      }
      return route
    }),
    assets: state.assets.map(asset =>
      asset.id === assetId ? { ...asset, assignedRouteId: toRouteId } : asset
    )
  }))
}
```

### 5. Subscription Management

```typescript
// Proper subscription cleanup
export function useAutoSave() {
  const gameState = useGameStore()
  
  useEffect(() => {
    const interval = setInterval(() => {
      saveGameState(gameState)
    }, 30000) // Auto-save every 30 seconds
    
    // Save on unmount
    return () => {
      clearInterval(interval)
      saveGameState(gameState)
    }
  }, [])
}
```

## Performance Optimization

### 1. Selective Subscriptions

```typescript
// Subscribe only to specific state slices
export function CashDisplay() {
  // Only re-render when cash changes
  const cash = useGameStore((state) => state.cash)
  return <div>${cash}</div>
}

// Multiple selectors with shallow equality
export function AssetSummary() {
  const { totalAssets, totalValue } = useGameStore(
    (state) => ({
      totalAssets: state.assets.length,
      totalValue: state.assets.reduce((sum, a) => sum + a.value, 0)
    }),
    shallow // Shallow equality check
  )
  
  return (
    <div>
      Assets: {totalAssets} | Value: ${totalValue}
    </div>
  )
}
```

### 2. Memoized Selectors

```typescript
// Use memoization for expensive computations
const getOptimalRoutes = createSelector(
  [(state: GameState) => state.routes, (state: GameState) => state.assets],
  (routes, assets) => {
    // Expensive optimization calculation
    return calculateOptimalRoutes(routes, assets)
  }
)
```

### 3. Batched Updates

```typescript
// Batch multiple state updates
const batchedUpdate = unstable_batchedUpdates || ((fn: Function) => fn())

export function processMarketTick(updates: MarketUpdate[]) {
  batchedUpdate(() => {
    updates.forEach(update => {
      marketStore.getState().updatePrice(update)
    })
  })
}
```

## Testing State Management

### Unit Tests

```typescript
// Test store actions
describe('GameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      cash: 50000,
      assets: [],
      routes: []
    })
  })
  
  it('purchases asset when sufficient funds', async () => {
    const purchase = {
      type: 'ship',
      price: 10000,
      name: 'Test Ship'
    }
    
    await useGameStore.getState().purchaseAsset(purchase)
    
    expect(useGameStore.getState().cash).toBe(40000)
    expect(useGameStore.getState().assets).toHaveLength(1)
  })
  
  it('rejects purchase when insufficient funds', async () => {
    const purchase = {
      type: 'ship',
      price: 60000,
      name: 'Expensive Ship'
    }
    
    await expect(
      useGameStore.getState().purchaseAsset(purchase)
    ).rejects.toThrow('Insufficient funds')
  })
})
```

### Integration Tests

```typescript
// Test store interactions
describe('Store Integration', () => {
  it('updates UI when game state changes', async () => {
    const { result } = renderHook(() => ({
      game: useGameStore(),
      ui: useUIStore()
    }))
    
    // Select asset in game store
    act(() => {
      result.current.game.selectAsset('asset-1')
    })
    
    // UI should reflect selection
    expect(result.current.ui.activeModal).toBe('asset-details')
  })
})
```

## Migration Guide

### From Redux to Zustand

```typescript
// Redux pattern
const mapStateToProps = (state) => ({
  cash: state.game.cash,
  assets: state.game.assets
})

const mapDispatchToProps = {
  updateCash,
  purchaseAsset
}

// Zustand equivalent
export function Component() {
  const cash = useGameStore((state) => state.cash)
  const assets = useGameStore((state) => state.assets)
  const updateCash = useGameStore((state) => state.updateCash)
  const purchaseAsset = useGameStore((state) => state.purchaseAsset)
  
  // Component logic
}
```

## Debugging Tools

### Zustand DevTools

```typescript
// Enable Redux DevTools
import { devtools } from 'zustand/middleware'

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      // Store implementation
    }),
    {
      name: 'game-store',
    }
  )
)
```

### State Inspector

```typescript
// Development-only state inspector
if (process.env.NODE_ENV === 'development') {
  window.inspectState = () => ({
    game: useGameStore.getState(),
    ui: useUIStore.getState(),
    market: useMarketStore.getState(),
    ai: useAIStore.getState(),
  })
}
```

## Best Practices Summary

1. **Keep stores focused** - One store per domain
2. **Use TypeScript** - Full type safety
3. **Normalize data** - Avoid deeply nested state
4. **Use selectors** - Derive computed values
5. **Handle async properly** - Loading states and error handling
6. **Optimize subscriptions** - Subscribe only to what you need
7. **Test thoroughly** - Unit and integration tests
8. **Document actions** - Clear naming and comments
9. **Use middleware wisely** - Only when needed
10. **Monitor performance** - React DevTools Profiler