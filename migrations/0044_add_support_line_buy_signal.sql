-- Add support line buy signal to trading_signals_v2
-- This signal triggers when coins approach their support price (within 0.5%)
-- Display limit: Max 1 signal per 10 K-line periods

INSERT INTO trading_signals_v2 (id, signal_type, signal_name, category, description, conditions, priority, is_enabled, entry_exit, created_at) VALUES
('long_support_001', 'long', '支撑买入', 'support_line', 
 '币种价格接近或等于支撑线价格（0.5%范围内），10个K线限制显示1个', 
 '{"distance_threshold": 0.5, "kline_display_limit": 10, "check_support_table": true}', 
 90, 1, 'entry', datetime('now'));

-- Create index for better performance when querying support line signals
CREATE INDEX IF NOT EXISTS idx_trading_signals_support ON trading_signals_v2(category) WHERE category = 'support_line';
