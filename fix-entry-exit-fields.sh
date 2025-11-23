#!/bin/bash
# 修复 entry_exit 字段 - 确保买点/卖点分类正确
# Fix entry_exit fields - Ensure correct buy/sell point classification

echo "======================================"
echo "🔧 修复买点/卖点分类"
echo "🔧 Fix Entry/Exit Classification"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[1/3] 修复卖点信号的 entry_exit 字段...${NC}"
echo "将所有名称包含'（卖点）'但被标记为 entry 的信号改为 exit"
echo ""

wrangler d1 execute webapp-production --local --command "UPDATE trading_signals_v2 SET entry_exit = 'exit' WHERE signal_name LIKE '%（卖点）%' AND entry_exit = 'entry';"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 卖点信号修复成功${NC}"
else
    echo -e "${YELLOW}⚠️  修复可能失败，请检查输出${NC}"
fi

echo ""
echo -e "${BLUE}[2/3] 修复买点信号的 entry_exit 字段...${NC}"
echo "将所有名称包含'（买点）'但被标记为 exit 的信号改为 entry"
echo ""

wrangler d1 execute webapp-production --local --command "UPDATE trading_signals_v2 SET entry_exit = 'entry' WHERE signal_name LIKE '%（买点）%' AND entry_exit = 'exit';"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 买点信号修复成功${NC}"
else
    echo -e "${YELLOW}⚠️  修复可能失败，请检查输出${NC}"
fi

echo ""
echo -e "${BLUE}[3/3] 验证修复结果...${NC}"
echo ""

# 检查是否还有不匹配的信号
RESULT=$(wrangler d1 execute webapp-production --local --command "SELECT signal_name, entry_exit FROM trading_signals_v2 WHERE (signal_name LIKE '%（买点）%' AND entry_exit != 'entry') OR (signal_name LIKE '%（卖点）%' AND entry_exit != 'exit');" 2>&1)

if echo "$RESULT" | grep -q "\"results\": \[\]"; then
    echo -e "${GREEN}✅ 所有信号分类正确！${NC}"
    echo ""
    echo "======================================"
    echo -e "${GREEN}🎉 修复完成！${NC}"
    echo "======================================"
    echo ""
    echo "下一步："
    echo "1. 刷新浏览器 (Ctrl+Shift+R)"
    echo "2. 测试创建策略"
    echo "3. 验证买点下拉框只显示买点信号"
    echo "4. 验证卖点下拉框只显示卖点信号"
else
    echo -e "${YELLOW}⚠️  可能还有不匹配的信号${NC}"
    echo "$RESULT"
fi

echo ""
echo "======================================"
