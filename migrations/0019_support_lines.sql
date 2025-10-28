-- 支撑线低吸策略表
-- 用于等级2及以上币种在非单边下跌市场中的低吸策略

CREATE TABLE IF NOT EXISTS support_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,                      -- 币种符号
  support_price REAL NOT NULL,               -- 支撑线价格
  date TEXT NOT NULL,                        -- 设置日期 (YYYY-MM-DD, 北京时间)
  notes TEXT,                                -- 备注说明
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, date)                       -- 同一币种同一天只能有一条支撑线
);

-- 索引优化查询
CREATE INDEX IF NOT EXISTS idx_support_lines_symbol ON support_lines(symbol);
CREATE INDEX IF NOT EXISTS idx_support_lines_date ON support_lines(date);
CREATE INDEX IF NOT EXISTS idx_support_lines_symbol_date ON support_lines(symbol, date);

-- 插入说明记录（不插入实际数据，仅作为文档）
-- 支撑线低吸策略规则：
-- 1. 只对等级2及以上的币种生效（从coin_priority表查询level <= 2）
-- 2. 只在非单边下跌市场中生效（检查市场策略 != "单边主跌"）
-- 3. 当价格接近支撑线（±1%范围内）时，提示低吸机会
-- 4. 建议止盈：10-15%
-- 5. 每日0点自动清零（通过date字段和定时任务实现）
