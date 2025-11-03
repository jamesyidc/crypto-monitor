-- 创建信号历史表
-- 用于存储策略触发的历史信号记录，支持按日期查询

CREATE TABLE IF NOT EXISTS signal_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,              -- 币种符号，如BTC、ETH
  signal_type TEXT NOT NULL,         -- 信号类型：BUY/SELL
  strategy_name TEXT NOT NULL,       -- 策略名称
  price REAL NOT NULL,               -- 触发时的价格
  signal_time TEXT NOT NULL,         -- 信号触发时间（ISO格式）
  timestamp INTEGER NOT NULL,        -- Unix时间戳（毫秒）
  kline_index INTEGER,               -- K线索引
  reason TEXT,                       -- 触发原因描述
  rsi REAL,                          -- RSI指标值
  change_value REAL,                 -- 涨跌幅
  timeframe TEXT DEFAULT '5m',       -- K线周期
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,  -- 记录创建时间
  UNIQUE(symbol, signal_type, timestamp)      -- 防止重复记录
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_signal_history_time ON signal_history(signal_time);
CREATE INDEX IF NOT EXISTS idx_signal_history_symbol ON signal_history(symbol);
CREATE INDEX IF NOT EXISTS idx_signal_history_type ON signal_history(signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_history_timestamp ON signal_history(timestamp);
