#!/bin/bash

# 清除旧快照数据并触发自动同步
# Clear old snapshot data and trigger automatic sync

echo "🚀 开始刷新信号匹配快照数据..."
echo ""

# 服务器URL (根据实际情况修改)
SERVER_URL="${1:-https://3000-i9le1hvubjby1v1ek0v54-583b4d74.sandbox.novita.ai}"

echo "📍 服务器地址: $SERVER_URL"
echo ""

# 步骤 1: 清除数据库中的旧数据
echo "📊 步骤 1: 运行数据清除脚本..."
cd /home/user/webapp
npx tsx scripts/refresh_snapshot_data.ts

if [ $? -ne 0 ]; then
    echo "❌ 数据清除失败"
    exit 1
fi

echo ""
echo "✅ 旧数据已清除"
echo ""

# 步骤 2: 触发同步 (可选 - 如果服务器正在运行)
echo "📡 步骤 2: 尝试触发自动同步..."
echo "   正在调用: POST $SERVER_URL/api/kline/sync"

SYNC_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/kline/sync" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  2>/dev/null)

HTTP_STATUS=$(echo "$SYNC_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 同步请求已发送成功"
    echo ""
    echo "$SYNC_RESPONSE" | grep -v "HTTP_STATUS"
else
    echo "⚠️  无法自动触发同步 (服务器可能未运行)"
    echo "   HTTP状态码: ${HTTP_STATUS:-无响应}"
    echo ""
    echo "📝 请手动触发同步："
    echo "   1. 确保服务器正在运行"
    echo "   2. 访问: $SERVER_URL/signal-matching"
    echo "   3. 点击页面上的同步按钮"
fi

echo ""
echo "🎉 刷新流程完成！"
echo ""
echo "📊 验证新数据："
echo "   访问: $SERVER_URL/signal-matching"
echo "   检查: operation_tip 列应显示 '抄底做多' 或 '顶部做空'"
echo "   验证: 所有32个字段都有正确的值"
echo ""
