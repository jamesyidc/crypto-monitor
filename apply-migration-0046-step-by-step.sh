#!/bin/bash
# 分步应用迁移 0046: 添加价格类型选择字段
# Apply Migration 0046 Step-by-Step

echo "======================================"
echo "分步应用迁移 0046: 价格类型选择"
echo "Apply Migration 0046 Step-by-Step"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 错误计数
ERROR_COUNT=0

echo "⏳ [1/6] 添加 entry_price_type 字段..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited';"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ entry_price_type 字段添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  entry_price_type 字段可能已存在（跳过）${NC}"
    ((ERROR_COUNT++))
fi
echo ""

echo "⏳ [2/6] 添加 entry_specified_price 字段..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ entry_specified_price 字段添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  entry_specified_price 字段可能已存在（跳过）${NC}"
    ((ERROR_COUNT++))
fi
echo ""

echo "⏳ [3/6] 添加 exit_price_type 字段..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited';"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ exit_price_type 字段添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  exit_price_type 字段可能已存在（跳过）${NC}"
    ((ERROR_COUNT++))
fi
echo ""

echo "⏳ [4/6] 添加 exit_specified_price 字段..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ exit_specified_price 字段添加成功${NC}"
else
    echo -e "${YELLOW}⚠️  exit_specified_price 字段可能已存在（跳过）${NC}"
    ((ERROR_COUNT++))
fi
echo ""

echo "⏳ [5/6] 创建 entry_price_type 索引..."
wrangler d1 execute crypto-trading-db --remote --command "CREATE INDEX IF NOT EXISTS idx_strategies_entry_price_type ON trading_strategies(entry_price_type);"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ entry_price_type 索引创建成功${NC}"
else
    echo -e "${YELLOW}⚠️  entry_price_type 索引可能已存在（跳过）${NC}"
fi
echo ""

echo "⏳ [6/6] 创建 exit_price_type 索引..."
wrangler d1 execute crypto-trading-db --remote --command "CREATE INDEX IF NOT EXISTS idx_strategies_exit_price_type ON trading_strategies(exit_price_type);"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ exit_price_type 索引创建成功${NC}"
else
    echo -e "${YELLOW}⚠️  exit_price_type 索引可能已存在（跳过）${NC}"
fi
echo ""

echo "======================================"
echo "📊 验证结果"
echo "======================================"
echo ""

echo "检查表结构中的新字段..."
wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);" | grep -E "entry_price_type|exit_price_type|entry_specified_price|exit_specified_price"

FIELD_COUNT=$(wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);" | grep -E "entry_price_type|exit_price_type|entry_specified_price|exit_specified_price" | wc -l)

echo ""
echo "======================================"

if [ "$FIELD_COUNT" -eq 4 ]; then
    echo -e "${GREEN}✅ 迁移完全成功！所有 4 个字段都已添加。${NC}"
    echo ""
    echo "🎉 价格类型选择功能现已可用！"
    echo "💡 提示：刷新网页并尝试创建或编辑策略。"
elif [ "$FIELD_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  部分迁移成功。检测到 $FIELD_COUNT/4 个字段。${NC}"
    echo ""
    echo "请检查哪些字段缺失，并手动添加。"
else
    echo -e "${RED}❌ 迁移失败！未检测到新字段。${NC}"
    echo ""
    echo "请检查错误信息并重试。"
    exit 1
fi

echo "======================================"
