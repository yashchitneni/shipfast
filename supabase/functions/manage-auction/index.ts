import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuctionBidRequest {
  auctionId: string
  bidAmount: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { auctionId, bidAmount }: AuctionBidRequest = await req.json()

    // Validate bid amount
    if (!bidAmount || bidAmount <= 0) {
      throw new Error('Invalid bid amount')
    }

    // Start a transaction-like operation
    // First, get the auction and player's cash
    const [auctionResult, playerResult] = await Promise.all([
      supabase
        .from('auction')
        .select('*')
        .eq('auction_id', auctionId)
        .single(),
      supabase
        .from('player')
        .select('cash')
        .eq('user_id', user.id)
        .single()
    ])

    if (auctionResult.error) throw new Error('Auction not found')
    if (playerResult.error) throw new Error('Player not found')

    const auction = auctionResult.data
    const player = playerResult.data

    // Check if auction is still active
    if (new Date(auction.end_time) < new Date()) {
      throw new Error('Auction has ended')
    }

    // Check if bid is higher than current
    if (bidAmount <= auction.current_bid) {
      throw new Error('Bid must be higher than current bid')
    }

    // Check if player has enough cash
    if (player.cash < bidAmount) {
      throw new Error('Insufficient funds')
    }

    // Update auction with new highest bid
    const { error: updateError } = await supabase
      .from('auction')
      .update({
        current_bid: bidAmount,
        highest_bidder_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('auction_id', auctionId)
      .eq('updated_at', auction.updated_at) // Optimistic lock

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new Error('Auction was updated by another bidder. Please try again.')
      }
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        auctionId,
        newBid: bidAmount,
        message: 'Bid placed successfully'
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

// Edge Function to process ended auctions (called by cron)
export async function processEndedAuctions() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get all ended auctions with winners
  const { data: endedAuctions, error } = await supabase
    .from('auction')
    .select('*')
    .lte('end_time', new Date().toISOString())
    .not('highest_bidder_id', 'is', null)

  if (error) throw error

  for (const auction of endedAuctions) {
    // Process auction based on type
    if (auction.opportunity_type === 'Unique Asset') {
      await processAssetAuction(supabase, auction)
    } else if (auction.opportunity_type === 'Exclusive License') {
      await processLicenseAuction(supabase, auction)
    }
    
    // Delete the processed auction
    await supabase
      .from('auction')
      .delete()
      .eq('auction_id', auction.auction_id)
  }
}

async function processAssetAuction(supabase: any, auction: any) {
  const assetDetails = auction.opportunity_details
  
  // Create the asset for the winner
  await supabase
    .from('asset')
    .insert({
      owner_id: auction.highest_bidder_id,
      asset_type: assetDetails.type,
      custom_name: assetDetails.name,
      stats: assetDetails.stats,
      maintenance_cost: assetDetails.maintenance_cost || 0
    })

  // Deduct the bid amount from winner's cash
  await supabase.rpc('deduct_player_cash', {
    player_id: auction.highest_bidder_id,
    amount: auction.current_bid
  })
}

async function processLicenseAuction(supabase: any, auction: any) {
  // Implementation for exclusive licenses
  // This would grant special bonuses or access to the winner
  const licenseDetails = auction.opportunity_details
  
  // Update player's AI companion state with new license
  await supabase.rpc('grant_exclusive_license', {
    player_id: auction.highest_bidder_id,
    license_type: licenseDetails.type,
    bonuses: licenseDetails.bonuses
  })

  // Deduct the bid amount
  await supabase.rpc('deduct_player_cash', {
    player_id: auction.highest_bidder_id,
    amount: auction.current_bid
  })
}