# 自动交易配置功能文档

## 📋 功能概述

新增的自动交易配置系统允许用户为模拟交易账户设置详细的自动交易参数，包括持仓限额、分批交易和风险保护机制。

---

## 🎯 核心功能

### 1. **单次买入上限金额 (Maximum Position Value)**
- **用途**: 限制每次开仓时单个币种的最大投入金额
- **建议值**: 总余额的 5-10%
- **最小值**: 100 USDT
- **示例**: 
  - 账户余额: $100,000
  - 建议设置: $5,000 - $10,000
  - 作用: 防止单个币种投入过大，分散风险

### 2. **分批交易 (Position Splits)**
- **用途**: 将单次买入金额分成多份执行
- **范围**: 1-10 份
- **推荐值**: 3-5 份
- **计算方式**: 每份金额 = 单次买入上限 / 分批数量
- **示例**:
  ```
  单次买入上限: $10,000
  分批数量: 5 份
  每份金额: $2,000
  ```
- **优势**:
  - 分批建仓，降低入场风险
  - 可在不同价位建立头寸
  - 更灵活的资金管理

### 3. **强制保护金额 (Force Protection Balance)**
- **用途**: 设置账户最低保护阈值
- **触发机制**: 当账户净值 ≤ 保护金额 × 103%
- **触发动作**:
  1. 立即平仓所有持仓
  2. 锁定账户，停止自动交易
  3. 账户状态变更为 STOPPED
  4. 需要手动解除锁定才能继续
- **示例**:
  ```
  初始余额: $100,000
  保护金额: $30,000
  触发点: $30,900 (30000 × 1.03)
  
  当余额降至 $30,900 时:
  → 自动平仓所有持仓
  → 账户锁定
  → 自动交易关闭
  ```

### 4. **自动交易开关 (Auto Trading Toggle)**
- **用途**: 启用/禁用自动交易功能
- **状态**: 
  - ✅ 启用: 系统根据信号池自动执行交易
  - ❌ 禁用: 仅手动交易
- **配合信号池**: 自动识别信号池中的交易信号并执行

---

## 🗄️ 数据库结构

### Migration 0050: `add_auto_trading_config.sql`

新增字段到 `simulated_accounts` 表:

```sql
-- 单次买入上限金额
max_position_value REAL DEFAULT NULL

-- 分批交易数量 (1-10)
position_splits INTEGER DEFAULT 1 CHECK(position_splits >= 1 AND position_splits <= 10)

-- 强制保护金额
force_protection_balance REAL DEFAULT NULL

-- 自动交易启用标志
auto_trading_enabled INTEGER DEFAULT 0 CHECK(auto_trading_enabled IN (0, 1))

-- 保护机制触发标志
protection_triggered INTEGER DEFAULT 0 CHECK(protection_triggered IN (0, 1))
```

---

## 🔌 API 接口

### 1. **更新自动交易配置**
```
PUT /api/simulated/accounts/:id/auto-trade-config
```

**请求体**:
```json
{
  "max_position_value": 5000.00,
  "position_splits": 5,
  "force_protection_balance": 30000.00,
  "auto_trading_enabled": 1
}
```

**响应**:
```json
{
  "success": true,
  "config": {
    "max_position_value": 5000.00,
    "position_splits": 5,
    "force_protection_balance": 30000.00,
    "auto_trading_enabled": 1
  }
}
```

**验证规则**:
- `max_position_value` ≥ 100 USDT
- `position_splits` 在 1-10 之间
- `force_protection_balance` < 当前余额

### 2. **执行自动交易（带配置）**
```
POST /api/simulated/auto-trade-all
```

**请求体**:
```json
{
  "account_id": 1,
  "strategy_id": 1,
  "max_position_value": 5000.00,
  "position_splits": 5,
  "force_protection_balance": 30000.00
}
```

**响应（正常）**:
```json
{
  "success": true,
  "trades": [
    {
      "symbol": "BTC",
      "signal": "买开",
      "result": { ... }
    }
  ]
}
```

**响应（保护触发）**:
```json
{
  "success": true,
  "protection_triggered": true,
  "message": "账户余额已触达保护点（30900.00），已自动平仓所有持仓并锁定账户",
  "trades": []
}
```

**响应（已锁定）**:
```json
{
  "success": false,
  "error": "账户保护机制已触发，账户已锁定。请手动解除保护后再继续交易。",
  "protection_triggered": true
}
```

---

## 💻 前端界面

### 配置对话框组件

点击 **"自动交易"** 按钮后弹出配置对话框，包含:

1. **账户信息区**
   - 当前账户名称
   - 当前余额显示

2. **单次买入上限**
   - 输入框（步长: 100）
   - 建议值提示
   - 实时验证

