-- Add entry_exit field to trading_signals_v2 to distinguish between entry and exit signals
ALTER TABLE trading_signals_v2 ADD COLUMN entry_exit TEXT DEFAULT 'entry';

-- Update existing signals based on their descriptions and names
-- 做多买点（开多仓）: signal_type='long' + description contains '开仓'
UPDATE trading_signals_v2 
SET entry_exit = 'entry'
WHERE signal_type = 'long' 
  AND (description LIKE '%开仓%' OR signal_name LIKE '%买点%' OR signal_name LIKE '%启动%');

-- 做多卖点（平多仓）: signal_type='long' + description contains '平仓'
UPDATE trading_signals_v2 
SET entry_exit = 'exit'
WHERE signal_type = 'long' 
  AND (description LIKE '%平仓%' OR signal_name LIKE '%卖点%' OR signal_name LIKE '%止盈%' OR signal_name LIKE '%止损%');

-- 做空买点（开空仓）: signal_type='short' + description contains '开仓'
UPDATE trading_signals_v2 
SET entry_exit = 'entry'
WHERE signal_type = 'short' 
  AND (description LIKE '%开仓%' OR signal_name LIKE '%买点%' OR signal_name LIKE '%回落%');

-- 做空卖点（平空仓）: signal_type='short' + description contains '平仓'
UPDATE trading_signals_v2 
SET entry_exit = 'exit'
WHERE signal_type = 'short' 
  AND (description LIKE '%平仓%' OR signal_name LIKE '%卖点%' OR signal_name LIKE '%止盈%' OR signal_name LIKE '%止损%');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_trading_signals_v2_entry_exit ON trading_signals_v2(entry_exit);
CREATE INDEX IF NOT EXISTS idx_trading_signals_v2_type_entry_exit ON trading_signals_v2(signal_type, entry_exit);
