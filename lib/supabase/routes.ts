import { supabase } from './client';
import { RouteSegment } from '../../types/route';

// Database types for routes
export interface RouteDB {
  route_id: string;
  owner_id: string;
  origin_port_id: string;
  destination_port_id: string;
  custom_name?: string;
  waypoints?: string[];
  segments?: RouteSegment[];
  total_distance?: number;
  estimated_time?: number;
  assigned_assets?: string[];
  is_active?: boolean;
  requirements?: any;
  profitability?: any;
  performance_data?: any;
  created_at: string;
  updated_at: string;
}

export interface RouteCreateData {
  owner_id: string;
  origin_port_id: string;
  destination_port_id: string;
  custom_name?: string;
  waypoints?: string[];
  segments?: RouteSegment[];
  total_distance?: number;
  estimated_time?: number;
  is_active?: boolean;
  requirements?: any;
  profitability?: any;
  performance_data?: any;
}

export interface RouteUpdateData {
  custom_name?: string;
  waypoints?: string[];
  segments?: RouteSegment[];
  total_distance?: number;
  estimated_time?: number;
  assigned_assets?: string[];
  is_active?: boolean;
  requirements?: any;
  profitability?: any;
  performance_data?: any;
}

class RouteService {
  /**
   * Get all routes for a player
   */
  async getPlayerRoutes(playerId: string) {
    const { data, error } = await supabase
      .from('route')
      .select('*')
      .eq('owner_id', playerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching player routes:', error);
      return { data: null, error };
    }

    // Transform the data to include additional fields stored in performance_data
    const transformedData = data?.map(route => ({
      ...route,
      waypoints: route.performance_data?.waypoints || [],
      segments: route.performance_data?.segments || [],
      total_distance: route.performance_data?.total_distance || 0,
      estimated_time: route.performance_data?.estimated_time || 0,
      assigned_assets: route.performance_data?.assigned_assets || [],
      is_active: route.performance_data?.is_active || false,
      requirements: route.performance_data?.requirements || {},
      profitability: route.performance_data?.profitability || {},
      custom_name: route.performance_data?.custom_name
    })) as RouteDB[];

    return { data: transformedData, error: null };
  }

  /**
   * Get a single route by ID
   */
  async getRoute(routeId: string) {
    const { data, error } = await supabase
      .from('route')
      .select('*')
      .eq('route_id', routeId)
      .single();

    if (error) {
      console.error('Error fetching route:', error);
      return { data: null, error };
    }

    // Transform the data
    const transformedData = {
      ...data,
      waypoints: data.performance_data?.waypoints || [],
      segments: data.performance_data?.segments || [],
      total_distance: data.performance_data?.total_distance || 0,
      estimated_time: data.performance_data?.estimated_time || 0,
      assigned_assets: data.performance_data?.assigned_assets || [],
      is_active: data.performance_data?.is_active || false,
      requirements: data.performance_data?.requirements || {},
      profitability: data.performance_data?.profitability || {},
      custom_name: data.performance_data?.custom_name
    } as RouteDB;

    return { data: transformedData, error: null };
  }

