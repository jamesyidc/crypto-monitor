-- 添加买点和卖点价格类型选择功能
-- Migration: 0046_add_price_type_to_strategies.sql

-- 1. 添加买点价格类型字段
ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited' 
  CHECK(entry_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'));

-- 2. 添加买点指定价格字段（仅当 entry_price_type = 'specified' 时使用）
ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;

-- 3. 添加卖点价格类型字段
ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited'
  CHECK(exit_price_type IN ('unlimited', 'open', 'close', 'high', 'low', 'specified'));

-- 4. 添加卖点指定价格字段（仅当 exit_price_type = 'specified' 时使用）
ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;

-- 注释：
-- entry_price_type: 买点价格类型
--   - 'unlimited': 无限制（默认），只要信号触发就买入
--   - 'open': 开盘价买入
--   - 'close': 收盘价买入
--   - 'high': 最高价买入
--   - 'low': 最低价买入
--   - 'specified': 指定价格买入（需配合 entry_specified_price 使用）
--
-- entry_specified_price: 指定的买入价格，仅在 entry_price_type = 'specified' 时有效
--
-- exit_price_type: 卖点价格类型，选项同买点
--
-- exit_specified_price: 指定的卖出价格，仅在 exit_price_type = 'specified' 时有效

-- 为新字段创建索引（用于查询性能优化）
CREATE INDEX IF NOT EXISTS idx_strategies_entry_price_type ON trading_strategies(entry_price_type);
CREATE INDEX IF NOT EXISTS idx_strategies_exit_price_type ON trading_strategies(exit_price_type);
