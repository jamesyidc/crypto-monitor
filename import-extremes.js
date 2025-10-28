#!/usr/bin/env node

/**
 * 导入币种极值数据
 * 
 * 用途：批量导入或覆盖 price_extremes 表的数据
 * 数据源：import-extremes.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api/extremes/import';
const DATA_FILE = path.join(__dirname, 'import-extremes.json');

async function importExtremes() {
  console.log('📥 开始导入币种极值数据...\n');
  
  // 读取数据文件
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ 数据文件不存在:', DATA_FILE);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`📊 共有 ${data.length} 个币种待导入\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // 逐个导入
  for (const coin of data) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coin)
      });
      
      const result = await response.json();
      
      if (result.success) {
        successCount++;
        console.log(`✅ ${coin.symbol.padEnd(8)} - ATH: ${coin.ath.toFixed(8).padStart(15)} (${coin.new_high_count}次) | ATL: ${coin.atl.toFixed(8).padStart(15)} (${coin.new_low_count}次)`);
      } else {
        failCount++;
        console.error(`❌ ${coin.symbol.padEnd(8)} - 导入失败: ${result.error}`);
      }
    } catch (error) {
      failCount++;
      console.error(`❌ ${coin.symbol.padEnd(8)} - 请求失败: ${error.message}`);
    }
  }
  
  console.log('\n📊 导入统计:');
  console.log(`   ✅ 成功: ${successCount} 个`);
  console.log(`   ❌ 失败: ${failCount} 个`);
  console.log(`   📈 总计: ${data.length} 个`);
  
  if (failCount === 0) {
    console.log('\n🎉 所有数据导入成功！');
  } else {
    console.log('\n⚠️  部分数据导入失败，请检查日志');
  }
}

// 执行导入
importExtremes().catch(error => {
  console.error('❌ 导入过程出错:', error);
  process.exit(1);
});
