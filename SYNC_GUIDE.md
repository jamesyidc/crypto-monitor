# GitHub 同步指南

## 🚀 快速同步

每次代码更新后，使用以下任一方式同步到GitHub：

### 方法一：使用npm脚本（推荐）

```bash
cd /home/user/webapp
npm run sync
```

如果想自定义提交信息：
```bash
npm run sync:msg "feat: 添加新功能"
```

### 方法二：直接运行脚本

```bash
cd /home/user/webapp
./sync-github.sh
```

或带自定义提交信息：
```bash
./sync-github.sh "fix: 修复某个bug"
```

### 方法三：手动Git命令

```bash
cd /home/user/webapp
git add -A
git commit -m "你的提交信息"
git push origin main
```

## 📋 同步检查清单

在同步前，建议检查以下内容：

1. ✅ **代码已测试**：确保新功能正常工作
2. ✅ **构建成功**：运行 `npm run build` 确认无错误
3. ✅ **服务正常**：PM2服务运行正常
4. ✅ **提交信息清晰**：描述本次更新的内容

## 🔄 自动同步流程

脚本会自动执行以下步骤：

1. 检查是否有变更
2. 显示变更文件列表
3. 添加所有变更（git add -A）
4. 提交变更（git commit）
5. 推送到GitHub（git push origin main）
6. 显示仓库链接

## 📝 提交信息规范

建议使用以下格式：

- `feat: 添加新功能` - 新功能
- `fix: 修复bug` - 修复问题
- `docs: 更新文档` - 文档更新
- `style: 代码格式` - 样式调整
- `refactor: 重构代码` - 代码重构
- `perf: 性能优化` - 性能改进
- `test: 测试相关` - 测试代码
- `chore: 其他变更` - 杂项更新

示例：
```bash
./sync-github.sh "feat: 添加数据批量导入功能"
./sync-github.sh "fix: 修复K线数据显示错误"
./sync-github.sh "docs: 更新README文档"
```

## ⚠️ 注意事项

1. **GitHub认证**：确保已运行 `setup_github_environment` 配置认证
2. **网络连接**：确保能访问GitHub
3. **分支名称**：默认推送到 `main` 分支
4. **敏感信息**：确保 `.gitignore` 已配置，不会提交敏感文件

## 🔗 GitHub仓库

- **仓库地址**：https://github.com/jamesyidc/crypto-monitor
- **查看提交**：https://github.com/jamesyidc/crypto-monitor/commits/main
- **代码浏览**：https://github.com/jamesyidc/crypto-monitor/tree/main

## 🛠️ 故障排除

### 问题1：认证失败
```bash
# 重新配置GitHub认证
setup_github_environment
```

### 问题2：推送被拒绝
```bash
# 拉取最新代码后再推送
git pull origin main
git push origin main
```

### 问题3：冲突
```bash
# 查看冲突文件
git status

# 解决冲突后
git add .
git commit -m "解决冲突"
git push origin main
```

## 📊 查看同步状态

```bash
# 查看本地状态
git status

# 查看提交历史
git log --oneline -10

# 查看远程状态
git remote -v

# 对比本地和远程
git fetch
git status
```

## 🎯 最佳实践

1. **频繁提交**：完成一个功能就提交一次
2. **清晰描述**：提交信息要准确描述变更内容
3. **定期同步**：每天至少同步一次
4. **先拉后推**：推送前先拉取最新代码
5. **测试后推送**：确保代码测试通过再推送

---

**最后更新**: 2025-10-28
