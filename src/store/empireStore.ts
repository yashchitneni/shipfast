import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Player,
  Asset,
  Ship,
  Plane,
  Warehouse,
  Specialist,
  Route,
  MarketGood,
  MarketEvent,
  AICompanion,
  AISuggestion,
  GameSettings,
  GameSession,
  Notification,
  Transaction,
  AssetType
} from '../types/game';

// Store state interface
export interface EmpireState {
  // Player data
  player: Player | null;
  
  // Assets
  assets: {
    ships: Record<string, Ship>;
    planes: Record<string, Plane>;
    warehouses: Record<string, Warehouse>;
    specialists: Record<string, Specialist>;
  };
  
  // Routes
  routes: Record<string, Route>;
  activeRoutes: string[];
  
  // Market
  market: {
    goods: Record<string, MarketGood>;
    events: MarketEvent[];
    priceHistory: Record<string, Array<{ price: number; timestamp: Date }>>;
  };
  
  // AI Companion
  aiCompanion: AICompanion | null;
  
  // Game state
  gameSession: GameSession | null;
  settings: GameSettings;
  
  // UI state
  notifications: Notification[];
  transactions: Transaction[];
  selectedAssetId: string | null;
  selectedRouteId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Undo/Redo state
  history: {
    past: EmpireState[];
    future: EmpireState[];
  };
}

// Store actions
export interface EmpireActions {
  // Player actions
  setPlayer: (player: Player) => void;
  updatePlayerCash: (amount: number) => void;
  updatePlayerExperience: (exp: number) => void;
  
  // Asset actions
  addAsset: (asset: Asset) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  removeAsset: (assetId: string) => void;
  assignAssetToRoute: (assetId: string, routeId: string) => void;
  unassignAssetFromRoute: (assetId: string) => void;
  
  // Route actions
  addRoute: (route: Route) => void;
  updateRoute: (routeId: string, updates: Partial<Route>) => void;
  removeRoute: (routeId: string) => void;
  activateRoute: (routeId: string) => void;
  deactivateRoute: (routeId: string) => void;
  
  // Market actions
  updateMarketGood: (goodId: string, updates: Partial<MarketGood>) => void;
  addMarketEvent: (event: MarketEvent) => void;
  removeMarketEvent: (eventId: string) => void;
  recordPriceHistory: (goodId: string, price: number) => void;
  
  // AI Companion actions
  setAICompanion: (companion: AICompanion) => void;
  updateAICompanion: (updates: Partial<AICompanion>) => void;
  addAISuggestion: (suggestion: AISuggestion) => void;
  markSuggestionRead: (suggestionId: string) => void;
  markSuggestionActedUpon: (suggestionId: string) => void;
  
  // Game session actions
  startGameSession: (playerId: string) => void;
  endGameSession: () => void;
  updatePlayTime: () => void;
  saveGame: () => Promise<void>;
  loadGame: (playerId: string) => Promise<void>;
  
  // Settings actions
  updateSettings: (settings: Partial<GameSettings>) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearExpiredNotifications: () => void;
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  
  // UI actions
  setSelectedAsset: (assetId: string | null) => void;
  setSelectedRoute: (routeId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Undo/Redo actions
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Reset action
  reset: () => void;
}

// Initial state
const initialState: EmpireState = {
  player: null,
  assets: {
    ships: {},
    planes: {},
    warehouses: {},
    specialists: {}
  },
  routes: {},
  activeRoutes: [],
  market: {
    goods: {},
    events: [],
    priceHistory: {}
  },
  aiCompanion: null,
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
  notifications: [],
  transactions: [],
  selectedAssetId: null,
  selectedRouteId: null,
  isLoading: false,
  error: null,
  history: {
    past: [],
    future: []
  }
};

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create the store
export const useEmpireStore = create<EmpireState & EmpireActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,
          
          // Player actions
          setPlayer: (player) => set((state) => {
            state.player = player;
          }),
          
