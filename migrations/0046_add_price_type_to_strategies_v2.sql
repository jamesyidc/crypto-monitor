-- 添加买点和卖点价格类型选择功能（无 CHECK 约束版本）
-- Migration: 0046_add_price_type_to_strategies_v2.sql
-- Note: 移除 CHECK 约束以兼容 Cloudflare D1

-- 1. 添加买点价格类型字段
ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited';

-- 2. 添加买点指定价格字段
ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;

-- 3. 添加卖点价格类型字段
ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited';

-- 4. 添加卖点指定价格字段
ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;

-- 注释：
-- entry_price_type: 买点价格类型
--   有效值: 'unlimited', 'open', 'close', 'high', 'low', 'specified'
--   默认: 'unlimited'
--
-- entry_specified_price: 指定的买入价格，仅在 entry_price_type = 'specified' 时有效
--
-- exit_price_type: 卖点价格类型
--   有效值: 'unlimited', 'open', 'close', 'high', 'low', 'specified'
--   默认: 'unlimited'
--
-- exit_specified_price: 指定的卖出价格，仅在 exit_price_type = 'specified' 时有效

-- 为新字段创建索引（用于查询性能优化）
CREATE INDEX IF NOT EXISTS idx_strategies_entry_price_type ON trading_strategies(entry_price_type);
CREATE INDEX IF NOT EXISTS idx_strategies_exit_price_type ON trading_strategies(exit_price_type);
