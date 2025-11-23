# API 管理器迁移指南

## 📋 概述

本指南说明如何将现有的 `axios` 直接调用迁移到集中的 API 管理器。

---

## 🎯 为什么需要 API 管理器？

### 问题
- ❌ **API 拥堵**: 多个组件同时发起大量请求
- ❌ **性能下降**: 页面卡顿，响应缓慢
- ❌ **重复请求**: 相同请求被多次发起
- ❌ **无优先级**: 重要请求被低优先级请求阻塞
- ❌ **无限流控制**: 请求过于频繁导致服务器压力大

### 解决方案
✅ **请求队列**: 控制并发数量，避免拥堵
✅ **请求限流**: 保证最小请求间隔
✅ **优先级队列**: 重要请求优先处理
✅ **请求去重**: 避免重复请求
✅ **智能缓存**: 减少不必要的 API 调用
✅ **自动重试**: 失败请求自动重试

---

## 🔄 迁移步骤

### 1. 旧代码 (使用 axios)

```javascript
// ❌ 旧方式：直接使用 axios
async function loadSignalPool() {
  try {
    const response = await axios.get('/api/signal-pool/recent', {
      params: {
        timeframe: '5m',
        klineCount: 3
      },
      timeout: 30000
    });
    
    if (response.data.success) {
      const { signals, summary } = response.data.data;
      renderSignalPool(signals, summary);
    }
  } catch (error) {
    console.error('加载信号池失败:', error);
  }
}
```

### 2. 新代码 (使用 API 管理器)

```javascript
// ✅ 新方式：使用 API 管理器
async function loadSignalPool() {
  try {
    const data = await API.get('/api/signal-pool/recent', {
      params: {
        timeframe: '5m',
        klineCount: 3
      },
      priority: API_PRIORITY.NORMAL, // 设置优先级
      cache: true, // 启用5秒缓存
      dedupe: true, // 启用去重
      tag: '信号池-实时数据' // 用于日志识别
    });
    
    if (data.success) {
      const { signals, summary } = data.data;
      renderSignalPool(signals, summary);
    }
  } catch (error) {
    console.error('加载信号池失败:', error);
  }
}
```

---

## 📚 API 使用示例

### GET 请求示例

```javascript
// 基本 GET 请求
const data = await API.get('/api/accounts');

// 带参数的 GET 请求
const data = await API.get('/api/trades', {
  params: {
    symbol: 'BTC',
    limit: 20
  }
});

// 高优先级 GET 请求
const data = await API.get('/api/account/balance', {
  priority: API_PRIORITY.HIGH, // 优先级 8
  cache: false, // 不缓存
  tag: '账户余额查询'
});

// 低优先级后台请求
const data = await API.get('/api/statistics/daily', {
  priority: API_PRIORITY.BACKGROUND, // 优先级 1
  cache: true, // 缓存5秒
  tag: '每日统计数据'
});
```

### POST 请求示例

```javascript
// 基本 POST 请求
const result = await API.post('/api/trades/execute', {
  data: {
    symbol: 'BTC',
    side: 'buy',
    amount: 100
  }
});

// 关键操作（最高优先级）
const result = await API.post('/api/trades/execute', {
  data: {
    symbol: 'BTC',
    side: 'buy',
    amount: 100
  },
  priority: API_PRIORITY.CRITICAL, // 优先级 10
  tag: '执行交易-BTC'
});

// POST 请求通常不缓存、不去重
const result = await API.post('/api/signal-pool/save', {
  data: { signals: signalData },
  priority: API_PRIORITY.LOW, // 优先级 3
  cache: false, // 不缓存
  dedupe: false, // 不去重
  tag: '保存信号历史'
});
```

### PUT/DELETE 请求示例

```javascript
// PUT 更新请求
const result = await API.put('/api/strategies/123', {
  data: {
    is_enabled: true,
    config: { ... }
  },
  priority: API_PRIORITY.HIGH,
  tag: '更新策略配置'
});

// DELETE 删除请求
const result = await API.delete('/api/positions/456', {
  priority: API_PRIORITY.HIGH,
  tag: '删除持仓'
});
```

