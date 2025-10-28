-- 清除 price_extremes 表的所有旧数据
DELETE FROM price_extremes;

-- 导入新的极值数据（29个币种）
INSERT INTO price_extremes (symbol, all_time_high, high_count, all_time_low, low_count, ath_date, atl_date, last_updated)
VALUES
  ('OKB', 235.51972, 1519, 162.60563, 428, datetime('now'), datetime('now'), datetime('now')),
  ('DOT', 4.883676056338, 2999, 2.90639, 752, datetime('now'), datetime('now'), datetime('now')),
  ('LINK', 26.37, 6210, 16.62113, 749, datetime('now'), datetime('now'), datetime('now')),
  ('ADA', 0.953985915493, 3780, 0.62663, 749, datetime('now'), datetime('now'), datetime('now')),
  ('FIL', 2.656661971831, 3781, 1.47924, 749, datetime('now'), datetime('now'), datetime('now')),
  ('XLM', 0.41770, 6210, 0.30889, 749, datetime('now'), datetime('now'), datetime('now')),
  ('HBAR', 0.2552676056338, 3780, 0.16373, 749, datetime('now'), datetime('now'), datetime('now')),
  ('BCH', 650.823943662, 3070, 459.09296, 750, datetime('now'), datetime('now'), datetime('now')),
  ('ETC', 24.32, 6209, 14.48451, 1589, datetime('now'), datetime('now'), datetime('now')),
  ('TON', 3.392, 6209, 2.12076, 459, datetime('now'), datetime('now'), datetime('now')),
  ('TRX', 0.36644, 6209, 0.29508, 342, datetime('now'), datetime('now'), datetime('now')),
  ('SUI', 3.981056338028, 3036, 2.41479, 391, datetime('now'), datetime('now'), datetime('now')),
  ('DOGE', 0.3071549295775, 3780, 0.18701, 749, datetime('now'), datetime('now'), datetime('now')),
  ('SOL', 253.3591549296, 3046, 183.80986, 510, datetime('now'), datetime('now'), datetime('now')),
  ('LTC', 135.56901, 1076, 91.32113, 750, datetime('now'), datetime('now'), datetime('now')),
  ('BNB', 1377.4831, 975, 820.7, 6209, datetime('now'), datetime('now'), datetime('now')),
  ('XRP', 3.190211267606, 3799, 2.33165, 749, datetime('now'), datetime('now'), datetime('now')),
  ('ETH', 4830, 6209, 3837.73944, 428, datetime('now'), datetime('now'), datetime('now')),
  ('BTC', 125370.20986, 1511, 106787.7831, 750, datetime('now'), datetime('now'), datetime('now')),
  ('CRO', 0.3857746478873, 6011, 0.14214, 749, datetime('now'), datetime('now'), datetime('now')),
  ('CFX', 0.1878309859155, 3036, 0.10773, 467, datetime('now'), datetime('now'), datetime('now')),
  ('CRV', 0.8628732394366, 3640, 0.51941, 750, datetime('now'), datetime('now'), datetime('now')),
  ('APT', 5.49327, 1512, 3.14277, 495, datetime('now'), datetime('now'), datetime('now')),
  ('NEAR', 3.324084507042, 2781, 2.15015, 749, datetime('now'), datetime('now'), datetime('now')),
  ('UNI', 10.3711971831, 3781, 5.99058, 749, datetime('now'), datetime('now'), datetime('now')),
  ('AAVE', 322.6535211268, 3861, 213.46901, 752, datetime('now'), datetime('now'), datetime('now')),
  ('STX', 0.7021126760563, 3640, 0.42073, 752, datetime('now'), datetime('now'), datetime('now')),
  ('TAO', 476.82394, 789, 293.10704, 1999, datetime('now'), datetime('now'), datetime('now')),
  ('LDO', 1.354929577465, 2858, 0.86355, 752, datetime('now'), datetime('now'), datetime('now'));

-- 验证导入结果
SELECT COUNT(*) as total_coins FROM price_extremes;
SELECT symbol, all_time_high, high_count, all_time_low, low_count FROM price_extremes ORDER BY symbol;
