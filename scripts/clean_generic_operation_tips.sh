#!/bin/bash

# 清理数据库中所有不精确的操作提示
# Clean generic/vague operation tips from database
#
# 删除的值：做多、做空、观望 (通用的、不精确的)
# 保留的值：抄底做多、顶部做空、通用卖点

set -e

SERVER_URL="${1:-https://3000-i9le1hvubjby1v1ek0v54-583b4d74.sandbox.novita.ai}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 清理不精确的操作提示"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 服务器地址: $SERVER_URL"
echo ""
echo "❌ 将删除的值："
echo "   - 做多 (通用，不精确)"
echo "   - 做空 (通用，不精确)"
echo "   - 观望 (无意义)"
echo ""
echo "✅ 将保留的值："
echo "   - 抄底做多 (精确底部信号)"
echo "   - 顶部做空 (精确顶部信号)"
echo "   - 通用卖点 (用户设置的信号)"
echo ""

# 方法1: 使用API (推荐)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 方法1: 通过API清理"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 先查看当前有多少条快照记录
OVERVIEW=$(curl -s "$SERVER_URL/api/signal-matching/overview")
echo "当前快照概览:"
echo "$OVERVIEW" | python3 -m json.tool 2>/dev/null || echo "$OVERVIEW"
echo ""

# 删除所有快照（包含不精确的提示）
echo "🗑️  正在删除所有旧快照..."
DELETE_RESPONSE=$(curl -s -X DELETE "$SERVER_URL/api/signal-matching/snapshot" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | grep -v "HTTP_STATUS")

if [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 旧快照已删除"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ 删除失败 (HTTP: ${HTTP_STATUS:-无响应})"
    echo "$RESPONSE_BODY"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📡 方法2: 使用 wrangler d1 命令"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "如果API不可用，请手动执行："
    echo ""
    echo "# 查看数据库名称"
    echo "cd /home/user/webapp"
    echo "cat wrangler.toml | grep database_name"
    echo ""
    echo "# 删除快照表中的所有记录"
    echo "npx wrangler d1 execute YOUR_DB_NAME --remote \\"
    echo "  --command \"DELETE FROM kline_snapshot_latest\""
    echo ""
    echo "# 清理 kline_data 表中的不精确提示"
    echo "npx wrangler d1 execute YOUR_DB_NAME --remote \\"
    echo "  --command \"UPDATE kline_data SET operation_tip = NULL WHERE operation_tip IN ('做多', '做空', '观望')\""
    echo ""
    exit 1
fi

echo ""

# 触发重新同步
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 触发重新同步（生成精确的操作提示）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SYNC_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/kline/sync?timeframe=5m&limit=300" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  --max-time 300)

HTTP_STATUS=$(echo "$SYNC_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$SYNC_RESPONSE" | grep -v "HTTP_STATUS")

if [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 同步完成"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ 同步失败 (HTTP: ${HTTP_STATUS:-无响应})"
    echo "$RESPONSE_BODY"
fi

echo ""

# 验证结果
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 验证清理结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

OVERVIEW=$(curl -s "$SERVER_URL/api/signal-matching/overview")
echo "新的快照概览:"
echo "$OVERVIEW" | python3 -m json.tool 2>/dev/null || echo "$OVERVIEW"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 清理完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 请访问页面验证:"
echo "   $SERVER_URL/signal-matching"
echo ""
echo "💡 现在会显示:"
echo "   ✓ 抄底做多 - 基于30天统计的精确底部信号"
echo "   ✓ 顶部做空 - 基于30天统计的精确顶部信号"
echo "   ✓ 通用卖点 - 用户设置的卖出信号"
echo ""
echo "❌ 不会再显示:"
echo "   ✗ 做多 (通用的，不精确)"
echo "   ✗ 做空 (通用的，不精确)"
echo "   ✗ 观望 (无意义)"
echo ""
