-- =====================================================
-- 修正价格极值数据中的占比错误
-- 创建时间: 2025-10-29 03:30 UTC
-- 问题: 部分币种的all_time_low数据错误，导致最低占比>100%
-- =====================================================

-- 根据用户提供的正确数据更新所有29个币种的历史极值
-- 数据来源: 用户提供的备份数据表格

-- 正确的数据定义:
-- 最高占比 = 当前价格 / all_time_high * 100%  (必须 < 100%)
-- 最低占比 = 当前价格 / all_time_low * 100%   (必须 > 100%)

-- 如果发现:
-- 最高占比 >= 100%  =>  all_time_high 数据错误
-- 最低占比 <= 100%  =>  all_time_low 数据错误

UPDATE price_extremes SET all_time_high = 341.02, all_time_low = 233.53 WHERE symbol = 'OKB';
UPDATE price_extremes SET all_time_high = 7.82, all_time_low = 2.91 WHERE symbol = 'DOT';
UPDATE price_extremes SET all_time_high = 39.12, all_time_low = 16.62 WHERE symbol = 'LINK';
UPDATE price_extremes SET all_time_high = 1.417, all_time_low = 0.627 WHERE symbol = 'ADA';
UPDATE price_extremes SET all_time_high = 4.54, all_time_low = 1.48 WHERE symbol = 'FIL';
UPDATE price_extremes SET all_time_high = 0.551, all_time_low = 0.309 WHERE symbol = 'XLM';
UPDATE price_extremes SET all_time_high = 0.338, all_time_low = 0.164 WHERE symbol = 'HBAR';
UPDATE price_extremes SET all_time_high = 753.92, all_time_low = 459.09 WHERE symbol = 'BCH';
UPDATE price_extremes SET all_time_high = 37.26, all_time_low = 12.55 WHERE symbol = 'ETC';
UPDATE price_extremes SET all_time_high = 5.07, all_time_low = 2.12 WHERE symbol = 'TON';
UPDATE price_extremes SET all_time_high = 0.454, all_time_low = 0.294 WHERE symbol = 'TRX';
UPDATE price_extremes SET all_time_high = 6.35, all_time_low = 2.41 WHERE symbol = 'SUI';
UPDATE price_extremes SET all_time_high = 0.488, all_time_low = 0.187 WHERE symbol = 'DOGE';
UPDATE price_extremes SET all_time_high = 331.38, all_time_low = 183.81 WHERE symbol = 'SOL';
UPDATE price_extremes SET all_time_high = 190.65, all_time_low = 91.32 WHERE symbol = 'LTC';
UPDATE price_extremes SET all_time_high = 1720.66, all_time_low = 820.7 WHERE symbol = 'BNB';
UPDATE price_extremes SET all_time_high = 3.91, all_time_low = 2.33 WHERE symbol = 'XRP';
UPDATE price_extremes SET all_time_high = 5845, all_time_low = 3837.74 WHERE symbol = 'ETH';
UPDATE price_extremes SET all_time_high = 139855, all_time_low = 106787.78 WHERE symbol = 'BTC';
UPDATE price_extremes SET all_time_high = 0.987, all_time_low = 0.142 WHERE symbol = 'CRO';
UPDATE price_extremes SET all_time_high = 0.322, all_time_low = 0.108 WHERE symbol = 'CFX';
UPDATE price_extremes SET all_time_high = 1.397, all_time_low = 0.519 WHERE symbol = 'CRV';
UPDATE price_extremes SET all_time_high = 9.02, all_time_low = 3.14 WHERE symbol = 'APT';
UPDATE price_extremes SET all_time_high = 4.95, all_time_low = 2.15 WHERE symbol = 'NEAR';
UPDATE price_extremes SET all_time_high = 17.03, all_time_low = 5.99 WHERE symbol = 'UNI';
UPDATE price_extremes SET all_time_high = 455.58, all_time_low = 213.47 WHERE symbol = 'AAVE';
UPDATE price_extremes SET all_time_high = 1.115, all_time_low = 0.421 WHERE symbol = 'STX';
UPDATE price_extremes SET all_time_high = 535.39, all_time_low = 329.14 WHERE symbol = 'TAO';
UPDATE price_extremes SET all_time_high = 2.04, all_time_low = 0.864 WHERE symbol = 'LDO';

-- 验证修正结果（应该全部符合定义）
-- 最高占比应该全部 < 100%
-- 最低占比应该全部 > 100%
