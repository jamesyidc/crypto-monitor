# 比价页面更新 - 极值记录显示

## 更新时间
2025-10-28

## 更新内容

### 1. 左栏表格结构调整
**原结构（8列）：**
- 币名
- 最高价格
- 计次
- 最低价格
- 计次
- 最高占比
- 最低占比
- 单日最高

**新结构（4列）：**
- 币名
- 时间
- 状态（创新高/创新低）
- 价格

### 2. 数据源变更
- **原数据源**: `/api/compare` - 聚合统计数据（price_extremes表）
- **新数据源**: `/api/extreme-records` - 历史极值事件日志（extreme_records表）

### 3. 页面功能变化
**从聚合视图改为事件日志视图：**
- ✅ 显示按时间倒序的最新100条极值记录
- ✅ 每条记录显示：币名、触发时间、状态（创新高/创新低）、价格
- ✅ 创新高=绿色背景，创新低=红色背景
- ✅ 支持按币名筛选

## 修改的文件

### 1. `public/compare.html`
- 修改左栏表头从8列改为4列
- 更新panel-header标题为"极值记录"
- 调整加载提示的colspan

### 2. `public/static/compare.js`
- **`loadCompareData()`**: 增加并行请求`/api/extreme-records`
- **`renderLeftTable()`**: 完全重写，改为渲染极值记录而非聚合数据
- **`showError()`**: 更新colspan从8改为4

### 3. `src/services/coinService.ts`
- **新增方法**: `getLatestExtremeRecords(limit: number)`
  - 从extreme_records表获取最新的极值记录
  - 按timestamp倒序排列
  - 可配置返回条数（默认100条）

### 4. `src/index.tsx`
- **新增API**: `GET /api/extreme-records`
  - 支持limit参数（默认100）
  - 返回格式：
    ```json
    {
      "success": true,
      "records": [
        {
          "symbol": "BTC",
          "record_type": "new_high",
          "price": 50000,
          "timestamp": "2025-10-28 06:56:19"
        }
      ],
      "count": 100
    }
    ```

## 页面访问

### 本地开发环境
http://localhost:3000/compare.html

### 沙箱环境
https://3000-ij3odq6k2fvoix4jt5np8-c07dda5e.sandbox.novita.ai/compare.html

## API测试

```bash
# 获取最新10条极值记录
curl http://localhost:3000/api/extreme-records?limit=10

# 获取默认100条记录
curl http://localhost:3000/api/extreme-records
```

## 设计理念

**原设计（聚合统计）：**
- 显示每个币种的历史最高价、最低价
- 显示计次（触发最高/最低的次数）
- 动态计算当前价格占历史极值的百分比

**新设计（事件日志）：**
- 显示每次触发极值的历史记录
- 按时间倒序，最新的记录在最上面
- 可以看到每个币种何时、以什么价格创造了新的历史记录
- 更直观地了解市场动态

## 数据说明

### extreme_records 表结构
```sql
CREATE TABLE extreme_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  record_type TEXT NOT NULL,  -- 'new_high' 或 'new_low'
  price REAL NOT NULL,
  prev_extreme REAL,
  zero_count INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 数据来源
- 后台服务 `analysis-scheduler` 每10分钟运行一次
- 当检测到币种价格突破历史最高或最低时，自动插入记录
- 中栏（时间信息）和右栏（统计数据）保持不变

## 注意事项

1. **筛选功能**：输入框可以按币名筛选所有三栏的数据
2. **自动刷新**：页面每30秒自动刷新一次
3. **记录数量**：默认显示最新100条，可通过API参数调整
4. **颜色编码**：
   - 创新高：绿色背景
   - 创新低：红色背景

## 后续优化建议

1. 增加日期范围筛选（查看特定日期的极值记录）
2. 增加币种筛选下拉菜单
3. 增加分页功能（当记录数量很大时）
4. 增加导出功能（导出极值记录到CSV）
5. 增加图表展示（极值记录的时间分布图）
