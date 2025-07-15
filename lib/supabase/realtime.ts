import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from './client'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

// Subscribe to world state changes
export function subscribeToWorldState(
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeSubscription {
  const supabase = createClient()
  
  const channel = supabase
    .channel('world-state-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'world_state'
      },
      callback
    )
    .subscribe()

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

// Subscribe to auction updates
export function subscribeToAuctions(
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeSubscription {
  const supabase = createClient()
  
  const channel = supabase
    .channel('auction-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'auction'
      },
      callback
    )
    .subscribe()

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

// Subscribe to player's own asset changes
export function subscribeToPlayerAssets(
  playerId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeSubscription {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`player-assets-${playerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'asset',
        filter: `owner_id=eq.${playerId}`
      },
      callback
    )
    .subscribe()

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

// Subscribe to player's own route changes
export function subscribeToPlayerRoutes(
  playerId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeSubscription {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`player-routes-${playerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'route',
        filter: `owner_id=eq.${playerId}`
      },
      callback
    )
    .subscribe()

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

// Subscribe to leaderboard changes (public player stats)
export function subscribeToLeaderboard(
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeSubscription {
  const supabase = createClient()
  
  const channel = supabase
    .channel('leaderboard-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'player'
      },
      callback
    )
    .subscribe()

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

// Presence channel for multiplayer features
export function createPresenceChannel(channelName: string) {
  const supabase = createClient()
  
  return supabase.channel(channelName, {
    config: {
      presence: {
        key: ''
      }
    }
  })
}