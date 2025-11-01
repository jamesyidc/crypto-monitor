#!/bin/bash

# 批量回填所有币种的技术指标
# 用法: bash backfill_all_symbols.sh

API_URL="http://localhost:3000"

# 获取所有币种列表
echo "📊 获取币种列表..."
SYMBOLS=$(curl -s "${API_URL}/api/coins" | jq -r '.[].symbol')

if [ -z "$SYMBOLS" ]; then
  echo "❌ 未找到任何币种"
  exit 1
fi

TOTAL=$(echo "$SYMBOLS" | wc -l)
CURRENT=0
SUCCESS=0
FAILED=0

echo "✅ 找到 ${TOTAL} 个币种，开始回填..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for symbol in $SYMBOLS; do
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "[$CURRENT/$TOTAL] 🔄 正在处理 ${symbol}..."
  
  RESULT=$(curl -s -X POST "${API_URL}/api/kline/backfill-operation-tips" \
    -H "Content-Type: application/json" \
    -d "{\"symbol\":\"${symbol}\",\"timeframe\":\"5m\",\"limit\":10000}")
  
  SUCCESS_STATUS=$(echo "$RESULT" | jq -r '.success')
  
  if [ "$SUCCESS_STATUS" = "true" ]; then
    UPDATED=$(echo "$RESULT" | jq -r '.summary.updated')
    DURATION=$(echo "$RESULT" | jq -r '.summary.duration')
    echo "  ✅ 成功：更新 ${UPDATED} 条记录，耗时 ${DURATION}"
    SUCCESS=$((SUCCESS + 1))
  else
    ERROR=$(echo "$RESULT" | jq -r '.error')
    echo "  ❌ 失败：${ERROR}"
    FAILED=$((FAILED + 1))
  fi
  
  # 避免请求过快
  sleep 0.5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 回填完成！"
echo "  总计: ${TOTAL} 个币种"
echo "  成功: ${SUCCESS}"
echo "  失败: ${FAILED}"
