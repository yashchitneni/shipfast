## **Flexport: The Video Game**

### **Core Gameplay Loop**

text  
CollapseWrap  
Copy  
`Start Empire → Acquire Assets → Optimize Routes → Generate Revenue → Expand Operations → Repeat`

### **Game Overview**

Players build and manage a global logistics empire in a shared, dynamic world. Drawing inspiration from tycoon classics like *RollerCoaster Tycoon*, the game focuses on strategic asset management, route optimization, and navigating economic challenges. Players compete indirectly in a multiplayer economy, with direct interactions via auctions and events. The game uses an isometric 2D map for visualization, powered by Phaser.js, with React/Next.js dashboards for data-driven decisions.

### **Core Mechanics**

#### **1\. Asset Building System**

**Grid-Based World Map**

* **Map Structure**: Isometric 2D view with ports as nodes, routes as connectable lines.  
* **Asset Types**:  
  * **Ships**: Container vessels, tankers for sea routes.  
  * **Planes**: Cargo aircraft for air routes.  
  * **Warehouses**: Storage facilities at ports.  
  * **Decorations**: Upgrades like eco-modules or automation systems.  
  * **Infrastructure**: Routes, licenses, specialist hires.

**Asset Categories**

* **Transport Assets**: High cost, generate revenue via routes.  
* **Storage Assets**: Support inventory management, reduce spoilage risks.  
* **Support Assets**: Provide bonuses (e.g., specialists for efficiency).  
* **Financial Assets**: Loans, insurance for risk management.

#### **2\. Route Construction System**

**Route Building System**

* **Connection Pieces**: Origin-destination pairs, with optional waypoints.  
* **Economic Simulation**: Routes calculate profit based on distance, cargo, risks.  
* **Optimization System**: AI companion suggests reroutes; player manual adjustments.  
* **Validation**: Routes must connect valid ports; check for capacity and conflicts.

**Route Performance Effects**

text  
CollapseWrap  
Copy  
`Basic Route: Base Profit = Distance × Cargo Value × Efficiency`

`Efficiency Modifiers: Ship Speed (+10%), Disaster Risk (-20%), Specialist Bonus (+5%)`

**Route Ratings**

* **Profitability**: Based on revenue minus costs.  
* **Risk**: Influenced by disasters, tariffs, events.  
* **Efficiency**: Tied to asset stats and AI training.

#### **3\. Economy System**

**Money Management**

* **Starting Cash**: $50,000 (standard mode) or Unlimited (sandbox).  
* **Income Sources**:  
  * Route completions.  
  * Auction wins.  
  * Market sales.  
* **Expenses**:  
  * Asset purchases/upgrades.  
  * Maintenance and salaries.  
  * Loan interest.

**Pricing Strategy**

* **Dynamic Markets**: Goods prices fluctuate with supply/demand.  
* **Contracts**: Lock in deals for stable income.  
* **Hedging**: Insurance against disasters.

#### **4\. Route Network System**

**Logistics Network**

* **Route Types**: Sea, air, hybrid.  
* **Connection Options**: Direct or multi-leg paths.  
* **Connectivity**: All assets must link to routes for revenue.  
* **Pathfinding**: AI simulates optimal cargo flow; players visualize flows on map.

**Network Features**

* **Assignment Queues**: Ships queue for high-demand routes.  
* **Upgrades**: Add modules for better performance.  
* **Elevation/Adaptation**: Handle "terrain" like weather or geopolitics via modifiers.

#### **5\. AI Companion Simulation**

**AI Behavior**

* **Needs**: Training data from routes (profits, disasters).  
* **Preferences**: Risk tolerance, focus areas (e.g., high-growth).  
* **Satisfaction**: Improves with levels; risk of espionage if mismanaged.  
* **AI Progression**: Novice to Master levels.

**AI Types**

* **Predictive**: Analyzes trends.  
* **Optimizer**: Suggests actions.  
* **Autonomous**: Provides passive bonuses.

### **Game Modes**

#### **1\. Challenge Mode**

* **Limited Resources**: Start with $50,000, manage debt.  
* **Objectives**: Achieve net worth milestones, market dominance.  
* **Unlockable Content**: Advanced assets via progression.  
* **Difficulty Scaling**: Increasing disasters, competition.

#### **2\. Free Play Mode**

* **Unlimited Cash**: Focus on creative empire building.  
* **All Content Available**: Full access to assets and markets.  
* **No Objectives**: Sandbox for experimentation.  
* **Simulation**: Test economies without failure risks.

#### **3\. Multiplayer Mode**

**Cooperative Mode (Up to 10 Players)**

* **Shared World**: All players affect global market.  
* **Shared Economy**: Indirect competition via supply/demand.  
* **Role Specialization**: Focus on regions or goods.  
* **Collaborative Events**: Joint auctions, crisis responses.  
* **Real-time Sync**: See rival routes on map.  
* **Shared Vision**: Build competing empires in one world.

