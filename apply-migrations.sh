#!/bin/bash

echo "🔄 [Migration] 准备应用数据库迁移到远程D1..."

# 检查是否设置了Cloudflare API Token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  [Migration] 未设置 CLOUDFLARE_API_TOKEN 环境变量"
    echo "📝 [Migration] 请在Cloudflare Dashboard设置API Token："
    echo "   1. 访问 https://dash.cloudflare.com/profile/api-tokens"
    echo "   2. 创建Token，权限：Account.D1 = Edit"
    echo "   3. 复制Token并执行："
    echo "      export CLOUDFLARE_API_TOKEN=<your-token>"
    echo "      bash apply-migrations.sh"
    exit 1
fi

echo "✅ [Migration] 检测到 CLOUDFLARE_API_TOKEN"

# 应用迁移到远程D1数据库
echo "📊 [Migration] 正在应用迁移到 webapp-production（远程）..."
npx wrangler d1 migrations apply webapp-production --remote

if [ $? -eq 0 ]; then
    echo "✅ [Migration] 迁移应用成功！"
    echo ""
    echo "📋 [Migration] 下一步操作："
    echo "   1. 访问首页触发排名更新"
    echo "   2. 访问K线页面点击'同步最新'"
    echo "   3. 查看'24排名'列是否显示数据"
    echo ""
else
    echo "❌ [Migration] 迁移应用失败！"
    echo "请检查："
    echo "   - API Token权限是否正确"
    echo "   - 网络连接是否正常"
    echo "   - D1数据库名称是否为 webapp-production"
    exit 1
fi

# 验证迁移结果
echo "🔍 [Migration] 验证表结构..."
npx wrangler d1 execute webapp-production --remote --command "PRAGMA table_info(kline_data)" | grep homepage_rank

if [ $? -eq 0 ]; then
    echo "✅ [Migration] homepage_rank 列已成功添加！"
else
    echo "⚠️  [Migration] 无法确认 homepage_rank 列是否存在"
fi

echo ""
echo "🎉 [Migration] 完成！"
