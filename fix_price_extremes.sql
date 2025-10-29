-- 清理错误的极值记录（2025-10-29 03:02:55这批数据）
DELETE FROM extreme_records WHERE timestamp = '2025-10-29 03:02:55';

-- 修正price_extremes数据
-- 数据格式说明：第2列是当前价，第4列才是历史最高价
-- OKB: 当前235.52 → 历史高161.28 (数据颠倒了！应该是 历史高235.52, 历史低161.28)
-- 重新分析：看比例 69.07% 和 100.86%
-- 69.07% = 161.28/235.52，说明当前价在历史高价的69%位置 → 历史高是235.52
-- 100.86% = 当前价/历史低价，说明当前价略高于历史低价

-- 正确理解：
-- 列1: 币种
-- 列2: 当前价格
-- 列3: high_count
-- 列4: 历史最高价 (错！应该是历史最低价)
-- 列5: low_count
-- 列6: 空
-- 列7: highRatio (当前价/历史高价的百分比)
-- 列8: lowRatio (当前价/历史低价的百分比)

-- 重新分析OKB: 当前235.52, 比例69.07%, 100.86%
-- 如果69.07% = 当前/历史高，则历史高 = 235.52/0.6907 = 341.0
-- 如果100.86% = 当前/历史低，则历史低 = 235.52/1.0086 = 233.5

-- 等等，看BTC数据：当前125370, 历史106787, 比例89.65%, 105.25%
-- 89.65% = 106787/125370 ≈ 85.2% (不对)
-- 89.65% = 当前/某个值，某个值 = 125370/0.8965 = 139,855 → 这才是历史最高价！

-- 正确理解：
-- highRatio = 当前价格 / 真实历史最高价
-- lowRatio = 当前价格 / 真实历史最低价
-- 表格中的"历史最高价"列实际是错误的，需要通过比例反推

-- OKB: 当前235.52, highRatio=69.07%, lowRatio=100.86%
-- 真实历史高 = 235.52 / 0.6907 = 341.02
-- 真实历史低 = 235.52 / 1.0086 = 233.53

UPDATE price_extremes SET all_time_high = 341.02, all_time_low = 233.53 WHERE symbol = 'OKB';

-- DOT: 当前4.88, 62.43%, 104.9%
UPDATE price_extremes SET all_time_high = 7.82, all_time_low = 4.65 WHERE symbol = 'DOT';

-- LINK: 当前26.37, 67.41%, 106.95%
UPDATE price_extremes SET all_time_high = 39.12, all_time_low = 24.66 WHERE symbol = 'LINK';

-- ADA: 当前0.954, 67.32%, 102.48%
UPDATE price_extremes SET all_time_high = 1.417, all_time_low = 0.931 WHERE symbol = 'ADA';

-- FIL: 当前2.66, 58.52%, 105.1%
UPDATE price_extremes SET all_time_high = 4.54, all_time_low = 2.53 WHERE symbol = 'FIL';

-- XLM: 当前0.418, 75.87%, 102.59%
UPDATE price_extremes SET all_time_high = 0.551, all_time_low = 0.407 WHERE symbol = 'XLM';

-- HBAR: 当前0.255, 75.41%, 117.57%
UPDATE price_extremes SET all_time_high = 0.338, all_time_low = 0.217 WHERE symbol = 'HBAR';

-- BCH: 当前650.82, 86.32%, 122.37%
UPDATE price_extremes SET all_time_high = 753.92, all_time_low = 531.82 WHERE symbol = 'BCH';

-- ETC: 当前24.32, 65.28%, 126.5%
UPDATE price_extremes SET all_time_high = 37.26, all_time_low = 19.23 WHERE symbol = 'ETC';

-- TON: 当前3.39, 66.87%, 106.96%
UPDATE price_extremes SET all_time_high = 5.07, all_time_low = 3.17 WHERE symbol = 'TON';

-- TRX: 当前0.366, 80.64%, 100.59%
UPDATE price_extremes SET all_time_high = 0.454, all_time_low = 0.364 WHERE symbol = 'TRX';

-- SUI: 当前3.98, 62.64%, 103.27%
UPDATE price_extremes SET all_time_high = 6.35, all_time_low = 3.85 WHERE symbol = 'SUI';

-- DOGE: 当前0.307, 62.9%, 103.31%
UPDATE price_extremes SET all_time_high = 0.488, all_time_low = 0.297 WHERE symbol = 'DOGE';

-- SOL: 当前253.36, 76.45%, 105.37%
UPDATE price_extremes SET all_time_high = 331.38, all_time_low = 240.44 WHERE symbol = 'SOL';

-- LTC: 当前135.57, 71.11%, 105.56%
UPDATE price_extremes SET all_time_high = 190.65, all_time_low = 128.46 WHERE symbol = 'LTC';

-- BNB: 当前1377.48, 80.06%, 134.37%
UPDATE price_extremes SET all_time_high = 1720.66, all_time_low = 1025.25 WHERE symbol = 'BNB';

-- XRP: 当前3.19, 81.66%, 111.73%
UPDATE price_extremes SET all_time_high = 3.91, all_time_low = 2.86 WHERE symbol = 'XRP';

-- ETH: 当前4830, 82.62%, 103.98%
UPDATE price_extremes SET all_time_high = 5845, all_time_low = 4645 WHERE symbol = 'ETH';

-- BTC: 当前125370, 89.65%, 105.25%
UPDATE price_extremes SET all_time_high = 139855, all_time_low = 119121 WHERE symbol = 'BTC';

-- CRO: 当前0.386, 39.11%, 106.16%
UPDATE price_extremes SET all_time_high = 0.987, all_time_low = 0.364 WHERE symbol = 'CRO';

-- CFX: 当前0.188, 58.29%, 101.63%
UPDATE price_extremes SET all_time_high = 0.322, all_time_low = 0.185 WHERE symbol = 'CFX';

-- CRV: 当前0.863, 61.76%, 102.6%
UPDATE price_extremes SET all_time_high = 1.397, all_time_low = 0.841 WHERE symbol = 'CRV';

-- APT: 当前5.49, 60.85%, 106.36%
UPDATE price_extremes SET all_time_high = 9.02, all_time_low = 5.16 WHERE symbol = 'APT';

-- NEAR: 当前3.32, 67.1%, 103.73%
UPDATE price_extremes SET all_time_high = 4.95, all_time_low = 3.20 WHERE symbol = 'NEAR';

-- UNI: 当前10.37, 60.9%, 105.43%
UPDATE price_extremes SET all_time_high = 17.03, all_time_low = 9.83 WHERE symbol = 'UNI';

-- AAVE: 当前322.65, 70.8%, 107.01%
UPDATE price_extremes SET all_time_high = 455.58, all_time_low = 301.48 WHERE symbol = 'AAVE';

-- STX: 当前0.702, 62.95%, 105.06%
UPDATE price_extremes SET all_time_high = 1.115, all_time_low = 0.668 WHERE symbol = 'STX';

-- TAO: 当前476.82, 89.06%, 144.88%
UPDATE price_extremes SET all_time_high = 535.39, all_time_low = 329.14 WHERE symbol = 'TAO';

-- LDO: 当前1.35, 66.56%, 104.44%
UPDATE price_extremes SET all_time_high = 2.04, all_time_low = 1.30 WHERE symbol = 'LDO';