---

## 🎚️ 优先级设置指南

| 优先级 | 值 | 使用场景 | 示例 |
|--------|---|---------|------|
| CRITICAL | 10 | 关键业务操作 | 交易执行、紧急平仓 |
| HIGH | 8 | 重要数据查询 | 账户余额、持仓查询 |
| NORMAL | 5 | 常规数据查询 | 信号池、K线数据 |
| LOW | 3 | 非关键数据 | 历史记录、统计数据 |
| BACKGROUND | 1 | 后台任务 | 日志保存、数据同步 |

### 优先级选择原则

```javascript
// ✅ 正确的优先级使用

// 1. 交易执行 - CRITICAL (10)
await API.post('/api/trades/execute', {
  data: tradeData,
  priority: API_PRIORITY.CRITICAL
});

// 2. 账户余额 - HIGH (8)
await API.get('/api/account/balance', {
  priority: API_PRIORITY.HIGH
});

// 3. 信号池刷新 - NORMAL (5)
await API.get('/api/signal-pool/recent', {
  priority: API_PRIORITY.NORMAL
});

// 4. 历史信号查询 - LOW (3)
await API.get('/api/signal-history', {
  priority: API_PRIORITY.LOW
});

// 5. 保存日志 - BACKGROUND (1)
await API.post('/api/logs/save', {
  data: logData,
  priority: API_PRIORITY.BACKGROUND
});
```

---

## 🔧 配置参数说明

### API.get(url, options)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| params | Object | {} | URL 查询参数 |
| priority | Number | 5 | 优先级 (1-10) |
| cache | Boolean | true | 是否缓存结果 (5秒) |
| dedupe | Boolean | true | 是否去重相同请求 |
| tag | String | 'GET url' | 请求标签（用于日志） |

### API.post(url, options)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| data | Object | {} | 请求体数据 |
| priority | Number | 7 | 优先级 (1-10) |
| cache | Boolean | false | POST 通常不缓存 |
| dedupe | Boolean | false | POST 通常不去重 |
| tag | String | 'POST url' | 请求标签（用于日志） |

---

## 📊 监控与调试

### 1. 查看统计信息

```javascript
// 在浏览器控制台执行
window.apiManager.printStats();

// 输出示例：
// ┌─────────────────┬────────┐
// │    (index)      │ Values │
// ├─────────────────┼────────┤
// │ total           │ 150    │
// │ success         │ 142    │
// │ failed          │ 5      │
// │ cached          │ 23     │
// │ queued          │ 150    │
// │ rejected        │ 3      │
// │ activeRequests  │ 2      │
// │ queueSize       │ 4      │
// │ cacheSize       │ 12     │
// │ successRate     │ 94.67% │
// └─────────────────┴────────┘
```

### 2. 手动清理

```javascript
// 清空缓存
window.apiManager.clearCache();

// 清空队列（慎用！会拒绝所有排队请求）
window.apiManager.clearQueue();
```

### 3. 调整配置

```javascript
// 可以在运行时修改配置
window.apiManager.maxConcurrent = 5; // 增加并发数
window.apiManager.minInterval = 100; // 减少最小间隔
window.apiManager.cacheTimeout = 10000; // 增加缓存时间到10秒
```

---

## 🔍 需要迁移的函数清单

### trading-v2.js 中需要迁移的函数

1. **账户管理**
   - ✅ `loadAccounts()` - GET /api/accounts (优先级: HIGH)
   - ✅ `createAccount()` - POST /api/accounts (优先级: HIGH)
   - ✅ `updateAccount()` - PUT /api/accounts/:id (优先级: HIGH)
   - ✅ `deleteAccount()` - DELETE /api/accounts/:id (优先级: HIGH)

2. **信号池**
   - ✅ `loadSignalPool()` - GET /api/signal-pool/recent (优先级: NORMAL)
   - ✅ `loadSignalPoolWithSave()` - GET /api/signal-pool/recent (优先级: NORMAL)
   - ⚠️ `saveSignalsToHistory()` - POST /api/signal-pool/save (优先级: BACKGROUND)
   - ✅ `loadHistorySignals()` - GET /api/signal-pool/history (优先级: LOW)

