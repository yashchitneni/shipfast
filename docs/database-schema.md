# **Entity-Relationship Diagram (ERD)**

Version: 3.0 (Complete Schema - All Migrations)
Date: July 16, 2025
Game: Flexport - The Video Game

## **1. Introduction**

This document provides the definitive logical data model for Flexport, reflecting ALL tables from database migrations 001-007. This serves as the authoritative blueprint for the Supabase (PostgreSQL) database structure.

## **2. Complete Entity-Relationship Diagram**

```mermaid
erDiagram
    %% Core Player and Authentication
    AUTH_USERS {
        UUID id PK
        string email
        timestamp created_at
    }
    
    PLAYERS {
        UUID user_id PK_FK
        string username
        int cash
        int level
        int experience
        int total_distance_traveled
        int total_profit_earned
        int total_trade_volume
        timestamp created_at
        timestamp updated_at
    }

    %% Asset Management System
    ASSET {
        UUID asset_id PK
        UUID owner_id FK
        string asset_type
        string custom_name
        jsonb stats
        int maintenance_cost
        UUID assigned_route_id FK
        jsonb position
        int rotation
        text port_id
        text status
        int health
        int current_load
        text destination
        timestamp last_maintenance
        timestamp created_at
    }

    PLACED_ASSETS_VIEW {
        UUID asset_id
        UUID owner_id
        string asset_type
        jsonb position
        text port_id
        text status
        string owner_name
    }

    %% Route System
    ROUTE {
        UUID route_id PK
        UUID owner_id FK
        string origin_port_id
        string destination_port_id
        string route_name
        jsonb profitability
        jsonb active_disasters
        timestamp created_at
        timestamp updated_at
    }

    %% Market System (Migration 005)
    MARKET_ITEMS {
        UUID id PK
        string name
        string type
        string category
        decimal base_price
        decimal current_price
        int supply
        int demand
        decimal volatility
        decimal production_cost_modifier
        timestamp last_updated
        timestamp created_at
    }

    PRICE_HISTORY {
        UUID id PK
        UUID item_id FK
        decimal price
        int supply
        int demand
        timestamp timestamp
        timestamp created_at
    }

    TRANSACTIONS {
        UUID id PK
        UUID item_id FK
        string type
        int quantity
        decimal price
        decimal total
        UUID player_id FK
        timestamp timestamp
        timestamp created_at
    }

    MARKET_DYNAMICS {
        UUID id PK
        decimal supply_growth_rate
        decimal demand_volatility
        decimal price_elasticity
        jsonb seasonal_modifiers
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    %% AI Companion System (Migration 006)
    AI_COMPANIONS {
        UUID id PK
        UUID user_id FK
        string name
        string level
        int experience
        int total_suggestions
        int successful_suggestions
        decimal accuracy
        timestamp created_at
        timestamp updated_at
    }

    AI_ROUTE_PATTERNS {
        UUID id PK
        UUID companion_id FK
        UUID route_id
        string start_port
        string end_port
        decimal average_profit_margin
        decimal success_rate
        text[] optimal_goods
        int best_time_of_day
        string weather_preference
        int times_used
        timestamp last_used
        timestamp created_at
    }

    AI_MARKET_INSIGHTS {
        UUID id PK
        UUID companion_id FK
        text port_id
        text good_id
        string demand_pattern
        int[] best_buy_times
        int[] best_sell_times
        decimal profit_potential
        timestamp last_analyzed
        timestamp created_at
    }

    AI_PRICE_HISTORY {
        UUID id PK
        UUID insight_id FK
        decimal price
        int volume
        timestamp timestamp
    }

    AI_DISASTER_PREDICTIONS {
        UUID id PK
        UUID companion_id FK
        string disaster_type
        string location
        timestamp predicted_date
        decimal confidence
        boolean actual_occurred
        timestamp created_at
    }

    AI_SUGGESTIONS {
        UUID id PK
        UUID companion_id FK
        string type
        string priority
        string title
        string description
        decimal expected_profit
        decimal risk_level
        boolean action_required
        string action_type
        string action_target
        string action_timing
        string action_reasoning
        string status
        timestamp created_at
        timestamp resolved_at
    }

    AI_LEARNING_EVENTS {
        UUID id PK
        UUID companion_id FK
        string event_type
        jsonb event_data
        int experience_gained
        timestamp created_at
    }

    %% Additional Systems
    SPECIALIST {
        UUID specialist_id PK
        string specialist_type
        jsonb effect_bonuses
        int base_salary
    }

    PLAYER_SPECIALISTS {
        UUID player_id FK
        UUID specialist_id FK
        date hired_date
    }

    WORLD_STATE {
        string world_id PK
        jsonb market_conditions
        jsonb active_disasters
    }

    AUCTION {
        UUID auction_id PK
        string opportunity_type
        jsonb opportunity_details
        int current_bid
        UUID highest_bidder_id FK
        timestamp end_time
    }

    %% Relationships
    AUTH_USERS ||--|| PLAYERS : has_profile
    
    PLAYERS ||--o{ ASSET : owns
    PLAYERS ||--o{ ROUTE : creates
    PLAYERS ||--o{ PLAYER_SPECIALISTS : hires
    PLAYERS ||--o{ AUCTION : bids_on
    PLAYERS ||--o{ TRANSACTIONS : performs
    PLAYERS ||--|| AI_COMPANIONS : has

    ASSET }o--|| ROUTE : assigned_to
    
    SPECIALIST ||--o{ PLAYER_SPECIALISTS : hired_by

    MARKET_ITEMS ||--o{ PRICE_HISTORY : has_history
    MARKET_ITEMS ||--o{ TRANSACTIONS : is_traded

    AI_COMPANIONS ||--o{ AI_ROUTE_PATTERNS : learns
    AI_COMPANIONS ||--o{ AI_MARKET_INSIGHTS : analyzes
    AI_COMPANIONS ||--o{ AI_DISASTER_PREDICTIONS : predicts
    AI_COMPANIONS ||--o{ AI_SUGGESTIONS : generates
    AI_COMPANIONS ||--o{ AI_LEARNING_EVENTS : experiences

    AI_MARKET_INSIGHTS ||--o{ AI_PRICE_HISTORY : tracks
```

