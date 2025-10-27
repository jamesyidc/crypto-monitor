-- 添加Telegram发送标记字段
-- 用于跟踪哪些信号已经发送到Telegram，避免重复发送

-- 为trading_signals表添加telegram_sent字段
ALTER TABLE trading_signals ADD COLUMN telegram_sent INTEGER DEFAULT 0;

-- 为alert_signals表添加telegram_sent字段
ALTER TABLE alert_signals ADD COLUMN telegram_sent INTEGER DEFAULT 0;

-- 创建索引以优化查询未发送的信号
CREATE INDEX IF NOT EXISTS idx_trading_signals_telegram_sent ON trading_signals(telegram_sent, created_at);
CREATE INDEX IF NOT EXISTS idx_alert_signals_telegram_sent ON alert_signals(telegram_sent, created_at);
