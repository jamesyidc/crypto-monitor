/**
 * K线数据自动同步调度器
 * 用于本地开发环境，每5分钟自动同步K线数据
 * 
 * 使用方法：
 * node scheduler.js
 * 
 * 或使用PM2：
 * pm2 start scheduler.js --name kline-scheduler
 */

const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api/kline/sync/auto';
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '300000'); // 默认5分钟（300000毫秒）

let syncCount = 0;

/**
 * 执行同步
 */
async function executeSync() {
  syncCount++;
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`⏰ [${timestamp}] 第 ${syncCount} 次自动同步开始...`);
  console.log(`${'='.repeat(80)}`);

  try {
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
      console.log(`✅ K线数据同步成功！`);
      console.log(`   📊 统计信息：`);
      console.log(`      - 总币种数: ${result.summary?.total || 0}`);
      console.log(`      - 成功同步: ${result.summary?.success || 0}`);
      console.log(`      - 同步失败: ${result.summary?.failed || 0}`);
      console.log(`      - 耗时: ${duration} 秒`);
      
      // 显示失败的币种
      if (result.summary?.failed > 0) {
        const failedSymbols = result.results
          .filter((r) => !r.success)
          .map((r) => r.symbol)
          .join(', ');
        console.log(`   ⚠️  失败币种: ${failedSymbols}`);
      }
      
      console.log(`   ⏭️  下次同步时间: ${new Date(Date.now() + SYNC_INTERVAL).toISOString()}`);
    } else {
      console.error(`❌ K线数据同步失败: ${result.error}`);
      console.error(`   耗时: ${duration} 秒`);
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 同步请求异常 (耗时 ${duration}秒):`);
    console.error(`   错误信息: ${error.message}`);
    console.error(`   API端点: ${API_ENDPOINT}`);
  }
}

/**
 * 启动调度器
 */
function startScheduler() {
  console.log('\n🚀 K线数据自动同步调度器启动');
  console.log(`   📡 API端点: ${API_ENDPOINT}`);
  console.log(`   ⏱️  同步间隔: ${SYNC_INTERVAL / 1000} 秒 (${SYNC_INTERVAL / 60000} 分钟)`);
  console.log(`   🕐 启动时间: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);

  // 立即执行第一次同步
  executeSync();

  // 设置定时任务
  setInterval(() => {
    executeSync();
  }, SYNC_INTERVAL);
}

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n\n🛑 收到退出信号，正在关闭调度器...');
  console.log(`   总共执行了 ${syncCount} 次同步`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 收到终止信号，正在关闭调度器...');
  console.log(`   总共执行了 ${syncCount} 次同步`);
  process.exit(0);
});

// 启动
startScheduler();
