import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useEmpireStore } from '../store/empireStore';
import { 
  Player, 
  Asset, 
  Route, 
  MarketGood, 
  MarketEvent,
  AICompanion,
  Transaction,
  Notification 
} from '../types/game';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table names
const TABLES = {
  PLAYERS: 'players',
  ASSETS: 'assets',
  ROUTES: 'routes',
  MARKET_GOODS: 'market_goods',
  MARKET_EVENTS: 'market_events',
  AI_COMPANIONS: 'ai_companions',
  AI_SUGGESTIONS: 'ai_suggestions',
  GAME_SAVES: 'game_saves',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  REALTIME_EVENTS: 'realtime_events'
};

// Realtime subscription channels
const CHANNELS = {
  MARKET: 'market-updates',
  EVENTS: 'game-events',
  PLAYER: (playerId: string) => `player-${playerId}`,
  GLOBAL: 'global-events'
};

// Service class for Supabase operations
export class SupabaseService {
  private subscriptions: Map<string, any> = new Map();

  // Authentication methods
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) throw error;

    // Create player profile
    if (data.user) {
      await this.createPlayer({
        id: data.user.id,
        email,
        username,
        cash: 50000, // Starting cash
        level: 1,
        experience: 0,
        achievements: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signIn({
      email,
      password
    });

    if (error) throw error;

    // Load player data
    if (data.user) {
      await this.loadPlayerData(data.user.id);
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clean up subscriptions
    this.unsubscribeAll();
    
    // Reset store
    useEmpireStore.getState().reset();
  }

  // Player methods
  async createPlayer(player: Player) {
    const { data, error } = await supabase
      .from(TABLES.PLAYERS)
      .insert(player)
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlayer(playerId: string, updates: Partial<Player>) {
    const { data, error } = await supabase
      .from(TABLES.PLAYERS)
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', playerId)
      .single();

    if (error) throw error;
    return data;
  }

  async loadPlayerData(playerId: string) {
    try {
      // Load player profile
      const { data: player, error: playerError } = await supabase
        .from(TABLES.PLAYERS)
        .select('*')
        .eq('id', playerId)
        .single();

      if (playerError) throw playerError;

      // Load assets
      const { data: assets, error: assetsError } = await supabase
        .from(TABLES.ASSETS)
        .select('*')
        .eq('playerId', playerId);

      if (assetsError) throw assetsError;

      // Load routes
      const { data: routes, error: routesError } = await supabase
        .from(TABLES.ROUTES)
        .select('*')
        .eq('playerId', playerId);

      if (routesError) throw routesError;

      // Load AI companion
      const { data: aiCompanion, error: aiError } = await supabase
        .from(TABLES.AI_COMPANIONS)
        .select('*')
        .eq('playerId', playerId)
        .single();

      // Load recent transactions
      const { data: transactions, error: transError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('playerId', playerId)
        .order('createdAt', { ascending: false })
        .limit(100);

      if (transError) throw transError;

      // Load notifications
      const { data: notifications, error: notifError } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('playerId', playerId)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      // Update store with loaded data
      const store = useEmpireStore.getState();
      store.setPlayer(player);
      
      // Add assets to store
      assets?.forEach(asset => store.addAsset(asset));
      
      // Add routes to store
      routes?.forEach(route => store.addRoute(route));
      
      // Set AI companion if exists
      if (aiCompanion) {
        store.setAICompanion(aiCompanion);
      }

      // Add transactions and notifications
      transactions?.forEach(t => store.addTransaction(t));
      notifications?.forEach(n => store.addNotification(n));

      // Start game session
      store.startGameSession(playerId);

      // Set up realtime subscriptions
      await this.setupRealtimeSubscriptions(playerId);

    } catch (error) {
      console.error('Failed to load player data:', error);
      throw error;
    }
  }

  // Game save/load methods
  async saveGameState(playerId: string) {
    const state = useEmpireStore.getState();
    
    const saveData = {
      playerId,
      stateData: JSON.stringify({
        player: state.player,
        assets: state.assets,
        routes: state.routes,
        market: state.market,
        aiCompanion: state.aiCompanion,
        settings: state.settings
      }),
      updatedAt: new Date()
    };

    const { data, error } = await supabase
      .from(TABLES.GAME_SAVES)
      .upsert(saveData, { onConflict: 'playerId' })
      .single();

    if (error) throw error;
    return data;
  }

  async loadGameState(playerId: string) {
    const { data, error } = await supabase
      .from(TABLES.GAME_SAVES)
      .select('stateData')
      .eq('playerId', playerId)
      .single();

    if (error) throw error;
    
    if (data?.stateData) {
      const savedState = JSON.parse(data.stateData);
      const store = useEmpireStore.getState();
      
      // Restore saved state
      store.setPlayer(savedState.player);
      Object.entries(savedState.assets.ships || {}).forEach(([id, ship]) => 
        store.addAsset(ship as Asset)
      );
      Object.entries(savedState.assets.planes || {}).forEach(([id, plane]) => 
        store.addAsset(plane as Asset)
      );
      Object.entries(savedState.assets.warehouses || {}).forEach(([id, warehouse]) => 
        store.addAsset(warehouse as Asset)
      );
      Object.entries(savedState.assets.specialists || {}).forEach(([id, specialist]) => 
        store.addAsset(specialist as Asset)
      );
      Object.entries(savedState.routes || {}).forEach(([id, route]) => 
        store.addRoute(route as Route)
      );
      
      if (savedState.aiCompanion) {
        store.setAICompanion(savedState.aiCompanion);
      }
      
      store.updateSettings(savedState.settings);
    }
    
    return data;
  }

  // Asset methods
  async createAsset(asset: Asset) {
    const { data, error } = await supabase
      .from(TABLES.ASSETS)
      .insert(asset)
      .single();

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().addAsset(data);
    
    return data;
  }

  async updateAsset(assetId: string, updates: Partial<Asset>) {
    const { data, error } = await supabase
      .from(TABLES.ASSETS)
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', assetId)
      .single();

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().updateAsset(assetId, updates);
    
    return data;
  }

  async deleteAsset(assetId: string) {
    const { error } = await supabase
      .from(TABLES.ASSETS)
      .delete()
      .eq('id', assetId);

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().removeAsset(assetId);
  }

  // Route methods
  async createRoute(route: Route) {
    const { data, error } = await supabase
      .from(TABLES.ROUTES)
      .insert(route)
      .single();

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().addRoute(data);
    
    return data;
  }

  async updateRoute(routeId: string, updates: Partial<Route>) {
    const { data, error } = await supabase
      .from(TABLES.ROUTES)
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', routeId)
      .single();

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().updateRoute(routeId, updates);
    
    return data;
  }

  async deleteRoute(routeId: string) {
    const { error } = await supabase
      .from(TABLES.ROUTES)
      .delete()
      .eq('id', routeId);

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().removeRoute(routeId);
  }

  // Market methods
  async loadMarketData() {
    const { data: goods, error: goodsError } = await supabase
      .from(TABLES.MARKET_GOODS)
      .select('*');

    if (goodsError) throw goodsError;

    const { data: events, error: eventsError } = await supabase
      .from(TABLES.MARKET_EVENTS)
      .select('*')
      .gte('endTime', new Date().toISOString());

    if (eventsError) throw eventsError;

    const store = useEmpireStore.getState();
    
    // Update market goods
    goods?.forEach(good => {
      store.updateMarketGood(good.id, good);
    });
    
    // Add active market events
    events?.forEach(event => {
      store.addMarketEvent(event);
    });
  }

  // Realtime subscriptions
  async setupRealtimeSubscriptions(playerId: string) {
    // Subscribe to market updates
    const marketChannel = supabase
      .channel(CHANNELS.MARKET)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.MARKET_GOODS
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          useEmpireStore.getState().updateMarketGood(
            payload.new.id,
            payload.new
          );
          // Record price history
          useEmpireStore.getState().recordPriceHistory(
            payload.new.id,
            payload.new.currentPrice
          );
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.MARKET_EVENTS
      }, (payload) => {
        useEmpireStore.getState().addMarketEvent(payload.new);
      })
      .subscribe();

    this.subscriptions.set(CHANNELS.MARKET, marketChannel);

    // Subscribe to player-specific updates
    const playerChannel = supabase
      .channel(CHANNELS.PLAYER(playerId))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.NOTIFICATIONS,
        filter: `playerId=eq.${playerId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          useEmpireStore.getState().addNotification(payload.new);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.AI_SUGGESTIONS,
        filter: `playerId=eq.${playerId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          useEmpireStore.getState().addAISuggestion(payload.new);
        }
      })
      .subscribe();

    this.subscriptions.set(CHANNELS.PLAYER(playerId), playerChannel);

    // Subscribe to global events (disasters, announcements, etc.)
    const globalChannel = supabase
      .channel(CHANNELS.GLOBAL)
      .on('broadcast', { event: 'disaster' }, (payload) => {
        useEmpireStore.getState().addNotification({
          type: 'WARNING',
          title: 'Disaster Alert!',
          message: payload.message,
          isRead: false
        });
      })
      .on('broadcast', { event: 'announcement' }, (payload) => {
        useEmpireStore.getState().addNotification({
          type: 'INFO',
          title: payload.title,
          message: payload.message,
          isRead: false
        });
      })
      .subscribe();

    this.subscriptions.set(CHANNELS.GLOBAL, globalChannel);
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // Transaction methods
  async recordTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .insert({
        ...transaction,
        createdAt: new Date()
      })
      .single();

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().addTransaction(transaction);
    
    return data;
  }

  // Multiplayer state synchronization
  async broadcastStateUpdate(eventType: string, data: any) {
    const channel = this.subscriptions.get(CHANNELS.GLOBAL);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: eventType,
        payload: data
      });
    }
  }

  // AI Companion methods
  async updateAICompanion(playerId: string, updates: Partial<AICompanion>) {
    const { data, error } = await supabase
      .from(TABLES.AI_COMPANIONS)
      .update({ ...updates, updatedAt: new Date() })
      .eq('playerId', playerId)
      .single();

    if (error) throw error;
    
    // Update local store
    useEmpireStore.getState().updateAICompanion(updates);
    
    return data;
  }

  async createAISuggestion(playerId: string, suggestion: Omit<AISuggestion, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from(TABLES.AI_SUGGESTIONS)
      .insert({
        ...suggestion,
        playerId,
        createdAt: new Date()
      })
      .single();

    if (error) throw error;
    
    return data;
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();