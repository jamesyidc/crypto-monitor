#!/bin/bash

# 单实例监控脚本 - 使用文件锁确保只有一个实例

# 设置北京时间
export TZ='Asia/Shanghai'

LOCK_FILE="/tmp/health-monitor.lock"
LOG_FILE="/home/user/webapp/health-monitor.log"
MONITOR_SCRIPT="/home/user/webapp/scripts/health-monitor.sh"
JSON_GENERATOR="/home/user/webapp/scripts/generate-monitor-json.sh"

# 检查锁文件
if [ -f "$LOCK_FILE" ]; then
    # 检查锁文件中的PID是否还在运行
    if [ -s "$LOCK_FILE" ]; then
        old_pid=$(cat "$LOCK_FILE")
        if ps -p "$old_pid" > /dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 监控已在运行 (PID: $old_pid)" >> "$LOG_FILE"
            exit 0
        fi
    fi
    # 锁文件存在但进程不在，删除锁文件
    rm -f "$LOCK_FILE"
fi

# 创建锁文件
echo $$ > "$LOCK_FILE"

# 清理函数
cleanup() {
    rm -f "$LOCK_FILE"
    exit 0
}

# 捕获退出信号
trap cleanup EXIT INT TERM

# 记录启动
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 单实例监控启动 (PID: $$)" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ========================================" >> "$LOG_FILE"

# 主循环
while true; do
    $MONITOR_SCRIPT
    # 健康检查后立即生成JSON
    $JSON_GENERATOR
    sleep 240  # 4分钟
done
