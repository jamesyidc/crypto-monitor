-- 币种等级历史记录表
-- 用于记录币种达到某个等级的时间，7天后自动失效
CREATE TABLE IF NOT EXISTS coin_priority_level_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  level INTEGER NOT NULL,
  reached_time DATETIME NOT NULL,
  expiry_time DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_level_history_symbol ON coin_priority_level_history(symbol);
CREATE INDEX IF NOT EXISTS idx_level_history_expiry ON coin_priority_level_history(expiry_time);
CREATE INDEX IF NOT EXISTS idx_level_history_level ON coin_priority_level_history(level);
CREATE INDEX IF NOT EXISTS idx_level_history_symbol_level ON coin_priority_level_history(symbol, level);