          updatePlayerCash: (amount) => set((state) => {
            if (state.player) {
              state.player.cash += amount;
              state.player.updatedAt = new Date();
            }
          }),
          
          updatePlayerExperience: (exp) => set((state) => {
            if (state.player) {
              state.player.experience += exp;
              // Level up logic
              const newLevel = Math.floor(state.player.experience / 1000) + 1;
              if (newLevel > state.player.level) {
                state.player.level = newLevel;
                // Add level up notification
                get().addNotification({
                  type: 'SUCCESS',
                  title: 'Level Up!',
                  message: `Congratulations! You've reached level ${newLevel}!`,
                  isRead: false
                });
              }
              state.player.updatedAt = new Date();
            }
          }),
          
          // Asset actions
          addAsset: (asset) => set((state) => {
            switch (asset.type) {
              case AssetType.SHIP:
                state.assets.ships[asset.id] = asset as Ship;
                break;
              case AssetType.PLANE:
                state.assets.planes[asset.id] = asset as Plane;
                break;
              case AssetType.WAREHOUSE:
                state.assets.warehouses[asset.id] = asset as Warehouse;
                break;
              case AssetType.SPECIALIST:
                state.assets.specialists[asset.id] = asset as Specialist;
                break;
            }
          }),
          
          updateAsset: (assetId, updates) => set((state) => {
            // Find and update the asset in the appropriate category
            for (const category of Object.keys(state.assets) as Array<keyof typeof state.assets>) {
              if (state.assets[category][assetId]) {
                Object.assign(state.assets[category][assetId], updates, {
                  updatedAt: new Date()
                });
                break;
              }
            }
          }),
          
          removeAsset: (assetId) => set((state) => {
            for (const category of Object.keys(state.assets) as Array<keyof typeof state.assets>) {
              delete state.assets[category][assetId];
            }
          }),
          
          assignAssetToRoute: (assetId, routeId) => set((state) => {
            const route = state.routes[routeId];
            if (route && !route.assignedAssets.includes(assetId)) {
              route.assignedAssets.push(assetId);
              route.updatedAt = new Date();
            }
            // Update asset's current route
            for (const category of ['ships', 'planes'] as const) {
              const asset = state.assets[category][assetId];
              if (asset && 'currentRoute' in asset) {
                asset.currentRoute = routeId;
                asset.updatedAt = new Date();
              }
            }
          }),
          
          unassignAssetFromRoute: (assetId) => set((state) => {
            // Remove from all routes
            Object.values(state.routes).forEach(route => {
              const index = route.assignedAssets.indexOf(assetId);
              if (index > -1) {
                route.assignedAssets.splice(index, 1);
                route.updatedAt = new Date();
              }
            });
            // Clear asset's current route
            for (const category of ['ships', 'planes'] as const) {
              const asset = state.assets[category][assetId];
              if (asset && 'currentRoute' in asset) {
                asset.currentRoute = undefined;
                asset.updatedAt = new Date();
              }
            }
          }),
          
          // Route actions
          addRoute: (route) => set((state) => {
            state.routes[route.id] = route;
          }),
          
          updateRoute: (routeId, updates) => set((state) => {
            if (state.routes[routeId]) {
              Object.assign(state.routes[routeId], updates, {
                updatedAt: new Date()
              });
            }
          }),
          
          removeRoute: (routeId) => set((state) => {
            delete state.routes[routeId];
            // Remove from active routes
            const index = state.activeRoutes.indexOf(routeId);
            if (index > -1) {
              state.activeRoutes.splice(index, 1);
            }
          }),
          
          activateRoute: (routeId) => set((state) => {
            if (state.routes[routeId] && !state.activeRoutes.includes(routeId)) {
              state.routes[routeId].isActive = true;
              state.activeRoutes.push(routeId);
            }
          }),
          
