-- Drop old dashboard_snapshots table (was storing JSON blobs)
DROP TABLE IF EXISTS dashboard_snapshots;

-- Create new dashboard_snapshots table with proper structure
-- 每个币种一条记录，存储完整的19个字段
CREATE TABLE dashboard_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 快照时间信息
  snapshot_time TEXT NOT NULL,       -- 快照时间戳 (YYYY/MM/DD HH:mm:ss)
  snapshot_date TEXT NOT NULL,       -- 快照日期 (YYYY-MM-DD)
  snapshot_hour INTEGER NOT NULL,    -- 快照小时 (0-23)
  snapshot_minute INTEGER NOT NULL,  -- 快照分钟 (0-59)
  
  -- 币种信息 (19个字段)
  rank_num INTEGER NOT NULL,              -- 1. 序号
  symbol TEXT NOT NULL,                   -- 2. 币名
  prev_round_change REAL,                 -- 3. 上轮涨跌 (%)
  this_round_price REAL,                  -- 17. 这轮价格
  
  today_surge_count INTEGER DEFAULT 0,    -- 4. 当天急涨次数
  today_crash_count INTEGER DEFAULT 0,    -- 5. 当天急跌次数
  today_change_percent REAL DEFAULT 0,    -- 9. 当天涨幅 (%)
  
  extreme_up_4_count INTEGER DEFAULT 0,   -- 6. +4% 次数
  extreme_down_3_count INTEGER DEFAULT 0, -- 7. -3% 次数
  today_v1_count INTEGER DEFAULT 0,       -- 8. 今天V1次数
  
  update_time TEXT,                       -- 10. 更新时间
  
  all_time_high REAL,                     -- 11. 历史高价
  ath_time TEXT,                          -- ATH时间
  price_drop_from_ath REAL,               -- 12. 现价跌幅 (%)
  
  change_24h REAL DEFAULT 0,              -- 13. 24h涨幅 (%)
  rank_24h INTEGER,                       -- 24h排行
  
  priority_level INTEGER,                 -- 14. 优先级 (1/2/3)
  
  highest_ratio REAL,                     -- 15. 最高占比 (%)
  lowest_ratio REAL,                      -- 16. 最低占比 (%)
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- 联合唯一约束：同一快照时间+币种只能有一条记录
  UNIQUE(snapshot_time, symbol)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_snapshot_date ON dashboard_snapshots(snapshot_date);
CREATE INDEX idx_snapshot_time ON dashboard_snapshots(snapshot_time);
CREATE INDEX idx_snapshot_date_hour ON dashboard_snapshots(snapshot_date, snapshot_hour);
CREATE INDEX idx_snapshot_symbol ON dashboard_snapshots(symbol);
CREATE INDEX idx_snapshot_rank ON dashboard_snapshots(rank_num);
