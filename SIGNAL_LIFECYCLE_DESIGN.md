# 信号池生命周期管理优化方案

## 🎯 目标

解决信号池逻辑混乱问题，实现完整的交易信号生命周期管理。

## ❌ 当前问题

### 1. 无状态管理
- 所有信号都是实时生成，没有持久化
- 无法追踪信号是否已被执行
- 无法防止重复信号

### 2. 平仓信号逻辑错误
- 平仓信号对未持仓的币种无意义
- 需要先有开仓才能有平仓
- 当前逻辑：只要满足条件就生成平仓信号（错误）

### 3. 信号重复问题
- 同一币种可能连续5根K线都满足"震荡收敛"
- 会生成5个相同的BUY信号
- 用户不知道该执行哪一个

## ✅ 解决方案

### 方案一：基于持仓状态的信号过滤（推荐）

**核心思想**: 根据当前持仓状态，智能过滤信号

#### 1. 数据库表结构（复用existing tables）

```sql
-- 复用现有的 positions 表
-- 字段：id, symbol, position_type, status, entry_price, exit_price, created_at...

-- 复用现有的 signal_history 表
-- 字段：id, symbol, signal_type, strategy_name, price, signal_time, executed...
```

#### 2. 信号生成逻辑

```typescript
// 伪代码
async function generateSmartSignals() {
  // 1. 获取所有活跃持仓
  const activePositions = await getActivePositions();
  const longPositions = activePositions.filter(p => p.position_type === 'LONG');
  const shortPositions = activePositions.filter(p => p.position_type === 'SHORT');
  
  // 2. 生成原始信号（所有满足条件的）
  const rawSignals = await generateRawSignals();
  
  // 3. 智能过滤
  const smartSignals = rawSignals.filter(signal => {
    const hasLongPosition = longPositions.some(p => p.symbol === signal.symbol);
    const hasShortPosition = shortPositions.some(p => p.symbol === signal.symbol);
    
    // 规则1: 如果已有多仓，过滤掉新的做多开仓信号
    if (signal.signal_type === 'BUY' && signal.action === 'OPEN' && hasLongPosition) {
      return false; // 已有多仓，不再重复开仓
    }
    
    // 规则2: 如果没有多仓，过滤掉做多平仓信号
    if (signal.signal_type === 'BUY' && signal.action === 'CLOSE' && !hasLongPosition) {
      return false; // 没有多仓，平仓信号无意义
    }
    
    // 规则3: 如果已有空仓，过滤掉新的做空开仓信号
    if (signal.signal_type === 'SELL' && signal.action === 'OPEN' && hasShortPosition) {
      return false; // 已有空仓，不再重复开仓
    }
    
    // 规则4: 如果没有空仓，过滤掉做空平仓信号
    if (signal.signal_type === 'SELL' && signal.action === 'CLOSE' && !hasShortPosition) {
      return false; // 没有空仓，平仓信号无意义
    }
    
    return true; // 信号有效
  });
  
  return smartSignals;
}
```

#### 3. 去重逻辑

```typescript
// 同一币种相同策略的信号，只保留最新的一个
function deduplicateSignals(signals) {
  const uniqueMap = new Map();
  
  signals.forEach(signal => {
    const key = `${signal.symbol}-${signal.signal_type}-${signal.action}-${signal.strategy_name}`;
    
    // 如果已存在，比较时间戳
    if (!uniqueMap.has(key) || signal.timestamp > uniqueMap.get(key).timestamp) {
      uniqueMap.set(key, signal);
    }
  });
  
  return Array.from(uniqueMap.values());
}
```

### 方案二：信号状态机管理（完整版）

**核心思想**: 为每个信号添加状态，追踪完整生命周期

#### 1. 扩展 signal_history 表

```sql
ALTER TABLE signal_history ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';
-- 状态: PENDING(待执行), EXECUTED(已执行), EXPIRED(已过期), CANCELLED(已取消)

ALTER TABLE signal_history ADD COLUMN executed_at DATETIME;
-- 执行时间

ALTER TABLE signal_history ADD COLUMN position_id INTEGER;
-- 关联的持仓ID（执行后关联）

ALTER TABLE signal_history ADD COLUMN expires_at DATETIME;
-- 过期时间（例如5分钟后过期）
```

#### 2. 信号生命周期状态机

```
PENDING (待执行)
   ↓
   ├─→ EXECUTED (已执行) → 关联到 position
   ├─→ EXPIRED (已过期) → 超过有效期未执行
   └─→ CANCELLED (已取消) → 用户手动取消或被新信号覆盖
```

#### 3. 完整工作流

