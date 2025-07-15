# **Core Systems Design Document (CSDD)**

Version: 1.3 (Definitive Expansive Mechanics)  
Date: July 14, 2025  
Game: Flexport \- The Video Game

### **1\. Introduction**

This document provides the definitive, expansive logic for the game's core systems. It translates the GDD's vision into precise, developer-ready rules, formulas, and state definitions designed for AI-assisted code generation. This is the "Mechanics Bible" for the project.

### **2\. Multiplayer Systems & Real-time Interaction**

All players inhabit a single, persistent, shared world. The multiplayer experience is designed around a mix of constant indirect competition and punctuated moments of direct, high-stakes interaction.

**a. Shared World State & Indirect Competition**

* **How it Works:** The global economic state (market prices, goods supply/demand, active disasters) is stored centrally in the Supabase world\_state table. Player actions directly influence this state. For example, when a player purchases 1,000 units of "electronics," the total\_supply for that good in the database is immediately reduced.  
* **The Flow:** A Supabase Edge Function (simulateEconomy) runs on a timer (e.g., every 60 seconds). It reads the current world\_state, recalculates all market prices based on the latest supply and demand figures, and updates the database. Supabase Realtime then instantly pushes these new prices to all connected players.  
* **Result:** This creates a living economy. Players are not just reacting to the world; they are active participants shaping it. A rival's decision to corner the coffee market will have a tangible impact on your own coffee-shipping routes.

**b. Competitive Events: Real-time Auctions**

* **What it is:** These are timed, server-triggered events for scarce, high-value opportunities. This is not limited to just ships.  
* **Auctionable Opportunities Include:**  
  * **Unique Assets:** Prototype ships, high-efficiency warehouse blueprints.  
  * **Exclusive Licenses:** A 10-year exclusive right to a newly opened shipping lane (e.g., the Arctic passage).  
  * **Unique Specialists:** A one-of-a-kind logistics guru who provides a massive, unique bonus.  
* **The Logic:**  
  1. An Edge Function (triggerCompetitiveEvent) periodically creates a new "auction item" in the auctions table.  
  2. Realtime pushes this to all online players, opening a bidding UI with a 60-second timer.  
  3. Players call a placeBid(auctionId, bidAmount) Edge Function to participate. The function validates the bid against their current cash and the auction's state.  
  4. Realtime syncs the highest bid and bidder to all participants instantly.  
  5. When the timer expires, the resolveAuction function awards the asset/license/specialist to the winner.

### **3\. The Four Markets: Expansive Logic**

**a. Goods Market**

* **Price Formula:** Price \= (BaseCost \+ ProductionCostModifier) \* (Demand / Supply) \* (1 \+ VolatilityModifier)  
  * ProductionCostModifier: Rises if a key raw material for this good is in short supply.  
  * VolatilityModifier: A small, randomly fluctuating value (-0.05 to \+0.05) to simulate market noise.  
* **Goods Categories:** Goods are categorized, affecting their properties.  
  * **Raw Materials** (e.g., Iron Ore, Crude Oil): High volume, low margin, low volatility.  
  * **Manufactured Goods** (e.g., Electronics, Cars): Medium volume, medium margin, medium volatility.  
  * **Luxury Goods** (e.g., Designer Handbags, Fine Wine): Low volume, high margin, high volatility.  
  * **Perishable Goods** (e.g., Fruit, Flowers): Require refrigerated assets; high risk of spoilage if delayed.  
* **Data Structure (goods table):**  
  {  
    "id": "electronics-hs92-8517",  
    "name": "Telephones",  
    "category": "Manufactured Goods",  
    "base\_cost": 120,  
    "total\_demand": 1500,  
    "total\_supply": 1200,  
    "volatility\_modifier": 0.02,  
    "requires\_refrigeration": false  
  }

**b. Capital Market**

* **Debt Logic & Credit Rating:** A player's "Credit Rating" (from D to AAA) is calculated based on their debt-to-asset ratio and payment history. A higher rating unlocks larger loans at lower interest rates. Missing a payment lowers the rating.  
* **Equity Logic:** Valuation \= (NetWorth \* 1.5) \+ (GrowthRate \* 10000). Selling more than 49% of your company triggers a "Hostile Takeover" risk from AI firms or other players.  
* **Advanced Financial Instruments:**  
  * **Venture Capital:** Periodically, an AI "VC Firm" may offer a large cash injection in exchange for a significant equity stake and a board seat (imposing a temporary penalty, like a focus on high-risk/high-growth routes).  
  * **Government Subsidies:** If a player heavily invests in "green" technology (e.g., eco-friendly ships), they may become eligible for a government subsidy event, providing a one-time cash grant.

**c. Asset Market**

* **Asset Stats:**  
  * Speed, Capacity, FuelEfficiency  
  * MaintenanceCost: A recurring daily expense.  
  * DisasterResilience: A percentage reduction in the chance of cargo damage during disasters.  
  * ModuleSlots: The number of upgrades that can be installed.  
* **AI Manufacturers:** The AvailableSupply of assets is replenished by several competing AI manufacturers, each with their own specialties (e.g., one builds fast but expensive ships, another builds cheap but unreliable ones). Their production can be disrupted by disasters.

