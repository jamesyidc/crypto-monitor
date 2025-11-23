# 信号历史查询功能修复

## 问题描述

用户点击"查看历史数据"按钮后，无法显示历史信号数据，页面显示"暂无符合条件的信号记录"。

## 根本原因分析

### 业务逻辑问题

1. **表不存在**
   - `signal_history` 表从未被创建
   - 后端代码在 `/api/signal-pool/save` 中有 `CREATE TABLE IF NOT EXISTS`，但这依赖于首次调用才会执行
   - 如果从未调用过保存API，表就不存在

2. **数据缺失**
   - 即使前端调用了 `saveSignalsToHistory()`，如果API调用失败或网络问题，数据也不会被保存
   - 没有数据的情况下，查询会返回空结果

3. **缺少数据库迁移**
   - 项目中没有为 `signal_history` 创建独立的迁移文件
   - 导致表的创建依赖于业务代码的首次调用，而不是在部署时自动创建

### 代码流程分析

```javascript
// 前端 (trading-v2.js)
document.getElementById('viewHistoryBtn').addEventListener('click', () => {
  // 1. 切换到历史模式
  queryModeSelect.value = 'history';
  
  // 2. 设置日期为今天
  setQuickDate(0);  // startDate = today, endDate = today
  
  // 3. 调用历史查询API
  loadHistorySignals();
});

async function loadHistorySignals() {
  // 调用 GET /api/signal-pool/history?startDate=2025-11-02&endDate=2025-11-02
  const response = await axios.get('/api/signal-pool/history', {
    params: { startDate, endDate, limit: 1000 }
  });
}

// 后端 (src/index.tsx)
app.get('/api/signal-pool/history', async (c) => {
  // 查询语句
  const query = `
    SELECT * FROM signal_history 
    WHERE DATE(signal_time) >= ? AND DATE(signal_time) <= ?
    ORDER BY timestamp DESC 
    LIMIT ?
  `;
  
  // ❌ 如果表不存在，这里会抛出异常
  const result = await db.prepare(query).bind(startDate, endDate, limit).all();
});
```

## 解决方案

### 1. 创建数据库迁移文件

**文件**: `migrations/0047_create_signal_history.sql`

```sql
-- 创建信号历史表
CREATE TABLE IF NOT EXISTS signal_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  price REAL NOT NULL,
  signal_time TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  kline_index INTEGER,
  reason TEXT,
  rsi REAL,
  change_value REAL,
  timeframe TEXT DEFAULT '5m',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, signal_type, timestamp)
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_signal_history_time ON signal_history(signal_time);
CREATE INDEX IF NOT EXISTS idx_signal_history_symbol ON signal_history(symbol);
CREATE INDEX IF NOT EXISTS idx_signal_history_type ON signal_history(signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_history_timestamp ON signal_history(timestamp);
```

### 2. 应用迁移

```bash
# 本地数据库
npx wrangler d1 execute DB --local --file=./migrations/0047_create_signal_history.sql

# 生产数据库
npx wrangler d1 execute DB --remote --file=./migrations/0047_create_signal_history.sql
```

### 3. 插入测试数据（用于验证）

```sql
INSERT INTO signal_history (symbol, signal_type, strategy_name, price, signal_time, timestamp, reason, rsi, change_value) VALUES 
('BTC', 'BUY', '震荡收敛策略', 95000.5, '2025-11-02T10:30:00Z', 1730545800000, 'RSI超卖+震荡收敛', 28.5, -2.3),
('ETH', 'SELL', '波段高点策略', 3200.8, '2025-11-02T11:00:00Z', 1730547600000, 'RSI超买+价格高点', 72.3, 1.8),
('BTC', 'BUY', '止跌反弹策略', 94500.2, '2025-11-02T09:15:00Z', 1730541300000, '止跌K线+成交量放大', 32.1, -3.5),
('SOL', 'SELL', '止盈止损策略', 145.7, '2025-11-02T10:45:00Z', 1730546700000, '达到止盈目标', 68.9, 2.1);
```

### 4. 验证数据

```bash
npx wrangler d1 execute DB --local --command="SELECT COUNT(*) as total FROM signal_history;"
npx wrangler d1 execute DB --local --command="SELECT * FROM signal_history ORDER BY timestamp DESC LIMIT 5;"
```

## 测试步骤

### 前置条件
1. ✅ `signal_history` 表已创建
2. ✅ 表中有测试数据（至少4条记录）
3. ✅ 项目已重新构建 (`npm run build`)

### 测试流程

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问模拟交易页面**
   - 打开浏览器：http://localhost:8787/trading.html
   - 滚动到"策略触发信号买卖池"区域

