// 手动创建数据库表
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 找到最新的 D1 数据库文件
const d1Dir = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const files = fs.readdirSync(d1Dir)
  .filter(f => f.endsWith('.sqlite'))
  .map(f => ({
    name: f,
    path: path.join(d1Dir, f),
    mtime: fs.statSync(path.join(d1Dir, f)).mtime
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (files.length === 0) {
  console.error('❌ 没有找到 D1 数据库文件');
  process.exit(1);
}

const dbPath = files[0].path;
console.log(`📂 使用数据库: ${files[0].name}`);

const db = new Database(dbPath);

console.log('\n🗑️  清理旧表...');
const dropTables = [
  'live_trading_accounts',
  'live_trading_configs',
  'live_trading_positions',
  'live_trading_history',
  'trading_logs',
  'risk_control_rules',
  'risk_control_triggers',
  'daily_risk_status'
];

for (const table of dropTables) {
  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
    console.log(`  ✅ 删除表 ${table}`);
  } catch (error) {
    console.log(`  ⚠️  表 ${table} 不存在`);
  }
}

console.log('\n📝 创建新表...');

// 1. 实盘交易账户表
console.log('  创建 live_trading_accounts...');
db.exec(`
CREATE TABLE live_trading_accounts (
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
)
`);
console.log('  ✅ live_trading_accounts 创建成功');

// 2. 实盘交易配置表
console.log('  创建 live_trading_configs...');
db.exec(`
CREATE TABLE live_trading_configs (
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
)
`);
console.log('  ✅ live_trading_configs 创建成功');

// 3. 实盘交易持仓表
console.log('  创建 live_trading_positions...');
db.exec(`
CREATE TABLE live_trading_positions (
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
)
`);
console.log('  ✅ live_trading_positions 创建成功');

// 4. 实盘交易历史表
console.log('  创建 live_trading_history...');
db.exec(`
CREATE TABLE live_trading_history (
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
)
`);
console.log('  ✅ live_trading_history 创建成功');

// 5. 交易日志表
console.log('  创建 trading_logs...');
db.exec(`
CREATE TABLE trading_logs (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    log_type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    symbol TEXT,
    side TEXT,
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
    risk_rule_triggered TEXT,
    message TEXT,
    raw_data TEXT,
    hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
)
`);
console.log('  ✅ trading_logs 创建成功');

// 6. 风控规则表
console.log('  创建 risk_control_rules...');
db.exec(`
CREATE TABLE risk_control_rules (
    id TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    description TEXT,
    is_enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    conditions TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT
)
`);
console.log('  ✅ risk_control_rules 创建成功');

// 7. 风控触发记录表
console.log('  创建 risk_control_triggers...');
db.exec(`
CREATE TABLE risk_control_triggers (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    symbol TEXT,
    trigger_time TEXT NOT NULL,
    conditions_met TEXT,
    action_taken TEXT,
    blocked_operation TEXT,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (rule_id) REFERENCES risk_control_rules(id),
    FOREIGN KEY (account_id) REFERENCES live_trading_accounts(id) ON DELETE CASCADE
)
`);
console.log('  ✅ risk_control_triggers 创建成功');

// 8. 当日风控状态表
console.log('  创建 daily_risk_status...');
db.exec(`
CREATE TABLE daily_risk_status (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    account_id TEXT NOT NULL,
    market_trend TEXT,
    restricted_coins TEXT,
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
)
`);
console.log('  ✅ daily_risk_status 创建成功');

console.log('\n📇 创建索引...');

// 创建索引
const indexes = [
  'CREATE INDEX idx_trading_logs_account ON trading_logs(account_id)',
  'CREATE INDEX idx_trading_logs_timestamp ON trading_logs(timestamp DESC)',
  'CREATE INDEX idx_trading_logs_type ON trading_logs(log_type)',
  'CREATE INDEX idx_trading_logs_symbol ON trading_logs(symbol)',
  'CREATE INDEX idx_risk_rules_type ON risk_control_rules(rule_type)',
  'CREATE INDEX idx_risk_rules_enabled ON risk_control_rules(is_enabled)',
  'CREATE INDEX idx_risk_rules_priority ON risk_control_rules(priority DESC)',
  'CREATE INDEX idx_risk_triggers_rule ON risk_control_triggers(rule_id)',
  'CREATE INDEX idx_risk_triggers_account ON risk_control_triggers(account_id)',
  'CREATE INDEX idx_risk_triggers_time ON risk_control_triggers(trigger_time DESC)',
  'CREATE INDEX idx_daily_risk_date ON daily_risk_status(date DESC)',
  'CREATE INDEX idx_daily_risk_account ON daily_risk_status(account_id)',
  'CREATE INDEX idx_live_trading_configs_account ON live_trading_configs(account_id)',
  'CREATE INDEX idx_live_trading_positions_account ON live_trading_positions(account_id)',
  'CREATE INDEX idx_live_trading_history_account ON live_trading_history(account_id)',
  'CREATE INDEX idx_live_trading_history_timestamp ON live_trading_history(timestamp)'
];

for (const indexSql of indexes) {
  try {
    db.exec(indexSql);
    console.log(`  ✅ 索引创建成功`);
  } catch (error) {
    console.log(`  ⚠️  索引可能已存在: ${error.message}`);
  }
}

console.log('\n📊 插入默认风控规则...');

const defaultRules = [
  {
    id: 'rule_001',
    rule_name: '单边主升不做空',
    rule_type: 'market_trend',
    description: '当市场处于单边主升状态时，禁止做空操作',
    is_enabled: 1,
    priority: 100,
    conditions: JSON.stringify({trend_type:"single_side_up"}),
    action: 'block_short',
    created_at: new Date().toISOString()
  },
  {
    id: 'rule_002',
    rule_name: '等级1-2币种不做空',
    rule_type: 'coin_restriction',
    description: '对于等级为1或2的币种，禁止做空操作',
    is_enabled: 1,
    priority: 90,
    conditions: JSON.stringify({level_in:[1,2]}),
    action: 'block_short',
    created_at: new Date().toISOString()
  },
  {
    id: 'rule_003',
    rule_name: '23:59涨幅>15%不做空',
    rule_type: 'time_based',
    description: '对于23:59分涨幅还是大于15%的币种，禁止做空操作',
    is_enabled: 1,
    priority: 95,
    conditions: JSON.stringify({time:"23:59",change_threshold:15}),
    action: 'block_short',
    created_at: new Date().toISOString()
  },
  {
    id: 'rule_004',
    rule_name: '最大持仓限制',
    rule_type: 'position_limit',
    description: '最大持仓不允许超过三分之二（66.67%）',
    is_enabled: 1,
    priority: 80,
    conditions: JSON.stringify({max_position_ratio:0.6667}),
    action: 'block_open',
    created_at: new Date().toISOString()
  },
  {
    id: 'rule_005',
    rule_name: '20%止损',
    rule_type: 'stop_loss',
    description: '亏损达到20%时自动止损',
    is_enabled: 1,
    priority: 70,
    conditions: JSON.stringify({loss_threshold:0.20}),
    action: 'force_close',
    created_at: new Date().toISOString()
  }
];

const insertRule = db.prepare(`
  INSERT INTO risk_control_rules (
    id, rule_name, rule_type, description, is_enabled,
    priority, conditions, action, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const rule of defaultRules) {
  try {
    insertRule.run(
      rule.id,
      rule.rule_name,
      rule.rule_type,
      rule.description,
      rule.is_enabled,
      rule.priority,
      rule.conditions,
      rule.action,
      rule.created_at
    );
    console.log(`  ✅ 插入规则: ${rule.rule_name}`);
  } catch (error) {
    console.log(`  ⚠️  规则可能已存在: ${rule.rule_name}`);
  }
}

// 验证表创建
console.log('\n✅ 验证表结构...');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('已创建的表:');
tables.forEach(t => console.log(`  - ${t.name}`));

db.close();
console.log('\n✅ 数据库初始化完成！');
