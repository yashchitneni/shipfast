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

// Import asset types from the asset store
import {
  AssetDefinition,
  PlacedAsset,
  AssetPreview,
  AssetValidation,
  AssetStats,
  AssetCategory,
  PortNode,
  Position
} from '../../app/lib/types/assets';

// Asset service for database operations
import { assetService } from '../../lib/supabase/assets';

// Store state interface
export interface EmpireState {
  // Player data
  player: Player | null;
  
  // Assets - legacy structure from empireStore
  assets: {
    ships: Record<string, Ship>;
    planes: Record<string, Plane>;
    warehouses: Record<string, Warehouse>;
    specialists: Record<string, Specialist>;
  };
  
  // Asset management - from useAssetStore
  assetDefinitions: Map<string, AssetDefinition>;
  placedAssets: Map<string, PlacedAsset>;
  assetPreview: AssetPreview | null;
  portNodes: Map<string, PortNode>;
  playerLicenses: string[];
  
  // Game state - from useGameStore
  ships: Ship[];
  ports: any[];
  marketPrices: any[];
  isPaused: boolean;
  gameSpeed: number;
  currentTime: Date;
  
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
  selectedShip: string | null;
  selectedPort: string | null;
  activePanel: 'market' | 'fleet' | 'ports' | 'ai' | null;
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
  setPlayerId: (id: string) => void;
  setPlayerMoney: (amount: number) => void;
  deductMoney: (amount: number) => Promise<boolean>;
  setPlayerLevel: (level: number) => void;
  addLicense: (license: string) => void;
  
  // Legacy asset actions
  addAsset: (asset: Asset) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  removeAsset: (assetId: string) => void;
  assignAssetToRoute: (assetId: string, routeId: string) => void;
  unassignAssetFromRoute: (assetId: string) => void;
  
  // Asset management actions - from useAssetStore
  loadAssetDefinitions: (definitions: AssetDefinition[]) => void;
  setPortNodes: (ports: PortNode[]) => void;
  loadPlayerAssets: () => Promise<void>;
  startAssetPreview: (definitionId: string, position: Position) => void;
  updateAssetPreview: (position: Position, rotation?: number) => void;
  cancelAssetPreview: () => void;
  placeAsset: () => Promise<{ success: boolean; error?: string }>;
  removeAssetFromWorld: (assetId: string) => Promise<boolean>;
  rotateAsset: (assetId: string, rotation: number) => Promise<void>;
  assignAssetToRouteWorld: (assetId: string, routeId: string) => Promise<void>;
  unassignAssetFromWorld: (assetId: string) => Promise<void>;
  updateAssetStatus: (assetId: string, status: PlacedAsset['status']) => Promise<void>;
  validateAssetPlacement: (definitionId: string, position: Position) => AssetValidation;
  checkPortSnap: (position: Position, snapDistance?: number) => PortNode | null;
  getAssetStats: () => AssetStats;
  getAssetsByType: (type: any) => PlacedAsset[];
  getAssetsByCategory: (category: AssetCategory) => PlacedAsset[];
  getAssetsAtPort: (portId: string) => PlacedAsset[];
  
