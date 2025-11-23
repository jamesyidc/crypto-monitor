#!/bin/bash
# 检查价格类型字段是否存在
# Check if price type columns exist

echo "======================================"
echo "检查 trading_strategies 表结构"
echo "Check trading_strategies table schema"
echo "======================================"
echo ""

echo "📊 获取完整表结构..."
echo ""
wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);"

echo ""
echo "======================================"
echo "🔍 检查价格类型相关字段"
echo "======================================"
echo ""

echo "查找价格类型字段..."
RESULT=$(wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);" | grep -E "entry_price_type|exit_price_type|entry_specified_price|exit_specified_price")

if [ -z "$RESULT" ]; then
    echo "❌ 未找到任何价格类型字段！"
    echo ""
    echo "缺失的字段："
    echo "  - entry_price_type"
    echo "  - entry_specified_price"
    echo "  - exit_price_type"
    echo "  - exit_specified_price"
    echo ""
    echo "建议操作："
    echo "  执行: ./apply-migration-0046-step-by-step.sh"
else
    echo "✅ 找到以下价格类型字段："
    echo "$RESULT"
    echo ""
    
    FIELD_COUNT=$(echo "$RESULT" | wc -l)
    echo "检测到 $FIELD_COUNT/4 个字段"
    
    if [ "$FIELD_COUNT" -eq 4 ]; then
        echo ""
        echo "🎉 所有价格类型字段都已存在！"
        echo ""
        echo "如果仍然遇到错误，请："
        echo "  1. 硬刷新浏览器 (Ctrl+Shift+R)"
        echo "  2. 清除浏览器缓存"
        echo "  3. 重新部署 Worker: npm run deploy"
    else
        echo ""
        echo "⚠️  部分字段缺失！"
        echo ""
        echo "建议操作："
        echo "  执行: ./apply-migration-0046-step-by-step.sh"
    fi
fi

echo ""
echo "======================================"
echo "🔍 检查索引"
echo "======================================"
echo ""

wrangler d1 execute crypto-trading-db --remote --command "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='trading_strategies';" | grep -E "idx_strategies_entry_price_type|idx_strategies_exit_price_type"

echo ""
echo "======================================"
echo "检查完成"
echo "======================================"
