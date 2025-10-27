#!/usr/bin/env node

/**
 * 重新扫描历史K线数据，用固定V1/V2阈值标注
 * 严格按照用户提供的阈值标准
 */

// V1/V2 阈值配置（严格按照用户提供的数据）
const VOLUME_THRESHOLDS = {
  BTC: { v1: 200000, v2: 100000 },
  ETH: { v1: 1300000, v2: 500000 },
  XRP: { v1: 200000, v2: 87000 },
  SOL: { v1: 351620, v2: 246380 },
  BNB: { v1: 2388300, v2: 1737500 },
  LTC: { v1: 50000, v2: 15000 },
  DOGE: { v1: 150000, v2: 60000 },
  SUI: { v1: 2000000, v2: 800000 },
  TRX: { v1: 13280, v2: 6022 },
  TON: { v1: 350000, v2: 200000 },
  ETC: { v1: 12000, v2: 2000 },
  BCH: { v1: 103500, v2: 50000 },
  HBAR: { v1: 103500, v2: 40000 },
  XLM: { v1: 103500, v2: 30000 },
  FIL: { v1: 5003500, v2: 3700000 },
  ADA: { v1: 67210, v2: 44230 },
  LINK: { v1: 280000, v2: 200000 },
  CRO: { v1: 100000, v2: 40000 },
  DOT: { v1: 300000, v2: 250000 },
  UNI: { v1: 140000, v2: 100000 },
  NEAR: { v1: 100000, v2: 50000 },
  APT: { v1: 300000, v2: 200000 },
  CFX: { v1: 300000, v2: 250000 },
  CRV: { v1: 1500000, v2: 1000000 },
  STX: { v1: 50000, v2: 30000 },
  LDO: { v1: 1000000, v2: 600000 },
  TAO: { v1: 300000, v2: 180000 },
  AAVE: { v1: 100000, v2: 50000 },
  OKB: { v1: 100000, v2: 50000 }
};

const DB_PATH = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite';
const sqlite3 = require('better-sqlite3');

async function updateVolumeThresholds() {
  console.log('🔄 开始更新历史K线数据的V1/V2标注...\n');
  
  const db = sqlite3(DB_PATH);
  
  try {
    // 获取所有K线数据的统计信息
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM kline_data');
    const { total } = countStmt.get();
    console.log(`📊 总共有 ${total} 条K线数据需要更新\n`);
    
    // 按币种统计
    const symbolStmt = db.prepare('SELECT symbol, COUNT(*) as count FROM kline_data GROUP BY symbol ORDER BY symbol');
    const symbolStats = symbolStmt.all();
    console.log('📊 各币种K线数据统计:');
    symbolStats.forEach(stat => {
      const thresholds = VOLUME_THRESHOLDS[stat.symbol];
      console.log(`  ${stat.symbol}: ${stat.count} 条 (V1: ${thresholds?.v1 || 'N/A'}, V2: ${thresholds?.v2 || 'N/A'})`);
    });
    console.log('');
    
    // 开始更新
    let updatedCount = 0;
    let v1Count = 0;
    let v2Count = 0;
    
    db.prepare('BEGIN TRANSACTION').run();
    
    for (const symbol of Object.keys(VOLUME_THRESHOLDS)) {
      const { v1, v2 } = VOLUME_THRESHOLDS[symbol];
      
      // 更新该币种的所有K线数据
      const updateStmt = db.prepare(`
        UPDATE kline_data 
        SET 
          volume_v1 = CASE WHEN volume > ? THEN 1 ELSE 0 END,
          volume_v2 = CASE WHEN volume > ? THEN 1 ELSE 0 END
        WHERE symbol = ?
      `);
      
      const result = updateStmt.run(v1, v2, symbol);
      updatedCount += result.changes;
      
      // 统计该币种超过V1和V2的数量
      const v1Stmt = db.prepare('SELECT COUNT(*) as count FROM kline_data WHERE symbol = ? AND volume_v1 = 1');
      const v2Stmt = db.prepare('SELECT COUNT(*) as count FROM kline_data WHERE symbol = ? AND volume_v2 = 1');
      
      const v1Result = v1Stmt.get(symbol);
      const v2Result = v2Stmt.get(symbol);
      
      v1Count += v1Result.count;
      v2Count += v2Result.count;
      
      console.log(`✅ ${symbol}: 更新完成 (V1超标: ${v1Result.count}, V2超标: ${v2Result.count})`);
    }
    
    db.prepare('COMMIT').run();
    
    console.log('\n✅ 所有K线数据更新完成!');
    console.log(`  - 总更新: ${updatedCount} 条`);
    console.log(`  - V1超标: ${v1Count} 条`);
    console.log(`  - V2超标: ${v2Count} 条`);
    
  } catch (error) {
    try {
      db.prepare('ROLLBACK').run();
    } catch (rollbackError) {
      // 忽略回滚错误
    }
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 检查依赖
try {
  require.resolve('better-sqlite3');
} catch (e) {
  console.error('❌ 缺少依赖 better-sqlite3');
  console.log('📦 正在安装 better-sqlite3...');
  require('child_process').execSync('npm install better-sqlite3', { stdio: 'inherit' });
}

updateVolumeThresholds().catch(console.error);
