// 应用交易信号重构迁移
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
console.log(`📂 使用数据库: ${files[0].name}\n`);

const db = new Database(dbPath);

try {
  console.log('📝 执行迁移: 0030_trading_signals_refactor.sql\n');
  
  const sql = fs.readFileSync('migrations/0030_trading_signals_refactor.sql', 'utf8');
  
  // 直接执行整个 SQL 文件
  try {
    db.exec(sql);
    console.log('  ✅ SQL 文件执行成功\n');
  } catch (error) {
    console.error(`  ❌ SQL 执行失败: ${error.message}\n`);
    // 如果整体执行失败，尝试逐条执行
    console.log('  🔄 尝试逐条执行...\n');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    for (let i = 0; i < statements.length; i++) {
      try {
        db.exec(statements[i]);
        console.log(`  ✅ [${i+1}/${statements.length}] 执行成功`);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.error(`  ⚠️  [${i+1}/${statements.length}] ${err.message}`);
        }
      }
    }
  }
  
  // 验证数据
  console.log('📊 验证新表数据...\n');
  
  console.log('=== trading_signals_v2 (做多信号) ===');
  const longSignals = db.prepare("SELECT * FROM trading_signals_v2 WHERE signal_type = 'long'").all();
  longSignals.forEach(s => {
    console.log(`  ✅ ${s.signal_name} (${s.category}) - 优先级: ${s.priority}`);
  });
  
  console.log('\n=== trading_signals_v2 (做空信号) ===');
  const shortSignals = db.prepare("SELECT * FROM trading_signals_v2 WHERE signal_type = 'short'").all();
  shortSignals.forEach(s => {
    console.log(`  ✅ ${s.signal_name} (${s.category}) - 优先级: ${s.priority}`);
  });
  
  console.log('\n✅ 迁移完成！');
  console.log(`   - 做多信号: ${longSignals.length} 个`);
  console.log(`   - 做空信号: ${shortSignals.length} 个`);
  
} catch (error) {
  console.error('❌ 迁移失败:', error.message);
  process.exit(1);
} finally {
  db.close();
}
