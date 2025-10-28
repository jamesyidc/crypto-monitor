# 开发手册 - 问题记录与解决方案

## 连续上涨占优统计功能 - 核心定义

### 📊 数据表列定义（完整）

连续上涨占优统计表中的所有列定义如下：

#### 1. 币种 (symbol)
- **定义**：币种代码，如 BTC、ETH、TAO 等
- **类型**：TEXT
- **说明**：唯一标识一个币种，用于关联其他表（如 price_extremes, kline_data）

#### 2. 今天最大连续K线数 (max_streak)
- **定义**：该币种**今天（当天0点到现在）**连续处于"上涨占优"状态的最大K线根数
- **类型**：INTEGER
- **计算方式**：
  - 仅遍历该币种**今天**的K线（从0点开始到当前时间）
  - 当某根K线满足"上涨占优"条件时，连续计数+1
  - 当某根K线不满足"上涨占优"条件时，连续计数重置为0
  - 记录今天过程中出现的最大连续值
- **重要**：每天0点自动清零，重新开始统计
- **说明**：用于识别币种在**当天**的强势上涨周期

#### 3. 开始时间 (max_streak_start_time)
- **定义**：**今天**最大连续上涨占优周期的第一根K线的时间
- **类型**：TEXT (ISO 8601格式：YYYY-MM-DDTHH:mm:ss.sssZ)
- **计算方式**：当今天的连续计数达到新的最大值时，记录该连续周期的起始K线时间
- **重要**：每天0点清空，时间必须是今天的日期
- **说明**：标识今天强势周期的起点

#### 4. 结束时间 (max_streak_end_time)
- **定义**：**今天**最大连续上涨占优周期的最后一根K线的时间
- **类型**：TEXT (ISO 8601格式：YYYY-MM-DDTHH:mm:ss.sssZ)
- **计算方式**：当今天的连续计数达到新的最大值时，记录当前K线时间
- **重要**：每天0点清空，时间必须是今天的日期
- **说明**：标识今天强势周期的终点

#### 5. 当前连续 (current_streak)
- **定义**：截止到**今天**最新K线，当前正在进行的连续上涨占优K线根数
- **类型**：INTEGER
- **计算方式**：
  - 如果今天最新K线满足"上涨占优"，则 current_streak = 上一次的 current_streak + 1
  - 如果今天最新K线不满足"上涨占优"，则 current_streak = 0（重置）
- **重要**：每天0点自动清零
- **说明**：
  - 当 current_streak > 0 时，表示当前处于上涨占优状态（进行中）
  - 当 current_streak = 0 时，表示当前不处于上涨占优状态（已中断）
  - 这个值必须 ≤ max_streak（当前连续不会超过今天的最大连续）

#### 6. 占比上涨 (last_high_ratio / up_channel_exhaustion_ratio)
- **定义**：往前40根K线中，处于"上升通道 📈"或"上升衰竭 ⚠️"的K线占比（百分比）
- **类型**：REAL (0-100的浮点数)
- **计算方式**：
  1. 获取当前K线往前的40根K线（包括当前K线）
  2. 统计其中满足以下条件的K线数量：
     - 通道状态 = "上升通道 📈" (angle_MB > 5 && width_change > 3)
     - 或 通道状态 = "上升衰竭 ⚠️" (angle_MB > 5 && width_change < -3)
  3. 占比 = (符合条件的K线数 / 40) * 100
- **数据来源**：`klineService.getKlineWithIndicators()` 返回的 `up_channel_exhaustion_ratio` 字段
- **说明**：反映币种在近期处于上升趋势的强度

#### 7. 占比下跌 (last_low_ratio / down_channel_exhaustion_ratio)
- **定义**：往前40根K线中，处于"下降通道 📉"或"下跌衰竭 ⚠️"的K线占比（百分比）
- **类型**：REAL (0-100的浮点数)
- **计算方式**：
  1. 获取当前K线往前的40根K线（包括当前K线）
  2. 统计其中满足以下条件的K线数量：
     - 通道状态 = "下降通道 📉" (angle_MB < -5 && width_change > 3)
     - 或 通道状态 = "下跌衰竭 ⚠️" (angle_MB < -5 && width_change < -3)
  3. 占比 = (符合条件的K线数 / 40) * 100
- **数据来源**：`klineService.getKlineWithIndicators()` 返回的 `down_channel_exhaustion_ratio` 字段
- **说明**：反映币种在近期处于下降趋势的强度

#### 8. 状态
- **定义**：当前连续上涨占优的状态
- **类型**：文本标签（前端显示用）
- **取值**：
  - **"进行中"**：当 current_streak > 0 时显示，表示当前正处于连续上涨占优状态
  - **"已中断"**：当 current_streak = 0 时显示，表示连续已被中断
- **样式**：
  - 进行中：绿色徽章 (bg-green-100 text-green-700)
  - 已中断：灰色徽章 (bg-gray-100 text-gray-600)
- **说明**：帮助用户快速判断币种当前是否处于强势上涨状态

---

### 🔄 上涨占优判断逻辑

**判断条件：**
```
上涨占优 = (占比上涨 > 占比下跌)
```

**示例：**
假设某币种TAO在某根K线：
- 占比上涨 = 62.5% (往前40根K线中，有25根处于上升通道或上升衰竭)
- 占比下跌 = 25.0% (往前40根K线中，有10根处于下降通道或下跌衰竭)
- 因为 62.5% > 25.0%，所以该K线判定为"上涨占优" ✅

---

### 🎯 通道状态判断（基于布林带）

根据布林带中轨角度（angle_MB）和带宽变化率（width_change）判断：

```typescript
if (angle_MB > 5 && width_change > 3)  → 上升通道 📈
if (angle_MB < -5 && width_change > 3) → 下降通道 📉
if (angle_MB > 5 && width_change < -3) → 上升衰竭 ⚠️
if (angle_MB < -5 && width_change < -3) → 下跌衰竭 ⚠️
```

**说明：**
- `angle_MB` = 布林带中轨的角度，反映趋势方向
- `width_change` = 布林带宽度的变化率，反映波动性变化

---

### 📦 数据来源

**必须使用 `klineService.getKlineWithIndicators()` 获取K线数据**

每根K线已经计算好了：
- `up_channel_exhaustion_ratio` → 占比上涨
- `down_channel_exhaustion_ratio` → 占比下跌
- `channel_state` → 通道状态

这些字段在 `indicatorService.ts` 的第285-309行计算。

---

### ⚠️ 重要规则

1. **每日清零规则（最重要）**：
   - 每天0点（UTC+8时区），所有币种的 `max_streak`、`current_streak`、`max_streak_start_time`、`max_streak_end_time` 必须清零
   - 统计范围：仅统计**今天（当天0点到现在）**的K线数据
   - 目的：每天独立统计，不累积历史数据
   
2. **禁止自行计算占比**：必须使用 `klineService.getKlineWithIndicators()` 已计算好的字段

3. **数据表字段命名**：`last_high_ratio` 和 `last_low_ratio` 字段名有误导性，实际存储的是"占比上涨"和"占比下跌"

4. **时间格式**：所有时间字段必须使用 ISO 8601 格式

5. **连续计数规则**：一旦不满足"上涨占优"条件，连续计数立即重置为0

6. **时间范围检查**：在分析K线时，必须过滤出今天的K线（open_time >= 今天0点）

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
