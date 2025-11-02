-- 为 coin_round_details 表添加 change_today 字段
-- 用于存储OKEx API返回的24小时涨跌幅数据，确保历史回看数据准确

-- 检查并添加 change_today 字段
ALTER TABLE coin_round_details ADD COLUMN change_today REAL;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_coin_round_details_change_today 
ON coin_round_details(change_today);

-- 验证字段添加
SELECT 'change_today 字段已添加到 coin_round_details 表' as message;