  /**
   * Create a new route
   */
  async createRoute(routeData: RouteCreateData) {
    // Store extended data in performance_data JSONB column
    const performanceData = {
      waypoints: routeData.waypoints || [],
      segments: routeData.segments || [],
      total_distance: routeData.total_distance || 0,
      estimated_time: routeData.estimated_time || 0,
      assigned_assets: [],
      is_active: routeData.is_active || false,
      requirements: routeData.requirements || {},
      profitability: routeData.profitability || {},
      custom_name: routeData.custom_name,
      profit_per_day: routeData.profitability?.profitPerDay || 0,
      disasters_encountered: 0,
      ...(routeData.performance_data || {})
    };

    const { data, error } = await supabase
      .from('route')
      .insert({
        owner_id: routeData.owner_id,
        origin_port_id: routeData.origin_port_id,
        destination_port_id: routeData.destination_port_id,
        performance_data: performanceData
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating route:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Update a route
   */
  async updateRoute(routeId: string, updates: RouteUpdateData) {
    // First, fetch the current route to merge performance_data
    const { data: currentRoute, error: fetchError } = await supabase
      .from('route')
      .select('performance_data')
      .eq('route_id', routeId)
      .single();

    if (fetchError) {
      console.error('Error fetching current route:', fetchError);
      return { data: null, error: fetchError };
    }

    // Merge the updates with existing performance_data
    const updatedPerformanceData = {
      ...(currentRoute.performance_data || {}),
      ...(updates.waypoints !== undefined && { waypoints: updates.waypoints }),
      ...(updates.segments !== undefined && { segments: updates.segments }),
      ...(updates.total_distance !== undefined && { total_distance: updates.total_distance }),
      ...(updates.estimated_time !== undefined && { estimated_time: updates.estimated_time }),
      ...(updates.assigned_assets !== undefined && { assigned_assets: updates.assigned_assets }),
      ...(updates.is_active !== undefined && { is_active: updates.is_active }),
      ...(updates.requirements !== undefined && { requirements: updates.requirements }),
      ...(updates.profitability !== undefined && { 
        profitability: updates.profitability,
        profit_per_day: updates.profitability.profitPerDay || 0
      }),
      ...(updates.custom_name !== undefined && { custom_name: updates.custom_name })
    };

    const { data, error } = await supabase
      .from('route')
      .update({
        performance_data: updatedPerformanceData
      })
      .eq('route_id', routeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating route:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Delete a route
   */
  async deleteRoute(routeId: string) {
    // First, unassign any assets from this route
    const { error: unassignError } = await supabase
      .from('asset')
      .update({ assigned_route_id: null })
      .eq('assigned_route_id', routeId);

    if (unassignError) {
      console.error('Error unassigning assets from route:', unassignError);
      return { error: unassignError };
    }

    // Delete the route
    const { error } = await supabase
      .from('route')
      .delete()
      .eq('route_id', routeId);

    if (error) {
      console.error('Error deleting route:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Get routes by asset
   */
  async getRoutesByAsset(assetId: string) {
    const { data, error } = await supabase
      .from('route')
      .select('*')
      .contains('performance_data->assigned_assets', [assetId]);

    if (error) {
      console.error('Error fetching routes by asset:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  /**
   * Update route performance metrics
   */
  async updateRoutePerformance(
    routeId: string, 
    performance: {
      successfulTrip?: boolean;
      profit?: number;
      actualTime?: number;
      disasterEncountered?: boolean;
    }
  ) {
    // Fetch current performance data
    const { data: currentRoute, error: fetchError } = await supabase
      .from('route')
      .select('performance_data')
      .eq('route_id', routeId)
      .single();

    if (fetchError) {
      console.error('Error fetching route performance:', fetchError);
      return { error: fetchError };
    }

    const currentPerf = currentRoute.performance_data || {
      totalTrips: 0,
      successfulTrips: 0,
      failedTrips: 0,
      totalProfit: 0,
      averageProfit: 0,
      averageTime: 0,
      onTimePercentage: 100,
      disasters_encountered: 0
    };

    // Update metrics
    const totalTrips = currentPerf.totalTrips + 1;
    const successfulTrips = currentPerf.successfulTrips + (performance.successfulTrip ? 1 : 0);
    const failedTrips = currentPerf.failedTrips + (performance.successfulTrip ? 0 : 1);
    const totalProfit = currentPerf.totalProfit + (performance.profit || 0);
    const disasters_encountered = currentPerf.disasters_encountered + (performance.disasterEncountered ? 1 : 0);

    const updatedPerformance = {
      ...currentPerf,
      totalTrips,
      successfulTrips,
      failedTrips,
      totalProfit,
      averageProfit: totalProfit / totalTrips,
      averageTime: performance.actualTime 
        ? (currentPerf.averageTime * (totalTrips - 1) + performance.actualTime) / totalTrips
        : currentPerf.averageTime,
      onTimePercentage: (successfulTrips / totalTrips) * 100,
      disasters_encountered,
      profit_per_day: totalProfit / totalTrips // Simplified calculation
    };

    const { error } = await supabase
      .from('route')
      .update({
        performance_data: updatedPerformance
      })
      .eq('route_id', routeId);

    if (error) {
      console.error('Error updating route performance:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Check if a player can create a route between two ports
   */
  async canCreateRoute(playerId: string, originPortId: string, destinationPortId: string) {
    // Check if route already exists
    const { data: existingRoute, error } = await supabase
      .from('route')
      .select('route_id')
      .eq('owner_id', playerId)
      .eq('origin_port_id', originPortId)
      .eq('destination_port_id', destinationPortId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing route:', error);
      return false;
    }

    // Route already exists
    if (existingRoute) {
      return false;
    }

    // In a real implementation, would also check:
    // - Port ownership/access rights
    // - Player licenses
    // - Port availability
    
    return true;
  }

  /**
   * Assign an asset to a route
   */
  async assignAssetToRoute(assetId: string, routeId: string) {
    const { error } = await supabase
      .from('asset')
      .update({ assigned_route_id: routeId })
      .eq('asset_id', assetId);

    if (error) {
      console.error('Error assigning asset to route:', error);
      return { error };
    }

    // Update route's assigned assets list
    const { data: route, error: routeError } = await this.getRoute(routeId);
    if (!routeError && route) {
      const assignedAssets = route.assigned_assets || [];
      if (!assignedAssets.includes(assetId)) {
        assignedAssets.push(assetId);
        await this.updateRoute(routeId, { assigned_assets: assignedAssets });
      }
    }

    return { error: null };
  }

  /**
   * Unassign an asset from its route
   */
  async unassignAssetFromRoute(assetId: string) {
    // First, get the current route assignment
    const { data: asset, error: assetError } = await supabase
      .from('asset')
      .select('assigned_route_id')
      .eq('asset_id', assetId)
      .single();

    if (assetError) {
      console.error('Error fetching asset:', assetError);
      return { error: assetError };
    }

    const routeId = asset?.assigned_route_id;

    // Unassign the asset
    const { error } = await supabase
      .from('asset')
      .update({ assigned_route_id: null })
      .eq('asset_id', assetId);

    if (error) {
      console.error('Error unassigning asset from route:', error);
      return { error };
    }

    // Update route's assigned assets list
    if (routeId) {
      const { data: route, error: routeError } = await this.getRoute(routeId);
      if (!routeError && route) {
        const assignedAssets = (route.assigned_assets || []).filter(id => id !== assetId);
        await this.updateRoute(routeId, { assigned_assets: assignedAssets });
      }
    }

    return { error: null };
  }
}

// Export a singleton instance
export const routeService = new RouteService();