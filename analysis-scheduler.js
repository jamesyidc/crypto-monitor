/**
 * 价格分析定时调度器
 * 每5分钟自动执行一次价格分析
 */

const ANALYSIS_ENDPOINT = process.env.ANALYSIS_ENDPOINT || 'http://localhost:3000/api/analyze';
const ANALYSIS_INTERVAL = parseInt(process.env.ANALYSIS_INTERVAL || '300000', 10); // 默认5分钟

let isRunning = false;

async function executeAnalysis() {
  if (isRunning) {
    console.log('⚠️  上一次分析仍在执行中，跳过本次...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  const beijingTime = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  
  console.log(`\n⏰ [${beijingTime} 北京时间] 开始自动执行价格分析...`);

  try {
    const response = await fetch(ANALYSIS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.success) {
      console.log(`✅ 价格分析完成 (耗时: ${duration}秒)`);
      console.log(`   📊 轮次时间: ${result.roundTime}`);
      console.log(`   🟢 上涨数量: ${result.greenCount}`);
      console.log(`   🔴 下跌数量: ${result.redCount}`);
      console.log(`   📈 急涨数量: ${result.surgeCount}`);
      console.log(`   📉 急跌数量: ${result.crashCount}`);
      console.log(`   ⚠️  风险警告: ${result.riskAlertCount}`);
    } else {
      console.error(`❌ 价格分析失败: ${result.error || '未知错误'}`);
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 价格分析异常 (耗时: ${duration}秒):`, error.message);
  } finally {
    isRunning = false;
  }
}

// 立即执行一次
console.log(`🚀 启动价格分析定时任务 (间隔: ${ANALYSIS_INTERVAL / 1000}秒 = ${ANALYSIS_INTERVAL / 60000}分钟)`);
console.log(`📍 API端点: ${ANALYSIS_ENDPOINT}`);
executeAnalysis();

// 设置定时器
setInterval(() => {
  executeAnalysis();
}, ANALYSIS_INTERVAL);

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 收到退出信号，停止价格分析定时任务...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，停止价格分析定时任务...');
  process.exit(0);
});
