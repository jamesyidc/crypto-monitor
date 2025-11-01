-- 添加 channel_state 字段到 kline_data 表
ALTER TABLE kline_data ADD COLUMN channel_state TEXT;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_kline_channel_state ON kline_data(channel_state);
