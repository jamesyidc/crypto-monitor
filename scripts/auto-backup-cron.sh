#!/bin/bash
# 自动备份cron脚本 - 每12小时执行一次
# 使用方法: 添加到crontab或PM2 cron

set -e

cd /home/user/webapp

echo "⏰ [$(date '+%Y-%m-%d %H:%M:%S')] 自动备份任务开始..."

# 执行备份
bash scripts/backup-db.sh

echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] 自动备份任务完成"
