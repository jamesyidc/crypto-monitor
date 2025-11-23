-- Add auto-trading configuration columns to simulated_accounts table

-- Maximum position value (单次买入上限金额)
ALTER TABLE simulated_accounts ADD COLUMN max_position_value REAL DEFAULT NULL;

-- Number of splits for position (分几份交易 - 如果设置了max_position_value，则计算每份金额)
ALTER TABLE simulated_accounts ADD COLUMN position_splits INTEGER DEFAULT 1 CHECK(position_splits >= 1 AND position_splits <= 10);

-- Force protection balance (强制保护金额 - 低于此金额+3%时全部平仓并锁定账户)
ALTER TABLE simulated_accounts ADD COLUMN force_protection_balance REAL DEFAULT NULL;

-- Auto trading enabled flag
ALTER TABLE simulated_accounts ADD COLUMN auto_trading_enabled INTEGER DEFAULT 0 CHECK(auto_trading_enabled IN (0, 1));

-- Auto trading protection triggered flag
ALTER TABLE simulated_accounts ADD COLUMN protection_triggered INTEGER DEFAULT 0 CHECK(protection_triggered IN (0, 1));

-- Comment for clarity
-- max_position_value: 单次买入上限金额 (e.g., 10000.00)
-- position_splits: 分几份交易 (e.g., 5 means split into 5 parts)
-- force_protection_balance: 强制保护金额 (e.g., 50000.00 - will close all when balance reaches 50000 * 1.03)
-- auto_trading_enabled: 自动交易是否启用 (0=disabled, 1=enabled)
-- protection_triggered: 保护机制是否已触发 (0=no, 1=yes - account locked)
