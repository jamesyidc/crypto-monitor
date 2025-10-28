# 开发手册 - 问题记录与解决方案

## 连续上涨占优统计功能 - 核心定义

### ⚠️ 重要：占比的正确定义

**占比上涨**和**占比下跌**是基于通道状态的统计性指标，不是简单的价格比值！

#### 核心定义
- **占比下跌** = 往前40根K线中，处于"下降通道 📉"或"下跌衰竭 ⚠️"的K线占比（百分比）
- **占比上涨** = 往前40根K线中，处于"上升通道 📈"或"上升衰竭 ⚠️"的K线占比（百分比）
- **上涨占优** = 当 `占比上涨 > 占比下跌` 时，认为该K线处于上涨占优状态

#### 通道状态判断（基于布林带）
根据布林带中轨角度（angle_MB）和带宽变化率（width_change）判断：
```typescript
if (angle_MB > 5 && width_change > 3)  → 上升通道 📈
if (angle_MB < -5 && width_change > 3) → 下降通道 📉
if (angle_MB > 5 && width_change < -3) → 上升衰竭 ⚠️
if (angle_MB < -5 && width_change < -3) → 下跌衰竭 ⚠️
```

#### 数据来源
- 必须使用 `indicatorService.getKlineWithIndicators()` 获取K线数据
- 每根K线已经计算好了：
  - `up_channel_exhaustion_ratio` (占比上涨)
  - `down_channel_exhaustion_ratio` (占比下跌)
- 这些字段在 `indicatorService.ts` 的第285-309行计算

#### 示例
假设某币种TAO，查看往前40根K线：
- 其中25根处于"上升通道"或"上升衰竭" → 占比上涨 = 25/40 = 62.5%
- 其中10根处于"下降通道"或"下跌衰竭" → 占比下跌 = 10/40 = 25.0%
- 因为 62.5% > 25.0%，所以当前这根K线判定为"上涨占优"

---

## Bug修复记录

### 发现时间
2025-10-28

### 问题描述

**Bug #1: 错误的数据源**
1. ❌ 使用 `coin_round_details` 表的 `round_time` 进行统计
2. ❌ `round_time` 是所有币种的同步采集时间，不是单个币种的K线时间
3. ❌ 导致统计的是"采集轮次"而非"K线根数"

**Bug #2: 完全错误的占比计算**
1. ❌ 错误地使用了 `price / ATH` 和 `price / ATL` 计算占比
2. ❌ 没有使用已经计算好的 `up_channel_exhaustion_ratio` 和 `down_channel_exhaustion_ratio`
3. ❌ 导致所有币种统计结果都是0，或者全是401（因为计算逻辑完全错误）

### 根本原因

**完全理解错了"占比"的含义！**

- ❌ 错误理解：占比 = 价格相对于ATH/ATL的百分比
- ✅ 正确理解：占比 = 往前40根K线中，符合特定通道状态的K线数量百分比

### 解决方案

#### 1. 修改 ConsecutiveRiseService.ts

**修改前（错误）：**
```typescript
// 直接从 kline_data 获取价格数据
const highRatio = price * 100.0 / allTimeHigh;
const lowRatio = price * 100.0 / allTimeLow;
const isRiseDominant = lowRatio > highRatio;  // 错误的判断
```

**修改后（正确）：**
```typescript
// 从 indicatorService 获取带技术指标的K线数据
const indicatorService = new IndicatorService(this.db);
const result = await indicatorService.getKlineWithIndicators(symbol, timeframe, limit);

for (const kline of result.data) {
  const upRatio = kline.up_channel_exhaustion_ratio || 0;    // 占比上涨
  const downRatio = kline.down_channel_exhaustion_ratio || 0; // 占比下跌
  const isRiseDominant = upRatio > downRatio;  // 正确的判断
}
```

#### 2. 数据表字段含义更新

`consecutive_rise_dominance` 表的字段：
- `last_high_ratio` → 存储"占比上涨"（up_channel_exhaustion_ratio）
- `last_low_ratio` → 存储"占比下跌"（down_channel_exhaustion_ratio）

注意：字段名有误导性，但为了保持数据库兼容性，暂不修改表结构。

### 测试验证

修复后重新分析历史数据：
```bash
POST /api/consecutive-rise/analyze-history?timeframe=5m&limit=1000
```

预期结果：
- 所有币种应该有真实的连续统计数据
- TAO、CRO、BNB、XRP、ETH等应该有超过20根的连续记录

---

## 相关文件

- `src/services/ConsecutiveRiseService.ts` - 连续统计服务（已修复）
- `src/services/indicatorService.ts` - 技术指标计算服务（提供占比数据）
- `migrations/0020_consecutive_rise_dominance.sql` - 统计表结构
- `public/pattern.html` - 前端展示页面
- `public/static/pattern.js` - 前端逻辑

---

## 重要教训

1. **仔细理解业务定义**：不要自己臆测"占比"的含义，要去查看原有代码的计算逻辑
2. **利用已有功能**：`indicatorService` 已经计算好了所需的占比字段，不要重复造轮子
3. **阅读注释和文档**：`ConsecutiveRiseService.ts` 开头的注释已经写明了正确的定义
4. **验证数据来源**：确认使用的是正确的数据表和字段
5. **不要自己发挥**：严格按照用户的定义实现功能
