-- Add two trap signals for trading
-- 1. 急杀诱多 (Sharp Drop Bull Trap): Long exit / Short entry
-- 2. 空头陷阱 (Bear Trap): Long entry / Short exit

-- Signal 1: 急杀诱多 (Sharp Drop Bull Trap) - Long Exit
-- Conditions: changePercent > -2%, V1=true, daily gain between 3% and 10%
INSERT INTO trading_signals_v2 (id, signal_type, signal_name, category, description, conditions, priority, is_enabled, entry_exit, created_at) VALUES
('long_exit_trap_001', 'long', '急杀诱多', 'trap_signal', 
 '涨跌幅>-2%，V1成交量，当天涨幅3%-10%，警惕回调', 
 '{"change_threshold": -2, "volume_level": "V1", "daily_gain_min": 3, "daily_gain_max": 10}', 
 85, 1, 'exit', datetime('now'));

-- Signal 1: 急杀诱多 (Sharp Drop Bull Trap) - Short Entry
-- Same conditions but for short entry
INSERT INTO trading_signals_v2 (id, signal_type, signal_name, category, description, conditions, priority, is_enabled, entry_exit, created_at) VALUES
('short_entry_trap_001', 'short', '急杀诱多', 'trap_signal', 
 '涨跌幅>-2%，V1成交量，当天涨幅3%-10%，做空机会', 
 '{"change_threshold": -2, "volume_level": "V1", "daily_gain_min": 3, "daily_gain_max": 10}', 
 85, 1, 'entry', datetime('now'));

-- Signal 2: 空头陷阱 (Bear Trap) - Long Entry
-- Conditions: changePercent > -3%, V1=true, daily gain < 0%
INSERT INTO trading_signals_v2 (id, signal_type, signal_name, category, description, conditions, priority, is_enabled, entry_exit, created_at) VALUES
('long_entry_trap_002', 'long', '空头陷阱', 'trap_signal', 
 '涨跌幅>-3%，V1成交量，当天下跌，反弹机会', 
 '{"change_threshold": -3, "volume_level": "V1", "daily_gain_max": 0}', 
 85, 1, 'entry', datetime('now'));

-- Signal 2: 空头陷阱 (Bear Trap) - Short Exit
-- Same conditions but for short exit
INSERT INTO trading_signals_v2 (id, signal_type, signal_name, category, description, conditions, priority, is_enabled, entry_exit, created_at) VALUES
('short_exit_trap_002', 'short', '空头陷阱', 'trap_signal', 
 '涨跌幅>-3%，V1成交量，当天下跌，平空机会', 
 '{"change_threshold": -3, "volume_level": "V1", "daily_gain_max": 0}', 
 85, 1, 'exit', datetime('now'));

-- Create index for trap signals
CREATE INDEX IF NOT EXISTS idx_trading_signals_trap ON trading_signals_v2(category) WHERE category = 'trap_signal';
