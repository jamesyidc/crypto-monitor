-- 添加轮次对比字段
-- 用于记录每轮相对上一轮的涨跌幅，方便查询历史记录

ALTER TABLE coin_round_details ADD COLUMN previous_round_time DATETIME;
ALTER TABLE coin_round_details ADD COLUMN change_vs_prev_round REAL;
ALTER TABLE coin_round_details ADD COLUMN is_surge_vs_prev INTEGER DEFAULT 0;
ALTER TABLE coin_round_details ADD COLUMN is_crash_vs_prev INTEGER DEFAULT 0;

-- 创建索引以便快速查询
CREATE INDEX IF NOT EXISTS idx_coin_round_details_prev_round ON coin_round_details(previous_round_time);
CREATE INDEX IF NOT EXISTS idx_coin_round_details_change_vs_prev ON coin_round_details(change_vs_prev_round);
