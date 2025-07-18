import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { marketService } from '@/lib/supabase/markets';
import { subscribeToMarketPrices, subscribeToDisasterEvents } from '@/lib/supabase/realtime';
import type { RealtimeSubscription } from '@/lib/supabase/realtime';
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
  realtimeSubscriptions: RealtimeSubscription[];
  transactionListeners: (() => void)[];
  optimisticUpdates: Map<string, any>; // Track optimistic updates
  
  // Actions
  initializeMarket: () => Promise<void>;
  loadMarketItems: (type?: MarketType) => Promise<void>;
  calculatePrice: (params: PriceCalculationParams) => number;
  updateMarketCycle: () => Promise<MarketUpdateResult | null>;
  buyItem: (itemId: string, quantity: number, playerId: string) => Promise<Transaction | null>;
  sellItem: (itemId: string, quantity: number, playerId: string) => Promise<Transaction | null>;
  buyItemOptimistic: (itemId: string, quantity: number, playerId: string, playerCash: number) => Promise<Transaction | null>;
  sellItemOptimistic: (itemId: string, quantity: number, playerId: string) => Promise<Transaction | null>;
  getItemsByCategory: (category: GoodsCategory) => MarketItem[];
  getMarketTrends: (itemId: string) => { trend: 'up' | 'down' | 'stable'; percentageChange: number };
  subscribeToMarketUpdates: () => void;
  unsubscribeFromMarketUpdates: () => void;
  handleRealtimeUpdate: (payload: any) => void;
  handleDisasterEvent: (payload: any) => void;
  
  // Transaction event handling
  onTransactionComplete: (callback: () => void) => () => void;
  notifyTransactionComplete: () => void;
  
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
        realtimeSubscriptions: [],
        transactionListeners: [],
        optimisticUpdates: new Map(),
        
        onTransactionComplete: (callback: () => void) => {
          const listeners = get().transactionListeners;
          set({ transactionListeners: [...listeners, callback] });
          
          // Return unsubscribe function
          return () => {
            const currentListeners = get().transactionListeners;
            set({ transactionListeners: currentListeners.filter(l => l !== callback) });
          };
        },
        
        notifyTransactionComplete: () => {
          const listeners = get().transactionListeners;
          listeners.forEach(callback => callback());
        },

        initializeMarket: async () => {
          console.log('Market initialization starting...');
          set({ isLoading: true, error: null });
          
          try {
            // Load initial market items
            await get().loadMarketItems();
            
            // Subscribe to realtime updates
            get().subscribeToMarketUpdates();
            
            console.log('Market initialization complete with realtime');
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
            // Load items directly from database
            const items = await marketService.getMarketItems(type);
            
            if (!items || items.length === 0) {
              throw new Error('No market items found in database');
            }
            
            const itemsMap = new Map(items.map(item => [item.id, item]));
            
            set({ 
              items: itemsMap,
              priceHistory: new Map(),
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
          
          // Don't update if there are no items
          if (!state.items || state.items.size === 0) {
            console.log('No market items to update');
            return null;
          }

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
              // Skip if item doesn't have required properties
              if (!item.id || !item.currentPrice || !item.basePrice) {
                console.warn('Skipping invalid item:', item);
                return;
              }

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

            // Only update if we have valid items
            if (updatedItems.length === 0) {
              console.log('No valid items to update');
              return null;
            }

            // Update database
            const success = await marketService.updateMarketPrices(updatedItems);
            
            if (!success) {
              console.warn('Failed to update market prices in database, but continuing with local update');
            }
            
            // Update local state regardless of database update
            const newItemsMap = new Map(updatedItems.map(item => [item.id, item]));
            set({
              items: newItemsMap,
              lastUpdateCycle: new Date(),
              error: null // Clear any previous errors
            });

            return {
              updatedItems,
              priceChanges,
              timestamp: new Date()
            };
          } catch (error) {
            console.error('Market cycle update error:', error instanceof Error ? error.message : 'Unknown error', error);
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
            // Pass the current client-side price
            const transaction = await marketService.buyItem(itemId, quantity, playerId, item.currentPrice);
            
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
              
              // Notify listeners after a short delay to ensure server has updated
              setTimeout(() => {
                get().notifyTransactionComplete();
              }, 300);
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
            // Pass the current client-side price
            const transaction = await marketService.sellItem(itemId, quantity, playerId, 'port-1', item.currentPrice);
            
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
              
              // Notify listeners after a short delay to ensure server has updated
              setTimeout(() => {
                get().notifyTransactionComplete();
              }, 300);
            }
            
            return transaction;
          } catch (error) {
            console.error('Sell transaction error:', error);
            set({ error: 'Failed to complete sale' });
            return null;
          }
        },

        buyItemOptimistic: async (itemId: string, quantity: number, playerId: string, playerCash: number): Promise<Transaction | null> => {
          const state = get();
          const item = state.items.get(itemId);
          
          if (!item || item.supply < quantity) {
            set({ error: 'Insufficient supply or item not found' });
            return null;
          }
          
          // Calculate expected values
          const expectedCost = item.currentPrice * quantity;
          
          if (playerCash < expectedCost) {
            set({ error: 'Insufficient funds' });
            return null;
          }
          
          // Store rollback state
          const rollbackState = {
            item: { ...item },
            transactions: [...state.transactions]
          };
          
          // Create optimistic transaction
          const optimisticTransaction: Transaction = {
            id: `optimistic-${Date.now()}`,
            marketItemId: itemId,
            type: 'BUY',
            quantity,
            pricePerUnit: item.currentPrice,
            totalPrice: expectedCost,
            playerId,
            timestamp: new Date()
          };
          
          // Apply optimistic update immediately
          const optimisticItem = {
            ...item,
            supply: item.supply - quantity,
            demand: item.demand + (quantity * 0.1)
          };
          
          const newItems = new Map(state.items);
          newItems.set(itemId, optimisticItem);
          
          set({
            items: newItems,
            transactions: [...state.transactions, optimisticTransaction].slice(-100),
            error: null
          });
          
          // Track this optimistic update
          state.optimisticUpdates.set(optimisticTransaction.id, rollbackState);
          
          // Notify immediately for instant UI update
          get().notifyTransactionComplete();
          
          try {
            // Send to server
            const serverTransaction = await marketService.buyItem(itemId, quantity, playerId, item.currentPrice);
            
            if (serverTransaction) {
              // Replace optimistic transaction with real one
              const updatedTransactions = state.transactions.filter(t => t.id !== optimisticTransaction.id);
              
              set({
                transactions: [...updatedTransactions, serverTransaction].slice(-100)
              });
              
              // Clean up optimistic update tracking
              state.optimisticUpdates.delete(optimisticTransaction.id);
              
              return serverTransaction;
            } else {
              throw new Error('Server returned null transaction');
            }
          } catch (error) {
            // Rollback on failure
            console.error('Buy transaction failed, rolling back:', error);
            
            const newItems = new Map(state.items);
            newItems.set(itemId, rollbackState.item);
            
            set({
              items: newItems,
              transactions: rollbackState.transactions,
              error: 'Purchase failed - changes reverted'
            });
            
            // Clean up and notify
            state.optimisticUpdates.delete(optimisticTransaction.id);
            get().notifyTransactionComplete();
            
            return null;
          }
        },

        sellItemOptimistic: async (itemId: string, quantity: number, playerId: string): Promise<Transaction | null> => {
          const state = get();
          const item = state.items.get(itemId);
          
          if (!item) {
            set({ error: 'Item not found' });
            return null;
          }
          
          // Store rollback state
          const rollbackState = {
            item: { ...item },
            transactions: [...state.transactions]
          };
          
          // Create optimistic transaction
          const sellPrice = item.currentPrice * 0.9; // 90% of market price
          const optimisticTransaction: Transaction = {
            id: `optimistic-${Date.now()}`,
            marketItemId: itemId,
            type: 'SELL',
            quantity,
            pricePerUnit: sellPrice,
            totalPrice: sellPrice * quantity,
            playerId,
            timestamp: new Date()
          };
          
          // Apply optimistic update immediately
          const optimisticItem = {
            ...item,
            supply: item.supply + quantity,
            demand: Math.max(0, item.demand - (quantity * 0.1))
          };
          
          const newItems = new Map(state.items);
          newItems.set(itemId, optimisticItem);
          
          set({
            items: newItems,
            transactions: [...state.transactions, optimisticTransaction].slice(-100),
            error: null
          });
          
          // Track this optimistic update
          state.optimisticUpdates.set(optimisticTransaction.id, rollbackState);
          
          // Notify immediately for instant UI update
          get().notifyTransactionComplete();
          
          try {
            // Send to server
            const serverTransaction = await marketService.sellItem(itemId, quantity, playerId, 'port-1', item.currentPrice);
            
            if (serverTransaction) {
              // Replace optimistic transaction with real one
              const updatedTransactions = state.transactions.filter(t => t.id !== optimisticTransaction.id);
              
              set({
                transactions: [...updatedTransactions, serverTransaction].slice(-100)
              });
              
              // Clean up optimistic update tracking
              state.optimisticUpdates.delete(optimisticTransaction.id);
              
              return serverTransaction;
            } else {
              throw new Error('Server returned null transaction');
            }
          } catch (error) {
            // Rollback on failure
            console.error('Sell transaction failed, rolling back:', error);
            
            const newItems = new Map(state.items);
            newItems.set(itemId, rollbackState.item);
            
            set({
              items: newItems,
              transactions: rollbackState.transactions,
              error: 'Sale failed - changes reverted'
            });
            
            // Clean up and notify
            state.optimisticUpdates.delete(optimisticTransaction.id);
            get().notifyTransactionComplete();
            
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
          console.log('🎯 Setting up realtime market subscriptions');
          const state = get();
          
          // Subscribe to market price updates
          const priceSubscription = subscribeToMarketPrices((payload) => {
            get().handleRealtimeUpdate(payload);
          });
          
          // Subscribe to disaster events
          const disasterSubscription = subscribeToDisasterEvents((payload) => {
            get().handleDisasterEvent(payload);
          });
          
          // Store subscriptions for cleanup
          set({ 
            realtimeSubscriptions: [
              ...state.realtimeSubscriptions,
              priceSubscription,
              disasterSubscription
            ]
          });
        },

        unsubscribeFromMarketUpdates: () => {
          console.log('🔌 Cleaning up realtime subscriptions');
          const { realtimeSubscriptions } = get();
          
          realtimeSubscriptions.forEach(sub => sub.unsubscribe());
          set({ realtimeSubscriptions: [] });
        },

        handleRealtimeUpdate: (payload: any) => {
          console.log('📈 Realtime market update:', payload);
          const state = get();
          
          if (payload.new) {
            // Convert database format to app format
            const updatedItem: MarketItem = {
              id: payload.new.id,
              name: payload.new.name,
              type: payload.new.type,
              category: payload.new.category,
              basePrice: payload.new.base_price,
              currentPrice: payload.new.current_price,
              supply: payload.new.supply,
              demand: payload.new.demand,
              volatility: payload.new.volatility,
              productionCostModifier: payload.new.production_cost_modifier,
              lastUpdated: new Date()
            };
            
            // Update the item in our local store
            const newItems = new Map(state.items);
            newItems.set(updatedItem.id, updatedItem);
            set({ items: newItems });
          }
        },

        handleDisasterEvent: (payload: any) => {
          console.log('🌊 Disaster event received:', payload);
          // Handle disaster events that affect multiple items
          // This would update prices based on the disaster impact
          const { affectedItems, priceImpact, message } = payload;
          
          if (affectedItems && priceImpact) {
            const state = get();
            const newItems = new Map(state.items);
            
            affectedItems.forEach((itemId: string) => {
              const item = newItems.get(itemId);
              if (item) {
                // Apply disaster price impact
                const newPrice = item.currentPrice * priceImpact;
                newItems.set(itemId, {
                  ...item,
                  currentPrice: newPrice,
                  lastUpdated: new Date()
                });
              }
            });
            
            set({ items: newItems });
            
            // Show notification to user
            if (message) {
              console.log('🚨 MARKET ALERT:', message);
              // You could trigger a toast notification here
            }
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