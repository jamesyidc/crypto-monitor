#!/bin/bash

# 使用 wrangler d1 命令清除旧快照数据
# Clear old snapshot data using wrangler d1 command

echo "🚀 开始清除旧快照数据..."
echo ""

cd /home/user/webapp

# 获取 D1 数据库名称
DB_NAME=$(grep "database_name" wrangler.toml | head -1 | cut -d'"' -f2)

if [ -z "$DB_NAME" ]; then
    echo "❌ 无法从 wrangler.toml 读取数据库名称"
    exit 1
fi

echo "📊 数据库名称: $DB_NAME"
echo ""

# 检查当前记录数
echo "📈 检查当前快照表记录数..."
CURRENT_COUNT=$(npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command "SELECT COUNT(*) as count FROM kline_snapshot_latest" 2>/dev/null | grep -oE '[0-9]+' | tail -1)

if [ -n "$CURRENT_COUNT" ]; then
    echo "   当前记录数: $CURRENT_COUNT"
else
    echo "   ⚠️  无法获取当前记录数"
fi

echo ""

# 删除旧数据
echo "🗑️  正在删除旧数据..."
DELETE_RESULT=$(npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command "DELETE FROM kline_snapshot_latest" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ 旧数据已清除"
else
    echo "❌ 删除失败:"
    echo "$DELETE_RESULT"
    exit 1
fi

echo ""

# 验证清空
echo "🔍 验证数据清除..."
NEW_COUNT=$(npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command "SELECT COUNT(*) as count FROM kline_snapshot_latest" 2>/dev/null | grep -oE '[0-9]+' | tail -1)

if [ "$NEW_COUNT" = "0" ]; then
    echo "✅ 快照表已完全清空"
else
    echo "⚠️  快照表记录数: ${NEW_COUNT:-未知}"
fi

echo ""
echo "🎉 数据清除完成！"
echo ""
echo "📝 接下来请执行："
echo "   1. 访问: https://3000-i9le1hvubjby1v1ek0v54-583b4d74.sandbox.novita.ai/signal-matching"
echo "   2. 点击页面上的 '同步' 按钮"
echo "   3. 等待同步完成（会自动获取最新K线数据）"
echo "   4. 刷新页面，查看新数据"
echo ""
echo "💡 新数据特点："
echo "   ✓ operation_tip: '抄底做多' 或 '顶部做空' (基于30天统计)"
echo "   ✓ 所有32个字段: 时间、排名、起涨跌、操作、当天..."
echo "   ✓ 基于300根K线的精确计算"
echo ""
