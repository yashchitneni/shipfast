/**
 * Unified Empire Store Architecture
 * 
 * This is the proposed unified state management solution that consolidates
 * all separate stores into a single, well-organized store with clear slices.
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import all type definitions
import type { Player, Asset, Ship, Plane, Warehouse, Specialist, GameSettings, GameSession, Notification, Transaction } from '../types/game';
import type { AssetDefinition, PlacedAsset, AssetPreview, PortNode } from '../../app/lib/types/assets';
import type { MarketItem, MarketType, PriceHistory, MarketState as MarketData, MarketDynamics } from '@/types/market';
import type { Good, PlayerFinancials, EconomyModifiers } from '@/app/lib/types/economy';
import type { Route, RouteState, RouteEvent } from '@/types/route';
import type { AICompanionState, AISuggestion } from '@/types/ai-companion';
import type { TimeEvent, Season, TimeSpeed } from '@/app/stores/timeStore';

// ==================== SLICE INTERFACES ====================

/**
 * Player Slice - All player-related state
 */
interface PlayerSlice {
  player: Player | null;
  financials: PlayerFinancials;
  licenses: string[];
  creditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';
}

/**
 * Assets Slice - All asset-related state
 */
interface AssetsSlice {
  // Asset definitions and instances
  assetDefinitions: Map<string, AssetDefinition>;
  placedAssets: Map<string, PlacedAsset>;
  
  // Legacy asset structure (for backward compatibility during migration)
  legacyAssets: {
    ships: Record<string, Ship>;
    planes: Record<string, Plane>;
    warehouses: Record<string, Warehouse>;
    specialists: Record<string, Specialist>;
  };
  
  // Asset placement
  assetPreview: AssetPreview | null;
  assetToPlace: string | null;
  
  // Port data
  portNodes: Map<string, PortNode>;
}

/**
 * Market Slice - All market and economy state
 */
interface MarketSlice {
  // Market items and pricing
  marketItems: Map<string, MarketItem>;
  goods: Map<string, Good>;
  priceHistory: Map<string, PriceHistory[]>;
  
  // Market dynamics
  marketState: MarketData;
  marketDynamics: MarketDynamics;
  economyModifiers: EconomyModifiers;
  
  // Transactions
  transactions: Transaction[];
  lastUpdateCycle: Date;
}

/**
 * Routes Slice - All route-related state
 */
interface RoutesSlice {
  routes: Map<string, Route>;
  routeStates: Map<string, RouteState>;
  routeEvents: RouteEvent[];
  activeRoutes: string[];
  
  // Route creation
  routeCreationMode: boolean;
  routePreview: {
    originPortId: string;
    destinationPortId: string;
    waypoints: string[];
    segments: any[];
    isValid: boolean;
    validation: any;
  } | null;
}

/**
 * AI Slice - All AI companion state
 */
interface AISlice {
  aiCompanion: AICompanionState | null;
  suggestions: AISuggestion[];
  isProcessingAI: boolean;
}

/**
 * Time Slice - All time-related state
 */
interface TimeSlice {
  // Current time
  currentYear: number;
  currentQuarter: Season;
  currentMonth: number;
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  
  // Game speed
  gameSpeed: TimeSpeed;
  isPaused: boolean;
  
  // Time tracking
  totalDaysPlayed: number;
  lastUpdateTime: number;
  
  // Events
  activeTimeEvents: TimeEvent[];
  eventHistory: Array<{ event: TimeEvent; startTime: string; endTime: string }>;
}

/**
 * UI Slice - All UI-related state
 */
interface UISlice {
  // Selection state
  selectedAssetId: string | null;
  selectedRouteId: string | null;
  selectedShip: string | null;
  selectedPort: string | null;
  
  // UI panels
  activePanel: 'market' | 'fleet' | 'ports' | 'ai' | null;
  
  // Loading states
  isLoading: boolean;
  loadingStates: Map<string, boolean>;
  
  // Errors
  error: string | null;
  errors: Map<string, string>;
  
  // Notifications
  notifications: Notification[];
}

/**
 * Game Slice - Core game state
 */
interface GameSlice {
  gameSession: GameSession | null;
  settings: GameSettings;
  
  // History for undo/redo
  history: {
    past: any[];
    future: any[];
  };
}

// ==================== UNIFIED STATE ====================

export interface UnifiedEmpireState extends 
  PlayerSlice,
  AssetsSlice,
  MarketSlice,
  RoutesSlice,
  AISlice,
  TimeSlice,
  UISlice,
  GameSlice {}

