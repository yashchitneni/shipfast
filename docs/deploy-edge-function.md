# Deploy Market Update Edge Function

## Overview
This guide walks you through deploying the Supabase Edge Function that automatically updates market prices every 5 minutes.

## Prerequisites
- Supabase CLI installed locally
- Supabase project linked
- Edge function code ready in `/supabase/functions/update-market-prices/`

## Step 1: Deploy the Edge Function

### Option A: Using Supabase Dashboard (Easier)

1. Go to your Supabase Dashboard
2. Navigate to "Edge Functions" in the sidebar
3. Click "Create a new function"
4. Name it: `update-market-prices`
5. Copy the entire contents of `/supabase/functions/update-market-prices/index.ts`
6. Paste into the function editor
7. Click "Deploy"

### Option B: Using Supabase CLI (Recommended)

```bash
# From your project root
cd shipfast

# Deploy the function
npx supabase functions deploy update-market-prices

# If not logged in, first run:
npx supabase login
```

## Step 2: Set Up the Cron Job

After deploying the function, set up automatic execution:

1. In Supabase Dashboard, go to "Database" → "Extensions"
2. Enable the `pg_cron` extension if not already enabled
3. Go to SQL Editor and run:

```sql
-- Schedule the edge function to run every 5 minutes
SELECT cron.schedule(
    'update-market-prices', -- job name
    '*/5 * * * *', -- every 5 minutes
    $$
    SELECT net.http_post(
        url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/update-market-prices',
        headers := jsonb_build_object(
            'Authorization', 'Bearer YOUR-ANON-KEY',
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'updateType', 'scheduled'
        )
    );
    $$
);

-- Verify the cron job was created
SELECT * FROM cron.job;
```

Replace:
- `YOUR-PROJECT-REF` with your Supabase project reference
- `YOUR-ANON-KEY` with your Supabase anon key

## Step 3: Test the Edge Function

Test manually before relying on the cron job:

```bash
# Test locally
npx supabase functions serve update-market-prices

# In another terminal, test the function
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/update-market-prices' \
  --header 'Authorization: Bearer YOUR-ANON-KEY' \
  --header 'Content-Type: application/json' \
  --data '{"updateType":"manual"}'
```

Or test the deployed function:

```bash
curl -i --location --request POST \
  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/update-market-prices' \
  --header 'Authorization: Bearer YOUR-ANON-KEY' \
  --header 'Content-Type: application/json' \
  --data '{"updateType":"manual"}'
```

## Step 4: Enable Realtime on Tables

Enable realtime to broadcast price changes to all connected clients:

```sql
-- Enable realtime on market_items table
ALTER TABLE market_items REPLICA IDENTITY FULL;

-- Enable realtime on disaster_events table (if not already done)
ALTER TABLE disaster_events REPLICA IDENTITY FULL;
```

Then in Supabase Dashboard:
1. Go to "Database" → "Replication"
2. Toggle on replication for:
   - `market_items`
   - `disaster_events`
   - `transactions` (optional, for live trading feed)

## Step 5: Monitor the Function

Check if everything is working:

```sql
-- View recent price updates
SELECT 
    name,
    current_price,
    last_updated,
    supply,
    demand
FROM market_items
ORDER BY last_updated DESC
LIMIT 10;

-- Check cron job execution history
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    nodename,
    nodeport,
    username,
    active,
    jobexecuted,
    jobnextrun
FROM cron.job_run_details
WHERE jobname = 'update-market-prices'
ORDER BY runid DESC
LIMIT 10;

-- View recent disaster events
SELECT 
    id,
    type,
    severity,
    affected_items,
    created_at,
    resolved_at
FROM disaster_events
ORDER BY created_at DESC
LIMIT 5;
```

## Troubleshooting

### Function Not Running
1. Check Edge Function logs in Supabase Dashboard
2. Verify cron job is active: `SELECT * FROM cron.job WHERE jobname = 'update-market-prices';`
3. Check for errors: `SELECT * FROM cron.job_run_details WHERE status = 'failed';`

### Prices Not Updating
1. Test the function manually with curl
2. Check the response for error messages
3. Verify database permissions for the function

### Realtime Not Working
1. Ensure tables have `REPLICA IDENTITY FULL`
2. Check replication is enabled in dashboard
3. Verify client subscription code is correct

## Next Steps

After deployment:
1. Monitor the first few automatic updates
2. Check that all clients receive realtime updates
3. Verify disaster events are created appropriately
4. Test the market trading with dynamic prices

## Function Configuration

The edge function uses these environment variables (set automatically):
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: For database access

No additional configuration needed!