```typescript
// 1. 生成新信号时
async function saveSignal(signal) {
  // 检查是否有同币种同方向的待执行信号
  const existingSignal = await getSignalBySymbol(
    signal.symbol, 
    signal.signal_type,
    signal.action,
    'PENDING'
  );
  
  if (existingSignal) {
    // 取消旧信号
    await updateSignalStatus(existingSignal.id, 'CANCELLED');
  }
  
  // 保存新信号
  const newSignal = await insertSignal({
    ...signal,
    status: 'PENDING',
    expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5分钟有效期
  });
  
  return newSignal;
}

// 2. 执行信号时（用户点击执行）
async function executeSignal(signalId, executionPrice) {
  const signal = await getSignalById(signalId);
  
  if (signal.status !== 'PENDING') {
    throw new Error('信号状态不是待执行');
  }
  
  if (new Date() > signal.expires_at) {
    await updateSignalStatus(signalId, 'EXPIRED');
    throw new Error('信号已过期');
  }
  
  // 创建持仓
  const position = await createPosition({
    symbol: signal.symbol,
    position_type: signal.signal_type === 'BUY' ? 'LONG' : 'SHORT',
    entry_price: executionPrice,
    strategy_name: signal.strategy_name
  });
  
  // 更新信号状态
  await updateSignalStatus(signalId, 'EXECUTED', {
    executed_at: new Date(),
    position_id: position.id
  });
  
  return { signal, position };
}

// 3. 定时清理过期信号
async function cleanExpiredSignals() {
  const now = new Date();
  
  await db.run(`
    UPDATE signal_history 
    SET status = 'EXPIRED' 
    WHERE status = 'PENDING' 
    AND expires_at < ?
  `, [now]);
}
```

## 🎨 UI展示优化

### 信号池面板设计

```
┌─────────────────────────────────────────┐
│ 📊 交易信号池 (最近3根K线)              │
├─────────────────────────────────────────┤
│ 📈 待执行开仓信号: 2                     │
│ 📉 待执行平仓信号: 1                     │
│ ⏰ 已过期信号: 3                         │
├─────────────────────────────────────────┤
│                                          │
│ 🟢 SOL - 做多开仓 [震荡收敛策略]         │
│    价格: $185.07 | RSI: 42.5            │
│    生成时间: 2分钟前 | ⏳ 剩余: 3分钟     │
│    [立即执行] [取消]                     │
│                                          │
│ 🔴 HBAR - 做空开仓 [波段高点策略]        │
│    价格: $0.195 | RSI: 68.2             │
│    生成时间: 1分钟前 | ⏳ 剩余: 4分钟     │
│    [立即执行] [取消]                     │
│                                          │
│ 🟡 BTC - 做多平仓 [波段高点策略]         │
│    持仓均价: $68,500 | 当前: $69,200    │
│    盈亏: +$700 (+1.02%)                 │
│    [立即平仓] [继续持有]                 │
│                                          │
└─────────────────────────────────────────┘
```

### 筛选和排序

```typescript
// 前端筛选逻辑
const filters = {
  showPending: true,     // 显示待执行
  showExecuted: false,   // 显示已执行
  showExpired: false,    // 显示已过期
  signalType: 'ALL',     // ALL | BUY | SELL
  action: 'ALL'          // ALL | OPEN | CLOSE
};

// 排序选项
const sortOptions = {
  time_desc: '时间倒序',
  time_asc: '时间正序',
  profit_desc: '潜在收益降序', // 仅平仓信号
  rsi_desc: 'RSI降序'
};
```

## 🚀 实施步骤

### Phase 1: 基础优化（快速实施）
1. ✅ 添加持仓状态查询
2. ✅ 实现智能信号过滤（基于持仓）
3. ✅ 实现信号去重逻辑
4. ✅ 更新前端展示

### Phase 2: 状态管理（完整版）
1. ⏳ 扩展 signal_history 表字段
2. ⏳ 实现信号状态机
3. ⏳ 实现信号过期机制
4. ⏳ 添加信号执行接口

### Phase 3: 高级功能
1. ⏳ 信号优先级排序
2. ⏳ 策略回测统计
3. ⏳ 自动执行模式
4. ⏳ 风险控制集成

## 📊 效果对比

### 优化前
```
偏多信号数: 2   ← 可能都是重复的
偏空信号数: 0
开仓信号数: 2   ← 没考虑是否已有持仓
平仓信号数: 0   ← 可能漏掉了有效平仓机会
```

### 优化后
```
待执行开仓: 1   ← 去重后，每个币种只有1个
待执行平仓: 2   ← 只显示已持仓币种的平仓信号
已过期信号: 5   ← 超过5分钟的信号自动标记过期
当前持仓: 3     ← 清晰显示持仓状态
```

## 🎯 最终目标

实现一个**智能、清晰、可执行**的信号池系统：

1. ✅ 每个币种同一方向只有1个有效信号（去重）
2. ✅ 只显示可执行的信号（基于持仓状态过滤）
3. ✅ 平仓信号只对已持仓的币种生效
4. ✅ 信号有明确的生命周期和过期时间
5. ✅ 用户可以追踪信号执行历史
6. ✅ 提供清晰的UI展示和操作入口
