#!/bin/bash
# 检查 kline_data 表中的 operation_tip 字段

echo "======================================"
echo "检查 kline_data 表中的操作提示"
echo "======================================"
echo ""

echo "📊 查询所有唯一的 operation_tip 值："
wrangler d1 execute crypto-trading-db --remote --command "
  SELECT DISTINCT operation_tip, COUNT(*) as count
  FROM kline_data
  WHERE operation_tip IS NOT NULL AND operation_tip != ''
  GROUP BY operation_tip
  ORDER BY operation_tip;
"

echo ""
echo "======================================"
echo "✅ 完成"
echo "======================================"
