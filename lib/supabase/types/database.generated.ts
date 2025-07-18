export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_companions: {
        Row: {
          accuracy: number | null
          created_at: string | null
          experience: number
          id: string
          level: string
          name: string
          successful_suggestions: number
          total_suggestions: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          experience?: number
          id?: string
          level: string
          name?: string
          successful_suggestions?: number
          total_suggestions?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          experience?: number
          id?: string
          level?: string
          name?: string
          successful_suggestions?: number
          total_suggestions?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_disaster_predictions: {
        Row: {
          actual_occurred: boolean | null
          companion_id: string
          confidence: number | null
          created_at: string | null
          disaster_type: string
          id: string
          location: string
          predicted_date: string
        }
        Insert: {
          actual_occurred?: boolean | null
          companion_id: string
          confidence?: number | null
          created_at?: string | null
          disaster_type: string
          id?: string
          location: string
          predicted_date: string
        }
        Update: {
          actual_occurred?: boolean | null
          companion_id?: string
          confidence?: number | null
          created_at?: string | null
          disaster_type?: string
          id?: string
          location?: string
          predicted_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_disaster_predictions_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_events: {
        Row: {
          companion_id: string
          created_at: string | null
          event_data: Json | null
          event_type: string
          experience_gained: number | null
          id: string
        }
        Insert: {
          companion_id: string
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          experience_gained?: number | null
          id?: string
        }
        Update: {
          companion_id?: string
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          experience_gained?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_events_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_market_insights: {
        Row: {
          best_buy_times: number[] | null
          best_sell_times: number[] | null
          companion_id: string
          created_at: string | null
          demand_pattern: string | null
          good_id: string
          id: string
          last_analyzed: string | null
          port_id: string
          profit_potential: number | null
        }
        Insert: {
          best_buy_times?: number[] | null
          best_sell_times?: number[] | null
          companion_id: string
          created_at?: string | null
          demand_pattern?: string | null
          good_id: string
          id?: string
          last_analyzed?: string | null
          port_id: string
          profit_potential?: number | null
        }
        Update: {
          best_buy_times?: number[] | null
          best_sell_times?: number[] | null
          companion_id?: string
          created_at?: string | null
          demand_pattern?: string | null
          good_id?: string
          id?: string
          last_analyzed?: string | null
          port_id?: string
          profit_potential?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_market_insights_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_price_history: {
        Row: {
          id: string
          insight_id: string
          price: number
          timestamp: string | null
          volume: number | null
        }
        Insert: {
          id?: string
          insight_id: string
          price: number
          timestamp?: string | null
          volume?: number | null
        }
        Update: {
          id?: string
          insight_id?: string
          price?: number
          timestamp?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_price_history_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "ai_market_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_route_patterns: {
        Row: {
          average_profit_margin: number | null
          best_time_of_day: number | null
          companion_id: string
          created_at: string | null
          end_port: string
          id: string
          last_used: string | null
          optimal_goods: string[] | null
          route_id: string
          start_port: string
          success_rate: number | null
          times_used: number | null
          weather_preference: string | null
        }
        Insert: {
          average_profit_margin?: number | null
          best_time_of_day?: number | null
          companion_id: string
          created_at?: string | null
          end_port: string
          id?: string
          last_used?: string | null
          optimal_goods?: string[] | null
          route_id: string
          start_port: string
          success_rate?: number | null
          times_used?: number | null
          weather_preference?: string | null
        }
        Update: {
          average_profit_margin?: number | null
          best_time_of_day?: number | null
          companion_id?: string
          created_at?: string | null
          end_port?: string
          id?: string
          last_used?: string | null
          optimal_goods?: string[] | null
          route_id?: string
          start_port?: string
          success_rate?: number | null
          times_used?: number | null
          weather_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_route_patterns_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          action_reasoning: string | null
          action_required: boolean | null
          action_target: string | null
          action_timing: string | null
          action_type: string | null
          companion_id: string
          created_at: string | null
          description: string
          expected_profit: number | null
          id: string
          priority: string
          resolved_at: string | null
          risk_level: number | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          action_reasoning?: string | null
          action_required?: boolean | null
          action_target?: string | null
          action_timing?: string | null
          action_type?: string | null
          companion_id: string
          created_at?: string | null
          description: string
          expected_profit?: number | null
          id?: string
          priority: string
          resolved_at?: string | null
          risk_level?: number | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          action_reasoning?: string | null
          action_required?: boolean | null
          action_target?: string | null
          action_timing?: string | null
          action_type?: string | null
          companion_id?: string
          created_at?: string | null
          description?: string
          expected_profit?: number | null
          id?: string
          priority?: string
          resolved_at?: string | null
          risk_level?: number | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
        ]
      }
      asset: {
        Row: {
          asset_id: string
          asset_type: string
          assigned_route_id: string | null
          created_at: string
          current_load: number | null
          custom_name: string | null
          destination: string | null
          health: number | null
          last_maintenance: string | null
          maintenance_cost: number
          owner_id: string
          port_id: string | null
          position: Json | null
          rotation: number | null
          stats: Json
          status: string | null
          updated_at: string
        }
        Insert: {
          asset_id?: string
          asset_type: string
          assigned_route_id?: string | null
          created_at?: string
          current_load?: number | null
          custom_name?: string | null
          destination?: string | null
          health?: number | null
          last_maintenance?: string | null
          maintenance_cost?: number
          owner_id: string
          port_id?: string | null
          position?: Json | null
          rotation?: number | null
          stats?: Json
          status?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          asset_type?: string
          assigned_route_id?: string | null
          created_at?: string
          current_load?: number | null
          custom_name?: string | null
          destination?: string | null
          health?: number | null
          last_maintenance?: string | null
          maintenance_cost?: number
          owner_id?: string
          port_id?: string | null
          position?: Json | null
          rotation?: number | null
          stats?: Json
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_assigned_route_id_fkey"
            columns: ["assigned_route_id"]
            isOneToOne: false
            referencedRelation: "route"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "asset_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
        ]
      }
      auction: {
        Row: {
          auction_id: string
          created_at: string
          current_bid: number
          end_time: string
          highest_bidder_id: string | null
          opportunity_details: Json
          opportunity_type: string
          updated_at: string
        }
        Insert: {
          auction_id?: string
          created_at?: string
          current_bid?: number
          end_time: string
          highest_bidder_id?: string | null
          opportunity_details?: Json
          opportunity_type: string
          updated_at?: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          current_bid?: number
          end_time?: string
          highest_bidder_id?: string | null
          opportunity_details?: Json
          opportunity_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_highest_bidder_id_fkey"
            columns: ["highest_bidder_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
        ]
      }
      market_dynamics: {
        Row: {
          active: boolean | null
          created_at: string | null
          demand_volatility: number | null
          id: string
          price_elasticity: number | null
          seasonal_modifiers: Json | null
          supply_growth_rate: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          demand_volatility?: number | null
          id?: string
          price_elasticity?: number | null
          seasonal_modifiers?: Json | null
          supply_growth_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          demand_volatility?: number | null
          id?: string
          price_elasticity?: number | null
          seasonal_modifiers?: Json | null
          supply_growth_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_items: {
        Row: {
          base_price: number
          category: string | null
          created_at: string | null
          current_price: number
          demand: number
          id: string
          last_updated: string | null
          name: string
          production_cost_modifier: number
          supply: number
          type: string
          volatility: number
        }
        Insert: {
          base_price: number
          category?: string | null
          created_at?: string | null
          current_price: number
          demand?: number
          id?: string
          last_updated?: string | null
          name: string
          production_cost_modifier?: number
          supply?: number
          type: string
          volatility?: number
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string | null
          current_price?: number
          demand?: number
          id?: string
          last_updated?: string | null
          name?: string
          production_cost_modifier?: number
          supply?: number
          type?: string
          volatility?: number
        }
        Relationships: []
      }
      player: {
        Row: {
          ai_companion_state: Json
          cash: number
          created_at: string
          net_worth: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          ai_companion_state?: Json
          cash?: number
          created_at?: string
          net_worth?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          ai_companion_state?: Json
          cash?: number
          created_at?: string
          net_worth?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      player_specialists: {
        Row: {
          hired_date: string
          player_id: string
          specialist_id: string
        }
        Insert: {
          hired_date?: string
          player_id: string
          specialist_id: string
        }
        Update: {
          hired_date?: string
          player_id?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_specialists_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "player_specialists_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist"
            referencedColumns: ["specialist_id"]
          },
        ]
      }
      price_history: {
        Row: {
          created_at: string | null
          demand: number
          id: string
          item_id: string
          price: number
          supply: number
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          demand: number
          id?: string
          item_id: string
          price: number
          supply: number
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          demand?: number
          id?: string
          item_id?: string
          price?: number
          supply?: number
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "market_items"
            referencedColumns: ["id"]
          },
        ]
      }
      route: {
        Row: {
          created_at: string
          destination_port_id: string
          origin_port_id: string
          owner_id: string
          performance_data: Json
          route_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_port_id: string
          origin_port_id: string
          owner_id: string
          performance_data?: Json
          route_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_port_id?: string
          origin_port_id?: string
          owner_id?: string
          performance_data?: Json
          route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
        ]
      }
      specialist: {
        Row: {
          base_salary: number
          created_at: string
          effect_bonuses: Json
          specialist_id: string
          specialist_type: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          effect_bonuses?: Json
          specialist_id?: string
          specialist_type: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          effect_bonuses?: Json
          specialist_id?: string
          specialist_type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          player_id: string
          price_per_unit: number
          quantity: number
          timestamp: string | null
          total_price: number
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          player_id: string
          price_per_unit: number
          quantity: number
          timestamp?: string | null
          total_price: number
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          player_id?: string
          price_per_unit?: number
          quantity?: number
          timestamp?: string | null
          total_price?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "market_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
        ]
      }
      world_state: {
        Row: {
          active_disasters: Json
          market_conditions: Json
          updated_at: string
          world_id: string
        }
        Insert: {
          active_disasters?: Json
          market_conditions?: Json
          updated_at?: string
          world_id?: string
        }
        Update: {
          active_disasters?: Json
          market_conditions?: Json
          updated_at?: string
          world_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      placed_assets: {
        Row: {
          asset_id: string | null
          asset_type: string | null
          created_at: string | null
          current_load: number | null
          custom_name: string | null
          destination: string | null
          health: number | null
          last_maintenance: string | null
          owner_id: string | null
          owner_name: string | null
          port_id: string | null
          position: Json | null
          rotation: number | null
          stats: Json | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
        ]
      }
      public_player_stats: {
        Row: {
          ai_level: number | null
          net_worth: number | null
          username: string | null
        }
        Insert: {
          ai_level?: never
          net_worth?: number | null
          username?: string | null
        }
        Update: {
          ai_level?: never
          net_worth?: number | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_ai_experience: {
        Args: { p_companion_id: string; p_experience: number }
        Returns: Json
      }
      add_player_cash: {
        Args: { player_id: string; amount: number }
        Returns: undefined
      }
      calculate_area_effects: {
        Args: { asset_position: Json; effect_radius: number }
        Returns: {
          affected_port_id: string
          distance: number
        }[]
      }
      calculate_market_price: {
        Args: {
          p_base_cost: number
          p_production_modifier: number
          p_supply: number
          p_demand: number
          p_volatility: number
        }
        Returns: number
      }
      calculate_player_net_worth: {
        Args: { player_id: string }
        Returns: number
      }
      cleanup_old_price_history: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deduct_player_cash: {
        Args: { player_id: string; amount: number }
        Returns: undefined
      }
      get_asset_utilization: {
        Args: { asset_id: string }
        Returns: number
      }
      grant_exclusive_license: {
        Args: { player_id: string; license_type: string; bonuses: Json }
        Returns: undefined
      }
      process_route_profits: {
        Args: {
          route_id: string
          profit: number
          disasters_encountered?: number
        }
        Returns: undefined
      }
      update_ai_companion_progress: {
        Args: { player_id: string; xp_gained: number }
        Returns: Json
      }
      update_market_cycle: {
        Args: Record<PropertyKey, never>
        Returns: {
          item_id: string
          old_price: number
          new_price: number
          price_change_percent: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
