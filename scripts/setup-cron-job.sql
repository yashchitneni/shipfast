-- Setup Cron Job for Market Price Updates
-- Run this in Supabase SQL Editor after deploying the edge function

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Get your project details
-- You can find these in your Supabase project settings
-- Replace these placeholders:
-- YOUR-PROJECT-REF: Found in Settings > General > Reference ID
-- YOUR-ANON-KEY: Found in Settings > API > anon public key

-- Step 3: Create the cron job
SELECT cron.schedule(
    'update-market-prices',  -- job name
    '*/5 * * * *',          -- every 5 minutes
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

-- Step 4: Verify the job was created
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname = 'update-market-prices';

-- Step 5: Enable Realtime on tables
ALTER TABLE market_items REPLICA IDENTITY FULL;
ALTER TABLE disaster_events REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;

-- Note: After running this SQL, go to Database > Replication in Supabase
-- and toggle on replication for these tables

-- Optional: Test the edge function immediately (one-time run)
/*
SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/update-market-prices',
    headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR-ANON-KEY',
        'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
        'updateType', 'manual-test'
    )
);
*/

-- Monitor cron job executions
/*
SELECT 
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobname = 'update-market-prices'
ORDER BY start_time DESC
LIMIT 10;
*/