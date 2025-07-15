# Code Documentation Templates

## Overview

This document provides templates and examples for documenting code in the Flexport project. We use JSDoc for JavaScript and TSDoc for TypeScript to ensure consistent, high-quality documentation.

## TypeScript/TSDoc Templates

### 1. Interface Documentation

```typescript
/**
 * Represents a game asset (ship, plane, or warehouse) in the Flexport game.
 * 
 * @remarks
 * Assets are the core entities that players own and manage. Each asset
 * has a unique position on the map and can be assigned to routes.
 * 
 * @example
 * ```typescript
 * const ship: Asset = {
 *   id: 'ship-001',
 *   name: 'Pacific Runner',
 *   type: 'ship',
 *   subtype: 'container',
 *   position: { x: 100, y: 200 },
 *   stats: {
 *     capacity: 1000,
 *     speed: 25,
 *     efficiency: 0.85
 *   },
 *   health: 100,
 *   status: 'idle'
 * }
 * ```
 * 
 * @public
 */
export interface Asset {
  /** Unique identifier for the asset */
  id: string
  
  /** Display name of the asset */
  name: string
  
  /** Primary asset category */
  type: AssetType
  
  /** Specific variant within the asset type */
  subtype: string
  
  /** Current position on the game map */
  position: Position
  
  /** Asset performance statistics */
  stats: AssetStats
  
  /** Current health percentage (0-100) */
  health: number
  
  /** Current operational status */
  status: AssetStatus
  
  /** ID of the route this asset is assigned to */
  assignedRouteId?: string
  
  /** Custom metadata for special assets */
  metadata?: Record<string, unknown>
}
```

### 2. Class Documentation

```typescript
/**
 * Manages all game assets on the isometric map.
 * 
 * @remarks
 * The AssetManager is responsible for creating, updating, and removing
 * asset sprites on the Phaser game canvas. It maintains synchronization
 * between the React state and the Phaser rendering layer.
 * 
 * @example
 * ```typescript
 * const assetManager = new AssetManager(scene)
 * assetManager.updateAssets(gameStore.assets)
 * ```
 * 
 * @public
 */
export class AssetManager {
  /** Reference to the Phaser scene */
  private scene: Phaser.Scene
  
  /** Map of asset IDs to their sprite instances */
  private assets: Map<string, AssetSprite>
  
  /** Phaser group containing all asset sprites */
  private assetGroup: Phaser.GameObjects.Group
  
  /**
   * Creates a new AssetManager instance.
   * 
   * @param scene - The Phaser scene to manage assets in
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.assets = new Map()
    this.assetGroup = scene.add.group()
  }
  
  /**
   * Updates all assets to match the provided state.
   * 
   * @remarks
   * This method performs a diff between current and new assets,
   * creating new sprites, updating existing ones, and removing
   * obsolete ones.
   * 
   * @param assets - Array of assets from the game state
   * 
   * @example
   * ```typescript
   * // In React-Phaser bridge
   * useEffect(() => {
   *   assetManager.updateAssets(gameStore.assets)
   * }, [gameStore.assets])
   * ```
   */
  public updateAssets(assets: Asset[]): void {
    // Implementation
  }
  
  /**
   * Retrieves an asset sprite by its ID.
   * 
   * @param id - The unique identifier of the asset
   * @returns The asset sprite if found, undefined otherwise
   */
  public getAsset(id: string): AssetSprite | undefined {
    return this.assets.get(id)
  }
}
```

### 3. Function Documentation

