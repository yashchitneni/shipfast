# Flexport Implementation Roadmap

## Executive Summary

This document provides a comprehensive, actionable roadmap for implementing the Flexport shipping empire game. Based on the strategic audit and development path forward, we've identified critical integration work that must be completed before new features can be added. The roadmap is structured into distinct phases with clear dependencies and measurable outcomes.

## Current State Assessment

### ✅ Completed Components
- **Architecture**: Robust hybrid Next.js + Phaser.js structure
- **State Management**: Central Zustand store (empireStore.ts) with middleware
- **Backend**: Comprehensive Supabase schema (7 migrations)
- **Core Loop**: Purchase → Create → Assign → Generate (partially functional)
- **UI Components**: Built but using mock data (needs integration)

### ⚠️ Critical Issues
1. **State Fragmentation**: Multiple stores without clear hierarchy
2. **Mock Data Dependency**: UI components disconnected from live data
3. **Incomplete Integration**: Bridges exist but aren't fully utilized
4. **Legacy Code**: Old asset structure still referenced in places

## Phase Breakdown

---

## 📋 Phase 2.0: Consolidation & Integration (URGENT - 2-3 weeks)

**Objective**: Eliminate technical debt and create a stable, integrated foundation.

### Task 2.0.1: Unify State Management Architecture
**Priority**: 🔴 Critical  
**Duration**: 3-4 days  
**Dependencies**: None

**Implementation Steps**:
1. **Audit all Zustand stores**
   - [ ] Map relationships between empireStore, useRouteStore, useMarketStore, useEconomyStore
   - [ ] Identify redundant state variables
   - [ ] Document data flow patterns

2. **Establish hierarchical structure**
   - [ ] Make empireStore the root store
   - [ ] Convert specialized stores to modules/slices
   - [ ] Implement cross-store subscriptions for data consistency

3. **Remove redundant state**
   - [ ] Eliminate duplicate marketPrices, routes, etc.
   - [ ] Create single source of truth for each data type
   - [ ] Update all consumers to use centralized state

**Success Criteria**: Single, consistent state tree with no data duplication

### Task 2.0.2: Connect MarketTradingPanel to Live Data
**Priority**: 🔴 Critical  
**Duration**: 2-3 days  
**Dependencies**: Task 2.0.1

**Implementation Steps**:
1. **Remove mock data**
   - [ ] Delete MOCK_MARKET_ITEMS from MarketTradingPanel.tsx
   - [ ] Remove all hardcoded price data

2. **Connect to useMarketStore**
   - [ ] Import useMarketStore hook
   - [ ] Replace mock items with store.marketItems
   - [ ] Connect buy/sell actions to store methods

3. **Implement real-time updates**
   - [ ] Subscribe to market price changes
   - [ ] Update UI reactively when prices change
   - [ ] Show loading states during transactions

**Success Criteria**: Market panel shows live data and transactions update backend

### Task 2.0.3: Connect FinancialDashboard to Live Data
**Priority**: 🔴 Critical  
**Duration**: 2-3 days  
**Dependencies**: Task 2.0.1

**Implementation Steps**:
1. **Remove mock financial data**
   - [ ] Delete all placeholder revenue/expense data
   - [ ] Remove hardcoded chart datasets

2. **Connect to useEconomyStore**
   - [ ] Derive all metrics from store state
   - [ ] Calculate real revenue from active routes
   - [ ] Sum actual expenses from placed assets

3. **Implement historical tracking**
   - [ ] Store financial snapshots in database
   - [ ] Create time-series data for charts
   - [ ] Add period comparison features

**Success Criteria**: Dashboard shows real financial performance data

### Task 2.0.4: Connect RouteManager to Live Data
**Priority**: 🔴 Critical  
**Duration**: 2-3 days  
**Dependencies**: Task 2.0.1

**Implementation Steps**:
1. **Remove mock routes**
   - [ ] Delete MOCK_ROUTES constant
   - [ ] Remove placeholder route data

2. **Connect to useRouteStore**
   - [ ] Display routes from store.routes Map
   - [ ] Connect create/edit/delete actions
   - [ ] Show actual assigned assets

3. **Implement route visualization**
   - [ ] Connect to routeBridge for Phaser rendering
   - [ ] Draw routes on WorldMapScene
   - [ ] Animate asset movement along routes

**Success Criteria**: Route manager shows real routes with visual representation

### Task 2.0.5: Deprecate Legacy Asset Structure
**Priority**: 🟡 High  
**Duration**: 1-2 days  
**Dependencies**: Tasks 2.0.2-2.0.4

**Implementation Steps**:
1. **Remove old asset structure**
   - [ ] Delete assets: { ships: {}, planes: {} } from EmpireState
   - [ ] Update TypeScript interfaces

