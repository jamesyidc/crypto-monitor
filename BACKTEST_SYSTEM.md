# 震荡收敛交易回测系统 v1.4.0

## 概述

真实交易模拟器，按时间顺序执行震荡收敛策略回测，动态管理资金，完整记录每笔交易。

## 核心特性

### ✅ 1. 时间顺序执行
- **正序交易**：从最旧K线到最新，按实际时间顺序执行
- **数据结构**：`klineData[length-1]` 是最旧，`klineData[0]` 是最新
- **循环方向**：`for (let i = length-1; i >= 0; i--)` 确保时间正序

### ✅ 2. 动态资金管理
- **初始本金**：100,000 USDT
- **仓位分配**：每次开仓使用剩余本金的50%
- **实时更新**：每次平仓后立即更新可用本金
- **多仓位支持**：最多同时持有2个仓位

**资金流动示例：**
```
初始：100,000 USDT
第一笔开仓：50,000 USDT (50%) → 剩余 50,000
第二笔开仓：25,000 USDT (50%) → 剩余 25,000
第一笔平仓：退还 50,000 + 盈亏 → 更新本金
第二笔平仓：退还 25,000 + 盈亏 → 最终本金
```

### ✅ 3. 完整交易记录

每笔交易记录包含11个字段：
- **序号**：交易编号（1, 2, 3...）
- **开仓时间**：买入信号触发时间
- **平仓时间**：卖出信号触发时间
- **开仓价**：实际买入价格
- **平仓价**：实际卖出价格
- **涨跌**：价格变化百分比
- **净盈亏**：扣除手续费后的盈亏
- **本金前**：平仓前的可用本金
- **本金后**：平仓后的可用本金
- **累计胜率**：当前总体胜率百分比
- **结果**：WIN（盈利）或 LOSS（亏损）

### ✅ 4. 实时胜率统计

```typescript
// 每次平仓后更新
if (netProfit > 0) {
  winningTrades++;
} else {
  losingTrades++;
}

const currentWinRate = (winningTrades + losingTrades) > 0 
  ? ((winningTrades / (winningTrades + losingTrades)) * 100).toFixed(2) 
  : '0.00';
```

## 回测参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 初始本金 | 100,000 USDT | 起始资金 |
| 杠杆倍数 | 10x | 放大倍数 |
| 手续费率 | 0.05% | 开仓/平仓各收0.05% |
| 最大仓位 | 2个 | 同时持有上限 |
| 仓位比例 | 50% | 每次使用剩余本金的50% |

## 交易信号

### 买入信号（震荡收敛）
- RSI_5m 在 40-60 区间
- RSI_1h 在 40-60 区间
- BOLL带宽 < 1%（带宽收敛）
- 价格在BOLL中轨附近

### 卖出信号（波段高点）
- RSI_5m > 65（超买）
- 价格变化 ≤ +0.1%（冲高乏力）

## API接口

### POST /api/backtest/convergence-trading

**请求参数：**
```json
{
  "symbol": "BTC",        // 币种名称（不含USDT）
  "timeframe": "5m",      // 时间周期（目前仅支持5m）
  "limit": 500            // K线数量（500-1000）
}
```

**响应示例：**
```json
{
  "success": true,
  "backtest": {
    "symbol": "BTC",
    "timeframe": "5m",
    "dataPoints": 500,
    "buySignals": 6,
    "sellSignals": 1
  },
  "capital": {
    "initial": 100000,
    "final": "89481.84",
    "profit": "-10518.16",
    "fees": "750.00",
    "returnRate": "-10.52%"
  },
  "trading": {
    "totalTrades": 2,
    "winningTrades": 0,
    "losingTrades": 2,
    "winRate": "0.00%",
    "openPositions": 0
  },
  "trades": [
    {
      "symbol": "BTC",
      "type": "LONG",
      "entryTime": "2025/10/28 06:35:00",
      "entryPrice": 114309,
      "exitTime": "2025/10/29 13:05:00",
      "exitPrice": 112855.1,
      "positionSize": 50000,
      "leverage": 10,
      "priceChange": "-1.27%",
      "profit": "-6359.52",
      "fees": "500.00",
      "netProfit": "-6859.52",
      "capitalBefore": "25000.00",
      "capitalAfter": "68140.48",
      "winRate": "0.00%",
      "status": "LOSS"
    }
  ]
}
```

## 前端使用

### 1. 单币种回测
1. 访问 `/trading.html`
2. 点击"配置回测"按钮
3. 选择币种（如BTCUSDT）
4. 设置K线数量（默认500）
5. 点击"运行回测"
6. 查看交易明细表格

### 2. 批量回测
1. 在币种选择器中选择"全部交易对"
2. 点击"运行回测"
3. 系统自动对29个币种依次回测
4. 显示汇总统计和各币种详情

### 3. 交易表格字段