## **3. Detailed Entity Descriptions**

### **Core Entities**

#### **PLAYERS**
- Central player entity, extended from Supabase auth.users
- Tracks progression (level, experience) and statistics
- One-to-one relationship with AUTH_USERS

#### **ASSET**
- All player-owned assets (ships, planes, warehouses)
- Enhanced with position tracking and health/status system
- Can be assigned to routes or stationed at ports

### **Market System (Migration 005)**

#### **MARKET_ITEMS**
- Defines all tradable goods in the economy
- Types: GOODS, CAPITAL, ASSETS, LABOR
- Categories: RAW_MATERIALS, MANUFACTURED, LUXURY, PERISHABLE
- Dynamic pricing based on supply/demand

#### **PRICE_HISTORY**
- Time-series data for market analysis
- Tracks price, supply, and demand over time

#### **TRANSACTIONS**
- Complete audit trail of all player trades
- Types: BUY, SELL

#### **MARKET_DYNAMICS**
- Global economic configuration
- Controls supply growth, demand volatility, and seasonal effects

### **AI Companion System (Migration 006)**

#### **AI_COMPANIONS**
- Each player has one AI companion
- Levels: novice → apprentice → journeyman → expert → master → legendary
- Learns from player actions and improves over time

#### **AI_ROUTE_PATTERNS**
- Learned patterns from successful routes
- Tracks profitability, optimal goods, timing preferences

#### **AI_MARKET_INSIGHTS**
- Port-specific market intelligence
- Demand patterns: stable, rising, falling, volatile
- Optimal trading times

#### **AI_SUGGESTIONS**
- Generated recommendations for players
- Types: route, trade, upgrade, warning
- Priority levels: low, medium, high, critical

### **Supporting Systems**

#### **ROUTE**
- Player-created trade connections between ports
- Tracks profitability and active conditions

#### **SPECIALIST / PLAYER_SPECIALISTS**
- Hired experts providing empire-wide bonuses
- Many-to-many relationship through junction table

#### **AUCTION**
- Real-time bidding events for unique opportunities
- Supports multiplayer competition

## **4. Key Design Decisions**

### **JSONB Usage**
- Used for flexible, schema-less data (stats, positions, event_data)
- Enables rapid iteration without migrations
- Indexed with GIN for performance

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Players can only access their own data
- Market data is public read, private write

### **Temporal Data**
- Extensive use of timestamps for historical analysis
- Price history enables trend analysis
- Learning events track AI improvement over time

### **Performance Optimization**
- Strategic indexes on foreign keys and frequently queried columns
- Views (placed_assets) for common query patterns
- Stored procedures for complex calculations

## **5. Migration History**

