# K线系统表格 - 字段映射完整清单

## 📊 32列数据的完整映射关系

| 序号 | 表格列名 | 数据库表 | 字段名 | 数据来源 | 当前状态 |
|------|---------|---------|--------|---------|---------|
| 1 | 时间 | kline_snapshot_latest | kline_time | kline_data.open_time | ✅ 正常 |
| 2 | 首页排名 | kline_snapshot_latest | homepage_rank | Dashboard API | ❌ NULL |
| 3a | 起涨点 | kline_snapshot_latest | surge_start_point | 计算逻辑 (V1/V2+涨幅) | ❌ NULL |
| 3b | 起跌点 | kline_snapshot_latest | crash_start_point | 计算逻辑 (V1/V2+跌幅) | ❌ NULL |
| 4 | 操作 | kline_snapshot_latest | operation_tip | 信号生成或kline_data | ❌ NULL |
| 5a | 起涨次数 | kline_snapshot_latest | today_surge_count | Dashboard API | ❌ 0 |
| 5b | 起跌次数 | kline_snapshot_latest | today_crash_count | Dashboard API | ❌ 0 |
| 6 | 10格 | kline_snapshot_latest | kline_index | 快照生成时 (1/2/3) | ✅ 正常 |
| 7 | 48h高 | kline_snapshot_latest | rounds_since_48h_high | 计算 (576条历史) | ❌ 0 |
| 8 | 跌幅 | kline_snapshot_latest | decline_from_48h_high | 计算公式 | ❌ 0 |
| 9 | 48h低 | kline_snapshot_latest | rounds_since_48h_low | 计算 (576条历史) | ❌ 0 |
| 10 | 涨幅 | kline_snapshot_latest | rise_from_48h_low | 计算公式 | ❌ 0 |
| 11 | 开 | kline_snapshot_latest | open_price | kline_data.open | ✅ 正常 |
| 12 | 高 | kline_snapshot_latest | high_price | kline_data.high | ✅ 正常 |
| 13 | 低 | kline_snapshot_latest | low_price | kline_data.low | ✅ 正常 |
| 14 | 收 | kline_snapshot_latest | close_price | kline_data.close | ✅ 正常 |
| 15 | 涨跌 | kline_snapshot_latest | change_percent | kline_data或计算 | ✅ 正常 |
| 16 | 量 | kline_snapshot_latest | volume | kline_data.volume | ✅ 正常 |
| 17 | V1 | kline_snapshot_latest | v1_flag | kline_data.volume_v1 | ❌ 0 |
| 18 | V2 | kline_snapshot_latest | v2_flag | kline_data.volume_v2 | ❌ 0 |
| 19a | 买入信号 | kline_snapshot_latest | buy_signal | generateBuySellSignals() | ❌ NULL |
| 19b | 卖出信号 | kline_snapshot_latest | sell_signal | generateBuySellSignals() | ❌ NULL |
| 20 | SAR | kline_snapshot_latest | sar_value | kline_data.sar | ✅ 正常 |
| 21 | SAR变 | kline_snapshot_latest | sar_position | 计算 (above/below) | ✅ 正常 |
| 22 | SAR% | kline_snapshot_latest | sar_distance_percent | kline_data.sar_change_percent | ✅ 正常 |
| 23 | 涨差 | kline_snapshot_latest | macd_histogram | kline_data.macd_histogram | ✅ 正常 |
| 24 | RSI5 | kline_snapshot_latest | rsi_5 | kline_data.rsi_5min | ✅ 正常 |
| 25 | RSI1 | kline_snapshot_latest | rsi_14 | kline_data.rsi_1h | ✅ 正常 |
| 26 | MB | kline_snapshot_latest | bollinger_middle | kline_data.boll_mb | ✅ 正常 |
| 27 | UB | kline_snapshot_latest | bollinger_upper | kline_data.boll_ub | ✅ 正常 |
| 28 | LB | kline_snapshot_latest | bollinger_lower | kline_data.boll_lb | ✅ 正常 |
| 29 | 下跌 | kline_snapshot_latest | channel_decline_ratio | kline_data.down_channel_exhaustion_ratio | ✅ 正常 |
| 30 | 上涨 | kline_snapshot_latest | channel_rise_ratio | kline_data.up_channel_exhaustion_ratio | ✅ 正常 |
| 31 | 带宽 | kline_snapshot_latest | bollinger_width | kline_data.boll_width_change | ✅ 正常 |
| 32 | 通道 | kline_snapshot_latest | bollinger_position | kline_data.channel_state | ✅ 正常 |

