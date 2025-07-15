import React from 'react';
import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { EmpireState, EmpireActions } from '../empireStore';

// Configuration for undo/redo
export interface UndoRedoConfig {
  maxHistorySize: number;
  blacklistedActions: string[];
  groupingDelay: number; // ms to group actions together
}

const defaultConfig: UndoRedoConfig = {
  maxHistorySize: 50,
  blacklistedActions: [
    'setLoading',
    'setError',
    'setSelectedAsset',
    'setSelectedRoute',
    'markNotificationRead',
    'updatePlayTime'
  ],
  groupingDelay: 500
};

// History entry
interface HistoryEntry {
  state: Partial<EmpireState>;
  timestamp: number;
  action: string;
  description?: string;
}

// Extended state with history
interface UndoRedoState {
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
    isGrouping: boolean;
    lastActionTime: number;
    groupId?: string;
  };
}

// Undo/redo actions
interface UndoRedoActions {
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistoryDescription: () => { past: string[]; future: string[] };
}

// Middleware type
type UndoRedoMiddleware = <
  T extends EmpireState & EmpireActions,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  stateCreator: StateCreator<T, Mps, Mcs>,
  config?: Partial<UndoRedoConfig>
) => StateCreator<T & UndoRedoState & UndoRedoActions, Mps, Mcs>;

// State properties to track for history
const TRACKED_PROPERTIES: (keyof EmpireState)[] = [
  'player',
  'assets',
  'routes',
  'activeRoutes',
  'market',
  'aiCompanion',
  'transactions'
];

// Helper to create state snapshot
const createSnapshot = (state: EmpireState): Partial<EmpireState> => {
  const snapshot: Partial<EmpireState> = {};
  
  TRACKED_PROPERTIES.forEach(prop => {
    if (prop in state) {
      // Deep clone the property
      snapshot[prop] = JSON.parse(JSON.stringify(state[prop]));
    }
  });
  
  return snapshot;
};

// Helper to restore state from snapshot
const restoreSnapshot = (state: EmpireState, snapshot: Partial<EmpireState>) => {
  Object.entries(snapshot).forEach(([key, value]) => {
    if (key in state) {
      (state as any)[key] = JSON.parse(JSON.stringify(value));
    }
  });
};

// Helper to generate action description
const generateDescription = (action: string, args: any[]): string => {
  const descriptions: Record<string, (args: any[]) => string> = {
    updatePlayerCash: (args) => `${args[0] > 0 ? 'Earned' : 'Spent'} $${Math.abs(args[0])}`,
    addAsset: (args) => `Added ${args[0]?.type || 'asset'}: ${args[0]?.name || 'Unknown'}`,
    removeAsset: (args) => `Removed asset`,
    addRoute: (args) => `Created route: ${args[0]?.name || 'Unknown'}`,
    removeRoute: (args) => `Deleted route`,
    activateRoute: (args) => `Activated route`,
    deactivateRoute: (args) => `Deactivated route`,
    assignAssetToRoute: (args) => `Assigned asset to route`,
    unassignAssetFromRoute: (args) => `Unassigned asset from route`,
    updateAsset: (args) => `Updated asset`,
    updateRoute: (args) => `Updated route`,
    addTransaction: (args) => `Transaction: ${args[0]?.description || 'Unknown'}`,
    updateMarketGood: (args) => `Market price updated`,
    addMarketEvent: (args) => `Market event: ${args[0]?.type || 'Unknown'}`,
    updateAICompanion: (args) => `AI companion updated`,
    updateSettings: (args) => `Settings changed`
  };
  
  const descriptionFn = descriptions[action];
  return descriptionFn ? descriptionFn(args) : `Action: ${action}`;
};

