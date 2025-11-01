#!/bin/bash

# 守护进程 - 确保健康监控始终运行

MONITOR_SCRIPT="/home/user/webapp/scripts/health-monitor.sh"
LOG_FILE="/home/user/webapp/watchdog.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查健康监控是否运行
check_monitor() {
    count=$(ps aux | grep "health-monitor.sh" | grep -v grep | wc -l)
    if [ "$count" -lt 1 ]; then
        log "⚠️ 健康监控未运行，准备重启"
        return 1
    fi
    return 0
}

# 启动健康监控
start_monitor() {
    log "🚀 启动健康监控..."
    nohup bash -c "while true; do $MONITOR_SCRIPT; sleep 240; done" >> /home/user/webapp/health-monitor.log 2>&1 &
    new_pid=$!
    log "✅ 健康监控已启动 (PID: $new_pid)"
}

# 主循环
log "=========================================="
log "🐕 守护进程启动"
log "=========================================="

while true; do
    if ! check_monitor; then
        start_monitor
    fi
    sleep 300  # 每5分钟检查一次守护进程
done
