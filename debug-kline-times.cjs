const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject', '3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');
const db = new Database(dbPath);

console.log('🔍 Investigating K-line Data Time Ranges\n');

const now = new Date();
const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
const today = beijingTime.toISOString().split('T')[0];

console.log(`📅 Today (Beijing): ${today}`);
console.log(`⏰ Current Beijing time: ${beijingTime.toISOString().replace('T', ' ').split('.')[0]}\n`);
console.log('='.repeat(80));

// Check BTC K-line data for today
console.log('\n📊 BTC K-line data for today (first 5 and last 5 records):\n');

const btcQuery = `
  SELECT 
    open,
    high,
    low,
    close,
    datetime(open_time/1000, 'unixepoch') as utc_open_time,
    datetime(open_time/1000, 'unixepoch', '+8 hours') as beijing_open_time,
    datetime(close_time/1000, 'unixepoch', '+8 hours') as beijing_close_time,
    date(datetime(open_time/1000, 'unixepoch'), '+8 hours') as beijing_date
  FROM kline_data
  WHERE symbol = 'BTC'
  AND timeframe = '5m'
  AND date(datetime(open_time/1000, 'unixepoch'), '+8 hours') = ?
  ORDER BY open_time ASC
`;

const btcResults = db.prepare(btcQuery).all(today);

console.log(`Found ${btcResults.length} BTC 5m K-lines for today\n`);

if (btcResults.length > 0) {
  console.log('First 5 records:');
  btcResults.slice(0, 5).forEach((row, i) => {
    console.log(`  ${i + 1}. Open: ¥${row.open}, Close: ¥${row.close}, Time: ${row.beijing_open_time} ~ ${row.beijing_close_time}`);
  });
  
  console.log('\nLast 5 records:');
  btcResults.slice(-5).forEach((row, i) => {
    console.log(`  ${btcResults.length - 4 + i}. Open: ¥${row.open}, Close: ¥${row.close}, Time: ${row.beijing_open_time} ~ ${row.beijing_close_time}`);
  });
  
  const firstRecord = btcResults[0];
  const lastRecord = btcResults[btcResults.length - 1];
  
  console.log('\n📊 Calculation Check:');
  console.log(`  First candle open:  ¥${firstRecord.open} at ${firstRecord.beijing_open_time}`);
  console.log(`  Last candle close:  ¥${lastRecord.close} at ${lastRecord.beijing_close_time}`);
  
  const change = ((lastRecord.close - firstRecord.open) / firstRecord.open) * 100;
  console.log(`  Daily change:       ${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
  
  // Check what getLatestKlinePrices would return
  console.log('\n🔍 What getLatestKlinePrices() would return:');
  const latestQuery = `
    WITH RankedKlines AS (
      SELECT 
        symbol,
        close as price,
        open_time,
        datetime(open_time/1000, 'unixepoch', '+8 hours') as beijing_time,
        ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY open_time DESC) as rn
      FROM kline_data
      WHERE timeframe = '5m'
      AND symbol = 'BTC'
    )
    SELECT symbol, price, beijing_time
    FROM RankedKlines
    WHERE rn = 1
  `;
  
  const latestResult = db.prepare(latestQuery).get();
  console.log(`  Latest price (by open_time DESC): ¥${latestResult.price} at ${latestResult.beijing_time}`);
  
  // Try with close_time
  const latestQuery2 = `
    WITH RankedKlines AS (
      SELECT 
        symbol,
        close as price,
        close_time,
        datetime(close_time/1000, 'unixepoch', '+8 hours') as beijing_time,
        ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY close_time DESC) as rn
      FROM kline_data
      WHERE timeframe = '5m'
      AND symbol = 'BTC'
    )
    SELECT symbol, price, beijing_time
    FROM RankedKlines
    WHERE rn = 1
  `;
  
  const latestResult2 = db.prepare(latestQuery2).get();
  console.log(`  Latest price (by close_time DESC): ¥${latestResult2.price} at ${latestResult2.beijing_time}`);
}

// Check all symbols to see time ranges
console.log('\n\n📊 Time ranges for all symbols today:\n');

const timeRangeQuery = `
  SELECT 
    symbol,
    COUNT(*) as record_count,
    MIN(datetime(open_time/1000, 'unixepoch', '+8 hours')) as earliest_time,
    MAX(datetime(close_time/1000, 'unixepoch', '+8 hours')) as latest_time,
    MIN(open) as first_open,
    MAX(close) as last_close_candidate
  FROM kline_data
  WHERE timeframe = '5m'
  AND date(datetime(open_time/1000, 'unixepoch'), '+8 hours') = ?
  GROUP BY symbol
  ORDER BY symbol
  LIMIT 10
`;

const timeRanges = db.prepare(timeRangeQuery).all(today);

timeRanges.forEach(row => {
  console.log(`${row.symbol.padEnd(8)} ${row.record_count} records: ${row.earliest_time} ~ ${row.latest_time}`);
});

db.close();
console.log('\n' + '='.repeat(80));
