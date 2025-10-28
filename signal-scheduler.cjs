/**
 * 买卖点信号生成调度器
 * 功能：定期调用信号生成API，检测并保存买卖点信号
 * 频率：每1分钟执行一次
 */

// 配置
const API_ENDPOINT = 'http://localhost:3000/api/signal/all';
const INTERVAL = 60 * 1000; // 1分钟 = 60秒 = 60000毫秒
const TELEGRAM_ENABLED = false; // 是否发送Telegram通知

// 统计
let executionCount = 0;
let lastSuccessTime = null;
let lastErrorTime = null;

// 格式化北京时间
function getBeijingTime() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().replace('T', ' ').substring(0, 19);
}

// 执行信号生成
async function generateSignals() {
  executionCount++;
  const startTime = Date.now();
  
  console.log('\n================================================================================');
  console.log(`⏰ [${getBeijingTime()} 北京时间] 第 ${executionCount} 次信号生成开始...`);
  console.log('================================================================================\n');

  try {
    // 调用信号生成API
    const url = `${API_ENDPOINT}?telegram=${TELEGRAM_ENABLED}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    lastSuccessTime = getBeijingTime();

    if (result.success) {
      const summary = result.summary;
      
      console.log(`✅ 信号生成完成 (耗时: ${duration}秒)`);
      console.log(`   📊 币种总数: ${summary.totalSymbols}`);
      console.log(`   📈 总信号数: ${summary.totalSignals}`);
      console.log(`   🟢 买入信号: ${summary.totalBuySignals}`);
      console.log(`   🔴 卖出信号: ${summary.totalSellSignals}`);
      
      // 显示顶部信号
      if (summary.topBuySignals && summary.topBuySignals.length > 0) {
        console.log(`   🎯 顶部买入: ${summary.topBuySignals.slice(0, 3).map(s => s.symbol).join(', ')}`);
      }
      if (summary.topSellSignals && summary.topSellSignals.length > 0) {
        console.log(`   🎯 顶部卖出: ${summary.topSellSignals.slice(0, 3).map(s => s.symbol).join(', ')}`);
      }
      
      console.log('');
    } else {
      throw new Error(result.error || '信号生成失败');
    }

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    lastErrorTime = getBeijingTime();
    
    console.error(`❌ 信号生成异常 (耗时: ${duration}秒):`);
    console.error(`   错误信息: ${error.message}`);
    console.error(`   API端点: ${API_ENDPOINT}`);
    console.error('');
  }
}

// 启动调度器
console.log('\n🚀 买卖点信号生成调度器启动');
console.log(`   📡 API端点: ${API_ENDPOINT}`);
console.log(`   ⏱️  生成间隔: ${INTERVAL / 1000} 秒 (1 分钟)`);
console.log(`   📢 Telegram通知: ${TELEGRAM_ENABLED ? '开启' : '关闭'}`);
console.log(`   🕐 启动时间: ${new Date().toISOString()}`);
console.log('================================================================================\n');

// 立即执行第一次
generateSignals();

// 设置定时任务
const intervalId = setInterval(generateSignals, INTERVAL);

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n🛑 收到退出信号，正在关闭调度器...');
  console.log(`   总共执行了 ${executionCount} 次信号生成`);
  console.log(`   最后成功: ${lastSuccessTime || '无'}`);
  console.log(`   最后错误: ${lastErrorTime || '无'}`);
  clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 收到终止信号，正在关闭调度器...');
  console.log(`   总共执行了 ${executionCount} 次信号生成`);
  clearInterval(intervalId);
  process.exit(0);
});
