-- 信号匹配系统数据表
-- 创建日期: 2025-11-01
-- 用途: 实现K线信号自动匹配和策略执行流程

-- ===================================
-- 1. 最新K线快照表 (存储最新3根K线的完整信息)
-- ===================================
CREATE TABLE IF NOT EXISTS kline_snapshot_latest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,              -- 币种符号 (BTC, ETH等)
    timeframe TEXT NOT NULL,           -- 时间周期 (5m)
    kline_time INTEGER NOT NULL,       -- K线时间戳
    kline_index INTEGER NOT NULL,      -- K线索引 (1=最新, 2=前1根, 3=前2根)
    
    -- 基础K线数据
    open_price REAL NOT NULL,
    high_price REAL NOT NULL,
    low_price REAL NOT NULL,
    close_price REAL NOT NULL,
    volume REAL NOT NULL,
    change_percent REAL,               -- 涨跌幅
    
    -- 首页数据
    homepage_rank INTEGER,             -- 首页排名
    surge_start_point TEXT,            -- 起涨点标识
    crash_start_point TEXT,            -- 起跌点标识
    operation_tip TEXT,                -- 操作提示 (做多/做空/观望等)
    
    -- 当天统计
    today_surge_count INTEGER DEFAULT 0,     -- 当天起涨次数
    today_crash_count INTEGER DEFAULT 0,     -- 当天起跌次数
    
    -- 极值数据
    rounds_since_48h_high INTEGER DEFAULT 0, -- 距离48h高点轮次数
    decline_from_48h_high REAL DEFAULT 0,    -- 从48h高点的跌幅%
    rounds_since_48h_low INTEGER DEFAULT 0,  -- 距离48h低点轮次数
    rise_from_48h_low REAL DEFAULT 0,        -- 从48h低点的涨幅%
    
    -- 成交量标记
    v1_flag INTEGER DEFAULT 0,         -- V1标记 (1=是, 0=否)
    v2_flag INTEGER DEFAULT 0,         -- V2标记 (1=是, 0=否)
    
    -- 技术指标
    rsi_5 REAL,                        -- RSI(5)
    rsi_14 REAL,                       -- RSI(14)
    sar_value REAL,                    -- SAR值
    sar_position TEXT,                 -- SAR位置 (above/below)
    sar_distance_percent REAL,         -- SAR距离百分比
    macd_value REAL,                   -- MACD值
    macd_signal REAL,                  -- MACD信号线
    macd_histogram REAL,               -- MACD柱状图
    
    -- 布林带
    bollinger_middle REAL,             -- 布林带中轨 (MB)
    bollinger_upper REAL,              -- 布林带上轨 (UB)
    bollinger_lower REAL,              -- 布林带下轨 (LB)
    bollinger_width REAL,              -- 带宽
    bollinger_position TEXT,           -- 通道位置 (上/中/下)
    
    -- 通道占比
    channel_decline_ratio REAL,        -- 下跌通道占比
    channel_rise_ratio REAL,           -- 上涨通道占比
    
    -- 信号标识
    buy_signal TEXT,                   -- 买入信号 (金叉/超卖/收敛等)
    sell_signal TEXT,                  -- 卖出信号 (死叉/超买/高点等)
    
    -- 元数据
    created_at INTEGER NOT NULL,       -- 创建时间戳
    
    UNIQUE(symbol, kline_time, kline_index)
);

CREATE INDEX IF NOT EXISTS idx_kline_snapshot_symbol_time 
    ON kline_snapshot_latest(symbol, kline_time DESC);
CREATE INDEX IF NOT EXISTS idx_kline_snapshot_operation_tip 
    ON kline_snapshot_latest(operation_tip) WHERE operation_tip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kline_snapshot_signals 
    ON kline_snapshot_latest(buy_signal, sell_signal) 
    WHERE buy_signal IS NOT NULL OR sell_signal IS NOT NULL;

-- ===================================
-- 2. 待匹配信号池
-- ===================================
CREATE TABLE IF NOT EXISTS signal_pool_pending (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL,      -- 关联的快照ID
    symbol TEXT NOT NULL,
    kline_time INTEGER NOT NULL,
    
    -- 操作提示类型
    operation_tip TEXT NOT NULL,       -- 操作提示 (做多/做空)
    
    -- 完整快照数据 (JSON格式存储所有字段)
    snapshot_data TEXT NOT NULL,       -- JSON字符串
    
    -- 状态标识
    status TEXT DEFAULT 'pending',     -- pending=待匹配, matched=已匹配, expired=已过期
    match_count INTEGER DEFAULT 0,     -- 匹配到的信号数量
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    matched_at INTEGER,                -- 匹配时间
    expired_at INTEGER,                -- 过期时间
    
    FOREIGN KEY (snapshot_id) REFERENCES kline_snapshot_latest(id)
);

