**Flexport:** **Strategic** **Audit** **&** **Development** **Roadmap**

**Section** **1:** **State** **of** **the** **Project:** **A**
**Comprehensive** **Architectural** **and** **Systems** **Audit**

This section presents a comprehensive audit of the Flexport project's
current state. It analyzes the existing architecture, assesses the
implementation status of core gameplay systems by cross-referencing the
codebase with design documents, and identifies key discrepancies that
inform the strategic path forward.

**1.1** **Architectural** **Overview** **and** **Data** **Flow**

The project's architecture is a sophisticated hybrid model combining a
Next.js frontend for user interface (UI) and high-level application
logic with a Phaser.js canvas for real-time game world rendering. This
structure is supported by a Supabase backend for data persistence,
real-time events, and server-side logic. The data flow between these
components is well-defined and follows modern web development practices.

> ● **Application** **Structure:** The project adheres to the
> organization outlined in FOLDER_STRUCTURE.md.1 The
>
> /app directory contains the Next.js App Router structure, serving as
> the entry point for the user. The /src directory correctly isolates
> the client-side game application, including the central Zustand store
> (src/store/empireStore.ts), client-side services
> (src/services/supabase.ts), and the game's UI components
>
> (src/components/game/). The /scenes directory houses the core Phaser
> scenes, and /components contains the top-level React components that
> bridge the Next.js and Phaser environments (GameUI.tsx,
> GameCanvas.tsx).1
>
> ● **State** **Management:** The primary locus of game state is the
> central Zustand store located at src/store/empireStore.ts. This store
> is robust, managing player data,
>
> asset definitions, placed assets, game session state, and more, while
> leveraging middleware for persistence and immutability. However,
> several other Zustand stores exist within the /app/store/ directory,
> such as useEconomyStore.ts and useMarketStore.ts. This indicates a
> potential for state fragmentation, a critical point that will be
> addressed in the strategic recommendations.
>
> ● **Data** **Flow:** The flow of information is logical:
>
> 1\. **UI** **to** **State:** User interactions in the React UI (e.g.,
> AssetPlacementUI.tsx) trigger actions within the Zustand stores.
>
> 2\. **State** **to** **Backend:** Store actions then call services
> (e.g., src/services/supabase.ts) to persist changes to the Supabase
> database.
>
> 3\. **State** **to** **Game** **World:** The Phaser scene
> (WorldMapScene.ts) subscribes to changes in the Zustand store via
> "bridge" utilities (e.g., assetBridge.ts) to update the visual
> representation of the game world.
>
> 4\. **Backend** **to** **State:** Server-side events, triggered by
> Supabase Edge Functions (simulate-economy, update-market-cycle), push
> updates via Supabase Realtime, which are then captured by client-side
> listeners (src/store/realtime/multiplayer.ts) to update the Zustand
> store, ensuring the game world feels alive and dynamic.
>
> ● **Backend** **Integration:** The Supabase backend is
> well-established, with a mature database schema defined across seven
> migration files (001 to 007).1 These migrations cover players, assets,
> routes, a detailed market system, and a comprehensive AI companion
> system. The use of Row Level Security (RLS) policies and stored
> procedures demonstrates a commitment to a secure and scalable backend
> architecture.

**1.2** **Core** **Gameplay** **Loop** **Analysis:** **Purchase**
**-\>** **Create** **-\>** **Assign** **-\>** **Generate**

The primary gameplay loop, as outlined in the DEVELOPMENT_PLAN.md 1, is
partially functional. Analyzing the code reveals the status of each
stage:

> ● **Purchase** **Asset** **(Implemented** **and** **Functional):** The
> asset acquisition flow is complete. A player can select an asset in
> the AssetPlacementUI.tsx, see a preview on the map via
> AssetPreview.tsx, and place it. The placeAsset action in
> empireStore.ts correctly deducts cash from the player's balance and
> persists the new asset to the database via assetService.
>
> ● **Create** **Route** **(Partially** **Implemented):** The foundation
> for route creation exists. The RouteManager.tsx component provides a
> UI, and the useRouteStore.ts
>
> manages route data. However, the UI currently relies on mock data. The
> routeBridge.ts is in place to connect the UI to the Phaser canvas, but
> the visual drawing of routes in WorldMapScene.ts is not yet
> implemented.
>
> ● **Assign** **Asset** **(Partially** **Implemented):** The data model
> supports assigning assets to routes (as seen in the database schema
> 001_initial_schema.sql 1). The assignAssetToRoute action is defined in
> empireStore.ts. However, the UI in RouteManager.tsx to perform this
> assignment is not yet connected to the store's logic.
>
> ● **Generate** **Revenue** **(Functionally** **Implemented** **but**
> **requires** **deeper** **integration):** The useRevenueGeneration.ts
> hook and the underlying revenueService.ts are implemented. The service
> can calculate revenue based on active routes. However, these
> calculations currently use simplified, placeholder values (e.g., a
> static profitability.revenue on the route object) rather than
> dynamically calculating profit based on the cargo, asset eficiency,
> and live market prices. The loop is functional but lacks the economic
> depth envisioned in the design documents.

**1.3** **System-by-System** **Breakdown**

The following table provides a granular assessment of each major game
system, comparing its implementation status against the design goals.

**Table** **1:** **System** **Implementation** **Status**

||
||
||
||

||
||
||
||
||
||

||
||
||
||
||