3. **分批交易**
   - 滑动条（1-10）
   - 实时显示分批数量
   - 自动计算每份金额
   - 计算结果展示

4. **强制保护金额**
   - 输入框（步长: 100）
   - 触发点自动计算
   - 风险警告提示

5. **自动交易开关**
   - Toggle 开关
   - 状态说明

6. **重要提示区**
   - 黄色警告框
   - 关键注意事项
   - 风险提醒

### 交互逻辑

```javascript
// 打开配置对话框
function openAutoTradeConfigModal()

// 关闭配置对话框
function closeAutoTradeConfigModal()

// 更新分批显示
function updatePositionSplitsDisplay(value)

// 更新每份金额计算
function updateSplitCalculation()

// 更新保护金额触发点计算
function updateProtectionCalculation()

// 保存配置
async function saveAutoTradeConfig(e)

// 执行自动交易（带配置）
async function executeAutoTradeWithConfig()
```

---

## 🔄 工作流程

### 完整的自动交易流程:

```
1. 用户点击"自动交易"按钮
   ↓
2. 打开配置对话框
   - 显示当前账户信息
   - 加载已有配置（如果存在）
   - 显示建议值
   ↓
3. 用户设置参数
   - 单次买入上限: $5,000
   - 分批数量: 5 份 (每份 $1,000)
   - 保护金额: $30,000 (触发点 $30,900)
   - 启用自动交易: ✅
   ↓
4. 保存配置
   - 验证参数有效性
   - 调用 API 保存到数据库
   - 更新账户信息
   ↓
5. 执行自动交易
   - 检查账户状态
   - 检查保护机制
   - 从信号池获取信号
   - 根据配置执行交易
   ↓
6. 保护机制监控
   - 每次交易前检查余额
   - 余额 ≤ 保护点 × 1.03
   - 触发保护: 平仓 + 锁定
```

---

## ⚠️ 风险控制

### 多层风险防护:

1. **输入验证**
   - 最小买入金额: 100 USDT
   - 分批数量: 1-10
   - 保护金额 < 当前余额

2. **余额检查**
   - 单次投入不超过余额的 50%
   - 超过阈值弹出确认对话框

3. **保护机制**
   - 实时监控账户余额
   - 触发点: 保护金额 × 103%
   - 自动平仓所有持仓
   - 锁定账户防止继续亏损

4. **状态管理**
   - ACTIVE: 正常交易
   - PAUSED: 暂停交易
   - STOPPED: 已停止（保护触发）
   - 需手动解除锁定

---

## 📊 使用示例

### 示例 1: 保守型配置

```yaml
账户信息:
  初始余额: $50,000
  
配置参数:
  单次买入上限: $2,500 (5% of balance)
  分批数量: 5 份
  每份金额: $500
  保护金额: $25,000 (50% of initial)
  触发点: $25,750
  自动交易: 启用
  
风险评估:
  - 单次最大亏损: 5%
  - 分批建仓降低风险
  - 保护剩余50%本金
  - 适合稳健型投资者
```

### 示例 2: 激进型配置

```yaml
账户信息:
  初始余额: $100,000
  
配置参数:
  单次买入上限: $10,000 (10% of balance)
  分批数量: 3 份
  每份金额: $3,333
  保护金额: $30,000 (30% of initial)
  触发点: $30,900
  自动交易: 启用
  
风险评估:
  - 单次最大亏损: 10%
  - 较少分批，快速建仓
  - 允许更大回撤
  - 适合激进型投资者
```

---

## 🔧 技术实现细节

### 后端逻辑 (SimulatedTradingService)

```typescript
// 1. 接收配置参数
async autoTradeAllSymbols(
  accountId: number, 
  strategyId: number,
  config?: {
    maxPositionValue?: number;
    positionSplits?: number;
    forceProtectionBalance?: number;
  }
)

// 2. 计算每次交易数量
if (config?.maxPositionValue) {
  const splits = config?.positionSplits || 1;
  const perSplitAmount = config.maxPositionValue / splits;
  quantity = perSplitAmount / currentPrice;
}

// 3. 保护机制检查
if (balance <= protectionBalance * 1.03) {
  await closeAllPositions(accountId);
  await lockAccount(accountId);
  return { protection_triggered: true };
}

// 4. 执行交易
for (const signal of signals) {
  await executeTradeBySignal({
    accountId,
    strategyId,
    symbol,
    signalType,
    currentPrice,
    quantity  // 使用计算的数量
  });
}
```

### 前端逻辑

