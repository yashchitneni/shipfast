import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase';
import { useEmpireStore } from '../empireStore';
import { MarketGood, MarketEvent, Notification } from '../../types/game';

// Multiplayer event types
export enum MultiplayerEvent {
  // Player events
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  PLAYER_UPDATE = 'player_update',
  
  // Market events
  MARKET_UPDATE = 'market_update',
  MARKET_EVENT = 'market_event',
  
  // Competition events
  AUCTION_STARTED = 'auction_started',
  AUCTION_BID = 'auction_bid',
  AUCTION_ENDED = 'auction_ended',
  
  // World events
  DISASTER_ALERT = 'disaster_alert',
  GLOBAL_EVENT = 'global_event',
  
  // Leaderboard events
  LEADERBOARD_UPDATE = 'leaderboard_update',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked'
}

// Player presence data
export interface PlayerPresence {
  playerId: string;
  username: string;
  level: number;
  netWorth: number;
  status: 'online' | 'idle' | 'away';
  lastSeen: Date;
  location?: string; // Current view/port
}

// Auction data
export interface Auction {
  id: string;
  type: 'asset' | 'route' | 'contract';
  item: any;
  currentBid: number;
  highestBidder: string;
  endTime: Date;
  participants: string[];
}

// Multiplayer state
export interface MultiplayerState {
  channel: RealtimeChannel | null;
  presence: Map<string, PlayerPresence>;
  activeAuctions: Map<string, Auction>;
  worldEvents: MarketEvent[];
  leaderboard: PlayerPresence[];
}

// Multiplayer manager class
export class MultiplayerManager {
  private static instance: MultiplayerManager;
  private state: MultiplayerState = {
    channel: null,
    presence: new Map(),
    activeAuctions: new Map(),
    worldEvents: [],
    leaderboard: []
  };
  
  private constructor() {}
  
  static getInstance(): MultiplayerManager {
    if (!MultiplayerManager.instance) {
      MultiplayerManager.instance = new MultiplayerManager();
    }
    return MultiplayerManager.instance;
  }
  
