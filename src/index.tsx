import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'
import { CoinService } from './services/coinService'
import { AnalysisService } from './services/analysisService'
import { KlineService } from './services/klineService'
import { SignalService } from './services/signalService'
import { TelegramService } from './services/telegramService'

const app = new Hono<{ Bindings: Bindings }>()

// 启用 CORS
app.use('/api/*', cors())

// 静态文件服务
app.use('/static/*', serveStatic({ root: './public' }))

// API: 执行一轮分析
app.post('/api/analyze', async (c) => {
  const coinService = new CoinService(c.env.DB);
  const analysisService = new AnalysisService(coinService);
  
  const result = await analysisService.performRoundAnalysis();
  return c.json(result);
});

// API: 获取仪表板数据
app.get('/api/dashboard', async (c) => {
  const coinService = new CoinService(c.env.DB);
  const analysisService = new AnalysisService(coinService);
  
  const data = await analysisService.getDashboardData();
  return c.json(data);
});

// API: 获取所有币种
app.get('/api/coins', async (c) => {
  const coinService = new CoinService(c.env.DB);
  const coins = await coinService.getAllCoins();
  return c.json(coins);
});

// API: 获取历史轮次统计
app.get('/api/rounds', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const coinService = new CoinService(c.env.DB);
  const rounds = await coinService.getLatestRoundStats(limit);
  return c.json(rounds);
});

// ========== K线数据 API ==========

// API: 同步所有币种的 K线数据
app.post('/api/kline/sync', async (c) => {
  const klineService = new KlineService(c.env.DB);
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '300');
  
  const results = await klineService.syncAllKlineData(timeframe, limit);
  return c.json({ success: true, results });
});

// API: 获取单个币种的 K线数据
app.get('/api/kline/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '100');
  
  const klineService = new KlineService(c.env.DB);
  const data = await klineService.getKlineData(symbol, timeframe, limit);
  return c.json(data);
});

// API: 获取 K线统计信息
app.get('/api/kline/:symbol/stats', async (c) => {
  const symbol = c.req.param('symbol');
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '100');
  
  const klineService = new KlineService(c.env.DB);
  const stats = await klineService.getKlineStats(symbol, timeframe, limit);
  return c.json(stats);
});

// API: 获取多时间周期数据
app.get('/api/kline/:symbol/multi', async (c) => {
  const symbol = c.req.param('symbol');
  
  const klineService = new KlineService(c.env.DB);
  const data = await klineService.getMultiTimeframeData(symbol);
  return c.json(data);
});

// API: 获取 OKX 配置
app.get('/api/okx/config', async (c) => {
  const klineService = new KlineService(c.env.DB);
  const configs = await klineService.getAllOKXConfigs();
  return c.json(configs);
});

