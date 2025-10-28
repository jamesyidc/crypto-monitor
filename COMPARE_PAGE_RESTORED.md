# 比价页面恢复 - 原始7列格式

## 更新时间
2025-10-28

## 变更说明

根据用户明确要求，将比价页面左栏恢复为**原始的7列聚合统计格式**。

### 用户需求
> "币名 最高价格 计次 最低价格 计次 最高占比 最低占比"
> "严格按照这个来 严格 不要自作主张"

### 之前的错误理解
我之前错误地将左栏改为4列的"极值记录日志"格式（币名、时间、状态、价格），这不是用户想要的。

### 正确的格式
恢复为7列聚合统计格式：
1. **币名** - 币种代码
2. **最高价格** - 历史最高价
3. **计次** - 触发最高价的次数
4. **最低价格** - 历史最低价
5. **计次** - 触发最低价的次数
6. **最高占比** - 当前价格占历史最高的百分比
7. **最低占比** - 当前价格占历史最低的百分比

## 修改内容

### 1. `public/compare.html`

**恢复表头为7列：**
```html
<thead>
    <tr>
        <th style="width: 50px;">币名</th>
        <th style="width: 100px;">最高价格</th>
        <th style="width: 50px;">计次</th>
        <th style="width: 100px;">最低价格</th>
        <th style="width: 50px;">计次</th>
        <th style="width: 60px;">最高占比</th>
        <th style="width: 60px;">最低占比</th>
    </tr>
</thead>
```

### 2. `public/static/compare.js`

**恢复数据加载逻辑：**
```javascript
// 只调用 /api/compare，不再请求 /api/extreme-records
const response = await axios.get('/api/compare');
```

**恢复左栏渲染逻辑：**
```javascript
function renderLeftTable(data) {
    // 显示聚合统计数据
    html += `
        <tr>
            <td class="coin-name">${coin.symbol}</td>
            <td>${coin.highPrice.toFixed(6)}</td>
            <td class="${countClass} count-column">${coin.highCount}</td>
            <td>${coin.lowPrice.toFixed(6)}</td>
            <td class="${countClass} count-column">${coin.lowCount}</td>
            <td class="${highRatioClass}">${coin.highRatio.toFixed(1)}%</td>
            <td class="${lowRatioClass}">${coin.lowRatio.toFixed(1)}%</td>
        </tr>
    `;
}
```

## 数据来源

### API端点
`GET /api/compare`

### 数据表
`price_extremes` - 价格极值统计表

### 数据结构
```typescript
{
  symbol: string,          // 币名
  highPrice: number,       // 最高价格
  highCount: number,       // 高点计次
  lowPrice: number,        // 最低价格
  lowCount: number,        // 低点计次
  currentPrice: number,    // 当前价格
  highRatio: number,       // 最高占比（动态计算）
  lowRatio: number,        // 最低占比（动态计算）
  ath_date: string,        // 最高价日期
  atl_date: string,        // 最低价日期
  last_updated: string     // 最后更新时间
}
```

## 占比计算逻辑

### 后端动态计算
在 `/api/compare` API中：
```typescript
// 最高占比 = (当前价格 / 历史最高价) × 100%
const highRatio = (currentPrice / all_time_high) * 100;

// 最低占比 = (当前价格 / 历史最低价) × 100%
const lowRatio = (currentPrice / all_time_low) * 100;
```

### 颜色编码规则

**最高占比：**
- ≥100% : 绿色 (green-bg)
- ≥90%  : 浅绿色 (light-green-bg)
- ≥80%  : 黄色 (yellow-bg)
- ≥70%  : 浅黄色 (light-yellow-bg)
- <70%  : 无背景色

**最低占比：**
- ≥120% : 绿色 (green-bg)
- ≥110% : 浅绿色 (light-green-bg)
- ≥105% : 黄色 (yellow-bg)
- ≥100% : 浅黄色 (light-yellow-bg)
- <100% : 无背景色

**计次列：**
- 固定黄色背景 (yellow-bg)

## 示例数据

```
币名    最高价格        计次    最低价格        计次    最高占比    最低占比
OKB     235.51972      1527    162.60563      436     70.6%      102.2%
DOT     4.883676       2999    2.90639        752     63.6%      106.9%
LINK    26.37          6210    16.62113       749     68.4%      108.5%
```

## 页面布局

```
┌────────────────────────────────────────────────────────────┐
│                       最高价格                             │
├──────┬──────────┬─────┬──────────┬─────┬────────┬─────────┤
│ 币名 │ 最高价格 │计次 │ 最低价格 │计次 │最高占比│最低占比 │
├──────┼──────────┼─────┼──────────┼─────┼────────┼─────────┤
│ OKB  │235.51972 │1527 │162.60563 │ 436 │ 70.6% │ 102.2% │
│ DOT  │4.883676  │2999 │2.90639   │ 752 │ 63.6% │ 106.9% │
│ LINK │26.37     │6210 │16.62113  │ 749 │ 68.4% │ 108.5% │
└──────┴──────────┴─────┴──────────┴─────┴────────┴─────────┘
```

## 功能特性

1. **实时占比计算**: 基于最新价格动态计算
2. **颜色编码**: 直观显示价格位置
3. **计次统计**: 记录触发极值的次数
4. **筛选功能**: 支持按币名筛选
5. **自动刷新**: 每30秒自动更新

## 注意事项

1. **不要自作主张**: 严格按照用户给定的7列格式
2. **数据准确性**: 占比由后端API统一计算
3. **格式一致性**: 价格保留6位小数，占比保留1位小数
4. **颜色规则**: 遵循既定的颜色编码规则

## 对比说明

### 错误的理解（已撤销）
- 4列格式：币名、时间、状态、价格
- 显示极值记录日志
- 数据来源：`extreme_records` 表

### 正确的格式（当前）
- 7列格式：币名、最高价格、计次、最低价格、计次、最高占比、最低占比
- 显示聚合统计数据
- 数据来源：`price_extremes` 表

## API测试

```bash
# 获取比价数据
curl http://localhost:3000/api/compare | jq '.coins[0]'

# 预期输出
{
  "symbol": "OKB",
  "highPrice": 235.51972,
  "highCount": 1527,
  "lowPrice": 162.60563,
  "lowCount": 436,
  "currentPrice": 166.2,
  "highRatio": 70.57,
  "lowRatio": 102.21,
  "ath_date": null,
  "atl_date": null,
  "last_updated": "2025-10-28 07:06:31"
}
```

## 总结

比价页面已恢复为原始的7列聚合统计格式，严格按照用户要求：
- ✅ 币名
- ✅ 最高价格
- ✅ 计次
- ✅ 最低价格
- ✅ 计次
- ✅ 最高占比
- ✅ 最低占比

数据来源于 `/api/compare` API，由后端动态计算占比，确保数据准确性。

---

**状态**: ✅ 已恢复  
**格式**: 7列聚合统计  
**测试**: ✅ 通过  
