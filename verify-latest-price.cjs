const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject', '3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');
const db = new Database(dbPath);

console.log('🔍 Verifying getLatestKlinePrices() logic for BTC\n');
console.log('='.repeat(80));

// Exact query from coinService.ts line 903-919
const query = `
  WITH RankedKlines AS (
    SELECT 
      symbol,
      close as price,
      open_time,
      close_time,
      datetime(open_time/1000, 'unixepoch', '+8 hours') as beijing_open_time,
      datetime(close_time/1000, 'unixepoch', '+8 hours') as beijing_close_time,
      ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY open_time DESC) as rn
    FROM kline_data
    WHERE timeframe = '5m'
    AND symbol = 'BTC'
  )
  SELECT symbol, price, open_time, close_time, beijing_open_time, beijing_close_time, rn
  FROM RankedKlines
  WHERE rn <= 5
  ORDER BY rn
`;

const results = db.prepare(query).all();

console.log('Latest 5 K-lines (ordered by open_time DESC):');
results.forEach((row, i) => {
  console.log(`  ${row.rn}. Price: ¥${row.price}, Open time: ${row.beijing_open_time}, Close time: ${row.beijing_close_time || 'null'}`);
});

const latestPrice = results[0].price;
console.log(`\n✅ Latest price returned by getLatestKlinePrices(): ¥${latestPrice}`);

// Now check the start price
console.log('\n' + '='.repeat(80));
console.log('🔍 Verifying getTodayStartPrices() logic for BTC\n');

const now = new Date();
const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
const today = beijingTime.toISOString().split('T')[0];

const startQuery = `
  WITH RankedKlines AS (
    SELECT 
      symbol,
      open as price,
      open_time,
      datetime(open_time/1000, 'unixepoch', '+8 hours') as beijing_time,
      ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY open_time ASC) as rn
    FROM kline_data
    WHERE timeframe = '5m'
    AND date(datetime(open_time/1000, 'unixepoch'), '+8 hours') = ?
    AND symbol = 'BTC'
  )
  SELECT symbol, price, beijing_time, rn
  FROM RankedKlines
  WHERE rn <= 3
  ORDER BY rn
`;

const startResults = db.prepare(startQuery).all(today);

console.log(`First 3 K-lines for ${today}:`);
startResults.forEach(row => {
  console.log(`  ${row.rn}. Open: ¥${row.price} at ${row.beijing_time}`);
});

const startPrice = startResults[0].price;
console.log(`\n✅ Start price returned by getTodayStartPrices(): ¥${startPrice}`);

// Calculate
console.log('\n' + '='.repeat(80));
console.log('📊 Final Calculation:\n');

const changeToday = ((latestPrice - startPrice) / startPrice) * 100;

console.log(`  Start price (00:00):  ¥${startPrice}`);
console.log(`  Latest price:         ¥${latestPrice}`);
console.log(`  Change today:         ${changeToday > 0 ? '+' : ''}${changeToday.toFixed(4)}%`);

console.log('\n🎯 Expected API value:  ', changeToday.toFixed(2) + '%');

db.close();