  // Connect to multiplayer session
  async connect(playerId: string, worldId: string = 'global') {
    try {
      // Create or join channel
      this.state.channel = supabase.channel(`world:${worldId}`, {
        config: {
          presence: {
            key: playerId
          }
        }
      });
      
      // Set up presence tracking
      this.setupPresence();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Subscribe to channel
      await this.state.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to multiplayer world:', worldId);
          
          // Track presence
          await this.updatePresence();
          
          // Load initial world state
          await this.loadWorldState();
        }
      });
      
    } catch (error) {
      console.error('Failed to connect to multiplayer:', error);
      throw error;
    }
  }
  
  // Disconnect from multiplayer
  async disconnect() {
    if (this.state.channel) {
      await supabase.removeChannel(this.state.channel);
      this.state.channel = null;
      this.state.presence.clear();
      this.state.activeAuctions.clear();
      console.log('Disconnected from multiplayer');
    }
  }
  
  // Setup presence tracking
  private setupPresence() {
    if (!this.state.channel) return;
    
    // Track presence state changes
    this.state.channel.on('presence', { event: 'sync' }, () => {
      const state = this.state.channel!.presenceState<PlayerPresence>();
      this.updatePresenceMap(state);
    });
    
    this.state.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Player joined:', key);
      this.handlePlayerJoined(newPresences);
    });
    
    this.state.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Player left:', key);
      this.handlePlayerLeft(leftPresences);
    });
  }
  
  // Setup event listeners
  private setupEventListeners() {
    if (!this.state.channel) return;
    
    // Market updates
    this.state.channel.on('broadcast', { event: MultiplayerEvent.MARKET_UPDATE }, ({ payload }) => {
      this.handleMarketUpdate(payload);
    });
    
    this.state.channel.on('broadcast', { event: MultiplayerEvent.MARKET_EVENT }, ({ payload }) => {
      this.handleMarketEvent(payload);
    });
    
    // Auction events
    this.state.channel.on('broadcast', { event: MultiplayerEvent.AUCTION_STARTED }, ({ payload }) => {
      this.handleAuctionStarted(payload);
    });
    
    this.state.channel.on('broadcast', { event: MultiplayerEvent.AUCTION_BID }, ({ payload }) => {
      this.handleAuctionBid(payload);
    });
    
    this.state.channel.on('broadcast', { event: MultiplayerEvent.AUCTION_ENDED }, ({ payload }) => {
      this.handleAuctionEnded(payload);
    });
    
    // World events
    this.state.channel.on('broadcast', { event: MultiplayerEvent.DISASTER_ALERT }, ({ payload }) => {
      this.handleDisasterAlert(payload);
    });
    
    this.state.channel.on('broadcast', { event: MultiplayerEvent.GLOBAL_EVENT }, ({ payload }) => {
      this.handleGlobalEvent(payload);
    });
    
    // Leaderboard updates
    this.state.channel.on('broadcast', { event: MultiplayerEvent.LEADERBOARD_UPDATE }, ({ payload }) => {
      this.handleLeaderboardUpdate(payload);
    });
    
    this.state.channel.on('broadcast', { event: MultiplayerEvent.ACHIEVEMENT_UNLOCKED }, ({ payload }) => {
      this.handleAchievementUnlocked(payload);
    });
  }
  
  // Update own presence
  async updatePresence() {
    if (!this.state.channel) return;
    
    const state = useEmpireStore.getState();
    const player = state.player;
    
    if (!player) return;
    
    const presence: PlayerPresence = {
      playerId: player.id,
      username: player.username,
      level: player.level,
      netWorth: this.calculateNetWorth(),
      status: 'online',
      lastSeen: new Date(),
      location: state.selectedRouteId || undefined
    };
    
    await this.state.channel.track(presence);
  }
  
  // Update presence map
  private updatePresenceMap(state: RealtimePresenceState<PlayerPresence>) {
    this.state.presence.clear();
    
    Object.entries(state).forEach(([key, presences]) => {
      if (presences.length > 0) {
        // Use the most recent presence
        const presence = presences[presences.length - 1] as PlayerPresence;
        this.state.presence.set(key, presence);
      }
    });
    
    // Update leaderboard
    this.updateLeaderboard();
  }
  
  // Handle player joined
  private handlePlayerJoined(presences: any[]) {
    const store = useEmpireStore.getState();
    
    presences.forEach((presence: PlayerPresence) => {
      store.addNotification({
        type: 'INFO',
        title: 'Player Joined',
        message: `${presence.username} (Level ${presence.level}) has joined the world`,
        isRead: false,
        expiresAt: new Date(Date.now() + 5000)
      });
    });
  }
  
  // Handle player left
  private handlePlayerLeft(presences: any[]) {
    const store = useEmpireStore.getState();
    
    presences.forEach((presence: PlayerPresence) => {
      store.addNotification({
        type: 'INFO',
        title: 'Player Left',
        message: `${presence.username} has left the world`,
        isRead: false,
        expiresAt: new Date(Date.now() + 3000)
      });
    });
  }
  
  // Handle market update
  private handleMarketUpdate(payload: { goods: MarketGood[] }) {
    const store = useEmpireStore.getState();
    
    payload.goods.forEach(good => {
      store.updateMarketGood(good.id, good);
      store.recordPriceHistory(good.id, good.currentPrice);
    });
  }
  
  // Handle market event
  private handleMarketEvent(payload: { event: MarketEvent }) {
    const store = useEmpireStore.getState();
    store.addMarketEvent(payload.event);
    
    // Notify player
    store.addNotification({
      type: 'WARNING',
      title: 'Market Event',
      message: payload.event.description,
      isRead: false
    });
  }
  
  // Handle auction started
  private handleAuctionStarted(payload: { auction: Auction }) {
    this.state.activeAuctions.set(payload.auction.id, payload.auction);
    
    const store = useEmpireStore.getState();
    store.addNotification({
      type: 'INFO',
      title: 'Auction Started',
      message: `New ${payload.auction.type} auction: Starting bid $${payload.auction.currentBid}`,
      isRead: false,
      actionUrl: `/auctions/${payload.auction.id}`,
      actionLabel: 'View Auction'
    });
  }
  
  // Handle auction bid
  private handleAuctionBid(payload: { auctionId: string; bid: number; bidder: string; bidderName: string }) {
    const auction = this.state.activeAuctions.get(payload.auctionId);
    if (auction) {
      auction.currentBid = payload.bid;
      auction.highestBidder = payload.bidder;
      
      const store = useEmpireStore.getState();
      const isOwnBid = payload.bidder === store.player?.id;
      
      if (!isOwnBid) {
        store.addNotification({
          type: 'INFO',
          title: 'Auction Update',
          message: `${payload.bidderName} bid $${payload.bid}`,
          isRead: false,
          expiresAt: new Date(Date.now() + 3000)
        });
      }
    }
  }
  
  // Handle auction ended
  private handleAuctionEnded(payload: { auctionId: string; winner: string; winnerName: string; finalBid: number }) {
    const auction = this.state.activeAuctions.get(payload.auctionId);
    if (auction) {
      this.state.activeAuctions.delete(payload.auctionId);
      
      const store = useEmpireStore.getState();
      const isWinner = payload.winner === store.player?.id;
      
      store.addNotification({
        type: isWinner ? 'SUCCESS' : 'INFO',
        title: isWinner ? 'Auction Won!' : 'Auction Ended',
        message: isWinner 
          ? `You won the ${auction.type} for $${payload.finalBid}!`
          : `${payload.winnerName} won the ${auction.type} for $${payload.finalBid}`,
        isRead: false
      });
      
      // Update player cash if winner
      if (isWinner) {
        store.updatePlayerCash(-payload.finalBid);
        store.addTransaction({
          playerId: store.player!.id,
          type: 'EXPENSE',
          category: 'Auction',
          amount: -payload.finalBid,
          description: `Won ${auction.type} auction`
        });
      }
    }
  }
  
  // Handle disaster alert
  private handleDisasterAlert(payload: { 
    type: string; 
    location: string; 
    severity: number; 
    affectedRoutes: string[] 
  }) {
    const store = useEmpireStore.getState();
    
    // Check if player has affected routes
    const playerRoutes = Object.keys(store.routes);
    const affected = payload.affectedRoutes.filter(id => playerRoutes.includes(id));
    
    store.addNotification({
      type: 'WARNING',
      title: '🚨 Disaster Alert!',
      message: `${payload.type} at ${payload.location}! ${affected.length > 0 ? `${affected.length} of your routes affected!` : ''}`,
      isRead: false
    });
    
    // Update affected routes
    affected.forEach(routeId => {
      store.updateRoute(routeId, {
        risk: Math.min(100, store.routes[routeId].risk + payload.severity),
        efficiency: Math.max(0, store.routes[routeId].efficiency - payload.severity)
      });
    });
  }
  
  // Handle global event
  private handleGlobalEvent(payload: { 
    title: string; 
    message: string; 
    type: 'info' | 'warning' | 'success' 
  }) {
    const store = useEmpireStore.getState();
    
    store.addNotification({
      type: payload.type.toUpperCase() as any,
      title: payload.title,
      message: payload.message,
      isRead: false
    });
  }
  
  // Handle leaderboard update
  private handleLeaderboardUpdate(payload: { leaderboard: PlayerPresence[] }) {
    this.state.leaderboard = payload.leaderboard;
  }
  
  // Handle achievement unlocked
  private handleAchievementUnlocked(payload: { 
    playerId: string; 
    playerName: string; 
    achievement: string;
    description: string;
  }) {
    const store = useEmpireStore.getState();
    const isOwnAchievement = payload.playerId === store.player?.id;
    
    store.addNotification({
      type: isOwnAchievement ? 'ACHIEVEMENT' : 'INFO',
      title: isOwnAchievement ? '🏆 Achievement Unlocked!' : `${payload.playerName} earned an achievement!`,
      message: isOwnAchievement ? payload.description : `${payload.achievement}`,
      isRead: false
    });
    
    if (isOwnAchievement && store.player) {
      store.player.achievements.push(payload.achievement);
      store.updatePlayerExperience(100); // Bonus XP for achievements
    }
  }
  
  // Load initial world state
  private async loadWorldState() {
    // This would load current auctions, world events, etc. from Supabase
    console.log('Loading world state...');
  }
  
  // Update leaderboard
  private updateLeaderboard() {
    const players = Array.from(this.state.presence.values());
    this.state.leaderboard = players.sort((a, b) => b.netWorth - a.netWorth).slice(0, 10);
  }
  
  // Calculate player net worth
  private calculateNetWorth(): number {
    const state = useEmpireStore.getState();
    const cash = state.player?.cash || 0;
    
    const allAssets = [
      ...Object.values(state.assets.ships),
      ...Object.values(state.assets.planes),
      ...Object.values(state.assets.warehouses),
      ...Object.values(state.assets.specialists)
    ];
    
    const assetValue = allAssets.reduce((total, asset) => {
      const depreciatedValue = asset.purchasePrice * (asset.condition / 100);
      return total + depreciatedValue;
    }, 0);
    
    return cash + assetValue;
  }
  
  // Broadcast methods
  async broadcastMarketUpdate(goods: MarketGood[]) {
    if (!this.state.channel) return;
    
    await this.state.channel.send({
      type: 'broadcast',
      event: MultiplayerEvent.MARKET_UPDATE,
      payload: { goods }
    });
  }
  
  async startAuction(auction: Omit<Auction, 'id'>) {
    if (!this.state.channel) return;
    
    const newAuction: Auction = {
      ...auction,
      id: `auction-${Date.now()}`
    };
    
    await this.state.channel.send({
      type: 'broadcast',
      event: MultiplayerEvent.AUCTION_STARTED,
      payload: { auction: newAuction }
    });
    
    return newAuction;
  }
  
  async placeBid(auctionId: string, bid: number) {
    if (!this.state.channel) return;
    
    const state = useEmpireStore.getState();
    const player = state.player;
    
    if (!player || bid > player.cash) {
      throw new Error('Insufficient funds for bid');
    }
    
    await this.state.channel.send({
      type: 'broadcast',
      event: MultiplayerEvent.AUCTION_BID,
      payload: {
        auctionId,
        bid,
        bidder: player.id,
        bidderName: player.username
      }
    });
  }
  
  // Getters
  getOnlinePlayers(): PlayerPresence[] {
    return Array.from(this.state.presence.values());
  }
  
  getActiveAuctions(): Auction[] {
    return Array.from(this.state.activeAuctions.values());
  }
  
  getLeaderboard(): PlayerPresence[] {
    return this.state.leaderboard;
  }
  
  getPlayerRank(): number {
    const state = useEmpireStore.getState();
    const playerId = state.player?.id;
    
    if (!playerId) return -1;
    
    return this.state.leaderboard.findIndex(p => p.playerId === playerId) + 1;
  }
}

// Export singleton instance
export const multiplayerManager = MultiplayerManager.getInstance();