  // Game state actions - from useGameStore
  addShip: (ship: Ship) => void;
  updateShip: (id: string, updates: Partial<Ship>) => void;
  removeShip: (id: string) => void;
  updateMarketPrices: (prices: any[]) => void;
  setSelectedShip: (id: string | null) => void;
  setSelectedPort: (id: string | null) => void;
  setActivePanel: (panel: 'market' | 'fleet' | 'ports' | 'ai' | null) => void;
  setPaused: (paused: boolean) => void;
  setGameSpeed: (speed: number) => void;
  
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
  // Asset management state
  assetDefinitions: new Map(),
  placedAssets: new Map(),
  assetPreview: null,
  portNodes: new Map(),
  playerLicenses: [],
  // Game state
  ships: [],
  ports: [],
  marketPrices: [],
  isPaused: false,
  gameSpeed: 1,
  currentTime: new Date(),
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
  selectedShip: null,
  selectedPort: null,
  activePanel: null,
  isLoading: false,
  error: null,
  history: {
    past: [],
    future: []
  }
};

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Snap distance for port snapping
const SNAP_DISTANCE = 50;

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
          
          setPlayerId: (id) => set((state) => {
            if (state.player) {
              state.player.id = id;
            }
          }),
          
          updatePlayerCash: (amount) => set((state) => {
            if (state.player) {
              state.player.cash += amount;
              state.player.updatedAt = new Date();
            }
          }),
          
          setPlayerMoney: (amount) => set((state) => {
            if (state.player) {
              state.player.cash = amount;
            }
          }),
          
          deductMoney: async (amount) => {
            const state = get();
            if (!state.player || state.player.cash < amount) return false;
            
            // In a real implementation, this would sync with the database
            // For now, we'll just update the local state
            set((state) => {
              if (state.player) {
                state.player.cash -= amount;
              }
            });
            return true;
          },
          
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
          
          setPlayerLevel: (level) => set((state) => {
            if (state.player) {
              state.player.level = level;
            }
          }),
          
          addLicense: (license) => set((state) => {
            if (!state.playerLicenses.includes(license)) {
              state.playerLicenses.push(license);
            }
          }),
          
          // Legacy asset actions
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
            Object.values(state.routes).forEach((route) => {
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
          
          // Asset management actions - from useAssetStore
          loadAssetDefinitions: (definitions) => set((state) => {
            const defMap = new Map<string, AssetDefinition>();
            definitions.forEach(def => defMap.set(def.id, def));
            state.assetDefinitions = defMap;
          }),
          
          setPortNodes: (ports) => set((state) => {
            const portMap = new Map<string, PortNode>();
            ports.forEach(port => portMap.set(port.id, port));
            state.portNodes = portMap;
          }),
          
          loadPlayerAssets: async () => {
            const state = get();
            if (!state.player?.id) return;
            
            // First, get player info to sync cash
            const { data: player } = await assetService.getPlayer(state.player.id);
            if (player) {
              set((state) => {
                if (state.player) {
                  state.player.cash = player.cash;
                }
              });
            }
            
            const { data, error } = await assetService.getPlayerAssets(state.player.id);
            if (error) {
              console.log('No existing assets found (this is normal for new players)');
              return;
            }
            
            if (data) {
              const assetMap = new Map<string, PlacedAsset>();
              data.forEach(dbAsset => {
                const stats = dbAsset.stats as any;
                const placedAsset: PlacedAsset = {
                  id: dbAsset.asset_id,
                  definitionId: stats.definitionId,
                  ownerId: dbAsset.owner_id,
                  position: stats.position,
                  rotation: stats.rotation || 0,
                  portId: stats.portId,
                  routeId: dbAsset.assigned_route_id || undefined,
                  status: stats.status || 'active',
                  health: stats.health || 100,
                  purchasedAt: stats.purchasedAt || new Date(dbAsset.created_at).getTime(),
                  customName: dbAsset.custom_name || undefined
                };
                assetMap.set(placedAsset.id, placedAsset);
              });
              set((state) => {
                state.placedAssets = assetMap;
              });
            }
          },
          
          startAssetPreview: (definitionId, position) => {
            const state = get();
            const definition = state.assetDefinitions.get(definitionId);
            if (!definition) return;
            
            const validation = state.validateAssetPlacement(definitionId, position);
            const snapPort = state.checkPortSnap(position);
            
            set((state) => {
              state.assetPreview = {
                definitionId,
                position,
                rotation: 0,
                isValid: validation.canAfford && validation.meetsRequirements && validation.hasValidPosition,
                snapToPort: snapPort?.id,
                validationErrors: validation.errors
              };
            });
          },
          
          updateAssetPreview: (position, rotation) => {
            const state = get();
            if (!state.assetPreview) return;
            
            const validation = state.validateAssetPlacement(state.assetPreview.definitionId, position);
            const snapPort = state.checkPortSnap(position);
            
            set((state) => {
              if (state.assetPreview) {
                state.assetPreview.position = snapPort ? snapPort.position : position;
                state.assetPreview.rotation = rotation ?? state.assetPreview.rotation;
                state.assetPreview.isValid = validation.canAfford && validation.meetsRequirements && validation.hasValidPosition;
                state.assetPreview.snapToPort = snapPort?.id;
                state.assetPreview.validationErrors = validation.errors;
              }
            });
          },
          
          cancelAssetPreview: () => set((state) => {
            state.assetPreview = null;
          }),
          
          placeAsset: async () => {
            const state = get();
            const preview = state.assetPreview;
            
            if (!preview || !preview.isValid || !state.player?.id) {
              return { success: false, error: 'Invalid placement' };
            }
            
            const definition = state.assetDefinitions.get(preview.definitionId);
            if (!definition) {
              return { success: false, error: 'Asset definition not found' };
            }
            
            // Deduct money from database
            const { success: deductSuccess, error: deductError } = await assetService.deductPlayerCash(
              state.player.id,
              definition.cost
            );
            
            if (!deductSuccess) {
              return { success: false, error: deductError?.message || 'Insufficient funds' };
            }
            
            // Create placed asset
            const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const placedAsset: PlacedAsset = {
              id: assetId,
              definitionId: preview.definitionId,
              ownerId: state.player.id,
              position: preview.position,
              rotation: preview.rotation,
              portId: preview.snapToPort,
              status: 'active',
              health: 100,
              purchasedAt: Date.now()
            };
            
            // Save to database
            const { data, error } = await assetService.createAsset(placedAsset, definition, state.player.id);
            
            if (error) {
              // Refund the money if asset creation failed
              await assetService.addPlayerCash(state.player.id, definition.cost);
              return { success: false, error: error.message || 'Failed to create asset' };
            }
            
            // Update local state
            set((state) => {
              state.placedAssets.set(assetId, placedAsset);
              state.assetPreview = null;
              if (state.player) {
                state.player.cash -= definition.cost;
              }
            });
            
            return { success: true };
          },
          
          removeAssetFromWorld: async (assetId) => {
            const state = get();
            const asset = state.placedAssets.get(assetId);
            if (!asset || !state.player?.id) return false;
            
            const definition = state.assetDefinitions.get(asset.definitionId);
            if (!definition) return false;
            
            // Remove from database
            const { error } = await assetService.deleteAsset(assetId);
            if (error) {
              console.error('Failed to delete asset:', error);
              return false;
            }
            
            // Refund partial value (50%)
            const refund = Math.floor(definition.cost * 0.5);
            await assetService.addPlayerCash(state.player.id, refund);
            
            // Remove from local state
            set((state) => {
              state.placedAssets.delete(assetId);
              if (state.player) {
                state.player.cash += refund;
              }
            });
            
            return true;
          },
          
          rotateAsset: async (assetId, rotation) => {
            const state = get();
            const asset = state.placedAssets.get(assetId);
            if (!asset) return;
            
            // Update database
            await assetService.updateAsset(assetId, { rotation });
            
            // Update local state
            set((state) => {
              const asset = state.placedAssets.get(assetId);
              if (asset) {
                asset.rotation = rotation;
                state.placedAssets.set(assetId, asset);
              }
            });
          },
          
          assignAssetToRouteWorld: async (assetId, routeId) => {
            const state = get();
            const asset = state.placedAssets.get(assetId);
            if (!asset) return;
            
            // Update database
            await assetService.updateAsset(assetId, { routeId, status: 'transit' });
            
            // Update local state
            set((state) => {
              const asset = state.placedAssets.get(assetId);
              if (asset) {
                asset.routeId = routeId;
                asset.status = 'transit';
                state.placedAssets.set(assetId, asset);
              }
            });
          },
          
          unassignAssetFromWorld: async (assetId) => {
            const state = get();
            const asset = state.placedAssets.get(assetId);
            if (!asset) return;
            
            // Update database
            await assetService.updateAsset(assetId, { routeId: undefined, status: 'active' });
            
            // Update local state
            set((state) => {
              const asset = state.placedAssets.get(assetId);
              if (asset) {
                asset.routeId = undefined;
                asset.status = 'active';
                state.placedAssets.set(assetId, asset);
              }
            });
          },
          
          updateAssetStatus: async (assetId, status) => {
            const state = get();
            const asset = state.placedAssets.get(assetId);
            if (!asset) return;
            
            // Update database
            await assetService.updateAsset(assetId, { status });
            
            // Update local state
            set((state) => {
              const asset = state.placedAssets.get(assetId);
              if (asset) {
                asset.status = status;
                state.placedAssets.set(assetId, asset);
              }
            });
          },
          
          validateAssetPlacement: (definitionId, position) => {
            const state = get();
            const definition = state.assetDefinitions.get(definitionId);
            
            if (!definition) {
              return {
                canAfford: false,
                meetsRequirements: false,
                hasValidPosition: false,
                noConflicts: false,
                errors: ['Asset definition not found'],
                warnings: []
              };
            }
            
            const errors: string[] = [];
            const warnings: string[] = [];
            
            // Check money
            const canAfford = (state.player?.cash || 0) >= definition.cost;
            if (!canAfford) {
              errors.push(`Insufficient funds. Need $${definition.cost.toLocaleString()}`);
            }
            
            // Check requirements
            let meetsRequirements = true;
            if (definition.requirements) {
              if (definition.requirements.minLevel && (state.player?.level || 0) < definition.requirements.minLevel) {
                meetsRequirements = false;
                errors.push(`Requires level ${definition.requirements.minLevel}`);
              }
              
              if (definition.requirements.licenses) {
                const missingLicenses = definition.requirements.licenses.filter(
                  lic => !state.playerLicenses.includes(lic)
                );
                if (missingLicenses.length > 0) {
                  meetsRequirements = false;
                  errors.push(`Missing licenses: ${missingLicenses.join(', ')}`);
                }
              }
            }
            
            // Check position validity (basic bounds check)
            const hasValidPosition = position.x >= 0 && position.y >= 0;
            if (!hasValidPosition) {
              errors.push('Invalid position');
            }
            
            // Check for conflicts (simplified - in real game would check overlaps)
            const noConflicts = true;
            
            return {
              canAfford,
              meetsRequirements,
              hasValidPosition,
              noConflicts,
              errors,
              warnings
            };
          },
          
          checkPortSnap: (position, snapDistance = SNAP_DISTANCE) => {
            const state = get();
            
            for (const port of state.portNodes.values()) {
              const distance = Math.sqrt(
                Math.pow(position.x - port.position.x, 2) + 
                Math.pow(position.y - port.position.y, 2)
              );
              
              if (distance <= snapDistance) {
                return port;
              }
            }
            
            return null;
          },
          
          getAssetStats: () => {
            const state = get();
            const assets = Array.from(state.placedAssets.values());
            
            const stats: AssetStats = {
              totalAssets: assets.length,
              assetsByType: {} as Record<any, number>,
              assetsByCategory: {} as Record<AssetCategory, number>,
              totalValue: 0,
              totalMaintenance: 0,
              utilizationRate: 0
            };
            
            // Count assets and calculate totals
            assets.forEach(asset => {
              const definition = state.assetDefinitions.get(asset.definitionId);
              if (!definition) return;
              
              // Count by type
              stats.assetsByType[definition.type] = (stats.assetsByType[definition.type] || 0) + 1;
              
              // Count by category
              stats.assetsByCategory[definition.category] = (stats.assetsByCategory[definition.category] || 0) + 1;
              
              // Add to totals
              stats.totalValue += definition.cost;
              stats.totalMaintenance += definition.maintenanceCost;
            });
            
            // Calculate utilization (assets in transit vs total transport assets)
            const transportAssets = assets.filter(a => {
              const def = state.assetDefinitions.get(a.definitionId);
              return def?.category === 'transport';
            });
            
            const activeTransport = transportAssets.filter(a => a.status === 'transit').length;
            stats.utilizationRate = transportAssets.length > 0 
              ? activeTransport / transportAssets.length 
              : 0;
            
            return stats;
          },
          
          getAssetsByType: (type) => {
            const state = get();
            return Array.from(state.placedAssets.values()).filter(asset => {
              const definition = state.assetDefinitions.get(asset.definitionId);
              return definition?.type === type;
            });
          },
          
          getAssetsByCategory: (category) => {
            const state = get();
            return Array.from(state.placedAssets.values()).filter(asset => {
              const definition = state.assetDefinitions.get(asset.definitionId);
              return definition?.category === category;
            });
          },
          
          getAssetsAtPort: (portId) => {
            const state = get();
            return Array.from(state.placedAssets.values()).filter(
              asset => asset.portId === portId
            );
          },
          
          // Game state actions - from useGameStore
                     addShip: (ship: Ship) => set((state) => {
             state.ships.push(ship);
           }),
           
           updateShip: (id: string, updates: Partial<Ship>) => set((state) => {
             const index = state.ships.findIndex((ship: Ship) => ship.id === id);
             if (index !== -1) {
               Object.assign(state.ships[index], updates);
             }
           }),
          
                     removeShip: (id: string) => set((state) => {
             state.ships = state.ships.filter((ship: Ship) => ship.id !== id);
           }),
          
          updateMarketPrices: (prices) => set((state) => {
            state.marketPrices = prices;
          }),
          
          setSelectedShip: (id) => set((state) => {
            state.selectedShip = id;
          }),
          
          setSelectedPort: (id) => set((state) => {
            state.selectedPort = id;
          }),
          
          setActivePanel: (panel) => set((state) => {
            state.activePanel = panel;
          }),
          
          setPaused: (paused) => set((state) => {
            state.isPaused = paused;
          }),
          
          setGameSpeed: (speed) => set((state) => {
            state.gameSpeed = speed;
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
          // Don't persist Maps - they don't serialize properly
          // placedAssets: state.placedAssets,
          // assetDefinitions: state.assetDefinitions,
          // portNodes: state.portNodes,
          routes: state.routes,
          market: state.market,
          aiCompanion: state.aiCompanion,
          settings: state.settings,
          playerLicenses: state.playerLicenses
        }),
        // Rehydrate Maps properly
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Ensure Maps are properly initialized after rehydration
            if (!state.placedAssets || typeof state.placedAssets.entries !== 'function') {
              state.placedAssets = new Map();
            }
            if (!state.assetDefinitions || typeof state.assetDefinitions.get !== 'function') {
              state.assetDefinitions = new Map();
            }
            if (!state.portNodes || typeof state.portNodes.get !== 'function') {
              state.portNodes = new Map();
            }
          }
        }
      }
    )
  )
);

// Selectors for common queries (maintaining compatibility with useGameStore)
export const usePlayer = () => useEmpireStore((state) => state.player);
export const useShips = () => useEmpireStore((state) => state.ships);
export const usePorts = () => useEmpireStore((state) => state.ports);
export const useMarketPrices = () => useEmpireStore((state) => state.marketPrices);
export const useSelectedShip = () => {
  const selectedId = useEmpireStore((state) => state.selectedShip);
  const ships = useEmpireStore((state) => state.ships);
  return ships.find((ship) => ship.id === selectedId);
};

// Export the store as useAssetStore and useGameStore for compatibility
export const useAssetStore = useEmpireStore;
export const useGameStore = useEmpireStore;