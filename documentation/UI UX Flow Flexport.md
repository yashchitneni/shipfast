# **UI/UX Flow Document & Wireframes**

Version: 1.2 (Added "Supply Chain Crisis" Flow)  
Date: July 14, 2025  
Game: Flexport \- The Video Game

### **1\. Core UI/UX Principles**

The user interface must translate complex economic data into clear, actionable information. Our design will be guided by these principles:

* **Information at a Glance:** The player should be able to understand the health of their empire from the main screen without needing to dig through menus.  
* **Clarity Over Density:** We will use clean layouts, clear icons, and data visualizations (like graphs) to make complex systems understandable.  
* **Responsive & Non-Intrusive:** UI elements like notifications should inform the player without interrupting their core workflow.  
* **Seamless Integration:** The React UI (dashboards) and the Phaser Canvas (game world) should feel like a single, cohesive application.

### **2\. Main Game Screen (HUD) Wireframe**

This is a text-based layout of the Heads-Up Display (HUD) that is always visible during gameplay.

\+--------------------------------------------------------------------------------------+  
| \[TOP BAR\]                                                                            |  
| Player Name | Cash: $1,500,000 | Net Worth: $2,100,000 | Date: Q3 2026 | Speed: \[1x \>\] |  
\+--------------------------------------------------------------------------------------+  
|                                                                                      |  
| \[LEFT SIDEBAR\]                                                                       |  
| \[Alerts Icon\] Notification (1)                                                       |  
| \[AI Icon\] AI Companion                                                               |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
|                                     (PHASER GAME CANVAS)                             |  
|                                                                                      |  
|                                (Isometric map with ships, ports)                     |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
|                                                                                      |  
\+--------------------------------------------------------------------------------------+  
| \[BOTTOM BAR \- MARKET TABS\]                                                           |  
| \[Goods Market\] | \[Capital Market\] | \[Asset Market\] | \[Labor Market\] | \[Main Dashboard\] |  
\+--------------------------------------------------------------------------------------+

* **Top Bar:** Displays critical player stats. The game speed control allows the player to pause or accelerate time.  
* **Left Sidebar:** Contains non-intrusive alerts and access to the AI Companion's panel.  
* **Phaser Game Canvas:** The main view of the game world.  
* **Bottom Bar:** The primary navigation for accessing the different market dashboards. Clicking a tab will open a modal or panel over the game canvas.

### **3\. Key User Flows**

These diagrams map out the step-by-step interactions for core gameplay loops.

**a. User Flow: Creating a New Trade Route**

graph TD  
    A\[Player is on the Main Game Screen\] \--\> B{Clicks 'Create Route' button or hotkey};  
    B \--\> C{Cursor changes to 'Route' icon};  
    C \--\> D\[Player clicks on Origin Port Game Object\];  
    D \--\> E{A glowing line is drawn from Origin to cursor};  
    E \--\> F\[Player clicks on Destination Port Game Object\];  
    F \--\> G\[A 'Route Created' panel appears\];  
    G \--\> H{Player assigns a ship from a dropdown list};  
    H \--\> I\[Player assigns cargo from a list\];  
    I \--\> J{Clicks 'Launch' button};  
    J \--\> K\[Panel closes. Ship sprite begins moving on the map.\];

**b. User Flow: Buying a New Ship (Asset Market)**

