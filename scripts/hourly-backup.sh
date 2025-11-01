#!/bin/bash
# 每小时自动备份数据库
# 保留最近24小时的备份

set -e

BACKUP_DIR="/home/user/webapp/db_backups"
DB_FILE="/home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hourly_backup_${TIMESTAMP}.sqlite"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 执行备份
echo "[$(date)] 🔄 开始备份数据库..."
cp ${DB_FILE} "${BACKUP_FILE}"
echo "[$(date)] ✅ 备份完成: ${BACKUP_FILE}"

# 只保留最近24个备份（24小时）
echo "[$(date)] 🧹 清理旧备份..."
cd "${BACKUP_DIR}"
ls -t hourly_backup_*.sqlite 2>/dev/null | tail -n +25 | xargs -r rm -f
echo "[$(date)] ✅ 清理完成，当前备份数: $(ls hourly_backup_*.sqlite 2>/dev/null | wc -l)"
