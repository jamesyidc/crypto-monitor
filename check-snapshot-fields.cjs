#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');

console.log('🔍 检查快照数据中的三个字段...\n');

try {
    const db = new Database(dbPath, { readonly: true });
    
    // 1. 检查表结构
    console.log('📋 dashboard_snapshots 表结构:');
    const tableInfo = db.prepare("PRAGMA table_info(dashboard_snapshots)").all();
    const relevantFields = tableInfo.filter(field => 
        ['priority_level', 'highest_ratio', 'lowest_ratio', 'this_round_price'].includes(field.name)
    );
    console.log(relevantFields);
    console.log('');
    
    // 2. 查询最新快照数据
    console.log('📊 最新快照数据 (2025-11-01 12:20:10):');
    const coins = db.prepare(`
        SELECT 
            symbol, 
            priority_level, 
            highest_ratio, 
            lowest_ratio, 
            this_round_price,
            rank_num
        FROM dashboard_snapshots 
        WHERE snapshot_time = '2025-11-01 12:20:10'
        ORDER BY rank_num
        LIMIT 10
    `).all();
    
    console.table(coins);
    
    // 3. 统计这些字段的空值情况
    console.log('\n📈 字段统计:');
    const stats = db.prepare(`
        SELECT 
            COUNT(*) as total,
            COUNT(priority_level) as priority_count,
            COUNT(highest_ratio) as highest_ratio_count,
            COUNT(lowest_ratio) as lowest_ratio_count,
            COUNT(this_round_price) as this_round_price_count,
            SUM(CASE WHEN priority_level IS NULL THEN 1 ELSE 0 END) as priority_null,
            SUM(CASE WHEN highest_ratio IS NULL OR highest_ratio = 0 THEN 1 ELSE 0 END) as highest_null_or_zero,
            SUM(CASE WHEN lowest_ratio IS NULL OR lowest_ratio = 0 THEN 1 ELSE 0 END) as lowest_null_or_zero,
            SUM(CASE WHEN this_round_price IS NULL OR this_round_price = 0 THEN 1 ELSE 0 END) as price_null_or_zero
        FROM dashboard_snapshots 
        WHERE snapshot_time = '2025-11-01 12:20:10'
    `).get();
    
    console.table([stats]);
    
    // 4. 检查首页API返回的原始数据结构
    console.log('\n🔍 检查 coins 表中的这些字段:');
    const coinsTableData = db.prepare(`
        SELECT 
            symbol, 
            priority_level,
            highest_ratio,
            lowest_ratio,
            current_price
        FROM coins
        ORDER BY rank
        LIMIT 10
    `).all();
    
    console.table(coinsTableData);
    
    db.close();
    
} catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
}
