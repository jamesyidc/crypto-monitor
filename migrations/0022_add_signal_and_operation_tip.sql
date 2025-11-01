-- Migration: 在 kline_data 表中添加 信号 和 操作提示 字段
-- Created: 2025-10-29

-- 添加 信号 字段（存储如：空头11、多头05、注意启动等）
ALTER TABLE kline_data ADD COLUMN signal TEXT;

-- 添加 操作提示 字段（存储如：高抛、波段高点等）
ALTER TABLE kline_data ADD COLUMN operation_tip TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_kline_signal ON kline_data(signal);
CREATE INDEX IF NOT EXISTS idx_kline_operation_tip ON kline_data(operation_tip);
