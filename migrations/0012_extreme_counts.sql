-- 添加极端行情累计次数字段
ALTER TABLE price_extremes ADD COLUMN extreme_up_count INTEGER DEFAULT 0;
ALTER TABLE price_extremes ADD COLUMN extreme_down_count INTEGER DEFAULT 0;