// ==================== ACTIONS INTERFACE ====================

export interface UnifiedEmpireActions {
  // ===== Player Actions =====
  setPlayer: (player: Player) => void;
  updatePlayerCash: (amount: number) => void;
  updatePlayerExperience: (exp: number) => void;
  addLicense: (license: string) => void;
  updateCreditRating: () => void;
  
  // ===== Asset Actions =====
  loadAssetDefinitions: (definitions: AssetDefinition[]) => void;
  placeAsset: () => Promise<{ success: boolean; error?: string }>;
  removeAsset: (assetId: string) => Promise<boolean>;
  updateAssetStatus: (assetId: string, status: PlacedAsset['status']) => Promise<void>;
  
  // ===== Market Actions =====
  initializeMarket: () => Promise<void>;
  updateMarketPrices: () => void;
  buyItem: (itemId: string, quantity: number, playerId: string) => Promise<Transaction | null>;
  sellItem: (itemId: string, quantity: number, playerId: string) => Promise<Transaction | null>;
  
  // ===== Route Actions =====
  createRoute: (data: any, playerId: string) => Promise<{ success: boolean; routeId?: string; error?: string }>;
  updateRoute: (routeId: string, updates: any) => Promise<boolean>;
  deleteRoute: (routeId: string) => Promise<boolean>;
  activateRoute: (routeId: string) => Promise<boolean>;
  
  // ===== AI Actions =====
  initializeAI: (userId: string, name?: string) => void;
  generateSuggestions: (gameState: any) => void;
  acceptSuggestion: (suggestionId: string) => void;
  
  // ===== Time Actions =====
  setGameSpeed: (speed: TimeSpeed) => void;
  pause: () => void;
  resume: () => void;
  advanceTime: (minutes: number) => void;
  