**1.4** **Documentation-Code** **Discrepancy** **Analysis**

A thorough review of the documentation reveals several areas where the
written plans have diverged from the implemented code.

> ● **ERD** **Flexport.md:** The Entity-Relationship Diagram is a solid
> starting point but is now outdated. It does not reflect the detailed
> schemas introduced in migrations 005 (Market System), 006 (AI
> Companion System), and 007 (Enhanced Assets).1 Key tables like
>
> market_items, ai_companions, and their various related tables are
> absent from the diagram.
>
> ● **DEVELOPMENT_PLAN.md:** This document is no longer an accurate
> reflection of the project's status. It lists the "Core Game HUD" as
> the current task, a milestone that has been largely surpassed. The
> project has moved significantly into Phase 2, with foundational
> systems for asset acquisition and revenue generation already in place.
>
> ● **Game** **Design** **Document** **-** **Flexport.md:** This
> high-level vision document remains largely relevant. However, its
> broad descriptions now need to be updated with the specific details of
> what has been implemented. For instance, the "Live Global Economy"
> pillar is described, but the current implementation in
> MarketTradingPanel.tsx is disconnected from this vision due to its
> reliance on mock data.
>
> ● **CSDD** **Flexport.md:** As the most detailed design document, the
> CSDD serves as an excellent blueprint. The main discrepancy is that
> many of the advanced formulas and systems it describes (e.g., complex
> profit calculations, detailed disaster logic, AI betrayal mechanics)
> have been implemented in the code as simpler, placeholder versions.
> This is a normal part of iterative development but highlights the next
> steps needed to add depth to the simulation.

The primary source of the "disconnect" you've identified stems from the
development process itself. Several key UI components
(FinancialDashboard.tsx, MarketTradingPanel.tsx, RouteManager.tsx) were
clearly developed as isolated prototypes. To build the UI and test its
functionality, developers created internal mock data. This is a fast and
effective way to build UI in parallel. However, the project is now at
the crucial integration stage where these isolated silos must be
connected to the central Zustand stores (empireStore, useEconomyStore,
useMarketStore) to consume and manipulate live game data. The current
friction arises because this plumbing work is incomplete. Before adding
new features, the highest priority must be to refactor these components,
remove all mock data, and connect them to the single source of truth
provided by the state management stores.

**Section** **2:** **The** **Definitive** **Game** **Design**
**Document** **(GDD)** **-** **Version** **2.0**

This document serves as the canonical source of truth for the design and
mechanics

of Flexport. It synthesizes all existing documentation and reflects the
current state of implementation while laying out the complete vision for
the game.

**2.1** **Core** **Vision** **&** **Gameplay** **Pillars**

Flexport is a strategic tycoon game where players build a global
shipping empire by managing assets, optimizing logistics, and navigating
a live global economy. The gameplay is built on three core pillars:

> 1\. **Pillar** **1:** **Capital** **&** **Asset** **Management:** The
> "build" phase of the game. This involves the strategic acquisition,
> placement, and upgrading of a diverse portfolio of assets, including
> ships, planes, and warehouses. Success is determined by eficient
> capital allocation and maximizing the value of every asset.
>
> 2\. **Pillar** **2:** **Dynamic** **Logistics** **&** **Route**
> **Optimization:** The "design" phase. This is the strategic heart of
> the game, where players create and manage eficient and profitable
> trade routes on a dynamic, interactive world map. This pillar
> challenges the player's ability to solve complex logistical puzzles in
> a constantly changing environment.
>
> 3\. **Pillar** **3:** **Navigating** **the** **Live** **Global**
> **Economy:** The "react" phase. Players must adapt to a simulated
> global economy driven by supply and demand, unpredictable events, and
> competitive pressure. This pillar tests the player's strategic
> foresight and ability to react to emergent opportunities and threats.

**2.2** **The** **World** **of** **Flexport:** **An** **Interactive**
**Canvas**

The game world is presented as a stylized, isometric 2D map, rendered by
the Phaser.js engine.1 This map is the player's primary canvas for
interaction, featuring a full day/night cycle and weather effects that
have direct gameplay implications.

**2.2.1** **Ports:** **The** **Nodes** **of** **Global** **Trade**

Ports are the central nodes of the game. They are not static icons but
dynamic entities

with unique properties that drive strategic decisions. The game will
launch with **20** **key** **global** **ports**, selected based on their
real-world 2024 container throughput, ensuring an authentic and
strategically rich starting environment.2 The initial ports include
global powerhouses like Shanghai, Singapore, Ningbo-Zhoushan, Shenzhen,
Rotterdam, and Los Angeles.

The selection of these specific, real-world ports grounds the gameplay
in authentic global trade patterns. This is more strategically
compelling than a map of fictional locations, as players can leverage
their understanding of real-world geography and economics.

**2.2.2** **Port** **Interaction** **and** **Level** **of** **Detail**
**(LOD)**

To create a more immersive and interactive experience, ports will
feature a dynamic Level of Detail (LOD) system tied to the camera's zoom
level.

