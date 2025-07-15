# **Entity-Relationship Diagram (ERD)**

Version: 1.0  
Date: July 14, 2025  
Game: Flexport \- The Video Game

### **1\. Introduction**

This document provides the logical data model for our game. It illustrates the core entities, their attributes, and the relationships between them. This ERD will serve as the direct blueprint for constructing our tables in the Supabase (PostgreSQL) database. We will use crow's foot notation to define cardinality.

### **2\. The Entity-Relationship Diagram**

erDiagram  
    PLAYER {  
        UUID user\_id (PK)  
        string username  
        int cash  
        int net\_worth  
        jsonb ai\_companion\_state  
    }

    ASSET {  
        UUID asset\_id (PK)  
        UUID owner\_id (FK)  
        string asset\_type  
        string custom\_name  
        jsonb stats  
        int maintenance\_cost  
        UUID assigned\_route\_id (FK)  
    }

    ROUTE {  
        UUID route\_id (PK)  
        UUID owner\_id (FK)  
        string origin\_port\_id  
        string destination\_port\_id  
        jsonb performance\_data  
    }

    SPECIALIST {  
        UUID specialist\_id (PK)  
        string specialist\_type  
        jsonb effect\_bonuses  
        int base\_salary  
    }

    PLAYER\_SPECIALISTS {  
        UUID player\_id (FK)  
        UUID specialist\_id (FK)  
        date hired\_date  
    }

    WORLD\_STATE {  
        string world\_id (PK)  
        jsonb market\_conditions  
        jsonb active\_disasters  
    }

    AUCTION {  
        UUID auction\_id (PK)  
        string opportunity\_type  
        jsonb opportunity\_details  
        int current\_bid  
        UUID highest\_bidder\_id (FK)  
        timestamp end\_time  
    }

    PLAYER ||--o{ ASSET : owns  
    PLAYER ||--o{ ROUTE : creates  
    PLAYER ||--o{ PLAYER\_SPECIALISTS : hires  
    PLAYER ||--o{ AUCTION : bids\_on

    ASSET }o--|| ROUTE : is\_assigned\_to

    SPECIALIST ||--o{ PLAYER\_SPECIALISTS : is\_hired\_by

### **3\. Entity & Relationship Breakdown**

This section explains each entity and its role in the game.

**a. PLAYER Entity**

* **Description:** Represents the player's core empire. This is the central entity from which most others are connected.  
* **Attributes:**  
  * user\_id (PK): The unique identifier for the player, provided by Supabase Auth.  
  * username: The player's display name.  
  * cash, net\_worth: Core financial metrics.  
  * ai\_companion\_state: A JSON object storing the AI's level, RiskTolerance, and other stats.  
* **Relationships:**  
  * A PLAYER **owns** one-to-many ASSETs.  
  * A PLAYER **creates** one-to-many ROUTEs.  
  * A PLAYER **hires** specialists through the PLAYER\_SPECIALISTS junction table.

**b. ASSET Entity**

* **Description:** Represents a tangible, income-generating asset owned by the player, primarily ships and warehouses.  
* **Attributes:**  
  * asset\_id (PK): Unique ID for the asset.  
  * owner\_id (FK): Links back to the PLAYER who owns it.  
  * asset\_type: e.g., "Container Ship," "Warehouse."  
  * stats: A JSON object holding key performance indicators like { "speed": 1.2, "capacity": 100, "disaster\_resilience": 0.1 }.  
  * assigned\_route\_id (FK): If the asset is a ship, this links to the ROUTE it is currently running.  
* **Relationships:**  
  * An ASSET is **owned by** one PLAYER.  
  * An ASSET (ship) **is assigned to** one ROUTE.

**c. ROUTE Entity**

* **Description:** Represents a defined trade route between two points on the map.  
* **Attributes:**  
  * route\_id (PK): Unique ID for the route.  
  * owner\_id (FK): Links to the PLAYER who created it.  
  * origin\_port\_id, destination\_port\_id: Identifiers for the start and end points.  
  * performance\_data: A JSON object storing data like { "profit\_per\_day": 5000, "disasters\_encountered": 2 } used for the AI Companion's training.

**d. SPECIALIST & PLAYER\_SPECIALISTS Entities**

* **Description:** This demonstrates how we resolve a Many-to-Many relationship. A PLAYER can hire many SPECIALISTs, and a type of SPECIALIST can be hired by many players. The PLAYER\_SPECIALISTS table connects them.  
* **PLAYER\_SPECIALISTS (Junction Table):**  
  * This table simply links a player\_id to a specialist\_id and records the date they were hired. This allows us to query all the specialists a single player has hired.

**e. WORLD\_STATE Entity**

* **Description:** A singleton table (will only ever have one row) that holds the current state of the shared global economy.  
* **Attributes:**  
  * market\_conditions: A JSON object containing the current prices, supply, and demand for all goods.  
  * active\_disasters: A JSON array listing all currently active disasters and their affected regions.  
* **Why it's important:** This is the data that is updated by our simulateEconomy Edge Function and pushed to all players via Supabase Realtime to ensure a consistent world.

**f. AUCTION Entity**

* **Description:** Represents a live, competitive event.  
* **Attributes:**  
  * opportunity\_type: e.g., "Unique Asset," "Exclusive License."  
  * opportunity\_details: A JSON object with the specifics of what's being auctioned.  
  * highest\_bidder\_id (FK): Links to the PLAYER who is currently winning.  
* **Relationships:**  
  * A PLAYER **bids on** an AUCTION. This relationship is managed in real-time by our Edge Functions.