#!/bin/bash

# 🛡️ 进程守护者启动脚本
# 
# 功能：
# 1. 启动进程守护者
# 2. 确保所有被监控的进程正常运行
# 3. 显示Web控制台访问地址

echo "=========================================="
echo "🛡️ 启动进程守护者 (Process Guardian)"
echo "=========================================="
echo ""

# 切换到项目目录
cd /home/user/webapp

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 停止旧的守护者实例（如果存在）
pm2 delete process-guardian 2>/dev/null || true

# 启动守护者
echo "🚀 启动进程守护者..."
pm2 start process-guardian.js --name process-guardian

# 等待2秒让守护者初始化
sleep 2

# 显示守护者状态
echo ""
echo "✅ 进程守护者已启动！"
echo ""
echo "📊 Web控制台地址："
echo "   http://localhost:3001"
echo ""
echo "💡 查看守护者日志："
echo "   pm2 logs process-guardian"
echo ""
echo "💡 查看所有进程状态："
echo "   pm2 list"
echo ""
echo "💡 停止守护者："
echo "   pm2 stop process-guardian"
echo ""
echo "=========================================="
echo ""

# 自动打开浏览器（可选）
# open http://localhost:3001 2>/dev/null || xdg-open http://localhost:3001 2>/dev/null || true