// API: 获取带技术指标的 K线数据
app.get('/api/kline/:symbol/indicators', async (c) => {
  const symbol = c.req.param('symbol');
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '300');
  
  try {
    const klineService = new KlineService(c.env.DB);
    const data = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
    return c.json({ success: true, ...data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// API: 批量获取多个币种的技术指标
app.post('/api/kline/indicators/batch', async (c) => {
  const body = await c.req.json();
  const symbols = body.symbols || [];
  const timeframe = body.timeframe || '5m';
  const limit = body.limit || 300;
  
  const klineService = new KlineService(c.env.DB);
  const results = await klineService.getMultiSymbolIndicators(symbols, timeframe, limit);
  return c.json({ success: true, results });
});

// API: 同步单个币种的48小时数据
app.post('/api/kline/:symbol/sync48h', async (c) => {
  const symbol = c.req.param('symbol');
  
  try {
    const klineService = new KlineService(c.env.DB);
    const result = await klineService.sync48HoursData(symbol);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// API: 批量同步所有币种的48小时数据
app.post('/api/kline/sync48h/all', async (c) => {
  const klineService = new KlineService(c.env.DB);
  const results = await klineService.syncAll48HoursData();
  return c.json({ success: true, results });
});

// API: 获取单个币种的 OKX 配置
app.get('/api/okx/config/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  const klineService = new KlineService(c.env.DB);
  const config = await klineService.getOKXConfig(symbol);
  return c.json(config);
});

// ========== 买卖点信号 API ==========

// API: 获取所有币种的买卖点信号
app.get('/api/signal/all', async (c) => {
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '100');
  
  try {
    const klineService = new KlineService(c.env.DB);
    const signalService = new SignalService(c.env.DB);
    
    // 获取所有币种配置
    const configs: any = await klineService.getAllOKXConfigs();
    const symbols = configs.map((config: any) => config.symbol);
    
    // 检测所有币种的买卖点
    const results = await signalService.detectMultiSymbolSignals(
      symbols,
      async (symbol: string) => {
        const result = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
        return result.data;
      }
    );
    
    // 生成摘要
    const summary = signalService.generateSignalSummary(results);
    
    // 保存所有信号到数据库
    for (const [symbol, result] of Object.entries(results)) {
      if ((result as any).success) {
        const signals = (result as any).signals || [];
        const alerts = (result as any).alerts || [];
        await signalService.saveSignalsAndAlerts(signals, alerts);
      }
    }
    
    return c.json({
      success: true,
      summary,
      results
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取过去24小时的买卖点信号
app.get('/api/signal/24h', async (c) => {
  const timeframe = c.req.query('timeframe') || '5m';
  
  try {
    const klineService = new KlineService(c.env.DB);
    const signalService = new SignalService(c.env.DB);
    
    // 计算24小时需要的K线数量
    // 5分钟: 24 * 12 = 288根
    // 15分钟: 24 * 4 = 96根
    // 1小时: 24根
    const limitMap: { [key: string]: number } = {
      '5m': 288,
      '15m': 96,
      '1H': 24,
      '4H': 6,
      '1D': 1
    };
    const limit = limitMap[timeframe] || 288;
    
    // 获取所有币种配置
    const configs: any = await klineService.getAllOKXConfigs();
    const symbols = configs.map((config: any) => config.symbol);
    
    // 检测所有币种的买卖点
    const results = await signalService.detectMultiSymbolSignals(
      symbols,
      async (symbol: string) => {
        const result = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
        return result.data;
      }
    );
    
    // 生成摘要
    const summary = signalService.generateSignalSummary(results);
    
    // 保存所有信号到数据库
    for (const [symbol, result] of Object.entries(results)) {
      if ((result as any).success) {
        const signals = (result as any).signals || [];
        const alerts = (result as any).alerts || [];
        await signalService.saveSignalsAndAlerts(signals, alerts);
      }
    }
    
    return c.json({
      success: true,
      timeRange: '24h',
      timeframe,
      barsAnalyzed: limit,
      summary,
      results
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取历史信号数据（从数据库读取）
// 注意：必须放在 :symbol 路由之前，否则会被 :symbol 匹配
app.get('/api/signal/history', async (c) => {
  const hours = parseInt(c.req.query('hours') || '24');
  const limit = parseInt(c.req.query('limit') || '1000');
  const symbolFilter = c.req.query('symbol');
  const typeFilter = c.req.query('type'); // 'BUY' 或 'SELL'
  
  try {
    const signalService = new SignalService(c.env.DB);
    
    // 获取买卖点信号
    let tradingSignals = await signalService.getRecentTradingSignals(hours, limit);
    
    // 获取预警信号
    let alertSignals = await signalService.getRecentAlertSignals(hours, limit);
    
    // 应用过滤器
    if (symbolFilter) {
      tradingSignals = tradingSignals.filter((s: any) => s.symbol === symbolFilter);
      alertSignals = alertSignals.filter((a: any) => a.symbol === symbolFilter);
    }
    
    if (typeFilter) {
      tradingSignals = tradingSignals.filter((s: any) => s.signal_type === typeFilter);
    }
    
    // 统计信息
    const stats = {
      tradingSignals: {
        total: tradingSignals.length,
        buy: tradingSignals.filter((s: any) => s.signal_type === 'BUY').length,
        sell: tradingSignals.filter((s: any) => s.signal_type === 'SELL').length
      },
      alertSignals: {
        total: alertSignals.length
      },
      timeRange: {
        hours,
        from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    };
    
    return c.json({
      success: true,
      stats,
      tradingSignals,
      alertSignals
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取单个币种的买卖点信号（自动发送Telegram预警）
app.get('/api/signal/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '100');
  const sendTelegram = c.req.query('telegram') !== 'false'; // 默认发送，除非明确设置为false
  
  try {
    const klineService = new KlineService(c.env.DB);
    const signalService = new SignalService(c.env.DB);
    
    // 获取带指标的K线数据
    const result = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
    
    // 检测买卖点
    const detection = signalService.detectTradingSignals(result.data);
    
    // 保存信号到数据库
    const signals = detection.signals || [];
    const alerts = detection.alerts || [];
    await signalService.saveSignalsAndAlerts(signals, alerts);
    
    // 如果有预警且需要发送到Telegram
    let telegramStatus = { sent: 0, failed: 0, skipped: false };
    if (sendTelegram && detection.alerts && detection.alerts.length > 0) {
      try {
        // 初始化Telegram服务
        const telegramService = new TelegramService(
          '8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0',
          '-1003227444260'
        );
        
        // 创建K线数据映射表
        const klineDataMap = new Map();
        result.data.forEach((k: any) => {
          klineDataMap.set(k.index, k);
        });
        
        // 批量发送预警到Telegram
        const sentCount = await telegramService.sendMultipleAlerts(detection.alerts, klineDataMap);
        telegramStatus.sent = sentCount;
        telegramStatus.failed = detection.alerts.length - sentCount;
        
        console.log(`📤 ${symbol} 预警已发送到Telegram: ${sentCount}/${detection.alerts.length}`);
      } catch (telegramError: any) {
        console.error(`❌ ${symbol} Telegram发送失败:`, telegramError);
        telegramStatus.failed = detection.alerts.length;
      }
    } else if (!sendTelegram) {
      telegramStatus.skipped = true;
    }
    
    return c.json({
      success: true,
      symbol,
      timeframe,
      telegram: telegramStatus,
      ...detection
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// 比价比对页面
app.get('/compare', (c) => {
  return c.redirect('/compare.html');
});

// K线查询页面
app.get('/kline', (c) => {
  return c.redirect('/kline.html');
});

// 买卖点信号页面
app.get('/signal', (c) => {
  return c.redirect('/signal.html');
});

// API: 测试Telegram连接
app.get('/api/telegram/test', async (c) => {
  try {
    const telegramService = new TelegramService(
      '8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0',
      '-1003227444260'
    );
    
    // 测试连接
    const connected = await telegramService.testConnection();
    
    if (!connected) {
      return c.json({
        success: false,
        message: 'Bot连接成功，但无法验证Chat ID'
      });
    }
    
    // 尝试发送测试消息
    const testResponse = await fetch('https://api.telegram.org/bot8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: '-1003227444260',
        text: '🧪 测试消息 - Telegram连接成功！'
      })
    });
    
    const result = await testResponse.json();
    
    return c.json({
      success: result.ok,
      result,
      help: result.ok ? null : {
        message: '请确保：',
        steps: [
          '1. Bot (@jamesyi_bot) 已添加到群组/频道',
          '2. Bot在群组中有发送消息权限',
          '3. Chat ID正确（-1003227444260）',
          '4. 如果是频道，需要Bot是管理员'
        ]
      }
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// 首页
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>加密货币实时监控系统</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .coin-row { transition: background-color 0.3s; }
            .coin-row:hover { background-color: #f3f4f6; }
            .green-text { color: #10b981; font-weight: bold; }
            .red-text { color: #ef4444; font-weight: bold; }
            .star-filled { color: #000; }
            .star-empty { color: #000; border: 1px solid #000; border-radius: 50%; }
            .status-badge { padding: 4px 12px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
            .level-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
            .level-1 { background: #fef3c7; color: #92400e; }
            .level-2 { background: #fde68a; color: #78350f; }
            .level-3 { background: #bfdbfe; color: #1e40af; }
            .level-4 { background: #ddd6fe; color: #5b21b6; }
            .level-5 { background: #d1fae5; color: #065f46; }
            .level-6 { background: #e5e7eb; color: #374151; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <div class="container mx-auto px-4 py-6">
            <!-- 标题 -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                    加密货币实时监控系统
                </h1>
                <p class="text-gray-600">29种主流币种 · 10分钟自动更新 · 美元计价</p>
            </div>

            <!-- 控制面板 -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-cog mr-2"></i>控制中心
                    </h2>
                    <div class="flex gap-2">
                        <a href="/compare.html" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-balance-scale mr-2"></i>比价比对
                        </a>
                        <a href="/signal.html" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-signal mr-2"></i>买卖点信号
                        </a>
                        <a href="/kline.html" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-chart-candlestick mr-2"></i>K线查询
                        </a>
                        <button id="analyzeBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-play mr-2"></i>执行分析
                        </button>
                        <button id="autoToggleBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-pause mr-2"></i>暂停自动
                        </button>
                    </div>
                </div>
                <div id="statusMessage" class="hidden p-4 rounded-lg mb-4"></div>
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <div>
                        <i class="fas fa-info-circle mr-2"></i>
                        数据源: CoinGecko API · 自动分析: 每10分钟一轮 · 点击"K线查询"查看OKX历史K线
                    </div>
                    <div id="countdownDisplay" class="text-blue-600 font-semibold">
                        <i class="fas fa-clock mr-1"></i>
                        下次分析: <span id="countdown">--:--</span>
                    </div>
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <!-- 基础统计 -->
                <div id="statsCards" class="col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- 统计卡片将在这里动态生成 -->
                </div>
                
                <!-- 急涨急跌统计 -->
                <div class="col-span-2 bg-white rounded-lg shadow-md p-4">
                    <h3 class="text-sm font-bold text-gray-700 mb-3 border-b pb-2">
                        <i class="fas fa-bolt mr-1"></i>急涨急跌统计
                    </h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">本轮急涨:</span>
                            <span id="currentSurge" class="font-bold text-green-600">-</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">本轮急跌:</span>
                            <span id="currentCrash" class="font-bold text-red-600">-</span>
                        </div>
                        <div class="flex justify-between items-center border-t pt-2">
                            <span class="text-gray-600">总急涨:</span>
                            <span id="totalSurge" class="font-bold text-green-600">-</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">总急跌:</span>
                            <span id="totalCrash" class="font-bold text-red-600">-</span>
                        </div>
                        <div class="flex justify-between items-center border-t pt-2">
                            <span class="text-gray-600">差值:</span>
                            <span id="surgeDiff" class="font-bold text-blue-600">-</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">比值:</span>
                            <span id="surgeRatio" class="font-bold text-purple-600">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 市场趋势 -->
            <div id="marketTrend" class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-area mr-2"></i>市场趋势分析
                </h2>
                <div id="trendContent" class="text-gray-600 text-center py-8">
                    暂无数据，请执行第一次分析
                </div>
            </div>

            <!-- 币种列表 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-coins mr-2"></i>实时币价监控
                </h2>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b-2 border-gray-200 text-xs">
                                <th class="text-center py-2 px-1">序号</th>
                                <th class="text-left py-2 px-1">币名</th>
                                <th class="text-center py-2 px-1">涨跌</th>
                                <th class="text-center py-2 px-1">急涨≥1%</th>
                                <th class="text-center py-2 px-1">急跌≤-1%</th>
                                <th class="text-right py-2 px-1">更新时间</th>
                                <th class="text-right py-2 px-1">历史高价</th>
                                <th class="text-right py-2 px-1">高的时间</th>
                                <th class="text-right py-2 px-1">涨幅</th>
                                <th class="text-right py-2 px-1">24涨幅</th>
                                <th class="text-center py-2 px-1">++</th>
                                <th class="text-center py-2 px-1">--</th>
                                <th class="text-center py-2 px-1">排行</th>
                                <th class="text-center py-2 px-1">优先级</th>
                                <th class="text-right py-2 px-1">当前价格</th>
                                <th class="text-right py-2 px-1">最高占比</th>
                                <th class="text-right py-2 px-1">最低占比</th>
                                <th class="text-center py-2 px-1">异动</th>
                            </tr>
                        </thead>
                        <tbody id="coinTableBody">
                            <tr>
                                <td colspan="18" class="text-center py-8 text-gray-500">
                                    加载中...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app
