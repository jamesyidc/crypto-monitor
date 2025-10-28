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
- **V1/V2成交量标记**：根据固定阈值标记异常成交量
- **创新高/新低追踪**：动态计次系统，记录距离历史极值的轮次数
- **模式特征分析**：分析10根K线的起涨/起跌特征（12维度特征提取）
- **风险提示系统**：当绿盘占比为0时触发风险提示
- **数据纠错功能**：手动修正统计数据，新轮次基于已修正的数据累加

### 辅助功能
- **历史回看**：查看任意轮次的完整市场数据
- **比价比对**：跨币种的价格位置对比分析
- **买卖点信号**：基于布林带和RSI的交易信号生成
- **模拟交易**：虚拟账户交易模拟和收益追踪
- **持仓追踪**：实时持仓监控和盈亏分析

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
│   │   └── ...
│   ├── kline.html                # K线查询页面
│   ├── correct.html              # 数据纠错页面
│   ├── pattern.html              # 特征库页面
│   └── ...
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
- `GET /api/dashboard` - 获取仪表板数据
- `GET /api/rounds` - 获取历史轮次统计

### K线数据
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
- 市场分析：每10分钟自动执行一轮分析
- 数据清零：北京时间每日0点自动重置日统计

## 📊 数据模型

### 主要数据表
- `coins` - 币种基础信息
- `price_records` - 价格历史记录
- `price_extremes` - 价格极值和计次
- `round_stats` - 轮次统计数据
- `coin_round_details` - 单币轮次详情
- `daily_stats` - 日统计数据（急涨急跌、创新高低）
- `kline_data` - K线数据（含V1/V2标记）
- `pattern_features` - 模式特征数据

## 🎯 核心逻辑

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

**最后更新**: 2025-10-28
