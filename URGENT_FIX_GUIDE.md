# 🚨 紧急修复指南 - 价格类型字段缺失

## 当前问题

**错误信息**: `D1_ERROR: table trading_strategies has no column named entry_price_type`

**原因**: 数据库缺少 4 个新字段

**需要添加的字段**:
- `entry_price_type` (TEXT)
- `entry_specified_price` (REAL)
- `exit_price_type` (TEXT)
- `exit_specified_price` (REAL)

---

## 🥇 方法 1: Cloudflare Dashboard（推荐，最简单）

### 步骤 1: 登录 Cloudflare

访问: https://dash.cloudflare.com

### 步骤 2: 进入 D1 数据库

1. 点击左侧菜单 **Workers & Pages**
2. 点击顶部标签 **D1**
3. 找到并点击你的数据库 **crypto-trading-db**

### 步骤 3: 打开 Console

点击 **Console** 标签页

### 步骤 4: 执行 SQL 命令

**逐个复制粘贴以下命令，每次执行一条：**

#### 命令 1: 添加 entry_price_type
```sql
ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited';
```
点击 **Execute** 或 **Run** 按钮

#### 命令 2: 添加 entry_specified_price
```sql
ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;
```
点击 **Execute**

#### 命令 3: 添加 exit_price_type
```sql
ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited';
```
点击 **Execute**

#### 命令 4: 添加 exit_specified_price
```sql
ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;
```
点击 **Execute**

### 步骤 5: 验证成功

执行验证查询：
```sql
PRAGMA table_info(trading_strategies);
```

**在结果中应该看到这 4 行**（可能在最后）:
- `entry_price_type | TEXT | 0 | 'unlimited' | 0`
- `entry_specified_price | REAL | 0 | | 0`
- `exit_price_type | TEXT | 0 | 'unlimited' | 0`
- `exit_specified_price | REAL | 0 | | 0`

如果看到了，说明成功！✅

---

## 🥈 方法 2: 使用 Wrangler CLI（需要 API Token）

### 前置条件: 设置 API Token

#### 获取 API Token:
1. 访问: https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 选择 **Edit Cloudflare Workers** 模板
4. 或创建自定义 token，权限需要包含:
   - Account → D1 → Edit
5. 复制生成的 token

#### 设置环境变量:
```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

或者永久保存（添加到 ~/.bashrc 或 ~/.zshrc）:
```bash
echo 'export CLOUDFLARE_API_TOKEN="your-token-here"' >> ~/.bashrc
source ~/.bashrc
```

### 执行迁移

方法 A: 使用脚本
```bash
cd /home/user/webapp
./quick-fix-price-type.sh
```

方法 B: 手动执行
```bash
cd /home/user/webapp

# 命令 1
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited';"

# 命令 2
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;"

# 命令 3
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited';"

