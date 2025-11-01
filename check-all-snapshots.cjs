#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');

console.log('🔍 检查所有快照数据...\n');

try {
    const db = new Database(dbPath, { readonly: true });
    
    // 1. 查看所有快照时间和记录数
    console.log('📋 所有快照列表:');
    const snapshots = db.prepare(`
        SELECT 
            snapshot_time,
            COUNT(*) as coin_count
        FROM dashboard_snapshots
        GROUP BY snapshot_time
        ORDER BY snapshot_time DESC
        LIMIT 10
    `).all();
    
    console.table(snapshots);
    
    if (snapshots.length > 0) {
        // 2. 检查最新快照的详细数据
        const latestTime = snapshots[0].snapshot_time;
        console.log(`\n📊 最新快照 (${latestTime}) 的详细数据:`);
        
        const coins = db.prepare(`
            SELECT 
                symbol, 
                priority_level, 
                highest_ratio, 
                lowest_ratio, 
                this_round_price,
                rank_num
            FROM dashboard_snapshots 
            WHERE snapshot_time = ?
            ORDER BY rank_num
            LIMIT 10
        `).all(latestTime);
        
        console.table(coins);
        
        // 3. 统计字段情况
        console.log('\n📈 字段统计:');
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN priority_level IS NULL THEN 1 ELSE 0 END) as priority_null,
                SUM(CASE WHEN highest_ratio IS NULL OR highest_ratio = 0 THEN 1 ELSE 0 END) as highest_null_or_zero,
                SUM(CASE WHEN lowest_ratio IS NULL OR lowest_ratio = 0 THEN 1 ELSE 0 END) as lowest_null_or_zero,
                SUM(CASE WHEN this_round_price IS NULL OR this_round_price = 0 THEN 1 ELSE 0 END) as price_null_or_zero
            FROM dashboard_snapshots 
            WHERE snapshot_time = ?
        `).get(latestTime);
        
        console.table([stats]);
    }
    
    // 4. 检查 coins 表的数据（用于对比）
    console.log('\n🔍 coins 表的当前数据 (前10个):');
    const coinsData = db.prepare(`
        SELECT 
            symbol,
            current_price,
            rank
        FROM coins
        ORDER BY rank
        LIMIT 10
    `).all();
    
    console.table(coinsData);
    
    // 5. 检查 coins 表结构
    console.log('\n📋 coins 表结构:');
    const coinsTableInfo = db.prepare("PRAGMA table_info(coins)").all();
    const relevantCoinFields = coinsTableInfo.filter(field => 
        ['priority_level', 'highest_ratio', 'lowest_ratio', 'current_price'].includes(field.name)
    );
    console.table(relevantCoinFields);
    
    db.close();
    
} catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}
