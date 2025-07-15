export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      player: {
        Row: {
          user_id: string
          username: string
          cash: number
          net_worth: number
          ai_companion_state: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          username: string
          cash?: number
          net_worth?: number
          ai_companion_state?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          username?: string
          cash?: number
          net_worth?: number
          ai_companion_state?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset: {
        Row: {
          asset_id: string
          owner_id: string
          asset_type: string
          custom_name: string | null
          stats: Json
          maintenance_cost: number
          assigned_route_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          asset_id?: string
          owner_id: string
          asset_type: string
          custom_name?: string | null
          stats?: Json
          maintenance_cost?: number
          assigned_route_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          owner_id?: string
          asset_type?: string
          custom_name?: string | null
          stats?: Json
          maintenance_cost?: number
          assigned_route_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "asset_assigned_route_id_fkey"
            columns: ["assigned_route_id"]
            referencedRelation: "route"
            referencedColumns: ["route_id"]
          }
        ]
      }
      route: {
        Row: {
          route_id: string
          owner_id: string
          origin_port_id: string
          destination_port_id: string
          performance_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          route_id?: string
          owner_id: string
          origin_port_id: string
          destination_port_id: string
          performance_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          route_id?: string
          owner_id?: string
          origin_port_id?: string
          destination_port_id?: string
          performance_data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          }
        ]
      }
      specialist: {
        Row: {
          specialist_id: string
          specialist_type: string
          effect_bonuses: Json
          base_salary: number
          created_at: string
        }
        Insert: {
          specialist_id?: string
          specialist_type: string
          effect_bonuses?: Json
          base_salary?: number
          created_at?: string
        }
        Update: {
          specialist_id?: string
          specialist_type?: string
          effect_bonuses?: Json
          base_salary?: number
          created_at?: string
        }
        Relationships: []
      }
      player_specialists: {
        Row: {
          player_id: string
          specialist_id: string
          hired_date: string
        }
        Insert: {
          player_id: string
          specialist_id: string
          hired_date?: string
        }
        Update: {
          player_id?: string
          specialist_id?: string
          hired_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_specialists_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "player_specialists_specialist_id_fkey"
            columns: ["specialist_id"]
            referencedRelation: "specialist"
            referencedColumns: ["specialist_id"]
          }
        ]
      }
      world_state: {
        Row: {
          world_id: string
          market_conditions: Json
          active_disasters: Json
          updated_at: string
        }
        Insert: {
          world_id: string
          market_conditions?: Json
          active_disasters?: Json
          updated_at?: string
        }
        Update: {
          world_id?: string
          market_conditions?: Json
          active_disasters?: Json
          updated_at?: string
        }
        Relationships: []
      }
      auction: {
        Row: {
          auction_id: string
          opportunity_type: string
          opportunity_details: Json
          current_bid: number
          highest_bidder_id: string | null
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          auction_id?: string
          opportunity_type: string
          opportunity_details?: Json
          current_bid?: number
          highest_bidder_id?: string | null
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          auction_id?: string
          opportunity_type?: string
          opportunity_details?: Json
          current_bid?: number
          highest_bidder_id?: string | null
          end_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_highest_bidder_id_fkey"
            columns: ["highest_bidder_id"]
            referencedRelation: "player"
            referencedColumns: ["user_id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}