2. **Update all references**
   - [ ] Refactor components using old structure
   - [ ] Use placedAssets Map exclusively
   - [ ] Update selectors (getAssetsByType, etc.)

3. **Migration script**
   - [ ] Create database migration if needed
   - [ ] Ensure no data loss during transition

**Success Criteria**: Single, unified asset management system

---

## 🌍 Phase 2.5: Dynamic Ports System (HIGH PRIORITY - 2-3 weeks)

**Objective**: Create interactive, realistic ports that respond to player actions.

### Task 2.5.1: Port Data Integration
**Priority**: 🔴 Critical  
**Duration**: 3-4 days  
**Dependencies**: Phase 2.0 completion

**Implementation Steps**:
1. **Create ports.json data file**
   - [ ] Add /app/assets/definitions/ports.json
   - [ ] Include 20 major global ports with real data
   - [ ] Structure: id, name, country, TEU, location, imports/exports

2. **Update type definitions**
   - [ ] Modify PortNode interface in types/assets.ts
   - [ ] Add country, realWorldTEU, location, majorExports, majorImports

3. **Create port loader**
   - [ ] Refactor getMockPortNodes → loadPortDefinitions
   - [ ] Parse and validate ports.json
   - [ ] Integrate with existing port system

**Example Port Data**:
```json
{
  "id": "port-shanghai",
  "name": "Port of Shanghai",
  "country": "CN",
  "realWorldTEU": 48900000,
  "location": { "lat": 31.23, "lon": 121.47 },
  "majorExports": ["electronics", "machinery", "textiles"],
  "majorImports": ["crude_petroleum", "iron_ore", "chemicals"]
}
```

### Task 2.5.2: Implement Level of Detail (LOD) System
**Priority**: 🔴 Critical  
**Duration**: 4-5 days  
**Dependencies**: Task 2.5.1

**Implementation Steps**:
1. **Create Phaser layers structure**
   - [ ] Add portDetailLayers Map in WorldMapScene
   - [ ] Create layer for each port (hidden by default)
   - [ ] Implement layer management system

2. **Implement zoom detection**
   - [ ] Add zoom threshold constants (1.5x)
   - [ ] Monitor camera zoom/position in update()
   - [ ] Calculate viewport center and nearest port

3. **Toggle detail views**
   - [ ] Show/hide layers based on zoom
   - [ ] Fade transitions between views
   - [ ] Maintain performance with culling

**Code Structure**:
```typescript
private portDetailLayers: Map<string, Phaser.GameObjects.Layer>;
private activeDetailLayer: Phaser.GameObjects.Layer | null = null;

update(time: number, delta: number): void {
  const zoom = this.cameras.main.zoom;
  
  if (zoom >= 1.5) {
    // Show detailed port view
    const nearestPort = this.findPortAt(centerX, centerY);
    if (nearestPort) {
      this.showPortDetail(nearestPort.id);
    }
  } else {
    // Show global view
    this.hideAllPortDetails();
  }
}
```

### Task 2.5.3: Create Port Detail Assets
**Priority**: 🟡 High  
**Duration**: 3-4 days  
**Dependencies**: Task 2.5.2

**Implementation Steps**:
1. **Design port infrastructure sprites**
   - [ ] Create/source dock sprites
   - [ ] Create/source crane animations
   - [ ] Create/source warehouse graphics

2. **Implement port layouts**
   - [ ] Design unique layout for each port type
   - [ ] Position infrastructure logically
   - [ ] Add ambient animations (cranes, trucks)

3. **Show player assets at ports**
   - [ ] Query placedAssets by portId
   - [ ] Render ships/warehouses in detail view
   - [ ] Update positions dynamically

### Task 2.5.4: Integrate Port Economics
**Priority**: 🟡 High  
**Duration**: 2-3 days  
**Dependencies**: Task 2.5.1

**Implementation Steps**:
1. **Update economy simulation**
   - [ ] Modify updateMarketPrices in useEconomyStore
   - [ ] Use port import/export data for supply/demand
   - [ ] Create price differentials between ports

2. **Display economic data**
   - [ ] Show top demanded goods in port tooltips
   - [ ] Display local price modifiers
   - [ ] Indicate trade opportunities

**Economic Formula**:
```typescript
// Higher supply in export ports = lower prices
if (port.majorExports.includes(good)) {
  priceModifier *= 0.8; // 20% cheaper
}
// Higher demand in import ports = higher prices  
if (port.majorImports.includes(good)) {
  priceModifier *= 1.3; // 30% more expensive
}
```

---

## 🎮 Phase 3: World Dynamics & Depth (MEDIUM PRIORITY - 3-4 weeks)

**Objective**: Add strategic depth through advanced markets, events, and AI.

