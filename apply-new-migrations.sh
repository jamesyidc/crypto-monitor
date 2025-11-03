#!/bin/bash
# 应用所有新的迁移到生产数据库

echo "======================================"
echo "应用新迁移到生产数据库"
echo "======================================"
echo ""

echo "⏳ [1/3] 应用迁移 0043: 历史级别过滤器..."
wrangler d1 execute crypto-trading-db --remote --file=migrations/0043_add_include_historical_levels_to_strategies.sql
if [ $? -eq 0 ]; then
    echo "✅ 迁移 0043 应用成功！"
else
    echo "❌ 迁移 0043 应用失败！"
    exit 1
fi

echo ""
echo "⏳ [2/3] 应用迁移 0044: 支撑线买入信号..."
wrangler d1 execute crypto-trading-db --remote --file=migrations/0044_add_support_line_buy_signal.sql
if [ $? -eq 0 ]; then
    echo "✅ 迁移 0044 应用成功！"
else
    echo "❌ 迁移 0044 应用失败！"
    exit 1
fi

echo ""
echo "⏳ [3/4] 应用迁移 0045: 陷阱信号..."
wrangler d1 execute crypto-trading-db --remote --file=migrations/0045_add_trap_signals.sql
if [ $? -eq 0 ]; then
    echo "✅ 迁移 0045 应用成功！"
else
    echo "❌ 迁移 0045 应用失败！"
    exit 1
fi

echo ""
echo "⏳ [4/4] 应用迁移 0046: 价格类型选择..."
wrangler d1 execute crypto-trading-db --remote --file=migrations/0046_add_price_type_to_strategies.sql
if [ $? -eq 0 ]; then
    echo "✅ 迁移 0046 应用成功！"
else
    echo "❌ 迁移 0046 应用失败！"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ 所有迁移应用完成！"
echo "======================================"
echo ""
echo "现在验证信号是否已添加..."
echo ""

# 验证信号
echo "📊 检查新增的信号："
wrangler d1 execute crypto-trading-db --remote --command "SELECT id, signal_name, signal_type, entry_exit, is_enabled FROM trading_signals_v2 WHERE id IN ('long_support_001', 'long_exit_trap_001', 'short_entry_trap_001', 'long_entry_trap_002', 'short_exit_trap_002') ORDER BY id;"

echo ""
echo "📈 统计信号总数："
wrangler d1 execute crypto-trading-db --remote --command "SELECT COUNT(*) as total_signals, SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) as enabled_signals FROM trading_signals_v2;"

echo ""
echo "======================================"
echo "🎉 完成！请刷新网页查看新信号。"
echo "======================================"
