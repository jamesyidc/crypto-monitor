#!/bin/bash
# 数据库安全备份脚本
# 自动备份 .wrangler 目录到项目根目录

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user"
DB_DIR="/home/user/webapp/.wrangler"
BACKUP_FILE="${BACKUP_DIR}/webapp_db_backup_${TIMESTAMP}.tar.gz"

echo "🔄 开始备份数据库..."
echo "📂 源目录: ${DB_DIR}"
echo "💾 备份文件: ${BACKUP_FILE}"

# 检查数据库目录是否存在
if [ ! -d "${DB_DIR}" ]; then
  echo "❌ 错误: 数据库目录不存在: ${DB_DIR}"
  exit 1
fi

# 创建备份
cd /home/user/webapp
tar -czf "${BACKUP_FILE}" .wrangler/

# 验证备份
if [ -f "${BACKUP_FILE}" ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "✅ 备份成功！"
  echo "📊 备份大小: ${BACKUP_SIZE}"
  echo "📍 备份位置: ${BACKUP_FILE}"
  
  # 可选：复制到 AI Drive
  if [ -d "/mnt/aidrive" ]; then
    echo "📤 同步备份到 AI Drive..."
    cp "${BACKUP_FILE}" /mnt/aidrive/ 2>/dev/null || echo "⚠️  AI Drive 同步失败（可忽略）"
  fi
  
  # 清理超过7天的旧备份（保留最近7个备份）
  echo "🧹 清理旧备份..."
  cd "${BACKUP_DIR}"
  ls -t webapp_db_backup_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
  echo "✅ 备份完成！"
else
  echo "❌ 备份失败！"
  exit 1
fi
