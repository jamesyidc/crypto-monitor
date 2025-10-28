# 开发手册 - 问题记录与解决方案

## 连续上涨占优统计功能 - 重大Bug修复

### 发现时间
2025-10-28

### 问题描述
**错误的统计逻辑：**
1. ❌ 使用 `coin_round_details` 表的 `round_time` 进行统计
2. ❌ `round_time` 是所有币种的同步采集时间，不是单个币种的K线时间
3. ❌ 导致统计的是"采集轮次"而非"K线根数"

**用户反馈：**
- TAO币种在K线页面显示有27根K线记录
- 但连续上涨统计显示为0
- 用户截图显示一页就有25条K线数据

### 根本原因
混淆了两个概念：
- **采集轮次（round_time）**: 系统每次采集所有币种的价格数据
- **K线数据（kline_data）**: 每个币种独立的K线历史记录

**正确的数据表：**
- `kline_data` 表存储真正的K线数据
- 字段：`symbol`, `timeframe`, `open_time`, `open`, `high`, `low`, `close`, `volume`
- 每个币种有独立的K线序列

### 解决方案

#### 1. 修改统计逻辑
从 `kline_data` 表读取每个币种的K线数据：

```sql
SELECT 
  kd.symbol,
  kd.open_time,
  kd.close as current_price,
  pe.all_time_high,
  pe.all_time_low,
  CASE 
    WHEN pe.all_time_high > 0 
    THEN (kd.close * 100.0 / pe.all_time_high)
    ELSE 0 
  END as high_ratio,
  CASE 
    WHEN pe.all_time_low > 0 
    THEN (kd.close * 100.0 / pe.all_time_low)
    ELSE 0 
  END as low_ratio
FROM kline_data kd
JOIN price_extremes pe ON kd.symbol = pe.symbol
WHERE kd.symbol = ? 
  AND kd.timeframe = '5m'  -- 使用5分钟K线
ORDER BY kd.open_time ASC
```

#### 2. 统计算法
```typescript
// 按时间顺序遍历每根K线
for (const kline of klines) {
  const isRiseDominant = kline.high_ratio > kline.low_ratio;
  
  if (isRiseDominant) {
    currentStreak++;  // 连续+1
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
      maxStreakStart = kline.open_time;
      maxStreakEnd = kline.open_time;
    }
  } else {
    currentStreak = 0;  // 中断，重置
  }
}
```

#### 3. 性能优化
- 分批处理币种，避免一次性加载所有数据
- 使用索引：`(symbol, timeframe, open_time)`
- 限制分析的时间范围（如最近1000根K线）

### 数据表结构对比

| 表名 | 用途 | 记录单位 |
|------|------|---------|
| `coin_round_details` | 实时价格采集 | 采集轮次 (所有币种同步) |
| `kline_data` | K线历史数据 | 每个币种的K线 (独立序列) |

### 重要教训
1. **明确数据粒度**: 统计"K线数量"必须使用K线表，不能用采集轮次
2. **验证假设**: 在实现功能前，先确认数据表的真实含义
3. **用户反馈**: 实际数据总是最好的验证方式

### 修复计划
1. ✅ 记录问题到开发手册
2. ⏳ 重写 `ConsecutiveRiseService.analyzeHistoricalData()`
3. ⏳ 修改为从 `kline_data` 表读取数据
4. ⏳ 测试验证TAO等币种的连续统计
5. ⏳ 提交修复代码

### 相关文件
- `src/services/ConsecutiveRiseService.ts` - 需要重写
- `migrations/0004_kline_tables.sql` - K线表结构
- `migrations/0020_consecutive_rise_dominance.sql` - 统计表结构
