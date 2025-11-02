#!/bin/bash
# 检查生产数据库中是否存在新信号

echo "=== 检查 trading_signals_v2 表中的信号 ==="
echo ""
echo "1. 检查支撑买入信号 (long_support_001):"
wrangler d1 execute crypto-trading-db --remote --command "SELECT id, signal_name, signal_type, entry_exit FROM trading_signals_v2 WHERE id = 'long_support_001';"

echo ""
echo "2. 检查急杀诱多信号 (long_exit_trap_001, short_entry_trap_001):"
wrangler d1 execute crypto-trading-db --remote --command "SELECT id, signal_name, signal_type, entry_exit FROM trading_signals_v2 WHERE signal_name = '急杀诱多';"

echo ""
echo "3. 检查空头陷阱信号 (long_entry_trap_002, short_exit_trap_002):"
wrangler d1 execute crypto-trading-db --remote --command "SELECT id, signal_name, signal_type, entry_exit FROM trading_signals_v2 WHERE signal_name = '空头陷阱';"

echo ""
echo "4. 统计所有信号数量:"
wrangler d1 execute crypto-trading-db --remote --command "SELECT COUNT(*) as total_signals FROM trading_signals_v2;"
