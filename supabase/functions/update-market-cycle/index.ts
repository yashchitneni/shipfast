import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketDynamics {
  supply_growth_rate: number;
  demand_volatility: number;
  price_elasticity: number;
  seasonal_modifiers: Record<string, number>;
}

interface MarketItem {
  id: string;
  base_price: number;
  current_price: number;
  supply: number;
  demand: number;
  volatility: number;
  production_cost_modifier: number;
}

// Calculate dynamic price based on supply/demand
function calculatePrice(
  baseCost: number,
  productionModifier: number,
  supply: number,
  demand: number,
  volatility: number
): number {
  const costBase = baseCost * productionModifier;
  const supplyDemandRatio = supply > 0 ? demand / supply : 2.0;
  const volatilityFactor = 1 + (Math.random() - 0.5) * volatility;
  
  return Math.max(
    costBase * 0.5, // Minimum 50% of cost base
    costBase * supplyDemandRatio * volatilityFactor
  );
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active market dynamics
    const { data: dynamicsData, error: dynamicsError } = await supabase
      .from('market_dynamics')
      .select('*')
      .eq('active', true)
      .single();

    if (dynamicsError) {
      throw new Error(`Failed to fetch market dynamics: ${dynamicsError.message}`);
    }

    const dynamics: MarketDynamics = dynamicsData;

    // Get all market items
    const { data: items, error: itemsError } = await supabase
      .from('market_items')
      .select('*');

    if (itemsError) {
      throw new Error(`Failed to fetch market items: ${itemsError.message}`);
    }

    const updatedItems: any[] = [];
    const priceHistory: any[] = [];
    const priceChanges: any[] = [];

    // Update each market item
    for (const item of items as MarketItem[]) {
      const oldPrice = item.current_price;
      
      // Apply market dynamics
      const newSupply = item.supply * (1 + dynamics.supply_growth_rate);
      const demandVariation = (Math.random() - 0.5) * dynamics.demand_volatility;
      const newDemand = item.demand * (1 + demandVariation);
      
      // Calculate new price
      const newPrice = calculatePrice(
        item.base_price,
        item.production_cost_modifier,
        newSupply,
        newDemand,
        item.volatility
      );

      updatedItems.push({
        id: item.id,
        supply: Math.round(newSupply),
        demand: Math.round(newDemand),
        current_price: Math.round(newPrice * 100) / 100,
        last_updated: new Date().toISOString()
      });

      priceHistory.push({
        item_id: item.id,
        price: Math.round(newPrice * 100) / 100,
        supply: Math.round(newSupply),
        demand: Math.round(newDemand),
        timestamp: new Date().toISOString()
      });

      priceChanges.push({
        itemId: item.id,
        oldPrice,
        newPrice: Math.round(newPrice * 100) / 100,
        percentageChange: ((newPrice - oldPrice) / oldPrice) * 100
      });
    }

    // Update all items in database
    const { error: updateError } = await supabase
      .from('market_items')
      .upsert(updatedItems);

    if (updateError) {
      throw new Error(`Failed to update market items: ${updateError.message}`);
    }

    // Insert price history
    const { error: historyError } = await supabase
      .from('price_history')
      .insert(priceHistory);

    if (historyError) {
      throw new Error(`Failed to insert price history: ${historyError.message}`);
    }

    // Clean up old price history (keep only last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await supabase
      .from('price_history')
      .delete()
      .lt('timestamp', sevenDaysAgo.toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: updatedItems.length,
        priceChanges,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});