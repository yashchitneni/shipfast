# Developer Guide

## Overview

This guide provides comprehensive information for developers working on the Flexport game. It covers coding standards, development workflows, architecture patterns, and best practices.

## Development Environment

### Required Tools

- **Node.js 18+**: JavaScript runtime
- **VS Code**: Recommended IDE with extensions
- **Git**: Version control
- **Chrome DevTools**: For debugging
- **React Developer Tools**: Browser extension
- **Supabase CLI**: Database management

### VS Code Setup

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Project Structure

```
flexport-game/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth routes group
│   ├── (game)/            # Game routes group
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── game/             # Game-specific components
│   ├── ui/               # Reusable UI components
│   └── layouts/          # Layout components
├── lib/                   # Core libraries
│   ├── phaser/           # Phaser game engine
│   │   ├── scenes/       # Game scenes
│   │   ├── systems/      # Game systems
│   │   └── plugins/      # Custom plugins
│   ├── store/            # Zustand state stores
│   ├── supabase/         # Database client
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── public/               # Static assets
├── styles/               # Global styles
├── types/                # TypeScript types
└── tests/                # Test files
```

## Coding Standards

### TypeScript Guidelines

#### 1. Type Safety

```typescript
// ✅ Good: Explicit types
interface UserProfile {
  id: string
  username: string
  email: string
  createdAt: Date
}

function getUserProfile(id: string): Promise<UserProfile> {
  // Implementation
}

// ❌ Bad: Using any
function getUserProfile(id: any): any {
  // Implementation
}
```

#### 2. Interfaces vs Types

```typescript
// Use interfaces for objects that can be extended
interface Asset {
  id: string
  name: string
  type: AssetType
}

interface Ship extends Asset {
  capacity: number
  speed: number
}

// Use types for unions, primitives, and functions
type AssetType = 'ship' | 'plane' | 'warehouse'
type AssetFilter = (asset: Asset) => boolean
```

#### 3. Enums and Const Assertions

```typescript
// Prefer const assertions over enums
const AssetStatus = {
  IDLE: 'idle',
  IN_TRANSIT: 'in_transit',
  LOADING: 'loading',
  MAINTENANCE: 'maintenance'
} as const

type AssetStatus = typeof AssetStatus[keyof typeof AssetStatus]
```

### React Best Practices

#### 1. Component Structure

```typescript
// components/game/AssetCard.tsx
import { memo, useState, useCallback } from 'react'
import { Asset } from '@/types/game'
import { Button } from '@/components/ui/Button'
import { useGameStore } from '@/lib/store/gameStore'

interface AssetCardProps {
  asset: Asset
  onSelect?: (asset: Asset) => void
  className?: string
}

export const AssetCard = memo(function AssetCard({ 
  asset, 
  onSelect,
  className 
}: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const selectAsset = useGameStore((state) => state.selectAsset)
  
  const handleClick = useCallback(() => {
    selectAsset(asset.id)
    onSelect?.(asset)
  }, [asset, selectAsset, onSelect])
  
  return (
    <div 
      className={cn('asset-card', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Component content */}
    </div>
  )
})
```

#### 2. Custom Hooks

```typescript
// lib/hooks/useAssetManagement.ts
export function useAssetManagement() {
  const { assets, purchaseAsset, sellAsset } = useGameStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const handlePurchase = useCallback(async (assetType: AssetType) => {
    setLoading(true)
    setError(null)
    
    try {
      await purchaseAsset(assetType)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [purchaseAsset])
  
  return {
    assets,
    loading,
    error,
    purchaseAsset: handlePurchase,
    sellAsset
  }
}
```

#### 3. Performance Optimization

```typescript
// Use React.memo with custom comparison
export const ExpensiveComponent = memo(
  function ExpensiveComponent({ data }: Props) {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison logic
    return prevProps.data.id === nextProps.data.id
  }
)

// Use useMemo for expensive computations
function RouteOptimizer({ routes }: { routes: Route[] }) {
  const optimizedRoutes = useMemo(() => {
    return calculateOptimalRoutes(routes)
  }, [routes])
  
  return <RouteList routes={optimizedRoutes} />
}
```

### State Management Patterns

#### 1. Store Organization

```typescript
// lib/store/gameStore.ts
interface GameState {
  // State
  cash: number
  assets: Asset[]
  
  // Computed values (selectors)
  getTotalAssetValue: () => number
  getAssetsByType: (type: AssetType) => Asset[]
  
  // Actions
  updateCash: (amount: number) => void
  purchaseAsset: (purchase: AssetPurchase) => Promise<void>
  
  // Subscriptions
  subscribe: () => () => void
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // Implementation
      }),
      { name: 'game-store' }
    )
  )
)
```

