#!/bin/bash

# 批量更新所有币种的10格比价数据
# 这个脚本会为每个币种调用API，触发计算，然后将结果保存到数据库

symbols=("BTC" "ETH" "BNB" "SOL" "XRP" "DOGE" "ADA" "AVAX" "DOT" "MATIC" "LTC" "LINK" "UNI" "ATOM" "ETC" "XLM" "NEAR" "APT" "ARB" "OP" "FIL" "LDO" "IMX" "STX" "MKR" "INJ" "RUNE" "HBAR" "TAO" "BCH" "TRX" "TON" "SUI")

echo "🚀 开始批量更新所有币种的10格比价数据..."
echo ""

total=${#symbols[@]}
success=0
failed=0

for symbol in "${symbols[@]}"; do
  echo "🔄 处理 $symbol..."
  
  # 调用API获取K线数据（这会触发计算）
  response=$(curl -s "http://127.0.0.1:3000/api/kline/$symbol/indicators?timeframe=5m&limit=1000")
  
  if echo "$response" | grep -q '"success":true'; then
    echo "  ✅ $symbol 成功"
    ((success++))
  else
    echo "  ❌ $symbol 失败"
    ((failed++))
  fi
  
  # 避免请求过快
  sleep 0.5
done

echo ""
echo "📊 统计结果:"
echo "─────────────────────────────────"
echo "总币种数: $total"
echo "成功: $success"
echo "失败: $failed"
echo ""
echo "✨ 批量更新完成！"
