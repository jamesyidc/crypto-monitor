-- 更新所有币种的 V1/V2 标记

-- BTC
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='BTC' AND volume > 200000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='BTC' AND volume > 100000;

-- ETH
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='ETH' AND volume > 1300000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='ETH' AND volume > 500000;

-- XRP
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='XRP' AND volume > 200000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='XRP' AND volume > 87000;

-- SOL
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='SOL' AND volume > 351620;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='SOL' AND volume > 246380;

-- BNB
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='BNB' AND volume > 2388300;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='BNB' AND volume > 1737500;

-- LTC
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='LTC' AND volume > 50000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='LTC' AND volume > 15000;

-- DOGE
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='DOGE' AND volume > 150000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='DOGE' AND volume > 60000;

-- SUI
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='SUI' AND volume > 2000000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='SUI' AND volume > 800000;

-- TRX
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='TRX' AND volume > 13280;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='TRX' AND volume > 6022;

-- TON
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='TON' AND volume > 350000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='TON' AND volume > 200000;

-- ETC
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='ETC' AND volume > 12000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='ETC' AND volume > 2000;

-- BCH
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='BCH' AND volume > 103500;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='BCH' AND volume > 50000;

-- HBAR
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='HBAR' AND volume > 103500;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='HBAR' AND volume > 40000;

-- XLM
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='XLM' AND volume > 103500;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='XLM' AND volume > 30000;

-- FIL
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='FIL' AND volume > 5003500;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='FIL' AND volume > 3700000;

-- ADA
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='ADA' AND volume > 67210;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='ADA' AND volume > 44230;

-- LINK
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='LINK' AND volume > 280000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='LINK' AND volume > 200000;

-- CRO
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='CRO' AND volume > 100000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='CRO' AND volume > 40000;

-- DOT
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='DOT' AND volume > 300000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='DOT' AND volume > 250000;

-- UNI
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='UNI' AND volume > 140000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='UNI' AND volume > 100000;

-- NEAR
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='NEAR' AND volume > 100000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='NEAR' AND volume > 50000;

-- APT
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='APT' AND volume > 300000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='APT' AND volume > 200000;

-- CFX
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='CFX' AND volume > 300000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='CFX' AND volume > 250000;

-- CRV
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='CRV' AND volume > 1500000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='CRV' AND volume > 1000000;

-- STX
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='STX' AND volume > 50000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='STX' AND volume > 30000;

-- LDO
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='LDO' AND volume > 1000000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='LDO' AND volume > 600000;

-- TAO
UPDATE kline_data SET volume_v1 = 1 WHERE symbol='TAO' AND volume > 300000;
UPDATE kline_data SET volume_v2 = 1 WHERE symbol='TAO' AND volume > 180000;