#### 2. Async Actions

```typescript
// Handle async operations properly
purchaseAsset: async (purchase: AssetPurchase) => {
  // Optimistic update
  const tempAsset = { ...purchase, id: `temp-${Date.now()}` }
  set((state) => ({
    assets: [...state.assets, tempAsset],
    cash: state.cash - purchase.price
  }))
  
  try {
    const asset = await api.purchaseAsset(purchase)
    
    // Replace temp with real asset
    set((state) => ({
      assets: state.assets.map(a => 
        a.id === tempAsset.id ? asset : a
      )
    }))
  } catch (error) {
    // Rollback on error
    set((state) => ({
      assets: state.assets.filter(a => a.id !== tempAsset.id),
      cash: state.cash + purchase.price
    }))
    throw error
  }
}
```

### API Design

#### 1. Edge Functions

```typescript
// supabase/functions/purchase-asset/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

interface RequestBody {
  assetType: string
  portId: string
}

serve(async (req) => {
  try {
    // Validate request
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }
    
    // Parse body
    const body: RequestBody = await req.json()
    
    // Validate auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Verify user
    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (error || !user) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Process purchase
    const result = await processPurchase(supabase, user.id, body)
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

#### 2. API Client

```typescript
// lib/api/client.ts
class APIClient {
  private baseURL: string
  private timeout: number
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1'
    this.timeout = 30000
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken()
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    })
    
    if (!response.ok) {
      throw new APIError(response.status, await response.text())
    }
    
    return response.json()
  }
  
  async purchaseAsset(purchase: AssetPurchase) {
    return this.request<Asset>('/purchase-asset', {
      method: 'POST',
      body: JSON.stringify(purchase),
    })
  }
}

export const api = new APIClient()
```

### Testing Strategies

#### 1. Unit Tests

```typescript
// tests/unit/stores/gameStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useGameStore } from '@/lib/store/gameStore'

describe('GameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      cash: 50000,
      assets: []
    })
  })
  
  it('should purchase asset when funds available', async () => {
    const { result } = renderHook(() => useGameStore())
    
    await act(async () => {
      await result.current.purchaseAsset({
        type: 'ship',
        price: 10000,
        portId: 'port-1'
      })
    })
    
    expect(result.current.cash).toBe(40000)
    expect(result.current.assets).toHaveLength(1)
  })
})
```

#### 2. Integration Tests

```typescript
// tests/integration/game-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GamePage } from '@/app/(game)/play/page'

describe('Game Flow', () => {
  it('should complete asset purchase flow', async () => {
    const user = userEvent.setup()
    render(<GamePage />)
    
    // Open asset panel
    await user.click(screen.getByRole('button', { name: /assets/i }))
    
    // Select ship
    await user.click(screen.getByText('Container Ship'))
    
    // Confirm purchase
    await user.click(screen.getByRole('button', { name: /purchase/i }))
    
    // Verify asset added
    await waitFor(() => {
      expect(screen.getByText('Pacific Runner')).toBeInTheDocument()
    })
  })
})
```

#### 3. E2E Tests

```typescript
// tests/e2e/gameplay.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Gameplay', () => {
  test('should create and optimize route', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Wait for game to load
    await page.waitForSelector('.game-canvas')
    
    // Create route
    await page.click('[data-testid="route-builder"]')
    await page.click('[data-port="LAX"]')
    await page.click('[data-port="SHA"]')
    await page.click('button:has-text("Create Route")')
    
    // Verify route created
    await expect(page.locator('[data-route-name]')).toContainText('LAX-SHA')
  })
})
```

## Development Workflows

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/ship-upgrades

# 2. Develop feature
# - Write tests first (TDD)
# - Implement feature
# - Update documentation

# 3. Run tests
npm test

# 4. Commit changes
git add .
git commit -m "feat: add ship upgrade system

- Add upgrade UI components
- Implement upgrade logic
- Add upgrade API endpoints
- Update tests and docs"

# 5. Push and create PR
git push origin feature/ship-upgrades
```

### 2. Code Review Checklist

- [ ] Tests pass and coverage maintained
- [ ] TypeScript types are properly defined
- [ ] No console.logs in production code
- [ ] Performance implications considered
- [ ] Accessibility requirements met
- [ ] Documentation updated
- [ ] No sensitive data exposed
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Mobile responsiveness checked

### 3. Release Process

```bash
# 1. Update version
npm version minor

# 2. Generate changelog
npm run changelog

# 3. Build and test
npm run build
npm run test:prod

# 4. Tag release
git tag -a v1.1.0 -m "Release version 1.1.0"

# 5. Push to main
git push origin main --tags

# 6. Deploy
npm run deploy:production
```

## Performance Guidelines

### 1. Bundle Size Optimization

