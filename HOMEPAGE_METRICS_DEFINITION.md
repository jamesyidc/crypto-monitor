# 📊 首页三大核心指标定义与业务逻辑

> **文档目的**: 明确定义首页显示的三个核心指标的计算逻辑和业务规则  
> **创建时间**: 2025-10-29  
> **适用范围**: Crypto Monitor 系统首页数据展示

---

## 📍 指标位置

这三个指标位于首页顶部的统计卡片区域：

```
┌─────────────────┬─────────────┬─────────────┐
│ 平均变化率      │   涨跌比    │  风险级别   │
│  +0.00%         │   0.0%      │     1       │
│  29只币种       │  涨≥1% / 跌≤-1%  │  低风险  │
└─────────────────┴─────────────┴─────────────┘
```

---

## 1️⃣ 平均变化率 (average_change)

### 📖 定义
**29只币种24小时涨跌幅的算术平均值**

### 🔢 计算公式
```javascript
平均变化率 = Σ(每只币种的24小时涨跌幅) / 总币种数量
```

### 📊 数据来源
- **数据源**: 币安API - 24小时行情数据 (ticker/24hr)
- **字段**: `priceChangePercent` (已转换为百分比)
- **更新频率**: 每次执行分析时实时获取

### 💻 实现位置

#### 后端计算
**文件**: `src/services/analysisService.ts`
**函数**: `performRoundAnalysis()`
**代码行**: 约150行

```typescript
// 获取所有币种数据
const coins = await this.coinService.getAllCoins();

// 从币安获取24小时行情
for (const coin of coins) {
  const ticker = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.symbol}USDT`);
  const change24h = parseFloat(ticker.data.priceChangePercent);
  // ...
}

// 计算平均变化率（前端计算）
```

#### 前端显示
**文件**: `public/static/app.js`
**函数**: `renderStatsCards()`

```javascript
// 计算平均变化率
const averageChange = coinDetails.length > 0
  ? (coinDetails.reduce((sum, coin) => sum + coin.change_24h, 0) / coinDetails.length).toFixed(2)
  : '0.00';

// 显示格式
const changeText = averageChange > 0 ? `+${averageChange}%` : `${averageChange}%`;
```

### 🎨 显示规则
- **正值**: 绿色显示，带 `+` 号，如 `+2.45%`
- **负值**: 红色显示，带 `-` 号，如 `-1.23%`
- **零值**: 灰色显示，如 `0.00%`
- **小数位**: 保留2位小数

### 📝 业务含义
- **> +5%**: 市场整体强势上涨
- **+2% ~ +5%**: 市场偏多
- **-2% ~ +2%**: 市场震荡
- **-5% ~ -2%**: 市场偏空
- **< -5%**: 市场整体大跌

### ⚠️ 注意事项
1. 此指标基于24小时数据，不是相对上一轮次
2. 包含所有29只币种，无过滤
3. 极端币种会影响整体平均值

---

## 2️⃣ 涨跌比 (green_ratio)

### 📖 定义
**当前轮次中，24小时涨幅为正（绿色）的币种占比**

⚠️ **重要修复（2025-10-29）**: 
- 之前版本错误使用了"轮次对比涨跌幅"来判断绿红色
- 已修复为正确使用"24小时涨跌幅"（从CoinGecko API获取）
- 修复后涨跌比才能正确显示非0%的值

### 🔢 计算公式
```javascript
涨跌比 = (绿色币种数量 / 总币种数量) × 100%

其中:
- 绿色币种: changePercent > 0 （严格大于0，必须上涨）
- 非绿色币种: changePercent <= 0 （包括下跌和持平）

⚠️ 重要：只有涨幅 > 0 才算绿色！
   持平（changePercent = 0）也算非绿色！
```

### 📊 数据来源
- **数据源**: 轮次分析结果 (`round_stats` 表)
- **字段**: 
  - `green_count` - 绿色币种数量
  - `red_count` - 红色币种数量
  - `green_ratio` - 绿色占比百分比

### 💻 实现位置

#### 后端计算
**文件**: `src/services/analysisService.ts`
**函数**: `performRoundAnalysis()`
**代码行**: 约67-83行

```typescript
// 🔧 修复后的正确实现（2025-10-29）
for (const [coinGeckoId, data] of Object.entries(priceData)) {
  const symbol = coingeckoIdToSymbol(coinGeckoId);
  
  // 使用24小时涨跌幅（从CoinGecko获取）
  const change24h = data.usd_24h_change || 0;
  const isGreen = change24h > 0;  // ✅ 正确：基于24小时涨跌幅
  const isRed = change24h < 0;
  
  if (isGreen) greenCount++;
  if (isRed) redCount++;
}

// 计算绿色占比
const totalCoins = coinDetails.length;
const greenRatio = totalCoins > 0 ? (greenCount / totalCoins) * 100 : 0;

