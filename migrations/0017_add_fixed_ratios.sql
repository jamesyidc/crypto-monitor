-- 添加固定占比字段到 price_extremes 表
ALTER TABLE price_extremes ADD COLUMN high_ratio REAL DEFAULT 0;
ALTER TABLE price_extremes ADD COLUMN low_ratio REAL DEFAULT 0;

-- 初始化所有现有记录的占比为0
UPDATE price_extremes SET high_ratio = 0, low_ratio = 0 WHERE high_ratio IS NULL OR low_ratio IS NULL;
