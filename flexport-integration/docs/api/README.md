# Flexport Game API Documentation

## Overview

The Flexport Game API is built on Supabase Edge Functions, providing secure, scalable endpoints for game operations. All API calls require authentication via Supabase Auth.

## Base URL

```
https://[your-project-id].supabase.co/functions/v1
```

## Authentication

All API requests must include an authentication header:

```http
Authorization: Bearer [user-jwt-token]
```

## Core APIs

### 1. Game State Management

#### Get Current Game State
```http
GET /game-state
```

Returns the player's current game state including cash, assets, and progress.

**Response:**
```json
{
  "id": "uuid",
  "cash": 50000.00,
  "reputation": 50,
  "gameQuarter": 1,
  "gameYear": 2025,
  "assets": [...],
  "routes": [...],
  "aiCompanion": {...}
}
```

#### Update Game State
```http
PATCH /game-state
Content-Type: application/json

{
  "cash": 45000.00,
  "reputation": 52
}
```

### 2. Asset Management

#### Purchase Asset
```http
POST /assets/purchase
Content-Type: application/json

{
  "assetType": "ship",
  "assetSubtype": "container_small",
  "name": "Pacific Runner",
  "portId": "uuid",
  "position": {"x": 100, "y": 200}
}
```

**Validation:**
- Sufficient funds
- Valid port location
- Asset type availability

**Response:**
```json
{
  "success": true,
  "asset": {
    "id": "uuid",
    "name": "Pacific Runner",
    "stats": {
      "capacity": 1000,
      "speed": 25,
      "efficiency": 0.85
    }
  },
  "newBalance": 45000.00
}
```

#### Upgrade Asset
```http
POST /assets/{assetId}/upgrade
Content-Type: application/json

{
  "upgradeType": "engine_boost",
  "level": 2
}
```

#### Assign Asset to Route
```http
POST /assets/{assetId}/assign
Content-Type: application/json

{
  "routeId": "uuid"
}
```

### 3. Route Management

#### Create Route
```http
POST /routes
Content-Type: application/json

{
  "name": "Pacific Trade Route",
  "originPortId": "uuid",
  "destinationPortId": "uuid",
  "waypoints": ["uuid1", "uuid2"],
  "routeType": "sea"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Pacific Trade Route",
  "distance": 5420.5,
  "baseProfitRate": 125.50,
  "riskLevel": 3
}
```

#### Calculate Route Profitability
```http
POST /routes/calculate
Content-Type: application/json

{
  "originPortId": "uuid",
  "destinationPortId": "uuid",
  "cargoType": "electronics",
  "shipStats": {
    "capacity": 1000,
    "speed": 25,
    "efficiency": 0.85
  }
}
```

#### Optimize Route
```http
POST /routes/{routeId}/optimize
```

Uses AI companion to suggest route improvements.

### 4. Market Operations

#### Get Market Prices
```http
GET /market/prices?goods=electronics,textiles,food
```

**Response:**
```json
{
  "electronics": {
    "currentPrice": 125.50,
    "basePrice": 100.00,
    "trend": "rising",
    "demandLevel": 8,
    "supplyLevel": 4
  },
  "textiles": {...},
  "food": {...}
}
```

#### Place Market Order
```http
POST /market/order
Content-Type: application/json

{
  "orderType": "buy",
  "goodsType": "electronics",
  "quantity": 100,
  "priceLimit": 130.00
}
```

### 5. AI Companion

#### Get AI Suggestions
```http
GET /ai/suggestions?context=route_optimization
```

**Response:**
```json
{
  "suggestions": [
    {
      "type": "route_modification",
      "priority": "high",
      "description": "Add waypoint at Singapore to reduce risk",
      "estimatedImpact": {
        "profitChange": "+15%",
        "riskReduction": "-2"
      }
    }
  ]
}
```

#### Train AI Companion
```http
POST /ai/train
Content-Type: application/json

{
  "trainingData": {
    "routeId": "uuid",
    "outcome": "success",
    "profitMargin": 0.23,
    "incidents": []
  }
}
```

### 6. Events & Disasters

#### Get Active Events
```http
GET /events/active
```

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "type": "disaster",
      "title": "Hurricane in Atlantic",
      "severity": "high",
      "affectedRegions": ["north_atlantic"],
      "effects": {
        "routeRisk": "+5",
        "priceModifier": 1.2
      }
    }
  ]
}
```

### 7. Auction System

#### Get Active Auctions
```http
GET /auctions/active
```

#### Place Bid
```http
POST /auctions/{auctionId}/bid
Content-Type: application/json

{
  "bidAmount": 15000.00
}
```

### 8. Contract Management

#### Get Available Contracts
```http
GET /contracts/available
```

#### Accept Contract
```http
POST /contracts/{contractId}/accept
```

#### Update Contract Progress
```http
PATCH /contracts/{contractId}/progress
Content-Type: application/json

{
  "deliveredQuantity": 500
}
```

## Real-time Subscriptions

Connect to real-time updates using Supabase Realtime:

```javascript
// Subscribe to market price changes
const marketChannel = supabase
  .channel('market-prices')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'market_prices' },
    (payload) => {
      console.log('Price update:', payload)
    }
  )
  .subscribe()

// Subscribe to game events
const eventChannel = supabase
  .channel('game-events')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'events' },
    (payload) => {
      console.log('New event:', payload)
    }
  )
  .subscribe()
```

## Error Handling

All API errors follow this format:

```json
{
  "error": {
    "code": "insufficient_funds",
    "message": "Not enough cash to complete purchase",
    "details": {
      "required": 50000,
      "available": 45000
    }
  }
}
```

Common error codes:
- `unauthorized` - Invalid or missing auth token
- `insufficient_funds` - Not enough cash
- `invalid_request` - Malformed request data
- `resource_not_found` - Asset/route/port not found
- `constraint_violation` - Game rule violation
- `rate_limited` - Too many requests

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user
- Burst allowance: 10 requests

## Webhooks

Configure webhooks for game events:

```http
POST /webhooks/configure
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["auction.won", "contract.completed", "disaster.affected"],
  "secret": "your-webhook-secret"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { FlexportGameClient } from '@flexport/game-sdk'

const client = new FlexportGameClient({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  authToken: userToken
})

// Purchase asset
const asset = await client.assets.purchase({
  type: 'ship',
  subtype: 'container_large',
  name: 'Global Express',
  portId: 'port-uuid'
})

// Create route
const route = await client.routes.create({
  name: 'Trans-Pacific Express',
  origin: 'LAX',
  destination: 'SHA',
  type: 'sea'
})
```

## Testing

Use the sandbox environment for testing:

```
https://[your-project-id].supabase.co/functions/v1/sandbox
```

Test authentication token:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token
```

## Versioning

The API uses URL versioning. Current version: `v1`

Future versions will be available at:
- `/functions/v2`
- `/functions/v3`

## Support

- Documentation: https://docs.flexport-game.com
- API Status: https://status.flexport-game.com
- Support: api-support@flexport-game.com