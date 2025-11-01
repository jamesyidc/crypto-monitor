-- 添加 ATL（历史最低价）相关字段到 coin_priority 表
-- 用于计算距离历史最低价的涨幅空间

ALTER TABLE coin_priority ADD COLUMN all_time_low REAL;
ALTER TABLE coin_priority ADD COLUMN atl_time DATETIME;
ALTER TABLE coin_priority ADD COLUMN price_rise_from_atl REAL;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_coin_priority_atl ON coin_priority(all_time_low);
