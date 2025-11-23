-- Add include_historical_levels field to trading_strategies table
-- This allows strategies to include coins that reached certain levels in the past 7 days
ALTER TABLE trading_strategies ADD COLUMN include_historical_levels INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_strategies_historical_levels ON trading_strategies(include_historical_levels);
