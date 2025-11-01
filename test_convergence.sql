-- 查询BCH今天的K线数据，并计算累计20根涨跌幅
WITH kline_with_change AS (
  SELECT 
    open_time,
    datetime(open_time/1000, 'unixepoch', 'localtime') as time,
    open,
    high,
    low,
    close,
    -- 计算涨跌幅
    CASE 
      WHEN LAG(close) OVER (ORDER BY open_time) IS NOT NULL 
      THEN ((close - LAG(close) OVER (ORDER BY open_time)) / LAG(close) OVER (ORDER BY open_time) * 100)
      ELSE 0
    END as change_percent,
    ROW_NUMBER() OVER (ORDER BY open_time) as row_num
  FROM kline_data 
  WHERE symbol = 'BCH' 
    AND timeframe = '5m'
    AND datetime(open_time/1000, 'unixepoch', 'localtime') >= datetime('now', 'localtime', 'start of day')
  ORDER BY open_time
),
cumulative_20 AS (
  SELECT 
    k1.time,
    k1.close,
    k1.change_percent,
    k1.row_num,
    -- 计算累计20根K线的涨跌幅
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
  ROUND(change_percent, 2) as change_pct,
  ROUND(cumulative_20, 2) as cumulative_20,
  CASE 
    WHEN cumulative_20 > 2 THEN '起涨点'
    WHEN cumulative_20 < -3 THEN '起跌点'
    ELSE ''
  END as mark
FROM cumulative_20
ORDER BY time DESC
LIMIT 30;
