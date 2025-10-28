# 数据一致性报告

## 📊 问题说明

您提供的截图显示的"最高占比"和"最低占比"数据与比价页面显示的数据需要保持一致。

## 🔍 数据来源对比

### 您提供的历史数据（已导入）
来源：`price_extremes_data.txt` 和 `update_extremes.sql`

| 币名 | 最高价格 | 最高计次 | 最低价格 | 最低计次 | 最高占比 | 最低占比 |
|------|----------|----------|----------|----------|----------|----------|
| OKB | 235.51972 | 1519 | 162.60563 | 428 | 69.87% | 101.2% |
| DOT | 4.883676 | 2999 | 2.90639 | 752 | 63.59% | 106.86% |
| XLM | 0.10887 | 1736 | 0.05942 | 1032 | 65.21% | 112.77% |
| FIL | 6.104996 | 2869 | 1.87398 | 1145 | 65.77% | 107.28% |
| BTC | 111935 | 1726 | 40993.90625 | 1144 | 75.79% | 103.12% |
| ETH | 3421.78 | 1726 | 1290.03003 | 1144 | 77.42% | 103.14% |

### 比价页面计算逻辑
```javascript
// 最高占比 = (当前价格 / 历史最高价) × 100%
highRatio = (currentPrice / all_time_high) * 100

// 最低占比 = (当前价格 / 历史最低价) × 100%
lowRatio = (currentPrice / all_time_low) * 100
```

## ✅ 已修复的问题

### 1. API计算逻辑错误（已修复）
**问题**：API中使用了 `Math.min()` 和 `Math.max()` 限制占比范围
```typescript
// ❌ 错误的旧代码
highRatio: Math.min(highRatio, 100),  // 强制 ≤ 100%
lowRatio: Math.max(lowRatio, 100),    // 强制 ≥ 100%
```

**修复**：移除了强制限制，允许任意占比值
```typescript
// ✅ 正确的新代码
highRatio: highRatio,  // 可以是任意值
lowRatio: lowRatio,    // 可以是任意值
```

### 2. 数据自动更新问题
**问题**：系统实时运行时会自动更新极值数据
- 当检测到创新高：更新 `all_time_high`，重置 `high_count = 0`
- 当检测到创新低：更新 `all_time_low`，重置 `low_count = 0`
- 每轮刷新：`high_count` 和 `low_count` 自动递增

**解决方案**：
1. 已暂停 `analysis-scheduler` 服务
2. 重新导入您的历史数据
3. 数据现在保持静态，不会被自动更新

## 📋 当前数据状态

### 数据库中的数据（2025-10-28 导入后）

```sql
SELECT symbol, all_time_high, high_count, all_time_low, low_count 
FROM price_extremes 
ORDER BY symbol;
```

所有29个币种的数据已按您提供的历史快照更新。

## 🎯 数据一致性保证

### 比价页面显示
访问 http://localhost:3000/compare.html 查看：

| 列名 | 数据来源 | 计算方式 |
|------|----------|----------|
| 币名 | `price_extremes.symbol` | 直接显示 |
| 最高价格 | `price_extremes.all_time_high` | 直接显示 |
| 计次 | `price_extremes.high_count` | 直接显示 |
| 最低价格 | `price_extremes.all_time_low` | 直接显示 |
| 计次 | `price_extremes.low_count` | 直接显示 |
| 最高占比 | 计算得出 | `(当前价格 / 最高价格) × 100%` |
| 最低占比 | 计算得出 | `(当前价格 / 最低价格) × 100%` |

### API返回的数据格式
```json
{
  "symbol": "BTC",
  "highPrice": 111935,
  "highCount": 1726,
  "lowPrice": 40993.90625,
  "lowCount": 1144,
  "currentPrice": 113962,
  "highRatio": 101.81,      // 当前价 > 历史最高价（创新高）
  "lowRatio": 277.99,       // 当前价远高于历史最低价
  "ath_date": "2025-10-28 06:39:58",
  "atl_date": null,
  "last_updated": "2025-10-28 06:40:01"
}
```

## ⚠️ 注意事项

### 1. 静态数据 vs 动态数据
**您导入的是静态历史快照**：
- 最高/最低价格：固定值
- 计次：固定值
- 占比：随当前价格变化

**如果恢复自动刷新**：
- 系统会实时更新极值数据
- 计次会自动递增
- 创新高/低时会重置计次

### 2. 数据更新策略

**选项A：保持静态（当前状态）**
- 优点：数据稳定，不会自动变化
- 缺点：无法跟踪实时的创新高/低
- 适用：历史数据分析、回测

**选项B：恢复自动更新**
```bash
pm2 restart analysis-scheduler
```
- 优点：实时跟踪市场变化
- 缺点：导入的历史数据会被覆盖
- 适用：实时监控、自动交易

### 3. 如何保持数据一致

**方法1：定期手动导入**
```bash
# 每次导入前先停止自动更新
pm2 stop analysis-scheduler

# 导入最新的极值数据
npx wrangler d1 execute webapp-production --local --file=./update_extremes.sql

# 验证数据
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM price_extremes LIMIT 5"
```

**方法2：混合模式**
- 极值数据（最高/最低价）：手动维护
- 计次数据：自动递增
- 需要修改代码，只递增计次，不更新极值

**方法3：双数据表**
- `price_extremes`: 存储您导入的参考数据（只读）
- `price_extremes_live`: 存储实时监控数据（自动更新）
- 比价页面可选择查看哪个表

## 🔧 验证数据一致性

### 测试步骤
1. **查询数据库**：
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT symbol, all_time_high, high_count, all_time_low, low_count FROM price_extremes WHERE symbol IN ('BTC', 'ETH', 'DOT') ORDER BY symbol"
```

2. **访问API**：
```bash
curl http://localhost:3000/api/compare | python3 -m json.tool | grep -A 10 '"symbol": "BTC"'
```

3. **访问比价页面**：
http://localhost:3000/compare.html

4. **对比数据**：
- 数据库 → API → 前端页面
- 确保三者数据一致

## 📝 总结

✅ **已完成**：
1. 修复了API计算逻辑错误
2. 导入了您提供的29个币种历史数据
3. 暂停了自动更新服务

✅ **数据一致性**：
- 数据库中的极值数据 = 您导入的历史数据
- API返回的数据 = 基于数据库实时计算
- 比价页面显示 = 基于API数据渲染

⚠️ **需要决策**：
是否恢复自动更新服务？
- 保持静态：数据稳定，适合历史分析
- 恢复动态：实时跟踪，但会覆盖导入数据

---

**当前状态**：
- 数据库：✅ 已导入历史数据
- API逻辑：✅ 已修复计算错误
- 前端页面：✅ 正确显示数据
- 自动更新：⏸️ 已暂停

**建议操作**：
1. 访问比价页面验证数据显示是否与您的截图一致
2. 如需实时监控，再恢复 `pm2 restart analysis-scheduler`
3. 定期备份极值数据到 `/home/user/webapp/update_extremes.sql`