CREATE INDEX IF NOT EXISTS idx_signal_pending_status 
    ON signal_pool_pending(status, symbol);
CREATE INDEX IF NOT EXISTS idx_signal_pending_time 
    ON signal_pool_pending(kline_time DESC);

-- ===================================
-- 3. 已匹配信号池
-- ===================================
CREATE TABLE IF NOT EXISTS signal_pool_matched (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pending_signal_id INTEGER NOT NULL,  -- 关联的待匹配信号ID
    symbol TEXT NOT NULL,
    kline_time INTEGER NOT NULL,
    
    -- 匹配的信号信息
    signal_type TEXT NOT NULL,         -- 信号类型 (buy/sell)
    signal_name TEXT NOT NULL,         -- 信号名称 (震荡收敛/MACD金叉等)
    signal_id INTEGER,                 -- 关联的信号库ID
    
    -- 匹配条件
    match_conditions TEXT,             -- 匹配条件JSON
    match_score REAL DEFAULT 0,        -- 匹配得分 (0-100)
    
    -- 快照数据
    snapshot_data TEXT NOT NULL,       -- 完整的K线快照数据
    
    -- 状态
    status TEXT DEFAULT 'pending_strategy',  -- pending_strategy=等待策略匹配, strategy_matched=策略已匹配, executed=已执行
    strategy_match_count INTEGER DEFAULT 0,  -- 匹配到的策略数量
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    strategy_matched_at INTEGER,
    executed_at INTEGER,
    
    FOREIGN KEY (pending_signal_id) REFERENCES signal_pool_pending(id)
);

CREATE INDEX IF NOT EXISTS idx_signal_matched_status 
    ON signal_pool_matched(status, symbol);
CREATE INDEX IF NOT EXISTS idx_signal_matched_signal 
    ON signal_pool_matched(signal_type, signal_name);
CREATE INDEX IF NOT EXISTS idx_signal_matched_time 
    ON signal_pool_matched(kline_time DESC);

-- ===================================
-- 4. 今日已匹配记录
-- ===================================
CREATE TABLE IF NOT EXISTS signal_matched_today (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matched_signal_id INTEGER NOT NULL,  -- 关联的已匹配信号ID
    symbol TEXT NOT NULL,
    kline_time INTEGER NOT NULL,
    
    -- 匹配的策略信息
    strategy_id INTEGER NOT NULL,      -- 交易策略ID
    strategy_name TEXT NOT NULL,       -- 策略名称
    signal_type TEXT NOT NULL,         -- 信号类型 (buy/sell)
    
    -- 策略匹配详情
    buy_point_name TEXT,               -- 买点名称
    sell_point_name TEXT,              -- 卖点名称
    match_details TEXT,                -- 匹配详情JSON
    
    -- 条件检查结果
    condition_check_passed INTEGER DEFAULT 0,  -- 条件检查是否通过 (1=通过, 0=不通过)
    condition_check_details TEXT,      -- 条件检查详情JSON
    
    -- 状态
    status TEXT DEFAULT 'pending_execution',  -- pending_execution=待执行, in_production=已进入生产池, executed=已执行
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    production_at INTEGER,             -- 进入生产池时间
    executed_at INTEGER,               -- 执行时间
    
    FOREIGN KEY (matched_signal_id) REFERENCES signal_pool_matched(id)
);

CREATE INDEX IF NOT EXISTS idx_today_matched_status 
    ON signal_matched_today(status, symbol);
