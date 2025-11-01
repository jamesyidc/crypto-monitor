const Database = require('better-sqlite3');
const path = require('path');

// Connect to the local D1 database
const dbPath = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject', '3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');
const db = new Database(dbPath);

console.log('🔍 Testing Daily Change Calculation Logic\n');
console.log('='.repeat(80));

// Get today's date in Beijing time
const now = new Date();
const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
const today = beijingTime.toISOString().split('T')[0];

console.log(`📅 Today's date (Beijing): ${today}`);
console.log(`⏰ Current Beijing time: ${beijingTime.toISOString().replace('T', ' ').split('.')[0]}`);
console.log('='.repeat(80));

// Test getTodayStartPrices logic
console.log('\n📊 Testing getTodayStartPrices() logic:');
console.log('-'.repeat(80));

const todayStartQuery = `
  WITH RankedKlines AS (
    SELECT 
      symbol,
      open as price,
      open_time,
      datetime(open_time/1000, 'unixepoch') as utc_time,
      datetime(open_time/1000, 'unixepoch', '+8 hours') as beijing_time,
      date(datetime(open_time/1000, 'unixepoch'), '+8 hours') as beijing_date,
      ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY open_time ASC) as rn
    FROM kline_data
    WHERE timeframe = '5m'
    AND date(datetime(open_time/1000, 'unixepoch'), '+8 hours') = ?
  )
  SELECT symbol, price, beijing_time, beijing_date
  FROM RankedKlines
  WHERE rn = 1
  ORDER BY symbol
  LIMIT 5
`;

const todayStartResults = db.prepare(todayStartQuery).all(today);

console.log(`Found ${todayStartResults.length} symbols with today's start prices:`);
todayStartResults.forEach(row => {
  console.log(`  • ${row.symbol}: ¥${row.price} at ${row.beijing_time} (${row.beijing_date})`);
});

// Test getLatestKlinePrices logic
console.log('\n📊 Testing getLatestKlinePrices() logic:');
console.log('-'.repeat(80));

const latestPricesQuery = `
  WITH RankedKlines AS (
    SELECT 
      symbol,
      close as price,
      close_time,
      datetime(close_time/1000, 'unixepoch', '+8 hours') as beijing_time,
      ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY close_time DESC) as rn
    FROM kline_data
    WHERE timeframe = '5m'
  )
  SELECT symbol, price, beijing_time
  FROM RankedKlines
  WHERE rn = 1
  ORDER BY symbol
  LIMIT 5
`;

const latestResults = db.prepare(latestPricesQuery).all();

console.log(`Found ${latestResults.length} symbols with latest prices:`);
latestResults.forEach(row => {
  console.log(`  • ${row.symbol}: ¥${row.price} at ${row.beijing_time}`);
});

// Calculate change_today for matching symbols
console.log('\n📈 Calculating Daily Change (当天涨幅):');
console.log('-'.repeat(80));

const startPriceMap = {};
todayStartResults.forEach(row => {
  startPriceMap[row.symbol] = { price: row.price, time: row.beijing_time };
});

const latestPriceMap = {};
latestResults.forEach(row => {
  latestPriceMap[row.symbol] = { price: row.price, time: row.beijing_time };
});

const commonSymbols = Object.keys(startPriceMap).filter(s => latestPriceMap[s]);

if (commonSymbols.length > 0) {
  console.log(`\nCalculating change for ${commonSymbols.length} symbols:\n`);
  
  commonSymbols.forEach(symbol => {
    const startPrice = startPriceMap[symbol].price;
    const currentPrice = latestPriceMap[symbol].price;
    const changeToday = ((currentPrice - startPrice) / startPrice) * 100;
    
    console.log(`${symbol}:`);
    console.log(`  Start (00:00): ¥${startPrice} at ${startPriceMap[symbol].time}`);
    console.log(`  Current:       ¥${currentPrice} at ${latestPriceMap[symbol].time}`);
    console.log(`  Change Today:  ${changeToday > 0 ? '+' : ''}${changeToday.toFixed(2)}%`);
    console.log('');
  });
} else {
  console.log('⚠️  No matching symbols found between start and latest prices.');
}

