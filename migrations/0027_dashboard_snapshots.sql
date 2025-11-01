-- 创建首页数据快照表（每10分钟保存一次完整首页数据）
CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_time TEXT NOT NULL,  -- 快照时间（ISO格式）
  snapshot_date TEXT NOT NULL,  -- 快照日期（YYYY-MM-DD）
  snapshot_hour INTEGER NOT NULL,  -- 快照小时（0-23）
  snapshot_minute INTEGER NOT NULL,  -- 快照分钟（0-59）
  
  -- 存储完整的首页JSON数据
  dashboard_data TEXT NOT NULL,  -- 完整的dashboard API返回数据（JSON）
  compare_data TEXT NOT NULL,    -- 完整的compare API返回数据（JSON）
  
  -- 索引字段（用于快速查询）
  risk_alert_count INTEGER DEFAULT 0,
  average_change REAL DEFAULT 0,
  surge_count INTEGER DEFAULT 0,
  crash_count INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(snapshot_time)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON dashboard_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_time ON dashboard_snapshots(snapshot_time);
CREATE INDEX IF NOT EXISTS idx_snapshots_date_hour ON dashboard_snapshots(snapshot_date, snapshot_hour);
