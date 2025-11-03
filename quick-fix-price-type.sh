#!/bin/bash
# 快速修复价格类型字段
# Quick fix for price type columns

echo "======================================"
echo "🔧 快速修复价格类型字段"
echo "🔧 Quick Fix for Price Type Columns"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "步骤 1/4: 添加 entry_price_type..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited';" 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${YELLOW}⚠️  字段可能已存在${NC}"
fi
sleep 1

echo ""
echo "步骤 2/4: 添加 entry_specified_price..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;" 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${YELLOW}⚠️  字段可能已存在${NC}"
fi
sleep 1

echo ""
echo "步骤 3/4: 添加 exit_price_type..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited';" 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${YELLOW}⚠️  字段可能已存在${NC}"
fi
sleep 1

echo ""
echo "步骤 4/4: 添加 exit_specified_price..."
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;" 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${YELLOW}⚠️  字段可能已存在${NC}"
fi

echo ""
echo "======================================"
echo "📊 验证字段..."
echo "======================================"
echo ""

# 检查字段
FIELDS=$(wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);" 2>/dev/null | grep -E "entry_price_type|exit_price_type|entry_specified_price|exit_specified_price")

if [ ! -z "$FIELDS" ]; then
    FIELD_COUNT=$(echo "$FIELDS" | wc -l)
    echo -e "${GREEN}✅ 检测到 $FIELD_COUNT 个价格类型字段${NC}"
    echo ""
    echo "$FIELDS"
    echo ""
    
    if [ "$FIELD_COUNT" -eq 4 ]; then
        echo -e "${GREEN}🎉 所有字段已成功添加！${NC}"
        echo ""
        echo "下一步："
        echo "1. 刷新浏览器页面 (Ctrl+Shift+R)"
        echo "2. 尝试创建或编辑策略"
        echo "3. 如果还有问题，运行: npm run deploy"
    else
        echo -e "${YELLOW}⚠️  只检测到 $FIELD_COUNT/4 个字段${NC}"
        echo "可能需要手动检查缺失的字段"
    fi
else
    echo -e "${RED}❌ 未检测到任何价格类型字段${NC}"
    echo ""
    echo "请检查错误信息并重试"
fi

echo ""
echo "======================================"
