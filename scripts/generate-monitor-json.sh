#!/bin/bash

# 快速生成监控日志JSON文件（静态文件方式）
export TZ='Asia/Shanghai'

LOG_FILE="/home/user/webapp/health-monitor.log"
JSON_FILE="/home/user/webapp/public/static/monitor-log.json"

# 确保目录存在
mkdir -p /home/user/webapp/public/static

# 如果日志文件不存在
if [ ! -f "$LOG_FILE" ]; then
    echo '{"error":"日志文件不存在","checks":[],"rawLog":"","totalChecks":0}' > "$JSON_FILE"
    exit 0
fi

# 获取最后100行日志
RAW_LOG=$(tail -100 "$LOG_FILE" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

# 提取所有"开始健康检查"的时间戳
CHECKS=$(grep "开始健康检查" "$LOG_FILE" | grep -oP '\[\K[^\]]+' | tail -20)

# 如果没有检查记录
if [ -z "$CHECKS" ]; then
    echo "{\"error\":null,\"checks\":[],\"rawLog\":\"$RAW_LOG\",\"totalChecks\":0,\"avgInterval\":0,\"lastCheck\":\"-\",\"nextCheck\":\"-\"}" > "$JSON_FILE"
    exit 0
fi

# 计算总次数
TOTAL_CHECKS=$(echo "$CHECKS" | wc -l)

# 获取最后一次检查时间
LAST_CHECK=$(echo "$CHECKS" | tail -1)
LAST_TIMESTAMP=$(date -d "$LAST_CHECK" +%s 2>/dev/null || echo "0")

# 计算下次检查时间（+240秒）
if [ "$LAST_TIMESTAMP" != "0" ]; then
    NEXT_TIMESTAMP=$((LAST_TIMESTAMP + 240))
    NEXT_CHECK=$(date -d "@$NEXT_TIMESTAMP" '+%H:%M:%S' 2>/dev/null || echo "-")
else
    NEXT_CHECK="-"
fi

# 格式化最后检查时间
if [ "$LAST_TIMESTAMP" != "0" ]; then
    LAST_CHECK_FORMATTED=$(date -d "$LAST_CHECK" '+%H:%M:%S')
else
    LAST_CHECK_FORMATTED="-"
fi

# 计算平均间隔
INTERVALS=()
PREV_TS=""
while IFS= read -r line; do
    CURR_TS=$(date -d "$line" +%s 2>/dev/null || echo "0")
    if [ -n "$PREV_TS" ] && [ "$PREV_TS" != "0" ] && [ "$CURR_TS" != "0" ]; then
        INTERVAL=$((CURR_TS - PREV_TS))
        INTERVALS+=($INTERVAL)
    fi
    PREV_TS=$CURR_TS
done <<< "$CHECKS"

# 计算平均值
if [ ${#INTERVALS[@]} -gt 0 ]; then
    SUM=0
    for i in "${INTERVALS[@]}"; do
        SUM=$((SUM + i))
    done
    AVG_INTERVAL=$((SUM / ${#INTERVALS[@]}))
else
    AVG_INTERVAL=0
fi

# 构建检查记录数组
CHECK_ARRAY="["
PREV_TS=""
INDEX=0
while IFS= read -r line; do
    CURR_TS=$(date -d "$line" +%s 2>/dev/null || echo "0")
    FORMATTED_TIME="$line"
    
    # 计算与上次的间隔
    if [ -n "$PREV_TS" ] && [ "$PREV_TS" != "0" ] && [ "$CURR_TS" != "0" ]; then
        INTERVAL=$((CURR_TS - PREV_TS))
        INTERVAL_TEXT="${INTERVAL}秒"
        
        # 判断状态
        if [ $INTERVAL -ge 210 ] && [ $INTERVAL -le 270 ]; then
            STATUS="✅"
        else
            STATUS="⚠️"
        fi
    else
        INTERVAL_TEXT="首次"
        STATUS="✅"
    fi
    
    if [ $INDEX -gt 0 ]; then
        CHECK_ARRAY+=","
    fi
    
    CHECK_ARRAY+="{\"time\":\"$FORMATTED_TIME\",\"interval\":\"$INTERVAL_TEXT\",\"status\":\"$STATUS\",\"result\":\"健康检查完成\"}"
    
    PREV_TS=$CURR_TS
    INDEX=$((INDEX + 1))
done <<< "$CHECKS"
CHECK_ARRAY+="]"

# 生成最终JSON
cat > "$JSON_FILE" << EOF
{
  "error": null,
  "totalChecks": $TOTAL_CHECKS,
  "avgInterval": $AVG_INTERVAL,
  "lastCheck": "$LAST_CHECK_FORMATTED",
  "nextCheck": "$NEXT_CHECK",
  "checks": $CHECK_ARRAY,
  "rawLog": "$RAW_LOG"
}
EOF

# 设置权限
chmod 644 "$JSON_FILE"