3. **点击"查看历史数据"按钮**
   - 应该自动切换到历史查询模式
   - 日期选择器应该显示
   - 日期应该自动设置为今天 (2025-11-02)
   - 页面应该平滑滚动到信号池区域

4. **验证数据显示**
   - 应该显示4条测试信号记录：
     - BTC - BUY - 震荡收敛策略
     - ETH - SELL - 波段高点策略
     - BTC - BUY - 止跌反弹策略
     - SOL - SELL - 止盈止损策略
   - 统计数字应该显示：
     - 做多信号: 2
     - 做空信号: 2
     - 白板信号: 0

5. **测试日期范围筛选**
   - 选择不同的日期范围
   - 点击"查询"按钮
   - 验证结果根据日期筛选

6. **测试快捷日期按钮**
   - 点击"今天"按钮 → 应该显示今天的数据
   - 点击"昨天"按钮 → 应该显示昨天的数据（如果有）
   - 点击"最近7天"按钮 → 应该显示最近7天的数据

## 预期结果

### 成功场景
- ✅ 按钮点击后立即切换到历史查询模式
- ✅ 自动设置日期为今天
- ✅ 自动加载并显示历史数据
- ✅ 平滑滚动到信号池区域
- ✅ 显示正确的统计信息
- ✅ 数据按时间倒序排列（最新的在前）

### 异常场景处理
- ❌ 如果没有数据：显示"暂无符合条件的信号记录"
- ❌ 如果日期格式错误：显示"请选择开始和结束日期"
- ❌ 如果API调用失败：显示"查询失败: [错误信息]"

## 业务逻辑改进

### 数据保存机制
```javascript
// 当前实现
async function loadSignalPoolWithSave() {
  const response = await axios.get('/api/signal-pool/recent');
  
  if (response.data.success) {
    const { signals, summary } = response.data.data;
    renderSignalPool(signals, summary);
    
    // 自动保存到历史记录
    if (signals.length > 0) {
      await saveSignalsToHistory(signals);  // ✅ 每次加载实时信号时自动保存
    }
  }
}
```

### 建议改进

1. **定时自动保存**
   - 每5分钟自动保存一次实时信号到历史表
   - 使用定时器： `setInterval(saveSignalsToHistory, 5 * 60 * 1000)`

2. **去重处理**
   - 表中已有 `UNIQUE(symbol, signal_type, timestamp)` 约束
   - 使用 `INSERT OR IGNORE` 避免重复插入

3. **错误重试**
   - 如果保存失败，自动重试3次
   - 记录失败日志到控制台

4. **批量保存优化**
   - 使用事务批量插入，提高性能
   - 减少数据库往返次数

## 部署清单

### 本地环境
- [x] 创建迁移文件 `migrations/0047_create_signal_history.sql`
- [x] 应用迁移到本地数据库
- [x] 插入测试数据
- [x] 验证表创建成功
- [x] 重新构建项目 (`npm run build`)
- [ ] 启动开发服务器测试

### 生产环境
- [ ] 应用迁移到生产数据库
  ```bash
  npx wrangler d1 execute DB --remote --file=./migrations/0047_create_signal_history.sql
  ```
- [ ] 验证表创建成功
  ```bash
  npx wrangler d1 execute DB --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='signal_history';"
  ```
- [ ] 部署应用
  ```bash
  npm run deploy
  ```
- [ ] 验证功能正常

## 监控和维护

### 数据增长监控
```sql
-- 查看每天的信号数量
SELECT DATE(signal_time) as date, 
       COUNT(*) as total,
       SUM(CASE WHEN signal_type = 'BUY' THEN 1 ELSE 0 END) as buy_count,
       SUM(CASE WHEN signal_type = 'SELL' THEN 1 ELSE 0 END) as sell_count
FROM signal_history
GROUP BY DATE(signal_time)
ORDER BY date DESC
LIMIT 30;
```

### 数据清理策略
```sql
-- 删除90天以前的历史数据（可选）
DELETE FROM signal_history 
WHERE DATE(signal_time) < DATE('now', '-90 days');
```

## 总结

### 修复内容
1. ✅ 创建了 `signal_history` 表的数据库迁移
2. ✅ 应用迁移到本地数据库
3. ✅ 插入测试数据验证功能
4. ✅ 构建项目准备测试

### 根本问题
- **数据库表缺失**：没有独立的迁移文件，表的创建依赖于业务代码首次调用
- **数据保存依赖**：前端调用保存API，但没有验证是否成功

### 业务改进建议
1. 为所有核心表创建独立的迁移文件
2. 实现自动保存机制（定时器 + 错误重试）
3. 添加数据保存状态监控
4. 实现数据清理策略（保留最近90天）

### 下一步行动
1. 启动开发服务器测试功能
2. 验证所有测试场景
3. 部署到生产环境
4. 监控生产数据保存情况