3. **交易执行**
   - ✅ `executeManualTrade()` - POST /api/trades/manual (优先级: CRITICAL)
   - ✅ `executeAutoTrade()` - POST /api/trades/auto (优先级: CRITICAL)
   - ✅ `confirmExecuteSignal()` - POST /api/trades/execute (优先级: CRITICAL)

4. **策略管理**
   - ✅ `loadStrategyLibrary()` - GET /api/strategies (优先级: NORMAL)
   - ✅ `loadBacktestStrategyLibrary()` - GET /api/strategies (优先级: LOW)

5. **回测**
   - ✅ `runBacktest()` - POST /api/backtest/run (优先级: LOW)

6. **自动交易配置**
   - ✅ `saveAutoTradeConfig()` - PUT /api/accounts/:id/auto-config (优先级: HIGH)

---

## 📈 预期改进效果

### 性能提升

| 指标 | 改进前 | 改进后 | 提升 |
|------|--------|--------|------|
| 并发请求数 | 无限制 | 最多3个 | 减少拥堵 |
| 请求间隔 | 0ms | 最少200ms | 减少服务器压力 |
| 重复请求 | 多次 | 自动去重 | 减少50%+ |
| 缓存命中率 | 0% | 预计20-30% | 减少网络请求 |
| 页面响应性 | 时快时慢 | 稳定流畅 | 用户体验提升 |

### API 调用统计（预估）

```
改进前（每30秒自动刷新）:
- 信号池: 120 请求/小时
- 保存历史: 120 请求/小时
- 其他查询: 60 请求/小时
总计: 300 请求/小时

改进后（带缓存和去重）:
- 信号池: 120 请求/小时（缓存命中 30%）→ 84 请求/小时
- 保存历史: 0 请求/小时（已禁用自动保存）
- 其他查询: 60 请求/小时（去重 20%）→ 48 请求/小时
总计: 132 请求/小时

减少: 56% 的 API 调用量
```

---

## ✅ 验证测试

### 测试步骤

1. **打开浏览器开发者工具**
   - Network 标签：观察请求数量和时间
   - Console 标签：查看 API Manager 日志

2. **执行常规操作**
   - 刷新页面
   - 筛选信号
   - 切换账户
   - 执行交易

3. **观察 API Manager 统计**
   ```javascript
   // 每隔10秒打印一次统计
   setInterval(() => {
     window.apiManager.printStats();
   }, 10000);
   ```

4. **检查性能指标**
   - ✅ 并发请求不超过3个
   - ✅ 请求间隔至少200ms
   - ✅ 相同请求被去重
   - ✅ 缓存正常工作
   - ✅ 页面保持流畅

---

## 🚨 注意事项

### 1. POST 请求不去重

```javascript
// ❌ 错误：POST 使用去重
await API.post('/api/trades/execute', {
  data: tradeData,
  dedupe: true // 不应该去重！
});

// ✅ 正确：POST 不去重
await API.post('/api/trades/execute', {
  data: tradeData,
  dedupe: false // 每次都执行
});
```

### 2. 关键操作使用最高优先级

```javascript
// ✅ 交易执行必须使用 CRITICAL
await API.post('/api/trades/execute', {
  data: tradeData,
  priority: API_PRIORITY.CRITICAL // 最高优先级
});
```

### 3. 后台任务使用最低优先级

```javascript
// ✅ 保存日志使用 BACKGROUND
await API.post('/api/logs/save', {
  data: logData,
  priority: API_PRIORITY.BACKGROUND // 最低优先级
});
```

---

## 📝 总结

使用 API 管理器的好处：

1. ✅ **避免 API 拥堵**: 控制并发和请求频率
2. ✅ **提升页面性能**: 减少不必要的请求
3. ✅ **优化用户体验**: 页面更流畅响应更快
4. ✅ **降低服务器压力**: 减少 API 调用量
5. ✅ **便于监控调试**: 统一的日志和统计

---

**立即开始迁移，享受更好的性能！** 🚀
