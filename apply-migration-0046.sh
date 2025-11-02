#!/bin/bash
# 应用迁移 0046: 添加价格类型选择字段
# Apply Migration 0046: Add price type selection fields

echo "======================================"
echo "应用迁移 0046: 价格类型选择"
echo "Apply Migration 0046: Price Type Selection"
echo "======================================"
echo ""

echo "⏳ 正在应用迁移到生产数据库..."
echo "⏳ Applying migration to production database..."
echo ""

wrangler d1 execute crypto-trading-db --remote --file=migrations/0046_add_price_type_to_strategies.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 迁移 0046 应用成功！"
    echo "✅ Migration 0046 applied successfully!"
    echo ""
    
    echo "📊 验证新字段..."
    echo "📊 Verifying new columns..."
    echo ""
    
    # 查看 trading_strategies 表结构
    wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);" | grep -E "entry_price_type|exit_price_type|entry_specified_price|exit_specified_price"
    
    echo ""
    echo "======================================"
    echo "🎉 完成！现在可以使用价格类型选择功能了。"
    echo "🎉 Done! Price type selection feature is now available."
    echo "======================================"
    echo ""
    echo "💡 提示：刷新网页，创建或编辑策略时可以选择买点/卖点价格类型。"
    echo "💡 Tip: Refresh the page and you can now select price types when creating/editing strategies."
else
    echo ""
    echo "❌ 迁移 0046 应用失败！"
    echo "❌ Migration 0046 failed!"
    echo ""
    echo "可能的原因："
    echo "Possible reasons:"
    echo "1. 字段已经存在（迁移已经应用过）"
    echo "   Fields already exist (migration already applied)"
    echo "2. 数据库连接问题"
    echo "   Database connection issue"
    echo "3. 权限问题"
    echo "   Permission issue"
    echo ""
    echo "请检查错误信息并重试。"
    echo "Please check the error message and try again."
    exit 1
fi
