-- 创建风险提示事件详细记录表（记录每次绿色占比=0%的时间）
CREATE TABLE IF NOT EXISTS risk_alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_time DATETIME NOT NULL,
  round_time DATETIME NOT NULL,
  green_ratio REAL DEFAULT 0,
  total_coins INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_risk_alert_events_time ON risk_alert_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alert_events_round ON risk_alert_events(round_time);

-- 修改daily_risk_alerts表，添加最后一次事件时间字段
ALTER TABLE daily_risk_alerts ADD COLUMN last_event_time DATETIME;