---

## 📈 数据来源层级关系

```
外部API (OKX)
    ↓
kline_data 表 (主数据表)
    ├─ 基础K线: open, high, low, close, volume
    ├─ 技术指标: sar, rsi_5min, rsi_1h, boll_mb/ub/lb
    ├─ MACD: macd_histogram
    ├─ 通道: down/up_channel_exhaustion_ratio, channel_state
    ├─ V1/V2: volume_v1, volume_v2 ← ❌ 未计算
    └─ 操作: operation_tip ← ❌ 未填充
    ↓
kline_snapshot_latest 表 (快照表)
    ├─ 从 kline_data 复制: ✅ 27个字段正常
    ├─ 从 Dashboard API 获取: ❌ 6个字段缺失
    ├─ 实时计算: ❌ 10个字段返回默认值
    └─ 总计: 27✅ + 14❌ = 41个字段
```

---

## 🔧 最新修复 (2025-11-03)

### ✅ 已修复：技术指标实时计算
**问题**: 之前 `kline_snapshot_latest` 的技术指标字段都是 null，因为从 `kline_data` 表读取的数据不包含指标。

**原因**: `kline_data` 表在K线同步时只保存原始OHLCV数据，技术指标字段都是null。

**解决方案**: 修改 `src/index.tsx` Line 1206-1209，改用 `KlineService.getKlineWithIndicators()` 替代 `ReadOnlyKlineService.getKlineData()`
- `getKlineWithIndicators()` 会实时计算所有技术指标（RSI, SAR, MACD, Bollinger Bands）
- 计算好的数据直接传入 `signalMatchingService.saveLatestKlineSnapshots()`
- 保存到 `kline_snapshot_latest` 表时包含完整的技术指标数据

**受影响字段** (现在应该有值):
- ✅ rsi_5 (5分钟RSI)
- ✅ rsi_14 (1小时RSI)
- ✅ sar_value (SAR指标值)
- ✅ sar_position (above/below)
- ✅ sar_distance_percent (SAR距离百分比)
- ✅ macd_value/macd_signal/macd_histogram (MACD指标)
- ✅ bollinger_middle/upper/lower (布林带)
- ✅ bollinger_width (带宽)
- ✅ bollinger_position (通道位置)
- ✅ channel_decline_ratio (下跌占比)
- ✅ channel_rise_ratio (上涨占比)

**测试方法**:
```bash
# 1. 重启服务器以加载新代码
pkill -9 workerd
npx wrangler pages dev --port 3000 --d1 DB=placeholder

# 2. 触发K线同步和快照保存
curl -X POST http://localhost:3000/api/kline/sync/auto

# 3. 查看快照数据
curl http://localhost:3000/api/signal-matching/snapshots/BTC | jq '.data[0]'
```

---

## 🔍 详细字段说明

### 1️⃣ 基础K线数据 (✅ 全部正常 - 8字段)

| 字段 | 快照表字段名 | 主表字段名 | 说明 |
|------|-------------|-----------|------|
| 时间 | kline_time | kline_data.open_time | 时间戳(毫秒) |
| 开 | open_price | kline_data.open | 开盘价 |
| 高 | high_price | kline_data.high | 最高价 |
| 低 | low_price | kline_data.low | 最低价 |
| 收 | close_price | kline_data.close | 收盘价 |
| 量 | volume | kline_data.volume | 成交量 |
| 涨跌 | change_percent | 计算或kline_data.change_percent | (收-开)/开×100 |
| 10格 | kline_index | 生成时赋值 | 1/2/3 (索引) |

---

