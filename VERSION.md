# 版本历史 - 加密货币监控系统

## v1.3.0 - 当天统计面板功能 (2025-10-29)

**Git Tag**: `v1.3.0-daily-stats`  
**Commit**: `afb999d`

### 🎯 核心功能

#### 1️⃣ **当天统计面板** (K线页面)
在K线图表下方新增4列实时统计面板，显示当天（0:00-23:59）的交易特征：

**功能详情：**
- **起涨触发次数**
  - 计算规则：20根K线累计涨幅 > +2%
  - 用途：识别短期上涨动能爆发点
  - 背景色：绿色 (`bg-green-100`)

- **起跌触发次数** 🧪 测试阈值
  - 计算规则：20根K线累计跌幅 < -2%（原本-3%，当前测试中）
  - 用途：识别短期下跌压力点
  - 背景色：红色 (`bg-red-100`)

- **最长连续上涨**
  - 计算规则：连续多少根K线满足 `up_channel_exhaustion_ratio` > `down_channel_exhaustion_ratio`
  - 时间显示：显示连续期结束时间（HH:MM格式）
  - 背景色：绿色 (`bg-green-100`)

- **最长连续下跌**
  - 计算规则：连续多少根K线满足 `down_channel_exhaustion_ratio` > `up_channel_exhaustion_ratio`
  - 时间显示：显示连续期结束时间（HH:MM格式）
  - 背景色：红色 (`bg-red-100`)

**技术实现：**
- 前端计算：`calculateDailyStats()` 函数
- 时区处理：使用 `Asia/Shanghai` 时区过滤当天数据
- 最低数据要求：至少20根K线才显示统计面板
- 自动重置：每天0:00数据重置，但统计从1:00开始（避免历史污染）

---

#### 2️⃣ **时间逻辑优化**
- **问题**：极值统计在午夜后（0:11-0:12）会包含昨天的记录
- **解决方案**：后端添加1小时缓冲区，"今天"从北京时间1:00开始
- **影响范围**：
  - `getTimeRangeStats()` 方法（时间范围统计）
  - 创新高/创新低统计
  - 与前端统计保持一致性

**修改文件：**
- `/home/user/webapp/src/services/coinService.ts` (行774-785)

---

#### 3️⃣ **数据导入功能**
导入18个币种的急涨急跌历史数据：

**导入数据：**
```
ETH: 0飙涨, 1暴跌    XRP: 0飙涨, 1暴跌    SOL: 1飙涨, 3暴跌
BNB: 0飙涨, 0暴跌    DOGE: 0飙涨, 2暴跌   ADA: 0飙涨, 5暴跌
TRX: 0飙涨, 0暴跌    AVAX: 0飙涨, 4暴跌   SHIB: 0飙涨, 0暴跌
TON: 0飙涨, 1暴跌    LINK: 1飙涨, 6暴跌   BCH: 1飙涨, 0暴跌
NEAR: 1飙涨, 3暴跌   SUI: 0飙涨, 5暴跌    LTC: 0飙涨, 0暴跌
UNI: 1飙涨, 2暴跌    CRO: 0飙涨, 4暴跌    TAO: 2飙涨, 3暴跌
```

**导入脚本：**
- `/home/user/webapp/import_surge_crash_data.sql`
- 目标表：`daily_stats.total_surges`, `daily_stats.total_crashes`
- 执行方式：`npx wrangler d1 execute webapp-production --local --file=import_surge_crash_data.sql`

---

#### 4️⃣ **统计一致性修复**
- **问题**：首页右上角和多指标融合面板显示的创新高/创新低数量不一致
- **原因**：`daily_stats` 表中有昨天16:11-16:12的旧记录（date字段是今天但实际是昨天数据）
- **解决方案**：清空 `daily_stats` 表中今天的 `new_high_count` 和 `new_low_count`
- **修复脚本**：`/home/user/webapp/fix_daily_stats_extreme_counts.sql`

