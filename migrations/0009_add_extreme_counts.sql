-- 添加计次字段到 price_extremes 表
ALTER TABLE price_extremes ADD COLUMN high_count INTEGER DEFAULT 0;
ALTER TABLE price_extremes ADD COLUMN low_count INTEGER DEFAULT 0;

-- 初始化所有现有记录的计次为0
UPDATE price_extremes SET high_count = 0, low_count = 0 WHERE high_count IS NULL OR low_count IS NULL;
