#!/usr/bin/env node

const axios = require('axios');

async function test() {
  try {
    console.log('🔍 测试首页数据加载...\n');
    
    // 1. 测试 dashboard API
    const dashboardResponse = await axios.get('http://localhost:3000/api/dashboard');
    const coinDetails = dashboardResponse.data.coinDetails;
    
    console.log('📊 Dashboard API 返回的第一个币种数据:');
    const firstCoin = coinDetails[0];
    console.log(`币种: ${firstCoin.symbol}`);
    console.log(`价格: $${firstCoin.price}`);
    console.log(`当日涨幅 (change_today): ${firstCoin.change_today}%`);
    console.log(`本轮涨跌 (change_percent): ${firstCoin.change_percent}%`);
    console.log(`24h涨幅 (change_24h): ${firstCoin.change_24h}%`);
    console.log('');
    
    // 2. 测试 compare API
    const compareResponse = await axios.get('http://localhost:3000/api/compare');
    const compareData = compareResponse.data.coins;
    
    console.log('📊 Compare API 返回的数据:');
    const tao = compareData.find(c => c.symbol === 'TAO');
    if (tao) {
      console.log(`币种: ${tao.symbol}`);
      console.log(`当前价: $${tao.currentPrice}`);
      console.log(`最高占比 (highRatio): ${tao.highRatio.toFixed(2)}%`);
      console.log(`最低占比 (lowRatio): ${tao.lowRatio.toFixed(2)}%`);
    } else {
      console.log('❌ 未找到 TAO 数据');
    }
    console.log('');
    
    // 3. 合并数据检查
    console.log('✅ 数据合并测试:');
    const firstCoinSymbol = firstCoin.symbol;
    const compareItem = compareData.find(c => c.symbol === firstCoinSymbol);
    
    if (compareItem) {
      console.log(`${firstCoinSymbol} 数据合并成功:`);
      console.log(`  - 当日涨幅: ${firstCoin.change_today}%`);
      console.log(`  - 最高占比: ${compareItem.highRatio.toFixed(2)}%`);
      console.log(`  - 最低占比: ${compareItem.lowRatio.toFixed(2)}%`);
      console.log(`  - 这轮价格: $${firstCoin.price.toFixed(6)}`);
    } else {
      console.log(`❌ ${firstCoinSymbol} 在 compareData 中找不到`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

test();