          deactivateRoute: (routeId) => set((state) => {
            if (state.routes[routeId]) {
              state.routes[routeId].isActive = false;
              const index = state.activeRoutes.indexOf(routeId);
              if (index > -1) {
                state.activeRoutes.splice(index, 1);
              }
            }
          }),
          
          // Market actions
          updateMarketGood: (goodId, updates) => set((state) => {
            if (!state.market.goods[goodId]) {
              state.market.goods[goodId] = {
                id: goodId,
                name: '',
                category: '',
                basePrice: 0,
                currentPrice: 0,
                volatility: 0,
                demand: 50,
                supply: 50,
                lastUpdated: new Date()
              };
            }
            Object.assign(state.market.goods[goodId], updates, {
              lastUpdated: new Date()
            });
          }),
          
          addMarketEvent: (event) => set((state) => {
            state.market.events.push(event);
          }),
          
          removeMarketEvent: (eventId) => set((state) => {
            const index = state.market.events.findIndex(e => e.id === eventId);
            if (index > -1) {
              state.market.events.splice(index, 1);
            }
          }),
          
          recordPriceHistory: (goodId, price) => set((state) => {
            if (!state.market.priceHistory[goodId]) {
              state.market.priceHistory[goodId] = [];
            }
            state.market.priceHistory[goodId].push({
              price,
              timestamp: new Date()
            });
            // Keep only last 100 price points
            if (state.market.priceHistory[goodId].length > 100) {
              state.market.priceHistory[goodId].shift();
            }
          }),
          
          // AI Companion actions
          setAICompanion: (companion) => set((state) => {
            state.aiCompanion = companion;
          }),
          
          updateAICompanion: (updates) => set((state) => {
            if (state.aiCompanion) {
              Object.assign(state.aiCompanion, updates, {
                updatedAt: new Date()
              });
            }
          }),
          
          addAISuggestion: (suggestion) => set((state) => {
            if (state.aiCompanion) {
              const newSuggestion = {
                ...suggestion,
                id: generateId(),
                createdAt: new Date()
              };
              state.aiCompanion.suggestions.push(newSuggestion);
            }
          }),
          
          markSuggestionRead: (suggestionId) => set((state) => {
            if (state.aiCompanion) {
              const suggestion = state.aiCompanion.suggestions.find(s => s.id === suggestionId);
              if (suggestion) {
                suggestion.isRead = true;
              }
            }
          }),
          
          markSuggestionActedUpon: (suggestionId) => set((state) => {
            if (state.aiCompanion) {
              const suggestion = state.aiCompanion.suggestions.find(s => s.id === suggestionId);
              if (suggestion) {
                suggestion.isActedUpon = true;
              }
            }
          }),
          
          // Game session actions
          startGameSession: (playerId) => set((state) => {
            state.gameSession = {
              id: generateId(),
              playerId,
              startTime: new Date(),
              lastSaveTime: new Date(),
              playTime: 0,
              isActive: true
            };
          }),
          
          endGameSession: () => set((state) => {
            if (state.gameSession) {
              state.gameSession.isActive = false;
            }
          }),
          
          updatePlayTime: () => set((state) => {
            if (state.gameSession && state.gameSession.isActive) {
              const now = new Date();
              const elapsed = Math.floor((now.getTime() - state.gameSession.startTime.getTime()) / 1000);
              state.gameSession.playTime = elapsed;
            }
          }),
          
          saveGame: async () => {
            const state = get();
            set((state) => { state.isLoading = true; });
            
            try {
              // TODO: Implement Supabase save logic
              // const { error } = await supabase
              //   .from('game_saves')
              //   .upsert({
              //     player_id: state.player?.id,
              //     state_data: JSON.stringify(state),
              //     updated_at: new Date()
              //   });
              
              set((state) => {
                if (state.gameSession) {
                  state.gameSession.lastSaveTime = new Date();
                }
                state.isLoading = false;
              });
              
              get().addNotification({
                type: 'SUCCESS',
                title: 'Game Saved',
                message: 'Your progress has been saved successfully.',
                isRead: false
              });
            } catch (error) {
              set((state) => {
                state.isLoading = false;
                state.error = 'Failed to save game';
              });
              
              get().addNotification({
                type: 'ERROR',
                title: 'Save Failed',
                message: 'Failed to save your game. Please try again.',
                isRead: false
              });
            }
          },
          
