# **Flexport: The Game Design Document**

Version: 3.0 (Consolidated Master Document)
Date: July 15, 2025

### **Section 1: Game Overview and Core Premise**

"Flexport: The Video Game" is a business simulation game where players build and manage a global logistics empire. Inspired by the strategic depth of *RollerCoaster Tycoon* and the real-world complexities of modern trade, the game challenges players to become the ultimate Logistics Mogul.

The player's role is not that of a simple freight forwarder, but of an entrepreneur who owns and operates the core assets of global trade: fleets of ships, fleets of planes, warehouses, and the staff required to run them. The objective is to navigate a dynamic, data-driven global economy, making strategic investments and optimizing trade routes to achieve market dominance before an evolving AI singularity renders human-run logistics obsolete.

The game is built on a foundation of real-world economic principles, using abstracted data from sources like the MIT OEC and Harvard Atlas to create a living world where player actions have tangible consequences on a global scale.

#### **Core Gameplay Loop**

The player's journey follows a classic tycoon progression, focused on a satisfying cycle of growth and optimization:

`Start Empire → Acquire Assets → Optimize Routes → Generate Revenue → Expand Operations → Repeat`

### **Section 2: The Three Core Mechanics**

The gameplay is built upon three interconnected pillars, mirroring the structure of classic tycoon games.

#### **Pillar 1: Asset & Capital Management (The "Tycoon" Engine)**

This pillar is about building the physical and financial foundation of your empire. It is the core resource management loop.

*   **Asset Acquisition & Management:** This is the primary gameplay verb. Players purchase, manage, and upgrade their income-generating assets.
    *   **Player Actions:**
        *   **Buy/Sell Assets:** Purchase ships, planes, and warehouses from the **Asset Market**. Each asset has unique stats (speed, capacity, fuel efficiency, maintenance cost).
        *   **Upgrade Assets:** Instead of free-form building, players purchase and install **pre-designed modules** to enhance assets. (e.g., install an "Eco-Engine" on a ship to reduce fuel costs, or an "Automated Sorting System" in a warehouse to increase throughput).
        *   **Participate in Auctions:** Compete against other players in real-time auctions for unique assets, licenses, or specialists.
    *   **Asset Types:**
        *   **Ships**: Container vessels, tankers for sea routes.
        *   **Planes**: Cargo aircraft for air routes.
        *   **Warehouses**: Storage facilities at ports.
        *   **Decorations**: Upgrades like eco-modules or automation systems.
        *   **Infrastructure**: Routes, licenses, specialist hires.
    *   **Asset Categories:**
        *   **Transport Assets**: High cost, generate revenue via routes.
        *   **Storage Assets**: Support inventory management, reduce spoilage risks.
        *   **Support Assets**: Provide bonuses (e.g., specialists for efficiency).
        *   **Financial Assets**: Loans, insurance for risk management.

*   **Financial Strategy:** The game features a robust economic engine where smart capital management is key to growth.
    *   **Player Actions:**
        *   **Manage Cash Flow:** Balance revenue from shipping contracts against operating costs like salaries, fuel, and loan payments.
        *   **Leverage Debt & Equity:** Take out loans from the **Capital Market** for rapid expansion or sell equity in your company for a large, debt-free cash injection.
        *   **Engage with Financial Products:** Purchase cargo insurance to mitigate disaster risks (a core Flexport service).
    *   **Money Management:**
        *   **Starting Cash**: $50,000 (standard mode) or Unlimited (sandbox).
        *   **Income Sources**: Route completions, auction wins, market sales.
        *   **Expenses**: Asset purchases/upgrades, maintenance, salaries, loan interest.

*   **Labor Management:** An empire requires a skilled workforce.
    *   **Player Actions:**
        *   **Hire Specialists:** Recruit staff from the **Labor Market** who provide passive, empire-wide bonuses (e.g., an "Ops Specialist" reduces disaster impact, a "Market Analyst" provides better demand predictions).

#### **Pillar 2: Dynamic Logistics & Route Optimization (The "Design" Puzzle)**

This pillar is the strategic heart of the game, equivalent to designing a roller coaster in RCT. The player's goal is to create the most efficient and profitable network possible.

*   **Route Creation & Construction:** This is a core creative and strategic action.
    *   **Player Actions:**
        *   **Draw Routes:** Players create routes by connecting ports on the 2D isometric map. The UI will provide key data like distance, estimated travel time, and current risk level.
        *   **Assign Fleets:** Assign specific ships or planes to routes based on their stats. A high-value, low-volume route needs a fast asset, while a low-value, high-volume route needs a high-capacity one.
    *   **Validation:** Routes must connect valid ports and are checked for capacity and conflicts.

*   **Route Optimization & Performance:** Routes are not static. The player must constantly adapt to a changing world.
    *   **Player Actions:**
        *   **Analyze Performance:** Use the UI dashboards to monitor the profitability of each route.
        *   **Reroute & Reassign:** If a disaster strikes or a geopolitical tariff is imposed, the player must pause and reroute their ships to avoid losses. If a new, more efficient ship is purchased, they must re-evaluate their fleet assignments.
    *   **Route Ratings:**
        *   **Profitability**: Based on revenue minus costs.
        *   **Risk**: Influenced by disasters, tariffs, events.
        *   **Efficiency**: Tied to asset stats and AI training.
    *   **Performance Effects:**
        `Basic Route: Base Profit = Distance × Cargo Value × Efficiency`
        `Efficiency Modifiers: Ship Speed (+10%), Disaster Risk (-20%), Specialist Bonus (+5%)`

