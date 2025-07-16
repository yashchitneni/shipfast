import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Route,
  RouteCreationData,
  RouteUpdateData,
  RouteCalculationParams,
  RouteValidation,
  RouteProfitability,
  RouteState,
  RouteEvent,
  RouteSegment,
  RouteOptimizationResult
} from '../../types/route';
import { PortNode, PlacedAsset, AssetDefinition } from '../lib/types/assets';
import { routeService } from '../../lib/supabase/routes';

// Store state interface
export interface RouteStoreState {
  // Route data
  routes: Map<string, Route>;
  routeStates: Map<string, RouteState>;
  routeEvents: RouteEvent[];
  
  // UI state
  selectedRouteId: string | null;
  routeCreationMode: boolean;
  routePreview: {
    originPortId: string;
    destinationPortId: string;
    waypoints: string[];
    segments: RouteSegment[];
    isValid: boolean;
    validation: RouteValidation;
  } | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

// Store actions
export interface RouteStoreActions {
  // Route CRUD operations
  loadPlayerRoutes: (playerId: string) => Promise<void>;
  createRoute: (data: RouteCreationData, playerId: string) => Promise<{ success: boolean; routeId?: string; error?: string }>;
  updateRoute: (routeId: string, updates: RouteUpdateData) => Promise<boolean>;
  deleteRoute: (routeId: string) => Promise<boolean>;
  
  // Route management
  activateRoute: (routeId: string) => Promise<boolean>;
  deactivateRoute: (routeId: string) => Promise<boolean>;
  assignAssetToRoute: (routeId: string, assetId: string) => Promise<boolean>;
  removeAssetFromRoute: (routeId: string, assetId: string) => Promise<boolean>;
  
  // Route calculations
  calculateRoute: (params: RouteCalculationParams) => Promise<{
    segments: RouteSegment[];
    totalDistance: number;
    estimatedTime: number;
    profitability: RouteProfitability;
  }>;
  optimizeRoute: (routeId: string) => Promise<RouteOptimizationResult>;
  validateRoute: (routeId: string) => RouteValidation;
  
  // Route preview
  startRoutePreview: (originPortId: string) => void;
  updateRoutePreview: (destinationPortId: string, waypoints?: string[]) => void;
  cancelRoutePreview: () => void;
  
  // Route state tracking
  updateRouteState: (routeId: string, state: Partial<RouteState>) => void;
  addRouteEvent: (event: Omit<RouteEvent, 'id'>) => void;
  
  // UI actions
  selectRoute: (routeId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Helper functions
  getRoutesByAsset: (assetId: string) => Route[];
  getActiveRoutes: () => Route[];
  getRouteProfitability: (routeId: string) => RouteProfitability | null;
  canCreateRoute: (playerId: string, originPortId: string, destinationPortId: string) => boolean;
}

// Initial state
const initialState: RouteStoreState = {
  routes: new Map(),
  routeStates: new Map(),
  routeEvents: [],
  selectedRouteId: null,
  routeCreationMode: false,
  routePreview: null,
  isLoading: false,
  error: null
};

// Helper functions
const calculateDistance = (from: PortNode, to: PortNode): number => {
  // Simplified distance calculation - in a real game would use proper nautical calculations
  const dx = from.position.x - to.position.x;
  const dy = from.position.y - to.position.y;
  return Math.sqrt(dx * dx + dy * dy) * 10; // Convert to nautical miles
};

const calculateSegment = (
  from: PortNode,
  to: PortNode,
  assetSpeed: number,
  fuelEfficiency: number
): RouteSegment => {
  const distance = calculateDistance(from, to);
  const estimatedTime = distance / assetSpeed;
  const fuelCost = (distance / fuelEfficiency) * 2.5; // $2.5 per unit of fuel
  
  // Risk calculation based on distance and region
  const baseRisk = Math.min(distance / 100, 30);
  const regionRisk = (from.region === to.region) ? 0 : 10;
  const riskLevel = Math.min(baseRisk + regionRisk, 50);
  
  return {
    from: from.id,
    to: to.id,
    distance,
    estimatedTime,
    fuelCost,
    riskLevel
  };
};

const calculateProfitability = (
  segments: RouteSegment[],
  capacity: number,
  maintenanceCostPerHour: number
): RouteProfitability => {
  const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
  const totalTime = segments.reduce((sum, seg) => sum + seg.estimatedTime, 0);
  const totalFuelCost = segments.reduce((sum, seg) => sum + seg.fuelCost, 0);
  
  // Revenue calculation (simplified)
  const revenuePerUnit = 10; // $10 per unit of cargo
  const revenue = capacity * revenuePerUnit * (1 + totalDistance / 1000); // Distance bonus
  
  // Cost calculations
  const costs = {
    fuel: totalFuelCost,
    maintenance: maintenanceCostPerHour * totalTime,
    portFees: segments.length * 500, // $500 per port
    crew: totalTime * 100, // $100 per hour for crew
    insurance: revenue * 0.05 // 5% of revenue
  };
  
  const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const netProfit = revenue - totalCosts;
  const profitMargin = (netProfit / revenue) * 100;
  const roi = (netProfit / totalCosts) * 100;
  const profitPerDay = (netProfit / totalTime) * 24;
  
  return {
    revenue,
    costs,
    netProfit,
    profitMargin,
    roi,
    profitPerDay
  };
};

// Create the store
export const useRouteStore = create<RouteStoreState & RouteStoreActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,
          
