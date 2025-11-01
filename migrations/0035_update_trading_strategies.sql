-- 添加最大持仓K线周期字段
-- max_holding_periods: 最大持仓K线周期数（0=不限制）
ALTER TABLE trading_strategies ADD COLUMN max_holding_periods INTEGER DEFAULT 0;

-- 注意：
-- position_splits 仅用于买入分批（1-10次）
-- split_interval_pct 买入加仓间隔百分比（0.5-10%）
-- 卖出时一次性全部卖出
