import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketItem {
  id: string
  base_price: number
  current_price: number
  supply: number
  demand: number
  volatility: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all market items
    const { data: items, error } = await supabase
      .from('market_items')
      .select('*')

    if (error) throw error

    // Update each item's price based on market dynamics
    const updates = items.map((item: MarketItem) => {
      // Calculate price change based on supply/demand and volatility
      const supplyDemandRatio = item.supply / Math.max(item.demand, 1)
      const priceMultiplier = Math.max(0.5, Math.min(2.0, 1 / supplyDemandRatio))
      
      // Add random volatility
      const volatilityImpact = 1 + (Math.random() - 0.5) * item.volatility
      
      // Calculate new price
      const newPrice = item.base_price * priceMultiplier * volatilityImpact
      
      // Update supply and demand with slight variations
      const newSupply = Math.max(100, item.supply * (0.95 + Math.random() * 0.1))
      const newDemand = Math.max(100, item.demand * (0.95 + Math.random() * 0.1))

      return {
        id: item.id,
        current_price: Math.round(newPrice * 100) / 100,
        supply: Math.round(newSupply),
        demand: Math.round(newDemand),
        last_updated: new Date().toISOString()
      }
    })

    // Batch update all items
    const { error: updateError } = await supabase
      .from('market_items')
      .upsert(updates)

    if (updateError) throw updateError

    // Check for disaster events (10% chance)
    if (Math.random() < 0.1) {
      const disasters = [
        {
          type: 'hurricane',
          message: '🌊 Hurricane Warning! Raw material prices surge!',
          affectedCategories: ['RAW_MATERIALS'],
          priceImpact: 1.5
        },
        {
          type: 'port_strike',
          message: '⚓ Port workers on strike! Supply chains disrupted!',
          affectedCategories: ['MANUFACTURED', 'CONSUMER'],
          priceImpact: 1.3
        },
        {
          type: 'demand_spike',
          message: '📈 Unexpected demand spike for luxury goods!',
          affectedCategories: ['LUXURY'],
          priceImpact: 1.8
        }
      ]

      const disaster = disasters[Math.floor(Math.random() * disasters.length)]
      
      // Broadcast disaster event via Realtime
      const channel = supabase.channel('disaster-events')
      await channel.send({
        type: 'broadcast',
        event: 'disaster',
        payload: {
          id: crypto.randomUUID(),
          ...disaster,
          affectedItems: items
            .filter((item: any) => disaster.affectedCategories.includes(item.category))
            .map((item: any) => item.id),
          duration: 5
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Market prices updated',
        itemsUpdated: updates.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})