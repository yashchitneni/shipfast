# **Flexport: Phased Development Plan**

Version: 1.0
Date: July 16, 2025

### **Introduction**

This document outlines a clear, phased development plan for "Flexport: The Video Game". It is designed to provide an actionable roadmap, breaking down the project into logical stages, from implementing the core gameplay loop to adding advanced features and multiplayer functionality. This plan synthesizes the vision from the Game Design Document (GDD) and the technical details from the Core Systems Design Document (CSDD).

---

### **Phase 1: Foundational Architecture (Completed)**

This phase established the technical backbone of the project.

**Status:** ✅ **Complete**

**Key Achievements:**
*   **Project Structure:** A complete Next.js + Phaser project structure is in place.
*   **Core Engine:** A hybrid of Next.js for UI and Phaser for the game canvas is working.
*   **State Management:** The central `empireStore` (Zustand) is implemented and loads core data like asset definitions.
*   **World Rendering:** An isometric map renders with basic camera controls (pan/zoom).
*   **Backend Integration:** Initial Supabase integration is set up for asset placement and data persistence.
*   **Core Logic:** Backend logic for core actions like asset placement is defined.

---

### **Phase 2: Activating the Core Gameplay Loop (In Progress)**

This phase focuses on building the UI components and bridges necessary for a player to interact with the systems built in Phase 1. The primary objective is to make the game playable.

**High-Level Objective:** Enable the primary game loop: **Purchase an asset -> Create a trade route -> Assign the asset -> Generate revenue.**

#### **Step 1: Implement the Core Game HUD (Current Task)**
*   **Goal:** Establish the main, persistent UI frame.
*   **Implementation:**
    *   Create and integrate `TopBar` and `BottomNav` components within `GameUI.tsx`.
    *   The `TopBar` will display core player stats (cash, level) from `empireStore`.
    *   The `BottomNav` will contain navigation buttons to open different management panels (`AssetManager`, `RouteManager`, etc.).
    *   Clicking a button will call the `setActivePanel` action in `empireStore`.

#### **Step 2: Implement the Asset Acquisition Flow**
*   **Goal:** Allow players to buy their first assets and place them on the map.
*   **Implementation:**
    *   Activate the `AssetManager` panel from the `BottomNav`.
    *   Display purchasable assets from `assetDefinitions` in the `AssetPlacementUI`.
    *   On "Buy", call `setAssetToPlace(definitionId)` in `empireStore` to enter placement mode.
    *   In `WorldMapScene.ts`, use the existing subscription to `assetToPlace` to show a ghost sprite.
    *   On a valid click (near a port), call `placeAsset()` to finalize the purchase, deduct cash, and persist the asset via Supabase.

#### **Step 3: Implement the Route Creation & Management Flow**
*   **Goal:** Enable players to define trade routes between ports.
*   **Implementation:**
    *   Flesh out the `RouteManager.tsx` UI, which is opened from the `BottomNav`.
    *   A "Create New Route" button will set the game into a "route creation" mode in the store.
    *   Modify the `portMarker` click handler in `WorldMapScene.ts` to register origin/destination ports when in this mode.
    *   Use the `routeBridge` to communicate selected ports back to the `RouteManager` UI.
    *   In the UI, after ports are selected, allow the player to name the route and assign an available asset (ship/plane).
    *   A "Launch Route" button will call the `createRoute` and `assignAssetToRoute` actions in the store.

#### **Step 4: Implement Basic Revenue Generation**
*   **Goal:** Close the gameplay loop by making active routes generate income.
*   **Implementation:**
    *   Connect the `useRevenueGeneration` hook to a central component like `GameCanvas.tsx`.
    *   Implement the logic in `revenueService.ts` to run on a timer.
    *   The service will get all active routes from the store, calculate profit for the cycle, and call `updatePlayerCash` in `empireStore`.

---

### **Phase 3: Expanding Gameplay & World Dynamics**

This phase will build upon the core loop, adding depth, strategy, and unpredictability.

**High-Level Objective:** Introduce systems that challenge the player and enrich the world simulation.

*   **Expanded Disaster System:**
    *   Implement the region-specific disasters defined in the CSDD (Hurricanes, Pirate Attacks, etc.).
    *   Trigger these from a Supabase Edge Function.
    *   Add visual effects in Phaser and UI alerts.
*   **Advanced Markets:**
    *   Implement the **Labor Market** to hire specialists with unique bonuses.
    *   Implement the **Capital Market** for taking out loans and managing debt.
*   **AI Companion V1:**
    *   Implement the AI training and leveling system.
    *   Enable the AI to provide basic predictive suggestions based on learned route data.
*   **Multiplayer Foundations:**
    *   Implement real-time presence to see other players in the world.
    *   Sync market prices and global events across all players.

---

### **Phase 4: Advanced Features & Polish**

This final phase will focus on end-game content, advanced multiplayer interactions, and overall polish.

**High-Level Objective:** Add features that provide long-term engagement and a high-quality, polished experience.

*   **Advanced Multiplayer:**
    *   Implement real-time auctions for unique assets.
    *   Implement the "Specialist Poaching" mechanic.
*   **Advanced AI Features:**
    *   Implement the "Corporate Espionage" event where a mismanaged AI can betray the player.
*   **Scenarios & Game Modes:**
    *   Implement the "Challenge Mode" with specific objectives.
    *   Implement "Supply Chain Crisis" timed events.
*   **Visual & Audio Polish:**
    *   Add detailed asset models and animations.
    *   Implement full sound design (SFX, ambient sounds, music).
    *   Refine all UI elements and add micro-interactions.