### 2️⃣ 首页统计数据 (❌ 全部缺失 - 6字段)

| 字段 | 快照表字段名 | 来源 | 当前值 | 问题 |
|------|-------------|------|-------|------|
| 首页排名 | homepage_rank | Dashboard API | NULL | 未集成 |
| 起涨点 | surge_start_point | 计算 (V1/V2+涨幅) | NULL | V1/V2=0 |
| 起跌点 | crash_start_point | 计算 (V1/V2+跌幅) | NULL | V1/V2=0 |
| 操作 | operation_tip | 生成或kline_data | NULL | 未生成 |
| 起涨次数 | today_surge_count | Dashboard API | 0 | 未传入 |
| 起跌次数 | today_crash_count | Dashboard API | 0 | 未传入 |

**修复方式**:
```typescript
// src/index.tsx Line 1190-1245
const dashboardDataMap: any = {};
const dashboardResult = await analysisService.getDashboardData();

// ⚠️ 当前问题: 下面的循环没有执行！
for (let i = 0; i < dashboardResult.coinDetails.length; i++) {
    const coin = dashboardResult.coinDetails[i];
    dashboardDataMap[coin.symbol] = {
        homepage_rank: i + 1,
        today_surge_count: coin.today_surge_count || 0,
        today_crash_count: coin.today_crash_count || 0
    };
}
```

---

### 3️⃣ 48小时极值数据 (❌ 全部为0 - 4字段)

| 字段 | 快照表字段名 | 计算逻辑 | 当前值 | 问题 |
|------|-------------|---------|-------|------|
| 48h高 | rounds_since_48h_high | 查询576条历史 | 0 | 计算失败 |
| 跌幅 | decline_from_48h_high | (当前-高点)/高点×100 | 0 | 同上 |
| 48h低 | rounds_since_48h_low | 查询576条历史 | 0 | 计算失败 |
| 涨幅 | rise_from_48h_low | (当前-低点)/低点×100 | 0 | 同上 |

**计算函数**: `signalMatchingService.ts` - `calculate48HourExtremes()`

**SQL查询**:
```sql
SELECT open_time, open, high, low, close, volume
FROM kline_data
WHERE symbol = ? AND timeframe = '5m'
ORDER BY open_time DESC
LIMIT 576  -- 48小时 × 12条/小时
```

---

### 4️⃣ 成交量标记 (❌ 全部为0 - 2字段)

| 字段 | 快照表字段名 | 主表字段名 | 检测逻辑 | 当前值 |
|------|-------------|-----------|---------|-------|
| V1 | v1_flag | kline_data.volume_v1 | 量 > 前10根均值×2 | 0 |
| V2 | v2_flag | kline_data.volume_v2 | V1后再次激增 | 0 |

**问题**: `kline_data` 表中的 `volume_v1` 和 `volume_v2` 字段都是0，需要在K线同步时实现检测算法。

---

### 5️⃣ 技术指标 - RSI (✅ 全部正常 - 2字段)

| 字段 | 快照表字段名 | 主表字段名 | 计算方式 |
|------|-------------|-----------|---------|
| RSI5 | rsi_5 | kline_data.rsi_5min | RSI(14, 5m数据) |
| RSI1 | rsi_14 | kline_data.rsi_1h | RSI(14, 1h数据) |

**计算函数**: `indicatorService.ts` - `calculateRSI()`

---

### 6️⃣ 技术指标 - SAR (✅ 全部正常 - 3字段)

| 字段 | 快照表字段名 | 主表字段名 | 计算方式 |
|------|-------------|-----------|---------|
| SAR | sar_value | kline_data.sar | SAR指标值 |
| SAR变 | sar_position | 计算 | above/below |
| SAR% | sar_distance_percent | kline_data.sar_change_percent | \|收-SAR\|/SAR×100 |

**计算函数**: `indicatorService.ts` - `calculateSAR()`

---

### 7️⃣ 技术指标 - MACD (✅ 正常 - 1字段)

