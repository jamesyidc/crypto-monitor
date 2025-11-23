# 数据库架构说明

## 📊 您的问题答案

> **问题**: 现在这个k线查询表格的数据是存在什么数据库表里面的？

**答案**: `kline_snapshot_latest` 表

---

## 🎯 核心表：kline_snapshot_latest

这就是您在页面上看到的表格数据的来源！

### 基本信息
- 📝 **用途**: 存储27个币种，每个币种最新3根K线的完整快照
- 📊 **数据量**: 81条记录（27个币种 × 3根K线）
- 🔄 **更新频率**: 每30秒自动更新一次
- ⏰ **保留时长**: 最近1小时的数据
- 🔑 **唯一约束**: `UNIQUE(symbol, kline_time, kline_index)`

### 数据源
从两个地方获取数据：
1. ✅ **kline_data 表** → 技术指标（RSI、SAR、MACD、布林带等）
2. ❌ **Dashboard API** → 首页统计（排名、起涨起跌次数）← **当前未集成**

---

## 🔄 完整数据流图

```
┌─────────────────────────────────────────────────────────────────┐
│                     外部数据源                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                        OKX API (K线数据)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: K线同步 (每30秒)                                         │
│  POST /api/kline/sync/auto                                      │
│                                                                 │
│  1. 从OKX获取最新K线                                              │
│  2. 计算技术指标 (RSI/SAR/MACD/Bollinger)                         │
│  3. 存入 kline_data 表                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              
┌─────────────────────────────────────────────────────────────────┐
│               💾 主数据表：kline_data                             │
│                                                                 │
│  存储内容：所有历史K线数据（5分钟周期）                              │
│  数据量：大（每个币种数千条记录）                                   │
│                                                                 │
│  字段示例：                                                       │
│  ├─ 基础: open, high, low, close, volume                        │
│  ├─ 技术指标: sar, rsi_5min, rsi_1h, boll_mb/ub/lb              │
│  ├─ 成交量: volume_v1, volume_v2 ⚠️ (当前都是0)                  │
│  └─ 信号: signal, operation_tip, channel_state                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: 快照保存                                                │
│  SignalMatchingService.saveLatestKlineSnapshots()               │
│                                                                 │
│  1. 从 kline_data 查询最新3根K线                                  │
│  2. 获取 Dashboard 统计 ⚠️ (当前未集成)                           │
│  3. 计算 48h 极值 ⚠️ (当前返回0)                                  │
│  4. 检测 V1/V2 ⚠️ (当前都是0)                                     │
│  5. 生成买卖信号 ⚠️ (当前返回NULL)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              
┌─────────────────────────────────────────────────────────────────┐
│         📸 快照表：kline_snapshot_latest  ⭐ 您看到的数据           │
│                                                                 │
│  存储内容：27个币种 × 最新3根K线的完整快照                          │
│  数据量：81条记录                                                 │
│  更新频率：每30秒                                                 │
│                                                                 │
│  41个字段分类：                                                   │
│  ✅ 基础K线数据 (8字段) - 完整                                     │
│  ❌ 首页数据 (6字段) - 全部NULL/0                                 │
│  ❌ 48h极值 (4字段) - 全部0                                       │
│  ❌ 成交量标记 (2字段) - 全部0                                     │
│  ✅ RSI指标 (2字段) - 完整                                        │
│  ✅ SAR指标 (3字段) - 完整                                        │
│  ✅ MACD指标 (3字段) - 完整                                       │
│  ✅ 布林带 (5字段) - 完整                                         │
│  ✅ 通道占比 (2字段) - 完整                                       │
│  ❌ 信号标记 (2字段) - 全部NULL                                    │
│  ✅ 元数据 (2字段) - 完整                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 信号匹配流程                                             │
│  SignalMatchingService.runCompleteFlow()                        │
│                                                                 │
│  1. 扫描有操作提示的快照 → signal_pool_pending                     │
│  2. 匹配交易信号库 → signal_pool_matched                          │
│  3. 匹配交易策略 → signal_matched_today                           │
│  4. 填充生产池 → production_pool_pending                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              
              📱 前端页面显示（signal-matching.html）
```

---

## 🔍 API 和查询映射

### 您在页面上看到的数据

**前端页面**: `https://sandbox-url/signal-matching.html`

**API调用**: 
```http
GET /api/signal-matching/snapshots/BTC
```

**SQL查询**:
```sql
SELECT * FROM kline_snapshot_latest 
WHERE symbol = 'BTC'
ORDER BY kline_time DESC, kline_index ASC
LIMIT 3
```

