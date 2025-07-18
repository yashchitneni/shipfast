import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types/database.generated'

// Singleton instance to avoid recreating client
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Use service role key in development to bypass RLS
  const keyToUse = (process.env.NODE_ENV === 'development' && serviceKey) ? serviceKey : anonKey;
  
  // Only log once on first creation
  if (!clientInstance) {
    console.log('🔧 Supabase client initialized');
  }
  
  clientInstance = createBrowserClient<Database>(supabaseUrl, keyToUse);
  
  return clientInstance;
}

// Create a client specifically for anonymous operations
export function createAnonClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}