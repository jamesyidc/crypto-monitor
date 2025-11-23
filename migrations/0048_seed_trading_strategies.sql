-- 初始化交易策略库数据
-- 确保信号池生成的策略名称与策略库一致

-- 清空现有数据（如果有）
DELETE FROM trading_strategies;

-- 1. 震荡收敛策略（做多开仓）
INSERT INTO trading_strategies (
  strategy_name,
  strategy_type,
  priority,
  entry_signal_type,
  entry_signal_keyword,
  entry_signal_category,
  entry_signal_template,
  exit_signal_type,
  exit_signal_keyword,
  exit_signal_category,
  exit_signal_template,
  position_splits,
  split_interval_pct,
  stop_loss_pct,
  take_profit_pct,
  max_position_size,
  is_enabled,
  description
) VALUES (
  '震荡收敛策略',
  'long',
  'high',
  '震荡收敛',
  '震荡收敛',
  'convergence',
  'oscillation_convergence',
  '波段高点',
  'RSI>65',
  'peak',
  'band_peak',
  1,
  2.0,
  5.0,
  10.0,
  100.0,
  1,
  '检测5根K线内>=2次震荡收敛信号，RSI<50时做多开仓。平仓条件：RSI>65且涨幅<=0.1%（波段高点）'
);

-- 2. 波段高点策略（做空开仓 / 做多平仓）
INSERT INTO trading_strategies (
  strategy_name,
  strategy_type,
  priority,
  entry_signal_type,
  entry_signal_keyword,
  entry_signal_category,
  entry_signal_template,
  exit_signal_type,
  exit_signal_keyword,
  exit_signal_category,
  exit_signal_template,
  position_splits,
  split_interval_pct,
  stop_loss_pct,
  take_profit_pct,
  max_position_size,
  is_enabled,
  description
) VALUES (
  '波段高点策略',
  'short',
  'high',
  '波段高点',
  'RSI>65',
  'peak',
  'band_peak',
  '波段低点',
  'RSI<35',
  'trough',
  'band_trough',
  1,
  2.0,
  5.0,
  10.0,
  100.0,
  1,
  '检测RSI>65且涨幅<=0.1%的波段高点信号。做空开仓，同时建议做多平仓。平仓条件：RSI<35且跌幅<=-3%（波段低点）'
);

-- 3. 波段低点策略（做多开仓 / 做空平仓）
INSERT INTO trading_strategies (
  strategy_name,
  strategy_type,
  priority,
  entry_signal_type,
  entry_signal_keyword,
  entry_signal_category,
  entry_signal_template,
  exit_signal_type,
  exit_signal_keyword,
  exit_signal_category,
  exit_signal_template,
  position_splits,
  split_interval_pct,
  stop_loss_pct,
  take_profit_pct,
  max_position_size,
  is_enabled,
  description
) VALUES (
  '波段低点策略',
  'long',
  'high',
  '波段低点',
  'RSI<35',
  'trough',
  'band_trough',
  '波段高点',
  'RSI>65',
  'peak',
  'band_peak',
  1,
  2.0,
  5.0,
  10.0,
  100.0,
  1,
  '检测RSI<35且跌幅<=-3%的波段低点信号。做多开仓，同时建议做空平仓。平仓条件：RSI>65且涨幅<=0.1%（波段高点）'
);

-- 验证插入结果
SELECT '策略库初始化完成' as message, COUNT(*) as strategy_count FROM trading_strategies;
