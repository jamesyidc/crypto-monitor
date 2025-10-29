# 时区数据不一致问题说明

## 问题描述

系统存在时区数据不一致的问题，导致新高新低统计错误。

### 症状
- 首页显示"创新高24次、创新低4次"
- 但实际今天（UTC 2025-10-29）只有2次新低，0次新高
- 比价页面的极值记录显示正确

## 根本原因

### 数据表时区混用
1. **extreme_records 表**
   - `timestamp` 字段：存储 UTC 时间
   - 查询示例：`DATE(timestamp) = '2025-10-29'` 返回UTC日期的记录

2. **daily_stats 表**
   - `date` 字段：存储**北京时间日期**（使用 `getBeijingDateString()`）
   - `new_high_count` / `new_low_count`：累加自 extreme_records 的数据

### 时间点冲突案例
```
UTC 时间:    2025-10-28 16:12:43  (10月28日)
北京时间:    2025-10-29 00:12:43  (10月29日)

问题流程：
1. UTC 10月28日16:12 发生新高事件
2. 北京时间已经是10月29日00:12
3. analysisService 使用北京日期 '2025-10-29' 作为 daily_stats.date
4. 将这些新高累加到10月29日的统计中
5. 导致10月29日的新高数据包含了昨天的记录
```

## 已修复部分

### ✅ getTodayExtremeCount 方法（specialStats）
**文件**: `src/services/coinService.ts:731`

```typescript
// 修复后：按 UTC 日期统计
SELECT COUNT(*) FROM extreme_records 
WHERE DATE(timestamp) = ? AND record_type = ?
```

**效果**: 
- `/api/dashboard` 的 `specialStats.todayNewHighCount` 正确显示 0
- `/api/dashboard` 的 `specialStats.todayNewLowCount` 正确显示 2

### ✅ 数据库手动修正
```sql
-- 清除错误数据
UPDATE daily_stats 
SET new_high_count = 0, new_low_count = 0 
WHERE date = '2025-10-29';

-- 写入正确数据（OKB 2次新低）
UPDATE daily_stats 
SET new_low_count = 2 
WHERE date = '2025-10-29' AND symbol = 'OKB';
```

## 未修复部分

### ⚠️ 累加逻辑仍然存在时区混用

**文件**: `src/services/analysisService.ts:258-289`

```typescript
private async updateDailyStats(date: string, coinDetails: any[], ...) {
  // date 参数使用北京时间日期
  const date = getBeijingDateString(); // '2025-10-29'
  
  // 但 coinDetails[].new_high_count 来自即时判断
  // 判断逻辑基于 UTC 时间戳
  for (const detail of coinDetails) {
    const newHighCount = (coinStat?.new_high_count || 0) + detail.new_high_count;
    // ⚠️ 如果在 UTC 10月28日16:12 触发新高
    // 会被累加到北京时间10月29日的 daily_stats 中
  }
}
```

## 解决方案建议

### 方案1: 统一使用UTC日期（推荐）

**优点**: 逻辑清晰，避免时区混淆  
**缺点**: 需要修改多处代码

**需要修改**:
1. `analysisService.ts:17-18`: 改用 UTC 日期
   ```typescript
   const today = new Date().toISOString().split('T')[0]; // UTC日期
   ```

2. `analysisService.ts:394`: getDashboardData 改用 UTC 日期
   ```typescript
   const today = new Date().toISOString().split('T')[0];
   ```

3. 前端显示时转换为北京时间显示（仅展示层处理）

### 方案2: 明确区分判断逻辑

**优点**: 保持现有的北京时间日期结构  
**缺点**: 逻辑复杂，容易出错

**需要修改**:
1. 在 `performRoundAnalysis` 中判断新高新低时，检查 UTC 日期是否与北京日期一致
2. 仅在 UTC 日期匹配时才设置 `new_high_count = 1`

```typescript
// 检查是否创新高
if (data.usd > extreme.all_time_high) {
  await this.coinService.updatePriceExtreme(symbol, 'high', data.usd);
  await this.coinService.saveExtremeRecord(symbol, 'new_high', data.usd, ...);
  
  // 🔧 新增：仅在 UTC 日期与北京日期一致时才计入今日统计
  const utcDate = new Date().toISOString().split('T')[0];
  const beijingDate = getBeijingDateString();
  newHighCount = (utcDate === beijingDate) ? 1 : 0;
}
```

## 当前状态

- ✅ specialStats（首页"24小时新高新低"卡片下方）显示正确：0新高，2新低
- ✅ daily_stats 数据已手动修正
- ⚠️ 未来的分析轮次仍会出现时区混用问题
- ⚠️ 建议尽快实施方案1或方案2

## 验证方法

```bash
# 1. 查询 extreme_records（按UTC日期）
npx wrangler d1 execute webapp-production --local --command="
  SELECT record_type, COUNT(*) 
  FROM extreme_records 
  WHERE DATE(timestamp) = '2025-10-29' 
  GROUP BY record_type
"
# 预期：new_low: 2

# 2. 查询 daily_stats（使用北京日期）
npx wrangler d1 execute webapp-production --local --command="
  SELECT SUM(new_high_count), SUM(new_low_count) 
  FROM daily_stats 
  WHERE date = '2025-10-29'
"
# 预期：0, 2

# 3. 测试 API
curl -s http://localhost:3000/api/dashboard | jq '.specialStats'
# 预期：todayNewHighCount: 0, todayNewLowCount: 2
```

## 相关提交

- `0a835c9`: 修复 getTodayExtremeCount 改为按UTC日期统计
- 数据库手动修正：2025-10-29 清零后重新设置OKB 2次新低