*   **The AI Companion:** This system acts as the player's "R&D" department for logistics.
    *   **Player Actions:**
        *   **Train the AI:** Assign the AI companion to monitor specific trade routes. It learns from successes and failures.
        *   **Utilize Insights:** The AI provides predictive advice ("Demand for electronics on the Trans-Pacific route is projected to fall 20% next quarter due to a new factory opening in Mexico"). Acting on this intelligence is key to staying ahead.
    *   **AI Behavior:**
        *   **Needs**: Training data from routes (profits, disasters).
        *   **Preferences**: Risk tolerance, focus areas (e.g., high-growth).
        *   **Satisfaction**: Improves with levels; risk of espionage if mismanaged.
        *   **AI Progression**: Novice to Master levels.

#### **Pillar 3: Navigating the Live Global Economy (The "Guest Satisfaction" Loop)**

In our game, the "guests" are the global market. Keeping the market "happy" means successfully identifying and servicing its needs faster and more efficiently than your competitors.

*   **Market Dynamics:** The game world is driven by supply and demand, simulated from real-world data.
    *   **How the Player Sees It:**
        *   **Visual Cues:** The game map will feature clear visual indicators. A port with high demand for a product will have a pulsing icon. A region with high shipping traffic will be visibly busy.
        *   **Data Dashboards:** The UI will feature clean, easy-to-read line graphs showing the price history of major commodities, allowing players to spot trends.
    *   **Pricing Strategy:** Goods prices fluctuate with supply/demand. Players can lock in deals with contracts or hedge against risk with insurance.

*   **Disaster & Event System:** The world is unpredictable. This system includes both passive disasters and active, high-stakes opportunities.
    *   **Player Experience (Disasters):** The game will trigger region-specific disasters (hurricanes, tariffs). These events are major strategic challenges that create new opportunities for well-prepared players.
    *   **Player Experience (Supply Chain Crisis Events):** This is a new, timed mini-game. Periodically, a "Critical Opportunity" will appear, forcing the player to make a high-stakes decision under pressure. They will be presented with several options (e.g., three potential emergency suppliers) with different risk/reward profiles and must choose one before the timer runs out. A successful choice results in a large capital gain, while a poor choice results in a capital loss. This tests the player's strategic judgment, not their trivia knowledge.

*   **Multiplayer Competition:** The player exists in a shared world.
    *   **Player Experience:** Another player's actions have a direct impact. If a rival buys up the entire available supply of new ships, the player will have to wait for the "manufacturers" to replenish the stock or pay a premium on the second-hand market. The real-time auctions are direct, head-to-head competitive events.

### **Section 3: Game Features & Systems**

#### **Game Modes**

*   **Challenge Mode:**
    *   **Limited Resources**: Start with $50,000, manage debt.
    *   **Objectives**: Achieve net worth milestones, market dominance.
    *   **Unlockable Content**: Advanced assets via progression.
    *   **Difficulty Scaling**: Increasing disasters, competition.
*   **Free Play Mode (Sandbox):**
    *   **Unlimited Cash**: Focus on creative empire building.
    *   **All Content Available**: Full access to assets and markets.
    *   **No Objectives**: Sandbox for experimentation.
*   **Multiplayer Mode (Cooperative & Competitive):**
    *   **Shared World**: All players affect the global market.
    *   **Indirect Competition**: Influence supply/demand for all players.
    *   **Direct Competition**: Head-to-head auctions and specialist poaching.
    *   **Real-time Sync**: See rival routes and major assets on the map.

#### **Progression System**

*   **Unlock Progression:**
    *   **Tier 1**: Basic ships, simple routes, core goods.
    *   **Tier 2**: Advanced assets, specialists, complex markets.
    *   **Tier 3**: Unique licenses, AI upgrades, global events.
    *   **Tier 4**: Mega assets, monopoly mechanics.
*   **Achievement System:**
    *   **Building Achievements**: "Own 10 Ships".
    *   **Economic Achievements**: "Earn $1M in One Quarter".
    *   **Route Achievements**: "Complete 100 Routes".
    *   **Crisis Achievements**: "Survive 5 Disasters".

#### **Day/Night Cycle**

*   **Time Progression**: 5 minutes real-time = 1 game quarter.
*   **Night Operations**: Reduced visibility and higher risks for routes.
*   **Seasonal Changes**: Affects demand for certain goods and triggers weather events.

### **Section 4: Design Decisions & Technical Foundation**

*   **Engine & Framework:** We will use **Phaser.js** for the game canvas and **React/Next.js** for the UI. This web-based approach allows for rapid prototyping, easy deployment, and accessibility on any modern computer without installs.
*   **Backend:** **Supabase** will handle our database, real-time sync, and server-side logic (Edge Functions). This provides a scalable and secure backend without the need for server management.
*   **State Management:** **Zustand** will be used to manage the state between the React UI and the Phaser canvas, ensuring data consistency with a lightweight and simple API.
*   **Data Integration:** The game will be **seeded with offline data** from the Harvard Atlas for the prototype. Live API calls will be handled by a scheduled Supabase Edge Function to ensure performance and reliability, feeding the live economy for the full version.

### **Section 5: The Roadmap Ahead**

With this definitive design document established, our path forward is clear. The other documents in this folder serve as detailed implementation plans based on this vision:

1.  **UI/UX Flow Document & Wireframes:** Designs the exact layout and click-flow of the game's dashboards and menus.
2.  **Core Systems Design Document (CSDD):** Defines the precise mathematical formulas, data structures, and logic for every system detailed in this GDD.
3.  **Entity-Relationship Diagram (ERD):** Provides the blueprint for the database schema.
4.  **System & Technical Architecture Documents:** Detail the software architecture and technical implementation strategy.

This structured approach will allow us to build a deep, engaging, and impressive simulation game.