-- 等级1: TAO
INSERT OR IGNORE INTO coin_priority (symbol, level, low_ratio, high_ratio) VALUES ('TAO', 1, 0.05, 0.10);

-- 等级2: BNB, BCH
INSERT OR IGNORE INTO coin_priority (symbol, level, low_ratio, high_ratio) VALUES 
('BNB', 2, 0.06, 0.12),
('BCH', 2, 0.06, 0.12);

-- 等级4: XRP
INSERT OR IGNORE INTO coin_priority (symbol, level, low_ratio, high_ratio) VALUES ('XRP', 4, 0.08, 0.15);

-- 等级5: BTC
INSERT OR IGNORE INTO coin_priority (symbol, level, low_ratio, high_ratio) VALUES ('BTC', 5, 0.10, 0.20);

-- 等级6: 其余24个币种 (基于coins表实际数据)
INSERT OR IGNORE INTO coin_priority (symbol, level, low_ratio, high_ratio) VALUES 
('ETH', 6, 0.10, 0.20),
('SOL', 6, 0.10, 0.20),
('LTC', 6, 0.10, 0.20),
('DOGE', 6, 0.10, 0.20),
('SUI', 6, 0.10, 0.20),
('TRX', 6, 0.10, 0.20),
('TON', 6, 0.10, 0.20),
('ETC', 6, 0.10, 0.20),
('HBAR', 6, 0.10, 0.20),
('XLM', 6, 0.10, 0.20),
('FIL', 6, 0.10, 0.20),
('ADA', 6, 0.10, 0.20),
('LINK', 6, 0.10, 0.20),
('CRO', 6, 0.10, 0.20),
('DOT', 6, 0.10, 0.20),
('OKB', 6, 0.10, 0.20),
('AAVE', 6, 0.10, 0.20),
('UNI', 6, 0.10, 0.20),
('NEAR', 6, 0.10, 0.20),
('APT', 6, 0.10, 0.20),
('CFX', 6, 0.10, 0.20),
('CRV', 6, 0.10, 0.20),
('STX', 6, 0.10, 0.20),
('LDO', 6, 0.10, 0.20);
