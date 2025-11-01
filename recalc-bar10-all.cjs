#!/usr/bin/env node

/**
 * 重新计算所有币种的10格比价数据并保存到数据库
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/placeholder.sqlite');
const db = new Database(dbPath);

const symbols = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC',
  'LTC', 'LINK', 'UNI', 'ATOM', 'ETC', 'XLM', 'NEAR', 'APT', 'ARB', 'OP',
  'FIL', 'LDO', 'IMX', 'STX', 'MKR', 'INJ', 'RUNE', 'HBAR', 'TAO', 'BCH',
  'TRX', 'TON', 'SUI'
];

console.log('🚀 开始重新计算所有币种的10格比价数据...\n');

// 1. 先清除所有10格数据
console.log('🗑️  步骤1: 清除所有10格数据...');
const clearStmt = db.prepare(`
  UPDATE kline_data 
  SET bar_10_compare = NULL
  WHERE timeframe = '5m'
`);
clearStmt.run();
console.log('✅ 清除完成\n');

// 2. 遍历每个币种计算10格数据
const results = [];

for (const symbol of symbols) {
  try {
    console.log(`🔄 处理 ${symbol}...`);
    
    // 获取该币种的K线数据（最近1000根）
    const klines = db.prepare(`
      SELECT * FROM kline_data 
      WHERE symbol = ? AND timeframe = '5m'
      ORDER BY open_time ASC 
      LIMIT 1000
    `).all(symbol);
    
    if (klines.length === 0) {
      console.log(`  ⚠️  ${symbol}: 无K线数据`);
      results.push({ symbol, success: false, error: '无K线数据' });
      continue;
    }
    
    let updateCount = 0;
    const updateStmt = db.prepare(`
      UPDATE kline_data 
      SET bar_10_compare = ?
      WHERE symbol = ? AND timeframe = '5m' AND open_time = ?
    `);
    
    // 遍历每根K线计算10格比价
    for (let i = 0; i < klines.length; i++) {
      const k = klines[i];
      
      // 获取包含当前K线的10根K线范围
      const bar10Start = Math.max(0, i - 9);
      const bar10Range = klines.slice(bar10Start, i + 1);
      
      if (bar10Range.length >= 2) {
        const currentLow = k.low;
        const currentHigh = k.high;
        
        // 从10根K线中找出最高价和最低价
        let highest = bar10Range[0].high;
        let lowest = bar10Range[0].low;
        
        for (const bar of bar10Range) {
          if (bar.high > highest) highest = bar.high;
          if (bar.low < lowest) lowest = bar.low;
        }
        
        // 只判断当前K线是否等于这个最高/最低价
        let bar10Compare = 0;
        if (currentHigh >= highest) {
          bar10Compare = 1;  // 创新高
        } else if (currentLow <= lowest) {
          bar10Compare = -1; // 创新低
        }
        
        // 更新数据库
        updateStmt.run(bar10Compare, symbol, k.open_time);
        updateCount++;
      }
    }
    
    console.log(`  ✅ ${symbol}: ${updateCount}/${klines.length} 条更新完成`);
    results.push({
      symbol,
      success: true,
      updated: updateCount,
      total: klines.length
    });
    
  } catch (error) {
    console.error(`  ❌ ${symbol}: 计算失败 - ${error.message}`);
    results.push({
      symbol,
      success: false,
      error: error.message
    });
  }
}

// 3. 打印统计结果
console.log('\n📊 统计结果:');
console.log('─'.repeat(50));

const successCount = results.filter(r => r.success).length;
const failedCount = results.filter(r => !r.success).length;
const totalUpdated = results.filter(r => r.success).reduce((sum, r) => sum + r.updated, 0);

console.log(`总币种数: ${symbols.length}`);
console.log(`成功: ${successCount}`);
console.log(`失败: ${failedCount}`);
console.log(`总更新数: ${totalUpdated}`);

if (failedCount > 0) {
  console.log('\n❌ 失败的币种:');
  results.filter(r => !r.success).forEach(r => {
    console.log(`  - ${r.symbol}: ${r.error}`);
  });
}

console.log('\n✨ 10格比价数据重新计算完成！');

db.close();
