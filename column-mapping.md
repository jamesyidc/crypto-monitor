# K线表格列映射对照表

## 完整列顺序（共29列）

| # | 列名 | HTML表头 | JS渲染 | 数据字段 | 背景色 |
|---|------|---------|--------|----------|--------|
| 1 | 时间 | ✅ | ✅ | k.time | white/sticky |
| 2 | 起涨/起跌点 | ✅ | ✅ | cumulativeBadge | blue-50 |
| 3 | 操作提示 | ✅ | ✅ | operationTip | orange-50 |
| 4 | **24排名** | ✅ | ✅ | k.homepage_rank | pink-50 |
| 5 | 开盘 | ✅ | ✅ | k.open | - |
| 6 | 最高 | ✅ | ✅ | k.high | - |
| 7 | 最低 | ✅ | ✅ | k.low | - |
| 8 | 收盘 | ✅ | ✅ | k.close | - |
| 9 | 本轮涨跌 | ✅ | ✅ | k.change | - |
| 10 | 10格 | ✅ | ✅ | k.bar_10_compare | purple-50 |
| 11 | 成交量 | ✅ | ✅ | k.volume | - |
| 12 | V1 | ✅ | ✅ | v1Badge | - |
| 13 | V2 | ✅ | ✅ | v2Badge | - |
| 14 | 信号 | ✅ | ✅ | k.signal | indicator-col |
| 15 | SAR | ✅ | ✅ | k.sar | indicator-col |
| 16 | SAR变化 | ✅ | ✅ | k.sarChange | indicator-col |
| 17 | SAR变化% | ✅ | ✅ | k.sarChangePercent | indicator-col |
| 18 | 涨跌差值 | ✅ | ✅ | k['change-diff'] | indicator-col |
| 19 | RSI_5m | ✅ | ✅ | k.rsi_5min | indicator-col |
| 20 | RSI_1h | ✅ | ✅ | k.rsi_1h | indicator-col |
| 21 | BOLL_MB | ✅ | ✅ | k.boll_mb | indicator-col |
| 22 | BOLL_UB | ✅ | ✅ | k.boll_ub | indicator-col |
| 23 | BOLL_LB | ✅ | ✅ | k.boll_lb | indicator-col |
| 24 | 占比下跌 | ✅ | ✅ | k.down_channel_exhaustion_ratio | indicator-col |
| 25 | 占比上涨 | ✅ | ✅ | k.up_channel_exhaustion_ratio | indicator-col |
| 26 | 带宽 | ✅ | ✅ | boll_ub - boll_lb | indicator-col |
| 27 | 通道状态 | ✅ | ✅ | k.channel_state | indicator-col |
| 28 | **当日涨幅** | ✅ | ✅ | k.change_today | indicator-col + yellow-50 |

## 修复内容

### 问题
1. JS渲染缺少第28列"当日涨幅"
2. 导致所有数据列错位

### 解决方案
在 `kline_v2.js` 第741行之后添加"当日涨幅"列：

```javascript
<!-- 28. 当日涨幅 -->
<td class="py-2 px-1 text-right font-bold indicator-col ${k.change_today ? (k.change_today > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'} bg-yellow-50">
  ${k.change_today !== null && k.change_today !== undefined ? k.change_today.toFixed(2) + '%' : '-'}
</td>
```

## 验证清单

部署后验证：
- [ ] 总列数：29列（HTML表头）= 28列（JS td）+ 1个闭合标签
- [ ] 第4列显示"24排名"（粉色背景）
- [ ] 第28列显示"当日涨幅"（黄色背景）
- [ ] 所有数据正确对齐，无错位
- [ ] 开盘/最高/最低/收盘在第5-8列
- [ ] 技术指标（信号、SAR等）在第14-27列

## 特殊列说明

### 24排名（第4列）
- 位置：操作提示之后
- 数据来源：`kline_data.homepage_rank`（来自 `coins.rank_order`）
- 显示格式：`#1`, `#2`, `#3` 等（粉色徽章）
- 无数据显示：`-`

### 当日涨幅（第28列）
- 位置：最后一列（技术指标末尾）
- 数据来源：`k.change_today`
- 显示格式：`+15.23%` 或 `-3.45%`
- 颜色：绿色（正）/ 红色（负）/ 灰色（无数据）
- 背景：黄色（yellow-50）
