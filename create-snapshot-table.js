#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/c7d58e8fb3b7dbec64a6e1c2fad7b8e06c49e3b8ed1d3a0c56e22c37e0152e1e.sqlite');

console.log('数据库路径:', dbPath);

const db = new Database(dbPath);

// 读取并执行迁移SQL
const sqlContent = fs.readFileSync(path.join(__dirname, 'migrations/0027_dashboard_snapshots.sql'), 'utf8');

try {
  // 分割SQL语句并执行
  const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const stmt of statements) {
    console.log('执行:', stmt.substring(0, 100) + '...');
    db.prepare(stmt).run();
  }
  
  console.log('✅ 表创建成功');
  
  // 验证
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dashboard_snapshots'").all();
  console.log('快照表:', tables);
  
  db.close();
} catch (error) {
  console.error('❌ 创建失败:', error.message);
  db.close();
  process.exit(1);
}
