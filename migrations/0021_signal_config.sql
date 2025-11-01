-- 信号发送配置表
-- 用于配置哪些信号类型可以发送到Telegram

CREATE TABLE IF NOT EXISTS signal_send_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_category TEXT NOT NULL, -- 'trading' 或 'alert'
  signal_type TEXT NOT NULL,     -- 对于trading: 'BUY'/'SELL', 对于alert: 触发条件类型
  enabled INTEGER DEFAULT 1,      -- 1=启用发送, 0=禁用发送
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(signal_category, signal_type)
);

-- 插入默认配置（所有类型默认启用）
-- 买卖点信号配置
INSERT OR IGNORE INTO signal_send_config (signal_category, signal_type, enabled) VALUES ('trading', 'BUY', 1);
INSERT OR IGNORE INTO signal_send_config (signal_category, signal_type, enabled) VALUES ('trading', 'SELL', 1);

-- 预警信号配置
INSERT OR IGNORE INTO signal_send_config (signal_category, signal_type, enabled) VALUES ('alert', '成交量≥V1', 1);
INSERT OR IGNORE INTO signal_send_config (signal_category, signal_type, enabled) VALUES ('alert', '成交量≥V2', 1);
INSERT OR IGNORE INTO signal_send_config (signal_category, signal_type, enabled) VALUES ('alert', '涨幅≥1%', 1);
INSERT OR IGNORE INTO signal_send_config (signal_category, signal_type, enabled) VALUES ('alert', '跌幅≤-1%', 1);
INSERT OR IGNORE INTO signal_send_config (signal_category, signal_type, enabled) VALUES ('alert', '震荡≥1%', 1);

-- 添加kline_time字段到trading_signals表（K线原始时间）
-- 用于判断信号所属的5分钟K线区间
ALTER TABLE trading_signals ADD COLUMN kline_time TEXT;

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_trading_signals_kline_time ON trading_signals(symbol, kline_time);
CREATE INDEX IF NOT EXISTS idx_trading_signals_telegram ON trading_signals(telegram_sent, created_at);

-- 创建信号发送记录表（用于记录每个5分钟K线区间的发送情况）
CREATE TABLE IF NOT EXISTS signal_send_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  kline_time TEXT NOT NULL,         -- K线时间（5分钟K线的开始时间）
  signal_category TEXT NOT NULL,    -- 'trading' 或 'alert'
  signal_id INTEGER NOT NULL,       -- 对应的信号ID
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, kline_time, signal_category)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_signal_send_log_symbol_time ON signal_send_log(symbol, kline_time);
