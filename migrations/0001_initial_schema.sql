-- 币种配置表
CREATE TABLE IF NOT EXISTS coins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT UNIQUE NOT NULL,
  name TEXT,
  rank_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 价格记录表（每10分钟一条）
CREATE TABLE IF NOT EXISTS price_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  change_1h REAL,
  change_24h REAL,
  change_7d REAL,
  market_cap REAL,
  volume_24h REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- 历史最高最低价格表
CREATE TABLE IF NOT EXISTS price_extremes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT UNIQUE NOT NULL,
  all_time_high REAL NOT NULL,
  all_time_low REAL NOT NULL,
  ath_date DATETIME,
  atl_date DATETIME,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- 涨跌统计表（每轮10分钟的统计）
CREATE TABLE IF NOT EXISTS round_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_time DATETIME NOT NULL,
  green_count INTEGER DEFAULT 0,
  red_count INTEGER DEFAULT 0,
  green_ratio REAL DEFAULT 0,
  extreme_up_count INTEGER DEFAULT 0,
  extreme_down_count INTEGER DEFAULT 0,
  surge_count INTEGER DEFAULT 0,
  crash_count INTEGER DEFAULT 0,
  risk_alert_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 单币涨跌详情表（每轮每个币的详情）
CREATE TABLE IF NOT EXISTS coin_round_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  round_time DATETIME NOT NULL,
  price REAL NOT NULL,
  prev_price REAL,
  change_amount REAL,
  change_percent REAL,
  is_green INTEGER DEFAULT 0,
  is_extreme_up INTEGER DEFAULT 0,
  is_extreme_down INTEGER DEFAULT 0,
  is_surge INTEGER DEFAULT 0,
  is_crash INTEGER DEFAULT 0,
  rank_in_round INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- 日统计表
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  symbol TEXT NOT NULL,
  total_surges INTEGER DEFAULT 0,
  total_crashes INTEGER DEFAULT 0,
  new_high_count INTEGER DEFAULT 0,
  new_low_count INTEGER DEFAULT 0,
  market_trend TEXT,
  trend_strength REAL,
  star_rating INTEGER DEFAULT 0,
  star_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, symbol),
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- 创新高创新低记录表
CREATE TABLE IF NOT EXISTS extreme_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  record_type TEXT NOT NULL,
  price REAL NOT NULL,
  prev_extreme REAL,
  zero_count INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- 币种优先级表
CREATE TABLE IF NOT EXISTS coin_priority (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT UNIQUE NOT NULL,
  level INTEGER NOT NULL,
  low_ratio REAL NOT NULL,
  high_ratio REAL NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (symbol) REFERENCES coins(symbol)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_price_records_symbol ON price_records(symbol);
CREATE INDEX IF NOT EXISTS idx_price_records_timestamp ON price_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_coin_round_details_symbol ON coin_round_details(symbol);
CREATE INDEX IF NOT EXISTS idx_coin_round_details_round_time ON coin_round_details(round_time);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_symbol ON daily_stats(symbol);
CREATE INDEX IF NOT EXISTS idx_extreme_records_symbol ON extreme_records(symbol);
CREATE INDEX IF NOT EXISTS idx_extreme_records_timestamp ON extreme_records(timestamp);
