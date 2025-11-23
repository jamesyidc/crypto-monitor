# 📊 kline_snapshot_latest 表数据来源详解

## 🎯 简单回答

数据来源有3种方式：

1. **手动触发** - 通过测试页面或API调用
2. **前端页面加载** - 首次打开页面时获取显示数据（不触发同步）
3. **后端定时任务** - SchedulerService（当前未启用）

**⚠️ 重要发现：当前系统没有自动30秒同步！**

---

## 📋 数据流转完整路径

```
外部来源: OKX Exchange API
    ↓ (HTTP请求获取K线原始数据)
    
第1站: K线同步API
    📡 POST /api/kline/sync/auto
    📁 src/index.tsx (Line 1138-1270)
    ⏰ 触发方式: 手动调用或定时任务
    
    处理步骤:
    1. 循环27个币种
    2. 调用OKX API获取最新10根K线
    3. 计算技术指标 (RSI/SAR/MACD/Bollinger)
    4. 存入 kline_data 表
    ↓
    
第2站: 主数据表
    💾 kline_data
    📊 存储所有历史K线数据（数千条）
    🔑 字段: open, high, low, close, volume
           + 技术指标 (sar, rsi_5min, rsi_1h, boll_mb...)
           + 成交量标记 (volume_v1, volume_v2) ← ⚠️ 当前都是0
           + 信号 (signal, operation_tip)
    ↓
    
第3站: 快照保存服务
    📸 SignalMatchingService.saveLatestKlineSnapshots()
    📁 src/services/signalMatchingService.ts (Line 163-311)
    
    处理步骤:
    1. 从 kline_data 查询最新3根K线
       SQL: SELECT * FROM kline_data 
            WHERE symbol = ? AND timeframe = '5m'
            ORDER BY open_time DESC LIMIT 3
    
    2. 获取Dashboard统计数据 ← ⚠️ 当前未集成
       const dashboardData = await analysisService.getDashboardData()
       
    3. 计算48h极值数据 ← ⚠️ 当前返回0
       - 查询576条历史记录
       - 计算距离高点/低点的轮次和幅度
       
    4. 检测起涨起跌点 ← ⚠️ 当前返回NULL
       - 基于V1/V2成交量激增检测
       - V1/V2都是0，所以检测失败
       
    5. 生成买卖信号 ← ⚠️ 当前返回NULL
       - 基于RSI/SAR/MACD综合判断
       - 当前市场状态不满足信号条件
    
    6. 构建快照对象 (41个字段)
       - ✅ 基础K线数据 (从klineData获取)
       - ❌ 首页数据 (dashboardData为空)
       - ❌ 极值数据 (计算返回0)
       - ✅ 技术指标 (从klineData获取)
       - ❌ 信号标记 (生成返回NULL)
    ↓
    
第4站: 快照表
    📸 kline_snapshot_latest
    📊 存储最新3根×27币种 = 81条记录
    🔄 更新方式: INSERT或UPDATE
    ⏰ 保留时长: 1小时
    
    SQL操作:
    1. 检查是否存在:
       SELECT id FROM kline_snapshot_latest
       WHERE symbol = ? AND kline_time = ? AND kline_index = ?
    
    2a. 存在 → UPDATE:
        UPDATE kline_snapshot_latest SET ... WHERE id = ?
    
    2b. 不存在 → INSERT:
        INSERT INTO kline_snapshot_latest (...) VALUES (...)
    ↓
    
第5站: 前端展示
    📱 GET /api/signal-matching/snapshots/{symbol}
    🌐 public/signal-matching.html
    🎨 显示27个币种 × 3根K线的数据表格
```

---

## ⏰ 触发机制详解

### 方式1: 手动触发 ✅ (当前唯一方式)

**通过测试页面**:
- 📄 文件: `public/test-snapshot.html`
- 🔘 按钮: "触发完整自动同步"
- 📡 调用: `POST /api/kline/sync/auto`

**通过curl命令**:
```bash
curl -X POST http://localhost:3000/api/kline/sync/auto
```

**通过浏览器控制台**:
```javascript
await fetch('/api/kline/sync/auto', { method: 'POST' })
```

---

### 方式2: 定时任务 ❌ (已实现但未启用)

**服务类**: `SchedulerService`
- 📁 文件: `src/services/schedulerService.ts`
- 🎯 用途: 自动定时调用 `/api/kline/sync/auto`
- ⏰ 间隔: 5分钟（可配置）
- ❌ 状态: **代码存在但从未被启动！**

**如何启用**:
```typescript
// 在 src/index.tsx 中添加
import { SchedulerService } from './services/schedulerService';

const scheduler = new SchedulerService({
  enabled: true,
  interval: 30 * 1000, // 30秒
  endpoint: 'http://localhost:3000/api/kline/sync/auto'
});

scheduler.start(); // 启动定时任务
```

---

### 方式3: 前端定时刷新 ❌ (不触发同步，只刷新显示)

**文件**: `public/signal-matching.html`

**代码逻辑**:
```javascript
// 每秒更新UI
setInterval(() => {
    updateSystemUptime();      // 更新运行时间
    updateRefreshCountdown();  // 更新倒计时
}, 1000);

// 初次加载数据
window.addEventListener('DOMContentLoaded', () => {
    loadData(); // 只查询显示，不触发同步
});
```

**注意**: 这里只是刷新UI显示，**不会触发K线同步API**！

---

## 🔍 当前系统运行状态

### 实际发生的事情

