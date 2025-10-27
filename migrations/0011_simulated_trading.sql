-- 模拟交易账户表
CREATE TABLE IF NOT EXISTS simulated_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL UNIQUE,
  initial_balance REAL NOT NULL,
  current_balance REAL NOT NULL,
  leverage REAL DEFAULT 1.0 CHECK(leverage >= 1.0 AND leverage <= 100.0),
  trading_fee_rate REAL DEFAULT 0.001 CHECK(trading_fee_rate >= 0 AND trading_fee_rate <= 0.1),
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PAUSED', 'STOPPED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 交易策略配置表
CREATE TABLE IF NOT EXISTS trading_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_name TEXT NOT NULL UNIQUE,
  strategy_type TEXT NOT NULL CHECK(strategy_type IN ('SIGNAL_BASED', 'RSI', 'MACD', 'CUSTOM')),
  description TEXT,
  config TEXT, -- JSON配置参数
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 模拟交易记录表
CREATE TABLE IF NOT EXISTS simulated_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  strategy_id INTEGER,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK(trade_type IN ('BUY', 'SELL')),
  position_type TEXT NOT NULL CHECK(position_type IN ('LONG', 'SHORT')),
  entry_price REAL NOT NULL,
  exit_price REAL,
  quantity REAL NOT NULL,
  leverage REAL NOT NULL,
  fee REAL NOT NULL,
  profit_loss REAL DEFAULT 0,
  profit_loss_percent REAL DEFAULT 0,
  status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED', 'CANCELLED')),
  entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  exit_time DATETIME,
  signal_source TEXT, -- 信号来源（SAR, RSI, MACD等）
  notes TEXT,
  FOREIGN KEY (account_id) REFERENCES simulated_accounts(id),
  FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id)
);

-- 账户快照表（记录账户历史余额变化）
CREATE TABLE IF NOT EXISTS account_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  balance REAL NOT NULL,
  total_profit_loss REAL NOT NULL,
  total_trades INTEGER NOT NULL,
  win_trades INTEGER NOT NULL,
  lose_trades INTEGER NOT NULL,
  win_rate REAL NOT NULL,
  snapshot_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES simulated_accounts(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_simulated_trades_account ON simulated_trades(account_id);
CREATE INDEX IF NOT EXISTS idx_simulated_trades_symbol ON simulated_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_simulated_trades_status ON simulated_trades(status);
CREATE INDEX IF NOT EXISTS idx_account_snapshots_account ON account_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_account_snapshots_time ON account_snapshots(snapshot_time);

-- 插入默认策略
INSERT OR IGNORE INTO trading_strategies (strategy_name, strategy_type, description, config) VALUES 
('SAR信号策略', 'SIGNAL_BASED', '根据SAR翻转信号进行交易', '{"signal_types": ["SAR_BULLISH", "SAR_BEARISH"], "min_signal_strength": 1}'),
('RSI超买超卖', 'RSI', '根据RSI指标超买超卖进行交易', '{"rsi_oversold": 30, "rsi_overbought": 70, "timeframe": "5m"}'),
('MACD金叉死叉', 'MACD', '根据MACD金叉死叉进行交易', '{"fast_period": 12, "slow_period": 26, "signal_period": 9}');
