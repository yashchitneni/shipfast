import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types/database.generated'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Use service role key in development to bypass RLS
  const keyToUse = (process.env.NODE_ENV === 'development' && serviceKey) ? serviceKey : anonKey;
  
  console.log('🔧 Supabase client configuration:');
  console.log('- URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- Anon Key:', anonKey ? '✅ Set' : '❌ Missing');
  console.log('- Service Key:', serviceKey ? '✅ Set' : '❌ Missing');
  console.log('- Using service role key:', !!(process.env.NODE_ENV === 'development' && serviceKey));
  console.log('- Environment:', process.env.NODE_ENV);
  
  const client = createBrowserClient<Database>(supabaseUrl, keyToUse);
  
  // Test the client configuration
  console.log('🔍 Testing client configuration...');
  
  return client;
}

// Create a client specifically for anonymous operations
export function createAnonClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}