**返回结果**:
```json
{
  "success": true,
  "symbol": "BTC",
  "data": [
    {
      "id": 327,
      "symbol": "BTC",
      "kline_time": 1762186800000,
      "kline_index": 3,
      "open_price": 107535,
      "high_price": 107535,
      "low_price": 107394.2,
      "close_price": 107498.8,
      "volume": 8904.57,
      "change_percent": -0.03,
      "homepage_rank": null,        ← ❌ 空值
      "today_surge_count": 0,       ← ❌ 零值
      "rounds_since_48h_high": 0,   ← ❌ 零值
      "v1_flag": 0,                 ← ❌ 零值
      "rsi_5": 52.96,               ← ✅ 有值
      "sar_value": 106937.066,      ← ✅ 有值
      "macd_histogram": 6.749,      ← ✅ 有值
      "bollinger_middle": 107357.295, ← ✅ 有值
      ...
    },
    // 另外2根K线...
  ],
  "count": 3
}
```

---

## 📊 数据表关系图

```
kline_data (主数据表)
    ↓ (查询最新3根)
kline_snapshot_latest (快照表) ⭐ 您查询的表
    ↓ (筛选有操作提示的)
signal_pool_pending (待匹配信号池)
    ↓ (匹配交易信号)
signal_pool_matched (已匹配信号池)
    ↓ (匹配交易策略)
signal_matched_today (今日匹配记录)
    ↓ (填充生产池)
production_pool_pending (生产池)
```

### 表的依赖关系（外键）

- `signal_pool_pending.snapshot_id` → `kline_snapshot_latest.id`
- `signal_pool_matched.pending_signal_id` → `signal_pool_pending.id`
- `signal_matched_today.matched_signal_id` → `signal_pool_matched.id`
- `production_pool_pending.today_matched_id` → `signal_matched_today.id`

---

## 📈 数据量统计（当前状态）

| 表名 | 记录数 | 说明 |
|------|--------|------|
| **kline_snapshot_latest** | **81** | **27币种 × 3根K线** ⭐ |
| signal_pool_pending | 106 | 待匹配信号 |
| signal_pool_matched | 0 | 已匹配信号（暂无） |
| signal_matched_today | 0 | 今日匹配记录（暂无） |
| production_pool_pending | 0 | 生产池（暂无） |

---

## ⚠️ 当前问题总结

### 问题1: 数据来源不完整
快照表的数据来自两个源：
- ✅ `kline_data` 表 → 技术指标数据正常
- ❌ `Dashboard API` → 首页统计数据缺失

### 问题2: 上游数据未计算
`kline_data` 表中的关键字段未计算：
- `volume_v1 = 0` (应该标记成交量激增)
- `volume_v2 = 0` (应该标记二次激增)
- `homepage_rank = NULL` (应该填充首页排名)

### 问题3: 计算逻辑未触发
快照保存时的计算逻辑返回默认值：
- 48h极值计算 → 返回0
- 起涨起跌点检测 → 返回NULL
- 买卖信号生成 → 返回NULL

---

## 🎯 解决方案

### 立即可以查看的数据 ✅
当前 `kline_snapshot_latest` 表中已经有27个字段的有效数据：
- 基础K线数据（开高低收、成交量、涨跌幅）
- 所有技术指标（RSI、SAR、MACD、布林带、通道占比）

### 需要修复才能查看的数据 ❌
需要实现相关逻辑才能填充的14个字段：
- 首页数据（排名、起涨起跌次数、起涨起跌点、操作提示）
- 48h极值（距高低点轮次和幅度）
- 成交量标记（V1/V2）
- 信号标记（买入/卖出信号）

---

## 💡 快速验证方法

### 验证数据表是否存在
```bash
curl -s "https://your-sandbox-url/api/signal-matching/snapshots/BTC" | jq '.success'
# 返回 true 说明表存在且可查询
```

### 查看某个币种的完整数据
```bash
curl -s "https://your-sandbox-url/api/signal-matching/snapshots/BTC" | jq '.'
```

### 查看所有币种的快照数量
```bash
curl -s "https://your-sandbox-url/api/signal-matching/overview" | jq '.'
```

---

## 📝 结论

**您查询的表格数据存储在**：`kline_snapshot_latest` 表

**特点**：
- ✅ 轻量级快照表（81条记录）
- ✅ 每30秒自动更新
- ✅ 技术指标数据完整（27/41字段）
- ❌ 业务逻辑数据缺失（14/41字段）

**使用建议**：
- 可直接用于技术分析和指标查看
- 需要修复后才能用于信号匹配和策略执行
