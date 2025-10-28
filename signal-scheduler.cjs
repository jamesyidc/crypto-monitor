/**
 * 买卖点信号生成调度器
 * 功能：每1分钟自动检测所有币种的买卖点信号并发送Telegram通知
 */

const axios = require('axios');

// 配置参数
const CONFIG = {
  apiEndpoint: 'http://localhost:3000/api/signal/all',
  interval: 60 * 1000, // 1分钟 = 60秒
  enableTelegram: true, // 开启Telegram通知
};

// 状态追踪
let executionCount = 0;
let intervalId = null;

// 执行信号检测
async function executeSignalDetection() {
  executionCount++;
  const startTime = Date.now();
  const beijingTime = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

  console.log('\n');
  console.log('================================================================================');
  console.log(`⏰ [${beijingTime} 北京时间] 第 ${executionCount} 次信号检测开始...`);
  console.log('================================================================================');

  try {
    // 调用信号检测API（开启Telegram通知）
    const response = await axios.get(CONFIG.apiEndpoint, {
      params: {
        telegram: CONFIG.enableTelegram ? 'true' : 'false'
      },
      timeout: 120000 // 2分钟超时
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (response.data.success) {
      const summary = response.data.summary;
      console.log(`✅ 信号检测完成 (耗时: ${duration}秒)`);
      console.log(`   📊 检测币种: ${summary.totalSymbols}`);
      console.log(`   🎯 总信号数: ${summary.totalSignals}`);
      console.log(`   🟢 买入信号: ${summary.totalBuySignals}`);
      console.log(`   🔴 卖出信号: ${summary.totalSellSignals}`);
      
      // 显示已发送的Telegram消息数量
      if (response.data.telegramSent !== undefined) {
        console.log(`   📤 Telegram: 已发送 ${response.data.telegramSent} 条通知`);
      }

      // 显示顶级信号（如果有）
      if (summary.topBuySignals && summary.topBuySignals.length > 0) {
        console.log(`   🌟 顶级买入: ${summary.topBuySignals.slice(0, 3).map(s => s.symbol).join(', ')}`);
      }
      if (summary.topSellSignals && summary.topSellSignals.length > 0) {
        console.log(`   ⚠️  顶级卖出: ${summary.topSellSignals.slice(0, 3).map(s => s.symbol).join(', ')}`);
      }
    } else {
      console.log(`❌ 信号检测失败 (耗时: ${duration}秒): ${response.data.error || '未知错误'}`);
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ 信号检测异常 (耗时: ${duration}秒):`);
    console.log(`   错误信息: ${error.message}`);
    console.log(`   API端点: ${CONFIG.apiEndpoint}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  提示: 服务可能未启动或端口不可用');
    }
  }

  console.log('\n');
}

// 启动调度器
function startScheduler() {
  console.log('\n');
  console.log('🚀 买卖点信号检测调度器启动');
  console.log(`   📡 API端点: ${CONFIG.apiEndpoint}`);
  console.log(`   ⏱️  检测间隔: ${CONFIG.interval / 1000} 秒 (1 分钟)`);
  console.log(`   📤 Telegram: ${CONFIG.enableTelegram ? '✅ 已开启' : '❌ 已关闭'}`);
  console.log(`   🕐 启动时间: ${new Date().toISOString()}`);
  console.log('================================================================================');
  console.log('\n');

  // 立即执行第一次
  executeSignalDetection();

  // 设置定时任务
  intervalId = setInterval(executeSignalDetection, CONFIG.interval);
}

// 停止调度器
function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  console.log('\n');
  console.log('🛑 收到退出信号，正在关闭调度器...');
  console.log(`   总共执行了 ${executionCount} 次信号检测`);
  console.log('\n');
  process.exit(0);
}

// 处理退出信号
process.on('SIGINT', stopScheduler);
process.on('SIGTERM', stopScheduler);

// 启动调度器
startScheduler();