```javascript
// 1. 实时计算显示
positionSplits.addEventListener('input', (e) => {
  const maxPosition = parseFloat(maxPositionValue.value);
  const splits = parseInt(e.target.value);
  const perSplit = (maxPosition / splits).toFixed(2);
  display.textContent = `$${perSplit} USDT`;
});

// 2. 保护点计算
forceProtectionBalance.addEventListener('input', (e) => {
  const protection = parseFloat(e.target.value);
  const triggerPoint = (protection * 1.03).toFixed(2);
  display.textContent = `$${triggerPoint}`;
});

// 3. 保存配置
async function saveAutoTradeConfig(e) {
  e.preventDefault();
  
  // 验证
  if (maxPositionValue < 100) {
    showError('最小金额 100 USDT');
    return;
  }
  
  // 保存
  await axios.put(`/api/simulated/accounts/${id}/auto-trade-config`, {
    max_position_value: maxPositionValue,
    position_splits: positionSplits,
    force_protection_balance: forceProtectionBalance,
    auto_trading_enabled: autoTradingEnabled ? 1 : 0
  });
  
  // 立即执行
  if (autoTradingEnabled) {
    await executeAutoTradeWithConfig();
  }
}
```

---

## 📝 数据库应用步骤

### 应用 Migration 0050

需要先应用数据库迁移才能使用新功能:

```bash
# 使用 wrangler 应用迁移
npx wrangler d1 execute crypto-monitor-db --remote --file=migrations/0050_add_auto_trading_config.sql

# 或者手动在 Cloudflare Dashboard 中执行 SQL
```

**注意**: 由于沙盒环境无 Cloudflare 认证，需要在生产环境中应用迁移。

---

## ✅ 测试清单

### 功能测试:

- [ ] 打开自动交易配置对话框
- [ ] 输入单次买入上限金额
- [ ] 调整分批数量滑动条
- [ ] 实时计算每份金额显示正确
- [ ] 输入保护金额
- [ ] 触发点计算显示正确
- [ ] 启用/禁用自动交易开关
- [ ] 保存配置成功
- [ ] 配置保存到数据库
- [ ] 自动执行交易（如果启用）
- [ ] 保护机制正确触发

### 边界测试:

- [ ] 单次买入金额 < 100 USDT (应拒绝)
- [ ] 单次买入金额 > 余额 50% (应警告)
- [ ] 分批数量 < 1 或 > 10 (应拒绝)
- [ ] 保护金额 ≥ 当前余额 (应拒绝)
- [ ] 余额降至保护点 (应触发保护)
- [ ] 保护触发后账户锁定 (应无法交易)

---

## 🚀 部署说明

### 文件变更:

```
migrations/
  └── 0050_add_auto_trading_config.sql       # 数据库迁移

public/
  ├── trading.html                           # 添加配置对话框
  └── static/
      └── trading-v2.js?v=20251102-5        # 新增配置逻辑

src/
  ├── index.tsx                              # 新增API端点
  └── services/
      └── simulatedTradingService.ts        # 更新服务方法
```

### 部署步骤:

1. **应用数据库迁移**
   ```bash
   npx wrangler d1 execute crypto-monitor-db --remote --file=migrations/0050_add_auto_trading_config.sql
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **部署到 Cloudflare**
   ```bash
   npx wrangler pages deploy dist --project-name=crypto-monitor-dfc00ec5
   ```

4. **浏览器硬刷新**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

## 📞 故障排除

### 问题 1: 配置对话框不显示

**解决**:
- 硬刷新浏览器清除缓存
- 检查 JavaScript 控制台错误
- 确认账户状态为 ACTIVE

### 问题 2: 保存配置失败

**可能原因**:
- 数据库迁移未应用
- API 端点未部署
- 参数验证失败

**解决**:
- 检查数据库表是否有新字段
- 检查 API 响应错误信息
- 验证输入参数范围

### 问题 3: 保护机制未触发

**检查**:
- 保护金额是否正确设置
- 当前余额是否低于触发点
- protection_triggered 字段值

---

## 📚 相关文档

- [信号池生命周期设计](SIGNAL_LIFECYCLE_DESIGN.md)
- [信号池优化测试](SIGNAL_OPTIMIZATION_TEST.md)
- [部署说明](DEPLOYMENT_INSTRUCTIONS.md)

---

## 🎓 最佳实践

1. **初始配置建议**:
   - 单次买入: 余额的 5-10%
   - 分批数量: 3-5 份
   - 保护金额: 初始资金的 30-50%

2. **风险管理**:
   - 不要将所有资金投入单个币种
   - 定期检查账户余额和持仓
   - 设置合理的保护金额

3. **测试流程**:
   - 先用小额测试配置
   - 观察交易执行情况
   - 确认保护机制有效
   - 逐步增加投入

4. **监控要点**:
   - 定期查看交易日志
   - 关注余额变化
   - 警惕保护触发
   - 及时调整策略

---

**最后更新**: 2025-11-02  
**版本**: v1.0.0  
**作者**: GenSpark AI Developer