// Create undo/redo middleware
export const createUndoRedoMiddleware: UndoRedoMiddleware = (stateCreator, userConfig) => {
  const config = { ...defaultConfig, ...userConfig };
  let actionInterceptor: ((action: string, args: any[]) => void) | null = null;
  
  return (set, get, api) => {
    // Extend the state creator with history
    const extendedStateCreator: StateCreator<any, any, any> = (extSet, extGet, extApi) => {
      // Create the base state
      const baseState = stateCreator(extSet, extGet, extApi);
      
      // Initialize history
      const historyState: UndoRedoState = {
        history: {
          past: [],
          future: [],
          isGrouping: false,
          lastActionTime: 0
        }
      };
      
      // Create action interceptor
      actionInterceptor = (action: string, args: any[]) => {
        // Skip blacklisted actions
        if (config.blacklistedActions.includes(action)) {
          return;
        }
        
        const currentState = extGet() as EmpireState & UndoRedoState;
        const now = Date.now();
        
        // Check if we should group with previous action
        const shouldGroup = currentState.history.isGrouping && 
          (now - currentState.history.lastActionTime) < config.groupingDelay;
        
        if (!shouldGroup && currentState.history.past.length > 0) {
          // Save current state to history before making changes
          const snapshot = createSnapshot(currentState);
          const historyEntry: HistoryEntry = {
            state: snapshot,
            timestamp: now,
            action,
            description: generateDescription(action, args)
          };
          
          extSet((state: EmpireState & UndoRedoState) => {
            state.history.past.push(historyEntry);
            
            // Limit history size
            if (state.history.past.length > config.maxHistorySize) {
              state.history.past.shift();
            }
            
            // Clear future when new action is performed
            state.history.future = [];
            
            // Update grouping state
            state.history.isGrouping = true;
            state.history.lastActionTime = now;
          });
        } else {
          // Just update the grouping timestamp
          extSet((state: EmpireState & UndoRedoState) => {
            state.history.lastActionTime = now;
          });
        }
      };
      
      // Wrap all actions to capture history
      const wrappedState: any = { ...baseState, ...historyState };
      
      // Wrap each action function
      Object.keys(baseState).forEach(key => {
        if (typeof baseState[key] === 'function') {
          const originalAction = baseState[key];
          wrappedState[key] = (...args: any[]) => {
            // Capture state before action
            if (actionInterceptor) {
              actionInterceptor(key, args);
            }
            
            // Execute original action
            return originalAction(...args);
          };
        }
      });
      
      // Add undo/redo actions
      const undoRedoActions: UndoRedoActions = {
        undo: () => {
          const state = extGet() as EmpireState & UndoRedoState;
          
          if (state.history.past.length === 0) {
            return;
          }
          
          extSet((state: EmpireState & UndoRedoState) => {
            // Get the last history entry
            const lastEntry = state.history.past[state.history.past.length - 1];
            
            // Save current state to future
            const currentSnapshot = createSnapshot(state);
            state.history.future.unshift({
              state: currentSnapshot,
              timestamp: Date.now(),
              action: 'undo',
              description: 'Before undo'
            });
            
            // Restore previous state
            restoreSnapshot(state, lastEntry.state);
            
            // Remove from past
            state.history.past.pop();
            
            // Reset grouping
            state.history.isGrouping = false;
          });
          
          // Notify about undo
          const store = extGet() as EmpireState & EmpireActions;
          store.addNotification({
            type: 'INFO',
            title: 'Undo',
            message: `Undid: ${state.history.past[state.history.past.length - 1]?.description || 'last action'}`,
            isRead: false
          });
        },
        
        redo: () => {
          const state = extGet() as EmpireState & UndoRedoState;
          
          if (state.history.future.length === 0) {
            return;
          }
          
          extSet((state: EmpireState & UndoRedoState) => {
            // Get the next future entry
            const nextEntry = state.history.future[0];
            
            // Save current state to past
            const currentSnapshot = createSnapshot(state);
            state.history.past.push({
              state: currentSnapshot,
              timestamp: Date.now(),
              action: 'redo',
              description: 'Before redo'
            });
            
            // Restore future state
            restoreSnapshot(state, nextEntry.state);
            
            // Remove from future
            state.history.future.shift();
            
            // Reset grouping
            state.history.isGrouping = false;
          });
          
          // Notify about redo
          const store = extGet() as EmpireState & EmpireActions;
          store.addNotification({
            type: 'INFO',
            title: 'Redo',
            message: `Redid: ${state.history.future[0]?.description || 'action'}`,
            isRead: false
          });
        },
        
        clearHistory: () => {
          extSet((state: EmpireState & UndoRedoState) => {
            state.history.past = [];
            state.history.future = [];
            state.history.isGrouping = false;
            state.history.lastActionTime = 0;
          });
        },
        
        canUndo: () => {
          const state = extGet() as EmpireState & UndoRedoState;
          return state.history.past.length > 0;
        },
        
        canRedo: () => {
          const state = extGet() as EmpireState & UndoRedoState;
          return state.history.future.length > 0;
        },
        
        getHistoryDescription: () => {
          const state = extGet() as EmpireState & UndoRedoState;
          return {
            past: state.history.past.map(entry => entry.description || entry.action),
            future: state.history.future.map(entry => entry.description || entry.action)
          };
        }
      };
      
      return { ...wrappedState, ...undoRedoActions };
    };
    
    return extendedStateCreator(set, get, api);
  };
};

// React hook for undo/redo keyboard shortcuts
export const useUndoRedoShortcuts = (store: any) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Z (undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (store.canUndo()) {
          store.undo();
        }
      }
      
      // Check for Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y (redo)
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        if (store.canRedo()) {
          store.redo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [store]);
};