# 命令 4
wrangler d1 execute crypto-trading-db --remote --command "ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;"
```

---

## 🥉 方法 3: 使用迁移文件

### 步骤 1: 使用 V2 迁移文件（无 CHECK 约束）

```bash
cd /home/user/webapp
wrangler d1 execute crypto-trading-db --remote --file=migrations/0046_add_price_type_to_strategies_v2.sql
```

### 步骤 2: 验证
```bash
wrangler d1 execute crypto-trading-db --remote --command "PRAGMA table_info(trading_strategies);"
```

---

## 📸 Cloudflare Dashboard 操作截图说明

### 1. 导航到 D1
```
Cloudflare Dashboard
├── Workers & Pages (左侧菜单)
│   └── D1 (顶部标签)
│       └── crypto-trading-db (你的数据库)
```

### 2. Console 界面
```
┌─────────────────────────────────────────┐
│ Overview | Console | Metrics | Settings │  ← 点击 Console
├─────────────────────────────────────────┤
│ SQL Query                                │
│ ┌─────────────────────────────────────┐ │
│ │ ALTER TABLE trading_strategies ...   │ │  ← 粘贴 SQL
│ └─────────────────────────────────────┘ │
│                                          │
│ [Execute] [Clear]                        │  ← 点击 Execute
├─────────────────────────────────────────┤
│ Results                                  │
│ ✅ Query executed successfully          │  ← 成功提示
└─────────────────────────────────────────┘
```

---

## ✅ 成功验证清单

执行完迁移后，检查以下几点：

### 1. 数据库验证 ✓
```sql
PRAGMA table_info(trading_strategies);
```
应该看到 4 个新字段

### 2. 功能测试 ✓
1. 刷新浏览器（Ctrl + Shift + R）
2. 打开策略库
3. 创建新策略
4. 填写表单（包括价格类型）
5. 保存策略
6. **应该成功，没有错误！**

### 3. 编辑测试 ✓
1. 编辑已有策略
2. 修改价格类型
3. 保存
4. **应该成功！**

### 4. 显示测试 ✓
1. 查看策略卡
2. 应该显示价格类型信息
3. 例如：💲 开盘价、💲 收盘价

---

## 🚨 常见问题

### Q1: 执行 SQL 时报错 "duplicate column name"

**A**: 字段已存在，迁移已经执行过了。直接刷新浏览器测试。

### Q2: Cloudflare Dashboard 找不到 D1

**A**: 
1. 确认你的账户有 D1 权限
2. 检查是否在正确的账户下
3. 确认数据库确实存在

### Q3: 执行后仍然报错

**A**: 可能需要重新部署 Worker
```bash
cd /home/user/webapp
npm run deploy
```

### Q4: 不知道数据库名称

**A**: 检查 wrangler.toml 文件：
```bash
cat wrangler.toml | grep database_name
```

---

## 🔍 故障排查

### 检查点 1: 数据库名称
```bash
cd /home/user/webapp
grep -A 5 "d1_databases" wrangler.toml
```

应该显示：
```toml
[[d1_databases]]
binding = "DB"
database_name = "crypto-trading-db"
database_id = "..."
```

### 检查点 2: 当前表结构
在 Cloudflare Console 执行：
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='trading_strategies';
```

查看完整的建表语句。

### 检查点 3: 现有字段列表
```sql
PRAGMA table_info(trading_strategies);
```

数每一行，看总共有多少字段。

---

## 📋 完整的 SQL 命令（一次性执行）

如果 Cloudflare Console 支持多条语句，可以一次性执行：

```sql
-- 添加价格类型字段
ALTER TABLE trading_strategies ADD COLUMN entry_price_type TEXT DEFAULT 'unlimited';
ALTER TABLE trading_strategies ADD COLUMN entry_specified_price REAL;
ALTER TABLE trading_strategies ADD COLUMN exit_price_type TEXT DEFAULT 'unlimited';
ALTER TABLE trading_strategies ADD COLUMN exit_specified_price REAL;

-- 创建索引（可选但推荐）
CREATE INDEX IF NOT EXISTS idx_strategies_entry_price_type ON trading_strategies(entry_price_type);
CREATE INDEX IF NOT EXISTS idx_strategies_exit_price_type ON trading_strategies(exit_price_type);
```

**注意**: 如果不支持多条语句，请逐条执行。

---

## 🎯 执行后的步骤

### 1. 清除缓存
```bash
# 如果使用了 Cloudflare Pages/Workers 缓存
wrangler pages deployment tail
```

### 2. 重新部署（可选）
```bash
cd /home/user/webapp
npm run deploy
```

### 3. 刷新浏览器
**硬刷新**: Ctrl + Shift + R (Windows/Linux) 或 Cmd + Shift + R (Mac)

### 4. 测试完整流程
1. 创建策略 → 成功 ✅
2. 编辑策略 → 成功 ✅
3. 删除策略 → 成功 ✅

---

## 📞 获取帮助

如果以上方法都不行，请提供：

1. **执行 SQL 后的错误信息**（完整的）
2. **wrangler.toml 中的数据库配置**
3. **浏览器控制台的错误**（F12 → Console）
4. **网络请求的响应**（F12 → Network → 失败的请求）

---

## 🎉 成功标志

当你看到这些，说明修复成功：

✅ SQL 执行成功提示
✅ PRAGMA table_info 显示 4 个新字段
✅ 创建策略时没有错误
✅ 策略卡显示价格类型
✅ 编辑策略可以修改价格类型

---

## ⏱️ 预计完成时间

- **方法 1 (Cloudflare Dashboard)**: 2-3 分钟
- **方法 2 (Wrangler CLI)**: 5-10 分钟（包括设置 token）
- **方法 3 (迁移文件)**: 3-5 分钟

---

**推荐使用方法 1（Cloudflare Dashboard），最简单直接！**

现在就去执行吧！🚀
