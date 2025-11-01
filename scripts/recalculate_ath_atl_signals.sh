#!/bin/bash
# 重新计算所有币种的ATH/ATL信号（使用新的RSI5规则）
# 使用方法: bash scripts/recalculate_ath_atl_signals.sh

echo "🔄 开始重新计算ATH/ATL信号（新规则：RSI5条件）"
echo "======================================"
echo ""

# 服务器地址
SERVER="http://localhost:3000"

# 获取所有需要计算的币种列表
# 这里列出常用的币种，可以根据需要调整
SYMBOLS=(
  "BTC"
  "ETH"
  "BNB"
  "SOL"
  "XRP"
  "ADA"
  "DOGE"
  "AVAX"
  "DOT"
  "MATIC"
  "LINK"
  "UNI"
  "ATOM"
  "LTC"
  "BCH"
  "XLM"
  "FIL"
  "TRX"
  "ETC"
  "NEAR"
)

total=${#SYMBOLS[@]}
current=0
success=0
failed=0

echo "📊 总共需要处理 $total 个币种"
echo ""

for symbol in "${SYMBOLS[@]}"; do
  ((current++))
  echo "[$current/$total] 正在处理: $symbol"
  
  # 调用API获取带指标的K线数据，这会触发信号重新计算
  response=$(curl -s "$SERVER/api/kline/$symbol/indicators?timeframe=5m&limit=300")
  
  # 检查是否成功（indicators endpoint返回 {"success":true} 格式）
  if echo "$response" | grep -q '"success":\s*true'; then
    echo "  ✅ $symbol 计算完成"
    ((success++))
  else
    echo "  ❌ $symbol 计算失败"
    ((failed++))
  fi
  
  # 避免请求过快，稍微延迟
  sleep 0.5
done

echo ""
echo "======================================"
echo "🎉 重新计算完成！"
echo "  成功: $success/$total"
echo "  失败: $failed/$total"
echo ""
echo "💡 新规则已应用:"
echo "  • 抄底做多: ATH/ATL比值 > 阈值 且 RSI5 < 35"
echo "  • 顶部做空: ATH/ATL比值 > 阈值 且 RSI5 > 65"