```typescript
/**
 * Calculates the optimal shipping route between two ports.
 * 
 * @remarks
 * This function uses Dijkstra's algorithm to find the most profitable
 * route, considering distance, risk factors, and market conditions.
 * The calculation includes waypoints for risk mitigation.
 * 
 * @param origin - The starting port
 * @param destination - The target port
 * @param options - Optional configuration for route calculation
 * @returns A promise that resolves to the optimal route
 * 
 * @throws {@link InvalidPortError}
 * Thrown if either port is invalid or unreachable
 * 
 * @throws {@link NoRouteError}
 * Thrown if no valid route exists between the ports
 * 
 * @example
 * ```typescript
 * const route = await calculateOptimalRoute(
 *   { id: 'LAX', position: { x: 100, y: 200 } },
 *   { id: 'SHA', position: { x: 800, y: 600 } },
 *   { 
 *     avoidHighRisk: true,
 *     preferredCargoType: 'electronics' 
 *   }
 * )
 * ```
 * 
 * @beta
 */
export async function calculateOptimalRoute(
  origin: Port,
  destination: Port,
  options?: RouteCalculationOptions
): Promise<Route> {
  // Validate inputs
  if (!isValidPort(origin) || !isValidPort(destination)) {
    throw new InvalidPortError('Invalid port provided')
  }
  
  // Implementation
}
```

### 4. React Component Documentation

```typescript
/**
 * Props for the AssetCard component.
 * @public
 */
export interface AssetCardProps {
  /** The asset to display */
  asset: Asset
  
  /** Whether the card is currently selected */
  isSelected?: boolean
  
  /** Callback fired when the card is clicked */
  onClick?: (asset: Asset) => void
  
  /** Whether to show detailed stats */
  showDetails?: boolean
  
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays an asset card with interactive features.
 * 
 * @remarks
 * The AssetCard component shows asset information including
 * name, type, stats, and current status. It supports selection
 * and hover states for better interactivity.
 * 
 * @example
 * ```tsx
 * <AssetCard
 *   asset={ship}
 *   isSelected={selectedId === ship.id}
 *   onClick={handleAssetSelect}
 *   showDetails
 * />
 * ```
 * 
 * @param props - The component props
 * @returns A React element representing the asset card
 * 
 * @public
 */
export const AssetCard = memo(function AssetCard({
  asset,
  isSelected = false,
  onClick,
  showDetails = false,
  className
}: AssetCardProps) {
  // Component implementation
})
```

### 5. Hook Documentation

```typescript
/**
 * Custom hook for managing asset operations.
 * 
 * @remarks
 * This hook provides a unified interface for asset management,
 * including purchasing, selling, and upgrading assets. It handles
 * loading states, error management, and optimistic updates.
 * 
 * @returns An object containing asset data and operations
 * 
 * @example
 * ```typescript
 * function AssetPanel() {
 *   const {
 *     assets,
 *     loading,
 *     error,
 *     purchaseAsset,
 *     sellAsset,
 *     upgradeAsset
 *   } = useAssetManagement()
 *   
 *   if (loading) return <LoadingSpinner />
 *   if (error) return <ErrorMessage error={error} />
 *   
 *   return <AssetList assets={assets} />
 * }
 * ```
 * 
 * @public
 */
export function useAssetManagement() {
  const gameStore = useGameStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  /**
   * Purchases a new asset.
   * 
   * @param type - The type of asset to purchase
   * @param options - Purchase configuration
   * @returns A promise that resolves when the purchase is complete
   */
  const purchaseAsset = useCallback(async (
    type: AssetType,
    options?: PurchaseOptions
  ) => {
    // Implementation
  }, [gameStore])
  
  return {
    assets: gameStore.assets,
    loading,
    error,
    purchaseAsset,
    sellAsset: gameStore.sellAsset,
    upgradeAsset: gameStore.upgradeAsset
  }
}
```

### 6. Enum/Type Documentation

```typescript
/**
 * Represents the possible types of assets in the game.
 * 
 * @remarks
 * Each asset type has different characteristics:
 * - Ships: Maritime transport, affected by weather
 * - Planes: Air transport, fast but expensive
 * - Warehouses: Storage facilities at ports
 * 
 * @public
 */
export type AssetType = 'ship' | 'plane' | 'warehouse'

/**
 * Represents the operational status of an asset.
 * 
 * @public
 */
export enum AssetStatus {
  /** Asset is available for assignment */
  Idle = 'idle',
  
  /** Asset is currently traveling between ports */
  InTransit = 'in_transit',
  
  /** Asset is loading/unloading cargo */
  Loading = 'loading',
  
  /** Asset is undergoing repairs or upgrades */
  Maintenance = 'maintenance',
  
  /** Asset has been destroyed by an event */
  Destroyed = 'destroyed'
}
```

