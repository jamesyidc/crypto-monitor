-- 修复 daily_stats 中的创新高低次数
-- 清空今天的创新高低次数（这些是昨天刚过0点时的旧数据）
-- 使统计与 extreme_records 表的时间逻辑保持一致（从北京时间1:00开始算今天）

UPDATE daily_stats 
SET new_high_count = 0, new_low_count = 0 
WHERE date = date('now', 'localtime');

-- 验证结果
SELECT 
  date,
  SUM(new_high_count) as total_new_highs,
  SUM(new_low_count) as total_new_lows,
  SUM(total_surges) as total_surges,
  SUM(total_crashes) as total_crashes
FROM daily_stats 
WHERE date = date('now', 'localtime')
GROUP BY date;
