-- 买卖点信号表
CREATE TABLE IF NOT EXISTS trading_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  signal_time TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'BUY' 或 'SELL'
  price REAL NOT NULL,
  reason TEXT,
  strength INTEGER, -- 信号强度 0-100
  details TEXT, -- JSON格式的详细信息
  keep_bars INTEGER, -- 观察期K线数量
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_time ON trading_signals(signal_time);
CREATE INDEX IF NOT EXISTS idx_trading_signals_type ON trading_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created ON trading_signals(created_at);

-- 预警信号表
CREATE TABLE IF NOT EXISTS alert_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  alert_time TEXT NOT NULL,
  kline_index INTEGER,
  triggers TEXT NOT NULL, -- JSON数组：触发条件列表
  volume REAL,
  volume_level TEXT, -- 'V1+', 'V2+', 'Normal'
  change_percent REAL,
  volatility REAL,
  rsi_5min REAL,
  sar_change_percent REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_signals_symbol ON alert_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_alert_signals_time ON alert_signals(alert_time);
CREATE INDEX IF NOT EXISTS idx_alert_signals_created ON alert_signals(created_at);
