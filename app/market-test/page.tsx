'use client';

import { useEffect, useState } from 'react';
import { marketService } from '@/lib/supabase/markets';
import type { MarketItem } from '@/types/market';

export default function MarketTestPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarketData() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching market items...');
        const marketItems = await marketService.getMarketItems();
        console.log('✅ Market items:', marketItems);
        
        setItems(marketItems);
      } catch (err) {
        console.error('❌ Error loading market data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadMarketData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Market Test</h1>
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Market Test</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Market Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Market Items ({items.length})</h2>
          
          {items.length === 0 ? (
            <p className="text-gray-500">No market items found</p>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.type} - {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${item.currentPrice}</p>
                      <p className="text-sm text-gray-600">
                        Base: ${item.basePrice}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Supply:</span> {item.supply}
                    </div>
                    <div>
                      <span className="text-gray-600">Demand:</span> {item.demand}
                    </div>
                    <div>
                      <span className="text-gray-600">Volatility:</span> {(item.volatility * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="text-gray-600">Cost Modifier:</span> {item.productionCostModifier}x
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 