1. **用户打开页面** → 前端加载并显示已有的快照数据
2. **每秒刷新UI** → 更新倒计时和运行时间
3. **数据不自动更新** → 除非手动调用API

### 数据更新时机

**最近一次数据写入**: 通过手动API调用
```json
{
  "created_at": 1762172983,  // 2025-11-03 12:56:23 UTC
  "kline_time": 1762186800000 // 2025-11-03 16:50:00 UTC
}
```

**数据年龄**: 
- 如果没有手动触发同步，数据会一直停留在上次同步的时间
- 页面显示的是"静态数据"，不会自动更新

---

## ❓ 为什么看起来有数据？

### 原因1: 历史数据存在
在之前的测试中，手动触发过同步，所以：
- `kline_data` 表有历史K线数据
- `kline_snapshot_latest` 表有上次同步的快照

### 原因2: 前端只负责显示
前端页面启动时：
1. 调用 `GET /api/signal-matching/snapshots/{symbol}`
2. 从数据库读取已有快照
3. 显示在页面上

但这**不会触发新的同步**！

---

## 🎯 数据字段来源映射

### ✅ 从 kline_data 直接获取 (27个字段)

| 快照字段 | kline_data字段 | 说明 |
|---------|---------------|------|
| open_price | open | 开盘价 |
| high_price | high | 最高价 |
| low_price | low | 最低价 |
| close_price | close | 收盘价 |
| volume | volume | 成交量 |
| rsi_5 | rsi_5min | 5分钟RSI |
| rsi_14 | rsi_1h | 1小时RSI |
| sar_value | sar | SAR值 |
| sar_distance_percent | sar_change_percent | SAR距离% |
| macd_value | macd_value | MACD值 |
| macd_signal | macd_signal | MACD信号线 |
| macd_histogram | macd_histogram | MACD柱 |
| bollinger_middle | boll_mb | 布林中轨 |
| bollinger_upper | boll_ub | 布林上轨 |
| bollinger_lower | boll_lb | 布林下轨 |
| bollinger_width | boll_width_change | 布林带宽 |
| bollinger_position | channel_state | 通道位置 |
| channel_decline_ratio | down_channel_exhaustion_ratio | 下跌占比 |
| channel_rise_ratio | up_channel_exhaustion_ratio | 上涨占比 |

### ❌ 从 Dashboard API 获取 (当前未集成，6个字段)

| 快照字段 | Dashboard API字段 | 当前值 | 问题 |
|---------|------------------|-------|------|
| homepage_rank | coinDetails[].index + 1 | NULL | 未调用API |
| today_surge_count | coinDetails[].today_surge_count | 0 | 未传入 |
| today_crash_count | coinDetails[].today_crash_count | 0 | 未传入 |
| surge_start_point | (计算) | NULL | 依赖V1/V2 |
| crash_start_point | (计算) | NULL | 依赖V1/V2 |
| operation_tip | (生成) | NULL | 未生成 |

### ❌ 从48h历史数据计算 (当前返回0，4个字段)

| 快照字段 | 计算来源 | 当前值 | 问题 |
|---------|---------|-------|------|
| rounds_since_48h_high | 576条历史记录 | 0 | 计算失败 |
| decline_from_48h_high | 当前价 vs 48h高点 | 0 | 计算失败 |
| rounds_since_48h_low | 576条历史记录 | 0 | 计算失败 |
| rise_from_48h_low | 当前价 vs 48h低点 | 0 | 计算失败 |

### ❌ 从成交量检测 (未实现，2个字段)

| 快照字段 | 来源 | 当前值 | 问题 |
|---------|-----|-------|------|
| v1_flag | kline_data.volume_v1 | 0 | 未计算 |
| v2_flag | kline_data.volume_v2 | 0 | 未计算 |

### ❌ 从信号生成逻辑 (当前返回NULL，2个字段)

| 快照字段 | 生成逻辑 | 当前值 | 问题 |
|---------|---------|-------|------|
| buy_signal | RSI/SAR/MACD | NULL | 不满足条件 |
| sell_signal | RSI/SAR/MACD | NULL | 不满足条件 |

---

## 🔧 如何验证数据来源

### 1. 查看原始K线数据
```bash
curl "http://localhost:3000/api/debug/kline-data/BTC?limit=3"
```

### 2. 查看快照数据
```bash
curl "http://localhost:3000/api/signal-matching/snapshots/BTC"
```

### 3. 手动触发同步
```bash
curl -X POST "http://localhost:3000/api/kline/sync/auto"
```

### 4. 查看同步结果
```bash
# 查看最新快照是否更新
curl "http://localhost:3000/api/signal-matching/snapshots/BTC" | jq '.data[0].created_at'

# 转换时间戳
date -d @1762172983
```

---

## 💡 总结

### 数据实际来源
1. ✅ **OKX API** → 原始K线数据
2. ✅ **kline_data 表** → 存储所有历史 + 技术指标
3. ✅ **快照保存逻辑** → 查询最新3根，存入快照表
4. ✅ **快照表** → 前端直接查询显示

### 关键问题
1. ❌ **没有自动同步机制** - SchedulerService未启用
2. ❌ **Dashboard数据未集成** - additionalData为空
3. ❌ **计算逻辑未生效** - 48h极值、V1/V2、信号都返回默认值

### 解决方案
1. 启用 SchedulerService 实现自动30秒同步
2. 修复 Dashboard 数据集成逻辑
3. 修复计算函数的返回值问题
4. 实现 V1/V2 成交量激增检测算法
