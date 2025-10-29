# 修复首页平均涨跌幅显示问题

## 问题描述
用户报告首页"本轮平均涨跌幅"始终显示 **+0.00%**，但实际数据库中存储的值是 **-2.09%**。

## 问题诊断

### 1. 初步检查
- ✅ API 返回数据正确：`latestRound.average_change = -2.093104268142349`
- ❌ 前端显示错误：显示为 +0.00%

### 2. 代码审查
发现前端代码 `/home/user/webapp/public/static/app.js` 第166-173行存在问题：

**错误代码**：
```javascript
// 计算本轮平均涨跌幅（从currentData.coinDetails获取）
let avgChange = 0;
if (currentData && currentData.coinDetails && currentData.coinDetails.length > 0) {
  const totalChange = currentData.coinDetails.reduce((sum, coin) => {
    return sum + (parseFloat(coin.change_percent) || 0);
  }, 0);
  avgChange = totalChange / currentData.coinDetails.length;
}
```

**问题原因**：
- 前端代码从 `currentData.coinDetails[].change_percent` 重新计算平均值
- 但该字段在当前数据结构中全部为 0
- 导致计算结果始终为 0

### 3. Cloudflare Pages 缓存问题
修改代码后发现服务仍返回旧代码，原因是：
- `wrangler pages dev` 缓存了 `dist/` 目录的构建结果
- 修改源码后需要重新构建才能生效
- 简单的 PM2 重启不会触发重新构建

## 修复方案

### 1. 修改前端代码
将代码改为直接使用后端计算好的值：

```javascript
// 本轮平均涨跌幅（直接从latestRound.average_change获取，这是后端计算的准确值）
let avgChange = latestRound.average_change || 0;

const cards = [
  {
    title: '本轮平均涨跌幅',
    value: (avgChange >= 0 ? '+' : '') + avgChange.toFixed(2) + '%',
    icon: 'fa-chart-line',
    color: avgChange >= 0 ? 'green' : 'red',
    detail: `29个币种平均值`
  },
  // ...
];
```

### 2. 重新构建和部署
```bash
# 清理旧构建（注意：会删除本地数据库）
rm -rf dist .wrangler

# 重新构建
npm run build

# 重新应用数据库迁移
npx wrangler d1 migrations apply webapp-production --local

# 导入数据
npx wrangler d1 execute webapp-production --local --file=./import_exact_data.sql
npx wrangler d1 execute webapp-production --local --file=./restore_extreme_records.sql

# 启动服务
pm2 start ecosystem.config.cjs
```

### 3. 数据导入文件修复
由于 `price_extremes` 表初始为空，需要将 `import_exact_data.sql` 中的 UPDATE 语句改为 INSERT OR REPLACE：

**修改前**：
```sql
UPDATE price_extremes SET all_time_high = 235.51972, all_time_low = 161.28451, high_count = 1643, low_count = 34 WHERE symbol = 'OKB';
```

**修改后**：
```sql
INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, all_time_low, high_count, low_count) VALUES ('OKB', 235.51972, 161.28451, 1643, 34);
```

## 验证结果

### 1. API 测试
```bash
$ curl -s http://localhost:3000/api/dashboard | jq '.latestRound.average_change'
-2.1715564104918306
```

### 2. 前端代码验证
```bash
$ curl -s http://localhost:3000/static/app.js | grep -A 3 "本轮平均涨跌幅"
  // 本轮平均涨跌幅（直接从latestRound.average_change获取，这是后端计算的准确值）
  let avgChange = latestRound.average_change || 0;
  
  const cards = [
    {
      title: '本轮平均涨跌幅',
      value: (avgChange >= 0 ? '+' : '') + avgChange.toFixed(2) + '%',
```

### 3. 公共 URL 访问
- URL: https://3000-ij3odq6k2fvoix4jt5np8-2e77fc33.sandbox.novita.ai/
- API 端点: https://3000-ij3odq6k2fvoix4jt5np8-2e77fc33.sandbox.novita.ai/api/dashboard
- 显示结果：**-2.17%** ✅

## 重要经验教训

### ❌ **错误的修改流程**
```bash
# 错误！这会删除本地数据库
rm -rf dist .wrangler
npm run build
pm2 restart
```

### ✅ **正确的修改流程**
```bash
# 正确！只重新构建，保留数据库
npm run build
pm2 restart crypto-monitor
```

### 🔑 **关键要点**
1. **不要删除 `.wrangler` 目录** - 它包含本地开发数据库
2. **修改静态文件后必须 `npm run build`** - PM2 重启不会触发构建
3. **使用后端计算的值** - 避免前端重复计算导致数据不一致
4. **INSERT OR REPLACE** - 支持空表和已有数据的导入

## 相关文件
- `/home/user/webapp/public/static/app.js` - 前端代码（已修复）
- `/home/user/webapp/import_exact_data.sql` - 数据导入脚本（已修复）
- `/home/user/webapp/restore_extreme_records.sql` - 极值记录恢复脚本

## 提交记录
```
commit 8b9c39d
Date: 2025-10-29 04:13

修复首页平均涨跌幅显示问题
- 修改前端代码直接使用 latestRound.average_change 而不是重新计算
- 将 import_exact_data.sql 中的 UPDATE 改为 INSERT OR REPLACE 以支持空表导入
```

## 状态
- ✅ 问题已修复
- ✅ 代码已提交
- ✅ 服务正常运行
- ✅ 数据显示正确：**-2.17%**
