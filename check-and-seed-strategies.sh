#!/bin/bash

echo "🔍 检查远程数据库中的策略..."
echo ""
echo "1. 当前策略列表："
wrangler d1 execute crypto-monitor-db --remote --command "SELECT id, strategy_name, strategy_type, priority, is_enabled FROM trading_strategies ORDER BY priority DESC" 2>/dev/null || echo "❌ 无法连接到远程数据库"

echo ""
echo "2. 策略数量统计："
wrangler d1 execute crypto-monitor-db --remote --command "SELECT COUNT(*) as count FROM trading_strategies" 2>/dev/null || echo "❌ 无法连接到远程数据库"

echo ""
echo "3. 启用的策略："
wrangler d1 execute crypto-monitor-db --remote --command "SELECT strategy_name, strategy_type FROM trading_strategies WHERE is_enabled = 1" 2>/dev/null || echo "❌ 无法连接到远程数据库"

echo ""
echo "📝 如果上面显示没有策略或策略数量为0，请运行以下命令初始化策略："
echo "   wrangler d1 execute crypto-monitor-db --remote --file=migrations/0048_seed_trading_strategies.sql"
