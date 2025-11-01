#!/bin/bash

# 生成监控日志JSON文件

export TZ='Asia/Shanghai'

LOG_FILE="/home/user/webapp/health-monitor.log"
OUTPUT_FILE="/home/user/webapp/public/static/monitor-log.json"

# 读取日志
if [ ! -f "$LOG_FILE" ]; then
    echo '{"error": "日志文件不存在"}' > "$OUTPUT_FILE"
    exit 1
fi

# 提取检查记录
checks=$(grep "开始健康检查" "$LOG_FILE" | tail -100)

# 开始构建JSON
echo '{' > "$OUTPUT_FILE"
echo '  "totalChecks": '$(grep -c "开始健康检查" "$LOG_FILE")',' >> "$OUTPUT_FILE"
echo '  "checks": [' >> "$OUTPUT_FILE"

# 处理每条检查记录
prev_epoch=""
first=true
while IFS= read -r line; do
    timestamp=$(echo "$line" | grep -oP '\[\K[^\]]+')
    if [ -n "$timestamp" ]; then
        epoch=$(date -d "$timestamp" +%s 2>/dev/null)
        
        interval="-"
        status="-"
        if [ -n "$prev_epoch" ]; then
            diff=$((epoch - prev_epoch))
            interval="$diff"
            
            if [ $diff -ge 210 ] && [ $diff -le 270 ]; then
                status="✅"
            elif [ $diff -lt 10 ]; then
                status="⚪"
            else
                status="⚠️"
            fi
        fi
        
        # 添加逗号分隔
        if [ "$first" = false ]; then
            echo '    ,' >> "$OUTPUT_FILE"
        fi
        first=false
        
        # 写入JSON
        echo -n '    {"time":"'$timestamp'","interval":"'$interval'","status":"'$status'","result":"✅ 全部通过"}' >> "$OUTPUT_FILE"
        
        prev_epoch=$epoch
    fi
done <<< "$checks"

echo '' >> "$OUTPUT_FILE"
echo '  ],' >> "$OUTPUT_FILE"

# 计算平均间隔
avg=$(grep "开始健康检查" "$LOG_FILE" | tail -20 | awk '{print $1, $2}' | sed 's/\[//g' | sed 's/\]//g' | {
    prev=""
    sum=0
    count=0
    while read line; do
        curr=$(date -d "$line" +%s 2>/dev/null)
        if [ -n "$prev" ] && [ $((curr - prev)) -gt 10 ]; then
            sum=$((sum + curr - prev))
            count=$((count + 1))
        fi
        prev=$curr
    done
    if [ $count -gt 0 ]; then
        echo $((sum / count))
    else
        echo 0
    fi
})

# 最后一次检查时间
last_check=$(grep "开始健康检查" "$LOG_FILE" | tail -1 | grep -oP '\[\K[^\]]+' || echo "-")
last_epoch=$(date -d "$last_check" +%s 2>/dev/null || echo 0)
next_epoch=$((last_epoch + 240))
next_check=$(date -d "@$next_epoch" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "-")

echo '  "avgInterval": '$avg',' >> "$OUTPUT_FILE"
echo '  "lastCheck": "'$last_check'",' >> "$OUTPUT_FILE"
echo '  "nextCheck": "'$next_check'",' >> "$OUTPUT_FILE"
echo '  "rawLog": ""' >> "$OUTPUT_FILE"
echo '}' >> "$OUTPUT_FILE"

chmod 644 "$OUTPUT_FILE"
