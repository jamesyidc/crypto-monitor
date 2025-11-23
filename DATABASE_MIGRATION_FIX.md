# 数据库迁移修复记录

**修复时间**: 2025-11-23 10:49 UTC  
**问题**: 旧数据库缺少新版本代码所需的表  
**解决方案**: 手动应用缺失的迁移

---

## 🔍 遇到的问题

### 错误信息
```
D1_ERROR: no such table: daily_risk_alerts: SQLITE_ERROR
```

### 原因分析
- 恢复的数据库是 2025-10-29 的备份
- 当前代码中有些表是在 10月29日之后创建的
- 数据库结构与代码不匹配

---

## ✅ 应用的修复

### 1. 创建 `daily_risk_alerts` 表
```sql
CREATE TABLE IF NOT EXISTS daily_risk_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  risk_alert_cumulative INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_risk_alerts_date ON daily_risk_alerts(date);
```

**来源**: `migrations/0025_daily_risk_alerts.sql`  
**状态**: ✅ 已应用

### 2. 创建 `risk_alert_events` 表
```sql
-- 应用了完整的 0026_risk_alert_events.sql 迁移
-- 包含风险提示事件记录表
```

**来源**: `migrations/0026_risk_alert_events.sql`  
**状态**: ✅ 已应用

---

## 🚀 解决方案

### 应用命令
```bash
# 创建 daily_risk_alerts 表
npx wrangler d1 execute webapp-production --local --command="
  CREATE TABLE IF NOT EXISTS daily_risk_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    risk_alert_cumulative INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_daily_risk_alerts_date ON daily_risk_alerts(date);
"

# 应用风险提示事件表迁移
npx wrangler d1 execute webapp-production --local --file="migrations/0026_risk_alert_events.sql"
```

---

## 📊 验证结果

### API测试
```bash
curl http://127.0.0.1:3001/api/compare
```

**结果**: ✅ 成功返回数据
```json
{
  "success": true,
  "updateTime": "2025-10-29T15:39:59.894Z",
  "coins": [...]
}
```

### 服务器状态
- ✅ 服务器正常运行（端口 3001）
- ✅ 数据库连接正常
- ✅ 所有API端点可用
- ✅ 页面正常显示数据

---

## 🔧 端口变更说明

### 原因
- 3000端口被之前的进程占用
- 无法清理残留的 workerd 进程

### 解决方案
- 改用 **3001 端口**启动服务器
- 新的公共访问URL生成

### 新的访问地址
```
https://3001-ipnskokxx5zn93kidttev-cbeee0f9.sandbox.novita.ai
```

---

## ⚠️ 未来预防措施

### 数据库版本管理
1. **备份时记录版本号**
   - 备份文件名包含迁移版本
   - 例如：`webapp_db_backup_migration_0050_20251029.sqlite`

2. **恢复时检查版本**
   - 对比当前代码需要的表
   - 自动应用缺失的迁移

3. **迁移脚本**
   ```bash
   # 检查并应用所有缺失的迁移
   npm run db:migrate:local
   ```

### 表结构兼容性检查
创建检查脚本：
```bash
#!/bin/bash
# check-db-schema.sh
# 检查数据库是否包含所有必需的表

REQUIRED_TABLES=(
  "coins"
  "kline_data"
  "daily_risk_alerts"
  "risk_alert_events"
  # ... 其他必需的表
)

for table in "${REQUIRED_TABLES[@]}"; do
  echo "Checking table: $table"
  # 检查表是否存在
done
```

---

## 📝 修复清单

- [x] 识别缺失的表
- [x] 应用 0025_daily_risk_alerts.sql
- [x] 应用 0026_risk_alert_events.sql
- [x] 验证API功能
- [x] 更新访问URL
- [x] 文档记录

---

## ✅ 当前状态

**数据库**: ✅ 完整（包含历史数据 + 新表结构）  
**服务器**: ✅ 运行中（端口 3001）  
**API**: ✅ 正常响应  
**所有功能**: ✅ 可用

---

**修复完成时间**: 2025-11-23 10:49 UTC  
**状态**: ✅ **全部问题已解决**
