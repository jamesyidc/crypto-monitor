-- Add single trade limit column to simulated_accounts table
-- This is separate from max_position_value which represents total position limit

-- Single trade limit (单次买入上限金额 - 每次开仓单个币种的最大投入)
ALTER TABLE simulated_accounts ADD COLUMN single_trade_limit REAL DEFAULT NULL;

-- Update comments for clarity:
-- max_position_value: 持仓最高金额 (Total position value limit across all holdings)
--   Example: If set to $30,000, total value of all holdings cannot exceed $30,000
--   This is NOT the same as account balance - you may have $100,000 but only use $30,000 for positions
--
-- single_trade_limit: 单次买入上限金额 (Maximum amount per single trade)
--   Example: If set to $10,000, each individual buy order cannot exceed $10,000
--   Recommended: 30% of max_position_value
--
-- position_splits: 分几份交易 (How many parts to split each trade into)
--   Example: If single_trade_limit is $10,000 and splits is 5, each split is $2,000
