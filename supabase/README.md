# Supabase Setup for Flexport

This directory contains all Supabase configuration for the Flexport video game.

## Setup Instructions

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key

2. **Configure Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Run Migrations**
   - Install Supabase CLI: `npm install -g supabase`
   - Link to your project: `supabase link --project-ref your-project-ref`
   - Run migrations: `supabase db push`

## Database Schema

### Tables

- **player** - Core player data and empire state
- **asset** - Ships and warehouses owned by players
- **route** - Trade routes between ports
- **specialist** - Available specialists for hire
- **player_specialists** - Junction table for hired specialists
- **world_state** - Global economy and disaster state
- **auction** - Live competitive bidding events

### Key Features

1. **Row Level Security (RLS)**
   - Players can only access their own data
   - Shared data (world state, auctions) is read-only

2. **Realtime Subscriptions**
   - World state updates
   - Auction bidding
   - Player asset changes
   - Leaderboard updates

3. **Edge Functions**
   - `simulate-economy` - Updates market conditions and disasters
   - `manage-auction` - Handles competitive bidding

4. **Stored Procedures**
   - `deduct_player_cash` - Safe cash transactions
   - `calculate_player_net_worth` - Update net worth
   - `process_route_profits` - Handle route completions
   - `update_ai_companion_progress` - AI leveling system

## Development

### Local Development
```bash
# Start Supabase locally
supabase start

# Stop Supabase
supabase stop

# Reset database
supabase db reset
```

### Testing Edge Functions
```bash
# Serve functions locally
supabase functions serve

# Deploy a function
supabase functions deploy simulate-economy
```

## Client Usage

### Authentication
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Realtime Subscriptions
```typescript
import { subscribeToWorldState } from '@/lib/supabase/realtime'

// Subscribe to world state changes
const subscription = subscribeToWorldState((payload) => {
  console.log('World state updated:', payload)
})

// Unsubscribe when done
subscription.unsubscribe()
```

### Database Operations
```typescript
// Get player data
const { data, error } = await supabase
  .from('player')
  .select('*')
  .single()

// Create an asset
const { data, error } = await supabase
  .from('asset')
  .insert({
    owner_id: user.id,
    asset_type: 'Container Ship',
    stats: { speed: 1.2, capacity: 100 }
  })
```

## Security Notes

- Never expose service role key in client code
- Use RLS policies to secure data access
- Validate all user inputs in Edge Functions
- Use optimistic locking for concurrent updates