-- 导入急涨急跌数据（覆盖原值）
-- 更新 daily_stats 表中的 total_surges 和 total_crashes 字段
-- 使用今天的日期

-- ETH: 急涨0, 急跌1
UPDATE daily_stats 
SET total_surges = 0, total_crashes = 1 
WHERE symbol = 'ETH' AND date = date('now', 'localtime');

-- XRP: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'XRP' AND date = date('now', 'localtime');

-- BNB: 急涨0, 急跌2
UPDATE daily_stats SET total_surges = 0, total_crashes = 2 WHERE symbol = 'BNB' AND date = date('now', 'localtime');

-- SOL: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'SOL' AND date = date('now', 'localtime');

-- SUI: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'SUI' AND date = date('now', 'localtime');

-- BCH: 急涨1, 急跌0
UPDATE daily_stats SET total_surges = 1, total_crashes = 0 WHERE symbol = 'BCH' AND date = date('now', 'localtime');

-- HBAR: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'HBAR' AND date = date('now', 'localtime');

-- FIL: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'FIL' AND date = date('now', 'localtime');

-- ADA: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'ADA' AND date = date('now', 'localtime');

-- LINK: 急涨1, 急跌2
UPDATE daily_stats SET total_surges = 1, total_crashes = 2 WHERE symbol = 'LINK' AND date = date('now', 'localtime');

-- CRO: 急涨0, 急跌4
UPDATE daily_stats SET total_surges = 0, total_crashes = 4 WHERE symbol = 'CRO' AND date = date('now', 'localtime');

-- AAVE: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'AAVE' AND date = date('now', 'localtime');

-- UNI: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'UNI' AND date = date('now', 'localtime');

-- NEAR: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'NEAR' AND date = date('now', 'localtime');

-- APT: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'APT' AND date = date('now', 'localtime');

-- CFX: 急涨0, 急跌1
UPDATE daily_stats SET total_surges = 0, total_crashes = 1 WHERE symbol = 'CFX' AND date = date('now', 'localtime');

-- LDO: 急涨0, 急跌2
UPDATE daily_stats SET total_surges = 0, total_crashes = 2 WHERE symbol = 'LDO' AND date = date('now', 'localtime');

-- TAO: 急涨2, 急跌3
UPDATE daily_stats SET total_surges = 2, total_crashes = 3 WHERE symbol = 'TAO' AND date = date('now', 'localtime');

-- 验证导入结果
SELECT symbol, total_surges, total_crashes, date
FROM daily_stats 
WHERE date = date('now', 'localtime')
AND symbol IN ('ETH', 'XRP', 'BNB', 'SOL', 'SUI', 'BCH', 'HBAR', 'FIL', 'ADA', 'LINK', 'CRO', 'AAVE', 'UNI', 'NEAR', 'APT', 'CFX', 'LDO', 'TAO')
ORDER BY symbol;
