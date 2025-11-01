-- Clear all existing ATH/ATL-based signals (抄底做多 and 顶部做空)
-- These signals will be recalculated with corrected logic
UPDATE kline_data 
SET operation_tip = NULL 
WHERE operation_tip IN ('抄底做多', '顶部做空');
