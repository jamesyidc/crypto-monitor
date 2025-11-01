-- 清除旧的抄底做多和顶部做空信号，并用新规则重新计算
-- Migration: 0038_recalculate_ath_atl_signals_with_rsi.sql

-- 步骤1: 清除所有"抄底做多"和"顶部做空"的operation_tip
-- 原因：这些信号需要用新的RSI5条件重新计算
UPDATE kline_data 
SET operation_tip = NULL 
WHERE operation_tip IN ('抄底做多', '顶部做空');

-- 步骤2: 记录清除的数量
-- (SQLite不支持直接返回删除行数，但可以通过SELECT查询验证)

-- 注意：新的计算逻辑已在后端代码中实现
-- 新规则：
-- 1. 抄底做多 = (距ATH跌幅 / 距ATL涨幅) > 阈值 且 RSI5 < 35
-- 2. 顶部做空 = (距ATL涨幅 / 距ATH跌幅) > 阈值 且 RSI5 > 65
-- 
-- 重新计算将通过API端点触发：
-- GET /api/kline-signals/:symbol?recalculate=true
