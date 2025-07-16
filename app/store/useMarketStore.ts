import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { marketService } from '@/lib/supabase/markets';
import type {
  MarketItem,
  MarketType,
  PriceHistory,
  Transaction,
  MarketState,
  MarketDynamics,
  PriceCalculationParams,
  MarketUpdateResult,
  GoodsCategory
} from '@/types/market';

interface MarketStore extends MarketState {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeMarket: () => Promise<void>;
  loadMarketItems: (type?: MarketType) => Promise<void>;
  calculatePrice: (params: PriceCalculationParams) => number;
  updateMarketCycle: () => Promise<MarketUpdateResult | null>;
  buyItem: (itemId: string, quantity: number, playerId: string) => Promise<Transaction | null>;
  sellItem: (itemId: string, quantity: number, playerId: string) => Promise<Transaction | null>;
  getItemsByCategory: (category: GoodsCategory) => MarketItem[];
  getMarketTrends: (itemId: string) => { trend: 'up' | 'down' | 'stable'; percentageChange: number };
  subscribeToMarketUpdates: () => void;
  unsubscribeFromMarketUpdates: () => void;
  
  // Utility functions
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialMarketDynamics: MarketDynamics = {
  supplyGrowthRate: 0.02, // 2% per cycle
  demandVolatility: 0.15, // 15% random variation
  priceElasticity: 1.2, // How much price affects demand
  seasonalModifiers: {
    spring: 1.1,
    summer: 1.2,
    fall: 0.9,
    winter: 0.8
  }
};

const initialState: MarketState = {
  items: new Map(),
  priceHistory: new Map(),
  transactions: [],
  lastUpdateCycle: new Date(),
  marketDynamics: initialMarketDynamics
};

export const useMarketStore = create<MarketStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        isLoading: false,
        error: null,

        initializeMarket: async () => {
          set({ isLoading: true, error: null });
          try {
            // Initialize default market items in database
            await marketService.initializeMarket();
            
            // Load all market items
            await get().loadMarketItems();
            
            // Start market update subscription
            get().subscribeToMarketUpdates();
          } catch (error) {
            set({ error: 'Failed to initialize market' });
            console.error('Market initialization error:', error);
          } finally {
            set({ isLoading: false });
          }
        },

        loadMarketItems: async (type?: MarketType) => {
          set({ isLoading: true });
          try {
            const items = await marketService.getMarketItems(type);
            const itemsMap = new Map(items.map(item => [item.id, item]));
            
            // Load price history for each item
            const historyMap = new Map<string, PriceHistory[]>();
            for (const item of items) {
              const history = await marketService.getPriceHistory(item.id, 24);
              historyMap.set(item.id, history);
            }
            
            set({ 
              items: itemsMap,
              priceHistory: historyMap,
              error: null 
            });
          } catch (error) {
            set({ error: 'Failed to load market items' });
            console.error('Load market items error:', error);
          } finally {
            set({ isLoading: false });
          }
        },

        calculatePrice: (params: PriceCalculationParams): number => {
          const {
            baseCost,
            productionCostModifier,
            supply,
            demand,
            volatilityModifier
          } = params;

          // Dynamic pricing formula
          // Price = (BaseCost + ProductionCostModifier) × (Demand / Supply) × (1 + VolatilityModifier)
          const costBase = baseCost * productionCostModifier;
          const supplyDemandRatio = supply > 0 ? demand / supply : 2.0; // Cap at 2x if no supply
          const volatilityFactor = 1 + (Math.random() - 0.5) * volatilityModifier;
          
          return Math.max(
            costBase * 0.5, // Minimum price is 50% of cost base
            costBase * supplyDemandRatio * volatilityFactor
          );
        },

        updateMarketCycle: async (): Promise<MarketUpdateResult | null> => {
          const state = get();
          const updatedItems: MarketItem[] = [];
          const priceChanges: Array<{
            itemId: string;
            oldPrice: number;
            newPrice: number;
            percentageChange: number;
          }> = [];

          try {
            // Update each market item
            state.items.forEach((item) => {
              const oldPrice = item.currentPrice;
              
              // Apply market dynamics
              const newSupply = item.supply * (1 + state.marketDynamics.supplyGrowthRate);
              const demandVariation = (Math.random() - 0.5) * state.marketDynamics.demandVolatility;
              const newDemand = item.demand * (1 + demandVariation);
              
              // Calculate new price
              const newPrice = state.calculatePrice({
                baseCost: item.basePrice,
                productionCostModifier: item.productionCostModifier,
                supply: newSupply,
                demand: newDemand,
                volatilityModifier: item.volatility
              });

              const updatedItem: MarketItem = {
                ...item,
                currentPrice: newPrice,
                supply: newSupply,
                demand: newDemand,
                lastUpdated: new Date()
              };

              updatedItems.push(updatedItem);
              priceChanges.push({
                itemId: item.id,
                oldPrice,
                newPrice,
                percentageChange: ((newPrice - oldPrice) / oldPrice) * 100
              });
            });

            // Update database
            await marketService.updateMarketPrices(updatedItems);
            
            // Update local state
            const newItemsMap = new Map(updatedItems.map(item => [item.id, item]));
            set({
              items: newItemsMap,
              lastUpdateCycle: new Date()
            });

            return {
              updatedItems,
              priceChanges,
              timestamp: new Date()
            };
          } catch (error) {
            console.error('Market cycle update error:', error);
            set({ error: 'Failed to update market cycle' });
            return null;
          }
        },

