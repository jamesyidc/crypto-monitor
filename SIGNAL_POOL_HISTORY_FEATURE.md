# 策略信号池历史查询功能文档

## 功能概述

在原有的策略触发信号买卖池基础上，新增了**历史查询功能**，允许用户按日期范围查看过去的策略触发信号记录。

## 核心功能

### 1. 双模式运行

- **实时监控模式**：监控最近3根K线的策略触发信号（原有功能）
- **历史查询模式**：按日期范围查询历史触发信号记录（新增功能）

### 2. 自动数据持久化

- 每次实时监控扫描到的信号会自动保存到数据库
- 支持历史数据的长期存储和查询
- 防止重复数据插入（通过UNIQUE约束）

### 3. 灵活的日期筛选

- 自定义日期范围（开始日期 ~ 结束日期）
- 快捷日期按钮：今天、昨天、最近7天
- 按日期分组的统计数据

## 技术实现

### 后端API（3个新端点）

#### 1. POST /api/signal-pool/save
**功能**：保存信号到历史记录表

**请求参数**：
```json
{
  "signals": [
    {
      "symbol": "BTC-USDT-SWAP",
      "signal_type": "BUY",
      "strategy_name": "震荡收敛策略",
      "price": 43250.5,
      "time": "2025-01-15T10:30:00Z",
      "timestamp": 1705315800000,
      "kline_index": 1,
      "reason": "5根K线内2次震荡收敛",
      "indicators": {
        "rsi": 45.6,
        "change": 0.05
      }
    }
  ]
}
```

**响应**：
```json
{
  "success": true,
  "saved_count": 5,
  "total": 5
}
```

#### 2. GET /api/signal-pool/history
**功能**：按日期范围查询历史信号

**请求参数**：
- `startDate` (string): 开始日期，格式 YYYY-MM-DD
- `endDate` (string): 结束日期，格式 YYYY-MM-DD
- `symbol` (string, 可选): 币种过滤
- `signalType` (string, 可选): 信号类型过滤 (BUY/SELL)
- `limit` (number, 可选): 返回数量限制，默认1000

**示例请求**：
```
GET /api/signal-pool/history?startDate=2025-01-01&endDate=2025-01-15&limit=500
```

**响应**：
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "symbol": "BTC-USDT-SWAP",
        "signal_type": "BUY",
        "strategy_name": "震荡收敛策略",
        "price": 43250.5,
        "time": "2025-01-15T10:30:00Z",
        "timestamp": 1705315800000,
        "kline_index": 1,
        "reason": "5根K线内2次震荡收敛",
        "indicators": {
          "rsi": 45.6,
          "change": 0.05
        },
        "timeframe": "5m",
        "created_at": "2025-01-15T10:31:00Z"
      }
    ],
    "summary": {
      "total": 150,
      "buy_count": 80,
      "sell_count": 70,
      "date_range": {
        "start": "2025-01-01",
        "end": "2025-01-15"
      },
      "date_stats": [
        {
          "date": "2025-01-15",
          "buy": 12,
          "sell": 8,
          "total": 20
        }
      ]
    }
  }
}
```

#### 3. GET /api/signal-pool/dates
**功能**：获取有历史数据的日期列表

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-15",
      "signal_count": 45,
      "buy_count": 25,
      "sell_count": 20
    },
    {
      "date": "2025-01-14",
      "signal_count": 38,
      "buy_count": 20,
      "sell_count": 18
    }
  ]
}
```

### 数据库设计

#### signal_history 表结构

```sql
CREATE TABLE signal_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,                -- 币种（如 BTC-USDT-SWAP）
  signal_type TEXT NOT NULL,           -- 信号类型（BUY/SELL）
  strategy_name TEXT NOT NULL,         -- 策略名称
  price REAL NOT NULL,                 -- 触发价格
  signal_time TEXT NOT NULL,           -- 信号时间（ISO格式）
  timestamp INTEGER NOT NULL,          -- Unix时间戳（毫秒）
  kline_index INTEGER,                 -- K线索引（第几根）
  reason TEXT,                         -- 触发原因描述
  rsi REAL,                            -- RSI指标值
  change_value REAL,                   -- 价格变化百分比
  timeframe TEXT DEFAULT '5m',         -- 时间周期
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,  -- 记录创建时间
  UNIQUE(symbol, signal_type, timestamp)      -- 防止重复插入
);
```

**索引优化建议**：
```sql
CREATE INDEX idx_signal_time ON signal_history(signal_time);
CREATE INDEX idx_symbol ON signal_history(symbol);
CREATE INDEX idx_signal_type ON signal_history(signal_type);
```

### 前端实现

#### 模拟交易页面 (trading.html)

新增UI组件：

1. **查询模式选择器**
```html
<select id="signalQueryMode">
  <option value="realtime">实时监控（最近3根K线）</option>
  <option value="history">历史查询（按日期）</option>
</select>
```

2. **日期选择区域**（默认隐藏）
```html
<div id="historyDateControls" class="hidden">
  <input type="date" id="signalStartDate">
  <input type="date" id="signalEndDate">
  <button id="queryHistoryBtn">查询历史</button>
  <button id="quickTodayBtn">今天</button>
  <button id="quickYesterdayBtn">昨天</button>
  <button id="quickWeekBtn">最近7天</button>
</div>
```

#### JavaScript逻辑 (trading-v2.js)

核心函数：

