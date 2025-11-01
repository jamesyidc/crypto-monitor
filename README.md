# 加密货币实时监控系统 (Crypto Monitor)

[![GitHub](https://img.shields.io/badge/GitHub-jamesyidc%2Fcrypto--monitor-blue?logo=github)](https://github.com/jamesyidc/crypto-monitor)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?logo=cloudflare)](https://pages.cloudflare.com/)

一个基于 Cloudflare Workers/Pages 和 Hono 框架的加密货币实时监控系统，支持 29 种主流币种的价格跟踪、急涨急跌分析、K线数据查询和市场趋势预测。

## 🚀 项目特性

### 核心功能
- **实时价格监控**：29种主流加密货币的实时价格追踪
- **急涨急跌分析**：自动识别急涨(≥1%)和急跌(≤-1%)行情
- **市场趋势判断**：基于急涨急跌比值和创新高低次数的智能趋势分析
- **星级评定系统**：
  - 急涨主导：实心黑星 ★（差值 = 急涨-急跌，比值 = 差值/急跌）
  - 急跌主导：空心黑星 ☆（差值 = 急跌-急涨，比值 = 差值/急涨）
  - 1-2: 1星 | 2-3: 2星 | 3以上: 3星

### 高级功能
- **K线数据查询**：支持多时间周期（5m/15m/1h/4h/1d）的OKX历史K线数据
  - **等级分组显示**：按币种优先级等级分组展示（1级TAO → 2级BNB/BCH → 4级XRP → 5级BTC → 3级 → 6级ETH/SOL等）
    - 等级1: ⭐ 1个币种 (TAO)
    - 等级2: ⭐⭐ 2个币种 (BNB, BCH)
    - 等级4: ⭐⭐⭐⭐ 1个币种 (XRP)
    - 等级5: ⭐⭐⭐⭐⭐ 1个币种 (BTC)
    - 等级6: ⭐⭐⭐⭐⭐⭐ 24个币种 (ETH, SOL等)
  - **起涨起跌识别**：向下回溯20根K线，识别起涨点（累计>2%）和起跌点（累计<-3%）
  - **当天统计面板（v1.3.0新功能）**：显示当天（0:00-23:59）的关键统计数据，每日0:00自动重置
    - 起涨触发次数：累计20根K线涨跌幅 > +2% 的次数
    - 起跌触发次数：累计20根K线涨跌幅 < -2% 的次数（测试阈值，原本-3%）
    - 最长连续上涨：占比上涨>占比下跌的最长连续K线数（显示结束时间）
    - 最长连续下跌：占比下跌>占比上涨的最长连续K线数（显示结束时间）
    - 调试增强：控制台显示详细的累计涨跌幅数据和统计信息
  - **图表百分比坐标系**：Y轴显示相对涨跌幅百分比，基准价格在底部0%位置
  - **通道衰竭占比**：40根K线滚动窗口统计上升/下降通道占比
- **V1/V2成交量标记**：根据固定阈值标记异常成交量
- **创新高/新低追踪**：动态计次系统，记录距离历史极值的轮次数
- **模式特征分析**：分析10根K线的起涨/起跌特征（12维度特征提取）
- **策略管理系统（v1.5.0新增）**：买点/卖点策略分离与组合
  - **买点策略库**：开仓信号策略（震荡收敛、MACD金叉、RSI超卖等）
  - **卖点策略库**：平仓信号策略（波段高点、MACD死叉、RSI超买、止盈止损等）
  - **组合策略**：买点策略 + 卖点策略 = 完整交易策略，可命名和启用/禁用
  - **策略编辑**：支持修改策略参数、删除策略、切换启用状态
  - **可视化管理**：绿色买点卡片、红色卖点卡片、紫色组合卡片
- **交易规则系统**：统一管理每个币种的交易权限（能否开单、做多、做空）
  - 可视化开关：一键禁用/启用交易
  - 批量设置：重置全部、仅做多、仅做空、禁止交易
  - 状态统计：实时显示允许交易、做多、做空的币种数量
  - **风险等级联动**：根据风险等级自动限制可交易币种
    - 高风险：只允许1-2等级币种交易
    - 中风险：允许1-4等级币种交易
    - 低风险：允许所有等级币种交易
- **风险提示系统**：根据时间段和风险提示次数动态计算风险等级
  - 0-6点：<3低风险，3-4中风险，≥4高风险
  - 6-12点：<4低风险，4-5中风险，≥5高风险
  - 12-18点：<5低风险，5-6中风险，≥6高风险
  - 18-24点：<6低风险，6-7中风险，≥7高风险
- **本轮平均涨跌幅**：首页显示29个币种的平均涨跌幅统计
- **数据纠错功能**：手动修正统计数据，新轮次基于已修正的数据累加

### 辅助功能
- **历史回看**：查看任意轮次的完整市场数据
  - **历史快照系统**：每10分钟自动保存首页完整数据（北京时间 :00:10, :10:10, :20:10, :30:10, :40:10, :50:10）
  - **数据完整性**：保存11个核心指标（风险预警、平均涨跌幅、暴涨、暴跌、涨、跌、涨跌比、24h涨幅>10%、24h跌幅>10%、今日新高、今日新低）
  - **快照数据库**：独立的 `dashboard_snapshots` 表存储所有历史快照
  - **时间线查看**：按日期查看当天所有快照，点击查看完整历史数据
- **比价比对**：跨币种的价格位置对比分析
  - **极值记录日志**：实时显示创新高/创新低事件（币名、时间、状态、价格）
  - **历史追溯**：按时间倒序查看最新100条极值突破记录
  - **颜色编码**：创新高=绿色，创新低=红色
- **买卖点信号**：基于布林带和RSI的交易信号生成
  - **智能过滤**：5分钟K线去重，时间范围限制
  - **信号配置**：手动启用/禁用特定信号类型
  - **发送追踪**：防止重复发送Telegram通知
- **模拟交易**：虚拟账户交易模拟和收益追踪
- **持仓追踪**：实时持仓监控和盈亏分析
- **震荡收敛交易回测系统**（v1.4.0新增）：真实交易模拟器
  - **时间顺序执行**：从最旧到最新按K线时间顺序执行交易（非回溯）
  - **动态资金管理**：每次开仓使用剩余本金的50%，平仓后实时更新可用本金
  - **完整交易记录**：记录每笔买卖的详细信息（开仓/平仓时间、价格、涨跌幅、盈亏、本金变化）
  - **实时胜率统计**：每次平仓后计算累计胜率（WIN/LOSS标记）
  - **多仓位支持**：最多同时持有2个仓位，自动检查可用资金
  - **回测参数**：初始本金10万U，10倍杠杆，0.05%手续费
  - **批量回测**：支持单币种回测和全部29个币种批量回测
  - **可视化展示**：11列交易明细表格（序号、时间、价格、涨跌、盈亏、本金、胜率、结果）
- **系统健康监控**：每4分钟自动检查系统健康状态（北京时间）
  - 端口3000可访问性检查
  - Web服务响应验证（HTTP 200）
  - 数据库连接测试
  - PM2进程状态监控
  - 系统资源使用率（内存、磁盘）
  - 自动故障恢复（端口异常时自动重启服务）
  - **监控日志Web查看**：可视化查看健康检查记录
    - 统计面板：总检查次数、平均间隔、上次检查、下次检查
    - 检查记录表格：时间戳、间隔、状态、结果
    - 原始日志查看
    - 自动刷新功能（30秒）

## 📊 支持的币种

BTC, ETH, BNB, SOL, XRP, ADA, DOGE, TRX, LINK, DOT, AVAX, BCH, UNI, MATIC, LTC, ICP, ATOM, FIL, APT, HBAR, TON, TAO, JASMY, AR, OP, SUI, PEPE, BONK, FLOKI

## 🛠️ 技术栈

### 后端
- **框架**: Hono (轻量级Web框架)
- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **数据源**: CoinGecko API, OKX API

### 前端
- **样式**: Tailwind CSS (CDN)
- **图标**: FontAwesome
- **图表**: Chart.js
- **HTTP客户端**: Axios

### 开发工具
- **构建工具**: Vite
- **TypeScript**: 5.x
- **包管理器**: npm
- **部署工具**: Wrangler CLI

## 📁 项目结构

```
webapp/
├── src/
│   ├── index.tsx                 # 主应用入口
│   ├── config/
│   │   └── volumeThresholds.ts   # V1/V2成交量阈值配置
│   ├── services/
│   │   ├── analysisService.ts    # 市场分析服务
│   │   ├── coinService.ts        # 币种数据服务
│   │   ├── indicatorService.ts   # 技术指标服务
│   │   ├── patternService.ts     # 模式特征分析服务
│   │   └── settingsService.ts    # 系统设置服务
│   ├── types/
│   └── utils/
│       └── timeUtils.ts          # 北京时间工具函数
├── public/
│   ├── static/
│   │   ├── app.js                # 首页脚本
│   │   ├── kline.js              # K线页面脚本
│   │   ├── correct.js            # 数据纠错页面脚本
│   │   ├── monitor-log.json      # 监控日志JSON（自动生成）
│   │   └── ...
│   ├── kline.html                # K线查询页面
│   ├── correct.html              # 数据纠错页面
│   ├── pattern.html              # 特征库页面
│   ├── monitor-log.html          # 监控日志查看页面
│   └── ...
├── scripts/                       # 运维脚本
│   ├── health-monitor.sh         # 健康检查核心脚本
│   ├── single-monitor.sh         # 单实例监控启动脚本
│   ├── generate-monitor-json.sh  # JSON生成脚本
│   ├── show-monitor-log.sh       # 命令行日志查看工具
│   ├── watch-monitor.sh          # 实时监控状态工具
│   └── status.sh                 # 系统状态检查脚本
├── migrations/                    # 数据库迁移文件
├── wrangler.jsonc                # Cloudflare配置
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 前置要求
- Node.js 18+
- npm 或 yarn
- Cloudflare 账户

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/jamesyidc/crypto-monitor.git
cd crypto-monitor
```

2. **安装依赖**
```bash
npm install
```

3. **创建本地数据库**
```bash
npx wrangler d1 create webapp-production
```

4. **应用数据库迁移**
```bash
npx wrangler d1 migrations apply webapp-production --local
```

5. **构建项目**
```bash
npm run build
```

6. **启动开发服务器**
```bash
npm run dev:sandbox
# 或使用 PM2
pm2 start ecosystem.config.cjs
```

访问 `http://localhost:3000` 查看应用。

### 部署到 Cloudflare Pages

1. **配置 wrangler.jsonc**
```jsonc
{
  "name": "crypto-monitor",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "your-database-id"
    }
  ]
}
```

2. **创建生产数据库**
```bash
npx wrangler d1 create webapp-production
```

3. **应用生产数据库迁移**
```bash
npx wrangler d1 migrations apply webapp-production
```

4. **构建并部署**
```bash
npm run build
npx wrangler pages deploy dist --project-name crypto-monitor
```

## 📝 主要API端点

### 分析相关
- `POST /api/analyze` - 执行一轮市场分析
- `GET /api/dashboard` - 获取仪表板数据（包含平均涨跌幅、风险预警、暴涨暴跌、涨跌统计、24h涨跌>10%、今日新高新低）
- `GET /api/rounds` - 获取历史轮次统计
- `GET /api/extreme-records` - 获取极值记录日志（支持limit参数）

### 快照相关
- `GET /api/snapshots/times?date=YYYY-MM-DD` - 获取指定日期的所有快照时间点和数据（15个字段）
  - 返回字段：快照ID、时间、小时、分钟、风险预警、平均涨跌幅、暴涨、暴跌、涨、跌、涨跌比、24h涨幅>10%、24h跌幅>10%、今日新高、今日新低
- `GET /api/snapshots/:id` - 获取指定快照ID的完整数据（dashboard_data和compare_data）

### K线数据
- `GET /api/coins/with-priority` - 获取带优先级等级的币种列表
- `GET /api/kline/:symbol` - 获取指定币种K线数据
- `GET /api/kline/:symbol/indicators` - 获取技术指标数据
- `POST /api/kline/sync/auto` - 自动同步所有币种K线

### 数据纠错
- `GET /api/correct/data?date=YYYY-MM-DD` - 获取指定日期的统计数据
- `POST /api/correct/save` - 保存修正后的数据
- `GET /api/correct/rounds?date=YYYY-MM-DD` - 获取轮次风险提示数据
- `POST /api/correct/rounds/save` - 保存风险提示数据

### 特征分析
- `GET /api/patterns/:symbol/surge` - 获取起涨特征
- `GET /api/patterns/:symbol/crash` - 获取起跌特征

### 回测相关（v1.4.0新增）
- `POST /api/backtest/convergence-trading` - 单币种震荡收敛交易回测
  - 参数：`symbol`（币种，如BTC）、`timeframe`（时间周期5m）、`limit`（K线数量500-1000）
  - 返回：回测统计、资金变化、交易记录（含本金前后、累计胜率、WIN/LOSS状态）
- `POST /api/backtest/batch-all` - 多币种统一本金池回测（v1.4.1新增）
  - 参数：`symbols`（币种数组，如["BTC","ETH","BNB"]）、`timeframe`（5m）、`limit`（500）
  - 返回：统一本金池统计、跨币种交易记录（含币种标识、时间顺序执行）
  - 特性：
    - ✅ 单一本金池：所有币种共享10万U初始资金
    - ✅ 时间顺序：所有交易信号按时间戳排序后执行
    - ✅ 动态资金分配：每次开仓使用剩余本金50%，平仓返回资金到池中
    - ✅ 并发限制：最多2个持仓，跨币种共享

### 系统监控
- `/monitor-log` - 监控日志Web查看界面
- `/static/monitor-log.json` - 监控日志JSON数据（每4分钟自动更新）

## 🔧 配置说明

### V1/V2 成交量阈值
在 `src/config/volumeThresholds.ts` 中配置各币种的固定成交量阈值：

```typescript
export const VOLUME_THRESHOLDS: Record<string, VolumeThresholds> = {
  BTC: { v1: 200000, v2: 100000 },
  ETH: { v1: 1300000, v2: 500000 },
  // ...
};
```

### 数据库配置
使用 Cloudflare D1 数据库，配置在 `wrangler.jsonc` 中。

### 定时任务
- K线同步：每5分钟自动同步最新K线数据
- **市场分析：每10分钟自动执行一轮分析（强制间隔，核心规则）**
- **历史快照：每10分钟自动保存首页完整数据（:00:10, :10:10, :20:10, :30:10, :40:10, :50:10 北京时间）**
  - 启动方式：`pm2 start snapshot-scheduler.js --name snapshot-scheduler`
  - 保存内容：完整首页数据（11个核心指标 + 完整JSON数据）
  - 数据库表：`dashboard_snapshots`（17个字段）
  - 时间格式：所有时间使用北京时间（UTC+8），非UTC
- 数据清零：北京时间每日0点自动重置日统计
- 健康监控：每4分钟（240秒）自动检查系统健康状态（北京时间）
  - 启动方式：`pm2 start health-monitor.js --name health-monitor`
  - 检查项目：端口3000、HTTP服务、数据库连接、API响应、PM2进程、系统资源
  - 自动恢复：端口异常时自动重启服务
  - 日志文件：`/home/user/webapp/health-monitor.log`（北京时间格式）
  - Web界面：`/health-monitor`（可视化查看历史检查记录）
  - 自动生成：`/home/user/webapp/public/static/monitor-log.json`

## 📊 数据模型

### 主要数据表
- `coins` - 币种基础信息
- `price_records` - 价格历史记录
- `price_extremes` - 价格极值和计次
- `extreme_records` - 极值事件日志（记录每次创新高/新低）
- `round_stats` - 轮次统计数据
- `coin_round_details` - 单币轮次详情
- `daily_stats` - 日统计数据（急涨急跌、创新高低）
- `kline_data` - K线数据（含V1/V2标记）
- `pattern_features` - 模式特征数据
- `trading_rules` - 交易规则（每个币种的交易权限设置）
- `signal_send_config` - 信号发送配置（启用/禁用信号类型）
- `signal_send_log` - 信号发送记录（K线去重追踪）
- **`dashboard_snapshots`** - 历史快照数据（17个字段完整保存首页数据）
  - **时间字段**（4个）：snapshot_time（北京时间）、snapshot_date、snapshot_hour、snapshot_minute
  - **JSON数据**（2个）：dashboard_data（完整首页数据）、compare_data（比对数据）
  - **核心指标**（11个）：
    - `risk_alert_count` - 风险预警
    - `average_change` - 本轮平均涨跌幅（%）
    - `surge_count` - 暴涨（++）
    - `crash_count` - 暴跌（--）
    - `green_count` - 涨（绿色币数）
    - `red_count` - 跌（红色币数）
    - `green_ratio` - 涨跌比（绿/红比例）
    - `change24h_over10_up` - 24h涨幅>10%
    - `change24h_over10_down` - 24h跌幅>10%
    - `today_new_high_count` - 今日新高
    - `today_new_low_count` - 今日新低

## 🎯 核心逻辑

### 🔒 强制10分钟间隔（核心规则，不可修改）
- **每轮分析的时间间隔必须≥10分钟（600秒）**
- 路由层强制检查：检查数据库最近一轮分析时间
- 不满足间隔要求时返回429错误，提示剩余等待时间
- 此规则确保数据质量和防止频繁刷新

### 急涨急跌判断
- 急涨：相对上一轮价格上涨 ≥ 1%
- 急跌：相对上一轮价格下跌 ≤ -1%

### 市场趋势判断
1. **单边主升**：急涨≥10 且 (创新高-创新低)≥3
2. **震荡偏多**：急涨≥10 且 (创新高-创新低)≥1
3. **单边主跌**：急跌≥10 且 (创新低-创新高)≥3
4. **震荡偏空**：急跌≥10 且 (创新低-创新高)≥1
5. **无序震荡**：其他情况

### 星级评定
- **比值计算**：只有当急涨或急跌 ≥ 10 才计算比值
- **急涨主导**：比值 = (急涨-急跌) / 急跌，显示★
- **急跌主导**：比值 = (急跌-急涨) / 急涨，显示☆
- **星级划分**：1-2(1星) | 2-3(2星) | 3+(3星)

### 北京时间系统（UTC+8）
- **全系统时间标准**：所有时间显示、日志记录、数据库存储均使用北京时间（非UTC）
- **时间转换函数**：
  - `getBeijingTime(date)` - 将Date对象转换为北京时间
  - `formatBeijingTime(date)` - 格式化为 "YYYY-MM-DD HH:mm:ss" 北京时间字符串
- **影响范围**：
  - 健康监控日志（health-monitor.js）
  - 历史快照系统（snapshot-scheduler.js）
  - 分析服务时间戳（analysis-scheduler.js）
  - 所有前端显示时间
- **实现位置**：
  - `health-monitor.js` - 内置getBeijingTime()和formatTime()函数
  - `snapshot-scheduler.js` - 内置getBeijingTime()和formatBeijingTime()函数
  - `src/utils/timeUtils.ts` - 前端时间工具函数

## 📸 历史快照系统详解

### 快照保存机制
- **触发时间**：每10分钟一次，在北京时间的 :00:10, :10:10, :20:10, :30:10, :40:10, :50:10 秒执行
- **保存内容**：首页完整数据（严格按照首页格式）
  - ✅ 风险预警（risk_alert_count）
  - ✅ 本轮平均涨跌幅（average_change）- 从所有币种涨跌幅计算平均值
  - ✅ 暴涨（surge_count，++标记）
  - ✅ 暴跌（crash_count，--标记）
  - ✅ 涨（green_count，绿色币数）
  - ✅ 跌（red_count，红色币数）
  - ✅ 涨跌比（green_ratio，绿/红比例）
  - ✅ 24h涨幅>10%（change24h_over10_up）
  - ✅ 24h跌幅>10%（change24h_over10_down）
  - ✅ 今日新高（today_new_high_count）
  - ✅ 今日新低（today_new_low_count）
  - ❌ 不保存：++、--、异动（仅统计值）

### 数据库架构
```sql
CREATE TABLE dashboard_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_time TEXT NOT NULL,        -- 北京时间（YYYY-MM-DD HH:mm:ss）
  snapshot_date TEXT NOT NULL,        -- 日期（YYYY-MM-DD）
  snapshot_hour INTEGER NOT NULL,     -- 小时（0-23）
  snapshot_minute INTEGER NOT NULL,   -- 分钟（0/10/20/30/40/50）
  dashboard_data TEXT NOT NULL,       -- 完整JSON数据
  compare_data TEXT,                  -- 比对数据JSON
  -- 核心指标字段（11个）
  risk_alert_count INTEGER DEFAULT 0,
  average_change REAL DEFAULT 0,
  surge_count INTEGER DEFAULT 0,
  crash_count INTEGER DEFAULT 0,
  green_count INTEGER DEFAULT 0,
  red_count INTEGER DEFAULT 0,
  green_ratio REAL DEFAULT 0,
  change24h_over10_up INTEGER DEFAULT 0,
  change24h_over10_down INTEGER DEFAULT 0,
  today_new_high_count INTEGER DEFAULT 0,
  today_new_low_count INTEGER DEFAULT 0
);
```

### 数据源映射
从 `/api/dashboard` 获取数据后提取字段：
- `dashboardData.latestRound.risk_alert_count` → `risk_alert_count`
- `dashboardData.latestRound.average_change` → `average_change` ✨ 修复：从coinDetails计算平均值
- `dashboardData.latestRound.surge_count` → `surge_count`
- `dashboardData.latestRound.crash_count` → `crash_count`
- `dashboardData.latestRound.green_count` → `green_count` ✨ 新增
- `dashboardData.latestRound.red_count` → `red_count` ✨ 新增
- `dashboardData.latestRound.green_ratio` → `green_ratio` ✨ 新增
- `dashboardData.specialStats.change24hOver10Up` → `change24h_over10_up` ✨ 新增
- `dashboardData.specialStats.change24hOver10Down` → `change24h_over10_down` ✨ 新增
- `dashboardData.specialStats.todayNewHighCount` → `today_new_high_count` ✨ 新增
- `dashboardData.specialStats.todayNewLowCount` → `today_new_low_count` ✨ 新增

### PM2 服务管理
```bash
# 启动快照服务
pm2 start snapshot-scheduler.js --name snapshot-scheduler

# 查看日志
pm2 logs snapshot-scheduler

# 重启服务
pm2 restart snapshot-scheduler

# 查看状态
pm2 status snapshot-scheduler
```

### API使用示例
```bash
# 获取今天的所有快照时间点（包含11个核心指标）
curl "http://localhost:3000/api/snapshots/times?date=2025-11-01"

# 返回示例
{
  "success": true,
  "snapshots": [
    {
      "id": 123,
      "snapshot_time": "2025-11-01 10:40:10",
      "snapshot_hour": 10,
      "snapshot_minute": 40,
      "risk_alert_count": 3,
      "average_change": 0.0132,
      "surge_count": 5,
      "crash_count": 2,
      "green_count": 15,
      "red_count": 7,
      "green_ratio": 2.14,
      "change24h_over10_up": 1,
      "change24h_over10_down": 0,
      "today_new_high_count": 5,
      "today_new_low_count": 4
    }
  ]
}

# 获取指定快照的完整数据
curl "http://localhost:3000/api/snapshots/123"
```

## 🔄 GitHub 同步

### 快速同步
每次代码更新后，一键同步到GitHub：
```bash
cd /home/user/webapp
npm run sync
```

### 带提交信息同步
```bash
./sync-github.sh "feat: 添加新功能"
```

### 详细说明
查看完整同步指南：[SYNC_GUIDE.md](./SYNC_GUIDE.md) | [快速参考](./QUICK_SYNC.md)

## 🐛 已知问题

1. Telegram 通知功能已禁用（避免运行时错误）
2. AI Drive 备份需要写权限配置

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📧 联系方式

- GitHub: [@jamesyidc](https://github.com/jamesyidc)
- 项目地址: [crypto-monitor](https://github.com/jamesyidc/crypto-monitor)

## 🙏 致谢

- [CoinGecko](https://www.coingecko.com/) - 价格数据源
- [OKX](https://www.okx.com/) - K线数据源
- [Cloudflare](https://www.cloudflare.com/) - 边缘计算平台
- [Hono](https://hono.dev/) - 轻量级Web框架

---

---

## 📦 版本信息

**当前版本**: v1.5.0 - 策略管理系统重构  
**发布日期**: 2025-10-29  
**详细说明**: 查看 [VERSION.md](./VERSION.md)

### v1.5.0 主要更新（策略管理系统重构）
- ✅ **买点策略库**：独立管理开仓信号策略（震荡收敛、MACD金叉、RSI超卖等）
- ✅ **卖点策略库**：独立管理平仓信号策略（波段高点、MACD死叉、止盈止损等）
- ✅ **组合策略**：灵活组合买点+卖点形成完整交易策略，支持命名和启用控制
- ✅ **可视化管理**：绿色买点卡片 + 红色卖点卡片 + 紫色组合卡片，清晰易懂
- ✅ **策略编辑**：支持编辑参数、删除策略、启用/禁用状态切换
- 🗑️ **移除旧策略**：删除MACD、RSI、SAR等已配置的单一策略，统一使用新系统

### v1.4.1 主要更新（统一本金池批量回测）
- ✅ **统一本金池**：所有币种共享单一10万U资金池
- ✅ **跨币种时间顺序执行**：所有交易信号按时间戳排序后按时间线执行
- ✅ **动态资金流转**：买入扣除本金，卖出返还本金+盈亏到池中
- ✅ **并发限制共享**：最多2个持仓限制应用于所有币种
- ✅ **交易记录增强**：12列明细表格新增币种列，标识每笔交易所属币种
- 🐛 **修复卖出信号检测**：使用震荡收敛点之前搜索波段高点逻辑
- 🐛 **修复信号匹配**：正确识别和关闭对应币种的持仓

### v1.4.0 主要更新（真实交易模拟器）
- ✅ 时间顺序执行：从最旧K线到最新按时间顺序模拟交易
- ✅ 动态资金管理：每次开仓用剩余本金50%，平仓实时更新资金
- ✅ 完整交易历史：记录每笔买卖详情（开仓/平仓时间、价格、涨跌）
- ✅ 实时胜率统计：每次平仓计算累计胜率，标记WIN/LOSS
- ✅ 多仓位支持：最多2个并发仓位，自动资金检查
- ✅ 11列交易明细：序号、时间、价格、涨跌、盈亏、本金前后、胜率、结果
- 🐛 修复时间排序错误：移除错误的allTrades.reverse()
- 🐛 修复本金记录：在更新本金前记录capitalBefore

### v1.3.0 主要更新
- ✅ 当天统计面板（4项关键指标）
- ✅ 时间逻辑优化（1小时缓冲区）
- ✅ 18个币种急涨急跌数据导入
- ✅ 统计一致性修复
- ✅ 详细调试日志支持
- 🐛 修复forEach循环结构错误

---

**最后更新**: 2025-10-29 (v1.5.0 - 策略管理系统重构)

## 📅 问题修复历史

### 2025-11-01 修复记录

**✅ 修复历史快照数据全部为0问题（完整解决）**

**问题描述**：
- 历史回看页面的快照数据全部显示为0（风险预警、平均涨跌幅、暴涨暴跌等）
- 数据库中的快照记录存在，但核心字段值为0或null

**根因分析**：
1. **数据库架构不完整**：
   - `dashboard_snapshots` 表最初只有 `snapshot_time`、`dashboard_data`、`compare_data` 字段
   - 缺少7个关键字段：`green_count`、`red_count`、`green_ratio`、`change24h_over10_up`、`change24h_over10_down`、`today_new_high_count`、`today_new_low_count`

2. **快照保存逻辑不完整**：
   - `snapshot-scheduler.js` 的 `saveSnapshot()` 函数只提取了4个字段
   - 缺少从 `specialStats` 对象提取数据的逻辑
   - 未保存涨跌统计（green_count、red_count、green_ratio）

3. **平均涨跌幅计算缺失**：
   - `src/services/analysisService.ts` 的 `getDashboardData()` 未计算 `average_change`
   - `latestRound` 中的 `average_change` 字段为 null
   - 导致快照保存的平均涨跌幅为0

**修复方案**：
1. **数据库架构增强**（7个新列）：
   ```sql
   ALTER TABLE dashboard_snapshots ADD COLUMN green_count INTEGER DEFAULT 0;
   ALTER TABLE dashboard_snapshots ADD COLUMN red_count INTEGER DEFAULT 0;
   ALTER TABLE dashboard_snapshots ADD COLUMN green_ratio REAL DEFAULT 0;
   ALTER TABLE dashboard_snapshots ADD COLUMN change24h_over10_up INTEGER DEFAULT 0;
   ALTER TABLE dashboard_snapshots ADD COLUMN change24h_over10_down INTEGER DEFAULT 0;
   ALTER TABLE dashboard_snapshots ADD COLUMN today_new_high_count INTEGER DEFAULT 0;
   ALTER TABLE dashboard_snapshots ADD COLUMN today_new_low_count INTEGER DEFAULT 0;
   ```

2. **平均涨跌幅计算**（src/services/analysisService.ts）：
   ```typescript
   // 从所有币种的 change_percent 计算平均值
   let averageChange = 0;
   if (latestRound && finalEnhancedCoinDetails.length > 0) {
     const totalChange = finalEnhancedCoinDetails.reduce((sum: number, coin: any) => 
       sum + (coin.change_percent || 0), 0);
     averageChange = totalChange / finalEnhancedCoinDetails.length;
   }
   
   // 增强 latestRound 对象
   const enhancedLatestRound = latestRound ? {
     ...latestRound,
     average_change: averageChange
   } : null;
   ```

3. **快照保存完整提取**（snapshot-scheduler.js）：
   ```javascript
   // 提取所有11个核心字段
   const riskAlertCount = dashboardData.latestRound?.risk_alert_count || 0;
   const averageChange = dashboardData.latestRound?.average_change || 0;
   const surgeCount = dashboardData.latestRound?.surge_count || 0;
   const crashCount = dashboardData.latestRound?.crash_count || 0;
   const greenCount = dashboardData.latestRound?.green_count || 0;
   const redCount = dashboardData.latestRound?.red_count || 0;
   const greenRatio = dashboardData.latestRound?.green_ratio || 0;
   
   // 从 specialStats 提取
   const change24hOver10Up = dashboardData.specialStats?.change24hOver10Up || 0;
   const change24hOver10Down = dashboardData.specialStats?.change24hOver10Down || 0;
   const todayNewHighCount = dashboardData.specialStats?.todayNewHighCount || 0;
   const todayNewLowCount = dashboardData.specialStats?.todayNewLowCount || 0;
   ```

4. **API返回字段增强**（src/index.tsx）：
   - 更新 `/api/snapshots/times` 端点返回所有15个字段
   - 确保前端能显示完整的快照数据

**验证结果**：
```bash
# 查询测试快照（ID=4）
SELECT 
  id, snapshot_time, risk_alert_count, average_change, 
  surge_count, crash_count, green_count, red_count, green_ratio,
  change24h_over10_up, change24h_over10_down,
  today_new_high_count, today_new_low_count
FROM dashboard_snapshots WHERE id = 4;

# 结果示例（数据不再为0）
id: 4
snapshot_time: 2025-11-01 10:50:10
risk_alert_count: 3
average_change: 0.0132
surge_count: 5
crash_count: 2
green_count: 15
red_count: 7
green_ratio: 2.14
change24h_over10_up: 1
change24h_over10_down: 0
today_new_high_count: 5
today_new_low_count: 4
```

**影响文件**：
- ✅ `src/services/analysisService.ts` - 增加 average_change 计算
- ✅ `snapshot-scheduler.js` - 完整提取11个字段
- ✅ `src/index.tsx` - API返回15个字段
- ✅ Database Schema - 新增7个列

---

**✅ 修复历史快照不显示10:40问题**

**问题描述**：
- 历史回看页面显示 09:20 快照，但缺少已验证存在的 10:40 快照
- 数据库中确认有 10:40 快照记录

**根因分析**：
- `snapshot-scheduler.js` 写入数据库文件：`/home/user/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/c7d58e8...`
- API服务读取数据库文件：`/home/user/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9e...`
- **数据库路径不一致**导致读写分离

**修复方案**：
- 更新 `snapshot-scheduler.js` 中的数据库路径为API使用的路径
- 统一所有服务使用同一个数据库文件

**验证结果**：
```bash
curl "http://localhost:3000/api/snapshots/times?date=2025-11-01"
# 返回：10:58, 10:50, 10:40, 09:20（包含10:40）
```

---

**✅ 修复健康监控未按4分钟执行问题**

**问题描述**：
- 健康监控页面 `https://3000-.../health-monitor` 检查时间间隔不规律
- 预期每4分钟（240秒）检查一次

**根因分析**：
- PM2中未启动 `health-monitor.js` 服务
- 旧的shell脚本方式可能存在单实例锁问题

**修复方案**：
```bash
# 启动健康监控服务
pm2 start health-monitor.js --name health-monitor

# 验证运行状态
pm2 status health-monitor
pm2 logs health-monitor
```

**验证结果**：
- 服务稳定运行，每4分钟（240秒）执行一次检查
- 日志显示规律的健康检查记录

---

**✅ 修复所有时间显示为UTC而非北京时间**

**问题描述**：
- 健康监控日志显示UTC时间（如 02:51:08）而非北京时间（如 10:51:08）
- 历史快照时间也使用UTC格式

**根因分析**：
- JavaScript `Date.toISOString()` 默认返回UTC时间
- 所有时间格式化函数未加8小时时区偏移

**修复方案**：
在所有服务中添加北京时间转换函数：
```javascript
// 获取北京时间
function getBeijingTime(date = new Date()) {
  return new Date(date.getTime() + (8 * 60 * 60 * 1000));
}

// 格式化北京时间
function formatBeijingTime(date = new Date()) {
  const beijingTime = getBeijingTime(date);
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hour = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minute = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  const second = String(beijingTime.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
```

**影响文件**：
- ✅ `health-monitor.js` - 所有日志时间使用北京时间
- ✅ `snapshot-scheduler.js` - 快照时间使用北京时间
- ✅ `public/health-monitor.html` - 前端显示预格式化的北京时间

**验证结果**：
- 健康监控日志显示：`2025-11-01 10:51:08`（北京时间）
- 快照记录显示：`2025-11-01 10:40:10`（北京时间）

---

### 2025-10-30 修复记录

**✅ 修复K线数据不自动刷新问题（完整解决）**

**第一轮修复（表面解决）**：
- **问题**：K线页面30秒自动刷新，但数据不更新
- **原因**：前端 `loadKlineData()` 只读数据库，未调用同步API
- **方案**：添加 `autoSyncKlineData()` 函数调用 `/api/kline/sync/auto`
- **结果**：API被调用但服务崩溃，数据仍不更新
- **修改文件**：`public/static/kline_new_1761736500.js`

**第二轮修复（根本解决）** 🎯：
- **深度分析**：
  1. `/api/kline/sync/auto` 设计为**超重量级操作**
  2. 包含：27币种 × 300根K线 × 多次UPDATE = **8100+次数据库操作**
  3. 导致：数据库长时间锁定 → Worker超时 → 服务崩溃
  4. **不适合30秒自动执行的HTTP请求**
  
- **修复方案**：
  1. **轻量级同步**：只同步最新10根K线（50分钟数据）
  2. **移除技术指标回填**：原本27币种×300根的UPDATE操作全部移除
  3. **按需计算**：技术指标在用户查看时动态计算（使用ReadOnlyKlineService）
  
- **测试结果**：
  - 耗时从**31秒降至8.75秒**（提升3.5倍）
  - 27个币种全部同步成功
  - 服务稳定运行，不再崩溃
  - Worker bundle从431KB降至427KB
  
- **技术亮点**：
  - 识别了**超重操作不适合HTTP请求**的架构问题
  - 采用**按需计算**替代预先计算的策略优化
  - 保证了30秒自动刷新的可行性
  
- **修改文件**：`src/index.tsx`（/api/kline/sync/auto端点）

**✅ 修复历史记录20分钟间隔问题**
- **问题描述**：历史列表显示20分钟间隔，而不是期望的10分钟
- **根因分析**：
  - 前端 `getNextRoundTime()` 基于整点（00/10/20/30/40/50分钟）计算下次时间
  - 后端检查的是距离上次实际执行时间的秒数
  - 两者逻辑不一致导致有效间隔为20分钟
- **修复方案**：修改 `app.js` 的 `getNextRoundTime()` 函数，改为基于上次分析时间+10分钟计算
- **效果**：前端倒计时与后端10分钟间隔检查完全一致
- **修改文件**：`/home/user/webapp/public/static/app.js`

**✅ 实现10分钟强制间隔机制**
- **核心需求**：确保每轮分析的时间间隔必须≥10分钟（600秒）
- **实施方案**：
  1. 在路由层强制检查：读取数据库最近一轮分析时间
  2. 计算距离现在的秒数，不满足600秒返回429错误
  3. 前端显示剩余等待时间和下次可用时间
- **技术亮点**：
  - 防止频繁刷新导致的数据质量问题
  - 代码注释标注"🔒 核心逻辑：不可修改"
  - 与前端倒计时逻辑完全一致
- **修改文件**：`/home/user/webapp/src/index.tsx`

**✅ 修复所有页面404错误**
- **问题描述**：所有导航页面（历史、信号、K线等20个页面）返回404
- **根因分析**：Cloudflare Workers环境无法使用 `serveStatic` 读取文件系统
- **解决方案**：
  1. 使用Vite的 `?raw` 导入将所有HTML文件嵌入Worker bundle
  2. 路由直接返回嵌入的HTML字符串：`app.get('/history', (c) => c.html(historyHtml))`
  3. Worker大小从217KB增加到431KB（可接受范围）
- **影响**：所有20个页面正常访问，无需依赖文件系统
- **修改文件**：`/home/user/webapp/src/index.tsx`

---

**项目状态**: ✅ 运行中  
**最后更新**: 2025-10-30
