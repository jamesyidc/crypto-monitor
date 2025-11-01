-- 每日风险提示累计表
CREATE TABLE IF NOT EXISTS daily_risk_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  risk_alert_cumulative INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_risk_alerts_date ON daily_risk_alerts(date);
