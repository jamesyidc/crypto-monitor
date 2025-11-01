-- 添加策略增强功能：多卖点、币种级别过滤、涨幅条件
-- Migration: 0037_add_strategy_enhancements.sql

-- 1. 添加多卖点支持（JSON数组存储多个卖点信号）
ALTER TABLE trading_strategies ADD COLUMN exit_signals_json TEXT;  -- JSON数组：["信号1", "信号2", "信号3"]

-- 2. 添加币种级别过滤（JSON数组存储允许的级别）
ALTER TABLE trading_strategies ADD COLUMN allowed_coin_levels TEXT;  -- JSON数组：["1", "2", "3"]

-- 3. 添加涨幅条件
ALTER TABLE trading_strategies ADD COLUMN daily_gain_condition_operator TEXT CHECK(daily_gain_condition_operator IN ('greater_than', 'less_than', NULL));  -- 大于或小于
ALTER TABLE trading_strategies ADD COLUMN daily_gain_condition_value REAL;  -- 涨幅百分比值

-- 4. 添加持仓周期字段（如果不存在）
-- ALTER TABLE trading_strategies ADD COLUMN max_holding_periods INTEGER DEFAULT 0;  -- 最大持仓周期（K线数量），0表示不限制

-- 注释：
-- exit_signals_json: 存储多个卖点信号，格式如 ["高抛", "波段高点", "止盈止损"]
-- allowed_coin_levels: 存储允许的币种级别，格式如 ["1", "2", "3", "4"]，空表示不限制
-- daily_gain_condition_operator: 'greater_than' (大于，用于做空) 或 'less_than' (小于，用于做多)
-- daily_gain_condition_value: 涨幅百分比，如 5.0 表示 5%

-- 数据迁移：将现有的单个卖点迁移到JSON数组格式
UPDATE trading_strategies 
SET exit_signals_json = json_array(exit_signal_type)
WHERE exit_signal_type IS NOT NULL AND exit_signal_type != '';

-- 为新字段创建索引（用于查询性能优化）
CREATE INDEX IF NOT EXISTS idx_strategies_coin_levels ON trading_strategies(allowed_coin_levels);
CREATE INDEX IF NOT EXISTS idx_strategies_gain_condition ON trading_strategies(daily_gain_condition_operator, daily_gain_condition_value);