### Task 3.1: Advanced Market Systems
**Priority**: 🟡 High  
**Duration**: 1 week  
**Dependencies**: Phase 2.5 completion

**Sub-tasks**:
1. **Capital Market**
   - [ ] Implement loan system
   - [ ] Add interest rate mechanics
   - [ ] Create credit rating system

2. **Labor Market**
   - [ ] Design specialist types
   - [ ] Implement hiring UI
   - [ ] Add specialist bonuses to operations

### Task 3.2: Disaster & Event System
**Priority**: 🟡 High  
**Duration**: 1 week  
**Dependencies**: Phase 2.5 completion

**Sub-tasks**:
1. **Visual disaster effects**
   - [ ] Storm animations in Phaser
   - [ ] Port closure indicators
   - [ ] Route disruption visuals

2. **Gameplay consequences**
   - [ ] Asset damage calculations
   - [ ] Market volatility triggers
   - [ ] Recovery mechanics

### Task 3.3: Enhanced AI Companion
**Priority**: 🟢 Medium  
**Duration**: 1 week  
**Dependencies**: Phase 3.1, 3.2

**Sub-tasks**:
1. **Learning system**
   - [ ] Track player decisions
   - [ ] Analyze successful routes
   - [ ] Generate contextual advice

2. **Market insights**
   - [ ] Predict price trends
   - [ ] Suggest profitable routes
   - [ ] Warn about risks

---

## 🌐 Phase 4: Multiplayer & Polish (LOW PRIORITY - 4-6 weeks)

**Objective**: Add competitive features and commercial polish.

### Task 4.1: Real-time Auctions
**Priority**: 🟢 Medium  
**Duration**: 1 week  
**Dependencies**: Phase 3 completion

**Sub-tasks**:
- [ ] Auction UI component
- [ ] Bidding mechanics
- [ ] Real-time synchronization

### Task 4.2: Multiplayer Features
**Priority**: 🟢 Medium  
**Duration**: 2 weeks  
**Dependencies**: Phase 3 completion

**Sub-tasks**:
- [ ] Visible rival assets
- [ ] Global leaderboards
- [ ] Trade agreements between players

### Task 4.3: Audio-Visual Polish
**Priority**: 🟢 Medium  
**Duration**: 2-3 weeks  
**Dependencies**: All phases

**Sub-tasks**:
- [ ] Sound effect integration
- [ ] Music system
- [ ] UI animations and transitions
- [ ] Performance optimization

---

## Implementation Guidelines

### Development Principles
1. **Integration First**: Always connect to live data before adding features
2. **Incremental Progress**: Complete small, testable chunks
3. **Documentation**: Update docs as implementation progresses
4. **Performance**: Monitor and optimize continuously

### Testing Strategy
- Unit tests for state management logic
- Integration tests for UI-store connections
- E2E tests for complete user flows
- Performance benchmarks for Phaser rendering

### Code Quality Standards
- TypeScript strict mode
- ESLint compliance
- Consistent naming conventions
- Comprehensive JSDoc comments

### Communication
- Daily progress updates
- Weekly milestone reviews
- Immediate escalation of blockers
- Regular documentation updates

---

## Risk Mitigation

### Technical Risks
1. **State synchronization issues**
   - Mitigation: Comprehensive testing, gradual rollout
   
2. **Performance degradation with LOD**
   - Mitigation: Profiling, object pooling, layer culling

3. **Real-time sync latency**
   - Mitigation: Optimistic updates, conflict resolution

### Schedule Risks
1. **Integration taking longer than expected**
   - Mitigation: Parallel work streams where possible
   
2. **Asset creation bottlenecks**
   - Mitigation: Use placeholder assets, iterate later

---

## Success Metrics

### Phase 2.0 Success Criteria
- [ ] Zero mock data in production components
- [ ] All UI panels show live game state
- [ ] State changes persist to database
- [ ] No console errors or warnings

### Phase 2.5 Success Criteria
- [ ] 20 interactive ports on world map
- [ ] Smooth zoom transitions
- [ ] Visible player assets at ports
- [ ] Economic differentiation between ports

### Phase 3 Success Criteria
- [ ] Dynamic market prices based on events
- [ ] AI provides useful suggestions
- [ ] Players can take loans and hire specialists

### Phase 4 Success Criteria
- [ ] Players can see rivals' empires
- [ ] Auction system fully functional
- [ ] Game feels polished and complete

---

## Conclusion

This roadmap provides a clear path from the current fragmented state to a cohesive, engaging game. The highest priority is Phase 2.0 (Integration), which must be completed before any new features. Phase 2.5 (Dynamic Ports) directly addresses the most requested feature and will provide immediate value. Subsequent phases add depth and polish in a logical progression.

By following this roadmap, Flexport will transform from a collection of promising prototypes into a unified, strategic shipping empire game.