// 保存轮次统计
await this.coinService.saveRoundStat(roundTime, {
  green_count: greenCount,
  red_count: redCount,
  green_ratio: greenRatio,
  // ...
});
```

**修复前的错误实现**（已修复）：
```typescript
// ❌ 错误：使用轮次对比涨跌幅
const changePercent = (data.usd - prevRecord.price) / prevRecord.price * 100;
const isGreen = changePercent > 0;  // 如果没有prevRecord，changePercent=0，导致is_green=0
```

#### 前端显示
**文件**: `public/static/app.js`
**函数**: `renderStatsCards()`

```javascript
{
  title: '涨跌比',
  value: `${latestRound.green_ratio.toFixed(1)}%`,
  icon: 'fa-balance-scale',
  color: latestRound.green_ratio > 50 ? 'green' : 'red',
  detail: `涨≥0% / 跌<0%`
}
```

### 🎨 显示规则
- **≥ 80%**: 深绿色 - 市场极度强势
- **60% ~ 80%**: 绿色 - 市场偏多
- **40% ~ 60%**: 黄色 - 市场均衡
- **20% ~ 40%**: 橙色 - 市场偏空
- **< 20%**: 红色 - 市场极度弱势

### 📝 业务含义
- **100%**: 全绿 - 所有币种上涨（罕见）
- **75%+**: 强势市场 - 大部分币种上涨
- **50%**: 市场均衡 - 涨跌各半
- **25%-**: 弱势市场 - 大部分币种下跌
- **0%**: 无绿色 - 没有任何币种上涨（触发风险提示）
  - 可能情况1：所有币种都下跌
  - 可能情况2：部分下跌 + 部分持平
  - **关键**：只要没有币种 > 0，就是0%

### ⚠️ 注意事项
1. ✅ **只有 changePercent > 0 才算绿色**
2. ❌ **changePercent = 0 的币种不算绿色**（这是关键！）
3. ❌ **changePercent < 0 的币种不算绿色**
4. 此指标反映市场广度，不反映市场强度
5. 不考虑涨跌幅大小，只看是否 > 0

---

## 3️⃣ 风险级别 (risk_alert_count)

### 📖 定义
**基于特定条件触发的市场风险预警等级**

### 🔢 触发条件

#### 后端触发逻辑
**文件**: `src/services/analysisService.ts`
**代码行**: 174-178行

```typescript
// 当前唯一触发条件：全市场下跌
let riskAlertCount = 0;
if (greenRatio === 0) {  // 没有任何币种上涨
  riskAlertCount = 1;    // 触发1次风险提示
}
```

#### 前端风险等级计算
**文件**: `public/static/app.js`
**函数**: `calculateRiskLevel(riskAlertCount)`
**代码行**: 约180-240行

```javascript
function calculateRiskLevel(riskAlertCount) {
  const now = new Date();
  const hour = now.getHours();
  
  let level = '低风险';
  let color = 'green';
  
  // 分时段风险评级
  if (hour >= 0 && hour < 6) {        // 0-6点（凌晨）
    if (riskAlertCount >= 4) {
      level = '高风险';
      color = 'red';
    } else if (riskAlertCount >= 3) {
      level = '中风险';
      color = 'orange';
    } else {
      level = '低风险';
      color = 'green';
    }
  }
  else if (hour >= 6 && hour < 12) {  // 6-12点（早上）
    if (riskAlertCount >= 5) {
      level = '高风险';
      color = 'red';
    } else if (riskAlertCount >= 4) {
      level = '中风险';
      color = 'orange';
    } else {
      level = '低风险';
      color = 'green';
    }
  }
  else if (hour >= 12 && hour < 18) { // 12-18点（下午）
    if (riskAlertCount >= 6) {
      level = '高风险';
      color = 'red';
    } else if (riskAlertCount >= 5) {
      level = '中风险';
      color = 'orange';
    } else {
      level = '低风险';
      color = 'green';
    }
  }
  else {                               // 18-24点（晚上）
    if (riskAlertCount >= 7) {
      level = '高风险';
      color = 'red';
    } else if (riskAlertCount >= 6) {
      level = '中风险';
      color = 'orange';
    } else {
      level = '低风险';
      color = 'green';
    }
  }
  
  return { level, color };
}
```

### 📊 数据来源
- **数据源**: 轮次分析累计计数 (`round_stats` 表)
- **字段**: `risk_alert_count` (累计次数)
- **重置**: 每日0点自动清零（待实现）

### 🎨 显示规则

#### 风险等级分时段阈值表

| 时间段 | 低风险 | 中风险 | 高风险 |
|--------|--------|--------|--------|
| 0-6点（凌晨）| < 3 | 3-4 | ≥ 4 |
| 6-12点（早上）| < 4 | 4-5 | ≥ 5 |
| 12-18点（下午）| < 5 | 5-6 | ≥ 6 |
| 18-24点（晚上）| < 6 | 6-7 | ≥ 7 |

#### 颜色编码
- **低风险**: 绿色 (`green`)
- **中风险**: 橙色 (`orange`)
- **高风险**: 红色 (`red`)

### 📝 业务含义

#### risk_alert_count 数值含义
- **0**: 正常市场，无风险提示
- **1**: 出现一次全市场下跌（涨跌比 = 0%）
- **2+**: 多次出现全市场下跌（高风险信号）

#### 分时段阈值逻辑
**为什么不同时段阈值不同？**

1. **凌晨（0-6点）**：市场交易量低，波动小，容易触发全跌
   - 阈值较低（3-4次）
   - 容错性小

2. **早上（6-12点）**：亚洲市场开盘，活跃度提升
   - 阈值中等（4-5次）

3. **下午（12-18点）**：全球市场活跃时段
   - 阈值较高（5-6次）
   - 全跌风险较低

4. **晚上（18-24点）**：欧美市场高峰，流动性最好
   - 阈值最高（6-7次）
   - 需要更多次数才算高风险

### ⚠️ 重要限制

#### 当前实现的局限性：
1. ❌ **累计计数未重置**: risk_alert_count 应该每日0点清零，目前未实现
2. ❌ **单一触发条件**: 只有"涨跌比=0%"才触发，条件过于单一
3. ❌ **累计逻辑缺失**: 每次分析应该 `+= 1`，而不是直接设为 `1`

#### 建议改进：
```typescript
// 应该改为累计逻辑
let riskIncrease = 0;
if (greenRatio === 0) {
  riskIncrease = 1;
}
// 或者增加更多触发条件
if (greenRatio < 10 && averageChange < -5) {
  riskIncrease = 1;
}
if (crashCount > surgeCount * 3) {
  riskIncrease = 1;
}

