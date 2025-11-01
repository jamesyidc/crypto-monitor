-- 查询BCH所有数据，找出起涨点
WITH kline_with_change AS (
  SELECT 
    open_time,
    datetime(open_time/1000, 'unixepoch', 'localtime') as time,
    close,
    CASE 
      WHEN LAG(close) OVER (ORDER BY open_time) IS NOT NULL 
      THEN ((close - LAG(close) OVER (ORDER BY open_time)) / LAG(close) OVER (ORDER BY open_time) * 100)
      ELSE 0
    END as change_percent,
    ROW_NUMBER() OVER (ORDER BY open_time) as row_num
  FROM kline_data 
  WHERE symbol = 'BCH' 
    AND timeframe = '5m'
  ORDER BY open_time
),
cumulative_20 AS (
  SELECT 
    k1.time,
    k1.close,
    k1.row_num,
    (
      SELECT SUM(k2.change_percent)
      FROM kline_with_change k2
      WHERE k2.row_num > k1.row_num - 20 AND k2.row_num <= k1.row_num
    ) as cumulative_20
  FROM kline_with_change k1
  WHERE k1.row_num >= 20
)
SELECT 
  time,
  ROUND(close, 2) as close,
  ROUND(cumulative_20, 2) as cumulative_20,
  '起涨点' as mark
FROM cumulative_20
WHERE cumulative_20 > 2
ORDER BY time DESC
LIMIT 20;
