# 加密货币监控系统 - 业务逻辑开发手册

## 📋 目录
1. [比价页面业务逻辑](#比价页面业务逻辑)
2. [数据统计规则](#数据统计规则)
3. [时间处理规则](#时间处理规则)
4. [未来待确认逻辑](#未来待确认逻辑)

---

## 比价页面业务逻辑

### 页面布局（三栏）

#### 左栏（最大）- 汇总统计
**列定义（严格7列）：**
1. 币名
2. 最高价格
3. 计次
4. 最低价格
5. 计次
6. 最高占比
7. 最低占比

**数据来源：**
- API: `/api/compare/summary`
- 数据表: `price_extremes` (极值汇总) + `coin_round_details` (当前价格)

**显示规则：**
- 计次列：黄色背景（`#fff9c4`）
- 最高占比颜色规则：
  - ≥100%: 深绿色 (#4caf50)
  - ≥90%: 浅绿色 (#8bc34a)
  - ≥80%: 黄色 (#ffeb3b)
  - ≥70%: 浅黄色 (#fff59d)
- 最低占比颜色规则：
  - ≥120%: 深绿色 (#4caf50)
  - ≥110%: 浅绿色 (#8bc34a)
  - ≥105%: 黄色 (#ffeb3b)
  - ≥100%: 浅黄色 (#fff59d)

#### 中栏 - 极值记录
**列定义（严格4列）：**
1. 币名
2. 时间
3. 状态（新高/新低）
4. 跳播

**数据来源：**
- API: `/api/compare/records`
- 数据表: `extreme_records`

**显示规则：**
- 按时间倒序显示（最新的在最上面）
- 限制显示最近100条记录
- 状态列显示彩色徽章：
  - 新高：绿色背景
  - 新低：橙色背景
- **跳播列：初始状态为空（显示"-"）**

**触发逻辑：**
- 当任何币种触发新高或新低时，会在 `extreme_records` 表中插入一条记录
- 这条记录会自动显示在中栏的最上方

#### 右栏 - 时间段统计
**列定义（严格4列）：**
1. 币名
2. 今天
3. 三日
4. 七天

**数据来源：**
- API: `/api/compare/timestats`
- 数据表: `extreme_records`（按时间范围统计）

**计算规则：**
- **今天**：从北京时间今天0点到现在，该币种在 `extreme_records` 中的记录总数
- **三日**：从3天前的北京时间0点到现在，该币种的极值记录总数
- **七天**：从7天前的北京时间0点到现在，该币种的极值记录总数

**显示规则：**
- 初始状态所有列可能为0
- 当触发新高或新低时，对应币种的对应时间段列 +1
- 有数据的单元格显示蓝色背景高亮

### 极值触发与更新逻辑

**触发条件：**
1. 当系统执行分析时，检测到某币种价格创历史新高
2. 当系统执行分析时，检测到某币种价格创历史新低

**触发后的数据更新：**
1. **`price_extremes` 表更新**：
   - 更新对应币种的 `all_time_high` 或 `all_time_low`
   - 更新对应的 `high_count` 或 `low_count`（计次+1）
   - 更新 `ath_date` 或 `atl_date`（极值触发时间）

2. **`extreme_records` 表插入新记录**：
   - 插入一条新记录，包含：币名、记录类型（new_high/new_low）、价格、时间戳
   - 这条记录会立即显示在比价页面的中栏最上方

3. **右栏统计自动更新**：
   - 因为新记录插入了 `extreme_records` 表
   - 对应币种的"今天"、"三日"、"七天"统计会自动+1（如果时间范围匹配）

**示例流程：**
```
BTC触发新高 → 
  1. price_extremes: high_count +1
  2. extreme_records: 插入新记录（BTC, new_high, 价格, 时间）
  3. 比价页面中栏: 显示新记录
  4. 比价页面右栏: BTC的"今天"列 +1
```

---

## 数据统计规则

### 时间范围定义
所有时间统计基于**北京时间（UTC+8）**：

- **今天**：北京时间今天0点 → 现在
- **三日**：北京时间3天前0点 → 现在
- **七天**：北京时间7天前0点 → 现在

### 计次规则
- **高计次（high_count）**：该币种历史上触发新高的总次数
- **低计次（low_count）**：该币种历史上触发新低的总次数
- 每次触发时，对应计次 +1，累计不重置

### 占比计算
- **最高占比** = (当前价格 / 历史最高价) × 100%
- **最低占比** = (当前价格 / 历史最低价) × 100%
- 占比是动态计算的，随当前价格实时变化

---

## 时间处理规则

### 统一时区标准
所有数据清零、统计、显示均基于**北京时间（UTC+8）**

### 数据清零时机
- 每日北京时间0点，执行每日数据清零
- 清零内容：（待用户补充）

---

## K线数据查询系统

### 通道状态统计需求（2025-10-28 新增 ✅ 已实现）

**用户需求：** "往前40根k线中 下降通道+下跌衰竭 的占比 单独一列；往前40根k线中 上升通道+上升衰竭 的占比 单独一列"

**新增列定义：**
1. **下降通道+下跌衰竭占比**
   - 统计范围：当前K线往前40根K线（包含当前）
   - 统计条件：通道状态为"下降通道 📉"或"下跌衰竭 ⚠️"
   - 计算公式：符合条件的K线数 / 实际窗口大小 × 100%
   - 显示格式：百分比（如：25.00%）
   - 颜色规则：>50% 红色加粗，其他灰色

2. **上升通道+上升衰竭占比**
   - 统计范围：当前K线往前40根K线（包含当前）
   - 统计条件：通道状态为"上升通道 📈"或"上升衰竭 ⚠️"
   - 计算公式：符合条件的K线数 / 实际窗口大小 × 100%
   - 显示格式：百分比（如：30.00%）
   - 颜色规则：>50% 绿色加粗，其他灰色

**实现方式：**
- 后端API计算：在 `indicatorService.ts` 的 `calculateSARRSIBoll` 方法中计算
- 前端显示：在K线数据表格中添加两列
- 数据实时计算：每次查询K线时动态计算
- 滚动窗口处理：如果K线数不足40根，使用实际数量计算占比

**通道状态完整列表（基于布林带计算）：**
通道状态由布林带中轨角度（angle_MB）和带宽变化（width_change）决定：

1. **上升通道 📈** - `angle_MB > 5 && width_change > 3`
2. **下降通道 📉** - `angle_MB < -5 && width_change > 3`
3. **上升衰竭 ⚠️** - `angle_MB > 5 && width_change < -3`
4. **下跌衰竭 ⚠️** - `angle_MB < -5 && width_change < -3`
5. **震荡收敛 🔁** - `Math.abs(angle_MB) < 5 && width_change < -3`
6. **放量突破 ⚡** - `Math.abs(angle_MB) < 5 && width_change > 3`
7. **中性** - 其他情况

**计算逻辑（chengxu.txt算法）：**
```javascript
// 布林带角度计算
function angle(a, b) {
  const scale = ((a + b) / 2) * 0.001;
  return Math.atan((b - a) / scale) * 180 / Math.PI;
}

// 带宽变化计算
const width_prev = UB_prev - LB_prev;
const width_now = UB_now - LB_now;
const width_change = (width_now - width_prev) / width_prev * 100;

// 通道状态判断
const angle_MB = angle(MB_prev, MB_now);
if (angle_MB > 5 && width_change > 3) state = "上升通道 📈";
else if (angle_MB < -5 && width_change > 3) state = "下降通道 📉";
// ... 其他条件
```

**实现文件：**
- 后端逻辑：`/home/user/webapp/src/services/indicatorService.ts`
- 前端表头：`/home/user/webapp/public/kline.html`
- 前端渲染：`/home/user/webapp/public/static/kline.js`

**API响应字段：**
每个K线对象包含以下新增字段：
- `down_channel_exhaustion_ratio`: 下降通道+下跌衰竭占比（数字类型，如 25.00）
- `up_channel_exhaustion_ratio`: 上升通道+上升衰竭占比（数字类型，如 30.00）

**实现日期：** 2025-10-28 16:30

---

## 未来待确认逻辑

### 待确认项
以下逻辑在实现前必须向用户确认，不得自作主张：

1. **跳播列的具体含义和计算方式**
   - 当前状态：空着，显示 "-"
   - 需要确认：跳播是什么指标？如何计算？何时显示数据？

3. **中栏极值记录的筛选逻辑**
   - 当前状态：显示最近100条，按时间倒序
   - 需要确认：是否需要按币种分组？是否需要去重逻辑？

4. **右栏统计的去重规则**
   - 当前状态：统计所有 extreme_records 记录数
   - 需要确认：如果同一币种在同一天触发多次新高，是否计为1次还是多次？

5. **数据清零的具体内容**
   - 当前状态：每日清零功能已实现，但不清楚清零哪些字段
   - 需要确认：每天0点需要清零哪些表的哪些字段？

6. **历史极值的重置规则**
   - 当前状态：极值永久累计
   - 需要确认：是否需要定期重置？重置周期是多久？

---

## 开发原则

### 必须遵守的原则
1. **严格执行已确认的业务逻辑**：不得修改、不得优化、不得"改进"
2. **遇到冲突必须询问用户**：任何两条逻辑有矛盾时，停下来询问，不要猜测
3. **遇到未定义逻辑必须询问用户**：新功能、新计算方式必须先问清楚
4. **不要自作主张添加功能**：用户没要求的功能一律不做
5. **不要擅自修改已实现的逻辑**：即使发现"不合理"也要先问用户

### 业务逻辑优先级
1. 用户明确说的 > 任何技术最佳实践
2. 业务需求 > 代码优雅性
3. 功能正确 > 性能优化

---

## 数据管理

### 操作记录

#### 1. 极值数据基准重置
**执行日期：** 2025-10-28 15:40

**操作内容：**
1. 清除 `price_extremes` 表的所有旧数据
2. 导入用户提供的29个币种新基准数据
3. 保留 `extreme_records` 表（极值记录日志）不变

**新基准数据特点：**
- 29个币种的历史极值价格
- 每个币种的高计次和低计次（累计触发次数）
- 占比由当前价格动态计算

**执行命令：**
```bash
npx wrangler d1 execute webapp-production --local --file=./reset_price_extremes.sql
```

**执行脚本：** `reset_price_extremes.sql`

**币种列表：**
OKB, DOT, LINK, ADA, FIL, XLM, HBAR, BCH, ETC, TON, TRX, SUI, DOGE, SOL, LTC, BNB, XRP, ETH, BTC, CRO, CFX, CRV, APT, NEAR, UNI, AAVE, STX, TAO, LDO

**结果：**
- ✅ 成功删除所有旧数据
- ✅ 成功导入29个币种新数据
- ✅ 比价页面左栏显示新的基准数据

---

#### 2. 清零今天的极值记录
**执行日期：** 2025-10-28 15:45

**用户需求：** "把今天的极值记录清零"

**操作内容：**
1. 删除 `extreme_records` 表中今天（北京时间）的所有记录
2. 不影响 `price_extremes` 表的汇总数据

**执行命令：**
```bash
npx wrangler d1 execute webapp-production --local --command="DELETE FROM extreme_records WHERE DATE(timestamp) = DATE('now', '+8 hours')"
```

**影响范围：**
- `extreme_records` 表：删除今天的所有记录
- 比价页面中栏：清空，显示"暂无记录"
- 比价页面右栏：今天、三日、七天的统计归零
- `price_extremes` 表：不受影响

**结果：**
- ✅ 成功删除今天的所有极值记录
- ✅ 剩余记录数：0 条
- ✅ 比价页面中栏和右栏已清空

**后续行为：**
- 当下次执行分析触发新的极值时，记录会重新开始累积
- 计次会在原有基础上继续 +1（不清零）

---

#### 3. 添加买卖点信号生成调度器
**执行日期：** 2025-10-28 16:00

**用户需求：** "买卖点信号分析这个系统今天一个信号都没有你找找问题在哪里" → "1分钟的频率"

**问题诊断：**
1. 发现系统中没有信号生成调度器
2. 信号生成API存在且工作正常（`/api/signal/all`）
3. K线数据已同步完成
4. 手动测试生成了147个信号

**解决方案：**
创建信号生成调度器，每1分钟自动调用一次信号生成API

**新增文件：**
- `signal-scheduler.cjs` - 信号生成调度器脚本

**修改文件：**
- `ecosystem.config.cjs` - 添加 signal-scheduler 到PM2配置

**调度器配置：**
- API端点: `http://localhost:3000/api/signal/all`
- 执行频率: 每1分钟（60秒）
- Telegram通知: 关闭（默认）
- 启动方式: PM2自动管理

**启动命令：**
```bash
pm2 start signal-scheduler.cjs --name signal-scheduler
```

**或使用PM2配置文件：**
```bash
pm2 start ecosystem.config.cjs
```

**验证结果：**
- ✅ 调度器成功启动
- ✅ 第1次执行成功（耗时3.21秒）
- ✅ 生成149个信号（84买入 + 65卖出）
- ✅ 信号已保存到 `trading_signals` 表

**调度器日志示例：**
```
⏰ [2025-10-28 15:54:37 北京时间] 第 1 次信号生成开始...
✅ 信号生成完成 (耗时: 3.21秒)
   📊 币种总数: 27
   📈 总信号数: 149
   🟢 买入信号: 84
   🔴 卖出信号: 65
```

**系统调度器总览：**
1. `crypto-monitor` - 主服务（Wrangler Pages Dev）
2. `analysis-scheduler` - 价格分析调度器（5分钟）
3. `kline-scheduler` - K线数据同步调度器（15分钟）
4. `signal-scheduler` - 买卖点信号生成调度器（1分钟）✨ 新增

---

## 买卖点信号系统

### 信号发送规则（2025-10-28 新增 ✅ 已实现）

**用户需求：** "买卖点系统 1个币5分钟K线内只允许发一个预警 且只允许发本小时的预警和上个小时最后10分钟 发过预警了的标注清楚不要多发 我可以手动设置哪些信号预警发tg"

**核心规则：**

1. **5分钟K线去重规则**
   - 同一币种在同一个5分钟K线区间内，只能发送1个买卖点信号
   - 通过`kline_time`字段标识K线区间（将分钟数向下取整到5的倍数）
   - 使用`signal_send_log`表记录每个K线区间的发送情况
   - 即使该K线内有多个信号，也只发送最新的一个

2. **时间范围限制**
   - **本小时**: 允许发送当前小时内的所有信号
   - **上个小时最后10分钟**: 允许发送上个小时50-59分的信号
   - **其他时间**: 不发送，直接跳过
   - 使用北京时间（UTC+8）计算时间范围

3. **已发送标注**
   - `trading_signals`表的`telegram_sent`字段标记是否已发送
   - `signal_send_log`表记录每个K线区间的发送历史
   - 防止重复发送同一K线的信号

4. **手动配置发送类型**
   - 使用`signal_send_config`表配置哪些信号类型可以发送到Telegram
   - 支持两类信号：
     - `trading`: 买卖点信号（BUY/SELL）
     - `alert`: 预警信号（成交量≥V1、涨幅≥1%等）
   - 每种类型都有独立的启用/禁用开关
   - 通过API接口可以动态修改配置

**数据库表结构：**

```sql
-- 信号发送配置表
CREATE TABLE signal_send_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_category TEXT NOT NULL,    -- 'trading' 或 'alert'
  signal_type TEXT NOT NULL,        -- 对于trading: 'BUY'/'SELL'
  enabled INTEGER DEFAULT 1,         -- 1=启用, 0=禁用
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(signal_category, signal_type)
);

-- 信号发送日志表（用于K线去重）
CREATE TABLE signal_send_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  kline_time TEXT NOT NULL,          -- K线时间（5分钟K线的开始时间）
  signal_category TEXT NOT NULL,     -- 'trading' 或 'alert'
  signal_id INTEGER NOT NULL,        -- 对应的信号ID
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, kline_time, signal_category)
);

-- trading_signals表新增字段
ALTER TABLE trading_signals ADD COLUMN kline_time TEXT;
```

**API接口：**

1. **获取信号配置**: `GET /api/signal-config`
   - 返回所有信号类型的启用/禁用状态

2. **更新单个配置**: `PUT /api/signal-config`
   - Body: `{signal_category, signal_type, enabled}`
   - 示例: `{signal_category: "trading", signal_type: "BUY", enabled: true}`

3. **批量更新配置**: `POST /api/signal-config/batch`
   - Body: `{configs: [{signal_category, signal_type, enabled}, ...]}`

**过滤逻辑流程：**

1. 从数据库获取所有未发送的买卖点信号
2. 过滤器1: 检查信号类型是否在配置中启用
3. 过滤器2: 检查信号时间是否在允许范围内（本小时或上小时最后10分钟）
4. 过滤器3: 检查该K线区间是否已经发送过信号
5. 去重: 每个K线区间只保留一个信号
6. 发送到Telegram
7. 标记为已发送并记录发送日志

**实现文件：**
- 数据库迁移: `/home/user/webapp/migrations_signal/0001_signal_config.sql`
- 后端服务: `/home/user/webapp/src/services/signalService.ts`
- API路由: `/home/user/webapp/src/index.tsx`

**实现日期：** 2025-10-28 17:00

---

## 交易规则系统（2025-10-28 新增 ✅ 已实现）

### 系统概述

**用户需求：** "交易规则系统 大的规则制定 这个是决定能不能开单 能开多单还是能开空单 还是都能开的一个系统 把他和特征库合并放在一个页面内"

**功能定位：**
交易规则系统用于制定每个币种的交易权限，决定：
1. **能否开单**（交易许可）
2. **能开多单还是空单**（方向限制）
3. **还是都能开**（双向交易）

### 数据库表结构

```sql
-- 交易规则表
CREATE TABLE trading_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,                    -- 币种符号 (如 BTC, ETH)
  trading_allowed INTEGER DEFAULT 1,              -- 是否允许交易 (1=允许, 0=禁止)
  long_allowed INTEGER DEFAULT 1,                 -- 是否允许做多 (1=允许, 0=禁止)
  short_allowed INTEGER DEFAULT 1,                -- 是否允许做空 (1=允许, 0=禁止)
  notes TEXT,                                     -- 备注说明
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**索引：**
- `idx_trading_rules_symbol` - 按币种快速查询
- `idx_trading_rules_allowed` - 按交易状态筛选

**默认数据：**
- 系统自动为所有29个币种创建默认规则
- 默认状态：允许所有交易（trading_allowed=1, long_allowed=1, short_allowed=1）

### 权限判断逻辑

**三级权限控制：**

1. **trading_allowed（一级开关）**
   - `1` = 允许交易，继续检查二级开关
   - `0` = 禁止所有交易，直接拒绝（优先级最高）

2. **long_allowed（二级开关）**
   - 前提：trading_allowed = 1
   - `1` = 允许开多单
   - `0` = 禁止开多单

3. **short_allowed（二级开关）**
   - 前提：trading_allowed = 1
   - `1` = 允许开空单
   - `0` = 禁止开空单

**组合场景：**

| trading_allowed | long_allowed | short_allowed | 交易权限 |
|----------------|--------------|---------------|---------|
| 1 | 1 | 1 | 允许多空双向 |
| 1 | 1 | 0 | 仅允许做多 |
| 1 | 0 | 1 | 仅允许做空 |
| 0 | - | - | 禁止所有交易 |

### 服务层方法

**TradingRuleService** (`/home/user/webapp/src/services/tradingRuleService.ts`)

**查询方法：**
- `getAllRules()` - 获取所有币种规则
- `getRuleBySymbol(symbol)` - 获取单个币种规则
- `isTradingAllowed(symbol)` - 检查是否允许交易
- `isLongAllowed(symbol)` - 检查是否允许做多
- `isShortAllowed(symbol)` - 检查是否允许做空
- `getTradingStats()` - 获取统计信息

**更新方法：**
- `updateRule(update)` - 更新单个规则
- `batchUpdateRules(updates)` - 批量更新规则

**快速设置方法：**
- `resetAllRules()` - 重置所有规则（允许所有交易）
- `disableAllTrading()` - 禁止所有交易
- `setLongOnly()` - 仅允许做多
- `setShortOnly()` - 仅允许做空

### API接口

**基础CRUD：**
- `GET /api/trading-rules` - 获取所有规则
- `GET /api/trading-rules/:symbol` - 获取单个规则
- `PUT /api/trading-rules/:symbol` - 更新单个规则
- `POST /api/trading-rules/batch` - 批量更新规则

**统计与快速设置：**
- `GET /api/trading-rules/stats` - 获取统计信息
- `POST /api/trading-rules/reset` - 重置所有规则
- `POST /api/trading-rules/disable-all` - 禁止所有交易
- `POST /api/trading-rules/long-only` - 仅允许做多
- `POST /api/trading-rules/short-only` - 仅允许做空

### 前端界面

**页面位置：** 特征库页面（`/pattern.html`）第三个标签页

**布局结构：**
1. **统计卡片**（5个指标）
   - 币种总数
   - 允许交易
   - 允许做多
   - 允许做空
   - 禁止交易

2. **批量快速设置按钮**（4个操作）
   - 重置全部（绿色）
   - 禁止所有交易（红色）
   - 仅允许做多（蓝色）
   - 仅允许做空（橙色）
   - 保存所有更改（紫色）

3. **交易规则表格**（29行，6列）
   - 币种名称
   - 允许交易（开关）
   - 允许做多（开关）
   - 允许做空（开关）
   - 备注（可编辑文本框）
   - 操作（单独保存按钮）

**交互功能：**
- 实时开关切换（不立即保存）
- 修改追踪（变更标记）
- 单个规则保存
- 批量保存所有修改
- 快速设置一键应用
- 保存后自动刷新统计

**实现文件：**
- 数据库迁移: `/home/user/webapp/migrations/0018_trading_rules.sql`
- 后端服务: `/home/user/webapp/src/services/tradingRuleService.ts`
- API路由: `/home/user/webapp/src/index.tsx`（添加导入和9个API端点）
- 前端HTML: `/home/user/webapp/public/pattern.html`（新增标签页和UI）
- 前端JS: `/home/user/webapp/public/static/pattern.js`（已包含完整交互逻辑）

**访问方式：**
1. 访问 `/pattern.html` 特征库页面
2. 点击顶部导航的"交易规则"标签
3. 查看和管理29个币种的交易权限

**实现日期：** 2025-10-28 20:50

---

## K线图表优化（2025-10-28 新增 ✅ 已实现）

### 表格列顺序调整

**用户需求：** "带宽放在通道状态的旁边 调整一下"

**调整前顺序：**
```
... → BOLL_MB → BOLL_UB → BOLL_LB → 带宽 → 占比下跌 → 占比上涨 → 通道状态
```

**调整后顺序：**
```
... → BOLL_MB → BOLL_UB → BOLL_LB → 占比下跌 → 占比上涨 → 通道状态 → 带宽
```

**调整理由：**
- "带宽"和"通道状态"都是基于布林带计算的指标
- 将两者相邻放置，便于对比分析
- "通道状态"在中间，"带宽"在最后

**修改文件：**
- `/home/user/webapp/public/kline.html` - 表头列顺序
- `/home/user/webapp/public/static/kline.js` - 表格渲染列顺序（第383-416行）

### K线图表涨幅显示

**用户需求：** "图上表上涨幅的百分比"

**实现方式1：Y轴标签显示涨幅**
- Y轴（价格轴）每个刻度标签格式：`$价格 (涨幅%)`
- 示例：`$103.45 (+2.5%)` 或 `$98.20 (-1.8%)`
- 涨幅基准：图表中第一个K线的收盘价
- 自动计算相对涨幅并显示在价格旁边

**实现方式2：Tooltip悬停显示涨幅**
- 鼠标悬停在图表任意数据点时
- Tooltip额外显示：`涨幅: +X.XX%` 或 `涨幅: -X.XX%`
- 提供更详细的涨幅信息

**计算逻辑：**
```javascript
// 基准价格：图表中第一个K线的收盘价
const firstPrice = prices[0];

// 每个点的涨幅
const changes = prices.map(price => {
  return ((price - firstPrice) / firstPrice * 100);
});

// Y轴标签格式化
ticks: {
  callback: function(value) {
    const change = ((value - firstPrice) / firstPrice * 100);
    const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    return `$${value.toFixed(2)} (${changeText})`;
  }
}

// Tooltip额外信息
tooltip: {
  callbacks: {
    afterLabel: function(context) {
      const change = changes[context.dataIndex];
      const changeText = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
      return `涨幅: ${changeText}`;
    }
  }
}
```

**显示效果：**
- 涨幅为正：显示绿色，格式 `+2.50%`
- 涨幅为负：显示红色，格式 `-1.80%`
- 涨幅为零：显示灰色，格式 `0.00%`

**修改文件：**
- `/home/user/webapp/public/static/kline.js` - renderChart函数（第198-286行）

**实现日期：** 2025-10-28 21:10

---

## 版本历史

### v1.7 - 2025-10-28 21:10
- ✅ K线表格列顺序调整："带宽"移到"通道状态"旁边
- ✅ K线图表Y轴标签显示涨幅百分比
- ✅ K线图表Tooltip悬停显示涨幅百分比
- ✅ 涨幅计算基于图表第一个K线价格

### v1.6 - 2025-10-28 20:50
- ✅ 交易规则系统上线（trading_rules表）
- ✅ 三级权限控制（交易/做多/做空）
- ✅ TradingRuleService服务（11个核心方法）
- ✅ 9个API接口（CRUD + 统计 + 快速设置）
- ✅ 特征库页面新增"交易规则"标签页
- ✅ 完整的前端交互界面（统计卡片 + 快速设置 + 规则表格）
- ✅ 自动初始化29个币种默认规则

### v1.5 - 2025-10-28 17:00
- ✅ 买卖点信号系统新增：5分钟K线去重规则
- ✅ 买卖点信号系统新增：时间范围限制（本小时+上小时最后10分钟）
- ✅ 买卖点信号系统新增：已发送标注防重复
- ✅ 买卖点信号系统新增：手动配置信号发送类型
- ✅ 创建signal_send_config表和signal_send_log表
- ✅ trading_signals表新增kline_time字段
- ✅ 新增信号配置管理API接口

### v1.4 - 2025-10-28 16:30
- ✅ K线查询页面新增两列：下降通道+下跌衰竭占比、上升通道+上升衰竭占比
- ✅ 确认通道状态完整列表（7种状态）
- ✅ 实现40根K线滚动窗口统计逻辑
- ✅ 后端API添加占比计算
- ✅ 前端页面显示新列
- ✅ 颜色标注规则（>50%高亮）

### v1.3 - 2025-10-28 16:00
- 添加买卖点信号生成调度器记录
- 解决信号系统无信号问题
- 新增1分钟频率自动信号生成
- 系统调度器增至4个

### v1.2 - 2025-10-28 15:45
- 记录清零今天的极值记录操作
- 详细说明操作命令和影响范围

### v1.1 - 2025-10-28 15:40
- 添加极值数据基准重置记录
- 记录29个币种的新基准数据
- 添加操作记录章节

### v1.0 - 2025-10-28
- 初始版本
- 记录比价页面三栏布局业务逻辑
- 记录极值触发与统计规则
- 记录时间处理规则（北京时间）

---

## 更新说明
本文档由用户需求驱动更新，每次用户提出新的业务逻辑时，必须更新此文档。

**更新流程：**
1. 用户提出新需求或澄清逻辑
2. 立即更新本文档
3. 提交git记录更新内容
4. 按照文档实现功能

**文档位置：** `/home/user/webapp/BUSINESS_LOGIC.md`