  // ===== UI Actions =====
  setSelectedAsset: (assetId: string | null) => void;
  setSelectedRoute: (routeId: string | null) => void;
  setActivePanel: (panel: 'market' | 'fleet' | 'ports' | 'ai' | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  
  // ===== Game Actions =====
  startGameSession: (playerId: string) => void;
  saveGame: () => Promise<void>;
  loadGame: (playerId: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  
  // ===== Cross-Slice Actions =====
  calculateRouteProfit: (routeId: string) => number;
  applyTimeEventEffects: (event: TimeEvent) => void;
  updateGameCycle: () => void;
}

// ==================== STORE IMPLEMENTATION ====================

const initialState: UnifiedEmpireState = {
  // Player slice
  player: null,
  financials: {
    cash: 100000,
    netWorth: 100000,
    creditRating: 'BBB',
    totalRevenue: 0,
    totalExpenses: 0,
    profitMargin: 0,
    debtToAssetRatio: 0,
    loans: [],
    monthlyFinancials: []
  },
  licenses: [],
  creditRating: 'BBB',
  
  // Assets slice
  assetDefinitions: new Map(),
  placedAssets: new Map(),
  legacyAssets: {
    ships: {},
    planes: {},
    warehouses: {},
    specialists: {}
  },
  assetPreview: null,
  assetToPlace: null,
  portNodes: new Map(),
  
  // Market slice
  marketItems: new Map(),
  goods: new Map(),
  priceHistory: new Map(),
  marketState: {
    condition: 'normal',
    volatilityFactor: 1.0,
    globalDemandModifier: 1.0,
    globalSupplyModifier: 1.0,
    lastUpdate: Date.now()
  },
  marketDynamics: {
    supplyGrowthRate: 0.02,
    demandVolatility: 0.15,
    priceElasticity: 1.2,
    seasonalModifiers: {
      spring: 1.1,
      summer: 1.2,
      fall: 0.9,
      winter: 0.8
    }
  },
  economyModifiers: {
    assetEfficiency: 1.0,
    specialistBonus: 0,
    marketVolatility: 0,
    disasterPenalty: 0,
    competitionPressure: 0,
    governmentSubsidy: 0
  },
  transactions: [],
  lastUpdateCycle: new Date(),
  
  // Routes slice
  routes: new Map(),
  routeStates: new Map(),
  routeEvents: [],
  activeRoutes: [],
  routeCreationMode: false,
  routePreview: null,
  
  // AI slice
  aiCompanion: null,
  suggestions: [],
  isProcessingAI: false,
  
  // Time slice
  currentYear: 2024,
  currentQuarter: 'Q1',
  currentMonth: 1,
  currentDay: 1,
  currentHour: 9,
  currentMinute: 0,
  gameSpeed: 1,
  isPaused: false,
  totalDaysPlayed: 0,
  lastUpdateTime: Date.now(),
  activeTimeEvents: [],
  eventHistory: [],
  
  // UI slice
  selectedAssetId: null,
  selectedRouteId: null,
  selectedShip: null,
  selectedPort: null,
  activePanel: null,
  isLoading: false,
  loadingStates: new Map(),
  error: null,
  errors: new Map(),
  notifications: [],
  
  // Game slice
  gameSession: null,
  settings: {
    soundEnabled: true,
    musicVolume: 50,
    effectsVolume: 50,
    notificationsEnabled: true,
    autoSaveEnabled: true,
    autoSaveInterval: 5,
    graphicsQuality: 'MEDIUM',
    language: 'en'
  },
  history: {
    past: [],
    future: []
  }
};

export const useUnifiedEmpireStore = create<UnifiedEmpireState & UnifiedEmpireActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,
          
          // ===== PLAYER ACTIONS =====
          setPlayer: (player) => set((state) => {
            state.player = player;
            if (player) {
              state.financials.cash = player.cash;
            }
          }),
          
          updatePlayerCash: (amount) => set((state) => {
            if (state.player) {
              state.player.cash += amount;
              state.financials.cash = state.player.cash;
              state.player.updatedAt = new Date();
            }
          }),
          
          updatePlayerExperience: (exp) => set((state) => {
            if (state.player) {
              state.player.experience += exp;
              const newLevel = Math.floor(state.player.experience / 1000) + 1;
              if (newLevel > state.player.level) {
                state.player.level = newLevel;
                get().addNotification({
                  type: 'success',
                  title: 'Level Up!',
                  message: `Congratulations! You've reached level ${newLevel}!`,
                  isRead: false
                });
              }
              state.player.updatedAt = new Date();
            }
          }),
          
          addLicense: (license) => set((state) => {
            if (!state.licenses.includes(license)) {
              state.licenses.push(license);
            }
          }),
          
          updateCreditRating: () => {
            // Implementation from useEconomyStore
          },
          
          // ===== ASSET ACTIONS =====
          loadAssetDefinitions: (definitions) => set((state) => {
            const defMap = new Map<string, AssetDefinition>();
            definitions.forEach(def => defMap.set(def.id, def));
            state.assetDefinitions = defMap;
          }),
          
          placeAsset: async () => {
            // Implementation from empireStore
            return { success: false, error: 'Not implemented' };
          },
          
          removeAsset: async (assetId) => {
            // Implementation from empireStore
            return false;
          },
          
          updateAssetStatus: async (assetId, status) => {
            // Implementation from empireStore
          },
          
          // ===== MARKET ACTIONS =====
          initializeMarket: async () => {
            // Implementation from useMarketStore
          },
          
          updateMarketPrices: () => {
            // Implementation combining useMarketStore and useEconomyStore
          },
          
          buyItem: async (itemId, quantity, playerId) => {
            // Implementation from useMarketStore
            return null;
          },
          
          sellItem: async (itemId, quantity, playerId) => {
            // Implementation from useMarketStore
            return null;
          },
          
          // ===== ROUTE ACTIONS =====
          createRoute: async (data, playerId) => {
            // Implementation from useRouteStore
            return { success: false, error: 'Not implemented' };
          },
          
          updateRoute: async (routeId, updates) => {
            // Implementation from useRouteStore
            return false;
          },
          
          deleteRoute: async (routeId) => {
            // Implementation from useRouteStore
            return false;
          },
          
          activateRoute: async (routeId) => {
            // Implementation from useRouteStore
            return false;
          },
          
          // ===== AI ACTIONS =====
          initializeAI: (userId, name) => {
            // Implementation from useAIStore
          },
          
          generateSuggestions: (gameState) => {
            // Implementation from useAIStore
          },
          
          acceptSuggestion: (suggestionId) => {
            // Implementation from useAIStore
          },
          
          // ===== TIME ACTIONS =====
          setGameSpeed: (speed) => set((state) => {
            state.gameSpeed = speed;
            state.isPaused = speed === 0;
          }),
          
          pause: () => set((state) => {
            state.isPaused = true;
            state.gameSpeed = 0;
          }),
          
          resume: () => set((state) => {
            state.isPaused = false;
            state.gameSpeed = 1;
          }),
          
          advanceTime: (minutes) => {
            // Implementation from timeStore
          },
          
          // ===== UI ACTIONS =====
          setSelectedAsset: (assetId) => set((state) => {
            state.selectedAssetId = assetId;
          }),
          
          setSelectedRoute: (routeId) => set((state) => {
            state.selectedRouteId = routeId;
          }),
          
          setActivePanel: (panel) => set((state) => {
            state.activePanel = panel;
          }),
          
          addNotification: (notification) => set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date()
            };
            state.notifications.unshift(newNotification);
            if (state.notifications.length > 50) {
              state.notifications.pop();
            }
          }),
          
          // ===== GAME ACTIONS =====
          startGameSession: (playerId) => {
            // Implementation from empireStore
          },
          
          saveGame: async () => {
            // Implementation from empireStore
          },
          
          loadGame: async (playerId) => {
            // Implementation from empireStore
          },
          
          undo: () => {
            // Implementation from empireStore
          },
          
          redo: () => {
            // Implementation from empireStore
          },
          
          reset: () => set(() => initialState),
          
          // ===== CROSS-SLICE ACTIONS =====
          calculateRouteProfit: (routeId) => {
            // Cross-slice calculation using market prices and route data
            return 0;
          },
          
          applyTimeEventEffects: (event) => {
            // Apply time event effects to market and economy
          },
          
          updateGameCycle: () => {
            // Master update function that coordinates all slices
            const state = get();
            
            // Update time
            if (!state.isPaused) {
              state.advanceTime(state.gameSpeed);
            }
            
            // Update market prices
            state.updateMarketPrices();
            
            // Process active routes
            // Update AI suggestions
            // Check for events
          }
        }))
      ),
      {
        name: 'unified-empire-store',
        partialize: (state) => ({
          // Only persist non-Map data and essential state
          player: state.player,
          financials: state.financials,
          licenses: state.licenses,
          creditRating: state.creditRating,
          settings: state.settings,
          currentYear: state.currentYear,
          currentQuarter: state.currentQuarter,
          currentMonth: state.currentMonth,
          currentDay: state.currentDay,
          totalDaysPlayed: state.totalDaysPlayed
        })
      }
    )
  )
);

