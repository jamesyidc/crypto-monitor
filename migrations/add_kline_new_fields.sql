-- 添加K线新字段
-- 1. 当天涨幅
ALTER TABLE kline_data ADD COLUMN change_today REAL;

-- 2. 10格比价（10根K线新高新低判断）
-- 创新低=-1, 创新高=1, 既无创新高也无创新低=0
ALTER TABLE kline_data ADD COLUMN bar_10_compare INTEGER DEFAULT 0;

-- 3. 距离48小时高点最大跌幅（百分比）
ALTER TABLE kline_data ADD COLUMN drop_from_48h_high REAL;

-- 4. 距离48小时低点最大涨幅（百分比）
ALTER TABLE kline_data ADD COLUMN rise_from_48h_low REAL;