1. **001_initial_schema.sql** - Core tables (players, assets, routes)
2. **002_row_level_security.sql** - Security policies
3. **003_stored_procedures.sql** - Helper functions
4. **004_dev_test_user.sql** - Development data
5. **005_market_system.sql** - Complete trading system
6. **006_ai_companion_system.sql** - AI advisor system
7. **007_enhanced_assets.sql** - Asset positioning and status

## **6. Performance Considerations**

### **Indexes**
```sql
-- Core performance indexes
CREATE INDEX idx_assets_owner ON assets(owner_id);
CREATE INDEX idx_assets_port ON assets(port_id);
CREATE INDEX idx_routes_owner ON routes(owner_id);
CREATE INDEX idx_market_items_category ON market_items(category);
CREATE INDEX idx_price_history_item_time ON price_history(item_id, timestamp);
CREATE INDEX idx_transactions_player_time ON transactions(player_id, timestamp);

-- JSONB indexes for flexible queries
CREATE INDEX idx_assets_stats ON assets USING GIN (stats);
CREATE INDEX idx_market_seasonal ON market_dynamics USING GIN (seasonal_modifiers);
```

### **Views for Common Queries**
```sql
-- Placed assets view for map rendering
CREATE VIEW placed_assets AS
SELECT
  a.asset_id,
  a.owner_id,
  a.asset_type,
  a.position,
  a.port_id,
  a.status,
  p.username as owner_name
FROM assets a
JOIN players p ON a.owner_id = p.user_id
WHERE a.position IS NOT NULL;
```

### **Stored Procedures**
```sql
-- Calculate route profitability
CREATE OR REPLACE FUNCTION calculate_route_profit(
  route_uuid UUID
) RETURNS DECIMAL AS $$
DECLARE
  base_profit DECIMAL := 1000;
  route_record RECORD;
BEGIN
  SELECT * INTO route_record FROM routes WHERE route_id = route_uuid;
  
  -- Apply market-based calculations
  RETURN base_profit * COALESCE((route_record.profitability->>'modifier')::DECIMAL, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Update AI companion experience
CREATE OR REPLACE FUNCTION update_ai_experience(
  companion_uuid UUID,
  experience_gained INT,
  event_type TEXT,
  event_data JSONB
) RETURNS VOID AS $$
BEGIN
  -- Update companion experience
  UPDATE ai_companions
  SET experience = experience + experience_gained,
      total_suggestions = total_suggestions + 1
  WHERE id = companion_uuid;
  
  -- Log learning event
  INSERT INTO ai_learning_events (companion_id, event_type, event_data, experience_gained)
  VALUES (companion_uuid, event_type, event_data, experience_gained);
END;
$$ LANGUAGE plpgsql;
```

## **7. Row Level Security Policies**

```sql
-- Players table policies
CREATE POLICY "Users can view own profile" ON players
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON players
  FOR UPDATE USING (auth.uid() = user_id);

-- Assets table policies
CREATE POLICY "Users can manage own assets" ON assets
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Public can view placed assets" ON assets
  FOR SELECT USING (position IS NOT NULL);

-- Market tables (public read, restricted write)
CREATE POLICY "Anyone can view market items" ON market_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view price history" ON price_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create transactions" ON transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

-- AI companion policies
CREATE POLICY "Users can access own AI companion" ON ai_companions
  FOR ALL USING (auth.uid() = user_id);
```

## **8. Development and Testing**

### **Setup**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Start local development
supabase start

# Apply migrations
supabase db push
```

### **Test Data**
```sql
-- Insert test player
INSERT INTO players (user_id, username, cash)
VALUES ('00000000-0000-0000-0000-000000000000', 'test_player', 100000);

-- Insert test market items
INSERT INTO market_items (name, type, category, base_price, current_price, supply, demand)
VALUES
  ('Electronics', 'GOODS', 'MANUFACTURED', 100, 120, 1000, 1200),
  ('Coffee', 'GOODS', 'RAW_MATERIALS', 10, 12, 5000, 4800);
```

## **9. Future Considerations**

- **Ports Table**: Currently ports are referenced by string IDs. A dedicated PORTS table with real-world data is planned.
- **Disaster Events Table**: For tracking historical disasters and their impacts
- **Alliance/Guild System**: For multiplayer cooperation
- **Achievement System**: For player progression rewards
- **Audit Logs**: Complete change tracking for critical operations

This schema represents the complete, current state of the Flexport database and serves as the authoritative reference for all development work.