CREATE INDEX IF NOT EXISTS idx_today_matched_strategy 
    ON signal_matched_today(strategy_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_today_matched_time 
    ON signal_matched_today(created_at DESC);

-- ===================================
-- 5. 生产池待执行
-- ===================================
CREATE TABLE IF NOT EXISTS production_pool_pending (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    today_matched_id INTEGER NOT NULL,  -- 关联的今日已匹配记录ID
    symbol TEXT NOT NULL,
    kline_time INTEGER NOT NULL,
    
    -- 策略信息
    strategy_id INTEGER NOT NULL,
    strategy_name TEXT NOT NULL,
    signal_type TEXT NOT NULL,         -- buy/sell
    
    -- 交易参数
    entry_price REAL,                  -- 建议入场价格
    stop_loss REAL,                    -- 止损价格
    take_profit REAL,                  -- 止盈价格
    position_size REAL,                -- 仓位大小
    leverage INTEGER DEFAULT 1,        -- 杠杆倍数
    
    -- 完整数据
    snapshot_data TEXT NOT NULL,       -- 完整的K线快照数据
    strategy_config TEXT,              -- 策略配置JSON
    
    -- 优先级
    priority INTEGER DEFAULT 5,        -- 优先级 (1-10, 10最高)
    
    -- 状态
    status TEXT DEFAULT 'pending',     -- pending=待执行, executing=执行中, executed=已执行, cancelled=已取消
    execution_type TEXT DEFAULT 'simulated',  -- simulated=模拟交易, live=实盘交易
    
    -- 执行结果
    execution_id INTEGER,              -- 执行记录ID (关联模拟/实盘交易表)
    execution_result TEXT,             -- 执行结果JSON
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    executed_at INTEGER,
    cancelled_at INTEGER,
    
    FOREIGN KEY (today_matched_id) REFERENCES signal_matched_today(id)
);

CREATE INDEX IF NOT EXISTS idx_production_status 
    ON production_pool_pending(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_production_symbol 
    ON production_pool_pending(symbol, status);
CREATE INDEX IF NOT EXISTS idx_production_time 
    ON production_pool_pending(created_at DESC);

-- ===================================
-- 6. 信号匹配规则配置表
-- ===================================
CREATE TABLE IF NOT EXISTS signal_matching_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL UNIQUE,    -- 规则名称
    rule_type TEXT NOT NULL,           -- 规则类型 (signal_match/strategy_match)
    
    -- 匹配条件 (JSON格式)
    conditions TEXT NOT NULL,          -- 匹配条件配置
    
    -- 权重和评分
    weight REAL DEFAULT 1.0,           -- 权重
    min_score REAL DEFAULT 0,          -- 最低匹配分数
    
    -- 状态
    enabled INTEGER DEFAULT 1,         -- 是否启用 (1=启用, 0=禁用)
    
    -- 描述
    description TEXT,                  -- 规则描述
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

-- 插入默认匹配规则
INSERT OR IGNORE INTO signal_matching_rules (rule_name, rule_type, conditions, description, created_at) VALUES
('operation_tip_match', 'signal_match', '{"field":"operation_tip","operator":"not_null"}', '操作提示非空规则', strftime('%s', 'now')),
('buy_signal_match', 'signal_match', '{"field":"buy_signal","operator":"not_null"}', '买入信号非空规则', strftime('%s', 'now')),
('sell_signal_match', 'signal_match', '{"field":"sell_signal","operator":"not_null"}', '卖出信号非空规则', strftime('%s', 'now')),
('rsi_oversold', 'signal_match', '{"field":"rsi_14","operator":"<","value":30}', 'RSI超卖规则', strftime('%s', 'now')),
('rsi_overbought', 'signal_match', '{"field":"rsi_14","operator":">","value":70}', 'RSI超买规则', strftime('%s', 'now'));

-- ===================================
-- 7. 系统配置表
-- ===================================
CREATE TABLE IF NOT EXISTS signal_system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,   -- 配置键
    config_value TEXT NOT NULL,        -- 配置值
    config_type TEXT DEFAULT 'string', -- 类型 (string/number/boolean/json)
    description TEXT,                  -- 描述
    updated_at INTEGER NOT NULL
);

-- 插入默认系统配置
INSERT OR IGNORE INTO signal_system_config (config_key, config_value, config_type, description, updated_at) VALUES
('kline_sync_interval', '30', 'number', 'K线同步间隔(秒)', strftime('%s', 'now')),
('kline_snapshot_count', '3', 'number', '保存的K线快照数量', strftime('%s', 'now')),
('kline_history_count', '300', 'number', '历史K线数量', strftime('%s', 'now')),
('signal_expiry_minutes', '30', 'number', '信号过期时间(分钟)', strftime('%s', 'now')),
('auto_match_enabled', 'true', 'boolean', '自动匹配启用', strftime('%s', 'now')),
('production_pool_max_size', '50', 'number', '生产池最大容量', strftime('%s', 'now'));

-- ===================================
-- 8. 创建视图：当前待处理信号概览
-- ===================================
CREATE VIEW IF NOT EXISTS v_signal_overview AS
SELECT 
    'pending' as pool_type,
    COUNT(*) as count,
    COUNT(DISTINCT symbol) as symbol_count
FROM signal_pool_pending 
WHERE status = 'pending'

UNION ALL

SELECT 
    'matched' as pool_type,
    COUNT(*) as count,
    COUNT(DISTINCT symbol) as symbol_count
FROM signal_pool_matched 
WHERE status = 'pending_strategy'

UNION ALL

SELECT 
    'today_matched' as pool_type,
    COUNT(*) as count,
    COUNT(DISTINCT symbol) as symbol_count
FROM signal_matched_today 
WHERE status = 'pending_execution'

UNION ALL

SELECT 
    'production' as pool_type,
    COUNT(*) as count,
    COUNT(DISTINCT symbol) as symbol_count
FROM production_pool_pending 
WHERE status = 'pending';

-- 完成
