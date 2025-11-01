#!/bin/bash

# 实时监控显示工具 - 显示最近的检查记录和倒计时

LOG_FILE="/home/user/webapp/health-monitor.log"

clear
echo "=========================================="
echo "🔍 监控系统实时状态"
echo "=========================================="
echo ""

# 获取最后一次检查时间
last_check=$(grep "开始健康检查" "$LOG_FILE" | tail -1 | awk '{print $1, $2}' | sed 's/\[//g' | sed 's/\]//g')
last_epoch=$(date -d "$last_check" +%s 2>/dev/null)
current_epoch=$(date +%s)
elapsed=$((current_epoch - last_epoch))
remaining=$((240 - elapsed))

echo "📊 当前状态："
echo "   监控进程: $(ps aux | grep 'health-monitor.sh' | grep -v grep | wc -l) 个"
echo "   上次检查: $last_check"
echo "   已过时间: ${elapsed}秒"
if [ $remaining -gt 0 ]; then
    echo "   下次检查: 还有 ${remaining}秒 (约$(($remaining/60))分钟)"
else
    echo "   下次检查: 应该正在执行"
fi
echo ""

echo "📋 最近5次检查记录："
echo "---"
printf "%-20s %-15s %s\n" "检查时间" "间隔(秒)" "状态"
echo "---"

prev_epoch=""
grep "开始健康检查" "$LOG_FILE" | tail -5 | while IFS= read -r line; do
    timestamp=$(echo "$line" | awk '{print $1, $2}' | sed 's/\[//g' | sed 's/\]//g')
    epoch=$(date -d "$timestamp" +%s 2>/dev/null)
    
    if [ -n "$prev_epoch" ]; then
        diff=$((epoch - prev_epoch))
        if [ $diff -ge 210 ] && [ $diff -le 270 ]; then
            status="✅"
        else
            status="⚠️"
        fi
    else
        diff="-"
        status="-"
    fi
    
    printf "%-20s %-15s %s\n" "$timestamp" "$diff" "$status"
    prev_epoch=$epoch
done

echo ""
echo "⏰ 当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""
echo "提示: 每240秒(4分钟)应该执行一次检查"
echo "      间隔210-270秒视为正常(±30秒误差)"
