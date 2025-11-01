-- 实盘交易账户表
CREATE TABLE IF NOT EXISTS live_trading_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    passphrase TEXT NOT NULL,
    is_testnet INTEGER DEFAULT 0,
    trading_balance REAL DEFAULT 0,
    funding_balance REAL DEFAULT 0,
    daily_pnl REAL DEFAULT 0,
    last_update TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- 实盘交易配置表
CREATE TABLE IF NOT EXISTS live_trading_configs (
    account_id TEXT PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'auto',
    strategy TEXT,
    symbol TEXT,
    direction TEXT DEFAULT 'long',
    leverage INTEGER DEFAULT 10,
    position_ratio REAL DEFAULT 30,
    funds_partition INTEGER DEFAULT 10,
    funds_upper_limit REAL DEFAULT 10000,
    funds_lower_limit REAL DEFAULT 100,
    is_active INTEGER DEFAULT 0,
    updated_at TEXT,
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
);

-- 实盘交易持仓表
CREATE TABLE IF NOT EXISTS live_trading_positions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL,
    current_price REAL,
    unrealized_pnl REAL,
    unrealized_pnl_percent REAL,
    leverage INTEGER,
    opened_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
);

-- 实盘交易历史表
CREATE TABLE IF NOT EXISTS live_trading_history (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    type TEXT NOT NULL,
    price REAL NOT NULL,
    quantity REAL NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_live_trading_configs_account ON live_trading_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_live_trading_positions_account ON live_trading_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_live_trading_history_account ON live_trading_history(account_id);
CREATE INDEX IF NOT EXISTS idx_live_trading_history_timestamp ON live_trading_history(timestamp);
