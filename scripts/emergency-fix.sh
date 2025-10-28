#!/bin/bash

# 紧急修复脚本 - 服务器故障应对
# 用途：当服务出现问题时的快速修复方案

echo "🚨 紧急修复脚本启动"
echo ""

# 核心逻辑1：先备份
echo "📦 核心逻辑1：执行数据库备份..."
npm run db:backup
echo ""

# 核心逻辑7：健康检查
echo "🔍 核心逻辑7：服务器健康检查..."
echo ""

echo "1️⃣ 检查PM2服务状态..."
pm2 status
echo ""

echo "2️⃣ 检查端口3000占用..."
lsof -i :3000 || echo "端口3000未被占用"
echo ""

echo "3️⃣ 测试本地API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/coins --max-time 5)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 本地API正常 (HTTP $HTTP_CODE)"
else
    echo "❌ 本地API异常 (HTTP $HTTP_CODE)"
fi
echo ""

echo "4️⃣ 检查最近错误日志..."
pm2 logs crypto-monitor --nostream --lines 10 --err
echo ""

# 提供修复选项
echo "🔧 修复选项："
echo ""
echo "选项1：重启主服务"
echo "  pm2 restart crypto-monitor"
echo ""
echo "选项2：完全重启（清理端口）"
echo "  fuser -k 3000/tcp && pm2 delete crypto-monitor && pm2 start ecosystem.config.cjs --only crypto-monitor"
echo ""
echo "选项3：重启所有服务"
echo "  pm2 restart all"
echo ""
echo "选项4：恢复数据库备份"
echo "  npm run db:restore"
echo ""

# 等待用户选择
read -p "请选择修复方案 (1-4, 或按Enter跳过): " choice

case $choice in
    1)
        echo "执行选项1：重启主服务..."
        pm2 restart crypto-monitor
        ;;
    2)
        echo "执行选项2：完全重启..."
        fuser -k 3000/tcp 2>/dev/null || true
        pm2 delete crypto-monitor
        pm2 start ecosystem.config.cjs --only crypto-monitor
        ;;
    3)
        echo "执行选项3：重启所有服务..."
        pm2 restart all
        ;;
    4)
        echo "⚠️  警告：将恢复最新备份，可能丢失最近的数据！"
        read -p "确认恢复备份？(输入YES继续): " confirm
        if [ "$confirm" = "YES" ]; then
            npm run db:restore
        else
            echo "❌ 取消恢复"
        fi
        ;;
    *)
        echo "跳过修复"
        ;;
esac

echo ""
echo "✅ 紧急修复脚本完成"
