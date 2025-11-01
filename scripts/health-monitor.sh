#!/bin/bash

# 健康监控脚本 - 每4分钟检查一次系统状态

LOG_FILE="/home/user/webapp/health-monitor.log"
MAX_LOG_SIZE=1048576  # 1MB

# 设置北京时间
export TZ='Asia/Shanghai'

# 记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
    
    # 限制日志大小
    if [ -f "$LOG_FILE" ]; then
        size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)
        if [ "$size" -gt "$MAX_LOG_SIZE" ]; then
            tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp"
            mv "$LOG_FILE.tmp" "$LOG_FILE"
        fi
    fi
}

# 检查3000端口
check_port() {
    if lsof -i:3000 >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        log "✅ 端口3000正常"
        return 0
    else
        log "❌ 端口3000无响应"
        return 1
    fi
}

# 检查Web服务
check_web() {
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/coins --max-time 10)
    if [ "$response" != "200" ]; then
        log "❌ Web服务异常 (HTTP $response)"
        return 1
    fi
    log "✅ Web服务正常 (HTTP 200)"
    return 0
}

# 检查数据库
check_database() {
    cd /home/user/webapp
    result=$(npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) as count FROM coins" 2>&1)
    if echo "$result" | grep -q "count"; then
        count=$(echo "$result" | grep -o '"count": [0-9]*' | grep -o '[0-9]*')
        log "✅ 数据库正常 (coins表: $count 条记录)"
        return 0
    else
        log "❌ 数据库查询失败: $result"
        return 1
    fi
}

# 检查PM2服务
check_pm2() {
    pm2_status=$(pm2 jlist 2>/dev/null)
    if [ $? -ne 0 ]; then
        log "❌ PM2无响应"
        return 1
    fi
    
    # 检查crypto-monitor服务
    status=$(echo "$pm2_status" | grep -o '"name":"crypto-monitor".*"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3)
    if [ "$status" != "online" ]; then
        log "❌ crypto-monitor服务状态: $status"
        return 1
    fi
    log "✅ PM2服务正常 (crypto-monitor: online)"
    return 0
}

# 重启服务
restart_service() {
    log "🔄 尝试重启服务..."
    
    # 杀死3000端口
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 2
    
    # 重启PM2
    cd /home/user/webapp
    pm2 start ecosystem.config.cjs 2>&1 | tee -a "$LOG_FILE"
    
    sleep 5
    
    # 验证重启
    if check_port && check_web; then
        log "✅ 服务重启成功"
        return 0
    else
        log "❌ 服务重启失败"
        return 1
    fi
}

# 主监控循环
main() {
    log "=========================================="
    log "🔍 开始健康检查"
    
    port_ok=false
    web_ok=false
    db_ok=false
    pm2_ok=false
    
    # 检查各项服务
    check_port && port_ok=true
    check_web && web_ok=true
    check_database && db_ok=true
    check_pm2 && pm2_ok=true
    
    # 如果任何检查失败，尝试重启
    if [ "$port_ok" = false ] || [ "$web_ok" = false ] || [ "$pm2_ok" = false ]; then
        log "⚠️ 检测到异常，准备重启服务"
        restart_service
    else
        log "✅ 所有检查通过"
    fi
    
    # 显示系统资源
    log "📊 系统资源:"
    log "   内存: $(free -h | awk 'NR==2{printf "%.1fG/%.1fG (%.0f%%)", $3/1024, $2/1024, $3*100/$2}')"
    log "   磁盘: $(df -h /home/user | awk 'NR==2{printf "%s/%s (%s)", $3, $2, $5}')"
    
    log "✅ 本次检查完成"
    
    # 导出日志到Web目录
    tail -100 "$LOG_FILE" > /home/user/webapp/dist/static/monitor-log-view.txt 2>/dev/null || true
    tail -100 "$LOG_FILE" > /home/user/webapp/public/static/monitor-log-view.txt 2>/dev/null || true
}

# 执行监控
main
