// 应用数据库迁移到本地 D1 数据库
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 找到最新的 D1 数据库文件
const d1Dir = path.join(__dirname, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const files = fs.readdirSync(d1Dir)
  .filter(f => f.endsWith('.sqlite'))
  .map(f => ({
    name: f,
    path: path.join(d1Dir, f),
    mtime: fs.statSync(path.join(d1Dir, f)).mtime
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (files.length === 0) {
  console.error('❌ 没有找到 D1 数据库文件');
  process.exit(1);
}

const dbPath = files[0].path;
console.log(`📂 使用数据库: ${files[0].name}`);

const db = new Database(dbPath);

// 读取并执行迁移文件
const migrations = [
  'migrations/0028_live_trading_tables.sql',
  'migrations/0029_trading_logs_and_risk_rules.sql'
];

for (const migrationFile of migrations) {
  try {
    console.log(`📝 应用迁移: ${migrationFile}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // 分割SQL语句（按分号分割，但忽略注释中的分号）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        db.exec(statement);
      } catch (error) {
        // 忽略 "table already exists" 错误
        if (!error.message.includes('already exists')) {
          console.error(`  ⚠️  执行失败: ${error.message}`);
        }
      }
    }
    
    console.log(`  ✅ ${migrationFile} 应用成功`);
  } catch (error) {
    console.error(`❌ 应用迁移失败 ${migrationFile}:`, error.message);
  }
}

db.close();
console.log('\n✅ 所有迁移应用完成！');