**d. Labor Market**

* **Expanded Specialist Roles:**

| Specialist | Effect |
| :---- | :---- |
| Operations Specialist | \-15% disaster impact duration. |
| Market Analyst | Unlocks more detailed historical data graphs in the Goods Market UI. |
| Financial Advisor | \-10% interest rates on all new loans. Unlocks more complex financial instruments. |
| Chief Engineer | Unlocks advanced asset modules. \-10% maintenance costs. |
| Security Chief | \-25% chance of Pirate Attacks. Unlocks "Convoy" ability. |
| Diplomat / Lobbyist | Mitigates effects of "Geopolitical Tension" tariffs. |

* **Poaching Mechanic (Multiplayer):** A player can attempt to "poach" a specialist from a rival player by making them a significantly higher salary offer. This triggers a notification to the rival, who has a chance to counter-offer.

### **4\. Core Gameplay Formulas & Systems**

**a. Compounding Growth Formula**

* **Formula:** NextProfit \= CurrentProfit \* (1 \+ (Rate / 365))^Time (compounded daily)  
* **Variable Rate Definition:** Rate \= BaseRate (0.05) \+ Sum(LaborBonuses) \+ AIBonus \- Sum(DisasterPenalties) \- Sum(LoanInterestRates)  
  * This provides a much more dynamic calculation based on the player's specific situation.

**b. Expanded Disaster System Logic**

* **Logic:** Disasters are now region-specific and have more varied effects. The triggerDisaster Edge Function checks both random chance and contextual prerequisites.

| DisasterName | Region / Context | Trigger Condition | Effect | Mitigation |
| :---- | :---- | :---- | :---- | :---- |
| Hurricane | Atlantic / Gulf of Mexico | 5% chance during "Hurricane Season" (June-Nov) | Routes in region paused. High chance of "Cargo Damage" (-50% value). | Ops Specialist. Insurance (Capital Market). |
| Typhoon | Pacific Ocean | 5% chance during "Typhoon Season" (May-Oct) | Routes in region paused. High chance of "Cargo Damage". | Ops Specialist. Insurance. |
| Pirate Attack | High-Risk Sea Lanes (e.g., Gulf of Aden) | 2% chance for any ship passing through the region. | Ship's cargo is stolen. Asset may be damaged. | Hiring "Security" staff. Traveling in convoys (multiplayer feature). |
| Geopolitical Tension | Specific Country Pairs (e.g., USA-China) | Triggered by world simulation events. | A "Tariff" is applied (-25% profit) to all routes between the two countries. | Hiring "Diplomats" or "Lobbyists." Rerouting trade. |
| Canal Blockage | Suez / Panama Canal | Rare (0.5% chance per week). | All routes using the canal are blocked for 1-3 game "weeks." Global supply chains are impacted. | Rerouting is the only option. Massive profits for those who don't rely on the canal. |
| Factory Fire | Industrial Region | High concentration of "Manufactured Goods" production. | TotalSupply of a specific good is halved for 1 month. Price skyrockets. | Diversified sourcing. Market Analyst can predict regions at risk. |
| Drought | Agricultural Region | Extended period of low "rainfall" in the simulation. | TotalSupply of agricultural goods is reduced. Prices rise. | Investing in alternative food production technologies. |

### **5\. Player-Trained AI Companion Logic**

* **Training & Learning:** The AI learns from specific data points on its assigned route: profit\_per\_day, time\_on\_route, disasters\_encountered, cargo\_type.  
* **AI Levels & Abilities:**  
  * **Level 1 (Novice):** Basic suggestions. "This route is currently profitable."  
  * **Level 2 (Analyst):** Identifies trends. "Profitability on this route has increased 10% this quarter."  
  * **Level 3 (Predictive):** Makes forecasts. "Based on seasonal data, I predict a 40% increase in demand for coffee on this route in Q4."  
  * **Level 4 (Optimizer):** Suggests actions. "I recommend assigning a larger vessel to this route next quarter to capitalize on predicted demand."  
  * **Level 5 (Master):** Provides a permanent passive bonus to its assigned route (+5% efficiency).  
* **Betrayal & Corporate Espionage:** If the AI's RiskTolerance score is high, a "Corporate Espionage" event can trigger. This means the AI "sells" your route data. **Mechanical Effect:** A rival AI firm (or another player in multiplayer) receives a temporary 10% profit bonus on any route that directly competes with the compromised route. The player is notified of the "data breach."

### **6\. Scenarios & Edge Cases**

* **Bankruptcy:** If a player's cash goes below a certain threshold (e.g., \-$50,000), they are offered a high-interest "bailout" loan. If they cannot recover, their assets are liquidated, and it's game over.  
* **Monopoly:** If a player successfully controls over 80% of the supply of a specific good, they can trigger "Monopoly Pricing," allowing them to manually set the price for a short period for massive profits, but this risks a "Government Intervention" disaster event.  
* **New & Returning Players:** A new player entering a world that has been running for months will start in a less competitive, emerging market region to allow them to catch up. Returning players' assets will have accrued maintenance costs and may have been affected by disasters that occurred while they were offline.