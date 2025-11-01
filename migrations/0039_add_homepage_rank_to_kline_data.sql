-- 添加首页排名字段到 kline_data 表
-- 记录币种在首页的排名位置

ALTER TABLE kline_data ADD COLUMN homepage_rank INTEGER;

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_kline_homepage_rank ON kline_data(homepage_rank);
CREATE INDEX IF NOT EXISTS idx_kline_symbol_time_rank ON kline_data(symbol, open_time, homepage_rank);

-- 说明：
-- homepage_rank 记录币种在首页的排名（1=第一名, 2=第二名, etc.）
-- NULL 表示该币种未出现在首页排名中
