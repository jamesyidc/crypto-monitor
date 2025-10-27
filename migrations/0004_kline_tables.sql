-- K线数据表（历史K线）
CREATE TABLE IF NOT EXISTS kline_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  open_time INTEGER NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  close_time INTEGER,
  quote_volume REAL,
  trades_count INTEGER,
  taker_buy_volume REAL,
  taker_buy_quote_volume REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, timeframe, open_time),
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- OKX 币种配置表（V1/V2 参数）
CREATE TABLE IF NOT EXISTS okx_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT UNIQUE NOT NULL,
  okx_symbol TEXT NOT NULL,
  v1 INTEGER NOT NULL,
  v2 INTEGER NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- K线数据索引
CREATE INDEX IF NOT EXISTS idx_kline_symbol ON kline_data(symbol);
CREATE INDEX IF NOT EXISTS idx_kline_timeframe ON kline_data(timeframe);
CREATE INDEX IF NOT EXISTS idx_kline_open_time ON kline_data(open_time);
CREATE INDEX IF NOT EXISTS idx_kline_symbol_timeframe ON kline_data(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_kline_symbol_time ON kline_data(symbol, open_time);
