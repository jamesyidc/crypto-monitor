const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');
const dbFiles = fs.readdirSync(dbDir).filter(f => f.endsWith('.sqlite'));

console.log(`🔍 Found ${dbFiles.length} database files:\n`);

dbFiles.forEach(dbFile => {
  const dbPath = path.join(dbDir, dbFile);
  const db = new Database(dbPath);
  
  console.log(`\n📂 ${dbFile.substring(0, 16)}...`);
  console.log(`   Path: ${dbPath}`);
  
  try {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    console.log(`   Tables (${tables.length}):`);
    
    if (tables.length > 0) {
      tables.forEach(t => {
        // Try to count rows
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get();
          console.log(`     • ${t.name} (${count.count} rows)`);
        } catch (e) {
          console.log(`     • ${t.name} (error counting)`);
        }
      });
      
      // Check for kline-related tables
      const klineTables = tables.filter(t => 
        t.name.toLowerCase().includes('kline') || 
        t.name.toLowerCase().includes('candle')
      );
      
      if (klineTables.length > 0) {
        console.log(`   ✅ This DB has K-line tables!`);
      }
    } else {
      console.log(`     (empty database)`);
    }
  } catch (error) {
    console.log(`   ❌ Error reading database: ${error.message}`);
  }
  
  db.close();
});

console.log('\n' + '='.repeat(80));
