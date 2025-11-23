#!/bin/bash

# 清除旧快照数据并触发重新同步
# Clear old snapshot data and trigger fresh sync
#
# Usage: bash scripts/refresh_snapshots.sh [SERVER_URL]

set -e  # Exit on error

# 服务器URL (默认使用用户提供的地址)
SERVER_URL="${1:-https://3000-i9le1hvubjby1v1ek0v54-583b4d74.sandbox.novita.ai}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 开始刷新信号匹配快照数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 服务器地址: $SERVER_URL"
echo ""

# 步骤 1: 清除旧快照数据
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 步骤 1: 清除旧快照数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DELETE_RESPONSE=$(curl -s -X DELETE "$SERVER_URL/api/signal-matching/snapshot" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | grep -v "HTTP_STATUS")

if [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 旧快照数据已清除"
    echo ""
    echo "响应详情:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ 清除失败 (HTTP状态码: ${HTTP_STATUS:-无响应})"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY"
    exit 1
fi

echo ""

# 步骤 2: 触发K线同步 (会自动保存快照)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 步骤 2: 触发K线同步 (自动生成新快照)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ 正在同步，这可能需要几分钟..."
echo ""

SYNC_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/kline/sync?timeframe=5m&limit=300" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  --max-time 300)  # 5分钟超时

HTTP_STATUS=$(echo "$SYNC_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$SYNC_RESPONSE" | grep -v "HTTP_STATUS")

if [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ K线同步完成，新快照已生成"
    echo ""
    echo "同步结果:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ 同步失败 (HTTP状态码: ${HTTP_STATUS:-无响应})"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY"
    exit 1
fi

echo ""

# 步骤 3: 验证新数据
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 步骤 3: 验证新数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

OVERVIEW_RESPONSE=$(curl -s -X GET "$SERVER_URL/api/signal-matching/overview" \
  -H "Content-Type: application/json")

echo "系统概览:"
echo "$OVERVIEW_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$OVERVIEW_RESPONSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 刷新完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 请访问以下地址查看新数据:"
echo "   $SERVER_URL/signal-matching"
echo ""
echo "💡 新数据特点:"
echo "   ✓ operation_tip: '抄底做多' 或 '顶部做空' (基于30天统计)"
echo "   ✓ 所有32个字段: 时间、排名、起涨跌、操作、当天、10格..."
echo "   ✓ 基于300根K线的精确计算逻辑"
echo ""
echo "🔄 如果数据不正确，请检查:"
echo "   1. 服务器是否已部署最新代码"
echo "   2. 数据库迁移是否已执行"
echo "   3. K线数据是否已正确同步"
echo ""
