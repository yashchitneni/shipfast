import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketConditions {
  regions: {
    [regionId: string]: {
      goods: {
        [goodType: string]: {
          price: number
          supply: number
          demand: number
          trend: 'up' | 'down' | 'stable'
        }
      }
    }
  }
}

interface Disaster {
  id: string
  type: 'storm' | 'piracy' | 'port_strike' | 'supply_shortage'
  affectedRegions: string[]
  severity: number
  startTime: string
  duration: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current world state
    const { data: worldState, error: fetchError } = await supabase
      .from('world_state')
      .select('*')
      .single()

    if (fetchError) throw fetchError

    const currentMarket = worldState.market_conditions as MarketConditions
    const activeDisasters = worldState.active_disasters as Disaster[]

    // Simulate market changes
    const updatedMarket = simulateMarketChanges(currentMarket, activeDisasters)
    
    // Process and expire disasters
    const updatedDisasters = processDisasters(activeDisasters)
    
    // Randomly generate new disasters (small chance)
    if (Math.random() < 0.05) { // 5% chance per tick
      updatedDisasters.push(generateRandomDisaster())
    }

    // Update world state
    const { error: updateError } = await supabase
      .from('world_state')
      .update({
        market_conditions: updatedMarket,
        active_disasters: updatedDisasters,
        updated_at: new Date().toISOString()
      })
      .eq('world_id', 'main')

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        marketUpdated: true,
        disasterCount: updatedDisasters.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

function simulateMarketChanges(
  market: MarketConditions, 
  disasters: Disaster[]
): MarketConditions {
  const updatedMarket = JSON.parse(JSON.stringify(market)) // Deep clone
  
  // Iterate through all regions and goods
  for (const [regionId, region] of Object.entries(updatedMarket.regions)) {
    for (const [goodType, good] of Object.entries(region.goods)) {
      // Base market fluctuation (±5%)
      const fluctuation = 0.95 + Math.random() * 0.1
      
      // Check if region is affected by disasters
      const regionDisasters = disasters.filter(d => 
        d.affectedRegions.includes(regionId)
      )
      
      let disasterMultiplier = 1
      if (regionDisasters.length > 0) {
        // Disasters increase prices and reduce supply
        disasterMultiplier = 1 + (0.2 * regionDisasters.length)
      }
      
      // Update price
      good.price = Math.round(good.price * fluctuation * disasterMultiplier)
      
      // Update supply and demand
      good.supply = Math.round(good.supply * (0.9 + Math.random() * 0.2))
      good.demand = Math.round(good.demand * (0.9 + Math.random() * 0.2))
      
      // Determine trend
      const ratio = good.demand / good.supply
      if (ratio > 1.2) good.trend = 'up'
      else if (ratio < 0.8) good.trend = 'down'
      else good.trend = 'stable'
    }
  }
  
  return updatedMarket
}

function processDisasters(disasters: Disaster[]): Disaster[] {
  const now = new Date().getTime()
  
  // Filter out expired disasters
  return disasters.filter(disaster => {
    const startTime = new Date(disaster.startTime).getTime()
    const endTime = startTime + (disaster.duration * 60 * 60 * 1000) // duration in hours
    return now < endTime
  })
}

function generateRandomDisaster(): Disaster {
  const types: Disaster['type'][] = ['storm', 'piracy', 'port_strike', 'supply_shortage']
  const regions = ['north-america', 'europe', 'asia', 'africa', 'south-america', 'oceania']
  
  const type = types[Math.floor(Math.random() * types.length)]
  const affectedCount = Math.floor(Math.random() * 3) + 1 // 1-3 regions
  const affectedRegions = []
  
  for (let i = 0; i < affectedCount; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)]
    if (!affectedRegions.includes(region)) {
      affectedRegions.push(region)
    }
  }
  
  return {
    id: crypto.randomUUID(),
    type,
    affectedRegions,
    severity: Math.floor(Math.random() * 5) + 1, // 1-5
    startTime: new Date().toISOString(),
    duration: Math.floor(Math.random() * 48) + 12 // 12-60 hours
  }
}