import React from 'react';
import { useEmpireStore } from '../empireStore';
import { supabaseService } from '../../services/supabase';

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // minutes
  debounceDelay: number; // milliseconds
  maxRetries: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Default configuration
const defaultConfig: AutoSaveConfig = {
  enabled: true,
  interval: 5, // 5 minutes
  debounceDelay: 1000, // 1 second
  maxRetries: 3
};

// Auto-save manager class
export class AutoSaveManager {
  private static instance: AutoSaveManager;
  private config: AutoSaveConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private saveInProgress: boolean = false;
  private retryCount: number = 0;
  private lastSaveTime: Date | null = null;
  private isDirty: boolean = false;
  
  private constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupStateListener();
  }
  
  static getInstance(config?: Partial<AutoSaveConfig>): AutoSaveManager {
    if (!AutoSaveManager.instance) {
      AutoSaveManager.instance = new AutoSaveManager(config);
    }
    return AutoSaveManager.instance;
  }
  
  // Start auto-save
  start() {
    if (!this.config.enabled) return;
    
    // Clear existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Set up new interval
    this.intervalId = setInterval(() => {
      if (this.isDirty && !this.saveInProgress) {
        this.save();
      }
    }, this.config.interval * 60 * 1000);
    
    console.log(`Auto-save started with ${this.config.interval} minute interval`);
  }
  
  // Stop auto-save
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    console.log('Auto-save stopped');
  }
  
  // Setup state change listener
  private setupStateListener() {
    // Subscribe to state changes
    const unsubscribe = useEmpireStore.subscribe(
      (state) => ({
        player: state.player,
        assets: state.assets,
        routes: state.routes,
        market: state.market,
        aiCompanion: state.aiCompanion
      }),
      () => {
        this.markDirty();
      }
    );
    
    // Store unsubscribe function for cleanup
    (this as any).unsubscribe = unsubscribe;
  }
  
  // Mark state as dirty and trigger debounced save
  private markDirty() {
    this.isDirty = true;
    
    // Clear existing debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // Set new debounce timeout
    this.debounceTimeout = setTimeout(() => {
      if (this.config.enabled && !this.saveInProgress) {
        this.save();
      }
    }, this.config.debounceDelay);
  }
  
  // Perform save operation
  async save(): Promise<boolean> {
    if (this.saveInProgress) {
      console.log('Save already in progress, skipping...');
      return false;
    }
    
    const state = useEmpireStore.getState();
    
    if (!state.player) {
      console.log('No player data to save');
      return false;
    }
    
    this.saveInProgress = true;
    
    try {
      console.log('Starting auto-save...');
      
      // Update play time before saving
      state.updatePlayTime();
      
      // Save to Supabase
      await supabaseService.saveGameState(state.player.id);
      
      // Reset state
      this.isDirty = false;
      this.retryCount = 0;
      this.lastSaveTime = new Date();
      this.saveInProgress = false;
      
      // Update game session save time
      if (state.gameSession) {
        state.gameSession.lastSaveTime = this.lastSaveTime;
      }
      
      // Call success callback
      if (this.config.onSuccess) {
        this.config.onSuccess();
      }
      
      // Show success notification
      state.addNotification({
        type: 'SUCCESS',
        title: 'Auto-save',
        message: 'Game saved successfully',
        isRead: false,
        expiresAt: new Date(Date.now() + 3000) // Auto-dismiss after 3 seconds
      });
      
      console.log('Auto-save completed successfully');
      return true;
      
    } catch (error) {
      this.saveInProgress = false;
      this.retryCount++;
      
      console.error('Auto-save failed:', error);
      
      // Retry if under max retries
      if (this.retryCount < this.config.maxRetries) {
        console.log(`Retrying auto-save (${this.retryCount}/${this.config.maxRetries})...`);
        setTimeout(() => this.save(), 5000 * this.retryCount); // Exponential backoff
        return false;
      }
      
      // Max retries reached
      this.retryCount = 0;
      
      // Call error callback
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      
      // Show error notification
      state.addNotification({
        type: 'ERROR',
        title: 'Auto-save failed',
        message: 'Failed to save game. Please try manual save.',
        isRead: false
      });
      
      return false;
    }
  }
  
  // Force immediate save
  async forceSave(): Promise<boolean> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    return this.save();
  }
  
  // Update configuration
  updateConfig(config: Partial<AutoSaveConfig>) {
    this.config = { ...this.config, ...config };
    
    // Restart if interval changed
    if ('interval' in config || 'enabled' in config) {
      this.stop();
      this.start();
    }
  }
  
  // Get save status
  getStatus() {
    return {
      enabled: this.config.enabled,
      interval: this.config.interval,
      isDirty: this.isDirty,
      saveInProgress: this.saveInProgress,
      lastSaveTime: this.lastSaveTime,
      retryCount: this.retryCount
    };
  }
  
  // Clean up
  destroy() {
    this.stop();
    
    // Unsubscribe from store
    if ((this as any).unsubscribe) {
      (this as any).unsubscribe();
    }
  }
}

