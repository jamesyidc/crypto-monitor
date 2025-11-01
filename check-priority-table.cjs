#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');

console.log('🔍 检查 coin_priority 表...\n');

try {
    const db = new Database(dbPath, { readonly: true });
    
    // 1. 表结构
    console.log('📋 coin_priority 表结构:');
    const tableInfo = db.prepare("PRAGMA table_info(coin_priority)").all();
    console.table(tableInfo);
    
    // 2. 查看前10条数据
    console.log('\n📊 coin_priority 表数据 (前10条):');
    const priorities = db.prepare(`
        SELECT * FROM coin_priority 
        ORDER BY level
        LIMIT 10
    `).all();
    
    console.table(priorities);
    
    // 3. 统计high_ratio和low_ratio的异常情况
    console.log('\n📈 high_ratio vs low_ratio 异常统计:');
    const abnormal = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN low_ratio > high_ratio THEN 1 ELSE 0 END) as low_greater_than_high,
            SUM(CASE WHEN low_ratio <= high_ratio THEN 1 ELSE 0 END) as normal
        FROM coin_priority
    `).get();
    
    console.table([abnormal]);
    
    // 4. 查看具体的异常记录
    console.log('\n⚠️  low_ratio > high_ratio 的记录:');
    const abnormalRecords = db.prepare(`
        SELECT 
            symbol,
            level,
            high_ratio,
            low_ratio,
            (low_ratio - high_ratio) as difference
        FROM coin_priority
        WHERE low_ratio > high_ratio
        ORDER BY difference DESC
        LIMIT 10
    `).all();
    
    console.table(abnormalRecords);
    
    db.close();
    
} catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}