> ● **Global** **View** **(Zoom** **\<** **1.5x):** From a distance,
> ports are represented by clear, concise icons on the world map.
> Hovering over an icon will display a tooltip with essential
> information: the port's name, country, and the top-demanded commodity.
> This allows for quick strategic assessment of the global economic
> landscape.
>
> ● **Detailed** **View** **(Zoom** **≥** **1.5x):** As the player zooms
> in on a specific port, the game will seamlessly transition to a
> detailed view. The simple icon will be replaced by a rich, 2D
> sprite-based scene depicting that port's unique infrastructure. This
> view will include animated elements like cranes (using assets like
> crane.png 1), docks, and warehouses. Crucially, any player-owned
> assets currently located at that port (e.g., docked ships, constructed
> warehouses) will be visually represented within this scene, providing
> a tangible sense of ownership and progress. This feature directly
> addresses the need for ports to feel more realistic and reactive to
> player interaction.

**2.3** **Core** **Systems** **Explained**

**2.3.1** **Asset** **Management** **&** **Logistics**

Players build their empire by purchasing and managing a variety of
assets, each defined in detailed JSON files.1

> ● **Asset** **Types:**
>
> ○ **Ships:** The backbone of sea freight, including container vessels
> and tankers (ships.json).
>
> ○ **Planes:** For high-speed, long-range air freight (planes.json).
>
> ○ **Warehouses:** Storage and distribution centers that can provide
> area-of-effect bonuses to nearby assets (warehouses.json,
> AreaEffectIndicator.tsx).
>
> ○ **Infrastructure:** Abstract assets like trade route licenses and
> logistics specialists that provide passive bonuses
> (infrastructure.json).
>
> ● **Asset** **Properties:** Each asset is defined by its cost,
> maintenanceCost, capacity, speed, and eficiency. Furthermore, assets
> have requirements, such as minimum player level or specific licenses,
> creating a clear progression path for the player.

**2.3.2** **Route** **Creation** **&** **Optimization**

Players create trade routes by connecting two ports on the world map.

> ● **Route** **as** **an** **Asset:** Routes themselves are a form of
> infrastructure that can be purchased and upgraded (e.g., "Basic Sea
> Route" vs. "Premium Sea Route").1
>
> ● **Assignment** **and** **Eficiency:** Players assign their transport
> assets (ships and planes) to these routes. The overall profitability
> and eficiency of a route are determined by a combination of the
> route's intrinsic properties and the stats of the assigned assets.

**2.3.3** **The** **Live** **Global** **Economy** **&** **Market**
**Simulation**

The game's economy is driven by the supply and demand of various
**Goods**. These goods are initially defined in useEconomyStore.ts and
will be mapped to the

real-world specializations of the in-game ports to create an authentic
economic

simulation.

For example, real-world trade data shows that the Port of Guangzhou is a
major exporter of electronics and textiles, while the Port of Long Beach
is a key import hub for furniture and apparel and an export hub for
petroleum coke and waste paper.3 This real-world data will be used to
create asymmetric market conditions within the game. A port's status as
a major exporter of a good will translate to high local supply and lower
prices, while its status as a major importer will mean high local demand
and higher prices. This makes port selection and route design a deep
strategic challenge.

Market prices are not static. They will fluctuate based on a backend
simulation (supabase/functions/simulate-economy/index.ts 1) that models
global supply and demand, influenced by player actions and unpredictable
global events. Players engage with this market through the

MarketTradingPanel.tsx UI.1

**2.4** **Supporting** **Systems** **Deep** **Dive**

> ● **The** **Player-Trained** **AI** **Companion:** The AI companion
> acts as a logistics advisor, providing suggestions on profitable
> routes and market trends.1 It learns from the player's successes and
> failures, leveling up according to the configurations in
> types/ai-companion.ts to provide more advanced and accurate insights
> over time.
>
> ● **Time,** **Events,** **and** **Disasters:** An accelerated time
> system, managed by timeStore.ts, propels the game forward through
> quarters and years.1 This system triggers both predictable
>
> SEASONAL_EVENTS (like a "Holiday Rush" in Q4 increasing demand) and
> unpredictable random events like port strikes or natural disasters,
> forcing players to adapt their strategies.
>
> ● **Player** **Progression** **and** **Financials:** Players gain
> experience for completing routes and making profitable trades,
> allowing them to level up and unlock more advanced assets and
> abilities. Their financial health is tracked through detailed reports,
> accessible via the FinancialReport.tsx component, which visualizes key
> metrics like revenue, expenses, and net worth.1

**2.5** **Technical** **Architecture** **Blueprint** **&** **Updated**
**ERD**

The game's architecture facilitates a seamless flow of data between the
user interface, state management, and backend services.

**High-Level** **Data** **Flow:**

> 1\. **Player** **Action:** A user interacts with the React UI.
>
> 2\. **State** **Update:** The interaction triggers an action in a
> Zustand store.
>
> 3\. **Backend** **Persistence:** The store action calls a Supabase
> service to persist the change in the PostgreSQL database.
>
> 4\. **Visual** **Feedback:** The change in the Zustand store is
> observed by both the React UI and the Phaser canvas, which update to
> reflect the new state.
>
> 5\. **Global** **Event:** A backend Supabase Edge Function triggers a
> global event (e.g., a market price change).
>
> 6\. **Real-time** **Push:** The event is pushed to all connected
> clients via Supabase Realtime.
>
> 7\. **State** **Synchronization:** The client's listeners update the
> Zustand store with the new information, ensuring a live, synchronized
> world for all players.

**Updated** **Entity-Relationship** **Diagram** **(ERD):**

The following diagram reflects the current, comprehensive database
schema, including all tables and relationships defined in migrations 001
through 007.1

> Code snippet

||
||
||
||
||
||
||
||
||

||
||
||
||

||
||
||
||
||
||
||
||
||
||
||
||
||
||

||
||
||
||
||
||
||
||
||

||
||
||
||
||
||
||
||
||
||
||
||

||
||
||
||
||
||
||
||

> }

