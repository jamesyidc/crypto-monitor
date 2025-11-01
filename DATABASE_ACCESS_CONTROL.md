# 数据库访问控制规则

## 🔒 K线数据表 (kline_data) 访问规则

### ✅ 允许写入
**只有以下服务/操作可以写入 `kline_data` 表：**
- `KlineService` - K线数据服务
- `kline-sync` - K线同步操作

### ✅ 允许读取
**所有服务都可以读取 `kline_data` 表**

### ❌ 严格禁止
**以下操作被严格禁止：**
- 回测服务 (BacktestService) 写入K线数据
- 交易服务 (TradingService) 写入K线数据
- 信号服务 (SignalService) 写入K线数据
- 其他任何业务逻辑写入K线数据

## 🛡️ 实现机制

### KlineDbGuard 守卫类
位置：`src/services/klineDbGuard.ts`

**功能：**
1. 在服务初始化时验证写入权限
2. 在SQL执行前自动检查是否违反规则
3. 违反规则时抛出明确的错误信息

**使用示例：**
```typescript
// ✅ 正确：KlineService 有写入权限
export class KlineService {
  constructor(db: D1Database) {
    this.db = db;
    KlineDbGuard.checkWritePermission('KlineService'); // 通过
  }
}

// ❌ 错误：BacktestService 无写入权限
const guardedDb = KlineDbGuard.wrapQuery(db, 'BacktestService');
guardedDb.prepare('DELETE FROM kline_data'); // 抛出错误！
```

## 📊 数据质量检查

当前K线数据状态：
- ✅ 无重复数据（UNIQUE 约束）
- ✅ 无价格异常数据
- ✅ 无 high < low 数据
- ✅ 总记录数：17,037条

## 💾 自动备份机制

### 备份频率
- **每小时自动备份一次**
- 保留最近24小时的备份

### 备份位置
`/home/user/webapp/db_backups/`

### 手动执行备份
```bash
bash /home/user/webapp/scripts/hourly-backup.sh
```

### 查看备份
```bash
ls -lh /home/user/webapp/db_backups/
```

### 恢复备份
```bash
# 停止服务
pm2 stop crypto-monitor

# 恢复备份（替换为你的备份文件名）
cp /home/user/webapp/db_backups/hourly_backup_YYYYMMDD_HHMMSS.sqlite \
   /home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite

# 重启服务
pm2 restart crypto-monitor
```

## 🚨 违规检测

如果检测到未授权的写入尝试，系统会：
1. **阻止操作** - 不执行SQL
2. **抛出错误** - 返回明确的错误信息
3. **记录日志** - 在控制台输出警告

错误信息格式：
```
🔒 [数据库安全] 禁止写入kline_data表！
调用者: BacktestService。
只有 KlineService, kline-sync 可以写入K线数据。
```

## 📝 添加新的写入权限

如果需要为新服务添加K线数据写入权限：

1. 编辑 `src/services/klineDbGuard.ts`
2. 在 `WRITE_ALLOWED_SERVICES` 数组中添加服务名
3. 在服务构造函数中调用权限检查

```typescript
private static readonly WRITE_ALLOWED_SERVICES = [
  'KlineService',
  'kline-sync',
  'NewService',  // ← 添加新服务
];
```

## ⚠️ 注意事项

1. **不要绕过守卫** - 所有K线数据访问都应该通过KlineService
2. **只读查询不受限制** - SELECT 语句可以自由使用
3. **批量操作受保护** - batch() 操作也会被检查
4. **迁移脚本例外** - 数据库迁移脚本不受此限制

---

**最后更新**：2025-10-29
**维护者**：System Administrator
