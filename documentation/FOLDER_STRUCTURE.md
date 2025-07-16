# Project Folder Structure Guide

This document outlines the architectural organization of the Flexport game project. Following this structure ensures consistency and maintainability.

### Root Directories

-   **`/app`**: The core of the **Next.js App Router**. This directory contains all pages, layouts, and API routes. It's the entry point for the user-facing application.
    -   **`/app/components`**: Contains **feature-specific UI panels and dashboards**. These are the major, self-contained "screens" of your UI, such as the `MarketTradingPanel` or `RouteManager`.
    -   **`/app/game`**: The main page component that loads and renders the game.
    -   **`/app/store`**: Zustand stores that are specific to Next.js application state, separate from the core game state.
    -   **`/app/lib`**: Libraries and helper functions specific to the Next.js part of the application.

-   **`/components`**: Holds the top-level **"glue" components** that connect the Next.js app with the Phaser game engine.
    -   `GameUI.tsx`: The main React component that renders the entire UI overlay on top of the game canvas.
    -   `GameCanvas.tsx`: The React component that initializes and contains the Phaser game instance.

-   **`/src`**: Contains the source code for the **client-side game application**, primarily the Phaser game and its tightly-coupled UI elements.
    -   **`/src/components`**: React components for the **real-time game HUD**. This includes elements like the `Minimap`, `ZoomControls`, and the main `GameHUD` that are part of the game overlay.
    -   **`/src/store`**: The **primary Zustand state management store** (`empireStore.ts`). This is the single source of truth for all core game data (player cash, assets, routes) and is used by both React and Phaser.
    -   **`/src/services`**: Client-side services, such as the Supabase service wrapper.

-   **`/scenes`**: This is **purely for Phaser.js scenes**. `WorldMapScene.ts` lives here and is responsible for rendering the entire interactive game world.

-   **`/hooks`**: Contains **shared, reusable React hooks** that can be used across the entire application (e.g., `useGameLoop`).

-   **`/lib`**: Contains shared library code, with a focus on the **Supabase client-side SDK** and its configuration. This is where all direct interaction with the Supabase backend is defined.

-   **`/types`**: A **single, centralized location for all shared TypeScript type definitions**. All domain types (Assets, Routes, Economy, etc.) should be defined here to ensure consistency across the app.

-   **`/utils`**: A centralized location for **shared utility functions and bridges**. This includes formatters, game logic calculations, and the critical "bridge" files that allow React and Phaser to communicate.

-   **`/supabase`**: Contains all **backend infrastructure code** for Supabase, including database migrations and serverless Edge Functions. This folder is not part of the client-side application bundle.

-   **`/documentation`**: Project planning and design documents, including the GDD, CSDD, ERD, and this file.