||
||
||
||
||
||
||
||
||

||
||
||
||
||
||
||
||
||

> PLAYER \|

||
||
||
||

||
||
||
||

||
||
||
||

||
||
||
||
||

||
||
||
||

||
||
||
||

\|--o{ AI_SUGGESTIONS : gives

**Section** **3:** **The** **Strategic** **Path** **Forward:** **A**
**Restructured** **Development** **Plan**

This section outlines a revised, actionable development plan that
addresses the current state of the project, prioritizes critical
integration work, and provides a clear roadmap for implementing new
features. It replaces the outdated DEVELOPMENT_PLAN.md.1

**3.1** **Phase** **2.0:** **Consolidation** **&** **Integration**
**(Immediate** **Priority)**

**Objective:** The foremost priority is to resolve the "disconnect"
identified in the project audit. This phase focuses on eliminating
technical debt and integrating the existing, siloed prototype components
into a cohesive, data-driven whole. Completing this phase is essential
for creating a stable foundation for all future development.

> ● **Task** **1:** **Unify** **State** **Management.**
>
> ○ **Action:** Refactor the various Zustand stores to establish a
> clear, hierarchical state management architecture.
>
> ○ **Implementation:** empireStore.ts will remain the single source of
> truth for high-level player and session state. The specialized stores
> (useRouteStore, useMarketStore, useEconomyStore) will be treated as
> modules. empireStore will subscribe to their states to reflect global
> changes, eliminating redundant state variables like marketPrices and
> ensuring data consistency.
>
> ● **Task** **2:** **Connect** **UI** **Panels** **to** **Live**
> **Data.**
>
> ○ **Action:** Remove all mock data from UI components and connect them
> to their respective Zustand stores.
>
> ○ **Implementation:**
>
> ■ Modify MarketTradingPanel.tsx to fetch and display items from
> useMarketStore. All trade actions must call the appropriate buyItem or
> sellItem actions in the store.
>
> ■ Modify FinancialDashboard.tsx to derive all its data and charts from
>
> useEconomyStore.
>
> ■ Modify RouteManager.tsx to display and manage routes from
> useRouteStore.
>
> ● **Task** **3:** **Deprecate** **Legacy** **Asset** **Structure.**
>
> ○ **Action:** Fully transition from the old, categorized asset
> structure to the new, unified placedAssets map.
>
> ○ **Implementation:** Remove the assets: { ships: {}, planes: {},... }
> object from the EmpireState interface in empireStore.ts. Update all
> components that might reference this old structure, such as the
> placeholder FleetPanel in GameUI.tsx, to use the placedAssets:
> Map\<string, PlacedAsset\> and the associated helper selectors
> (getAssetsByType, getAssetsAtPort).

**3.2** **Phase** **2.5:** **Bringing** **Ports** **to** **Life**
**(User-Requested** **Feature)**

**Objective:** To implement the dynamic, realistic, and interactive
ports that are a top priority for the project's vision. This phase can
begin in parallel with Phase 2.0 but depends on its completion for full
integration.

> ● **Task** **1:** **Implement** **Dynamic** **Zoom** **&** **Level**
> **of** **Detail** **(LOD)** **System.**
>
> ○ **Action:** Develop the camera and rendering logic to switch between
> a global map view and a detailed port view.
>
> ○ **Implementation:** Implement the zoom detection and conditional
> rendering logic in WorldMapScene.ts as detailed in Section 4.2. This
> involves creating Phaser Layers for each port's detailed view and
> toggling their visibility based on camera zoom and position.
>
> ● **Task** **2:** **Curate** **and** **Integrate** **Real-World**
> **Port** **Data.**
>
> ○ **Action:** Research and integrate authentic trade data to make the
> in-game economy more realistic.
>
> ○ **Implementation:** Create the ports.json data file based on
> research.2 Update the
>
> PortNode type definition and integrate this data into the game's map
> generation and economy simulation, influencing local supply and demand
> as detailed in Section 4.1.
>
> ● **Task** **3:** **Implement** **Visual** **Route** **&** **Ship**
> **Movement.**
>
> ○ **Action:** Provide visual feedback for active trade routes.
>
> ○ **Implementation:** In WorldMapScene.ts, implement the logic to
> render animated routes and move PlacedAsset sprites along their
> assigned paths
>
> using Phaser Tweens, giving players a visual representation of their
> logistics network in action.

**3.3** **Revised** **Phase** **3:** **Deepening** **World**
**Dynamics**

**Objective:** With a stable and integrated foundation, this phase
focuses on adding layers of strategic depth and unpredictability to the
game world.

> ● **Task** **1:** **Implement** **Advanced** **Markets.**
>
> ○ **Action:** Build out the Capital and Labor markets as defined in
> the CSDD.1 ○ **Implementation:** Develop the UI and backend logic for
> players to take out
>
> loans, manage debt, and hire specialists who provide empire-wide
> bonuses. ● **Task** **2:** **Implement** **Full** **Disaster**
> **System.**
>
> ○ **Action:** Connect the frontend to the backend disaster event
> system.
>
> ○ **Implementation:** Create visual effects in Phaser for disasters
> (e.g., storm animations) and implement their gameplay consequences,
> such as route blockages, asset damage, and market volatility.
>
> ● **Task** **3:** **Enhance** **AI** **Companion** **Learning.**
>
> ○ **Action:** Evolve the AI from a simple advisor to a true learning
> companion. ○ **Implementation:** Flesh out the learnFromRoute and
> updateMarketInsights
>
> functions in useAIStore.ts. The AI should now perform genuine analysis
> on the live route and market data to generate more nuanced and
> valuable suggestions.

**3.4** **Revised** **Phase** **4:** **Advanced** **Gameplay** **&**
**Multiplayer** **Polish**

**Objective:** To introduce end-game content, direct competitive
features, and a final layer of polish.

> ● **Task** **1:** **Implement** **Real-time** **Auctions.**
>
> ○ **Action:** Create a system for players to bid against each other
> for unique assets.
>
> ○ **Implementation:** Build the UI for the auction system, connecting
> it to the manage-auction Edge Function and the real-time events
> defined in multiplayer.ts.1
>
> ● **Task** **2:** **Implement** **Direct** **Multiplayer**
> **Interaction.** ○ **Action:** Increase the sense of a shared world.
>
> ○ **Implementation:** Add the ability to view rival players' assets
> (in a read-only capacity) on the world map. Implement global
> leaderboards for metrics like net worth and total cargo moved.
>
> ● **Task** **3:** **Full** **Audio-Visual** **Polish.**
>
> ○ **Action:** Refine the game's presentation to a commercial standard.
>
> ○ **Implementation:** Integrate a full suite of sound effects and
> ambient music. Refine all UI elements with micro-interactions and
> animations. Conduct extensive playtesting to balance gameplay and
> smooth out the user experience.

**Section** **4:** **Implementation** **Deep** **Dive:** **A**
**Technical** **Guide** **for** **the** **AI** **Editor**

This section provides granular, step-by-step instructions for the
highest-priority tasks identified in the strategic plan. It is designed
to be directly actionable by a developer or an advanced AI coding
assistant.

**4.1** **Engineering** **Realistic** **Ports**

The goal is to replace the current placeholder port system with one
grounded in real-world trade data, making port selection a core
strategic decision.

**4.1.1** **Data** **Sourcing** **&** **Curation**

The foundation of this feature is authentic data. The following steps
outline how to structure and integrate this data.

> 1\. **Identify** **Key** **Ports:** Based on 2024 container throughput
> data, the top 20 global ports will be the initial set in the game.
> This list includes Shanghai, Singapore,
>
> Ningbo-Zhoushan, Shenzhen, Qingdao, Guangzhou, Busan, Tianjin, Jebel
> Ali (Dubai), Port Klang, Rotterdam, Hong Kong, Antwerp-Bruges, Tanjung
> Pelepas, Xiamen, Los Angeles, Tanger Med, Long Beach, Laem Chabang,
> and Kaohsiung.2
>
> 2\. **Curate** **Trade** **Data:** For each port, research its primary
> imports and exports using the provided trade data sources.12 Map these
> real-world goods to the game's existing commodity types (e.g.,
> "Electronics", "Automobiles", "Crude Petroleum", "Textiles", "Food").
>
> 3\. **Create** **Port** **Definition** **File:** Create a new file at
> /app/assets/definitions/ports.json. This file will contain an array of
> PortDefinition objects.
>
> 4\. **Structure** **ports.json:** Each object in the array should
> follow this structure, populated with the curated data:

