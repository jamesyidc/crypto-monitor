-- 交易策略库表
CREATE TABLE IF NOT EXISTS trading_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_name TEXT NOT NULL,           -- 策略名称
  strategy_type TEXT NOT NULL,           -- 策略类型：'long' (做多) 或 'short' (做空)
  priority TEXT NOT NULL DEFAULT 'medium', -- 优先级：'high', 'medium', 'low'
  
  -- 买点配置
  entry_signal_type TEXT,                -- 买点信号类型（如：止盈止损、波段高点等）
  entry_signal_keyword TEXT,             -- 买点关键词
  entry_signal_category TEXT,            -- 买点分类
  entry_signal_template TEXT,            -- 买点模板类型
  
  -- 卖点配置
  exit_signal_type TEXT,                 -- 卖点信号类型
  exit_signal_keyword TEXT,              -- 卖点关键词
  exit_signal_category TEXT,             -- 卖点分类
  exit_signal_template TEXT,             -- 卖点模板类型
  
  -- 分批建仓配置
  position_splits INTEGER DEFAULT 1,     -- 分几次建仓（1-10）
  split_interval_pct REAL DEFAULT 2.0,   -- 加仓间隔百分比（0.5-10%）
  
  -- 风控配置
  stop_loss_pct REAL,                    -- 止损百分比
  take_profit_pct REAL,                  -- 止盈百分比
  max_position_size REAL DEFAULT 100.0,  -- 最大仓位百分比
  
  -- 状态和元数据
  is_enabled INTEGER DEFAULT 1,          -- 是否启用
  description TEXT,                      -- 策略描述
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(strategy_name)
);

CREATE INDEX IF NOT EXISTS idx_strategies_type ON trading_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_strategies_priority ON trading_strategies(priority);
CREATE INDEX IF NOT EXISTS idx_strategies_enabled ON trading_strategies(is_enabled);

-- 策略执行记录表
CREATE TABLE IF NOT EXISTS strategy_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  
  -- 执行信息
  execution_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  signal_type TEXT NOT NULL,             -- 'entry' 或 'exit'
  current_split INTEGER DEFAULT 1,       -- 当前是第几次建仓
  price REAL NOT NULL,
  
  -- 仓位信息
  position_size REAL,                    -- 本次建仓大小
  accumulated_position REAL,             -- 累计仓位
  
  -- 状态
  status TEXT DEFAULT 'pending',         -- 'pending', 'executed', 'cancelled'
  notes TEXT,
  
  FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id)
);

CREATE INDEX IF NOT EXISTS idx_executions_strategy ON strategy_executions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_executions_symbol ON strategy_executions(symbol);
CREATE INDEX IF NOT EXISTS idx_executions_time ON strategy_executions(execution_time);