```typescript
// Use dynamic imports for large components
const MarketAnalytics = dynamic(
  () => import('@/components/analytics/MarketAnalytics'),
  { 
    loading: () => <AnalyticsSkeleton />,
    ssr: false 
  }
)

// Tree-shake imports
import { Button } from '@/components/ui' // ❌ Bad
import { Button } from '@/components/ui/Button' // ✅ Good
```

### 2. Render Optimization

```typescript
// Optimize re-renders with proper memoization
const MemoizedAssetList = memo(AssetList, (prev, next) => {
  // Only re-render if assets actually changed
  return prev.assets.length === next.assets.length &&
    prev.assets.every((asset, i) => asset.id === next.assets[i].id)
})

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  selectAsset(id)
}, [selectAsset])
```

### 3. Data Fetching

```typescript
// Use SWR for data fetching
import useSWR from 'swr'

function useMarketPrices() {
  const { data, error, mutate } = useSWR(
    '/api/market/prices',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )
  
  return {
    prices: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}
```

## Security Best Practices

### 1. Input Validation

```typescript
// Always validate user input
import { z } from 'zod'

const AssetPurchaseSchema = z.object({
  assetType: z.enum(['ship', 'plane', 'warehouse']),
  portId: z.string().uuid(),
  name: z.string().min(1).max(50),
})

export async function purchaseAsset(input: unknown) {
  // Validate input
  const validated = AssetPurchaseSchema.parse(input)
  
  // Process with validated data
  return processAssetPurchase(validated)
}
```

### 2. Authentication & Authorization

```typescript
// Middleware for protected routes
export async function middleware(request: NextRequest) {
  const session = await getSession(request)
  
  if (!session && request.nextUrl.pathname.startsWith('/game')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Check permissions for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  return NextResponse.next()
}
```

### 3. Data Sanitization

```typescript
// Sanitize user-generated content
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

// Escape special characters in SQL queries
export function escapeSQL(str: string): string {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case "\0": return "\\0"
      case "\x08": return "\\b"
      case "\x09": return "\\t"
      case "\x1a": return "\\z"
      case "\n": return "\\n"
      case "\r": return "\\r"
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\" + char
      default:
        return char
    }
  })
}
```

## Debugging Tips

### 1. React DevTools

```typescript
// Add display names for debugging
AssetCard.displayName = 'AssetCard'

// Use debug values in custom hooks
function useAssetManagement() {
  // ... hook implementation
  
  useDebugValue({
    assetCount: assets.length,
    totalValue: assets.reduce((sum, a) => sum + a.value, 0)
  })
}
```

### 2. Performance Profiling

```typescript
// Measure component render time
function measureRender(id: string, phase: string, actualDuration: number) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`)
}

<Profiler id="AssetList" onRender={measureRender}>
  <AssetList assets={assets} />
</Profiler>
```

### 3. Network Debugging

```typescript
// Log all API calls in development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('fetch', (event) => {
    console.log('Fetch:', event.request.url)
  })
}
```

## Common Patterns

### 1. Error Boundaries

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}
```

### 2. Loading States

```typescript
// components/LoadingStates.tsx
export function AssetListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-20 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  )
}

// Usage
function AssetPanel() {
  const { assets, isLoading } = useAssets()
  
  if (isLoading) return <AssetListSkeleton />
  if (!assets.length) return <EmptyState />
  
  return <AssetList assets={assets} />
}
```

### 3. Compound Components

```typescript
// components/ui/Card.tsx
const CardContext = createContext<CardContextValue>()

export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
}

function CardRoot({ children, variant = 'default' }: CardRootProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={cn('card', `card--${variant}`)}>
        {children}
      </div>
    </CardContext.Provider>
  )
}

// Usage
<Card.Root variant="highlight">
  <Card.Header>
    <h3>Asset Details</h3>
  </Card.Header>
  <Card.Body>
    <AssetInfo asset={asset} />
  </Card.Body>
  <Card.Footer>
    <Button>Purchase</Button>
  </Card.Footer>
</Card.Root>
```

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Phaser Documentation](https://phaser.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools

- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind Play](https://play.tailwindcss.com/)

### Community

- Discord Server: [Join our Discord](https://discord.gg/flexport-game)
- GitHub Discussions: [GitHub](https://github.com/flexport-game/discussions)
- Stack Overflow: Tag with `flexport-game`

## Conclusion

This guide covers the essential aspects of developing for Flexport. Always prioritize:

1. **Code Quality**: Write clean, maintainable code
2. **Performance**: Optimize for smooth gameplay
3. **User Experience**: Build intuitive interfaces
4. **Testing**: Maintain high test coverage
5. **Documentation**: Keep docs up to date

Happy coding! 🚀