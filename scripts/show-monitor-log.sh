#!/bin/bash

# 监控日志查看工具 - 显示每次检查的时间间隔

LOG_FILE="/home/user/webapp/health-monitor.log"

echo "=========================================="
echo "🕐 健康监控执行记录（验证4分钟间隔）"
echo "=========================================="
echo ""

# 提取所有"开始健康检查"的时间戳
timestamps=$(grep "开始健康检查" "$LOG_FILE" | awk '{print $1, $2}' | sed 's/\[//g' | sed 's/\]//g')

if [ -z "$timestamps" ]; then
    echo "❌ 没有找到监控记录"
    exit 1
fi

echo "📋 最近20次检查记录："
echo "---"
printf "%-3s %-20s %-15s %s\n" "序号" "检查时间" "距上次(秒)" "状态"
echo "---"

count=0
prev_epoch=""
while IFS= read -r line; do
    # 转换为epoch时间戳
    epoch=$(date -d "$line" +%s 2>/dev/null)
    
    if [ -n "$prev_epoch" ]; then
        diff=$((epoch - prev_epoch))
        
        # 判断间隔是否正常（240秒 = 4分钟，允许±30秒误差）
        if [ $diff -ge 210 ] && [ $diff -le 270 ]; then
            status="✅ 正常"
        elif [ $diff -lt 210 ]; then
            status="⚠️ 过快"
        else
            status="⚠️ 过慢"
        fi
    else
        diff="-"
        status="-"
    fi
    
    count=$((count + 1))
    printf "%-3s %-20s %-15s %s\n" "$count" "$line" "$diff" "$status"
    
    prev_epoch=$epoch
done < <(echo "$timestamps" | tail -20)

echo ""
echo "=========================================="

# 统计信息
total=$(echo "$timestamps" | wc -l)
echo "📊 统计信息："
echo "   总检查次数: $total"
echo "   记录时间范围: $(echo "$timestamps" | head -1) 至 $(echo "$timestamps" | tail -1)"

# 计算平均间隔
if [ $total -gt 1 ]; then
    first_epoch=$(date -d "$(echo "$timestamps" | head -1)" +%s 2>/dev/null)
    last_epoch=$(date -d "$(echo "$timestamps" | tail -1)" +%s 2>/dev/null)
    total_duration=$((last_epoch - first_epoch))
    intervals=$((total - 1))
    avg_interval=$((total_duration / intervals))
    
    echo "   平均检查间隔: $avg_interval 秒 (预期: 240秒)"
    
    if [ $avg_interval -ge 210 ] && [ $avg_interval -le 270 ]; then
        echo "   ✅ 间隔符合预期"
    else
        echo "   ⚠️ 间隔异常"
    fi
fi

echo ""
echo "⏰ 当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📍 下次检查预计: $(date -d '+4 minutes' '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
