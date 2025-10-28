# 🔥 核心逻辑检查清单 - 运行前必读

> **⚠️ 在执行任何操作之前，必须先过一遍这个核心逻辑清单！**

---

## ✅ 核心逻辑 1：数据是最宝贵的资产 - 绝对不能删除

### 检查项：

- [ ] **任何数据库操作前是否已备份？**
  ```bash
  npm run db:backup  # 必须先执行
  ```

- [ ] **是否避免了危险命令？**
  ```bash
  ❌ 绝对禁止: rm -rf .wrangler
  ❌ 绝对禁止: npm run clean-db
  ✅ 安全使用: npm run db:reset (自动备份+确认)
  ✅ 安全使用: npm run db:backup
  ```

- [ ] **备份是否正常？**
  ```bash
  ls -lht /home/user/webapp_db_backup_*.tar.gz
  # 应该看到最近3个备份文件
  ```

- [ ] **数据完整性是否验证？**
  ```bash
  # 当前应该有：
  # - coins: 29个币种
  # - kline_data: 11,000+ 条记录
  # - coin_round_details: 58+ 条记录
  ```

---

## ✅ 核心逻辑 2：严格的功能定义流程

### 检查项：

- [ ] **新功能是否已在 DEVELOPMENT_NOTES.md 中定义？**
  - 功能名称
  - 功能目的
  - 数据结构
  - API接口定义
  - 实现逻辑

- [ ] **定义是否已通过审核？**
  - 确认定义完整
  - 确认不会影响现有数据
  - 确认有备份保护

- [ ] **是否先在开发环境测试？**
  - 本地测试通过
  - 数据安全验证
  - 再部署到生产

### 禁止行为：

❌ **未定义就直接写入主程序**  
❌ **跳过测试直接部署**  
❌ **修改核心数据结构未备份**

---

## ✅ 核心逻辑 3：自动备份策略

### 检查项：

- [ ] **自动备份是否正常运行？**
  ```bash
  pm2 list | grep db-backup-scheduler
  # 应该显示 online 或 stopped (cron执行完成)
  ```

- [ ] **备份时间是否正确？**
  - 每12小时执行一次（0点和12点）
  - PM2 cron: `0 */12 * * *`

- [ ] **备份保留策略是否正确？**
  - 只保留最近3次备份
  - 自动清理旧备份

- [ ] **备份位置是否正确？**
  ```bash
  ls -lh /home/user/webapp_db_backup_*.tar.gz
  # 应该看到3个备份文件，总大小约5-6MB
  ```

### 手动备份命令：

```bash
# 立即创建备份
npm run db:backup

# 恢复最新备份
npm run db:restore

# 查看所有备份
ls -lht /home/user/webapp_db_backup_*.tar.gz
```

---

## 🚀 操作前检查流程

### 任何数据库相关操作前：

1. ✅ **先过一遍这3条核心逻辑**
2. ✅ **确认已有最新备份**
3. ✅ **验证数据完整性**
4. ✅ **再执行操作**

### 紧急情况处理：

如果不小心删除了数据：

```bash
# 1. 立即停止所有服务
pm2 stop all

# 2. 恢复最新备份
npm run db:restore

# 3. 重启服务
pm2 start ecosystem.config.cjs

# 4. 验证数据
curl http://localhost:3000/api/coins
```

---

## 📊 当前系统状态

**数据库：**
- ✅ coins: 29个币种
- ✅ kline_data: 11,475+ 条K线记录
- ✅ coin_round_details: 58+ 条分析记录

**备份：**
- ✅ 最近3次备份已保存
- ✅ 自动备份每12小时运行
- ✅ 备份大小正常（1.5-1.8MB per file）

**服务：**
- ✅ crypto-monitor (主服务)
- ✅ analysis-scheduler (分析调度)
- ✅ kline-scheduler (K线同步)
- ✅ signal-scheduler (信号调度)
- ✅ db-backup-scheduler (自动备份)

---

## ⚠️ 记住

**数据是最宝贵的资产！**
**任何操作前先过一遍核心逻辑！**
**有疑问就先备份！**
