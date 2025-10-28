-- 交易规则表
-- 用于定义每个币种的交易权限：能否开单、能开多单还是空单
CREATE TABLE IF NOT EXISTS trading_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,                    -- 币种符号 (如 BTC, ETH)
  trading_allowed INTEGER DEFAULT 1,              -- 是否允许交易 (1=允许, 0=禁止)
  long_allowed INTEGER DEFAULT 1,                 -- 是否允许做多 (1=允许, 0=禁止)
  short_allowed INTEGER DEFAULT 1,                -- 是否允许做空 (1=允许, 0=禁止)
  notes TEXT,                                     -- 备注说明
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_trading_rules_symbol ON trading_rules(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_rules_allowed ON trading_rules(trading_allowed);

-- 为所有现有币种插入默认规则（允许所有交易）
INSERT OR IGNORE INTO trading_rules (symbol, trading_allowed, long_allowed, short_allowed, notes)
SELECT symbol, 1, 1, 1, '默认允许所有交易' 
FROM coins;