---

#### 5️⃣ **调试增强**
为方便排查问题，添加详细的前端调试日志：

**控制台输出：**
```javascript
🔍 计算当天统计，目标日期: 2025/10/29
📊 当天数据条数: 68 / 总数: 300

📈 统计结果: { 
  risingTriggers: 1,
  fallingTriggers: 0,
  longestRisingStreak: 60,
  longestRisingEndTime: "2025/10/29 03:45",
  longestFallingStreak: 89,
  longestFallingEndTime: "2025/10/29 09:40"
}

📊 累计涨跌幅详情（共48个数据点）:
   最小值: -2.45%
   最大值: +3.87%
   起涨点(>2%): 1个
   起跌点(<-2%): 0个
   
📉 累计跌幅最大的5个时间点:
   2025/10/29 08:30: -2.45%
   2025/10/29 09:15: -2.12%
   2025/10/29 07:45: -1.89%
   2025/10/29 10:20: -1.54%
   2025/10/29 11:05: -1.23%
```

**调试指南：**
- 文档：`/home/user/webapp/DEBUG_GUIDE.md`
- 包含完整的问题排查流程和常见问题解答

---

### 🐛 Bug修复

#### **修复1：forEach循环结构错误** (afb999d)
- **问题**：连续上涨/下跌逻辑放在了 `forEach` 循环外面，导致变量 `k` 未定义
- **影响**：统计面板无法正常显示
- **修复**：将所有逻辑移到 `forEach` 循环内部

#### **修复2：时间过滤逻辑** (c953202)
- **问题**：午夜后0:11-0:12的记录被算作"今天"
- **修复**：添加1小时缓冲区，从北京时间1:00开始算"今天"

#### **修复3：统计数据不一致** (b9b9654)
- **问题**：两个面板显示不同的创新高/创新低数量
- **修复**：清空 `daily_stats` 中的旧记录

---

### 📂 新增/修改文件

**新增文件：**
- `DEBUG_GUIDE.md` - 调试指南文档
- `import_surge_crash_data.sql` - 18币种数据导入脚本
- `fix_daily_stats_extreme_counts.sql` - 统计一致性修复脚本
- `VERSION.md` - 本文件

**修改文件：**
- `public/kline.html` - 添加当天统计面板HTML结构
- `public/static/kline.js` - 添加 `calculateDailyStats()` 函数和调试日志
- `src/services/coinService.ts` - 修改 `getTimeRangeStats()` 时间逻辑
- `README.md` - 更新功能说明

---

### 🎨 UI变化

**颜色方案：**
- 起涨相关：绿色背景 (`bg-green-100`) + 绿色文字 (`text-green-700`)
- 起跌相关：红色背景 (`bg-red-100`) + 红色文字 (`text-red-700`)

**布局：**
- 4列网格布局 (`grid grid-cols-4 gap-4`)
- 每列包含：标题、说明、数值、时间（可选）

---

### ⚙️ 配置参数

**可调参数：**
```javascript
// 起涨触发阈值
const RISING_THRESHOLD = 2;  // 2%

// 起跌触发阈值（当前测试值）
const FALLING_THRESHOLD = -2;  // -2%（原本-3%）

// 最低数据要求
const MIN_DATA_COUNT = 20;  // 20根K线

// 时区设置
const TIMEZONE = 'Asia/Shanghai';  // 北京时间

// 时间缓冲区（后端）
const TIME_BUFFER = 1 * 60 * 60 * 1000;  // 1小时
```

---

### 📊 数据库变更

**表：`daily_stats`**
- 更新字段：`total_surges`, `total_crashes` (18个币种)
- 清空字段：`new_high_count`, `new_low_count` (2025-10-29)

**无表结构变更。**

---

### 🔧 技术细节

**前端技术栈：**
- Vanilla JavaScript (ES6+)
- Chart.js (K线图表)
- Tailwind CSS (样式)
- Axios (HTTP请求)

