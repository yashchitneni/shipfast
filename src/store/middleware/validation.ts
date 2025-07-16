import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { EmpireState, EmpireActions } from '../empireStore';
import { Asset, Route, Transaction } from '../../../types/game';

// Validation rules
export const ValidationRules = {
  MIN_CASH: 0,
  MAX_CASH: 999999999,
  MIN_ASSET_CONDITION: 0,
  MAX_ASSET_CONDITION: 100,
  MIN_EFFICIENCY: 0,
  MAX_EFFICIENCY: 100,
  MIN_RISK: 0,
  MAX_RISK: 100,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999,
  MAX_ROUTE_NAME_LENGTH: 100,
  MAX_ASSET_NAME_LENGTH: 50,
  MAX_ASSETS_PER_ROUTE: 10,
  MAX_WAYPOINTS_PER_ROUTE: 10,
  MIN_LOYALTY: 0,
  MAX_LOYALTY: 100
};

// Validation error types
export class ValidationError extends Error {
  constructor(public field: string, public value: any, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation middleware type
type ValidationMiddleware = <
  T extends EmpireState & EmpireActions,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  stateCreator: StateCreator<T, Mps, Mcs>
) => StateCreator<T, Mps, Mcs>;

// Validation functions
export const Validators = {
  validateCash: (amount: number): void => {
    if (amount < ValidationRules.MIN_CASH || amount > ValidationRules.MAX_CASH) {
      throw new ValidationError('cash', amount, 
        `Cash must be between ${ValidationRules.MIN_CASH} and ${ValidationRules.MAX_CASH}`
      );
    }
  },
  
  validateAsset: (asset: Asset): void => {
    // Name validation
    if (!asset.name || asset.name.length > ValidationRules.MAX_ASSET_NAME_LENGTH) {
      throw new ValidationError('asset.name', asset.name,
        `Asset name must be between 1 and ${ValidationRules.MAX_ASSET_NAME_LENGTH} characters`
      );
    }
    
    // Condition validation
    if (asset.condition < ValidationRules.MIN_ASSET_CONDITION || 
        asset.condition > ValidationRules.MAX_ASSET_CONDITION) {
      throw new ValidationError('asset.condition', asset.condition,
        `Asset condition must be between ${ValidationRules.MIN_ASSET_CONDITION} and ${ValidationRules.MAX_ASSET_CONDITION}`
      );
    }
    
    // Efficiency validation
    if (asset.efficiency < ValidationRules.MIN_EFFICIENCY || 
        asset.efficiency > ValidationRules.MAX_EFFICIENCY) {
      throw new ValidationError('asset.efficiency', asset.efficiency,
        `Asset efficiency must be between ${ValidationRules.MIN_EFFICIENCY} and ${ValidationRules.MAX_EFFICIENCY}`
      );
    }
    
    // Price validation
    if (asset.purchasePrice < ValidationRules.MIN_PRICE || 
        asset.purchasePrice > ValidationRules.MAX_PRICE) {
      throw new ValidationError('asset.purchasePrice', asset.purchasePrice,
        `Asset price must be between ${ValidationRules.MIN_PRICE} and ${ValidationRules.MAX_PRICE}`
      );
    }
    
    // Maintenance cost validation
    if (asset.maintenanceCost < 0 || asset.maintenanceCost > asset.purchasePrice) {
      throw new ValidationError('asset.maintenanceCost', asset.maintenanceCost,
        'Maintenance cost must be positive and less than purchase price'
      );
    }
  },
  
  validateRoute: (route: Route): void => {
    // Name validation
    if (!route.name || route.name.length > ValidationRules.MAX_ROUTE_NAME_LENGTH) {
      throw new ValidationError('route.name', route.name,
        `Route name must be between 1 and ${ValidationRules.MAX_ROUTE_NAME_LENGTH} characters`
      );
    }
    
    // Origin and destination validation
    if (!route.origin || !route.destination) {
      throw new ValidationError('route.endpoints', { origin: route.origin, destination: route.destination },
        'Route must have both origin and destination'
      );
    }
    
    if (route.origin === route.destination) {
      throw new ValidationError('route.endpoints', { origin: route.origin, destination: route.destination },
        'Route origin and destination must be different'
      );
    }
    
    // Waypoints validation
    if (route.waypoints.length > ValidationRules.MAX_WAYPOINTS_PER_ROUTE) {
      throw new ValidationError('route.waypoints', route.waypoints,
        `Route cannot have more than ${ValidationRules.MAX_WAYPOINTS_PER_ROUTE} waypoints`
      );
    }
    
    // Risk validation
    if (route.risk < ValidationRules.MIN_RISK || route.risk > ValidationRules.MAX_RISK) {
      throw new ValidationError('route.risk', route.risk,
        `Route risk must be between ${ValidationRules.MIN_RISK} and ${ValidationRules.MAX_RISK}`
      );
    }
    
    // Efficiency validation
    if (route.efficiency < ValidationRules.MIN_EFFICIENCY || 
        route.efficiency > ValidationRules.MAX_EFFICIENCY) {
      throw new ValidationError('route.efficiency', route.efficiency,
        `Route efficiency must be between ${ValidationRules.MIN_EFFICIENCY} and ${ValidationRules.MAX_EFFICIENCY}`
      );
    }
    
    // Distance validation
    if (route.distance <= 0) {
      throw new ValidationError('route.distance', route.distance,
        'Route distance must be positive'
      );
    }
    
    // Assigned assets validation
    if (route.assignedAssets.length > ValidationRules.MAX_ASSETS_PER_ROUTE) {
      throw new ValidationError('route.assignedAssets', route.assignedAssets,
        `Route cannot have more than ${ValidationRules.MAX_ASSETS_PER_ROUTE} assigned assets`
      );
    }
  },
  
  validateTransaction: (transaction: Transaction): void => {
    // Amount validation
    if (transaction.amount === 0) {
      throw new ValidationError('transaction.amount', transaction.amount,
        'Transaction amount cannot be zero'
      );
    }
    
    // Description validation
    if (!transaction.description || transaction.description.trim().length === 0) {
      throw new ValidationError('transaction.description', transaction.description,
        'Transaction must have a description'
      );
    }
    
    // Category validation
    if (!transaction.category || transaction.category.trim().length === 0) {
      throw new ValidationError('transaction.category', transaction.category,
        'Transaction must have a category'
      );
    }
  },
  
  validatePurchase: (cost: number, currentCash: number): void => {
    if (cost > currentCash) {
      throw new ValidationError('purchase', { cost, currentCash },
        `Insufficient funds. Need ${cost} but only have ${currentCash}`
      );
    }
  }
};

// Create validation middleware
export const createValidationMiddleware: ValidationMiddleware = (config) => (set, get, api) =>
  config(
    (args) => {
      // Intercept set calls and validate
      const newSet = (...setArgs: any[]) => {
        try {
          // Get the state updater function
          const [updater] = setArgs;
          
          // Create a proxy to intercept state mutations
          const validatingUpdater = (state: EmpireState & EmpireActions) => {
            // Create a copy to test validations without affecting original state
            const testState = { ...state };
            
            // Apply the update to test state
            if (typeof updater === 'function') {
              updater(testState);
            }
            
            // Validate cash updates
            if (testState.player && testState.player.cash !== state.player?.cash) {
              Validators.validateCash(testState.player.cash);
            }
            
            // Apply the update to actual state if validation passes
            return updater(state);
          };
          
          // Call original set with validating updater
          set(validatingUpdater);
        } catch (error) {
          // Handle validation errors
          if (error instanceof ValidationError) {
            console.error('Validation error:', error.message);
            // Add error notification
            const state = get() as EmpireState & EmpireActions;
            state.addNotification({
              type: 'ERROR',
              title: 'Validation Error',
              message: error.message,
              isRead: false
            });
            // Set error in state
            state.setError(error.message);
          } else {
            // Re-throw non-validation errors
            throw error;
          }
        }
      };
      
      // Return config with wrapped set function
      return config(newSet, get, api);
    },
    get,
    api
  );

// Business rule validators
export const BusinessRules = {
  canAfford: (cost: number, playerCash: number): boolean => {
    return cost <= playerCash;
  },
  
  canAssignAssetToRoute: (asset: Asset, route: Route): boolean => {
    // Check if asset is already assigned
    if ('currentRoute' in asset && asset.currentRoute) {
      return false;
    }
    
    // Check if route has capacity
    if (route.assignedAssets.length >= ValidationRules.MAX_ASSETS_PER_ROUTE) {
      return false;
    }
    
    // Check asset condition
    if (asset.condition < 20) {
      return false; // Too damaged
    }
    
    return true;
  },
  
  canActivateRoute: (route: Route): boolean => {
    // Must have at least one asset assigned
    if (route.assignedAssets.length === 0) {
      return false;
    }
    
    // Must have valid endpoints
    if (!route.origin || !route.destination) {
      return false;
    }
    
    return true;
  },
  
  calculateMaintenanceCost: (assets: Asset[]): number => {
    return assets.reduce((total, asset) => {
      // Higher maintenance for lower condition
      const conditionMultiplier = 1 + ((100 - asset.condition) / 100);
      return total + (asset.maintenanceCost * conditionMultiplier);
    }, 0);
  },
  
  calculateRouteProfitability: (route: Route, marketPrices: Record<string, number>): number => {
    // Base calculation
    let profit = route.distance * 10; // Base rate per km
    
    // Apply efficiency modifier
    profit *= (route.efficiency / 100);
    
    // Apply risk modifier
    profit *= (1 - (route.risk / 200)); // Higher risk reduces profit
    
    // Apply market conditions
    // This would be more complex in real implementation
    
    return Math.round(profit);
  }
};