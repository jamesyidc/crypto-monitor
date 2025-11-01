#!/bin/bash
# K线数据库自动备份脚本
# 
# 用法：
#   ./scripts/backup_database.sh           # 创建新备份
#   ./scripts/backup_database.sh --list    # 列出所有备份
#   ./scripts/backup_database.sh --restore TIMESTAMP  # 恢复备份
#
# 备份位置：/home/user/webapp/db_backups/
# 命名格式：webapp_db_backup_YYYYMMDD_HHMMSS.sqlite

BACKUP_DIR="/home/user/webapp/db_backups"
DB_PATH="/home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 命令：列出备份
if [ "$1" == "--list" ]; then
    echo -e "${GREEN}📦 数据库备份列表：${NC}"
    ls -lh "$BACKUP_DIR"/*.sqlite 2>/dev/null | awk '{print $9, "(" $5 ")"}'
    exit 0
fi

# 命令：恢复备份
if [ "$1" == "--restore" ]; then
    if [ -z "$2" ]; then
        echo -e "${RED}❌ 错误：请提供备份文件名${NC}"
        echo "用法: $0 --restore webapp_db_backup_YYYYMMDD_HHMMSS.sqlite"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/$2"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ 错误：备份文件不存在: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    # 在恢复前先备份当前数据库
    CURRENT_BACKUP="$BACKUP_DIR/webapp_db_before_restore_$(date +%Y%m%d_%H%M%S).sqlite"
    cp "$DB_PATH"/*.sqlite "$CURRENT_BACKUP"
    echo -e "${GREEN}✅ 当前数据库已备份到: $(basename $CURRENT_BACKUP)${NC}"
    
    # 恢复备份
    cp "$BACKUP_FILE" "$DB_PATH"/*.sqlite
    echo -e "${GREEN}✅ 数据库已恢复from: $(basename $BACKUP_FILE)${NC}"
    echo -e "${YELLOW}⚠️  请重启服务: pm2 restart crypto-monitor${NC}"
    exit 0
fi

# 默认命令：创建备份
BACKUP_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/webapp_db_backup_${BACKUP_TIME}.sqlite"

# 复制数据库文件
cp "$DB_PATH"/*.sqlite "$BACKUP_FILE"

# 获取文件大小
SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')

echo -e "${GREEN}✅ 数据库备份完成！${NC}"
echo -e "   文件: $(basename $BACKUP_FILE)"
echo -e "   大小: $SIZE"
echo -e "   路径: $BACKUP_FILE"

# 清理超过30天的旧备份
find "$BACKUP_DIR" -name "webapp_db_backup_*.sqlite" -mtime +30 -delete
echo -e "${YELLOW}🧹 已清理30天前的旧备份${NC}"