,

"majorImports": \["electronics", "crude_petroleum", "iron_ore", "gold"\]
},

{

"id": "port-singapore", "name": "Port of Singapore", "country": "SG",
"realWorldTEU": 41124100,

"location": { "lat": 1.29, "lon": 103.85 },

"majorExports": \["refined_petroleum", "machinery", "electronics"\],
"majorImports": \["crude_petroleum", "machinery", "electronics"\]

} \]

\`\`\`

**4.1.2** **Data** **Model** **&** **Integration**

> 1\. **Update** **Type** **Definition:** Modify the PortNode interface
> in /app/lib/types/assets.ts to include the new fields: country:
> string, realWorldTEU: number, location: { lat: number, lon: number },
> majorExports: string, and majorImports: string.
>
> 2\. **Load** **Port** **Definitions:** In /app/lib/assetLoader.ts,
> refactor getMockPortNodes into a new function, loadPortDefinitions,
> that reads and parses the new ports.json file.
>
> 3\. **Integrate** **into** **Economy:** In useEconomyStore.ts, enhance
> the updateMarketPrices function. The logic should now use the
> port-specific data.
>
> For any given good, its totalSupply in the market simulation should be
> significantly higher in ports where it is listed as a majorExport.
> Conversely, its totalDemand should be higher in ports where it is a
> majorImport. This will create the desired asymmetric market conditions
> that drive strategic gameplay.

**4.2** **Implementing** **Dynamic** **Zoom** **&** **Level** **of**
**Detail** **(LOD)** **in** **Phaser**

This feature is critical for creating an interactive and visually
rewarding map experience. The chosen implementation strategy prioritizes
performance by using Phaser Layers for manual culling.

This approach is superior to alternatives. Simply toggling visibility on
thousands of individual sprites for all 20 ports would cause significant
performance degradation.5 Managing 20 separate Phaser

Scenes would be overly complex and memory-intensive.7 Using Phaser

Layers 9 provides a lightweight grouping mechanism that allows for
toggling the visibility of an entire detailed port view with a single
command, which is highly eficient.

**4.2.1** **Technical** **Implementation** **Steps**

> 1\. **Create** **Layers** **in** **WorldMapScene.ts:**
>
> ○ In the create method, after initializing the map, create a Map to
> hold the detail layers: this.portDetailLayers = new Map\<string,
> Phaser.GameObjects.Layer\>();.
>
> ○ Iterate through the loaded port definitions. For each port, create a
> new layer (this.add.layer()) and add it to the map, keyed by the
> port's ID.
>
> ○ Set all newly created layers to be invisible by default:
> layer.setVisible(false);. 2. **Populate** **Layers:**
>
> ○ For each port, add its detailed sprites (docks, cranes, warehouses)
> to its corresponding layer. These should be positioned relative to the
> port's center. These sprites will be static for now but can be
> animated later.
>
> 3\. **Implement** **Zoom/Pan** **Logic** **in** **update:**
>
> ○ In the update method of WorldMapScene.ts, add the core LOD logic.
> This
>
> method is called on every frame, allowing for real-time responsiveness
> to camera changes.

||
||
||
||

> private activeDetailLayer: Phaser.GameObjects.Layer \| null = null;
> private activePortMarker: Phaser.GameObjects.Image \| null = null;

||
||
||
||

||
||
||
||

||
||
||
||
||

||
||
||
||
||

||
||
||
||
||
||
||

||
||
||
||
||

||
||
||
||

||
||
||
||
||
||
||
||
||
||
||

||
||
||
||
||
||
||
||
||

> 4\. **Implement** **Helper** **Functions:**
>
> ○ Create the findPortAt(worldX, worldY) helper function. This function
> will iterate through this.portNodes and use
> Phaser.Math.Distance.Between to find the port marker closest to the
> center of the camera's viewport. It should return the PortNode object
> if one is within a reasonable threshold, otherwise null.
>
> ○ Create the renderAssetsOnPortLayer(portId, layer) helper function.
> This function will:
>
> ■ Get all placedAssets from empireStore where asset.portId === portId.
> ■ Use an **object** **pool** for performance.10 Create a
>
> Phaser.GameObjects.Group for each type of asset sprite (e.g., ships,
> warehouses).
>
> ■ For each asset at the port, get a sprite from the pool (pool.get()),
> set its texture and position within the port's detailed view, and add
> it to the provided layer.
>
> ■ Keep track of active sprites on the layer to hide them when the view
> changes.

This implementation provides a clear and performant solution to the
user's request for dynamic, interactive ports, laying a strong
foundation for a more immersive and strategically deep gameplay
experience.

**4.3** **Curated** **Port** **Data** **for** **Initial**
**Implementation**

To accelerate development, the following table provides the curated data
for the top global ports, ready for integration into ports.json. This
data is synthesized from the analysis of real-world trade statistics.2

**Table** **2:** **Realistic** **Port** **Data** **for** **Initial**
**Implementation**

||
||
||
||
||
||
||
||
||
||
||

||
||
||
||
||
||
||
||
||
||

||
||
||
||
||
||
||

**Conclusions** **and** **Recommendations**

The Flexport project is in a strong but pivotal position. A significant
amount of foundational work has been completed, including a robust state
management system, a flexible hybrid rendering engine, and a
comprehensive backend schema. The primary challenge, and the source of
the developer's "disconnect," is the need to integrate several siloed,
prototyped UI components with the live data stores.

The path forward is clear and has been structured into a revised,
multi-phase

development plan.

**Immediate** **Recommendations:**

> 1\. **Prioritize** **Integration** **Over** **New** **Features:** The
> most critical next step is to execute **Phase** **2.0:**
> **Consolidation** **&** **Integration**. Refactoring the UI panels to
> use live data from the Zustand stores will resolve the current
> disconnect, stabilize the application, and provide a solid foundation
> for all future work.
>
> 2\. **Implement** **the** **Dynamic** **Port** **System:**
> Concurrently, begin work on **Phase** **2.5:** **Bringing** **Ports**
> **to** **Life**. This directly addresses the user's primary feature
> request and will provide the largest immediate improvement to gameplay
> depth and visual immersion. The technical plan outlined in Section 4
> provides a clear, performant path to achieving this.
>
> 3\. **Update** **All** **Documentation:** As these changes are
> implemented, it is imperative to update all related documentation
> (GDD, CSDD, ERD, DEVELOPMENT_PLAN). This will maintain a single source
> of truth and ensure that all team members, including the AI editor,
> are working from a consistent and accurate blueprint.

By following this strategic roadmap, the Flexport project can eficiently
transition from a collection of promising systems into a cohesive,
engaging, and deeply strategic game. The focus on integrating real-world
data and creating a more dynamic, interactive world will be key to
realizing the game's full potential.

**Works** **cited**

> 1\. latest_update_ports.txt
>
> 2\. Containers: 2024 ranking of the world's major ports - Market
> Insights, accessed July 16, 2025,
>
> [<u>https://market-insights.upply.com/en/containers-2024-ranking-of-the-worlds-ma</u>](https://market-insights.upply.com/en/containers-2024-ranking-of-the-worlds-major-ports)
> [<u>jor-ports</u>](https://market-insights.upply.com/en/containers-2024-ranking-of-the-worlds-major-ports)
>
> 3\. Guangzhou Import Guide: Products, Routes & Economic Insights,
> accessed July 16, 2025,
> [<u>https://www.sino-shipping.com/guangzhou-import-guide/</u>](https://www.sino-shipping.com/guangzhou-import-guide/)
>
> 4\. Facts at a Glance - Port of Long Beach, accessed July 16, 2025,
> [<u>https://polb.com/port-info/port-facts-faqs/</u>](https://polb.com/port-info/port-facts-faqs/)
>
> 5\. How I optimized my Phaser 3 action game — in 2025 \| by François
> ..., accessed July 16, 2025,
>
> [<u>https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-20</u>](https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b)
> [<u>25-5a648753f62b</u>](https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b)
>
> 6\. How I optimized my Phaser 3 action game — in 2025, accessed July
> 16, 2025,
> [<u>https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2</u>](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025)
> [<u>025</u>](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025)
>
> 7\. Scenes - What is Phaser?, accessed July 16, 2025,
> [<u>https://docs.phaser.io/phaser/concepts/scenes</u>](https://docs.phaser.io/phaser/concepts/scenes)

8\. Making your first Phaser Game, accessed July 16, 2025,
[<u>https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game</u>](https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game)

9\. Deprecated: Phaser 3 API Documentation - Class: Layer, accessed July
16, 2025,
[<u>https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Layer.html</u>](https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Layer.html)

10\. Object Pooling in Phaser 3 with Matter Physics - Ourcade Blog,
accessed July 16, 2025,

> [<u>https://blog.ourcade.co/posts/2020/phaser-3-optimization-object-pool-matter-js</u>](https://blog.ourcade.co/posts/2020/phaser-3-optimization-object-pool-matter-js-physics/)
> [<u>-physics/</u>](https://blog.ourcade.co/posts/2020/phaser-3-optimization-object-pool-matter-js-physics/)

11\. Object Pooling Sprites in a Phaser Game for Performance Gains - The
Polyglot Developer, accessed July 16, 2025,
[<u>https://www.thepolyglotdeveloper.com/2020/09/object-pooling-sprites-phaser-g</u>](https://www.thepolyglotdeveloper.com/2020/09/object-pooling-sprites-phaser-game-performance-gains/)
[<u>ame-performance-gains/</u>](https://www.thepolyglotdeveloper.com/2020/09/object-pooling-sprites-phaser-game-performance-gains/)

12\. China (CHN) Exports, Imports, and Trade Partners \| The Observatory
..., accessed July 16, 2025,
[<u>https://oec.world/en/profile/country/chn</u>](https://oec.world/en/profile/country/chn)

13\. Singapore - Trade, Manufacturing, Services \| Britannica, accessed
July 16, 2025,
[<u>https://www.britannica.com/place/Singapore/Trade</u>](https://www.britannica.com/place/Singapore/Trade)

14\. Port of Ningbo-Zhoushan - Smart Import and Customs, accessed July
16, 2025,
[<u>https://www.eezyimport.com/seaports/port-of-ningbo-zhoushan/</u>](https://www.eezyimport.com/seaports/port-of-ningbo-zhoushan/)

15\. Port of Ningbo-Zhoushan - Wikipedia, accessed July 16, 2025,
[<u>https://en.wikipedia.org/wiki/Port_of_Ningbo-Zhoushan</u>](https://en.wikipedia.org/wiki/Port_of_Ningbo-Zhoushan)

16\. Port of Shenzhen - Wikipedia, accessed July 16, 2025,
[<u>https://en.wikipedia.org/wiki/Port_of_Shenzhen</u>](https://en.wikipedia.org/wiki/Port_of_Shenzhen)

17\. OEC NON SPECIALIZED WHOLESALE, Philippines - \$3.55 Million Imports
and \$0.00 Exports - Market Inside, accessed July 16, 2025,
[<u>https://www.marketinsidedata.com/en/company/oec-non-specialized/9871010721</u>](https://www.marketinsidedata.com/en/company/oec-non-specialized/98710107214ce791bca55c51e0197046)
[<u>4ce791bca55c51e0197046</u>](https://www.marketinsidedata.com/en/company/oec-non-specialized/98710107214ce791bca55c51e0197046)

18\. Supply Chain Data Of Oec Group Qingdao Company Profile \| Trademo,
accessed July 16, 2025,

> [<u>https://www.trademo.com/companies/oec-group-qingdao/41170723</u>](https://www.trademo.com/companies/oec-group-qingdao/41170723)

19\. Hong Kong (HKG) Exports, Imports, and Trade Partners \| The ...,
accessed July 16, 2025,
[<u>https://oec.world/en/profile/country/hkg</u>](https://oec.world/en/profile/country/hkg)

20\. South Korea (KOR) Exports, Imports, and Trade Partners \| The ...,
accessed July 16, 2025,
[<u>https://oec.world/en/profile/country/kor</u>](https://oec.world/en/profile/country/kor)

21\. South Korean foreign trade in figures - Santandertrade.com,
accessed July 16, 2025,

> [<u>https://santandertrade.com/en/portal/analyse-markets/south-korea/foreign-trade</u>](https://santandertrade.com/en/portal/analyse-markets/south-korea/foreign-trade-in-figures)
> [<u>-in-figures</u>](https://santandertrade.com/en/portal/analyse-markets/south-korea/foreign-trade-in-figures)

22\. Port of Jebel Ali - Smart Import and Customs, accessed July 16,
2025,
[<u>https://www.eezyimport.com/seaports/port-of-jebel-ali/</u>](https://www.eezyimport.com/seaports/port-of-jebel-ali/)

23\. Malaysia (MYS) Exports, Imports, and Trade Partners \| The ...,
accessed July 16, 2025,
[<u>https://oec.world/en/profile/country/mys</u>](https://oec.world/en/profile/country/mys)

24\. Malaysia (MYS) Exports, Imports, and Trade Partners \| The
Observatory of Economic Complexity, accessed July 16, 2025,
[<u>https://oec.world/en/profile/country/mys%23historical-data</u>](https://oec.world/en/profile/country/mys%23historical-data)

25\. Belgium (BEL) Exports, Imports, and Trade Partners \| The ...,
accessed July 16,

> 2025,
> [<u>https://oec.world/en/profile/country/bel</u>](https://oec.world/en/profile/country/bel)

26\. Port of Xiamen - Smart Import and Customs, accessed July 16, 2025,
[<u>https://www.eezyimport.com/seaports/port-of-xiamen/</u>](https://www.eezyimport.com/seaports/port-of-xiamen/)

27\. Port of Kaohsiung - Smart Import and Customs, accessed July 16,
2025,
[<u>https://www.eezyimport.com/seaports/port-of-kaohsiung/</u>](https://www.eezyimport.com/seaports/port-of-kaohsiung/)

28\. Chinese Taipei (TWN) Exports, Imports, and Trade Partners \| The
Observatory of Economic Complexity, accessed July 16, 2025,
[<u>https://oec.world/en/profile/country/twn</u>](https://oec.world/en/profile/country/twn)

29\. Port of Long Beach - California Association of Port Authorities,
accessed July 16, 2025,
[<u>https://californiaports.org/ports/port-of-long-beach/</u>](https://californiaports.org/ports/port-of-long-beach/)

30\. New York (USA) Exports, Imports, and Trade Partners \| The
Observatory of Economic Complexity, accessed July 16, 2025,
[<u>https://oec.world/en/profile/subnational_usa/new-york</u>](https://oec.world/en/profile/subnational_usa/new-york)

31\. Germany (DEU) Exports, Imports, and Trade Partners \| The
Observatory of Economic Complexity, accessed July 16, 2025,
[<u>https://oec.world/en/profile/country/deu</u>](https://oec.world/en/profile/country/deu)

32\. Port of Laem Chabang - Smart Import and Customs, accessed July 16,
2025,
[<u>https://www.eezyimport.com/seaports/port-of-laem-chabang/</u>](https://www.eezyimport.com/seaports/port-of-laem-chabang/)

33\. Thailand Port List: Laem Chabang, Bangkok, Ranong, Songkhla -
TRADLINX Blogs, accessed July 16, 2025,

> [<u>https://blogs.tradlinx.com/thailand-port-list-laem-chabang-bangkok-ranong-son</u>](https://blogs.tradlinx.com/thailand-port-list-laem-chabang-bangkok-ranong-songkhla/)
> [<u>gkhla/</u>](https://blogs.tradlinx.com/thailand-port-list-laem-chabang-bangkok-ranong-songkhla/)

34\. ThaiLand - VICO Logistics, accessed July 16, 2025,
[<u>https://www.vico.com.hk/focused-market/ThaiLand</u>](https://www.vico.com.hk/focused-market/ThaiLand)

35\. Shanghai Port sees container throughput surge despite challenges,
accessed July 16, 2025,

> [<u>https://english.shanghai.gov.cn/en-Latest-WhatsNew/20250609/1ce1903b448042</u>](https://english.shanghai.gov.cn/en-Latest-WhatsNew/20250609/1ce1903b44804261b2913cd730121afe.html)
> [<u>61b2913cd730121afe.html</u>](https://english.shanghai.gov.cn/en-Latest-WhatsNew/20250609/1ce1903b44804261b2913cd730121afe.html)

36\. Antwerp-Bruges container throughput up 6.8% in 2024 - Kuehne +
Nagel, accessed July 16, 2025,

> [<u>https://mykn.kuehne-nagel.com/news/article/antwerpbruges-container-throughp</u>](https://mykn.kuehne-nagel.com/news/article/antwerpbruges-container-throughput-up-68-in-2-24-Oct-2024)
> [<u>ut-up-68-in-2-24-Oct-2024</u>](https://mykn.kuehne-nagel.com/news/article/antwerpbruges-container-throughput-up-68-in-2-24-Oct-2024)

37\. Port Authority of Thailand - IAPH, accessed July 16, 2025,
[<u>https://www.iaphworldports.org/iaph-md/directory/port_details/1979</u>](https://www.iaphworldports.org/iaph-md/directory/port_details/1979)

38\. New Jersey and New York: Price Movements of Top Exports and Other
Highlights, accessed July 16, 2025,

> [<u>https://www.bls.gov/mxp/publications/regional-publications/new-jersey-new-york</u>](https://www.bls.gov/mxp/publications/regional-publications/new-jersey-new-york-exports.htm)
> [<u>-exports.htm</u>](https://www.bls.gov/mxp/publications/regional-publications/new-jersey-new-york-exports.htm)