### 7. Store Documentation

```typescript
/**
 * Global game state store using Zustand.
 * 
 * @remarks
 * This store manages all core game state including player data,
 * assets, routes, and game progression. It provides actions for
 * state mutations and subscriptions for real-time updates.
 * 
 * @example
 * ```typescript
 * // In a React component
 * function GameUI() {
 *   const cash = useGameStore((state) => state.cash)
 *   const purchaseAsset = useGameStore((state) => state.purchaseAsset)
 *   
 *   return <div>Cash: ${cash}</div>
 * }
 * ```
 * 
 * @public
 */
interface GameState {
  // State documentation...
  
  /**
   * Purchases a new asset and adds it to the player's inventory.
   * 
   * @param purchase - The asset purchase details
   * @returns A promise that resolves to the created asset
   * 
   * @throws {@link InsufficientFundsError}
   * Thrown when the player doesn't have enough cash
   * 
   * @throws {@link InvalidPortError}
   * Thrown when the specified port is invalid
   */
  purchaseAsset: (purchase: AssetPurchase) => Promise<Asset>
}
```

## JSDoc Templates (for JavaScript)

### 1. Module Documentation

```javascript
/**
 * @fileoverview Utility functions for route calculations and optimizations.
 * @module utils/routes
 * @requires lodash
 * @requires @/lib/constants
 */

/**
 * Calculates the distance between two points using the Haversine formula.
 * 
 * @param {Object} point1 - The first point
 * @param {number} point1.x - X coordinate
 * @param {number} point1.y - Y coordinate
 * @param {Object} point2 - The second point
 * @param {number} point2.x - X coordinate
 * @param {number} point2.y - Y coordinate
 * @returns {number} The distance in game units
 * 
 * @example
 * const distance = calculateDistance(
 *   { x: 100, y: 200 },
 *   { x: 300, y: 400 }
 * )
 * console.log(distance) // 282.84
 */
export function calculateDistance(point1, point2) {
  // Implementation
}
```

### 2. Class Documentation (JavaScript)

```javascript
/**
 * Represents a shipping route in the game.
 * @class
 * @implements {Serializable}
 */
export class Route {
  /**
   * Creates a new Route instance.
   * @constructor
   * @param {string} id - Unique route identifier
   * @param {Port} origin - Starting port
   * @param {Port} destination - Ending port
   * @param {Port[]} [waypoints=[]] - Optional waypoints
   */
  constructor(id, origin, destination, waypoints = []) {
    /** @type {string} */
    this.id = id
    
    /** @type {Port} */
    this.origin = origin
    
    /** @type {Port} */
    this.destination = destination
    
    /** @type {Port[]} */
    this.waypoints = waypoints
  }
  
  /**
   * Calculates the total route distance.
   * @returns {number} Total distance in kilometers
   */
  calculateDistance() {
    // Implementation
  }
  
  /**
   * Serializes the route to JSON.
   * @returns {Object} JSON representation
   * @override
   */
  toJSON() {
    return {
      id: this.id,
      origin: this.origin.id,
      destination: this.destination.id,
      waypoints: this.waypoints.map(w => w.id)
    }
  }
}
```

## Documentation Best Practices

### 1. Be Descriptive

```typescript
// ❌ Bad
/**
 * Gets user.
 */
function getUser(id: string) { }

// ✅ Good
/**
 * Retrieves a user profile from the database by their unique ID.
 * 
 * @param id - The user's unique identifier (UUID format)
 * @returns A promise that resolves to the user profile
 * @throws {UserNotFoundError} When no user exists with the given ID
 */
async function getUser(id: string): Promise<UserProfile> { }
```

### 2. Include Examples

```typescript
/**
 * Formats currency values for display.
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR') // "€1,234.56"
 * formatCurrency(1234.5, 'USD', { decimals: 0 }) // "$1,235"
 * ```
 */
