-- 删除旧的特征库相关数据
DELETE FROM pattern_features;

-- 创建新的交易信号表（做多/做空分类）
CREATE TABLE IF NOT EXISTS trading_signals_v2 (
    id TEXT PRIMARY KEY,
    signal_type TEXT NOT NULL,           -- 'long' (做多) 或 'short' (做空)
    signal_name TEXT NOT NULL,           -- 信号名称，如 "MACD金叉"
    category TEXT NOT NULL,              -- 分类：convergence, macd_cross, rsi_oversold, sar_signal 等
    description TEXT,                    -- 信号描述
    conditions TEXT NOT NULL,            -- JSON 格式的条件配置
    priority INTEGER DEFAULT 50,         -- 优先级 (0-100)
    is_enabled INTEGER DEFAULT 1,        -- 是否启用
    success_rate REAL,                   -- 成功率（可选，用于统计）
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- 等级历史追踪表（记录币种达到过的最高等级）
CREATE TABLE IF NOT EXISTS coin_level_history (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    level INTEGER NOT NULL,              -- 达到的等级 (1-6)
    reached_at TEXT NOT NULL,            -- 达到该等级的时间
    expired_at TEXT,                     -- 过期时间（达到后7天）
    is_active INTEGER DEFAULT 1,         -- 是否仍然有效（7天内）
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_signals_v2_type ON trading_signals_v2(signal_type);
CREATE INDEX IF NOT EXISTS idx_trading_signals_v2_enabled ON trading_signals_v2(is_enabled);
CREATE INDEX IF NOT EXISTS idx_trading_signals_v2_category ON trading_signals_v2(category);

CREATE INDEX IF NOT EXISTS idx_coin_level_history_symbol ON coin_level_history(symbol);
CREATE INDEX IF NOT EXISTS idx_coin_level_history_active ON coin_level_history(is_active);
CREATE INDEX IF NOT EXISTS idx_coin_level_history_reached ON coin_level_history(reached_at DESC);

-- 插入默认的做多信号（从操作提示中提取）
INSERT INTO trading_signals_v2 (id, signal_type, signal_name, category, description, conditions, priority, is_enabled, created_at) VALUES
-- 1. 趋同收敛信号
('long_001', 'long', '趋同收敛', 'convergence', '5根K线趋同2次变成收敛，统计0-5次收敛', 
 '{"period":5, "count":2, "type":"convergence"}', 100, 1, datetime('now')),

-- 2. MACD 金叉信号
('long_002', 'long', 'MACD金叉', 'macd_cross', 'MACD线向上穿越信号线（金叉），看涨信号',
 '{"indicator":"macd", "fast":12, "slow":26, "signal":9}', 95, 1, datetime('now')),

-- 3. RSI 超卖信号
('long_003', 'long', 'RSI超卖', 'rsi_oversold', 'RSI指数低于30，超卖区域，可能反弹',
 '{"indicator":"rsi", "period":14, "threshold":30}', 90, 1, datetime('now')),

-- 4. SAR 信号看涨
('long_004', 'long', 'SAR看涨信号', 'sar_signal', 'SAR转到K线下方，表明趋势可能转为上涨',
 '{"indicator":"sar", "af_start":0.02, "af_increment":0.02, "af_max":0.2}', 85, 1, datetime('now')),

-- 5. 基于操作提示的买入信号
('long_005', 'long', '操作提示买入', 'action_hint', '系统操作提示显示"买入"信号',
 '{"source":"operation_hints", "action":"buy"}', 80, 1, datetime('now'));

-- 插入默认的做空信号
INSERT INTO trading_signals_v2 (id, signal_type, signal_name, category, description, conditions, priority, is_enabled, created_at) VALUES
-- 1. MACD 死叉信号
('short_001', 'short', 'MACD死叉', 'macd_cross', 'MACD线向下穿越信号线（死叉），看跌信号',
 '{"indicator":"macd", "fast":12, "slow":26, "signal":9}', 95, 1, datetime('now')),

-- 2. RSI 超买信号
('short_002', 'short', 'RSI超买', 'rsi_overbought', 'RSI指数高于70，超买区域，可能回调',
 '{"indicator":"rsi", "period":14, "threshold":70}', 90, 1, datetime('now')),

-- 3. SAR 信号看跌
('short_003', 'short', 'SAR看跌信号', 'sar_signal', 'SAR转到K线上方，表明趋势可能转为下跌',
 '{"indicator":"sar", "af_start":0.02, "af_increment":0.02, "af_max":0.2}', 85, 1, datetime('now')),

-- 4. 基于操作提示的卖出信号
('short_004', 'short', '操作提示卖出', 'action_hint', '系统操作提示显示"卖出"信号',
 '{"source":"operation_hints", "action":"sell"}', 80, 1, datetime('now'));