// React hook for auto-save
export function useAutoSave(config?: Partial<AutoSaveConfig>) {
  const [status, setStatus] = React.useState(() => 
    AutoSaveManager.getInstance(config).getStatus()
  );
  
  React.useEffect(() => {
    const manager = AutoSaveManager.getInstance(config);
    
    // Start auto-save
    manager.start();
    
    // Update status periodically
    const statusInterval = setInterval(() => {
      setStatus(manager.getStatus());
    }, 1000);
    
    // Handle page unload
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      const status = manager.getStatus();
      if (status.isDirty && !status.saveInProgress) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Try to save before leaving
        await manager.forceSave();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(statusInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      manager.stop();
    };
  }, []);
  
  return {
    status,
    forceSave: () => AutoSaveManager.getInstance().forceSave(),
    updateConfig: (newConfig: Partial<AutoSaveConfig>) => 
      AutoSaveManager.getInstance().updateConfig(newConfig)
  };
}

// Save state backup to localStorage (fallback)
export class LocalStorageBackup {
  private static readonly BACKUP_KEY = 'flexport_game_backup';
  private static readonly BACKUP_METADATA_KEY = 'flexport_game_backup_meta';
  
  static async save(): Promise<void> {
    try {
      const state = useEmpireStore.getState();
      
      if (!state.player) return;
      
      const backup = {
        player: state.player,
        assets: state.assets,
        routes: state.routes,
        market: state.market,
        aiCompanion: state.aiCompanion,
        settings: state.settings,
        timestamp: Date.now()
      };
      
      // Compress data
      const compressed = JSON.stringify(backup);
      
      // Save to localStorage
      localStorage.setItem(this.BACKUP_KEY, compressed);
      localStorage.setItem(this.BACKUP_METADATA_KEY, JSON.stringify({
        playerId: state.player.id,
        playerName: state.player.username,
        timestamp: Date.now(),
        size: compressed.length
      }));
      
      console.log('Local backup saved successfully');
    } catch (error) {
      console.error('Failed to save local backup:', error);
      // Try to clear old backups if storage is full
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldBackups();
      }
    }
  }
  
  static async load(): Promise<any | null> {
    try {
      const compressed = localStorage.getItem(this.BACKUP_KEY);
      if (!compressed) return null;
      
      const backup = JSON.parse(compressed);
      console.log('Local backup loaded successfully');
      
      return backup;
    } catch (error) {
      console.error('Failed to load local backup:', error);
      return null;
    }
  }
  
  static getMetadata(): any | null {
    try {
      const meta = localStorage.getItem(this.BACKUP_METADATA_KEY);
      return meta ? JSON.parse(meta) : null;
    } catch {
      return null;
    }
  }
  
  static clear(): void {
    localStorage.removeItem(this.BACKUP_KEY);
    localStorage.removeItem(this.BACKUP_METADATA_KEY);
  }
  
  static clearOldBackups(): void {
    // Clear backups older than 7 days
    const metadata = this.getMetadata();
    if (metadata && metadata.timestamp) {
      const age = Date.now() - metadata.timestamp;
      if (age > 7 * 24 * 60 * 60 * 1000) {
        this.clear();
      }
    }
  }
}