**后端技术栈：**
- Hono Framework
- Cloudflare D1 Database (SQLite)
- TypeScript

**关键算法：**
1. **20周期累计涨跌幅**：
   ```javascript
   cumulative = sum(change[i-20...i-1])
   ```

2. **最长连续期追踪**：
   ```javascript
   if (upRatio > downRatio) {
     currentRisingStreak++;
     currentFallingStreak = 0;
   }
   ```

3. **时区转换**（后端）：
   ```typescript
   const beijingOffset = 8 * 60 * 60 * 1000;
   const todayStart = new Date(beijingTodayStart.getTime() + TIME_BUFFER - beijingOffset);
   ```

---

### 🚀 部署说明

**本地开发：**
```bash
npm run build
pm2 restart crypto-monitor
```

**Cloudflare Pages生产部署：**
```bash
npm run build
npx wrangler pages deploy dist --project-name webapp
```

**数据导入（可选）：**
```bash
# 导入18币种数据
npx wrangler d1 execute webapp-production --local --file=import_surge_crash_data.sql

# 修复统计不一致
npx wrangler d1 execute webapp-production --local --file=fix_daily_stats_extreme_counts.sql
```

---

### 📝 使用说明

1. 访问K线页面：`http://localhost:3000/kline`
2. 选择币种和时间周期（建议5分钟）
3. 等待数据加载（自动刷新30秒）
4. 查看当天统计面板（在K线图表下方）
5. 按F12打开控制台查看详细调试信息

---

### ⚠️ 已知问题

1. **起跌触发次数经常为0**
   - 原因：市场波动小，20根累计跌幅未达-2%
   - 解决：这是正常现象，不是bug
   - 验证：查看控制台"最小值"是否 > -2%

2. **统计面板不显示**
   - 原因：当天数据不足20根（例如凌晨1-2点）
   - 解决：等待数据积累或查看其他币种

3. **时间显示为"-"**
   - 原因：最长连续期为0（没有满足条件的数据）
   - 解决：正常现象，等待市场波动

---

### 🔄 回退说明

**如需回退到统计面板之前的版本：**
```bash
cd /home/user/webapp
git reset --hard 71b2a3d
npm run build
pm2 restart crypto-monitor
```

**如需恢复到当前版本：**
```bash
cd /home/user/webapp
git reset --hard v1.3.0-daily-stats
npm run build
pm2 restart crypto-monitor
```

---

### 📞 技术支持

**问题排查：**
1. 查看控制台日志（浏览器F12 → Console）
2. 查看PM2日志：`pm2 logs crypto-monitor --nostream`
3. 参考 `DEBUG_GUIDE.md` 调试指南

**常用命令：**
```bash
# 查看服务状态
pm2 list

# 重启服务
pm2 restart crypto-monitor

# 查看日志
pm2 logs --nostream --lines 50

# 测试API
curl http://localhost:3000/api/coins/with-priority
curl http://localhost:3000/api/kline/BTC/indicators?timeframe=5m&limit=10
```

---

## 🏷️ 之前的版本

### v1.2.0 - 数据手动修改功能恢复 (2025-10-27)
**Commit**: `71b2a3d`

**功能：**
- 重新实现首页数据手动修改功能
- 修复服务崩溃问题
- 添加核心逻辑5、6、7和紧急修复系统

---

### v1.1.0 - K线等级分组 (2025-10-26)
**Commit**: `3d9cb4b`

**功能：**
- 按币种等级（1-6星）分组显示
- K线查询页面UI优化

---

### v1.0.0 - 初始版本 (2025-10-25)
**功能：**
- K线数据查询和展示
- 技术指标计算（SAR、RSI、BOLL）
- 买卖点信号
- 数据同步和调度器
- Cloudflare D1数据库集成

---

**最后更新**: 2025-10-29  
**维护者**: AI Assistant  
**项目名**: webapp (加密货币监控系统)
