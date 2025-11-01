#!/bin/bash

# 快速状态查看工具

echo "=========================================="
echo "🎯 加密货币监控系统状态"
echo "=========================================="
echo ""

# 1. Web服务
echo "1️⃣  Web服务 (3000端口):"
http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/coins --max-time 3)
if [ "$http_code" = "200" ]; then
    echo "   ✅ 正常运行 (HTTP $http_code)"
else
    echo "   ❌ 服务异常 (HTTP $http_code)"
fi
echo ""

# 2. PM2服务
echo "2️⃣  PM2服务状态:"
pm2 list | grep -E "crypto-monitor|analysis-scheduler|kline-scheduler|signal-scheduler" | awk '{printf "   %s: %s\n", $4, $18}'
echo ""

# 3. 数据库
echo "3️⃣  数据库状态:"
if [ -d "/home/user/webapp/.wrangler/state/v3/d1" ]; then
    echo "   ✅ 数据库文件存在"
else
    echo "   ❌ 数据库文件缺失"
fi
echo ""

# 4. 监控进程
echo "4️⃣  自动监控:"
monitor_count=$(ps aux | grep "health-monitor.sh" | grep -v grep | wc -l)
watchdog_count=$(ps aux | grep "watchdog.sh" | grep -v grep | wc -l)
echo "   健康监控: $monitor_count 个进程"
echo "   守护进程: $watchdog_count 个进程"
echo ""

# 5. 系统资源
echo "5️⃣  系统资源:"
echo "   内存: $(free -h | awk 'NR==2{printf "%s/%s (%s)", $3, $2, int($3*100/$2)"%"}')"
echo "   磁盘: $(df -h /home/user | awk 'NR==2{printf "%s/%s (%s)", $3, $2, $5}')"
echo ""

# 6. 最近日志
echo "6️⃣  最近监控记录:"
tail -5 /home/user/webapp/health-monitor.log 2>/dev/null | grep "✅ 所有检查通过" | tail -1
echo ""

echo "=========================================="
echo "⏰ 检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
