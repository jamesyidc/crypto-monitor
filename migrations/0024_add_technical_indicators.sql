-- 添加技术指标字段到 kline_data 表
-- 这些字段将持久化存储，不再动态计算

-- SAR 指标相关
ALTER TABLE kline_data ADD COLUMN sar REAL;
ALTER TABLE kline_data ADD COLUMN sar_change REAL;
ALTER TABLE kline_data ADD COLUMN sar_change_percent REAL;

-- RSI 指标相关
ALTER TABLE kline_data ADD COLUMN rsi_5min REAL;
ALTER TABLE kline_data ADD COLUMN rsi_1h REAL;

-- 涨跌幅相关
ALTER TABLE kline_data ADD COLUMN change_percent TEXT;
ALTER TABLE kline_data ADD COLUMN change_diff REAL;

-- BOLL 指标相关
ALTER TABLE kline_data ADD COLUMN boll_mb REAL;
ALTER TABLE kline_data ADD COLUMN boll_ub REAL;
ALTER TABLE kline_data ADD COLUMN boll_lb REAL;
ALTER TABLE kline_data ADD COLUMN boll_sar_diff REAL;
ALTER TABLE kline_data ADD COLUMN boll_angle_mb REAL;
ALTER TABLE kline_data ADD COLUMN boll_width_change REAL;

-- 通道衰竭比率
ALTER TABLE kline_data ADD COLUMN up_channel_exhaustion_ratio REAL;
ALTER TABLE kline_data ADD COLUMN down_channel_exhaustion_ratio REAL;

-- 成交量等级
ALTER TABLE kline_data ADD COLUMN volume_level TEXT;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_kline_sar ON kline_data(sar);
CREATE INDEX IF NOT EXISTS idx_kline_rsi_5min ON kline_data(rsi_5min);
CREATE INDEX IF NOT EXISTS idx_kline_volume_level ON kline_data(volume_level);
