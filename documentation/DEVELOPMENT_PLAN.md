# **Flexport: Phased Development Plan**

Version: 2.0  
Date: July 16, 2025  
Status: Active Development - Phase 2.0

## **Introduction**

This document provides the authoritative development roadmap for Flexport. It has been completely revised based on the strategic audit findings, replacing the outdated v1.0 plan. The project is currently at a critical juncture requiring immediate integration work before new features can be added.

---

## **Phase 1: Foundational Architecture ✅ COMPLETED**

**Status:** Complete  
**Duration:** Already completed

### **Achievements:**
- ✅ Next.js + Phaser hybrid architecture established
- ✅ Zustand state management with empireStore
- ✅ Isometric world map with camera controls
- ✅ Supabase backend with 7 migrations
- ✅ Asset placement and persistence working
- ✅ Basic UI components built (but using mock data)

---

## **Phase 2.0: Consolidation & Integration 🚨 CURRENT PRIORITY**

**Status:** In Progress  
**Duration:** 2-3 weeks  
**Priority:** CRITICAL - Must complete before ANY new features

### **Problem Statement:**
Multiple UI components were built as isolated prototypes using mock data. They must be connected to live Zustand stores before the game can function properly.

### **Task 2.0.1: Unify State Management** 🔴
**Duration:** 3-4 days  
**Status:** Not Started

- [ ] Audit relationships between all Zustand stores
- [ ] Establish empireStore as single source of truth
- [ ] Convert specialized stores to modules/slices
- [ ] Remove duplicate state variables (marketPrices, etc.)
- [ ] Implement cross-store subscriptions
- [ ] Document state hierarchy

### **Task 2.0.2: Connect MarketTradingPanel** 🔴
**Duration:** 2-3 days  
**Status:** Not Started

- [ ] Remove MOCK_MARKET_ITEMS constant
- [ ] Connect to useMarketStore for live data
- [ ] Wire buy/sell actions to store methods
- [ ] Add loading and error states
- [ ] Test transactions update database

### **Task 2.0.3: Connect FinancialDashboard** 🔴
**Duration:** 2-3 days  
**Status:** Not Started

- [ ] Remove all mock revenue/expense data
- [ ] Connect to useEconomyStore calculations
- [ ] Derive metrics from actual game state
- [ ] Implement historical data tracking
- [ ] Create time-series charts from real data
- [ ] Add period comparison features

### **Task 2.0.4: Connect RouteManager** 🔴
**Duration:** 2-3 days  
**Status:** Not Started

- [ ] Remove MOCK_ROUTES constant
- [ ] Display routes from useRouteStore Map
- [ ] Connect CRUD operations to store
- [ ] Show actually assigned assets
- [ ] Implement route visualization in Phaser
- [ ] Add route animation on world map

### **Task 2.0.5: Deprecate Legacy Asset Structure** 🟡
**Duration:** 1-2 days  
**Status:** Not Started

- [ ] Remove old assets: { ships: {}, planes: {} } structure
- [ ] Update all TypeScript interfaces
- [ ] Refactor components using old structure
- [ ] Use placedAssets Map exclusively
- [ ] Update all helper selectors
- [ ] Create migration script if needed

**Success Metrics:**
- Zero mock data in production
- All UI reflects live game state
- State changes persist to database
- No console errors or warnings

---

## **Phase 2.5: Dynamic Ports System 🌍 HIGH PRIORITY**

**Status:** Not Started  
**Duration:** 2-3 weeks  
**Priority:** HIGH - Most requested feature

### **Task 2.5.1: Port Data Integration** 🔴
**Duration:** 3-4 days

- [ ] Create ports.json with 20 major global ports
- [ ] Include real TEU data and trade specializations
- [ ] Update PortNode interface with new fields
- [ ] Create loadPortDefinitions function
- [ ] Integrate with economy simulation

### **Task 2.5.2: Level of Detail (LOD) System** 🔴
**Duration:** 4-5 days

