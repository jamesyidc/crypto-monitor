-- 重新计算所有币种的10格比价数据

-- 步骤1: 清除所有10格数据
UPDATE kline_data 
SET bar_10_compare = NULL
WHERE timeframe = '5m';

-- 验证清除结果
SELECT 
  '清除后统计' as step,
  COUNT(*) as total_records,
  SUM(CASE WHEN bar_10_compare IS NULL THEN 1 ELSE 0 END) as null_count,
  SUM(CASE WHEN bar_10_compare IS NOT NULL THEN 1 ELSE 0 END) as non_null_count
FROM kline_data 
WHERE timeframe = '5m';