// 累加到当日总计数
const currentCount = await getCurrent risk_alert_count(today);
const newCount = currentCount + riskIncrease;
```

---

## 🔄 数据流程图

```
┌─────────────────┐
│  币安API        │
│  24小时行情数据  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  analysisService.performRoundAnalysis()  │
│  ├─ 计算 greenCount, redCount    │
│  ├─ 计算 greenRatio (涨跌比)    │
│  ├─ 判断 risk_alert_count (风险) │
│  └─ 计算 averageChange (平均变化率) │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│  round_stats表  │
│  保存轮次统计    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  /api/dashboard         │
│  getDashboardData()     │
│  返回最新轮次数据        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  前端 app.js            │
│  renderStatsCards()     │
│  ├─ 显示平均变化率       │
│  ├─ 显示涨跌比          │
│  └─ 显示风险级别        │
└─────────────────────────┘
```

---

## 🛠️ 手动修改功能

### 覆盖数据 API

可以通过以下API手动覆盖这三个指标的显示值（不影响数据库）：

```javascript
POST /api/dashboard/override
Content-Type: application/json

{
  "average_change": "+2.45%",    // 平均变化率（字符串）
  "risk_alert_count": 1,          // 风险级别（数字）
  // 注意：涨跌比(green_ratio)在前端计算，无法直接覆盖
}
```

### 管理界面
```
https://your-domain.com/dashboard-override.html
```

### 清除覆盖
```javascript
DELETE /api/dashboard/override
```

---

## 📚 相关文件索引

### 后端文件
- `src/services/analysisService.ts` - 核心分析逻辑
  - 第145-178行：绿红统计、涨跌比、风险计算
  - 第381-452行：getDashboardData() 返回数据
- `src/services/coinService.ts` - 数据库操作
  - 第499-511行：保存轮次统计
- `src/index.tsx` - API路由
  - 第42-69行：/api/dashboard 接口
  - 第71-143行：/api/dashboard/override 接口

### 前端文件
- `public/static/app.js` - 前端展示逻辑
  - 第180-240行：calculateRiskLevel() 风险等级计算
  - 第300-400行：renderStatsCards() 卡片渲染
  - 第150-180行：平均变化率计算

### 数据库表
- `round_stats` - 轮次统计表
  ```sql
  - round_time: 轮次时间
  - green_count: 绿色币种数
  - red_count: 红色币种数
  - green_ratio: 涨跌比百分比
  - risk_alert_count: 风险提示次数
  - surge_count: 急涨次数
  - crash_count: 急跌次数
  ```

---

## ✅ 总结

### 三大指标对比

| 指标 | 计算位置 | 更新频率 | 数据源 | 业务价值 |
|------|----------|----------|--------|----------|
| **平均变化率** | 前端计算 | 每次分析 | 币安24h | 反映市场整体涨跌强度 |
| **涨跌比** | 后端计算 | 每次分析 | 轮次统计 | 反映市场涨跌币种广度 |
| **风险级别** | 后端触发+前端评级 | 累计计数 | 触发条件 | 预警市场极端风险 |

### 关键业务规则
1. **平均变化率** = 29只币种24h涨跌幅的算术平均
2. **涨跌比** = 绿色币种占比（不考虑涨跌幅大小）
3. **风险级别** = 基于risk_alert_count累计次数，分时段评级

### 待优化项
1. ⚠️ risk_alert_count 需要每日0点清零逻辑
2. ⚠️ risk_alert_count 需要改为累加逻辑，不是每次设为1
3. ⚠️ 风险触发条件过于单一，建议增加更多条件
4. ✅ ~~涨跌比计算应该排除持平币种~~ - **已确认：持平币种（=0）不算绿色，这是正确的逻辑！**

---

**文档版本**: v1.0  
**最后更新**: 2025-10-29  
**维护人**: AI Assistant
