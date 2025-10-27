-- 根据截图更新统计数据
-- 日期: 2025-10-27

-- 1. 更新每个币种的当天急涨急跌累计次数 (daily_stats表)
-- 从截图中提取的数据

-- BTC: 急涨20, 急跌5
UPDATE daily_stats SET total_surges = 20, total_crashes = 5 WHERE date = '2025-10-27' AND symbol = 'BTC';

-- ETH: 急涨5, 急跌5
UPDATE daily_stats SET total_surges = 5, total_crashes = 5 WHERE date = '2025-10-27' AND symbol = 'ETH';

-- XRP: 急涨29, 急跌5
UPDATE daily_stats SET total_surges = 29, total_crashes = 5 WHERE date = '2025-10-27' AND symbol = 'XRP';

-- BNB: 急涨21, 急跌6
UPDATE daily_stats SET total_surges = 21, total_crashes = 6 WHERE date = '2025-10-27' AND symbol = 'BNB';

-- SOL: 急涨19, 急跌12
UPDATE daily_stats SET total_surges = 19, total_crashes = 12 WHERE date = '2025-10-27' AND symbol = 'SOL';

-- LTC: 急涨26, 急跌0
UPDATE daily_stats SET total_surges = 26, total_crashes = 0 WHERE date = '2025-10-27' AND symbol = 'LTC';

-- DOGE: 急涨10, 急跌13
UPDATE daily_stats SET total_surges = 10, total_crashes = 13 WHERE date = '2025-10-27' AND symbol = 'DOGE';

-- SUI: 急涨11, 急跌13 (从截图2)
UPDATE daily_stats SET total_surges = 11, total_crashes = 13 WHERE date = '2025-10-27' AND symbol = 'SUI';

-- TRX: 急涨24, 急跌2
UPDATE daily_stats SET total_surges = 24, total_crashes = 2 WHERE date = '2025-10-27' AND symbol = 'TRX';

-- TON: 急涨12, 急跌3
UPDATE daily_stats SET total_surges = 12, total_crashes = 3 WHERE date = '2025-10-27' AND symbol = 'TON';

-- ETC: 急涨14, 急跌4
UPDATE daily_stats SET total_surges = 14, total_crashes = 4 WHERE date = '2025-10-27' AND symbol = 'ETC';

-- BCH: 急涨2, 急跌3
UPDATE daily_stats SET total_surges = 2, total_crashes = 3 WHERE date = '2025-10-27' AND symbol = 'BCH';

-- HBAR: 急涨13, 急跌7
UPDATE daily_stats SET total_surges = 13, total_crashes = 7 WHERE date = '2025-10-27' AND symbol = 'HBAR';

-- XLM: 急涨28, 急跌8
UPDATE daily_stats SET total_surges = 28, total_crashes = 8 WHERE date = '2025-10-27' AND symbol = 'XLM';

-- FIL: 急涨8, 急跌8
UPDATE daily_stats SET total_surges = 8, total_crashes = 8 WHERE date = '2025-10-27' AND symbol = 'FIL';

-- ADA: 急涨16, 急跌6
UPDATE daily_stats SET total_surges = 16, total_crashes = 6 WHERE date = '2025-10-27' AND symbol = 'ADA';

-- LINK: 急涨9, 急跌6
UPDATE daily_stats SET total_surges = 9, total_crashes = 6 WHERE date = '2025-10-27' AND symbol = 'LINK';

-- CRO: 急涨24, 急跌7
UPDATE daily_stats SET total_surges = 24, total_crashes = 7 WHERE date = '2025-10-27' AND symbol = 'CRO';

-- DOT: 急涨23, 急跌4
UPDATE daily_stats SET total_surges = 23, total_crashes = 4 WHERE date = '2025-10-27' AND symbol = 'DOT';

-- OKB: 急涨27, 急跌12
UPDATE daily_stats SET total_surges = 27, total_crashes = 12 WHERE date = '2025-10-27' AND symbol = 'OKB';

-- AAVE: 急涨4, 急跌7
UPDATE daily_stats SET total_surges = 4, total_crashes = 7 WHERE date = '2025-10-27' AND symbol = 'AAVE';

-- UNI: 急涨1, 急跌10
UPDATE daily_stats SET total_surges = 1, total_crashes = 10 WHERE date = '2025-10-27' AND symbol = 'UNI';

-- NEAR: 急涨17, 急跌12
UPDATE daily_stats SET total_surges = 17, total_crashes = 12 WHERE date = '2025-10-27' AND symbol = 'NEAR';

-- APT: 急涨7, 急跌2
UPDATE daily_stats SET total_surges = 7, total_crashes = 2 WHERE date = '2025-10-27' AND symbol = 'APT';

-- CFX: 急涨6, 急跌9
UPDATE daily_stats SET total_surges = 6, total_crashes = 9 WHERE date = '2025-10-27' AND symbol = 'CFX';

-- CRV: 急涨3, 急跌9
UPDATE daily_stats SET total_surges = 3, total_crashes = 9 WHERE date = '2025-10-27' AND symbol = 'CRV';

-- STX: 急涨22, 急跌7
UPDATE daily_stats SET total_surges = 22, total_crashes = 7 WHERE date = '2025-10-27' AND symbol = 'STX';

-- LDO: 急涨15, 急跌6
UPDATE daily_stats SET total_surges = 15, total_crashes = 6 WHERE date = '2025-10-27' AND symbol = 'LDO';

-- TAO: 急涨16, 急跌1
UPDATE daily_stats SET total_surges = 16, total_crashes = 1 WHERE date = '2025-10-27' AND symbol = 'TAO';

-- 2. 更新最新轮次的汇总统计 (round_stats表)
-- 绿色总计: 26 (占比86%), 计次: 10, 急涨: 14, 急跌: 4, 比值: 2.5

UPDATE round_stats 
SET 
  green_count = 26,
  red_count = 3,
  green_ratio = 86.0,
  surge_count = 14,
  crash_count = 4,
  risk_alert_count = 10
WHERE round_time = (SELECT MAX(round_time) FROM round_stats);
