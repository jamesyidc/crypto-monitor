const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject', 'c531f6bf1f8a2e8d7c14aa7e26d05e7267af34c851e0e30b2e96b9df8c5bc4ee.sqlite');
const db = new Database(dbPath);

console.log('📋 Database Schema:\n');

// Get all tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log(`Found ${tables.length} tables:\n`);
tables.forEach(t => {
  console.log(`  • ${t.name}`);
});

console.log('\n🔍 Checking for k-line related tables:');
const klineTables = tables.filter(t => t.name.toLowerCase().includes('kline') || t.name.toLowerCase().includes('candle'));
if (klineTables.length > 0) {
  console.log('Found k-line tables:');
  klineTables.forEach(t => {
    console.log(`\n📊 Table: ${t.name}`);
    const columns = db.prepare(`PRAGMA table_info(${t.name})`).all();
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
  });
} else {
  console.log('⚠️  No k-line tables found');
}

db.close();