// Check if there's any data for today
console.log('\n🔍 Checking K-line data availability:');
console.log('-'.repeat(80));

const countQuery = `
  SELECT 
    COUNT(*) as total_count,
    COUNT(DISTINCT symbol) as symbol_count,
    MIN(datetime(open_time/1000, 'unixepoch', '+8 hours')) as earliest_time,
    MAX(datetime(close_time/1000, 'unixepoch', '+8 hours')) as latest_time
  FROM kline_data
  WHERE timeframe = '5m'
  AND date(datetime(open_time/1000, 'unixepoch'), '+8 hours') = ?
`;

const countResult = db.prepare(countQuery).get(today);

console.log(`📊 Today's K-line data (${today}):`);
console.log(`  Total records: ${countResult.total_count}`);
console.log(`  Unique symbols: ${countResult.symbol_count}`);
console.log(`  Time range: ${countResult.earliest_time} ~ ${countResult.latest_time}`);

// Get actual API response to compare
console.log('\n🌐 Fetching actual API response for comparison:');
console.log('-'.repeat(80));

const http = require('http');

const apiUrl = 'http://localhost:3000/api/dashboard';

const req = http.get(apiUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const apiResponse = JSON.parse(data);
      
      if (apiResponse.success && apiResponse.data && apiResponse.data.coins) {
        console.log(`✅ API returned ${apiResponse.data.coins.length} coins\n`);
        
        // Show first 5 coins with change_today
        const coinsWithChange = apiResponse.data.coins
          .filter(c => c.change_today !== null)
          .slice(0, 5);
        
        if (coinsWithChange.length > 0) {
          console.log('API Response - First 5 coins with change_today:');
          coinsWithChange.forEach(coin => {
            console.log(`  • ${coin.symbol}: ${coin.change_today > 0 ? '+' : ''}${coin.change_today.toFixed(2)}%`);
          });
        } else {
          console.log('⚠️  No coins with change_today in API response');
        }
        
        // Compare with our calculation
        if (commonSymbols.length > 0 && coinsWithChange.length > 0) {
          console.log('\n🔄 Comparison (Our Calculation vs API):');
          console.log('-'.repeat(80));
          
          commonSymbols.slice(0, 3).forEach(symbol => {
            const apiCoin = apiResponse.data.coins.find(c => c.symbol === symbol);
            if (apiCoin && apiCoin.change_today !== null) {
              const ourCalc = ((latestPriceMap[symbol].price - startPriceMap[symbol].price) / startPriceMap[symbol].price) * 100;
              const apiValue = apiCoin.change_today;
              const diff = Math.abs(ourCalc - apiValue);
              
              console.log(`${symbol}:`);
              console.log(`  Our calculation: ${ourCalc > 0 ? '+' : ''}${ourCalc.toFixed(4)}%`);
              console.log(`  API response:    ${apiValue > 0 ? '+' : ''}${apiValue.toFixed(4)}%`);
              console.log(`  Difference:      ${diff.toFixed(6)}% ${diff < 0.01 ? '✅' : '⚠️'}`);
              console.log('');
            }
          });
        }
      } else {
        console.log('❌ API response format unexpected:', apiResponse);
      }
    } catch (err) {
      console.error('❌ Error parsing API response:', err.message);
    }
    
    db.close();
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completed');
  });
});

req.on('error', (err) => {
  console.error('❌ Error fetching API:', err.message);
  console.log('\n💡 Make sure the API server is running on port 8787');
  db.close();
});

req.setTimeout(5000, () => {
  console.error('❌ API request timeout');
  req.destroy();
  db.close();
});