1. **loadHistorySignals()**：查询历史信号
2. **saveSignalsToHistory(signals)**：保存信号到历史
3. **loadSignalPoolWithSave()**：加载实时信号并自动保存
4. **setQuickDate(days)**：快捷日期设置
5. **initDateControls()**：初始化日期控件

事件绑定：
```javascript
// 模式切换
document.getElementById('signalQueryMode').addEventListener('change', (e) => {
  if (e.target.value === 'history') {
    // 显示日期选择器
    document.getElementById('historyDateControls').classList.remove('hidden');
  } else {
    // 隐藏日期选择器，加载实时数据
    document.getElementById('historyDateControls').classList.add('hidden');
    loadSignalPoolWithSave();
  }
});

// 历史查询
document.getElementById('queryHistoryBtn').addEventListener('click', loadHistorySignals);

// 快捷日期按钮
document.getElementById('quickTodayBtn').addEventListener('click', () => {
  setQuickDate(0);
  loadHistorySignals();
});
```

#### 实盘交易页面 (live-trading.html)

完全复制模拟交易的历史查询功能，所有ID添加 `liveTrading` 前缀：
- `liveTradingSignalQueryMode`
- `liveTradingHistoryDateControls`
- `liveTradingSignalStartDate`
- `liveTradingSignalEndDate`
- 等等...

## 使用场景

### 场景1：查看今天的所有信号
1. 切换到"历史查询"模式
2. 点击"今天"快捷按钮
3. 系统自动查询当天所有触发信号

### 场景2：分析过去一周的策略表现
1. 切换到"历史查询"模式
2. 点击"最近7天"快捷按钮
3. 查看汇总统计：总信号数、做多数、做空数
4. 分析每日信号分布

### 场景3：追溯特定日期的买卖点
1. 切换到"历史查询"模式
2. 手动选择开始和结束日期
3. 点击"查询历史"
4. 在表格中查看详细的触发价格、策略、原因

### 场景4：实时监控与历史对比
1. 在实时模式下监控当前信号
2. 系统自动保存信号到历史记录
3. 切换到历史模式查看刚才的信号记录
4. 对比不同时间段的策略表现

## 数据流程

```
实时模式:
用户访问页面 → 加载实时信号 → 自动保存到历史表 → 显示数据 → 30秒自动刷新

历史模式:
用户选择日期 → 查询历史表 → 按日期分组统计 → 显示数据 → 手动刷新
```

## 性能优化

### 1. 数据库优化
- 在 `signal_time`、`symbol`、`signal_type` 字段上建立索引
- 使用 UNIQUE 约束防止重复数据
- 查询时使用 `LIMIT` 控制返回数量

### 2. 前端优化
- 使用防抖（debounce）处理日期选择事件
- 实时模式下才启用自动刷新定时器
- 历史模式下使用手动刷新，减少不必要的请求

### 3. 批量操作
- 信号保存使用批量插入（INSERT OR IGNORE）
- 一次性保存所有扫描到的信号

## 故障排查

### 问题1：历史数据查不到
**可能原因**：
- 数据库表未创建
- 实时信号未自动保存
- 日期范围选择不正确

**解决方法**：
1. 检查 `signal_history` 表是否存在
2. 查看浏览器控制台是否有保存失败的错误
3. 确认选择的日期范围内有数据

### 问题2：日期选择器不显示
**可能原因**：
- 未切换到历史查询模式
- JavaScript 事件绑定失败

**解决方法**：
1. 确认已选择"历史查询"模式
2. 检查浏览器控制台的JavaScript错误
3. 刷新页面重新初始化

### 问题3：数据保存失败
**可能原因**：
- 数据库连接问题
- UNIQUE 约束冲突
- 数据格式不正确

**解决方法**：
1. 查看服务器日志
2. 检查是否有重复的 (symbol, signal_type, timestamp) 组合
3. 验证信号数据的完整性

## 未来扩展

### 阶段1：高级筛选
- 按币种筛选
- 按策略类型筛选
- 按信号类型筛选（做多/做空）
- 价格区间筛选

### 阶段2：数据分析
- 信号胜率统计
- 策略效果对比
- 时间段热力图
- 币种信号频率排行

### 阶段3：数据导出
- 导出CSV格式
- 导出Excel格式
- 导出PDF报表
- 数据备份功能

### 阶段4：智能提醒
- 历史同期信号提醒
- 高频信号币种提醒
- 异常信号检测
- 策略失效预警

## 技术栈

- **后端框架**：Hono (Cloudflare Workers)
- **数据库**：Cloudflare D1 (SQLite)
- **前端框架**：原生 JavaScript + Tailwind CSS
- **HTTP客户端**：Axios (模拟交易) / Fetch API (实盘交易)
- **日期处理**：原生 Date API

## 相关文档

- [策略信号池基础功能文档](./SIGNAL_POOL_FEATURE.md)
- [数据库设计文档](./DATABASE_SCHEMA.md)
- [API接口文档](./API_DOCUMENTATION.md)

## 版本历史

- **v1.1.0** (2025-01-15): 新增历史查询功能
  - 添加3个新API端点
  - 创建 signal_history 数据库表
  - 实现日期范围查询
  - 添加快捷日期按钮
  - 自动数据持久化

- **v1.0.0** (2025-01-14): 初始版本
  - 实时信号池监控
  - 最近3根K线信号显示
  - 自动30秒刷新

## 联系与支持

如有问题或建议，请联系开发团队或提交 GitHub Issue。

---

**最后更新**：2025-01-15  
**文档版本**：v1.1.0  
**作者**：GenSpark AI Developer Team