          // Route CRUD operations
          loadPlayerRoutes: async (playerId) => {
            set((state) => { state.isLoading = true; });
            
            try {
              const { data, error } = await routeService.getPlayerRoutes(playerId);
              
              if (error) {
                set((state) => {
                  state.error = error.message;
                  state.isLoading = false;
                });
                return;
              }
              
              if (data) {
                const routeMap = new Map<string, Route>();
                data.forEach(dbRoute => {
                  const route: Route = {
                    id: dbRoute.route_id,
                    ownerId: dbRoute.owner_id,
                    name: dbRoute.custom_name || `Route ${dbRoute.route_id.slice(0, 8)}`,
                    originPortId: dbRoute.origin_port_id,
                    destinationPortId: dbRoute.destination_port_id,
                    waypoints: dbRoute.waypoints || [],
                    segments: dbRoute.segments || [],
                    totalDistance: dbRoute.total_distance || 0,
                    estimatedTime: dbRoute.estimated_time || 0,
                    assignedAssets: dbRoute.assigned_assets || [],
                    isActive: dbRoute.is_active || false,
                    requirements: dbRoute.requirements || {},
                    profitability: dbRoute.profitability || {
                      revenue: 0,
                      costs: { fuel: 0, maintenance: 0, portFees: 0, crew: 0, insurance: 0 },
                      netProfit: 0,
                      profitMargin: 0,
                      roi: 0,
                      profitPerDay: 0
                    },
                    performance: dbRoute.performance_data || {
                      totalTrips: 0,
                      successfulTrips: 0,
                      failedTrips: 0,
                      averageProfit: 0,
                      totalProfit: 0,
                      averageTime: 0,
                      onTimePercentage: 100,
                      disastersEncountered: 0
                    },
                    createdAt: new Date(dbRoute.created_at),
                    updatedAt: new Date(dbRoute.updated_at)
                  };
                  
                  routeMap.set(route.id, route);
                  
                  // Initialize route state
                  const routeState: RouteState = {
                    routeId: route.id,
                    currentSegmentIndex: 0,
                    progress: 0,
                    estimatedArrival: new Date(),
                    currentPosition: { x: 0, y: 0 },
                    status: route.isActive ? 'idle' : 'idle'
                  };
                  
                  set((state) => {
                    state.routeStates.set(route.id, routeState);
                  });
                });
                
                set((state) => {
                  state.routes = routeMap;
                  state.isLoading = false;
                  state.error = null;
                });
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to load routes';
                state.isLoading = false;
              });
            }
          },
          
