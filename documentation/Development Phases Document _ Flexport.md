## **Flexport: The Video Game \- 7-Day Development Plan**

### **Phase 1: Foundation & Core Systems (Day 1\)**

#### **Objective**

Set up the basic project structure and implement core frontend-backend integration for asset placement and basic state management.

#### **Development Focus**

* **Learning Priority**: Phaser.js basics, React/Next.js integration, Supabase setup.  
* **Technical Priority**: Map rendering, state store, database schema.  
* **Risk Mitigation**: Prove client-server sync works early.

#### **Features to Implement**

##### **1\. Project Setup & Structure**

* Create Next.js project with Phaser integration.  
* Set up folders (components/, scenes/, scripts/, assets/, data/).  
* Configure Supabase (database, auth, realtime).  
* Create main scene hierarchy (map canvas, UI overlay).  
* Set up Git repository.

##### **2\. Isometric Map Foundation**

* Render basic isometric map with ports as nodes.  
* Set up camera controls (pan, zoom).  
* Add basic lighting/effects (day mode).  
* Create world background.  
* Implement route visualization (lines).

##### **3\. Camera Control System**

* Implement pan (drag) and zoom (wheel).  
* Add constraints (min/max zoom, boundaries).  
* Create presets (global view, port focus).

##### **4\. Asset Placement System**

* Create AssetSystem in Zustand store.  
* Implement port-node snapping for assets.  
* Add visual previews.  
* Create asset data structure (JSON resource).  
* Validate placements (ownership, costs).

##### **5\. Basic Asset Objects**

* Placeholder sprites for ships, warehouses.  
* Implement categories (transport, storage).  
* Add rotation/assignment.  
* Create removal system.  
* Integrate cost deduction via Supabase.

##### **6\. User Interface Foundation**

* Create React UI with Tailwind.  
* Implement asset toolbar.  
* Add cash display HUD.  
* Create selection panel.  
* Handle inputs for placements.

##### **7\. Basic Data Management**

* Create EmpireState in Zustand.  
* Implement save/load via Supabase.  
* Define assets (JSON).  
* Add validation.

##### **8\. Testing & Validation**

* Test asset placement.  
* Verify camera.  
* Test costs.  
* Validate sync.

#### **Success Criteria for Day 1**

* Players can place/remove assets on map.  
* Camera navigates smoothly.  
* State syncs with Supabase.  
* Basic structure ready.

#### **Day 1 Deliverables**

* Working project with map and UI.  
* Asset system.  
* Camera and basic sync.  
* Documentation.

### **Phase 2: Core Gameplay Systems (Days 2-3)**

#### **Objective**

Implement route building, market systems, and basic AI companion.

#### **Development Focus**

* **Learning Priority**: Phaser animations, Supabase Edge Functions.  
* **Technical Priority**: Route logic, economy simulation.  
* **Risk Mitigation**: Simplify simulations first.

#### **Features to Implement**

##### **Day 2 Features**

##### **1\. Route System**

* Create RouteSystem for connections.  
* Implement origin-destination drawing.  
* Add validation (complete paths).  
* Visualize with animated lines.

##### **2\. Simplified Economy System**

* Calculate profits via formulas.  
* Implement modifiers (assets, risks).  
* Add profitability stats.  
* Validate routes for revenue.

##### **3\. Market System Foundation**

* Create MarketSystem for goods/capital.  
* Implement buying/selling.  
* Add types (goods, assets).  
* Integrate Supabase for shared state.

##### **4\. Enhanced Asset System**

* Add more types (planes, modules).  
* Implement sizes/capacities.  
* Create unlock system.  
* Add revenue generation.  
* Implement upgrades.

##### **5\. Economy Integration**

* Track income/expenses.  
* Implement sources (routes).  
* Add reports.  
* Control pricing.

##### **Day 3 Features**

##### **6\. Basic AI Companion**

* Create AICompanion class.  
* Implement training from routes.  
* Add suggestions.  
* Create levels/bonuses.

##### **7\. Route Operations**

* Queue assets to routes.  
* Implement capacity.  
* Add costs (maintenance).  
* Create breakdowns.  
* Track demand.

##### **8\. Advanced Market Features**

* Add elevation (risk modifiers).  
* Implement bonuses (specialists).  
* Create auctions.  
* Optimize efficiency.  
* Add crowding.

##### **9\. Time System**

* Create TimeSystem for quarters.  
* Implement progression.  
* Add operating cycles.  
* Create events.  
* Implement seasons.

##### **10\. Enhanced UI Systems**

* Add route panels.  
* Implement alerts.  
* Create dashboards.  
* Add reports.  
* Control speed.

##### **11\. Asset Creation**

* Sprites for assets with details.  
* Themes (eco, industrial).  
* Add materials.  
* Create animations.  
* Implement sounds.

##### **12\. Testing & Optimization**

