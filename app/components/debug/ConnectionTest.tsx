'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const ConnectionTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const newResults: string[] = [];
    
    const supabase = createClient();
    
    // Test 1: Count query
    const countStart = Date.now();
    try {
      const { count, error } = await supabase
        .from('market_items')
        .select('*', { count: 'exact', head: true });
      
      const countTime = Date.now() - countStart;
      newResults.push(`✅ Count query: ${count} items in ${countTime}ms`);
      
      if (error) {
        newResults.push(`❌ Count error: ${error.message}`);
      }
    } catch (err) {
      newResults.push(`❌ Count failed: ${err}`);
    }
    
    // Test 2: Fetch all
    const fetchStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .order('name');
      
      const fetchTime = Date.now() - fetchStart;
      newResults.push(`✅ Fetch all: ${data?.length || 0} items in ${fetchTime}ms`);
      
      if (error) {
        newResults.push(`❌ Fetch error: ${error.message}`);
      }
    } catch (err) {
      newResults.push(`❌ Fetch failed: ${err}`);
    }
    
    setResults(newResults);
    setTesting(false);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded shadow-lg z-50 max-w-sm">
      <h3 className="font-bold mb-2">Database Connection Test</h3>
      <button
        onClick={runTests}
        disabled={testing}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 mb-3"
      >
        {testing ? 'Testing...' : 'Run Tests'}
      </button>
      
      <div className="space-y-1 text-sm">
        {results.map((result, i) => (
          <div key={i}>{result}</div>
        ))}
      </div>
    </div>
  );
};