// ==================== SELECTORS ====================

// Player selectors
export const usePlayer = () => useUnifiedEmpireStore((state) => state.player);
export const usePlayerCash = () => useUnifiedEmpireStore((state) => state.financials.cash);
export const useCreditRating = () => useUnifiedEmpireStore((state) => state.creditRating);

// Asset selectors
export const usePlacedAssets = () => useUnifiedEmpireStore((state) => Array.from(state.placedAssets.values()));
export const useAssetById = (id: string) => useUnifiedEmpireStore((state) => state.placedAssets.get(id));

// Market selectors
export const useMarketItems = () => useUnifiedEmpireStore((state) => Array.from(state.marketItems.values()));
export const useGoodPrice = (goodId: string) => useUnifiedEmpireStore((state) => state.goods.get(goodId)?.currentPrice || 0);

// Route selectors
export const useRoutes = () => useUnifiedEmpireStore((state) => Array.from(state.routes.values()));
export const useActiveRoutes = () => useUnifiedEmpireStore((state) => state.activeRoutes);
export const useSelectedRoute = () => {
  const selectedId = useUnifiedEmpireStore((state) => state.selectedRouteId);
  const routes = useUnifiedEmpireStore((state) => state.routes);
  return selectedId ? routes.get(selectedId) : null;
};

// AI selectors
export const useAICompanion = () => useUnifiedEmpireStore((state) => state.aiCompanion);
export const useAISuggestions = () => useUnifiedEmpireStore((state) => state.suggestions);

// Time selectors
export const useGameTime = () => useUnifiedEmpireStore((state) => ({
  year: state.currentYear,
  quarter: state.currentQuarter,
  month: state.currentMonth,
  day: state.currentDay,
  hour: state.currentHour,
  minute: state.currentMinute
}));
export const useGameSpeed = () => useUnifiedEmpireStore((state) => state.gameSpeed);

// UI selectors
export const useSelectedAsset = () => {
  const selectedId = useUnifiedEmpireStore((state) => state.selectedAssetId);
  const assets = useUnifiedEmpireStore((state) => state.placedAssets);
  return selectedId ? assets.get(selectedId) : null;
};
export const useNotifications = () => useUnifiedEmpireStore((state) => state.notifications);
export const useIsLoading = () => useUnifiedEmpireStore((state) => state.isLoading);

// ==================== MIGRATION HELPERS ====================

// For gradual migration from old stores
export const useEmpireStore = useUnifiedEmpireStore;
export const useAssetStore = useUnifiedEmpireStore;
export const useGameStore = useUnifiedEmpireStore;