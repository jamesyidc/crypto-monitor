#!/bin/bash
# 一键修复脚本 - 自动登录并执行迁移
# One-click fix script - Auto login and execute migration

echo "======================================"
echo "🔧 一键修复 - 价格类型字段"
echo "🔧 One-Click Fix - Price Type Fields"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 这个脚本将会：${NC}"
echo "   1. 检查 Cloudflare 登录状态"
echo "   2. 如果未登录，引导你登录"
echo "   3. 自动执行 4 条数据库迁移命令"
echo "   4. 验证迁移结果"
echo ""

# 检查登录状态
echo -e "${BLUE}[1/5] 检查 Cloudflare 登录状态...${NC}"
WHOAMI_OUTPUT=$(wrangler whoami 2>&1)

if echo "$WHOAMI_OUTPUT" | grep -q "not authenticated"; then
    echo -e "${YELLOW}⚠️  未登录，需要先登录 Cloudflare${NC}"
    echo ""
    echo -e "${BLUE}即将打开浏览器进行登录...${NC}"
    echo "请在浏览器中完成 Cloudflare 登录授权"
    echo ""
    read -p "按 Enter 键继续..." dummy
    
    # 执行登录
    wrangler login
    
    # 再次检查登录状态
    WHOAMI_OUTPUT=$(wrangler whoami 2>&1)
    if echo "$WHOAMI_OUTPUT" | grep -q "not authenticated"; then
        echo -e "${RED}❌ 登录失败，请检查网络连接或手动运行: wrangler login${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ 已登录 Cloudflare${NC}"
echo "$WHOAMI_OUTPUT" | grep -E "Account|Email"
echo ""

# 确认数据库名称
echo -e "${BLUE}[2/5] 确认数据库名称...${NC}"
DB_NAME=$(grep -A 2 "\[\[d1_databases\]\]" wrangler.toml | grep "database_name" | cut -d'"' -f2)

if [ -z "$DB_NAME" ]; then
    DB_NAME="crypto-trading-db"
    echo -e "${YELLOW}⚠️  未在 wrangler.toml 中找到数据库名，使用默认: $DB_NAME${NC}"
else
    echo -e "${GREEN}✅ 数据库名称: $DB_NAME${NC}"
fi
echo ""

# 执行迁移
echo -e "${BLUE}[3/5] 执行数据库迁移...${NC}"
echo ""

# 命令 1
echo -e "${BLUE}添加 entry_price_type 字段...${NC}"
RESULT1=$(wrangler d1 execute "$DB_NAME" --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited';" 2>&1)
if echo "$RESULT1" | grep -q "duplicate column\|Executed\|Success"; then
    echo -e "${GREEN}✅ entry_price_type 添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  $RESULT1${NC}"
fi
sleep 1

# 命令 2
echo -e "${BLUE}添加 entry_specified_price 字段...${NC}"
RESULT2=$(wrangler d1 execute "$DB_NAME" --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;" 2>&1)
if echo "$RESULT2" | grep -q "duplicate column\|Executed\|Success"; then
    echo -e "${GREEN}✅ entry_specified_price 添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  $RESULT2${NC}"
fi
sleep 1

# 命令 3
echo -e "${BLUE}添加 exit_price_type 字段...${NC}"
RESULT3=$(wrangler d1 execute "$DB_NAME" --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited';" 2>&1)
if echo "$RESULT3" | grep -q "duplicate column\|Executed\|Success"; then
    echo -e "${GREEN}✅ exit_price_type 添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  $RESULT3${NC}"
fi
sleep 1

# 命令 4
echo -e "${BLUE}添加 exit_specified_price 字段...${NC}"
RESULT4=$(wrangler d1 execute "$DB_NAME" --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;" 2>&1)
if echo "$RESULT4" | grep -q "duplicate column\|Executed\|Success"; then
    echo -e "${GREEN}✅ exit_specified_price 添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  $RESULT4${NC}"
fi
echo ""

# 验证
echo -e "${BLUE}[4/5] 验证字段已添加...${NC}"
VERIFY_OUTPUT=$(wrangler d1 execute "$DB_NAME" --remote --command "PRAGMA table_info(trading_strategies);" 2>&1)

FIELD_COUNT=0
if echo "$VERIFY_OUTPUT" | grep -q "entry_price_type"; then
    ((FIELD_COUNT++))
fi
if echo "$VERIFY_OUTPUT" | grep -q "entry_specified_price"; then
    ((FIELD_COUNT++))
fi
if echo "$VERIFY_OUTPUT" | grep -q "exit_price_type"; then
    ((FIELD_COUNT++))
fi
if echo "$VERIFY_OUTPUT" | grep -q "exit_specified_price"; then
    ((FIELD_COUNT++))
fi

echo -e "${GREEN}✅ 检测到 $FIELD_COUNT/4 个新字段${NC}"
echo ""

if [ $FIELD_COUNT -eq 4 ]; then
    echo "======================================"
    echo -e "${GREEN}🎉 迁移完全成功！${NC}"
    echo "======================================"
    echo ""
    echo -e "${GREEN}✅ 所有 4 个字段已成功添加到数据库！${NC}"
    echo ""
    echo -e "${BLUE}下一步操作：${NC}"
    echo "1. 刷新浏览器页面 (Ctrl+Shift+R)"
    echo "2. 打开策略库"
    echo "3. 创建新策略，测试价格类型选择功能"
    echo "4. 享受新功能！🚀"
    echo ""
elif [ $FIELD_COUNT -gt 0 ]; then
    echo "======================================"
    echo -e "${YELLOW}⚠️  部分迁移成功${NC}"
    echo "======================================"
    echo ""
    echo -e "${YELLOW}检测到 $FIELD_COUNT/4 个字段${NC}"
    echo ""
    echo "可能的原因："
    echo "- 某些字段已经存在"
    echo "- 部分命令执行失败"
    echo ""
    echo "建议："
    echo "1. 查看上面的详细输出"
    echo "2. 手动检查缺失的字段"
    echo "3. 或查看 URGENT_FIX_GUIDE.md 使用 Cloudflare Dashboard 手动添加"
else
    echo "======================================"
    echo -e "${RED}❌ 迁移失败${NC}"
    echo "======================================"
    echo ""
    echo -e "${RED}未检测到任何新字段！${NC}"
    echo ""
    echo "请检查："
    echo "1. 数据库名称是否正确: $DB_NAME"
    echo "2. 是否有数据库访问权限"
    echo "3. 网络连接是否正常"
    echo ""
    echo "或使用 Cloudflare Dashboard 手动执行："
    echo "查看 URGENT_FIX_GUIDE.md 获取详细说明"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${BLUE}[5/5] 完成！${NC}"
echo "======================================"