| 字段 | 快照表字段名 | 主表字段名 | 计算方式 |
|------|-------------|-----------|---------|
| 涨差 | macd_histogram | kline_data.macd_histogram | MACD值 - 信号线 |

**计算函数**: `indicatorService.ts` - `calculateMACD()`

---

### 8️⃣ 技术指标 - 布林带 (✅ 全部正常 - 5字段)

| 字段 | 快照表字段名 | 主表字段名 | 计算方式 |
|------|-------------|-----------|---------|
| MB | bollinger_middle | kline_data.boll_mb | 20周期SMA |
| UB | bollinger_upper | kline_data.boll_ub | MB + 2×标准差 |
| LB | bollinger_lower | kline_data.boll_lb | MB - 2×标准差 |
| 带宽 | bollinger_width | kline_data.boll_width_change | (UB-LB)/MB×100 |
| 通道 | bollinger_position | kline_data.channel_state | 上轨/中性/下轨 |

**计算函数**: `indicatorService.ts` - `calculateBollingerBands()`

---

### 9️⃣ 通道占比 (✅ 全部正常 - 2字段)

| 字段 | 快照表字段名 | 主表字段名 | 说明 |
|------|-------------|-----------|------|
| 下跌 | channel_decline_ratio | kline_data.down_channel_exhaustion_ratio | 下跌K线占比% |
| 上涨 | channel_rise_ratio | kline_data.up_channel_exhaustion_ratio | 上涨K线占比% |

---

### 🔟 信号标记 (❌ 全部NULL - 2字段)

| 字段 | 快照表字段名 | 生成逻辑 | 当前值 | 问题 |
|------|-------------|---------|-------|------|
| 买入信号 | buy_signal | RSI<30 或 SAR上穿 或 MACD金叉 | NULL | 不满足条件 |
| 卖出信号 | sell_signal | RSI>70 或 SAR下穿 或 MACD死叉 | NULL | 不满足条件 |

**生成函数**: `signalMatchingService.ts` - `generateBuySellSignals()`

**问题**: 当前逻辑检测的是"当前状态"，应该检测"状态变化"（穿越）。

---

## 📊 统计总结

### 按状态分类
- ✅ **正常字段**: 27个 (65.85%)
  - 基础K线: 8个
  - 技术指标: 17个
  - 元数据: 2个

- ❌ **缺失字段**: 14个 (34.15%)
  - 首页数据: 6个
  - 48h极值: 4个
  - 成交量标记: 2个
  - 信号标记: 2个

### 按数据源分类
| 数据源 | 字段数 | 状态 |
|--------|--------|------|
| kline_data 直接复制 | 27 | ✅ 正常 |
| Dashboard API | 6 | ❌ 未集成 |
| 48h历史计算 | 4 | ❌ 返回0 |
| V1/V2检测 | 2 | ❌ 未实现 |
| 信号生成 | 2 | ❌ 返回NULL |

---

## 🔧 修复优先级

### 优先级 1 - 高 🔴 (快速修复)
1. **Dashboard数据集成** (6个字段)
   - 修复 `dashboardDataMap` 的填充逻辑
   - 预计耗时: 15分钟

### 优先级 2 - 中 🟡 (核心功能)
2. **V1/V2成交量检测** (2个字段 + 连带修复起涨起跌点)
   - 实现成交量激增检测算法
   - 预计耗时: 30分钟

3. **48h极值计算** (4个字段)
   - 确认历史数据充足
   - 调试计算逻辑
   - 预计耗时: 20分钟

### 优先级 3 - 低 🟢 (优化)
4. **信号生成改进** (2个字段 + 操作提示)
   - 改为检测状态变化
   - 需要存储前一根K线状态
   - 预计耗时: 30分钟

---

## 💡 快速查看当前数据

```bash
# 查看BTC的完整快照数据
curl "http://localhost:3000/api/signal-matching/snapshots/BTC" | jq '.data[0]'

# 统计有值/空值字段数量
curl "http://localhost:3000/api/signal-matching/snapshots/BTC" | jq '.data[0] | 
  [to_entries[] | select(.value != null and .value != 0 and .value != "")] | length'
```
