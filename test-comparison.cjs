const Database = require('better-sqlite3');
const path = require('path');
const http = require('http');

const dbPath = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject', '3c9bc9ebbf8d47b6582e4d8b0a036070724f940ae907dc856bcd6db3600bc2d6.sqlite');
const db = new Database(dbPath);

console.log('🔍 Daily Change Calculation Verification\n');
console.log('='.repeat(80));

const now = new Date();
const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
const today = beijingTime.toISOString().split('T')[0];

console.log(`📅 Today: ${today}`);
console.log(`⏰ Current Beijing time: ${beijingTime.toISOString().replace('T', ' ').split('.')[0]}`);
console.log('='.repeat(80));

// Get today's start prices
const todayStartQuery = `
  WITH RankedKlines AS (
    SELECT 
      symbol,
      open as price,
      ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY open_time ASC) as rn
    FROM kline_data
    WHERE timeframe = '5m'
    AND date(datetime(open_time/1000, 'unixepoch'), '+8 hours') = ?
  )
  SELECT symbol, price
  FROM RankedKlines
  WHERE rn = 1
  ORDER BY symbol
`;

const todayStartResults = db.prepare(todayStartQuery).all(today);
const startPriceMap = {};
todayStartResults.forEach(row => {
  startPriceMap[row.symbol] = row.price;
});

// Get latest prices
const latestPricesQuery = `
  WITH RankedKlines AS (
    SELECT 
      symbol,
      close as price,
      ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY close_time DESC) as rn
    FROM kline_data
    WHERE timeframe = '5m'
  )
  SELECT symbol, price
  FROM RankedKlines
  WHERE rn = 1
  ORDER BY symbol
`;

const latestResults = db.prepare(latestPricesQuery).all();
const latestPriceMap = {};
latestResults.forEach(row => {
  latestPriceMap[row.symbol] = row.price;
});

// Calculate our expected values
const ourCalculations = {};
Object.keys(startPriceMap).forEach(symbol => {
  if (latestPriceMap[symbol]) {
    const startPrice = startPriceMap[symbol];
    const currentPrice = latestPriceMap[symbol];
    ourCalculations[symbol] = {
      startPrice,
      currentPrice,
      changeToday: ((currentPrice - startPrice) / startPrice) * 100
    };
  }
});

console.log(`\n✅ Calculated ${Object.keys(ourCalculations).length} symbols\n`);

// Fetch API response
const apiUrl = 'http://localhost:3000/api/dashboard';
const req = http.get(apiUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const apiResponse = JSON.parse(data);
      
      if (apiResponse.coinDetails) {
        console.log('📊 Comparison Table:\n');
        console.log('Symbol'.padEnd(8) + 'Start Price'.padEnd(15) + 'Current Price'.padEnd(16) + 'Our Calc'.padEnd(12) + 'API Value'.padEnd(12) + 'Match');
        console.log('-'.repeat(80));
        
        let matches = 0;
        let mismatches = 0;
        let nullInAPI = 0;
        
        apiResponse.coinDetails.forEach(coin => {
          if (ourCalculations[coin.symbol]) {
            const our = ourCalculations[coin.symbol];
            const apiValue = coin.change_today;
            
            if (apiValue === null) {
              nullInAPI++;
              console.log(
                coin.symbol.padEnd(8) +
                our.startPrice.toFixed(4).padEnd(15) +
                our.currentPrice.toFixed(4).padEnd(16) +
                our.changeToday.toFixed(2).padEnd(12) +
                'null'.padEnd(12) +
                '⚠️  NULL'
              );
            } else {
              const diff = Math.abs(our.changeToday - apiValue);
              const isMatch = diff < 0.01; // Within 0.01% tolerance
              
              if (isMatch) {
                matches++;
              } else {
                mismatches++;
              }
              
              console.log(
                coin.symbol.padEnd(8) +
                our.startPrice.toFixed(4).padEnd(15) +
                our.currentPrice.toFixed(4).padEnd(16) +
                our.changeToday.toFixed(2).padEnd(12) +
                apiValue.toFixed(2).padEnd(12) +
                (isMatch ? '✅' : `❌ (diff: ${diff.toFixed(4)}%)`)
              );
            }
          }
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('📈 Summary:');
        console.log(`  ✅ Matches: ${matches}`);
        console.log(`  ❌ Mismatches: ${mismatches}`);
        console.log(`  ⚠️  NULL in API: ${nullInAPI}`);
        
        if (mismatches === 0 && nullInAPI === 0) {
          console.log('\n🎉 Perfect! All calculations match the API!');
        } else if (nullInAPI > 0) {
          console.log(`\n⚠️  There are ${nullInAPI} coins with NULL change_today in API`);
          console.log('     This might indicate missing K-line data for those symbols.');
        } else {
          console.log('\n❌ There are calculation mismatches!');
        }
        
        // Show which coins have NULL
        if (nullInAPI > 0) {
          console.log('\n🔍 Coins with NULL change_today:');
          apiResponse.coinDetails.forEach(coin => {
            if (coin.change_today === null) {
              console.log(`  • ${coin.symbol}`);
            }
          });
        }
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
    
    db.close();
  });
});

req.on('error', (err) => {
  console.error('❌ API Error:', err.message);
  db.close();
});

req.setTimeout(5000);