* Test routes/AI.  
* Optimize with multiple assets.  
* Verify economy.

#### **Success Criteria for Days 2-3**

* Routes generate profits.  
* AI provides insights.  
* Markets update in real-time.  
* Time affects gameplay.

#### **Days 2-3 Deliverables**

* Functional routes.  
* AI and economy.  
* Markets and time.  
* Enhanced UI.

### **Phase 3: Polish & Advanced Features (Days 4-7)**

#### **Objective**

Add disasters, multiplayer, visuals, and polish.

#### **Development Focus**

* **Learning Priority**: Realtime sync, Phaser effects.  
* **Technical Priority**: Events, optimization.  
* **Risk Mitigation**: Incremental additions.

#### **Features to Implement**

##### **Day 4 Features**

##### **1\. Visual Enhancement**

* Implement day/night on map.  
* Add dynamic effects.  
* Create particles (disasters).  
* Add weather.  
* Implement audio.

##### **2\. Advanced Effects System**

* Lighting for assets.  
* Decorative overlays.  
* Animations (ships moving).  
* Effects (storms).

##### **3\. World Enhancement**

* Add map modifications.  
* Implement regions.  
* Create textures.  
* Add decorations.  
* Handle collisions.

##### **4\. Advanced Asset Features**

* Themed sets.  
* Animations.  
* Efficiency systems.  
* Upgrades.  
* Maintenance.

##### **5\. AI Enhancement**

* Add traits.  
* Groups.  
* Reactions.  
* Reviews.  
* Espionage.

##### **Day 5 Features**

##### **6\. Multiplayer Foundation**

* Set up Realtime for shared world.  
* Create connections.  
* Handle join/leave.  
* Add IDs.

##### **7\. Multiplayer Sync**

* Sync assets/routes.  
* Shared markets.  
* Synchronize events.  
* Add notifications.  
* Create indicators.  
* Implement permissions (indirect).

##### **8\. Performance Optimization**

* Pool assets.  
* LOD for map.  
* Optimize rendering.  
* Culling.  
* Profiling.

##### **9\. Advanced Economy**

* Dynamic pricing.  
* Marketing.  
* Staff.  
* Loans.  
* Seasons.

##### **10\. Game Modes**

* Challenge with objectives.  
* Free play.  
* Sandbox.  
* Scenarios.  
* Difficulty.

##### **Day 6 Features**

##### **11\. Advanced UI Polish**

* Animations.  
* Custom layouts.  
* Tooltips.  
* Accessibility.

##### **12\. Advanced Multiplayer**

* Competitive modes.  
* Reputation.  
* Achievements.  
* Spectator.  
* Leaderboards.

##### **13\. Content Tools**

* Sharing.  
* Capture.  
* Templates.  
* User content.  
* Ratings.

##### **14\. Advanced Route Features**

* Custom themes.  
* Effects.  
* Photos (screenshots).  
* Sync.  
* Testing tools.

##### **15\. Quality of Life**

* Bulk ops.  
* Copy/paste.  
* Templates.  
* Search.  
* Undo.

##### **Day 7 Features**

##### **16\. Final Polish & Testing**

* Fix bugs.  
* Optimize.  
* Balance.  
* Test multiplayer.  
* Verify features.

##### **17\. Documentation & Help**

* Tutorials.  
* Help docs.  
* Guides.  
* Document systems.  
* Dev docs.

##### **18\. Final Features**

* Easter eggs.  
* Achievements.  
* Stats.  
* Saves.  
* Backups.

##### **19\. Deployment**

* Builds.  
* Test platforms.  
* Installers.  
* Materials.  
* Videos.

##### **20\. Stress Testing**

* Max players.  
* Large empires.  
* Memory.  
* Network.  
* Stability.

#### **Success Criteria for Days 4-7**

* Multiplayer syncs reliably.  
* Visuals polished.  
* Features complete.  
* Performance stable.

#### **Days 4-7 Deliverables**

* Full multiplayer.  
* Polished visuals.  
* Complete set.  
* Docs.  
* Optimized.  
* Ready for demo.

### **Risk Management & Fallback Plans**

#### **High-Risk Features**

1. **Realtime Sync**: Fallback to single-player.  
2. **Phaser Performance**: Reduce animations.  
3. **Edge Functions**: Simplify simulations.

#### **Feature Prioritization**

1. **Must-Have**: Assets, routes, economy.  
2. **Should-Have**: AI, disasters, multiplayer.  
3. **Nice-to-Have**: Crises, poaching.

#### **Daily Checkpoints**

* Day 1: Basic placement.  
* Day 3: Core loop.  
* Day 5: Multiplayer.  
* Day 7: Complete.

### **Success Metrics**

* Technical: Systems functional, stable.  
* Gameplay: Engaging, meets design.  
* Multiplayer: Reliable.  
* Polish: Professional.  
* Docs: Complete.

