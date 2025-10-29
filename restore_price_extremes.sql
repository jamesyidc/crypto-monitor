-- 恢复price_extremes历史数据
-- 数据来源：用户提供的比价系统导出数据（2025-10-29）
-- 表结构：all_time_high, all_time_low, high_count, low_count

-- OKB: 当前235.52, 历史高161.28
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('OKB', 235.51972, 161.28451, 1643, 34);

-- DOT: 当前4.88, 历史高2.91
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('DOT', 4.883676056338, 2.90639, 3123, 876);

-- LINK: 当前26.37, 历史高16.62
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('LINK', 26.37, 16.62113, 6334, 873);

-- ADA: 当前0.954, 历史高0.627
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('ADA', 0.953985915493, 0.62663, 3904, 873);

-- FIL: 当前2.66, 历史高1.48
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('FIL', 2.656661971831, 1.47924, 3905, 873);

-- XLM: 当前0.418, 历史高0.309
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('XLM', 0.41770, 0.30889, 6334, 873);

-- HBAR: 当前0.255, 历史高0.164
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('HBAR', 0.2552676056338, 0.16373, 3904, 873);

-- BCH: 当前650.82, 历史高459.09
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('BCH', 650.823943662, 459.09296, 3194, 874);

-- ETC: 当前24.32, 历史高12.55
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('ETC', 24.32, 12.55055, 6333, 33);

-- TON: 当前3.39, 历史高2.12
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('TON', 3.392, 2.12076, 6333, 583);

-- TRX: 当前0.366, 历史高0.294
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('TRX', 0.36644, 0.29375, 6333, 35);

-- SUI: 当前3.98, 历史高2.41
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('SUI', 3.981056338028, 2.41479, 3160, 515);

-- DOGE: 当前0.307, 历史高0.187
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('DOGE', 0.3071549295775, 0.18701, 3904, 873);

-- SOL: 当前253.36, 历史高183.81
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('SOL', 253.3591549296, 183.80986, 3170, 634);

-- LTC: 当前135.57, 历史高91.32
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('LTC', 135.56901, 91.32113, 1200, 874);

-- BNB: 当前1377.48, 历史高820.7
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('BNB', 1377.4831, 820.7, 1099, 6333);

-- XRP: 当前3.19, 历史高2.33
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('XRP', 3.190211267606, 2.33165, 3923, 873);

-- ETH: 当前4830, 历史高3837.74
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('ETH', 4830, 3837.73944, 6333, 552);

-- BTC: 当前125370.21, 历史高106787.78
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('BTC', 125370.20986, 106787.7831, 1635, 874);

-- CRO: 当前0.386, 历史高0.142
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('CRO', 0.3857746478873, 0.14214, 6135, 873);

-- CFX: 当前0.188, 历史高0.108
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('CFX', 0.1878309859155, 0.10773, 3160, 591);

-- CRV: 当前0.863, 历史高0.519
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('CRV', 0.8628732394366, 0.51941, 3764, 874);

-- APT: 当前5.49, 历史高3.14
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('APT', 5.49327, 3.14277, 1636, 619);

-- NEAR: 当前3.32, 历史高2.15
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('NEAR', 3.324084507042, 2.15015, 2905, 873);

-- UNI: 当前10.37, 历史高5.99
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('UNI', 10.3711971831, 5.99058, 3905, 873);

-- AAVE: 当前322.65, 历史高213.47
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('AAVE', 322.6535211268, 213.46901, 3985, 876);

-- STX: 当前0.702, 历史高0.421
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('STX', 0.7021126760563, 0.42073, 3764, 876);

-- TAO: 当前476.82, 历史高293.11
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('TAO', 476.82394, 293.10704, 913, 2123);

-- LDO: 当前1.35, 历史高0.864
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count)
VALUES ('LDO', 1.354929577465, 0.86355, 2982, 876);
