-- 创建震荡收敛统计表
-- 用于记录每次震荡收敛状态时的布林带宽度，方便统计分析

CREATE TABLE IF NOT EXISTS convergence_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '5m',
  convergence_time TEXT NOT NULL,  -- 震荡收敛发生的时间
  boll_width REAL NOT NULL,         -- 布林带宽度 (上轨 - 下轨)
  boll_width_percent REAL,          -- 布林带宽度百分比 (宽度 / 中轨 * 100)
  boll_upper REAL,                  -- 布林带上轨
  boll_middle REAL,                 -- 布林带中轨
  boll_lower REAL,                  -- 布林带下轨
  close_price REAL,                 -- 收盘价
  rsi_5min REAL,                    -- 5分钟RSI
  sar_direction TEXT,               -- SAR方向
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_convergence_symbol ON convergence_stats(symbol);
CREATE INDEX IF NOT EXISTS idx_convergence_time ON convergence_stats(convergence_time);
CREATE INDEX IF NOT EXISTS idx_convergence_symbol_time ON convergence_stats(symbol, convergence_time);

-- 创建唯一索引，避免同一时间点重复记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_convergence_unique ON convergence_stats(symbol, timeframe, convergence_time);