        buyItem: async (itemId: string, quantity: number, playerId: string): Promise<Transaction | null> => {
          const state = get();
          const item = state.items.get(itemId);
          
          if (!item || item.supply < quantity) {
            set({ error: 'Insufficient supply or item not found' });
            return null;
          }

          try {
            const transaction = await marketService.buyItem(itemId, quantity, playerId);
            
            if (transaction) {
              // Update local state
              const updatedItem = {
                ...item,
                supply: item.supply - quantity,
                demand: item.demand + (quantity * 0.1) // Buying increases demand slightly
              };
              
              const newItems = new Map(state.items);
              newItems.set(itemId, updatedItem);
              
              set({
                items: newItems,
                transactions: [...state.transactions, transaction].slice(-100), // Keep last 100 transactions
                error: null
              });
            }
            
            return transaction;
          } catch (error) {
            console.error('Buy transaction error:', error);
            set({ error: 'Failed to complete purchase' });
            return null;
          }
        },

        sellItem: async (itemId: string, quantity: number, playerId: string): Promise<Transaction | null> => {
          const state = get();
          const item = state.items.get(itemId);
          
          if (!item) {
            set({ error: 'Item not found' });
            return null;
          }

          try {
            const transaction = await marketService.sellItem(itemId, quantity, playerId);
            
            if (transaction) {
              // Update local state
              const updatedItem = {
                ...item,
                supply: item.supply + quantity,
                demand: Math.max(0, item.demand - (quantity * 0.1)) // Selling decreases demand slightly
              };
              
              const newItems = new Map(state.items);
              newItems.set(itemId, updatedItem);
              
              set({
                items: newItems,
                transactions: [...state.transactions, transaction].slice(-100),
                error: null
              });
            }
            
            return transaction;
          } catch (error) {
            console.error('Sell transaction error:', error);
            set({ error: 'Failed to complete sale' });
            return null;
          }
        },

        getItemsByCategory: (category: GoodsCategory): MarketItem[] => {
          const state = get();
          return Array.from(state.items.values()).filter(
            item => item.category === category
          );
        },

        getMarketTrends: (itemId: string): { trend: 'up' | 'down' | 'stable'; percentageChange: number } => {
          const state = get();
          const history = state.priceHistory.get(itemId) || [];
          
          if (history.length < 2) {
            return { trend: 'stable', percentageChange: 0 };
          }

          const recent = history[history.length - 1];
          const previous = history[history.length - 2];
          const percentageChange = ((recent.price - previous.price) / previous.price) * 100;

          let trend: 'up' | 'down' | 'stable';
          if (percentageChange > 1) trend = 'up';
          else if (percentageChange < -1) trend = 'down';
          else trend = 'stable';

          return { trend, percentageChange };
        },

        subscribeToMarketUpdates: () => {
          // This would connect to Supabase realtime or set up a timer for market updates
          // For now, we'll use a simple interval
          const intervalId = setInterval(() => {
            get().updateMarketCycle();
          }, 60000); // Update every 60 seconds

          // Store interval ID for cleanup
          (window as any).__marketUpdateInterval = intervalId;
        },

        unsubscribeFromMarketUpdates: () => {
          const intervalId = (window as any).__marketUpdateInterval;
          if (intervalId) {
            clearInterval(intervalId);
            delete (window as any).__marketUpdateInterval;
          }
        },

        setError: (error: string | null) => set({ error }),

        reset: () => {
          get().unsubscribeFromMarketUpdates();
          set({ ...initialState, isLoading: false, error: null });
        }
      }),
      {
        name: 'market-store',
        partialize: (state) => ({
          items: Array.from(state.items.entries()),
          priceHistory: Array.from(state.priceHistory.entries()),
          transactions: state.transactions,
          lastUpdateCycle: state.lastUpdateCycle,
          marketDynamics: state.marketDynamics
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert arrays back to Maps after rehydration
            state.items = new Map(state.items as any);
            state.priceHistory = new Map(state.priceHistory as any);
          }
        }
      }
    )
  )
);