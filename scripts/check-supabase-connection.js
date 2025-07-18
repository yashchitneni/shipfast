// Script to test Supabase connection speed
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.time('Connection Test');
  
  try {
    // Test 1: Simple count query
    console.time('Count Query');
    const { count, error: countError } = await supabase
      .from('market_items')
      .select('*', { count: 'exact', head: true });
    console.timeEnd('Count Query');
    
    if (countError) {
      console.error('Count error:', countError);
    } else {
      console.log('Market items count:', count);
    }
    
    // Test 2: Fetch all items
    console.time('Fetch All Items');
    const { data, error } = await supabase
      .from('market_items')
      .select('*')
      .order('name');
    console.timeEnd('Fetch All Items');
    
    if (error) {
      console.error('Fetch error:', error);
    } else {
      console.log('Fetched items:', data?.length || 0);
    }
    
    // Test 3: Single item query
    if (data && data.length > 0) {
      console.time('Single Item Query');
      const { data: singleItem } = await supabase
        .from('market_items')
        .select('*')
        .eq('id', data[0].id)
        .single();
      console.timeEnd('Single Item Query');
      
      console.log('Single item:', singleItem?.name);
    }
    
  } catch (err) {
    console.error('Connection test failed:', err);
  }
  
  console.timeEnd('Connection Test');
}

testConnection();