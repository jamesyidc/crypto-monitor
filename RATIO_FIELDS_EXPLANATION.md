# 占比字段说明文档

## 字段含义

### 1. 最高占比 (highest_ratio / high_ratio)
- **计算公式**: `(当前价格 / 历史最高价格) × 100`
- **含义**: 当前价格占历史最高价格的百分比
- **值域**: 0% ~ 100%（通常不会超过100%，除非创新高）
- **解读**:
  - 100% = 当前价格等于历史最高价（处于历史高点）
  - 50% = 当前价格是历史最高价的一半（距离高点较远）
  - 越低说明距离历史高点越远，可能有更大上涨空间

**示例**: TAO 
- 当前价: $520
- 历史最高价: $520
- **最高占比** = 520 / 520 × 100 = **100%** ✅ 正确

### 2. 最低占比 (lowest_ratio / low_ratio)
- **计算公式**: `(当前价格 / 历史最低价格) × 100`
- **含义**: 当前价格占历史最低价格的百分比
- **值域**: 100% ~ 无限大
- **解读**:
  - 100% = 当前价格等于历史最低价（处于历史低点）
  - 200% = 当前价格是历史最低价的2倍
  - 越高说明距离历史低点越远，价格已经大幅上涨

**示例**: TAO
- 当前价: $520
- 历史最低价: $293
- **最低占比** = 520 / 293 × 100 = **177.43%** ✅ 正确

### 3. 为什么 lowest_ratio > highest_ratio？

**这是正常的！** 

对于大多数币种（不在历史最低点附近的）:
- `lowest_ratio` 通常 **大于** 100%（说明已经脱离最低点）
- `highest_ratio` 通常 **小于** 100%（说明还没到历史高点）

**特殊情况**：
- 如果币种刚创新高：`highest_ratio` ≈ 100%，`lowest_ratio` > 100%
- 如果币种在历史低点附近：`highest_ratio` < 50%，`lowest_ratio` ≈ 100%

## 数据库字段映射

### coin_priority 表（源数据）
```sql
CREATE TABLE coin_priority (
  id INTEGER PRIMARY KEY,
  symbol TEXT,
  level INTEGER,           -- 优先级等级
  low_ratio REAL,          -- 最低占比 (当前价/历史最低价×100)
  high_ratio REAL,         -- 最高占比 (当前价/历史最高价×100)
  last_updated DATETIME
);
```

### dashboard_snapshots 表（快照数据）
```sql
CREATE TABLE dashboard_snapshots (
  ...
  priority_level INTEGER,    -- 优先级等级
  highest_ratio REAL,        -- 最高占比 (当前价/历史最高价×100)
  lowest_ratio REAL,         -- 最低占比 (当前价/历史最低价×100)
  this_round_price REAL,     -- 这轮价格
  ...
);
```

## 数据流

```
1. analysisService.ts 计算:
   lowRatio = (price / all_time_low) × 100
   highRatio = (price / all_time_high) × 100

2. coinService.updateCoinPriority() 保存到 coin_priority:
   INSERT INTO coin_priority (low_ratio, high_ratio)

3. API /api/dashboard 返回:
   priorities: [{ low_ratio, high_ratio }]

4. snapshot-scheduler.js 提取:
   highestRatio = priority.high_ratio
   lowestRatio = priority.low_ratio

5. 保存到 dashboard_snapshots:
   INSERT INTO dashboard_snapshots (highest_ratio, lowest_ratio)

6. API /api/snapshots/times 返回:
   coins: [{ highest_ratio, lowest_ratio }]

7. history-new.js 渲染:
   coin.highest_ratio → 最高占比
   coin.lowest_ratio → 最低占比
```

## 实际数据验证

### TAO 币种示例
```javascript
// 数据库中的值
{
  symbol: 'TAO',
  priority_level: 1,
  highest_ratio: 100.00,        // 当前价 = 历史最高价
  lowest_ratio: 177.43,         // 当前价 = 历史最低价 × 1.77
  this_round_price: 520.07
}

// 页面显示
优先级: 1
最高占比: 100.00%     ← 处于历史高点
最低占比: 177.43%     ← 已经涨了 77.43%（从历史低点算）
这轮价格: $520.07
```

## 常见问题

### Q1: 为什么 lowest_ratio 会大于 highest_ratio?
**A**: 这是正常的！因为它们的基准不同：
- `highest_ratio` 的基准是 **历史最高价**（通常比当前价高）
- `lowest_ratio` 的基准是 **历史最低价**（通常比当前价低很多）

### Q2: 如果 lowest_ratio = 300%，是什么意思？
**A**: 说明当前价格是历史最低价的 3 倍，币价已经大幅上涨。

### Q3: 如果 highest_ratio = 120%，是什么意思？
**A**: 说明当前价格超过了历史最高价 20%，币种创了新高！

### Q4: 投资参考价值？
- **highest_ratio < 50%**: 距离历史高点很远，可能有上涨空间
- **lowest_ratio > 300%**: 已经涨了很多，可能需要谨慎
- **priority_level = 1**: 系统评定为最高优先级（综合考虑两个占比）

## 结论

**这三个字段的数据是正确的！** 

如果页面显示异常，可能的原因：
1. JavaScript 代码读取字段名错误
2. API 返回的数据结构不匹配
3. 前端渲染时出现 null/undefined 错误

建议检查：
- 浏览器控制台 Console 是否有 JavaScript 错误
- Network 面板查看 API 返回的实际数据
- 确认字段名匹配: `coin.priority_level`, `coin.highest_ratio`, `coin.lowest_ratio`, `coin.this_round_price`
