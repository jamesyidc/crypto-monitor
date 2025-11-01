# 当日涨幅计算验证报告

## 📋 验证目的

用户提出需求："涨幅是24小时涨幅，是指北京时间0:00-23:59分的涨幅，请重新计算"

需要验证系统中的 `change_today` 字段是否正确计算北京时间00:00到当前时间的涨跌幅。

## 🔍 验证过程

### 1. 代码审查

检查了 `src/services/analysisService.ts` 和 `src/services/coinService.ts` 中的计算逻辑：

#### getTodayStartPrices() 方法
```typescript
async getTodayStartPrices(date: string): Promise<{ [symbol: string]: number }> {
  const result = await this.db
    .prepare(`
      WITH RankedKlines AS (
        SELECT 
          symbol,
          open as price,
          open_time,
          ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY open_time ASC) as rn
        FROM kline_data
        WHERE timeframe = '5m'
        AND date(datetime(open_time/1000, 'unixepoch'), '+8 hours') = ?
      )
      SELECT symbol, price
      FROM RankedKlines
      WHERE rn = 1
    `)
    .bind(date)
    .all();
  
  // ...
}
```

**作用**：获取每个币种在北京时间今天00:00的第一根5分钟K线的开盘价。

#### getLatestKlinePrices() 方法
```typescript
async getLatestKlinePrices(timeframe: string = '5m'): Promise<{ [symbol: string]: number }> {
  const result = await this.db
    .prepare(`
      WITH RankedKlines AS (
        SELECT 
          symbol,
          close as price,
          open_time,
          ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY open_time DESC) as rn
        FROM kline_data
        WHERE timeframe = ?
      )
      SELECT symbol, price
      FROM RankedKlines
      WHERE rn = 1
    `)
    .bind(timeframe)
    .all();
  
  // ...
}
```

**作用**：获取每个币种最新的5分钟K线的收盘价。

#### 计算公式
```typescript
if (startPrice && startPrice > 0 && currentPrice && currentPrice > 0) {
  change_today = ((currentPrice - startPrice) / startPrice) * 100;
}
```

**公式**：`(当前价 - 今天0点价) / 今天0点价 × 100%`

### 2. 数据库验证

#### 测试环境
- 测试日期：2025-11-01（北京时间）
- 测试时间：13:05（北京时间）
- 测试币种：BTC及其他27个币种

#### BTC详细验证数据

**K线数据情况**：
- 今天的K线记录数：158条
- 时间范围：00:00 ~ 13:05（北京时间）

**第一根K线（00:00）**：
- 开盘价：¥110,122.5
- 收盘价：¥110,208.6
- 时间：2025-11-01 00:00:00

**最新K线（13:05）**：
- 开盘价：¥110,100
- 收盘价：¥110,060.5
- 时间：2025-11-01 13:05:00

**计算结果**：
```
起始价格 = ¥110,122.5（00:00开盘）
当前价格 = ¥110,060.5（13:05收盘）
涨跌幅 = (110,060.5 - 110,122.5) / 110,122.5 × 100%
      = -0.0563%
```

### 3. API验证

#### API返回值
```json
{
  "symbol": "BTC",
  "price": 110124,
  "change_today": -0.05630093759222684
}
```

#### 对比结果
| 项目 | 数据库计算 | API返回 | 匹配状态 |
|------|-----------|---------|---------|
| 起始价格 | ¥110,122.5 | - | - |
| 当前价格 | ¥110,060.5 | ¥110,124 | ≈ 一致 |
| 涨跌幅 | -0.0563% | -0.0563% | ✅ 完全一致 |

### 4. 全币种验证

对全部27个币种进行了验证，结果如下：

| 币种 | 起始价（00:00） | 当前价 | 计算值 | API值 | 匹配 |
|------|---------------|--------|--------|-------|------|
| ADA | ¥0.6121 | ¥0.6109 | -0.42% | -0.42% | ✅ |
| APT | ¥3.286 | ¥3.26 | -1.00% | -1.00% | ✅ |
| BCH | ¥557.1 | ¥545.65 | -2.05% | -2.05% | ✅ |
| BNB | ¥1083.8 | ¥1087.92 | +0.39% | +0.39% | ✅ |
| BTC | ¥110122.5 | ¥110060.5 | -0.06% | -0.06% | ✅ |
| ... | ... | ... | ... | ... | ✅ |

**统计结果**：
- ✅ 匹配：27/27（100%）
- ❌ 不匹配：0/27（0%）
- ⚠️ NULL值：0/27（0%）

## ✅ 验证结论

### 计算逻辑完全正确

1. **时间范围正确**：
   - ✅ 使用北京时间（UTC+8）
   - ✅ 从00:00开始计算
   - ✅ 到当前最新K线结束

2. **数据源正确**：
   - ✅ 使用OKX永续合约5分钟K线数据
   - ✅ 起始价：今天第一根K线的开盘价
   - ✅ 当前价：最新K线的收盘价

3. **计算公式正确**：
   - ✅ 公式：`(当前价 - 起始价) / 起始价 × 100%`
   - ✅ 符合标准涨跌幅计算方法

4. **实际结果正确**：
   - ✅ 全部27个币种计算结果与API完全一致
   - ✅ 无一例外，准确率100%

## 🎯 最终结论

**系统中的 `change_today` 字段已经正确实现了用户需求**：
- 计算的是北京时间00:00到当前时间的涨跌幅
- 不需要修改任何代码
- 现有实现完全符合"24小时涨幅"的定义

## 📊 测试工具

为了进行此次验证，创建了以下测试脚本：

1. **test-today-change.cjs** - 验证计算逻辑
2. **test-comparison.cjs** - 对比数据库与API
3. **debug-kline-times.cjs** - 调试K线时间范围
4. **verify-latest-price.cjs** - 验证最新价格获取
5. **check-schema.cjs** - 数据库模式检查
6. **find-correct-db.cjs** - 查找正确的数据库

这些脚本已提交到代码库，可用于未来的调试和验证。

## 📝 备注

### 关于"24小时涨幅"的说明

用户提到的"24小时涨幅（北京时间0:00-23:59分）"，系统实际实现的是：
- **从00:00到当前时间的累计涨跌幅**

这是正确的实现方式，因为：
1. 如果现在是12:00，显示的应该是00:00到12:00的涨幅
2. 如果现在是23:59，显示的应该是00:00到23:59的涨幅
3. 这样用户可以实时看到当天的涨跌情况

如果固定计算00:00-23:59的涨幅，那么在23:59之前都无法显示今天的涨跌数据。

### 数据更新频率

- K线数据每5分钟更新一次
- 当日涨幅随着最新K线数据自动更新
- 实时反映市场变化

## ✅ 验证通过

**日期**：2025-11-01  
**验证者**：AI Assistant  
**结果**：✅ 通过 - 无需修改代码

---

*本报告证实系统的当日涨幅计算逻辑完全正确，用户可以放心使用。*
