#!/usr/bin/env node

/**
 * 手动插入测试快照数据
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/c7d58e8fb3b7dbec64a6e1c2fad7b8e06c49e3b8ed1d3a0c56e22c37e0152e1e.sqlite');

const db = new Database(dbPath);

// 创建测试数据
const now = new Date();
const testData = {
  dashboard: {
    latestRound: {
      risk_alert_count: 3,
      average_change: 2.5,
      surge_count: 2,
      crash_count: 1,
      min_change: -5.2,
      max_change: 8.3
    },
    specialStats: {
      change24hOver10Up: 5,
      change24hOver10Down: 2,
      todayNewHighCount: 8,
      todayNewLowCount: 3
    },
    coinDetails: [
      { symbol: 'BTC', price: 68500.50, change_5m: 0.5, change_24h: 2.3, priority: 1 },
      { symbol: 'ETH', price: 2450.25, change_5m: -0.3, change_24h: 1.8, priority: 1 },
      { symbol: 'BNB', price: 305.80, change_5m: 1.2, change_24h: -0.5, priority: 2 }
    ]
  },
  compare: {
    coins: [
      { symbol: 'BTC', high_ratio: 95.5, low_ratio: 88.2, today_new_high_count: 3, today_new_low_count: 0 },
      { symbol: 'ETH', high_ratio: 92.1, low_ratio: 85.5, today_new_high_count: 2, today_new_low_count: 1 },
      { symbol: 'BNB', high_ratio: 88.8, low_ratio: 90.3, today_new_high_count: 1, today_new_low_count: 0 }
    ]
  }
};

const snapshotTime = now.toISOString();
const snapshotDate = now.toISOString().split('T')[0];
const snapshotHour = now.getHours();
const snapshotMinute = now.getMinutes();

try {
  const stmt = db.prepare(`
    INSERT INTO dashboard_snapshots (
      snapshot_time, snapshot_date, snapshot_hour, snapshot_minute,
      dashboard_data, compare_data,
      risk_alert_count, average_change, surge_count, crash_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    snapshotTime,
    snapshotDate,
    snapshotHour,
    snapshotMinute,
    JSON.stringify(testData.dashboard),
    JSON.stringify(testData.compare),
    3,
    2.5,
    2,
    1
  );

  console.log('✅ 测试快照已插入');
  console.log(`   ID: ${result.lastInsertRowid}`);
  console.log(`   时间: ${snapshotTime}`);
  console.log(`   日期: ${snapshotDate}`);
  console.log(`   ${snapshotHour}:${snapshotMinute}`);
  
  // 查询验证
  const snapshots = db.prepare('SELECT COUNT(*) as count FROM dashboard_snapshots').get();
  console.log(`\n总快照数: ${snapshots.count}`);
  
  db.close();
} catch (error) {
  console.error('❌ 插入失败:', error.message);
  db.close();
  process.exit(1);
}
