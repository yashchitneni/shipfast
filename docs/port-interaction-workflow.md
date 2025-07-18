# Port Interaction Workflow Guide

## Overview
This document explains how players interact with ports, place assets, and build their logistics empire in the Flexport game.

## Port System Architecture

### Port Capacity System
```
Port Capacity (100 units) = Asset Parking Slots
├── Ship #1 (1 slot) → Cargo Capacity: 1,000 units
├── Ship #2 (1 slot) → Cargo Capacity: 2,500 units  
├── Warehouse #1 (1 slot) → Storage Capacity: 5,000 units
└── ... (up to 100 total assets)
```

### Asset Types and Capacities
- **Small Container Ship**: 1,000 cargo units, costs $500k
- **Medium Container Ship**: 2,500 cargo units, costs $1.2M
- **Large Container Ship**: 5,000 cargo units, costs $2.5M
- **Standard Warehouse**: 5,000 storage units, costs $300k
- **Distribution Center**: 10,000 storage units, costs $800k

## Gameplay Workflow

### 1. Port Selection
```
Player clicks on port → Port Management Panel opens
└── Shows: Name, Region, Capacity, Current Assets
```

### 2. Asset Placement Process
```
1. Click "Add Ship" or "Add Warehouse"
2. Select asset type from catalog
3. Enter placement mode (cursor changes to asset preview)
4. Click near port to place asset
5. Asset snaps to nearest placement zone
6. Confirm placement and deduct cost
```

### 3. Placement Zones Around Each Port
Each port has predefined zones:
- **Main Docking Area**: 5 ship slots, 30px radius
- **Secondary Docking**: 3 ship slots, 25px radius  
- **Storage Facility**: 10 warehouse slots, 20px radius
- **Maintenance Bay**: 2 maintenance slots, 15px radius

### 4. Asset Management
Once placed, assets can:
- **Load/Unload Cargo**: Transfer goods between ships and warehouses
- **Assign to Routes**: Connect to trade routes for automated operation
- **Maintenance**: Repair and upgrade asset performance
- **Relocate**: Move to different zones or ports

### 5. Route Creation
```
1. Select origin port
2. Click "Create Route"
3. Select destination port
4. Choose waypoints (optional)
5. Assign ships to route
6. Route becomes active and generates profit
```

## Visual Implementation

### Port Visualization
```
     [Maintenance Bay]
           (2 slots)
              ↑
              |
[Storage] ← [PORT] → [Storage]
(10 slots)    ●    (10 slots)
              |
              ↓
    [Main Docking Area]
         (5 slots)
```

### Asset Placement Flow
1. **Selection Phase**: Player selects asset type
2. **Preview Phase**: Ghost asset follows cursor
3. **Validation Phase**: Check zone capacity and player funds
4. **Placement Phase**: Asset snaps to valid position
5. **Confirmation Phase**: Asset becomes operational

## Technical Implementation

### Zone Detection System
```typescript
interface PlacementZone {
  id: string;
  name: string;
  position: { x: number; y: number };
  radius: number;
  type: 'docking' | 'storage' | 'maintenance';
  capacity: number;
  occupied: number;
}
```

### Asset Snapping Logic
```typescript
const findNearestZone = (mousePos: Position, zones: PlacementZone[]) => {
  return zones
    .filter(zone => zone.occupied < zone.capacity)
    .reduce((closest, zone) => {
      const distance = calculateDistance(mousePos, zone.position);
      return distance < closest.distance ? { zone, distance } : closest;
    }, { zone: null, distance: Infinity });
};
```

## Player Progression

### Early Game (Level 1-3)
- Start with 1-2 small ships
- Focus on short regional routes
- Build basic warehouses for storage
- Learn capacity management

### Mid Game (Level 4-7)
- Expand to medium ships
- Create international routes
- Upgrade port facilities
- Optimize cargo flows

### Late Game (Level 8+)
- Manage large container fleets
- Control multiple major ports
- Create complex supply chains
- Compete in global markets

## Economic Mechanics

### Revenue Generation
```
Route Profit = (Cargo Value × Distance Bonus × Risk Multiplier) - Costs
Where:
- Cargo Value: $10 per unit
- Distance Bonus: 0.1% per 100 nautical miles
- Risk Multiplier: 1 + (risk_level / 100)
- Costs: Fuel + Maintenance + Port Fees + Crew + Insurance
```

### Capacity Optimization
Players must balance:
- **Port Capacity**: How many assets can be stationed
- **Cargo Capacity**: How much goods can be transported
- **Storage Capacity**: How much inventory can be held
- **Route Efficiency**: Optimal asset assignment

## User Interface Elements

### Port Management Panel Tabs
1. **Overview**: Capacity display, quick actions, placement zones
2. **Assets**: Available assets catalog, placement tools
3. **Routes**: Connected routes, route creation
4. **Upgrade**: Port improvements, facility expansions

### Visual Feedback
- **Green Zones**: Available placement areas
- **Red Zones**: Full capacity areas
- **Yellow Zones**: High utilization warning
- **Asset Previews**: Ghost assets during placement
- **Snap Indicators**: Visual guides for placement

## Success Metrics

### Port Efficiency
- **Utilization Rate**: Assets placed / Total capacity
- **Cargo Throughput**: Goods processed per day
- **Route Connectivity**: Number of active routes
- **Profit Per Day**: Revenue generated from port operations

### Player Engagement
- **Placement Satisfaction**: Successful asset placements
- **Strategic Depth**: Complex route networks
- **Visual Clarity**: Clear capacity understanding
- **Progression Feel**: Meaningful upgrades and expansion

This system creates a satisfying gameplay loop where players strategically place assets, optimize capacity, and build profitable trade networks while managing the spatial and economic constraints of each port. 