graph TD  
    A\[Player is on the Main Game Screen\] \--\> B{Clicks 'Asset Market' tab in Bottom Bar};  
    B \--\> C\[Asset Market Dashboard opens as a modal window\];  
    C \--\> D{Player sees a filterable catalog of available assets};  
    D \--\> E\[Player filters by 'Ships'\];  
    E \--\> F{Player clicks on a 'Panamax Ship' card};  
    F \--\> G\[A detailed view appears with stats, price, and a 'Buy' button\];  
    G \--\> H{Player clicks 'Buy'};  
    H \--\> I{Confirmation modal appears: "Purchase for $50,000?"};  
    I \-- "Yes" \--\> J\[Edge Function \`purchaseAsset\` is called\];  
    J \--\> K{UI shows a "Processing..." spinner};  
    K \--\> L\[Supabase confirms purchase. Player's cash updates in the store.\];  
    L \--\> M\[Dashboard updates to show the new ship in the player's fleet.\];  
    M \--\> N{Player closes the modal};

**c. User Flow: Handling a Disaster Event**

graph TD  
    A\[Player is managing their empire\] \--\> B{Edge Function \`triggerDisaster\` runs};  
    B \--\> C\[A 'Hurricane' event is added to the \`world\_state\` table\];  
    C \--\> D{Supabase Realtime pushes the update to the client};  
    D \--\> E\[A non-intrusive, flashing red 'Alert' icon appears in the Left Sidebar\];  
    E \--\> F{An audible alarm sound effect plays};  
    F \--\> G\[Player clicks the 'Alert' icon\];  
    G \--\> H\[A modal opens: "HURRICANE ALERT: All routes in the Gulf of Mexico are blocked."\];  
    H \--\> I{The affected routes on the Phaser canvas turn red};  
    I \--\> J\[The modal presents mitigation options: "Reroute Fleet" or "Wait it Out"\];  
    J \--\> K{Player makes a strategic choice};

**d. User Flow: Responding to a Supply Chain Crisis Event (New)**

This flow details the new high-stakes mini-game.

graph TD  
    A\[Player is managing their empire\] \--\> B{Edge Function \`triggerCrisisEvent\` runs};  
    B \--\> C\[A 'Critical Opportunity' alert appears in the Left Sidebar\];  
    C \--\> D\[Player clicks the alert\];  
    D \--\> E\[A full-screen modal appears with a 90-second timer\];  
    E \-- "Modal Content" \--\> F(  
        \*\*Title:\*\* CRITICAL OPPORTUNITY: Electronics Supply Disrupted\<br/\>  
        \*\*Body:\*\* A major retailer needs an emergency supply chain. Choose a supplier before your rivals do.\<br/\>  
        \*\*Card A:\*\* Supplier from Taiwan (Low Cost, Slow, High Reliability)\<br/\>  
        \*\*Card B:\*\* Supplier from S. Korea (Med Cost, Fast, Good Reliability)\<br/\>  
        \*\*Card C:\*\* Supplier from Vietnam (V. Low Cost, Med, Risky Reliability)  
    );  
    F \--\> G{Player analyzes the options and clicks on one card, e.g., 'Card A'};  
    G \--\> H{A confirmation pop-up asks: "Lock in contract with Taiwanese supplier?"};  
    H \-- "Confirm" \--\> I\[Client sends choice to Supabase\];  
    I \--\> J{The game simulates the outcome based on the choice and a random chance roll};  
    subgraph "Possible Outcomes"  
        J \--\> K\[\*\*Success:\*\* "Contract Secured\! \+$2,000,000 Capital Gained"\];  
        J \--\> L\[\*\*Contract Lost\!\*\* \-$500,000 Capital Lost\];  
    end  
    K \--\> M\[Modal closes\];  
    L \--\> M;

### **4\. Comprehensive List of Player Actions**

This section details every single action a player can take within the game, categorized by system.

**a. Route & Fleet Management (Game Canvas)**

* **Create Route:** Click two ports on the map to define a new trade route.  
* **Assign Ship to Route:** Select an owned ship and assign it to an existing route.  
* **Assign Cargo to Ship:** Select a ship on a route and load it with goods purchased from the Goods Market.  
* **Pause/Resume Route:** Temporarily deactivate a specific trade route.  
* **Dismantle Route:** Permanently delete a trade route.  
* **Select Ship/Port:** Click on any owned asset on the map to view its details in a pop-up panel.  
* **Pan Camera:** Click and drag the map to move the camera view.  
* **Zoom Camera:** Use the mouse wheel to zoom in and out of the map.

**b. Market Interactions (UI Dashboards)**

* **Buy/Sell Goods:** Purchase or sell commodities in the Goods Market.  
* **Take Out Loan/Bond:** Acquire debt from the Capital Market.  
* **Sell Equity:** Sell a percentage of your company for a cash injection in the Capital Market.  
* **Buy Asset:** Purchase new ships, warehouses, etc., from the Asset Market catalog.  
* **Bid on Auction:** Participate in real-time auctions for unique opportunities in the Asset Market.  
* **Sell Asset:** Sell owned assets (at a depreciated value).  
* **Hire Specialist:** Recruit staff from the Labor Market.  
* **Fire Specialist:** Terminate a staff contract.

**c. Empire & Game Management (UI)**

* **Control Game Speed:** Pause, play, or accelerate the simulation speed using the Top Bar controls.  
* **View Notifications:** Click the 'Alerts' icon to see a list of recent events (disasters, market spikes, etc.).  
* **Train AI Companion:** Access the AI panel to feed it data from completed trade routes.  
* **Accept/Reject AI Suggestion:** Act on the advice provided by the AI Companion.  
* **Respond to Crisis Event:** Make a choice in the timed "Supply Chain Crisis" mini-game.  
* **View Main Dashboard:** Open a comprehensive overview of your empire's finances, assets, and performance metrics.  
* **Save/Load Game:** Manually save progress or load a previous save state.  
* **Access Settings:** Adjust volume, graphics quality, and other game options.

### **5\. Data Visualization & World Feedback**

This section explains how the game visually communicates the dynamic state of the world and economy to the player.

**a. On the Game Canvas (Phaser)**

* **Demand Signals:** Ports with high demand for a specific good will have a **pulsing, color-coded icon** above them. (e.g., a green dollar sign for high profit, a blue box for high cargo volume). The intensity of the pulse indicates the strength of the demand.  
* **Route Status:** The animated lines representing trade routes will change color to indicate their status:  
  * **Green:** Profitable and running smoothly.  
  * **Yellow:** Low profit or minor delays (e.g., port congestion).  
  * **Red:** Unprofitable, paused, or blocked by a disaster.  
* **Disaster Visualization:** Active disasters will have clear visual effects on the map. A hurricane will be a swirling storm animation; a port strike will show a picket line icon over the port.  
* **Rival Activity:** Ships belonging to major AI rivals will be visible on the map, color-coded to distinguish them from the player's fleet.

**b. In the UI Dashboards (React)**

* **Live Market Graphs:** The Goods Market dashboard will feature **live-updating line graphs** for each major commodity, showing its price history over the last game "year." This allows players to spot trends at a glance.  
* **Profit & Loss Statements:** The Main Dashboard will contain detailed financial reports, breaking down income and expenses by category (shipping, salaries, interest payments).  
* **Data Tooltips:** Hovering over almost any item—a ship, a port, a market graph—will bring up a detailed tooltip with relevant metrics and data points. For example, hovering over a port will show its top 3 demanded goods and current waiting times.  
* **Heatmaps (Advanced Feature):** An overlay option on the main map could display global "heatmaps" for different metrics, such as "Profitability," "Risk," or "Demand," giving players a powerful strategic overview of the entire world.

### **6\. UI Implementation Plan**

This section outlines the immediate, actionable steps to build the core user interface, addressing the current gap between the backend systems and the player's ability to interact with them.

#### **Step 1: Build the Core Game HUD**

*   **Objective:** Create the main, persistent UI that frames the game world.
*   **Component:** `GameHUD.tsx`
*   **Sub-components:**
    *   **`TopBar.tsx`**:
        *   **Displays:** Player name, cash, and net worth.
        *   **Data Source:** Hook into `usePlayer()` and `usePlayerCash()` from `useEmpireSelectors`.
        *   **Functionality:** Game time and speed controls (`setPaused`, `setGameSpeed` from `empireStore`).
    *   **`BottomBar.tsx`**:
        *   **Displays:** Tabs for "Goods Market," "Asset Market," "Routes," etc.
        *   **Functionality:** Clicking a tab should set the active panel in the `empireStore` (`setActivePanel`) to show/hide the corresponding dashboard.
    *   **`Notifications.tsx`**:
        *   **Displays:** A list of recent, unread notifications.
        *   **Data Source:** Hook into `useNotifications()` from `useEmpireSelectors`.
        *   **Functionality:** Display alerts for disasters, market events, and achievements.

#### **Step 2: Implement the Asset Market Panel**

*   **Objective:** Allow players to buy new assets and place them on the map. This connects the UI to the already-completed asset placement system.
*   **Component:** `AssetMarketPanel.tsx` (to be shown when the "Asset Market" tab is active).
*   **Functionality:**
    1.  **Display Assets:** Fetch available assets for purchase from `assetDefinitions` in the `empireStore`.
    2.  **Initiate Placement:** When a player clicks "Buy" on an asset:
        *   Call `startAssetPreview(definitionId, mousePosition)` from the `empireStore`. This will put the game into "placement mode."
        *   The `WorldMapScene` should listen for the `assetPreview` state and draw a temporary sprite at the cursor's position. The `assetBridge` can facilitate this.
    3.  **Confirm Placement:** When the player clicks on a valid map location:
        *   Call `placeAsset()` from the `empireStore`. This action contains the core logic to validate the purchase, deduct cash via the Supabase function, and persist the new asset.

#### **Step 3: Implement the Route Management Panel**

*   **Objective:** Enable players to view, create, and manage their trade routes.
*   **Component:** `RoutePanel.tsx`
*   **Functionality:**
    1.  **Display Routes:** List all existing routes from the `empireStore` using the `useRoutes()` selector.
    2.  **Initiate Creation:** A "Create New Route" button will trigger a route creation mode.
        *   The UI will prompt the player to "Select an origin port on the map."
        *   The `WorldMapScene` will detect a click on a port and notify the UI via the `portBridge` or `stateBridge`.
        *   The UI will then prompt for a "destination port."
    3.  **Confirm and Assign:** Once the route is defined, a confirmation panel will appear.
        *   The player can name the route.
        *   A dropdown will list available, unassigned ships/planes (`useShips`, etc.).
        *   Clicking "Launch Route" will call `addRoute()` and `assignAssetToRoute()` in the `empireStore`.

By following this plan, you will progressively build a functional and intuitive UI that leverages the powerful backend and state management systems you've already created.