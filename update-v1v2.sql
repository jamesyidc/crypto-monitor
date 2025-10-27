-- 批量更新所有币种的V1/V2标注（严格按照用户提供的阈值）

-- BTC
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 200000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 100000 THEN 1 ELSE 0 END WHERE symbol = 'BTC';

-- ETH
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 1300000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 500000 THEN 1 ELSE 0 END WHERE symbol = 'ETH';

-- XRP
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 200000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 87000 THEN 1 ELSE 0 END WHERE symbol = 'XRP';

-- SOL
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 351620 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 246380 THEN 1 ELSE 0 END WHERE symbol = 'SOL';

-- BNB
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 2388300 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 1737500 THEN 1 ELSE 0 END WHERE symbol = 'BNB';

-- LTC
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 50000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 15000 THEN 1 ELSE 0 END WHERE symbol = 'LTC';

-- DOGE
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 150000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 60000 THEN 1 ELSE 0 END WHERE symbol = 'DOGE';

-- SUI
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 2000000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 800000 THEN 1 ELSE 0 END WHERE symbol = 'SUI';

-- TRX
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 13280 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 6022 THEN 1 ELSE 0 END WHERE symbol = 'TRX';

-- TON
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 350000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 200000 THEN 1 ELSE 0 END WHERE symbol = 'TON';

-- ETC
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 12000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 2000 THEN 1 ELSE 0 END WHERE symbol = 'ETC';

-- BCH
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 103500 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 50000 THEN 1 ELSE 0 END WHERE symbol = 'BCH';

-- HBAR
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 103500 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 40000 THEN 1 ELSE 0 END WHERE symbol = 'HBAR';

-- XLM
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 103500 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 30000 THEN 1 ELSE 0 END WHERE symbol = 'XLM';

-- FIL
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 5003500 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 3700000 THEN 1 ELSE 0 END WHERE symbol = 'FIL';

-- ADA
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 67210 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 44230 THEN 1 ELSE 0 END WHERE symbol = 'ADA';

-- LINK
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 280000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 200000 THEN 1 ELSE 0 END WHERE symbol = 'LINK';

-- CRO
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 100000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 40000 THEN 1 ELSE 0 END WHERE symbol = 'CRO';

-- DOT
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 300000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 250000 THEN 1 ELSE 0 END WHERE symbol = 'DOT';

-- UNI
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 140000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 100000 THEN 1 ELSE 0 END WHERE symbol = 'UNI';

-- NEAR
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 100000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 50000 THEN 1 ELSE 0 END WHERE symbol = 'NEAR';

-- APT
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 300000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 200000 THEN 1 ELSE 0 END WHERE symbol = 'APT';

-- CFX
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 300000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 250000 THEN 1 ELSE 0 END WHERE symbol = 'CFX';

-- CRV
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 1500000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 1000000 THEN 1 ELSE 0 END WHERE symbol = 'CRV';

-- STX
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 50000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 30000 THEN 1 ELSE 0 END WHERE symbol = 'STX';

-- LDO
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 1000000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 600000 THEN 1 ELSE 0 END WHERE symbol = 'LDO';

-- TAO
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 300000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 180000 THEN 1 ELSE 0 END WHERE symbol = 'TAO';

-- AAVE
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 100000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 50000 THEN 1 ELSE 0 END WHERE symbol = 'AAVE';

-- OKB
UPDATE kline_data SET volume_v1 = CASE WHEN volume > 100000 THEN 1 ELSE 0 END, volume_v2 = CASE WHEN volume > 50000 THEN 1 ELSE 0 END WHERE symbol = 'OKB';

-- 查询更新结果统计
SELECT '=== V1/V2 标注统计 ===' as result;
SELECT symbol, 
       COUNT(*) as total_klines,
       SUM(CASE WHEN volume_v1 = 1 THEN 1 ELSE 0 END) as v1_count,
       SUM(CASE WHEN volume_v2 = 1 THEN 1 ELSE 0 END) as v2_count,
       ROUND(SUM(CASE WHEN volume_v1 = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as v1_percent,
       ROUND(SUM(CASE WHEN volume_v2 = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as v2_percent
FROM kline_data 
GROUP BY symbol 
ORDER BY symbol;
