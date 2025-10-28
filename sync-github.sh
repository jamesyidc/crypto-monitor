#!/bin/bash

# GitHub自动同步脚本
# 用途：每次代码更新后自动提交并推送到GitHub

set -e  # 遇到错误立即退出

echo "🔄 开始同步到GitHub..."

# 进入项目目录
cd /home/user/webapp

# 检查是否有变更
if [[ -z $(git status -s) ]]; then
    echo "✅ 没有新的变更需要提交"
    exit 0
fi

# 显示变更内容
echo "📝 检测到以下变更："
git status -s

# 添加所有变更
echo "➕ 添加变更文件..."
git add -A

# 获取提交信息（如果有参数则使用，否则使用默认信息）
COMMIT_MSG="${1:-chore: 自动同步更新 $(date '+%Y-%m-%d %H:%M:%S')}"

# 提交
echo "💾 提交变更..."
git commit -m "$COMMIT_MSG"

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push origin main

echo "✅ 同步完成！"
echo "🔗 查看仓库: https://github.com/jamesyidc/crypto-monitor"
