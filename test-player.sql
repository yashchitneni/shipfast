-- Insert a test player
INSERT INTO player (user_id, username, cash, net_worth)
VALUES ('player-1', 'Captain Test', 50000, 50000)
ON CONFLICT (user_id) DO UPDATE
SET cash = EXCLUDED.cash,
    net_worth = EXCLUDED.net_worth;
