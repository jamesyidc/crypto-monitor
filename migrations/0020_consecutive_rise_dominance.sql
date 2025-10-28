-- 连续上涨占优统计表
-- 记录每个币种连续上涨占比大于下跌占比的K线数量

CREATE TABLE IF NOT EXISTS consecutive_rise_dominance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,           -- 当前连续K线数
  max_streak INTEGER DEFAULT 0,               -- 历史最大连续K线数
  max_streak_start_time TEXT,                 -- 最大连续开始时间
  max_streak_end_time TEXT,                   -- 最大连续结束时间
  last_check_time TEXT,                       -- 最后检查时间（round_time）
  last_high_ratio REAL,                       -- 最后占比上涨
  last_low_ratio REAL,                        -- 最后占比下跌
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consecutive_rise_symbol ON consecutive_rise_dominance(symbol);
CREATE INDEX IF NOT EXISTS idx_consecutive_rise_max_streak ON consecutive_rise_dominance(max_streak DESC);
CREATE INDEX IF NOT EXISTS idx_consecutive_rise_current_streak ON consecutive_rise_dominance(current_streak DESC);
