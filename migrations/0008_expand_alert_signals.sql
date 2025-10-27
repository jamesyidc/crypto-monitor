-- 扩展alert_signals表以包含完整K线数据
ALTER TABLE alert_signals ADD COLUMN open_price REAL;
ALTER TABLE alert_signals ADD COLUMN high_price REAL;
ALTER TABLE alert_signals ADD COLUMN low_price REAL;
ALTER TABLE alert_signals ADD COLUMN close_price REAL;
ALTER TABLE alert_signals ADD COLUMN boll_upper REAL;
ALTER TABLE alert_signals ADD COLUMN boll_middle REAL;
ALTER TABLE alert_signals ADD COLUMN boll_lower REAL;
ALTER TABLE alert_signals ADD COLUMN rsi_1h REAL;
ALTER TABLE alert_signals ADD COLUMN sar_value REAL;
ALTER TABLE alert_signals ADD COLUMN sar_direction TEXT;