**Single Player Mode**

* **Solo Experience**: AI rivals simulate multiplayer.  
* **Learning Mode**: Tutorials for mechanics.  
* **Creative Freedom**: No external competition.

### **Progression System**

#### **Unlock Progression**

* **Tier 1**: Basic ships, simple routes, core goods.  
* **Tier 2**: Advanced assets, specialists, complex markets.  
* **Tier 3**: Unique licenses, AI upgrades, global events.  
* **Tier 4**: Mega assets, monopoly mechanics.

#### **Achievement System**

* **Building Achievements**: "Own 10 Ships".  
* **Economic Achievements**: "Earn $1M in One Quarter".  
* **Route Achievements**: "Complete 100 Routes".  
* **Crisis Achievements**: "Survive 5 Disasters".

### **Day/Night Cycle**

#### **Time Progression**

* **Quarter Length**: 5 minutes real-time \= 1 game quarter.  
* **Operating Hours**: Continuous, but markets fluctuate.  
* **Night Operations**: Reduced visibility, higher risks.  
* **Seasonal Changes**: Demand shifts, weather events.

#### **Visualization System**

* **Dynamic Map**: Routes animate with time.  
* **Market Updates**: Real-time via Supabase.  
* **Effects**: Disaster visuals, market pulses.

### **User Interface Design**

#### **Dashboard Interface**

* **Market Browser**: Tabs for goods, assets, labor, capital.  
* **Toolbar**: Quick access to routes, AI, alerts.  
* **Radial Menu**: Context for map objects.  
* **Ghost Placement**: Preview routes/assets.  
* **Analytics Tools**: Graphs for profits, trends.

#### **Information Panels**

* **Empire Overview**: Cash, net worth, assets.  
* **Route Details**: Profit, risks, performance.  
* **AI Feedback**: Suggestions, training status.  
* **Financial Reports**: Income/expense trends.

#### **Camera Controls**

* **Isometric Camera**: Pan around map.  
* **Zoom**: Smooth from global to detail.  
* **Pan**: Drag to navigate.  
* **Presets**: Focus on ports, routes.

### **Multiplayer Experience**

#### **Collaboration Features**

* **Real-time Updates**: See rival actions via Realtime.  
* **Chat System**: In-game notifications.  
* **Shared Cursor**: Highlight auctions/events.  
* **Permission System**: N/A (indirect competition).

#### **Competition Features**

* **Market Influence**: Actions affect prices.  
* **Poaching**: Steal specialists.  
* **Comparison Tools**: Leaderboards.  
* **Spectator Mode**: View public empires.

### **Quality of Life Features**

#### **Management Assistance**

* **Auto-Assign**: Suggest asset placements.  
* **Reroute Tools**: Quick disaster responses.  
* **Copy/Paste**: Duplicate routes.  
* **Templates**: Save empire setups.

#### **Management Tools**

* **Bulk Operations**: Manage multiple assets.  
* **Search/Filter**: Find routes/goods.  
* **Undo/Redo**: Reverse actions.  
* **Save States**: Checkpoint progress.

### **Visual Style & Atmosphere**

#### **Art Direction (RCT-Inspired with Modern Twist)**

* **Colorful & Vibrant**: Saturated map, animated ships.  
* **Detailed Environments**: Ports with pulsing icons.  
* **Modern 2D Rendering**: Phaser effects.  
* **Stylized Realism**: Abstracted world map.  
* **Theme Consistency**: Logistics-themed UI.  
* **Architectural Variety**: Port themes (industrial, eco).  
* **Environmental Storytelling**: Disasters with visuals.

#### **Animation & Effects**

* **Route Animations**: Moving ship sprites.  
* **Market Movement**: Pulsing demand icons.  
* **Environmental Effects**: Storms, tariffs as overlays.  
* **Particle Effects**: Cargo loading, explosions.

### **Accessibility Features**

#### **Visual Accessibility**

* **Color Modes**: High-contrast options.  
* **Visual Indicators**: Icons for all states.

#### **Control Accessibility**

* **Keyboard Shortcuts**: Full navigation.  
* **Mouse Sensitivity**: Adjustable zoom/pan.  
* **One-Click Actions**: Streamlined menus.  
* **Pause Function**: Control time speed.

### **Replayability Factors**

#### **Varied Challenges**

* **Different Objectives**: Scenarios like "Green Empire".  
* **Random Events**: Disasters, crises.  
* **Community Content**: Shared empires.  
* **Seasonal Events**: Timed auctions.

#### **Creative Expression**

* **Unlimited Possibilities**: Custom routes.  
* **Sharing System**: Export empires.  
* **Screenshot Tools**: Capture maps.  
* **Analytics Recording**: Review simulations.

