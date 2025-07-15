# **System Architecture Document (SAD)**

Version: 1.0  
Date: July 14, 2025  
Game: Flexport \- The Video Game

### **1\. High-Level Architecture Overview**

Our game uses a **hybrid client-server architecture**. The "client" is the player's web browser, where all the visual action happens. The "server" is Supabase, which will store data and run secure logic. This model is perfect for a web-based tycoon game, giving us a rich, interactive frontend and a powerful, scalable backend.

**The Frontend is split into two parts that work together:**

1. **Phaser.js (The Game Canvas):** This renders the "game world"—the isometric map, the animated ship sprites moving along their routes, and visual effects for disasters. It handles the core game loop and visual simulation.  
2. **React/Next.js (The User Interface):** This renders all the "dashboards"—the market panels, your cash balance, pop-up menus, notifications, and the AI Companion interface. It's the control panel for the game.

**The Backend is handled entirely by Supabase:**

* It acts as our database, authentication service, and serverless compute layer.

Here is a diagram of how they connect:

graph TD  
    subgraph "Player's Browser (The Client)"  
        A\[React UI Layer\]  
        B\[Phaser Game Canvas\]  
    end

    subgraph "The Cloud (The Backend)"  
        C\[Supabase\]  
    end

    A \-- "Displays Data From" \--\> C  
    A \-- "Sends Player Actions To" \--\> C  
    B \-- "Renders Game State From" \--\> C  
    C \-- "Pushes Realtime Updates To" \--\> A  
    C \-- "Pushes Realtime Updates To" \--\> B

### **2\. Backend Architecture: The Role of Supabase**

Supabase is our all-in-one backend. We don't need to manage our own servers. Here’s how we'll use its features:

**a. Supabase Database (Postgres)**

* **What it is:** The central database where all persistent game data is stored.  
* **What it does for us:** It will store the player's entire game state: their user profile, their current cash, the ships they own, their hired staff, the state of their AI companion, and their progress. It will also store the "world state," like the current prices in the Goods Market.  
* **Why we need it:** To save and load games. When a player returns, we fetch their data from Supabase to restore their empire exactly as they left it.

**b. Supabase Realtime**

* **What it is:** A service that lets the database "push" updates to the game instantly, without the game having to constantly ask "is there anything new?"  
* **What it does for us:** This is the magic behind the multiplayer feel and dynamic world. When a disaster event is triggered by the backend, Realtime pushes that event to all players at once. When prices in the Goods Market change, Realtime pushes the new prices to every player's UI.  
* **Why we need it:** To make the game world feel alive and connected. It ensures that all players are seeing the same game state at the same time, which is crucial for fair competition.

**c. Supabase Edge Functions**

* **What it is:** Small, serverless pieces of code that run in the cloud, close to the user. They can be triggered by events or API calls.  
* **What it does for us:** This is where we'll run secure or complex game logic that we don't want to run in the player's browser.  
  * **Example 1 (Security):** When a player buys a ship, their client doesn't just subtract cash. It calls an Edge Function named purchaseAsset. The function verifies the player has enough cash (preventing cheating), updates their balance in the database, and then adds the ship to their inventory.  
  * **Example 2 (Complexity):** We can have an Edge Function run every minute to simulate the entire AI economy, update market prices based on our formulas, and trigger random disaster events. This keeps the heavy calculations off the player's computer.  
* **Why we need it:** For security, performance, and to run the complex simulation of the game's economy without slowing down the player's browser.

### **3\. Frontend Architecture: UI, State, and Assets**

This section details how the visible part of the game is built and managed.

**a. State Management**

* **What it is:** "State" is just data that can change over time. We have UI state (e.g., which market tab is open) and Game state (e.g., the player's cash, the position of a ship). Keeping this data consistent across the UI and the game canvas is critical.  
* **How we'll do it:** We will use **Zustand**, a popular, lightweight state management library for React.  
  * We will create a central "store" using Zustand. This store will hold the entire game state fetched from Supabase (cash, ships, etc.).  
  * **React UI components** will "subscribe" to this store. When the player.cash value in the store changes, any UI component displaying the cash will automatically re-render with the new value.  
  * **The Phaser canvas** will also connect to this store. When a new ship is added to the state, Phaser will listen for that change and create a new ship sprite on the map.  
* **Why this approach:** It creates a single source of truth for all our data. It prevents bugs where the UI shows one value while the game logic uses another. Zustand is simple to set up and very performant.

**Data Flow with Zustand:**

graph LR  
    A\[Supabase Realtime\] \-- "Pushes update (e.g., new price)" \--\> B(Zustand Store);  
    B \-- "State changes" \--\> C\[React UI Components\];  
    B \-- "State changes" \--\> D\[Phaser Game Canvas\];  
    C \-- "Updates display" \--\> E(Player sees new price);  
    D \-- "Updates game world" \--\> F(Game logic reacts);

**b. Asset Management**

* **What it is:** How we load and use our game's raw files (images, sounds).  
* **How we'll do it:** We'll have two types of assets, managed differently.  
  1. **Game Assets (for Phaser):** These are the images for the game world, like the ship sprites, port icons, and map tiles you generate in Midjourney. These will be loaded by **Phaser's Loader** within the preload() function of our WorldMapScene. Phaser will manage them in memory for efficient rendering on the canvas.  
  2. **UI Assets (for React):** These are icons for buttons, logos, and other UI elements. These will be stored in the public/ folder of our Next.js project and referenced directly in our React components, just like in a standard web application.  
* **Why this approach:** It separates concerns. Phaser is optimized for handling hundreds of game sprites, while React/Next.js is optimized for serving standard web assets.

**c. Component Library**

* **What it is:** A set of reusable UI building blocks (buttons, menus, dashboards) to ensure a consistent look and feel.  
* **How we'll do it:** We will not use a heavy, pre-built library like Material-UI or Ant Design. Instead, we will build our own small, custom component library using **Tailwind CSS**.  
  * We will create reusable React components (e.g., \<Button\>, \<Modal\>, \<MarketDashboard\>).  
  * We will style these components using Tailwind's utility classes (e.g., className="bg-blue-500 text-white p-2 rounded-lg"). This gives us complete control over the look and feel without writing custom CSS files.  
* **Why this approach:** It's lightweight, highly customizable, and fast. It prevents our UI from looking generic and ensures our dashboards are performant and tailored exactly to our game's needs.