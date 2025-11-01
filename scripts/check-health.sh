#!/bin/bash

# 快速查看健康状态

echo "=========================================="
echo "📊 最近5次健康检查记录:"
echo "=========================================="
tail -n 50 /home/user/webapp/health-monitor.log | grep "🔍 开始健康检查" -A 7 | tail -40

echo ""
echo "=========================================="
echo "📈 当前系统状态:"
echo "=========================================="
echo "🔸 PM2服务:"
pm2 list | grep -E "name|crypto-monitor|analysis-scheduler|kline-scheduler|signal-scheduler"
echo ""
echo "🔸 端口监听:"
lsof -i:3000 | head -2
echo ""
echo "🔸 Web服务测试:"
curl -s http://localhost:3000/api/coins | head -c 200
echo ""
echo ""
echo "🔸 数据库连接:"
cd /home/user/webapp && npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) FROM coins" 2>&1 | grep -E "count|success"
