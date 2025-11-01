#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');

console.log('🔍 检查 dashboard_snapshots 表结构...\n');

try {
    const db = new Database(dbPath, { readonly: true });
    
    // 查看表结构
    console.log('📋 dashboard_snapshots 表结构:');
    const tableInfo = db.prepare("PRAGMA table_info(dashboard_snapshots)").all();
    
    // 只显示相关字段
    const relevantFields = tableInfo.filter(field => 
        ['priority_level', 'highest_ratio', 'lowest_ratio', 'this_round_price', 'high_ratio', 'low_ratio'].includes(field.name)
    );
    
    console.table(relevantFields);
    
    // 查看实际保存的数据
    console.log('\n📊 实际数据示例 (TAO):');
    const taoData = db.prepare(`
        SELECT 
            snapshot_time,
            symbol,
            priority_level,
            highest_ratio,
            lowest_ratio,
            this_round_price
        FROM dashboard_snapshots 
        WHERE symbol = 'TAO'
        ORDER BY snapshot_time DESC
        LIMIT 3
    `).all();
    
    console.table(taoData);
    
    db.close();
    
} catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}