function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options?: FormatOptions
): string { }
```

### 3. Document Edge Cases

```typescript
/**
 * Parses a route configuration string.
 * 
 * @param config - Route configuration in format "ORIGIN-DEST:TYPE"
 * @returns Parsed route configuration
 * 
 * @remarks
 * - Returns null for invalid formats
 * - Trims whitespace from port codes
 * - Converts port codes to uppercase
 * - Defaults to 'sea' type if not specified
 * 
 * @example
 * ```typescript
 * parseRoute("LAX-SHA:air") // { origin: "LAX", dest: "SHA", type: "air" }
 * parseRoute("lax-sha") // { origin: "LAX", dest: "SHA", type: "sea" }
 * parseRoute("invalid") // null
 * ```
 */
function parseRoute(config: string): RouteConfig | null { }
```

### 4. Link Related Items

```typescript
/**
 * Asset management service.
 * 
 * @see {@link Asset} for the asset data structure
 * @see {@link AssetStore} for state management
 * @see {@link useAssetManagement} for the React hook interface
 */
export class AssetService {
  // Implementation
}
```

### 5. Document Deprecations

```typescript
/**
 * @deprecated Since version 2.0. Use {@link calculateOptimalRoute} instead.
 * This function will be removed in version 3.0.
 * 
 * @param start - Starting port
 * @param end - Ending port
 * @returns The calculated route
 */
export function calculateRoute(start: Port, end: Port): Route {
  console.warn('calculateRoute is deprecated. Use calculateOptimalRoute instead.')
  return calculateOptimalRoute(start, end)
}
```

## Generating Documentation

### TypeDoc (TypeScript)

```bash
# Install TypeDoc
npm install --save-dev typedoc typedoc-plugin-markdown

# Generate documentation
npx typedoc

# Watch mode for development
npx typedoc --watch
```

### JSDoc (JavaScript)

```bash
# Install JSDoc
npm install --save-dev jsdoc jsdoc-plugin-typescript

# Generate documentation
npx jsdoc -c jsdoc.config.json

# With custom template
npx jsdoc -c jsdoc.config.json -t ./node_modules/clean-jsdoc-theme
```

### Package Scripts

```json
{
  "scripts": {
    "docs:generate": "typedoc",
    "docs:watch": "typedoc --watch",
    "docs:serve": "serve ./docs/api",
    "docs:validate": "typedoc --validation.notDocumented"
  }
}
```

## VS Code Snippets

Add these to `.vscode/typescript.json.code-snippets`:

```json
{
  "TSDoc Interface": {
    "prefix": "tsdoc-interface",
    "body": [
      "/**",
      " * ${1:Description}",
      " * ",
      " * @remarks",
      " * ${2:Additional remarks}",
      " * ",
      " * @example",
      " * ```typescript",
      " * ${3:// Example code}",
      " * ```",
      " * ",
      " * @public",
      " */",
      "export interface ${4:InterfaceName} {",
      "  $0",
      "}"
    ]
  },
  "TSDoc Function": {
    "prefix": "tsdoc-function",
    "body": [
      "/**",
      " * ${1:Description}",
      " * ",
      " * @param ${2:paramName} - ${3:Parameter description}",
      " * @returns ${4:Return description}",
      " * ",
      " * @example",
      " * ```typescript",
      " * ${5:// Example usage}",
      " * ```",
      " */",
      "export function ${6:functionName}(${2:paramName}: ${7:type}): ${8:ReturnType} {",
      "  $0",
      "}"
    ]
  }
}
```

## Validation

Use these tools to ensure documentation quality:

1. **ESLint Plugin**:
```bash
npm install --save-dev eslint-plugin-jsdoc

# Add to .eslintrc
{
  "plugins": ["jsdoc"],
  "rules": {
    "jsdoc/require-description": "warn",
    "jsdoc/require-param": "error",
    "jsdoc/require-returns": "error"
  }
}
```

2. **TypeDoc Validation**:
```bash
# Check for missing documentation
npx typedoc --validation.notDocumented --validation.invalidLink
```

3. **Pre-commit Hook**:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run docs:validate"
    }
  }
}
```