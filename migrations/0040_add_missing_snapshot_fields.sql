-- Migration: 添加快照表缺失的字段
-- Created: 2025-11-03
-- Purpose: 添加与前端kline_v2.html对应的完整字段

-- 添加缺失的字段到 kline_snapshot_latest 表
ALTER TABLE kline_snapshot_latest ADD COLUMN change_today REAL;        -- 当天涨跌幅
ALTER TABLE kline_snapshot_latest ADD COLUMN bar_10_compare INTEGER;   -- 10格比价 (-1创新低, 0无变化, 1创新高)
ALTER TABLE kline_snapshot_latest ADD COLUMN high_48h REAL;            -- 48小时最高价
ALTER TABLE kline_snapshot_latest ADD COLUMN low_48h REAL;             -- 48小时最低价
ALTER TABLE kline_snapshot_latest ADD COLUMN sar_change REAL;          -- SAR变化值
ALTER TABLE kline_snapshot_latest ADD COLUMN change_diff REAL;         -- 涨跌差值

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_kline_snapshot_bar_compare 
    ON kline_snapshot_latest(bar_10_compare) 
    WHERE bar_10_compare IS NOT NULL;