- [ ] Create Phaser layers for each port
- [ ] Implement zoom threshold detection (1.5x)
- [ ] Toggle between global and detail views
- [ ] Add smooth transitions
- [ ] Optimize with culling and object pools

### **Task 2.5.3: Port Infrastructure Assets** 🟡
**Duration:** 3-4 days

- [ ] Create/source dock sprites
- [ ] Create crane animations
- [ ] Design warehouse graphics
- [ ] Implement unique port layouts
- [ ] Show player assets at ports

### **Task 2.5.4: Economic Integration** 🟡
**Duration:** 2-3 days

- [ ] Modify market prices by port specialization
- [ ] Create supply/demand differentials
- [ ] Display economic data in tooltips
- [ ] Highlight trade opportunities

**Success Metrics:**
- 20 interactive ports on map
- Smooth zoom transitions
- Visible economic differences
- Player assets appear at ports

---

## **Phase 3: World Dynamics & Depth 🎮**

**Status:** Not Started  
**Duration:** 3-4 weeks  
**Priority:** MEDIUM

### **Task 3.1: Advanced Markets**
**Duration:** 1 week

**Capital Market:**
- [ ] Loan application system
- [ ] Interest rate mechanics
- [ ] Credit rating implementation
- [ ] Debt management UI

**Labor Market:**
- [ ] Specialist type definitions
- [ ] Hiring interface
- [ ] Bonus calculation system
- [ ] Salary management

### **Task 3.2: Disaster System**
**Duration:** 1 week

- [ ] Visual disaster effects in Phaser
- [ ] Port closure mechanics
- [ ] Route disruption system
- [ ] Asset damage calculations
- [ ] Market volatility triggers
- [ ] Recovery mechanics

### **Task 3.3: Enhanced AI Companion**
**Duration:** 1 week

- [ ] Implement learning from routes
- [ ] Market trend prediction
- [ ] Contextual suggestions
- [ ] Risk assessment warnings
- [ ] Performance tracking

**Success Metrics:**
- Dynamic market events
- AI provides useful insights
- Players adapt to disasters

---

## **Phase 4: Multiplayer & Polish 🌐**

**Status:** Not Started  
**Duration:** 4-6 weeks  
**Priority:** LOW

### **Task 4.1: Real-time Auctions**
**Duration:** 1 week

- [ ] Auction UI component
- [ ] Bidding mechanics
- [ ] Real-time synchronization
- [ ] Winner notification

### **Task 4.2: Multiplayer Features**
**Duration:** 2 weeks

- [ ] Visible rival assets
- [ ] Global leaderboards
- [ ] Trade agreements
- [ ] Alliance system

### **Task 4.3: Polish**
**Duration:** 2-3 weeks

- [ ] Sound effects integration
- [ ] Background music system
- [ ] UI animations
- [ ] Performance optimization
- [ ] Tutorial system
- [ ] Achievement system

---

## **Development Guidelines**

### **Priorities:**
1. **Integration First** - No new features until Phase 2.0 complete
2. **Test Everything** - Each integration must be verified
3. **Document Changes** - Update docs as you go
4. **Performance Matters** - Monitor and optimize

### **Code Standards:**
- TypeScript strict mode
- ESLint compliance  
- Comprehensive testing
- Clear commit messages

### **Daily Workflow:**
1. Check current phase tasks
2. Update task status
3. Test integration thoroughly
4. Commit with clear message
5. Update documentation

---

## **Risk Management**

### **Technical Risks:**
- **State Sync Issues**: Mitigate with comprehensive testing
- **Performance Degradation**: Profile regularly, optimize early
- **Integration Complexity**: Take incremental approach

### **Schedule Risks:**
- **Phase 2.0 Overrun**: Critical path - allocate buffer time
- **Asset Creation**: Use placeholders, iterate later

---

## **Conclusion**

The project has strong foundations but requires immediate integration work. Phase 2.0 (Integration) is the absolute priority - no new features should be added until this technical debt is resolved. Once complete, Phase 2.5 (Dynamic Ports) will provide the most immediate value to gameplay.

This plan will be updated as phases complete and new requirements emerge.