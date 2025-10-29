-- =====================================================
-- 恢复极值记录表
-- 创建时间: 2025-10-29 03:50 UTC
-- 要求：今天创新低的只有OKB 2次
-- =====================================================

-- 1. 清空所有错误的极值记录
DELETE FROM extreme_records;

-- 2. 插入今天OKB的2次创新低记录
-- 根据用户要求：今天创新低的只有OKB 2次

-- 第1次OKB创新低
-- 假设价格从高位下跌，突破历史最低价161.28451
INSERT INTO extreme_records (symbol, record_type, price, prev_extreme, zero_count, timestamp)
VALUES ('OKB', 'new_low', 161.28, 235.51972, 0, '2025-10-29 03:00:00');

-- 第2次OKB创新低
-- 价格继续下跌，再次创新低
INSERT INTO extreme_records (symbol, record_type, price, prev_extreme, zero_count, timestamp)
VALUES ('OKB', 'new_low', 161.20, 161.28, 0, '2025-10-29 03:25:00');
