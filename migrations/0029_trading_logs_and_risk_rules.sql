-- 交易日志表（不可篡改、不可删除）
CREATE TABLE IF NOT EXISTS trading_logs (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    log_type TEXT NOT NULL,              -- order_placed, order_filled, order_canceled, position_opened, position_closed, risk_alert
    timestamp TEXT NOT NULL,             -- ISO 8601 时间戳
    symbol TEXT,
    side TEXT,                           -- buy/sell, long/short
    order_type TEXT,
    price REAL,
    quantity REAL,
    amount REAL,
    leverage INTEGER,
    status TEXT,
    order_id TEXT,
    position_id TEXT,
    pnl REAL,
    pnl_percent REAL,
    fee REAL,
    risk_rule_triggered TEXT,            -- 触发的风控规则
    message TEXT,
    raw_data TEXT,                       -- JSON 格式的原始数据
    hash TEXT NOT NULL,                  -- 数据哈希，用于防篡改验证
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
);

-- 交易日志索引
CREATE INDEX IF NOT EXISTS idx_trading_logs_account ON trading_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_logs_timestamp ON trading_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trading_logs_type ON trading_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_trading_logs_symbol ON trading_logs(symbol);

-- 风控规则表
CREATE TABLE IF NOT EXISTS risk_control_rules (
    id TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,             -- market_trend, coin_restriction, position_limit, stop_loss, time_based
    description TEXT,
    is_enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,          -- 优先级，数字越大优先级越高
    conditions TEXT NOT NULL,            -- JSON 格式的条件
    action TEXT NOT NULL,                -- block_short, block_long, force_close, alert
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- 插入默认风控规则
INSERT OR IGNORE INTO risk_control_rules (id, rule_name, rule_type, description, is_enabled, priority, conditions, action, created_at) VALUES
('rule_001', '单边主升不做空', 'market_trend', '当市场处于单边主升状态时，禁止做空操作', 1, 100, '{"trend_type":"single_side_up"}', 'block_short', datetime('now')),
('rule_002', '等级1-2币种不做空', 'coin_restriction', '对于等级为1或2的币种，禁止做空操作', 1, 90, '{"level_in":[1,2]}', 'block_short', datetime('now')),
('rule_003', '23:59涨幅>15%不做空', 'time_based', '对于23:59分涨幅还是大于15%的币种，禁止做空操作', 1, 95, '{"time":"23:59","change_threshold":15}', 'block_short', datetime('now')),
('rule_004', '最大持仓限制', 'position_limit', '最大持仓不允许超过三分之二（66.67%）', 1, 80, '{"max_position_ratio":0.6667}', 'block_open', datetime('now')),
('rule_005', '20%止损', 'stop_loss', '亏损达到20%时自动止损', 1, 70, '{"loss_threshold":0.20}', 'force_close', datetime('now'));

-- 风控规则索引
CREATE INDEX IF NOT EXISTS idx_risk_rules_type ON risk_control_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_risk_rules_enabled ON risk_control_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_risk_rules_priority ON risk_control_rules(priority DESC);

-- 风控触发记录表
CREATE TABLE IF NOT EXISTS risk_control_triggers (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    symbol TEXT,
    trigger_time TEXT NOT NULL,
    conditions_met TEXT,                 -- JSON 格式的满足的条件
    action_taken TEXT,
    blocked_operation TEXT,              -- 被阻止的操作
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (rule_id) REFERENCES risk_control_rules(id),
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
);

-- 风控触发记录索引
CREATE INDEX IF NOT EXISTS idx_risk_triggers_rule ON risk_control_triggers(rule_id);
CREATE INDEX IF NOT EXISTS idx_risk_triggers_account ON risk_control_triggers(account_id);
CREATE INDEX IF NOT EXISTS idx_risk_triggers_time ON risk_control_triggers(trigger_time DESC);

-- 当日风控状态表（每日统计）
CREATE TABLE IF NOT EXISTS daily_risk_status (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,                  -- YYYY-MM-DD
    account_id TEXT NOT NULL,
    market_trend TEXT,                   -- single_side_up, single_side_down, volatile, stable
    restricted_coins TEXT,               -- JSON 数组，禁止交易的币种列表
    total_positions INTEGER DEFAULT 0,
    total_equity REAL DEFAULT 0,
    position_ratio REAL DEFAULT 0,
    max_loss_today REAL DEFAULT 0,
    max_loss_coin TEXT,
    rules_triggered INTEGER DEFAULT 0,
    trades_blocked INTEGER DEFAULT 0,
    trades_executed INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
);

-- 每日风控状态索引
CREATE INDEX IF NOT EXISTS idx_daily_risk_date ON daily_risk_status(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_risk_account ON daily_risk_status(account_id);

-- 添加 Passphrase 字段到账户表（如果不存在）
-- 注意：SQLite 不支持 ADD COLUMN IF NOT EXISTS，所以需要检查
-- 这里使用 ALTER TABLE 添加，如果字段已存在会报错但不影响后续操作
