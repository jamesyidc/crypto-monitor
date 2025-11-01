-- Create snapshot_aggregates table for storing aggregate statistics
-- 每个快照时间一条记录，存储聚合统计数据
CREATE TABLE IF NOT EXISTS snapshot_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 快照时间信息
  snapshot_time TEXT NOT NULL UNIQUE,  -- 快照时间戳 (YYYY/MM/DD HH:mm:ss)
  snapshot_date TEXT NOT NULL,         -- 快照日期 (YYYY-MM-DD)
  
  -- 今日重点统计 (4个指标)
  change24h_over10_up INTEGER DEFAULT 0,      -- 24h涨幅>10%的币种数
  change24h_over10_down INTEGER DEFAULT 0,    -- 24h跌幅>10%的币种数
  today_new_high_count INTEGER DEFAULT 0,     -- 今日创新高次数
  today_new_low_count INTEGER DEFAULT 0,      -- 今日创新低次数
  
  -- 本轮统计 (5个指标)
  average_change REAL DEFAULT 0,              -- 本轮平均涨跌幅 (%)
  green_count INTEGER DEFAULT 0,              -- 上涨币种数
  red_count INTEGER DEFAULT 0,                -- 下跌币种数
  green_ratio REAL DEFAULT 0,                 -- 涨色占比 (%)
  surge_count INTEGER DEFAULT 0,              -- 本轮急涨数
  crash_count INTEGER DEFAULT 0,              -- 本轮急跌数
  risk_alert_count INTEGER DEFAULT 0,         -- 风控提示数
  
  -- 急涨急跌统计 (6个指标)
  today_total_surges INTEGER DEFAULT 0,       -- 今日累计急涨次数
  today_total_crashes INTEGER DEFAULT 0,      -- 今日累计急跌次数
  surge_crash_diff INTEGER DEFAULT 0,         -- 差值 (急涨-急跌)
  surge_crash_ratio REAL DEFAULT 0,           -- 比值 (急涨/急跌)
  
  -- 市场趋势分析 (5个指标)
  market_trend TEXT DEFAULT '无序震荡',       -- 市场状态
  market_trend_stars TEXT DEFAULT '',         -- 市场趋势星级
  distance_to_high INTEGER DEFAULT 0,         -- 距离最高涨数
  distance_to_low INTEGER DEFAULT 0,          -- 距离新低数
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_agg_snapshot_date ON snapshot_aggregates(snapshot_date);
CREATE INDEX idx_agg_snapshot_time ON snapshot_aggregates(snapshot_time);
