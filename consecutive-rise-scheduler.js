#!/usr/bin/env node

/**
 * 连续上涨占优统计调度器
 * 每15分钟自动执行一次连续上涨占优分析
 * 
 * 环境变量：
 * - API_ENDPOINT: API端点地址（默认: http://localhost:3000/api/consecutive-rise/analyze-all）
 * - INTERVAL: 执行间隔（毫秒，默认: 900000 = 15分钟）
 */

const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api/consecutive-rise/analyze-history';
const INTERVAL = parseInt(process.env.INTERVAL || '900000'); // 15分钟

console.log('🔄 连续上涨占优统计调度器启动');
console.log(`📡 API端点: ${API_ENDPOINT}`);
console.log(`⏰ 执行间隔: ${INTERVAL}ms (${INTERVAL / 60000}分钟)`);
console.log('');

let isRunning = false;
let successCount = 0;
let failureCount = 0;

async function executeAnalysis() {
  if (isRunning) {
    console.log('⚠️  上一次执行尚未完成，跳过本次执行');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    console.log(`[${timestamp}] 🚀 开始执行连续上涨占优分析...`);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      successCount++;
      console.log(`[${timestamp}] ✅ 分析完成 (${duration}秒)`);
      console.log(`📊 已分析币种数: ${result.analyzed || 0}`);
      console.log(`📈 成功次数: ${successCount} | 失败次数: ${failureCount}`);
      
      // 显示部分结果（如果有）
      if (result.results && result.results.length > 0) {
        console.log('💡 示例结果:');
        result.results.slice(0, 3).forEach(r => {
          console.log(`   ${r.symbol}: max_streak=${r.max_streak}, current_streak=${r.current_streak}`);
        });
      }
    } else {
      throw new Error(result.error || '分析失败');
    }

  } catch (error) {
    failureCount++;
    console.error(`[${timestamp}] ❌ 执行失败:`, error.message);
    console.log(`📈 成功次数: ${successCount} | 失败次数: ${failureCount}`);
  } finally {
    isRunning = false;
    console.log('');
  }
}

// 启动时立即执行一次
console.log('🎯 启动时立即执行一次...\n');
executeAnalysis();

// 然后按间隔执行
setInterval(executeAnalysis, INTERVAL);

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 收到退出信号，正在关闭调度器...');
  console.log(`📊 最终统计: 成功 ${successCount} 次, 失败 ${failureCount} 次`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭调度器...');
  console.log(`📊 最终统计: 成功 ${successCount} 次, 失败 ${failureCount} 次`);
  process.exit(0);
});