          createRoute: async (data, playerId) => {
            const state = get();
            
            // Validate the route
            if (!state.canCreateRoute(playerId, data.originPortId, data.destinationPortId)) {
              return { success: false, error: 'Cannot create route: invalid ports or insufficient permissions' };
            }
            
            try {
              // Calculate route details (simplified for now)
              const segments: RouteSegment[] = [];
              const waypoints = data.waypoints || [];
              const allPorts = [data.originPortId, ...waypoints, data.destinationPortId];
              
              // In a real implementation, we'd fetch port data and calculate actual segments
              let totalDistance = 0;
              let totalTime = 0;
              
              for (let i = 0; i < allPorts.length - 1; i++) {
                const segment: RouteSegment = {
                  from: allPorts[i],
                  to: allPorts[i + 1],
                  distance: 1000 + Math.random() * 2000, // Placeholder
                  estimatedTime: 24 + Math.random() * 48, // Placeholder
                  fuelCost: 5000 + Math.random() * 10000, // Placeholder
                  riskLevel: Math.random() * 30 // Placeholder
                };
                segments.push(segment);
                totalDistance += segment.distance;
                totalTime += segment.estimatedTime;
              }
              
              // Calculate profitability (placeholder values)
              const profitability = calculateProfitability(segments, 1000, 100);
              
              const routeData = {
                owner_id: playerId,
                origin_port_id: data.originPortId,
                destination_port_id: data.destinationPortId,
                custom_name: data.name,
                waypoints: waypoints,
                segments: segments,
                total_distance: totalDistance,
                estimated_time: totalTime,
                is_active: false,
                requirements: {},
                profitability: profitability,
                performance_data: {
                  totalTrips: 0,
                  successfulTrips: 0,
                  failedTrips: 0,
                  averageProfit: 0,
                  totalProfit: 0,
                  averageTime: 0,
                  onTimePercentage: 100,
                  disastersEncountered: 0
                }
              };
              
              const { data: createdRoute, error } = await routeService.createRoute(routeData);
              
              if (error) {
                return { success: false, error: error.message };
              }
              
              if (createdRoute) {
                const newRoute: Route = {
                  id: createdRoute.route_id,
                  ownerId: playerId,
                  name: data.name,
                  originPortId: data.originPortId,
                  destinationPortId: data.destinationPortId,
                  waypoints: waypoints,
                  segments: segments,
                  totalDistance: totalDistance,
                  estimatedTime: totalTime,
                  assignedAssets: [],
                  isActive: false,
                  requirements: {},
                  profitability: profitability,
                  performance: {
                    totalTrips: 0,
                    successfulTrips: 0,
                    failedTrips: 0,
                    averageProfit: 0,
                    totalProfit: 0,
                    averageTime: 0,
                    onTimePercentage: 100,
                    disastersEncountered: 0
                  },
                  createdAt: new Date(createdRoute.created_at),
                  updatedAt: new Date(createdRoute.updated_at)
                };
                
                set((state) => {
                  state.routes.set(newRoute.id, newRoute);
                  
                  // Initialize route state
                  state.routeStates.set(newRoute.id, {
                    routeId: newRoute.id,
                    currentSegmentIndex: 0,
                    progress: 0,
                    estimatedArrival: new Date(),
                    currentPosition: { x: 0, y: 0 },
                    status: 'idle'
                  });
                });
                
                return { success: true, routeId: newRoute.id };
              }
              
              return { success: false, error: 'Failed to create route' };
            } catch (error) {
              return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to create route' 
              };
            }
          },
          
          updateRoute: async (routeId, updates) => {
            const state = get();
            const route = state.routes.get(routeId);
            
            if (!route) return false;
            
            try {
              const { error } = await routeService.updateRoute(routeId, {
                custom_name: updates.name,
                waypoints: updates.waypoints,
                is_active: updates.isActive,
                assigned_assets: updates.assignedAssets
              });
              
              if (error) {
                set((state) => { state.error = error.message; });
                return false;
              }
              
              set((state) => {
                const route = state.routes.get(routeId);
                if (route) {
                  if (updates.name !== undefined) route.name = updates.name;
                  if (updates.waypoints !== undefined) route.waypoints = updates.waypoints;
                  if (updates.isActive !== undefined) route.isActive = updates.isActive;
                  if (updates.assignedAssets !== undefined) route.assignedAssets = updates.assignedAssets;
                  route.updatedAt = new Date();
                  state.routes.set(routeId, route);
                }
              });
              
              return true;
            } catch (error) {
              set((state) => { 
                state.error = error instanceof Error ? error.message : 'Failed to update route'; 
              });
              return false;
            }
          },
          
          deleteRoute: async (routeId) => {
            try {
              const { error } = await routeService.deleteRoute(routeId);
              
              if (error) {
                set((state) => { state.error = error.message; });
                return false;
              }
              
              set((state) => {
                state.routes.delete(routeId);
                state.routeStates.delete(routeId);
                if (state.selectedRouteId === routeId) {
                  state.selectedRouteId = null;
                }
              });
              
              return true;
            } catch (error) {
              set((state) => { 
                state.error = error instanceof Error ? error.message : 'Failed to delete route'; 
              });
              return false;
            }
          },
          
          // Route management
          activateRoute: async (routeId) => {
            return get().updateRoute(routeId, { isActive: true });
          },
          
          deactivateRoute: async (routeId) => {
            return get().updateRoute(routeId, { isActive: false });
          },
          
          assignAssetToRoute: async (routeId, assetId) => {
            const state = get();
            const route = state.routes.get(routeId);
            
            if (!route || route.assignedAssets.includes(assetId)) return false;
            
            const updatedAssets = [...route.assignedAssets, assetId];
            return get().updateRoute(routeId, { assignedAssets: updatedAssets });
          },
          
          removeAssetFromRoute: async (routeId, assetId) => {
            const state = get();
            const route = state.routes.get(routeId);
            
            if (!route || !route.assignedAssets.includes(assetId)) return false;
            
            const updatedAssets = route.assignedAssets.filter(id => id !== assetId);
            return get().updateRoute(routeId, { assignedAssets: updatedAssets });
          },
          
          // Route calculations
          calculateRoute: async (params) => {
            // Simplified calculation - in a real implementation would use actual port data
            const segments: RouteSegment[] = [];
            const waypoints = params.waypoints || [];
            const allPorts = [params.originPortId, ...waypoints, params.destinationPortId];
            
            let totalDistance = 0;
            let totalTime = 0;
            
            for (let i = 0; i < allPorts.length - 1; i++) {
              const segment: RouteSegment = {
                from: allPorts[i],
                to: allPorts[i + 1],
                distance: 1000 + Math.random() * 2000,
                estimatedTime: 24 + Math.random() * 48,
                fuelCost: (1000 + Math.random() * 2000) / params.fuelEfficiency * 2.5,
                riskLevel: Math.random() * 30
              };
              segments.push(segment);
              totalDistance += segment.distance;
              totalTime += segment.estimatedTime;
            }
            
            const profitability = calculateProfitability(segments, params.assetCapacity, 100);
            
            return {
              segments,
              totalDistance,
              estimatedTime: totalTime,
              profitability
            };
          },
          
          optimizeRoute: async (routeId) => {
            // Placeholder optimization logic
            const route = get().routes.get(routeId);
            if (!route) {
              return {
                suggestedWaypoints: [],
                estimatedSavings: 0,
                timeReduction: 0,
                fuelSavings: 0,
                riskReduction: 0
              };
            }
            
            // In a real implementation, this would use pathfinding algorithms
            return {
              suggestedWaypoints: route.waypoints,
              estimatedSavings: route.profitability.netProfit * 0.1,
              timeReduction: route.estimatedTime * 0.05,
              fuelSavings: route.profitability.costs.fuel * 0.08,
              riskReduction: 5
            };
          },
          
          validateRoute: (routeId) => {
            const state = get();
            const route = state.routes.get(routeId);
            
            if (!route) {
              return {
                isComplete: false,
                hasValidPorts: false,
                isOwned: false,
                meetsRequirements: false,
                errors: ['Route not found'],
                warnings: []
              };
            }
            
            const errors: string[] = [];
            const warnings: string[] = [];
            
            // Validation logic
            const isComplete = route.originPortId && route.destinationPortId;
            const hasValidPorts = true; // Would check against actual port data
            const isOwned = true; // Would check ownership
            const meetsRequirements = route.assignedAssets.length > 0;
            
            if (!isComplete) errors.push('Route must have origin and destination');
            if (!hasValidPorts) errors.push('Invalid port selection');
            if (!meetsRequirements) errors.push('Route needs assigned assets');
            
            if (route.segments.some(seg => seg.riskLevel > 40)) {
              warnings.push('High risk route - consider insurance');
            }
            
            return {
              isComplete,
              hasValidPorts,
              isOwned,
              meetsRequirements,
              errors,
              warnings
            };
          },
          
          // Route preview
          startRoutePreview: (originPortId) => set((state) => {
            state.routeCreationMode = true;
            state.routePreview = {
              originPortId,
              destinationPortId: '',
              waypoints: [],
              segments: [],
              isValid: false,
              validation: {
                isComplete: false,
                hasValidPorts: false,
                isOwned: true,
                meetsRequirements: true,
                errors: ['Select destination port'],
                warnings: []
              }
            };
          }),
          
          updateRoutePreview: (destinationPortId, waypoints) => {
            const state = get();
            if (!state.routePreview) return;
            
            set((state) => {
              if (state.routePreview) {
                state.routePreview.destinationPortId = destinationPortId;
                if (waypoints) state.routePreview.waypoints = waypoints;
                
                // Validate preview
                const isComplete = state.routePreview.originPortId && destinationPortId;
                state.routePreview.validation = {
                  isComplete,
                  hasValidPorts: true,
                  isOwned: true,
                  meetsRequirements: true,
                  errors: isComplete ? [] : ['Select destination port'],
                  warnings: []
                };
                state.routePreview.isValid = isComplete;
              }
            });
          },
          
          cancelRoutePreview: () => set((state) => {
            state.routeCreationMode = false;
            state.routePreview = null;
          }),
          
          // Route state tracking
          updateRouteState: (routeId, stateUpdate) => set((state) => {
            const routeState = state.routeStates.get(routeId);
            if (routeState) {
              Object.assign(routeState, stateUpdate);
              state.routeStates.set(routeId, routeState);
            }
          }),
          
          addRouteEvent: (eventData) => set((state) => {
            const event: RouteEvent = {
              ...eventData,
              id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            state.routeEvents.unshift(event);
            
            // Keep only last 1000 events
            if (state.routeEvents.length > 1000) {
              state.routeEvents = state.routeEvents.slice(0, 1000);
            }
          }),
          
          // UI actions
          selectRoute: (routeId) => set((state) => {
            state.selectedRouteId = routeId;
          }),
          
          setLoading: (isLoading) => set((state) => {
            state.isLoading = isLoading;
          }),
          
          setError: (error) => set((state) => {
            state.error = error;
          }),
          
          // Helper functions
          getRoutesByAsset: (assetId) => {
            const state = get();
            return Array.from(state.routes.values()).filter(
              route => route.assignedAssets.includes(assetId)
            );
          },
          
          getActiveRoutes: () => {
            const state = get();
            return Array.from(state.routes.values()).filter(route => route.isActive);
          },
          
          getRouteProfitability: (routeId) => {
            const state = get();
            const route = state.routes.get(routeId);
            return route?.profitability || null;
          },
          
          canCreateRoute: (playerId, originPortId, destinationPortId) => {
            // In a real implementation, would check:
            // - Player owns or has access to both ports
            // - Ports are valid and exist
            // - Player has necessary licenses
            // - Route doesn't already exist
            return originPortId !== destinationPortId && originPortId && destinationPortId;
          }
        }))
      ),
      {
        name: 'route-store',
        // Don't persist Maps directly - they don't serialize well
        partialize: (state) => ({
          selectedRouteId: state.selectedRouteId,
          routeCreationMode: state.routeCreationMode
        })
      }
    )
  )
);

// Selectors for common queries
export const useSelectedRoute = () => {
  const selectedId = useRouteStore((state) => state.selectedRouteId);
  const routes = useRouteStore((state) => state.routes);
  return selectedId ? routes.get(selectedId) : null;
};

export const useRoutesByPort = (portId: string) => {
  const routes = useRouteStore((state) => state.routes);
  return Array.from(routes.values()).filter(
    route => route.originPortId === portId || 
             route.destinationPortId === portId ||
             route.waypoints.includes(portId)
  );
};

export const useRouteProfitSummary = () => {
  const routes = useRouteStore((state) => state.routes);
  const activeRoutes = Array.from(routes.values()).filter(r => r.isActive);
  
  return {
    totalRoutes: routes.size,
    activeRoutes: activeRoutes.length,
    totalProfitPerDay: activeRoutes.reduce((sum, route) => 
      sum + route.profitability.profitPerDay, 0
    ),
    averageROI: activeRoutes.length > 0
      ? activeRoutes.reduce((sum, route) => sum + route.profitability.roi, 0) / activeRoutes.length
      : 0
  };
};