-- 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'number', -- number, boolean, text
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- general, risk, extremes, etc
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认设置值（首页的所有可调参数）
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, display_name, description, category) VALUES
  -- 极端行情阈值
  ('extreme_up_threshold', '4', 'number', '极端上涨阈值(%)', '单轮涨幅达到此值算极端上涨', 'extremes'),
  ('extreme_down_threshold', '-3', 'number', '极端下跌阈值(%)', '单轮跌幅达到此值算极端下跌', 'extremes'),
  
  -- 急涨急跌阈值
  ('surge_threshold', '1', 'number', '急涨阈值(%)', '相对上一轮涨幅达到此值算急涨', 'surge_crash'),
  ('crash_threshold', '-1', 'number', '急跌阈值(%)', '相对上一轮跌幅达到此值算急跌', 'surge_crash'),
  
  -- 风险提示
  ('risk_alert_green_ratio', '0', 'number', '全绿风险比例(%)', '绿色占比达到此值触发风险提示', 'risk'),
  
  -- 创新高/新低计数阈值
  ('new_high_reset_threshold', '3', 'number', '创新高重置阈值', '连续N次未创新高则重置计数', 'extremes'),
  ('new_low_reset_threshold', '3', 'number', '创新低重置阈值', '连续N次未创新低则重置计数', 'extremes'),
  
  -- 技术指标参数
  ('rsi_period', '14', 'number', 'RSI周期', 'RSI指标计算周期', 'indicators'),
  ('boll_period', '20', 'number', 'BOLL周期', '布林带计算周期', 'indicators'),
  ('boll_k', '2', 'number', 'BOLL标准差倍数', '布林带上下轨标准差倍数', 'indicators'),
  
  -- SAR指标参数
  ('sar_af', '0.02', 'number', 'SAR加速因子', 'SAR指标初始加速因子', 'indicators'),
  ('sar_max_af', '0.2', 'number', 'SAR最大加速因子', 'SAR指标最大加速因子', 'indicators'),
  
  -- 自动分析间隔
  ('analysis_interval', '300000', 'number', '分析间隔(毫秒)', '自动价格分析的时间间隔', 'general'),
  ('kline_sync_interval', '900000', 'number', 'K线同步间隔(毫秒)', 'K线数据同步的时间间隔', 'general');

CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
