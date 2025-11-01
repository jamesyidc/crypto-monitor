-- 清理间隔<5分钟的轮次数据
-- 策略：删除相邻两轮中间隔较短的那一轮

-- 1. 创建临时表，标记需要删除的轮次
CREATE TEMP TABLE rounds_to_delete AS
WITH round_intervals AS (
  SELECT 
    round_time,
    LAG(round_time) OVER (ORDER BY round_time) as prev_round_time,
    CAST((julianday(round_time) - julianday(LAG(round_time) OVER (ORDER BY round_time))) * 24 * 60 AS REAL) as minutes_diff
  FROM round_stats
  ORDER BY round_time
)
SELECT round_time
FROM round_intervals 
WHERE minutes_diff < 5 AND prev_round_time IS NOT NULL;

-- 2. 删除 round_stats 表中的短间隔轮次
DELETE FROM round_stats 
WHERE round_time IN (SELECT round_time FROM rounds_to_delete);

-- 3. 删除 coin_round_details 表中对应的记录
DELETE FROM coin_round_details 
WHERE round_time IN (SELECT round_time FROM rounds_to_delete);

-- 4. 查看清理结果
SELECT 
  (SELECT COUNT(*) FROM rounds_to_delete) as deleted_rounds,
  (SELECT COUNT(*) FROM round_stats) as remaining_rounds;
