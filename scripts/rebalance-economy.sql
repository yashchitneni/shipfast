-- Economy Rebalancing Script
-- Makes ships affordable with starting cash + early trading profits

-- Option 1: Reduce ship prices to be achievable with early trading
UPDATE asset_market_listings 
SET price = CASE
    -- Small trading vessels (was 500k+, now 75k-150k)
    WHEN name LIKE '%Dhow%' THEN 75000
    WHEN name LIKE '%Sloop%' THEN 95000
    WHEN name LIKE '%Schooner%' THEN 120000
    WHEN name LIKE '%Cog%' THEN 85000
    
    -- Medium vessels (was 1M+, now 200k-400k)
    WHEN name LIKE '%Brigantine%' THEN 250000
    WHEN name LIKE '%Corvette%' THEN 350000
    WHEN name LIKE '%Frigate%' THEN 400000
    WHEN name LIKE '%Barque%' THEN 300000
    
    -- Large vessels (was 2M+, now 600k-1.2M)
    WHEN name LIKE '%Galleon%' THEN 800000
    WHEN name LIKE '%Ship of the Line%' THEN 1200000
    WHEN name LIKE '%Clipper%' THEN 600000
    
    -- Keep current price if not matched
    ELSE price
END
WHERE category = 'SHIP';

-- Option 2: Increase starting cash (uncomment if preferred)
-- UPDATE player SET cash = 150000 WHERE cash = 50000;

-- Option 3: Add a starter ship for new players
INSERT INTO asset_market_listings (
    name, category, price, available_quantity, maintenance_cost, crew_required, cargo_capacity, speed
) VALUES (
    'Starter Trading Vessel', 'SHIP', 25000, 100, 50, 3, 50, 8
) ON CONFLICT (name) DO UPDATE SET price = 25000;

-- Show updated ship prices
SELECT name, price, cargo_capacity, speed
FROM asset_market_listings
WHERE category = 'SHIP'
ORDER BY price ASC;

-- Show what a player with 50k can now afford
SELECT name, price, cargo_capacity
FROM asset_market_listings
WHERE category = 'SHIP' AND price <= 75000
ORDER BY price ASC;