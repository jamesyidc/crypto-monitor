-- 添加 volume_v1 和 volume_v2 列到 kline_data 表
-- volume_v1: 成交量是否超过V1阈值 (0=否, 1=是)
-- volume_v2: 成交量是否超过V2阈值 (0=否, 1=是)

ALTER TABLE kline_data ADD COLUMN volume_v1 INTEGER DEFAULT 0;
ALTER TABLE kline_data ADD COLUMN volume_v2 INTEGER DEFAULT 0;

-- 创建特征库表用于存储起涨/起跌特征分析结果
CREATE TABLE IF NOT EXISTS pattern_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT NOT NULL, -- 'surge' 起涨, 'crash' 起跌
  symbol TEXT NOT NULL,
  start_time INTEGER NOT NULL, -- K线起始时间戳
  end_time INTEGER NOT NULL,   -- K线结束时间戳
  total_change REAL NOT NULL,  -- 总涨跌幅 (%)
  kline_count INTEGER NOT NULL, -- K线数量
  
  -- 特征数据（JSON格式存储详细特征）
  features TEXT NOT NULL,
  
  -- 关键特征摘要
  volume_surge INTEGER DEFAULT 0,  -- 是否出现成交量激增
  price_breakout INTEGER DEFAULT 0, -- 是否突破关键价位
  continuous_direction INTEGER DEFAULT 0, -- 是否连续同向
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(symbol, start_time, pattern_type)
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_pattern_features_symbol ON pattern_features(symbol);
CREATE INDEX IF NOT EXISTS idx_pattern_features_type ON pattern_features(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_features_time ON pattern_features(start_time);
