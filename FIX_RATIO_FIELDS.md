# 修复历史页面三个字段显示问题

## 问题诊断

根据代码分析，这三个字段的数据在数据库中是**正常的**：

```sql
-- 数据库中的实际数据 (2025-11-01 12:40:10)
SELECT symbol, priority_level, highest_ratio, lowest_ratio, this_round_price
FROM dashboard_snapshots 
WHERE snapshot_time = '2025/11/1 12:40:10' AND symbol = 'TAO';

-- 结果:
-- TAO | 1 | 100.00 | 177.43 | 520.07
```

## 可能的问题

### 1. 字段名匹配检查

**当前代码** (`public/static/history-new.js` 第 305-310 行):
```javascript
// 15. 最高占比
const highestRatio = coin.highest_ratio || 0;
row.innerHTML += `<td class="px-2 py-2 text-right">${highestRatio.toFixed(2)}%</td>`;

// 16. 最低占比  
const lowestRatio = coin.lowest_ratio || 0;
row.innerHTML += `<td class="px-2 py-2 text-right">${lowestRatio.toFixed(2)}%</td>`;
```

**问题**: 如果 `coin.highest_ratio` 或 `coin.lowest_ratio` 是 `null` 或 `undefined`，会显示 "0.00%"。

### 2. API 返回数据结构检查

**检查点 1**: `src/index.tsx` API 响应
```typescript
// 应该包含这些字段
coins: [{
  symbol: 'TAO',
  priority_level: 1,
  highest_ratio: 100,
  lowest_ratio: 177.43,
  this_round_price: 520.07,
  ...
}]
```

**检查点 2**: `snapshot-scheduler.js` 保存逻辑 (第 184-185 行)
```javascript
const highestRatio = priority?.high_ratio || null;  // ← 注意这里的字段名
const lowestRatio = priority?.low_ratio || null;
```

## 修复方案

### 方案 1: 添加调试日志

在 `public/static/history-new.js` 的 `renderCoinTable()` 函数中添加调试：

```javascript
function renderCoinTable(coins) {
    const tbody = document.getElementById('coinTableBody');
    tbody.innerHTML = '';
    
    if (!coins || coins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="17" class="text-center py-8 text-gray-500">暂无数据</td></tr>';
        return;
    }
    
    // 🆕 添加调试日志
    console.log('📊 渲染币种表格，第一个币种数据:', coins[0]);
    console.log('📊 字段检查:', {
        symbol: coins[0].symbol,
        priority_level: coins[0].priority_level,
        highest_ratio: coins[0].highest_ratio,
        lowest_ratio: coins[0].lowest_ratio,
        this_round_price: coins[0].this_round_price
    });
    
    coins.forEach(coin => {
        const row = document.createElement('tr');
        row.className = 'coin-row hover:bg-gray-50';
        
        // ... (其他列的渲染代码)
        
        // 14. 优先级
        const priorityLevel = coin.priority_level !== null && coin.priority_level !== undefined 
            ? coin.priority_level 
            : '-';
        row.innerHTML += `<td class="px-2 py-2 text-center">${priorityLevel}</td>`;
        
        // 15. 最高占比
        const highestRatio = coin.highest_ratio !== null && coin.highest_ratio !== undefined 
            ? coin.highest_ratio.toFixed(2) + '%'
            : '-';
        row.innerHTML += `<td class="px-2 py-2 text-right">${highestRatio}</td>`;
        
        // 16. 最低占比
        const lowestRatio = coin.lowest_ratio !== null && coin.lowest_ratio !== undefined 
            ? coin.lowest_ratio.toFixed(2) + '%'
            : '-';
        row.innerHTML += `<td class="px-2 py-2 text-right">${lowestRatio}</td>`;
        
        // 17. 这轮价格
        const thisRoundPrice = coin.this_round_price !== null && coin.this_round_price !== undefined
            ? '$' + coin.this_round_price.toFixed(6)
            : '-';
        row.innerHTML += `<td class="px-2 py-2 text-right">${thisRoundPrice}</td>`;
        
        tbody.appendChild(row);
    });
}
```

### 方案 2: 检查 API 响应

打开浏览器开发者工具：
1. 访问 `http://localhost:3000/history-new.html`
2. 选择日期和时间，点击"加载历史数据"
3. 在 Network 面板查看 API 请求
4. 找到 `/api/snapshots/times?date=2025-11-01` 请求
5. 查看 Response，确认数据结构：
```json
{
  "success": true,
  "snapshots": [{
    "snapshot_time": "2025/11/1 12:40:10",
    "coins": [{
      "symbol": "TAO",
      "priority_level": 1,
      "highest_ratio": 100,
      "lowest_ratio": 177.43,
      "this_round_price": 520.07,
      ...
    }]
  }]
}
```

### 方案 3: 字段含义说明（添加到HTML）

在 `public/history-new.html` 的表格下方添加说明：

```html
<!-- 币种列表下方添加 -->
<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
    <h3 class="font-bold text-blue-800 mb-2">📊 字段说明</h3>
    <ul class="text-sm text-blue-700 space-y-1">
        <li><strong>最高占比</strong>: 当前价格占历史最高价的百分比（100% = 处于历史高点）</li>
        <li><strong>最低占比</strong>: 当前价格占历史最低价的百分比（>100% = 已脱离历史低点）</li>
        <li><strong>注意</strong>: 最低占比通常会大于最高占比，这是正常现象</li>
        <li><strong>示例</strong>: TAO 最高占比100%（处于历史高点），最低占比177%（价格是历史最低价的1.77倍）</li>
    </ul>
</div>
```

## 测试步骤

1. 打开浏览器开发者工具 (F12)
2. 访问 `http://localhost:3000/history-new.html`
3. 查看 Console 面板，检查是否有 JavaScript 错误
4. 选择日期"2025-11-01"和时间"12:40:10"
5. 点击"加载历史数据"
6. 在 Console 查看调试日志输出
7. 确认表格中显示的数据

## 预期结果

```
TAO 行应该显示:
序号: 1
币名: TAO
...
优先级: 1
最高占比: 100.00%
最低占比: 177.43%
这轮价格: $520.070000
```

## 数据正常性确认

根据数据库查询结果，数据**完全正常**：
- ✅ `priority_level` 有值 (1)
- ✅ `highest_ratio` 有值 (100)
- ✅ `lowest_ratio` 有值 (177.43)
- ✅ `this_round_price` 有值 (520.07)

如果页面显示异常，问题在于**前端渲染逻辑**，而不是数据本身。
