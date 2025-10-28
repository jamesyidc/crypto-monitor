# 价格极值数据导入指南

## 📊 数据说明

您提供的数据包含29个加密货币的价格极值信息：

| 字段名 | 说明 | 示例 |
|--------|------|------|
| 币名 | 加密货币符号 | BTC, ETH, DOT |
| 最高价格 | 历史最高价（ATH） | 111935.00 |
| 最高计次 | 距离创历史新高的轮次数 | 1726 |
| 最低价格 | 历史最低价（ATL） | 40993.90625 |
| 最低计次 | 距离创历史新低的轮次数 | 1144 |
| 最高占比 | 当前价格/历史最高价 × 100% | 75.79% |
| 最低占比 | 当前价格/历史最低价 × 100% | 103.12% |

## 📁 已创建的文件

### 1. 数据文件
- **price_extremes_data.txt** - Tab分隔格式，可直接粘贴到Excel
- **price_extremes_formatted.csv** - CSV格式，带中文表头

### 2. SQL导入脚本
- **update_extremes.sql** - 包含29条INSERT OR REPLACE语句

### 3. Web界面
- **public/extremes-data.html** - 可视化数据表格和导入工具

## 🚀 导入方法

### 方法一：使用Web界面（推荐）

1. 启动服务（如果还没启动）：
```bash
cd /home/user/webapp
pm2 start ecosystem.config.cjs
```

2. 访问导入页面：
```
http://localhost:3000/extremes-data.html
```

3. 点击"导入到数据库"按钮，自动批量导入所有29条数据

### 方法二：使用SQL脚本

```bash
cd /home/user/webapp
npx wrangler d1 execute webapp-production --local --file=./update_extremes.sql
```

### 方法三：使用API直接导入

```bash
curl -X POST http://localhost:3000/api/extremes/import \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "all_time_high": 111935,
    "high_count": 1726,
    "all_time_low": 40993.90625,
    "low_count": 1144
  }'
```

## 📊 数据特点分析

### 最接近历史低点（最高占比最低）
1. **DOT** - 63.59%（最具投资潜力）
2. **XLM** - 65.21%
3. **FIL** - 65.77%
4. **AAVE** - 65.81%
5. **ETC** - 66.39%

### 最远离历史低点（最低占比最高）
1. **XLM** - 112.77%（风险较高）
2. **AAVE** - 110.54%
3. **FIL** - 107.28%
4. **DOT** - 106.86%
5. **LTC** - 106.91%

### 最接近历史高点（最高占比最高）
1. **TAO** - 83.87%（已接近历史高点）
2. **TON** - 79.12%
3. **ETH** - 77.42%
4. **BCH** - 76.46%
5. **BTC** - 75.79%

## 🔄 导入后验证

### 1. 查询所有数据
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT symbol, all_time_high, high_count, all_time_low, low_count FROM price_extremes ORDER BY symbol"
```

### 2. 检查特定币种
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM price_extremes WHERE symbol='BTC'"
```

### 3. 统计总数
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) as total FROM price_extremes"
```

## 📈 数据使用场景

1. **价格对比页面** - 显示实时价格与历史极值的对比
2. **投资决策** - 根据最高占比判断买入时机（占比越低越好）
3. **风险评估** - 根据最低占比判断止损点（占比越高风险越大）
4. **计次监控** - 跟踪距离创历史新高/新低已经多少轮次

## 🔧 数据更新

如需更新单个币种数据，可以：

1. 重新运行SQL脚本（会覆盖旧数据）
2. 使用Web界面重新导入
3. 调用API单独更新：

```bash
curl -X POST http://localhost:3000/api/price/extreme/update \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "type": "high",
    "price": 120000
  }'
```

## ⚠️ 注意事项

1. **INSERT OR REPLACE** - 如果symbol已存在，会完全覆盖旧数据
2. **计次数据** - 导入后会固定为您提供的值，后续刷新会自动递增
3. **时间戳** - 导入时会自动设置为当前时间
4. **数据一致性** - 建议一次性导入全部数据，而不是分批导入

## 📊 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS price_extremes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT UNIQUE NOT NULL,
  all_time_high REAL NOT NULL,
  all_time_low REAL NOT NULL,
  ath_date DATETIME,
  atl_date DATETIME,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  high_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  extreme_up_count INTEGER DEFAULT 0,
  extreme_down_count INTEGER DEFAULT 0
);
```

## 🎯 下一步建议

1. **导入数据** - 使用上述任一方法导入29个币种数据
2. **验证数据** - 运行验证命令确保导入成功
3. **测试功能** - 访问价格对比页面查看效果
4. **定期更新** - 每周或每月手动更新一次历史极值数据
5. **同步GitHub** - 导入成功后运行 `npm run sync` 同步到GitHub

## 📝 命令速查

```bash
# 导入数据
cd /home/user/webapp
npx wrangler d1 execute webapp-production --local --file=./update_extremes.sql

# 验证数据
npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) FROM price_extremes"

# 查看数据
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM price_extremes LIMIT 5"

# 同步GitHub
npm run sync "feat: 导入价格极值数据"
```
