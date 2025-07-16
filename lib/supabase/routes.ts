import { createClient } from './client';
import { RouteSegment } from '../../types/route';

// Create supabase client instance
const supabase = createClient();

// Database types for routes
export interface RouteDB {
  route_id: string;
  owner_id: string;
  origin_port_id: string;
  destination_port_id: string;
  custom_name?: string;
  waypoints: any[];
  segments: RouteSegment[];
  total_distance: number;
  estimated_time: number;
  assigned_assets: string[];
  is_active: boolean;
  requirements: any;
  profitability: any;
  created_at: string;
  updated_at: string;
}

// Simplified route service with basic CRUD operations
export const routeService = {
  // Get all routes for a player
  async getPlayerRoutes(playerId: string) {
    try {
      const { data, error } = await supabase
        .from('route')
        .select('*')
        .eq('owner_id', playerId);

      if (error) {
        console.error('Error fetching routes:', error);
        return { data: [], error };
      }

      // Simple transformation without complex JSON parsing
      const routes = data?.map(route => ({
        route_id: route.route_id,
        owner_id: route.owner_id,
        origin_port_id: route.origin_port_id,
        destination_port_id: route.destination_port_id,
        custom_name: '',
        waypoints: [],
        segments: [],
        total_distance: 0,
        estimated_time: 0,
        assigned_assets: [],
        is_active: false,
        requirements: {},
        profitability: {},
        created_at: route.created_at,
        updated_at: route.updated_at
      })) || [];

      return { data: routes, error: null };
    } catch (error) {
      console.error('Error in getPlayerRoutes:', error);
      return { data: [], error };
    }
  },

  // Create a new route
  async createRoute(route: Omit<RouteDB, 'route_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('route')
        .insert([{
          owner_id: route.owner_id,
          origin_port_id: route.origin_port_id,
          destination_port_id: route.destination_port_id,
          custom_name: route.custom_name
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating route:', error);
      return { data: null, error };
    }
  },

  // Update route
  async updateRoute(routeId: string, updates: Partial<RouteDB>) {
    try {
      const { data, error } = await supabase
        .from('route')
        .update(updates)
        .eq('route_id', routeId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating route:', error);
      return { data: null, error };
    }
  },

  // Delete route
  async deleteRoute(routeId: string) {
    try {
      const { error } = await supabase
        .from('route')
        .delete()
        .eq('route_id', routeId);

      return { error };
    } catch (error) {
      console.error('Error deleting route:', error);
      return { error };
    }
  }
};