| 列名 | 说明 | 颜色标识 |
|------|------|----------|
| 序号 | 交易编号 | 粗体灰色 |
| 开仓时间 | YYYY/MM/DD HH:mm:ss | 灰色 |
| 平仓时间 | YYYY/MM/DD HH:mm:ss | 灰色 |
| 开仓价 | $价格 | 灰色 |
| 平仓价 | $价格 | 灰色 |
| 涨跌 | 百分比 | 绿色（正）/红色（负）|
| 净盈亏 | $金额 | 绿色（正）/红色（负）|
| 本金前 | $金额 | 灰色 |
| 本金后 | $金额 | 灰色 |
| 累计胜率 | 百分比 | 蓝色粗体 |
| 结果 | WIN/LOSS | 绿底/红底标签 |

## 测试命令

### 命令行测试
```bash
# 运行测试脚本
./test-backtest.sh

# 单币种API测试
curl -X POST http://localhost:3000/api/backtest/convergence-trading \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC","timeframe":"5m","limit":500}' | jq .
```

## 技术实现

### 后端核心逻辑
```typescript
// 从旧到新遍历K线
for (let i = klineData.length - 1; i >= 0; i--) {
  const k = klineData[i];
  
  // 1. 先处理卖出信号（平仓）
  if (peakAlertIndex.has(i) && k.close) {
    // 平掉所有持仓
    for (const [entryIdx, pos] of positionsToClose) {
      const capitalBeforeClose = currentCapital;
      
      // 更新本金
      currentCapital += pos.positionSize + netProfit;
      
      // 记录交易
      allTrades.push({
        capitalBefore: capitalBeforeClose,
        capitalAfter: currentCapital,
        winRate: currentWinRate + '%',
        status: netProfit > 0 ? 'WIN' : 'LOSS'
      });
    }
  }
  
  // 2. 再处理买入信号（开仓）
  if (convergenceAlertIndex.has(i) && k.close) {
    if (openPositions.size < maxPositions && currentCapital > 0) {
      const positionSize = currentCapital * 0.5;
      currentCapital -= positionSize;
      
      openPositions.set(i, {
        positionSize,
        // ...其他字段
      });
    }
  }
}
```

### 前端表格渲染
```javascript
trades.map((trade, index) => {
  const netProfit = parseFloat(trade.netProfit);
  const isWin = netProfit > 0;
  const plClass = isWin ? 'text-green-600' : 'text-red-600';
  const statusClass = isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  
  return `
    <tr>
      <td>${index + 1}</td>
      <td>${trade.entryTime}</td>
      <td>${trade.exitTime}</td>
      <td>$${parseFloat(trade.entryPrice).toFixed(4)}</td>
      <td>$${parseFloat(trade.exitPrice).toFixed(4)}</td>
      <td class="${plClass}">${trade.priceChange}</td>
      <td class="${plClass}">$${Math.abs(netProfit).toFixed(2)}</td>
      <td>$${parseFloat(trade.capitalBefore).toFixed(2)}</td>
      <td>$${parseFloat(trade.capitalAfter).toFixed(2)}</td>
      <td class="text-blue-600 font-semibold">${trade.winRate}</td>
      <td><span class="${statusClass}">${trade.status}</span></td>
    </tr>
  `;
})
```

## 关键修复历史

### 1. 时间排序修复
**问题**：交易记录最后调用了 `allTrades.reverse()`，导致顺序错乱
**解决**：删除 reverse() 调用，因为循环已经是时间正序

### 2. 本金记录修复
**问题**：`capitalBefore` 在更新本金后计算，导致数值错误
**解决**：在更新 `currentCapital` 之前记录 `capitalBeforeClose`

### 3. 前端显示增强
**问题**：原本只显示7列基础信息，缺少关键字段
**解决**：扩展为11列，包含本金变化、胜率、结果等

## 数据验证示例

### BTC回测结果
```
初始本金：100,000 USDT
交易1：
  - 开仓时间：2025/10/28 06:35:00
  - 本金前：25,000 USDT（两个仓位已开）
  - 本金后：68,140.48 USDT
  - 涨跌：-1.27%
  - 净盈亏：-6,859.52 USDT
  - 胜率：0.00%
  - 结果：LOSS

交易2：
  - 开仓时间：2025/10/28 09:45:00
  - 本金前：68,140.48 USDT
  - 本金后：89,481.84 USDT
  - 涨跌：-1.36%
  - 净盈亏：-3,658.64 USDT
  - 胜率：0.00%
  - 结果：LOSS

最终本金：89,481.84 USDT
总收益率：-10.52%
```

## 性能指标

- **API响应时间**：150-250ms（500根K线）
- **数据处理**：单币种约200-300条买卖信号分析
- **前端渲染**：实时显示，无延迟
- **批量回测**：29个币种约8-12秒

## 未来改进方向

1. **止损止盈**：添加固定百分比止损止盈
2. **仓位优化**：根据市场波动动态调整仓位比例
3. **多周期分析**：支持15m、1h等其他时间周期
4. **策略对比**：同时运行多个策略，对比收益
5. **持久化存储**：将回测结果保存到数据库

---

**版本**：v1.4.0  
**最后更新**：2025-10-29  
**作者**：crypto-monitor 项目组
