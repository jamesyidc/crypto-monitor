-- 持仓追踪表
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  position_type TEXT NOT NULL CHECK(position_type IN ('LONG', 'SHORT')), -- 多单或空单
  entry_price REAL NOT NULL,        -- 开仓价格
  entry_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 开仓时间
  quantity REAL DEFAULT 0,          -- 持仓数量（可选）
  stop_loss REAL,                   -- 止损价（可选）
  take_profit REAL,                 -- 止盈价（可选）
  notes TEXT,                       -- 备注
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'CLOSED')), -- 持仓状态
  closed_at DATETIME,               -- 平仓时间
  closed_price REAL,                -- 平仓价格
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 持仓提醒记录表（避免重复提醒）
CREATE TABLE IF NOT EXISTS position_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER NOT NULL,
  alert_type TEXT NOT NULL CHECK(alert_type IN ('LONG_TOP', 'SHORT_BOTTOM')), -- 多单见顶/空单见底
  alert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  kline_time TEXT NOT NULL,         -- 触发预警的K线时间
  current_price REAL NOT NULL,      -- 当前价格
  sar_change_percent REAL NOT NULL, -- SAR变化百分比
  change_percent REAL NOT NULL,     -- 涨跌幅
  rsi_5min REAL NOT NULL,           -- RSI_5分钟
  telegram_sent INTEGER DEFAULT 0,  -- 是否已发送TG
  FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_position_alerts_position_id ON position_alerts(position_id);
CREATE INDEX IF NOT EXISTS idx_position_alerts_time ON position_alerts(alert_time);
