#!/bin/bash
# 数据库恢复脚本
# 从备份文件恢复 .wrangler 目录

set -e

BACKUP_DIR="/home/user"

echo "📋 可用的备份文件："
echo "─────────────────────────────────────────"
ls -lht "${BACKUP_DIR}"/webapp_db_backup_*.tar.gz 2>/dev/null | nl || {
  echo "❌ 没有找到备份文件！"
  echo "💡 备份文件应该位于: ${BACKUP_DIR}/webapp_db_backup_*.tar.gz"
  exit 1
}
echo "─────────────────────────────────────────"

# 使用最新的备份
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/webapp_db_backup_*.tar.gz 2>/dev/null | head -1)

if [ -z "${LATEST_BACKUP}" ]; then
  echo "❌ 没有找到备份文件！"
  exit 1
fi

echo ""
echo "🔄 将恢复最新备份:"
echo "📂 ${LATEST_BACKUP}"
echo ""
read -p "❓ 确认恢复? 这将覆盖当前数据库 (YES/no): " confirm

if [ "$confirm" != "YES" ]; then
  echo "❌ 恢复已取消"
  exit 1
fi

echo "⏸️  停止所有服务..."
cd /home/user/webapp
pm2 stop all 2>/dev/null || true

echo "📦 备份当前数据库（以防万一）..."
if [ -d ".wrangler" ]; then
  mv .wrangler .wrangler.before_restore_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi

echo "🔄 恢复数据库..."
cd /home/user/webapp
tar -xzf "${LATEST_BACKUP}"

echo "✅ 数据库恢复成功！"
echo ""
echo "🚀 重新启动服务..."
pm2 start ecosystem.config.cjs

echo "✅ 恢复完成！"