          loadGame: async (playerId) => {
            set((state) => { state.isLoading = true; });
            
            try {
              // TODO: Implement Supabase load logic
              // const { data, error } = await supabase
              //   .from('game_saves')
              //   .select('state_data')
              //   .eq('player_id', playerId)
              //   .single();
              
              set((state) => {
                state.isLoading = false;
              });
              
              get().addNotification({
                type: 'SUCCESS',
                title: 'Game Loaded',
                message: 'Your saved game has been loaded successfully.',
                isRead: false
              });
            } catch (error) {
              set((state) => {
                state.isLoading = false;
                state.error = 'Failed to load game';
              });
              
              get().addNotification({
                type: 'ERROR',
                title: 'Load Failed',
                message: 'Failed to load your saved game.',
                isRead: false
              });
            }
          },
          
          // Settings actions
          updateSettings: (settings) => set((state) => {
            Object.assign(state.settings, settings);
          }),
          
          // Notification actions
          addNotification: (notification) => set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: generateId(),
              createdAt: new Date()
            };
            state.notifications.unshift(newNotification);
            // Keep only last 50 notifications
            if (state.notifications.length > 50) {
              state.notifications.pop();
            }
          }),
          
          markNotificationRead: (notificationId) => set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification) {
              notification.isRead = true;
            }
          }),
          
          removeNotification: (notificationId) => set((state) => {
            const index = state.notifications.findIndex(n => n.id === notificationId);
            if (index > -1) {
              state.notifications.splice(index, 1);
            }
          }),
          
          clearExpiredNotifications: () => set((state) => {
            const now = new Date();
            state.notifications = state.notifications.filter(n => 
              !n.expiresAt || n.expiresAt > now
            );
          }),
          
          // Transaction actions
          addTransaction: (transaction) => set((state) => {
            const newTransaction: Transaction = {
              ...transaction,
              id: generateId(),
              createdAt: new Date()
            };
            state.transactions.unshift(newTransaction);
            // Keep only last 1000 transactions
            if (state.transactions.length > 1000) {
              state.transactions.pop();
            }
          }),
          
          // UI actions
          setSelectedAsset: (assetId) => set((state) => {
            state.selectedAssetId = assetId;
          }),
          
          setSelectedRoute: (routeId) => set((state) => {
            state.selectedRouteId = routeId;
          }),
          
          setLoading: (isLoading) => set((state) => {
            state.isLoading = isLoading;
          }),
          
          setError: (error) => set((state) => {
            state.error = error;
          }),
          
          // Undo/Redo actions
          undo: () => set((state) => {
            if (state.history.past.length > 0) {
              const previous = state.history.past[state.history.past.length - 1];
              state.history.past.pop();
              state.history.future.unshift(get());
              Object.assign(state, previous);
            }
          }),
          
          redo: () => set((state) => {
            if (state.history.future.length > 0) {
              const next = state.history.future[0];
              state.history.future.shift();
              state.history.past.push(get());
              Object.assign(state, next);
            }
          }),
          
          clearHistory: () => set((state) => {
            state.history.past = [];
            state.history.future = [];
          }),
          
          // Reset action
          reset: () => set(() => initialState)
        }))
      ),
      {
        name: 'empire-store',
        partialize: (state) => ({
          player: state.player,
          assets: state.assets,
          routes: state.routes,
          market: state.market,
          aiCompanion: state.aiCompanion,
          settings: state.settings
        })
      }
    )
  )
);