import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'
import { CoinService } from './services/coinService'
import { AnalysisService } from './services/analysisService'
import { KlineService } from './services/klineService'
import { SignalService } from './services/signalService'
import { TelegramService } from './services/telegramService'
import { PositionService } from './services/positionService'
import { SimulatedTradingService } from './services/simulatedTradingService'
import { PatternService } from './services/patternService'
import { SettingsService } from './services/settingsService'

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

// API: 获取历史数据(回看首页数据)
app.get('/api/history', async (c) => {
  const roundTime = c.req.query('round_time');
  const limit = parseInt(c.req.query('limit') || '20');
  
  try {
    const coinService = new CoinService(c.env.DB);
    const analysisService = new AnalysisService(coinService);
    
    if (roundTime) {
      // 获取指定轮次的完整数据
      const data = await analysisService.getDashboardDataByRound(roundTime);
      return c.json(data);
    } else {
      // 获取最近N轮的列表
      const rounds = await coinService.getLatestRoundStats(limit);
      return c.json({ rounds });
    }
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 时间调试信息（显示北京时间逻辑）
app.get('/api/debug/time', async (c) => {
  const { debugTimeInfo, getBeijingDateString, getBeijingTodayStart, getBeijingYesterday, getBeijingDateTimeString } = await import('./utils/timeUtils');
  
  return c.json({
    utc: {
      now: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    },
    beijing: {
      now: getBeijingDateTimeString(),
      date: getBeijingDateString(),
      todayStart: getBeijingTodayStart(),
      yesterday: getBeijingYesterday()
    },
    explanation: '所有数据清零和统计都基于北京时间（UTC+8），0点为北京时间0点'
  });
});

// 🆕 API: 手动执行每日数据清零（测试用）
app.post('/api/debug/reset', async (c) => {
  try {
    const coinService = new CoinService(c.env.DB);
    await coinService.resetAllDailyData();
    return c.json({ success: true, message: '每日数据清零完成（手动触发）' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取比价数据（动态计算占比，极值和计次会自动更新）
app.get('/api/compare', async (c) => {
  try {
    const coinService = new CoinService(c.env.DB);
    
    // 获取所有极值数据（包含计次）
    const extremes: any = await coinService.getAllPriceExtremes();
    
    // 获取最新的币种详情（当前价格）
    const latestRounds: any = await coinService.getLatestRoundStats(1);
    const latestRound = latestRounds[0];
    
    if (!latestRound) {
      return c.json({ success: false, error: '暂无数据' }, 404);
    }
    
    const coinDetails: any = await coinService.getLatestCoinDetails(latestRound.round_time);
    
    // 组合数据：动态计算占比
    const coins = extremes.map((extreme: any) => {
      const detail = coinDetails.find((d: any) => d.symbol === extreme.symbol);
      const currentPrice = detail ? detail.price : 0;
      
      // 实时计算占比
      // 最高占比 = (当前价格 / 历史最高价) × 100%
      const highRatio = extreme.all_time_high > 0 
        ? (currentPrice / extreme.all_time_high) * 100 
        : 0;
      
      // 最低占比 = (当前价格 / 历史最低价) × 100%
      const lowRatio = extreme.all_time_low > 0 
        ? (currentPrice / extreme.all_time_low) * 100 
        : 0;
      
      return {
        symbol: extreme.symbol,
        highPrice: extreme.all_time_high,
        highCount: extreme.high_count,
        lowPrice: extreme.all_time_low,
        lowCount: extreme.low_count,
        currentPrice: currentPrice,
        highRatio: highRatio,  // 动态计算
        lowRatio: lowRatio,    // 动态计算
        ath_date: extreme.ath_date,
        atl_date: extreme.atl_date,
        last_updated: extreme.last_updated
      };
    });
    
    return c.json({
      success: true,
      updateTime: latestRound.round_time,
      lastUpdated: extremes[0]?.last_updated || new Date().toISOString(),
      coins: coins
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
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

// API: 自动同步K线数据（用于定时任务）
app.post('/api/kline/sync/auto', async (c) => {
  const startTime = Date.now();
  
  try {
    const klineService = new KlineService(c.env.DB);
    
    // 只同步5分钟K线的最新100根（覆盖最近8小时）
    const timeframe = '5m';
    const limit = 100;
    
    console.log(`🔄 自动同步开始: timeframe=${timeframe}, limit=${limit}`);
    
    const results = await klineService.syncAllKlineData(timeframe, limit);
    
    // 统计结果
    const summary = {
      total: results.length,
      success: results.filter((r: any) => r.success).length,
      failed: results.filter((r: any) => !r.success).length,
      duration: ((Date.now() - startTime) / 1000).toFixed(2)
    };
    
    console.log(`✅ 自动同步完成: ${summary.success}/${summary.total} 成功, 耗时 ${summary.duration}秒`);
    
    return c.json({ 
      success: true, 
      message: 'K线数据自动同步完成',
      summary,
      results 
    });
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 自动同步失败 (耗时 ${duration}秒):`, error.message);
    return c.json({ 
      success: false, 
      error: error.message,
      duration 
    }, 500);
  }
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
  const sendTelegram = c.req.query('telegram') !== 'false'; // 默认发送
  
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
    
    // 🆕 发送新出现的信号到Telegram
    let telegramStatus = { totalSent: 0, totalFailed: 0, symbols: [] as string[] };
    if (sendTelegram) {
      try {
        const telegramService = new TelegramService(
          '8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0',
          '-1003227444260'
        );
        
        // 遍历所有币种，发送未发送的信号
        for (const symbol of symbols) {
          // 获取该币种未发送的买卖点信号（过去2小时内）
          // 只取最新1条未发送信号，避免积压过多
          const allUnsentSignals = await signalService.getUnsentTradingSignals(symbol, 2);
          const unsentSignals = allUnsentSignals.slice(0, 1);
          
          if (unsentSignals.length > 0) {
            console.log(`📤 ${symbol}: 发现 ${unsentSignals.length} 个新买卖点信号 (积压:${allUnsentSignals.length})`);
            
            // 发送买卖点信号（每条消息间隔3秒，避免429错误）
            for (let i = 0; i < unsentSignals.length; i++) {
              const signal = unsentSignals[i];
              try {
                console.log(`   [${i+1}/${unsentSignals.length}] 发送 ${symbol} ${signal.signal_type} 信号...`);
                await telegramService.sendTradingSignal(signal);
                telegramStatus.totalSent++;
                
                // 标记为已发送
                await signalService.markTradingSignalsAsSent([signal.id]);
                
                // ⚠️ 每条消息后等待3秒，避免Telegram API 429限流
                if (i < unsentSignals.length - 1) {
                  console.log(`   ⏳ 等待3秒...`);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              } catch (error: any) {
                console.error(`❌ 发送买卖点信号失败 (${symbol}):`, error);
                // 如果遇到429错误，等待更长时间
                if (error.message && error.message.includes('429')) {
                  console.log(`   ⏳ 遇到速率限制，等待10秒后继续...`);
                  await new Promise(resolve => setTimeout(resolve, 10000));
                }
                telegramStatus.totalFailed++;
              }
            }
            
            if (!telegramStatus.symbols.includes(symbol)) {
              telegramStatus.symbols.push(symbol);
            }
            
            // 币种之间也等待3秒
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
        
        if (telegramStatus.totalSent > 0) {
          console.log(`✅ Telegram发送完成: ${telegramStatus.totalSent} 条新信号已发送`);
        }
      } catch (error: any) {
        console.error('❌ Telegram发送失败:', error);
      }
    }
    
    return c.json({
      success: true,
      summary,
      results,
      telegram: telegramStatus
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
    const coinService = new CoinService(c.env.DB);
    
    // 获取带指标的K线数据
    const result = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
    
    // 🆕 获取币种优先级等级（用于主升信号判断）
    const priorityResult: any = await c.env.DB
      .prepare('SELECT level FROM coin_priority WHERE symbol = ?')
      .bind(symbol)
      .first();
    const coinLevel = priorityResult?.level || undefined;
    
    // 检测买卖点（传入币种等级）
    const detection = signalService.detectTradingSignals(result.data, coinLevel);
    
    // 保存信号到数据库
    const signals = detection.signals || [];
    const alerts = detection.alerts || [];
    await signalService.saveSignalsAndAlerts(signals, alerts);
    
    // 如果有预警且需要发送到Telegram
    let telegramStatus = { sent: 0, failed: 0, skipped: false };
    if (sendTelegram && detection.alerts && detection.alerts.length > 0) {
      try {
        // 创建K线数据映射表（包含时间戳信息）
        const klineDataMap = new Map();
        result.data.forEach((k: any) => {
          klineDataMap.set(k.index, k);
        });
        
        // ===== 关键修改：只发送本小时和上一个小时的预警 =====
        // 从K线数据中获取最新时间（而不是系统时间），因为系统时区可能不同
        // 找到最新的K线时间戳（index=0是最新）
        // 注意：带指标的K线数据使用time字段（格式：2025/10/27 17:25:00）
        let latestKlineTime = 0;
        if (result.data.length > 0) {
          if (result.data[0].time) {
            // 解析时间字符串："2025/10/27 17:25:00" -> 时间戳
            const timeStr = result.data[0].time.replace(/\//g, '-');
            latestKlineTime = new Date(timeStr).getTime();
          } else if (result.data[0].open_time) {
            latestKlineTime = result.data[0].open_time;
          }
        }
        
        if (latestKlineTime === 0) {
          // 如果找不到K线时间戳，跳过
          telegramStatus.skipped = true;
          console.log(`⏭️  ${symbol} 无法获取K线时间戳，跳过发送`);
        } else {
          // 计算本小时和上一个小时的起始时间戳（基于K线数据的时区）
          const latestDate = new Date(latestKlineTime);
          const currentHour = new Date(latestDate);
          currentHour.setMinutes(0, 0, 0); // 本小时00分00秒
          const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000); // 上一个小时00分00秒
          
          const previousHourStart = previousHour.getTime();
          
          // 过滤预警：只保留本小时和上一个小时的预警
          const recentAlerts = detection.alerts.filter((alert: any) => {
            const klineData = klineDataMap.get(alert.index);
            if (!klineData) {
              return false; // 没有K线数据，跳过
            }
            
            // 获取时间戳：优先使用time字段，其次open_time
            let alertTime = 0;
            if (klineData.time) {
              const timeStr = klineData.time.replace(/\//g, '-');
              alertTime = new Date(timeStr).getTime();
            } else if (klineData.open_time) {
              alertTime = klineData.open_time;
            }
            
            if (!alertTime) {
              return false; // 没有时间戳信息，跳过
            }
            
            const alertDate = new Date(alertTime);
            const latestKlineDate = new Date(latestKlineTime);
            
            // ===== 严格检查：必须是同一天 =====
            const sameDay = alertDate.getUTCFullYear() === latestKlineDate.getUTCFullYear() &&
                           alertDate.getUTCMonth() === latestKlineDate.getUTCMonth() &&
                           alertDate.getUTCDate() === latestKlineDate.getUTCDate();
            
            if (!sameDay) {
              console.log(`   ⏭️  跳过旧日期预警: ${alert.time} (不是今天)`);
              return false; // 不是同一天，跳过
            }
            
            // 只保留时间戳 >= 上一个小时开始时间的预警
            const isRecent = alertTime >= previousHourStart;
            
            if (!isRecent) {
              console.log(`   ⏭️  跳过旧时间预警: ${alert.time} (早于${previousHour.toISOString().substring(11, 16)})`);
            }
            
            return isRecent;
          });
          
          if (recentAlerts.length === 0) {
            telegramStatus.skipped = true;
            console.log(`⏭️  ${symbol} 无本小时和上一小时的预警，跳过发送`);
          } else {
            // 初始化Telegram服务
            const telegramService = new TelegramService(
              '8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0',
              '-1003227444260'
            );
            
            // 批量发送最近2小时的预警到Telegram
            const sentCount = await telegramService.sendMultipleAlerts(recentAlerts, klineDataMap);
            telegramStatus.sent = sentCount;
            telegramStatus.failed = recentAlerts.length - sentCount;
            
            // 格式化时间显示
            const currentHourStr = currentHour.toISOString().substring(11, 16); // HH:MM
            const previousHourStr = previousHour.toISOString().substring(11, 16);
            console.log(`📤 ${symbol} 预警已发送到Telegram: ${sentCount}/${recentAlerts.length} (过滤前: ${detection.alerts.length}) [仅${previousHourStr}-${currentHourStr}xx]`);
          }
        }
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
                        <a href="/trading.html" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-chart-line mr-2"></i>模拟交易
                        </a>
                        <a href="/positions.html" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-wallet mr-2"></i>持仓追踪
                        </a>
                        <a href="/history.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-history mr-2"></i>历史回看
                        </a>
                        <a href="/compare.html" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-balance-scale mr-2"></i>比价比对
                        </a>
                        <a href="/signal.html" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-signal mr-2"></i>买卖点信号
                        </a>
                        <a href="/kline.html" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-chart-candlestick mr-2"></i>K线查询
                        </a>
                        <a href="/pattern.html" class="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-brain mr-2"></i>特征库
                        </a>
                        <a href="/correct.html" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-edit mr-2"></i>数据纠错
                        </a>
                        <a href="/import.html" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-file-import mr-2"></i>批量导入
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

            <!-- 🆕 重点统计面板 - 显眼位置 -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6">
                <h2 class="text-2xl font-bold text-white mb-4 flex items-center">
                    <i class="fas fa-fire mr-3"></i>今日重点统计
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- 24h涨幅>10% -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-arrow-up mr-1"></i>24h涨幅>10%
                        </div>
                        <div class="text-3xl font-bold text-white mb-1" id="change24hOver10Up">-</div>
                        <div class="text-white text-opacity-80 text-xs">
                            占比 <span id="change24hOver10UpPercent" class="font-bold">-</span>
                        </div>
                    </div>
                    
                    <!-- 24h跌幅>10% -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-arrow-down mr-1"></i>24h跌幅>10%
                        </div>
                        <div class="text-3xl font-bold text-white mb-1" id="change24hOver10Down">-</div>
                        <div class="text-white text-opacity-80 text-xs">
                            占比 <span id="change24hOver10DownPercent" class="font-bold">-</span>
                        </div>
                    </div>
                    
                    <!-- 今日创新高次数 -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-trophy mr-1"></i>今日创新高
                        </div>
                        <div class="text-3xl font-bold text-white" id="todayNewHighCount">-</div>
                        <div class="text-white text-opacity-80 text-xs">总次数</div>
                    </div>
                    
                    <!-- 今日创新低次数 -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-chart-line mr-1"></i>今日创新低
                        </div>
                        <div class="text-3xl font-bold text-white" id="todayNewLowCount">-</div>
                        <div class="text-white text-opacity-80 text-xs">总次数</div>
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
                                <th class="text-center py-2 px-1">上轮涨跌</th>
                                <th class="text-center py-2 px-1">当天急涨次数</th>
                                <th class="text-center py-2 px-1">当天急跌次数</th>
                                <th class="text-center py-2 px-1">+4%</th>
                                <th class="text-center py-2 px-1">-3%</th>
                                <th class="text-center py-2 px-1">今日V1</th>
                                <th class="text-right py-2 px-1">更新时间</th>
                                <th class="text-right py-2 px-1">历史高价</th>
                                <th class="text-right py-2 px-1">高的时间</th>
                                <th class="text-right py-2 px-1">涨幅</th>
                                <th class="text-right py-2 px-1">24涨幅</th>
                                <th class="text-center py-2 px-1">++</th>
                                <th class="text-center py-2 px-1">--</th>
                                <th class="text-center py-2 px-1">排行</th>
                                <th class="text-center py-2 px-1">优先级</th>
                                <th class="text-right py-2 px-1">这轮价格</th>
                                <th class="text-right py-2 px-1">最高占比</th>
                                <th class="text-right py-2 px-1">最低占比</th>
                                <th class="text-center py-2 px-1">异动</th>
                            </tr>
                        </thead>
                        <tbody id="coinTableBody">
                            <tr>
                                <td colspan="21" class="text-center py-8 text-gray-500">
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

// ==================== 持仓管理 API ====================

// API: 获取所有活跃持仓
app.get('/api/positions', async (c) => {
  try {
    const positionService = new PositionService(c.env.DB);
    const positions: any = await positionService.getActivePositions();
    
    // 附加当前价格
    const enriched = await positionService.enrichPositionsWithCurrentPrice(positions);
    
    return c.json({ success: true, positions: enriched });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 添加持仓
app.post('/api/positions', async (c) => {
  try {
    const body = await c.req.json();
    const positionService = new PositionService(c.env.DB);
    
    const result = await positionService.addPosition({
      symbol: body.symbol,
      positionType: body.position_type,
      entryPrice: parseFloat(body.entry_price),
      quantity: body.quantity ? parseFloat(body.quantity) : undefined,
      stopLoss: body.stop_loss ? parseFloat(body.stop_loss) : undefined,
      takeProfit: body.take_profit ? parseFloat(body.take_profit) : undefined,
      notes: body.notes
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新持仓
app.put('/api/positions/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const positionService = new PositionService(c.env.DB);
    
    const result = await positionService.updatePosition(id, {
      quantity: body.quantity ? parseFloat(body.quantity) : undefined,
      stopLoss: body.stopLoss ? parseFloat(body.stopLoss) : undefined,
      takeProfit: body.takeProfit ? parseFloat(body.takeProfit) : undefined,
      notes: body.notes
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 平仓
app.post('/api/positions/:id/close', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const positionService = new PositionService(c.env.DB);
    
    const result = await positionService.closePosition(id, parseFloat(body.closedPrice));
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 删除持仓
app.delete('/api/positions/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const positionService = new PositionService(c.env.DB);
    
    const result = await positionService.deletePosition(id);
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 检查持仓预警
app.get('/api/positions/check-alerts', async (c) => {
  try {
    const positionService = new PositionService(c.env.DB);
    const klineService = new KlineService(c.env.DB);
    
    // 获取所有活跃持仓
    const positions: any = await positionService.getActivePositions();
    
    if (positions.length === 0) {
      return c.json({ 
        success: true, 
        alerts: [],
        message: '暂无活跃持仓'
      });
    }
    
    // 获取这些币种的最新K线数据
    const symbols = [...new Set(positions.map((p: any) => p.symbol))];
    const klineDataMap = new Map();
    
    for (const symbol of symbols) {
      const result = await klineService.getKlineWithIndicators(symbol, '5m', 1);
      if (result.data && result.data.length > 0) {
        klineDataMap.set(symbol, result.data[0]);
      }
    }
    
    // 转换为数组供检查使用
    const klineData = Array.from(klineDataMap.values());
    
    // 检查预警
    const alerts = await positionService.checkPositionAlerts(klineData);
    
    // 如果有预警，发送到Telegram
    let telegramSent = 0;
    if (alerts.length > 0 && c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
      const telegramService = new TelegramService(
        c.env.TELEGRAM_BOT_TOKEN,
        c.env.TELEGRAM_CHAT_ID
      );
      
      for (const alert of alerts) {
        const sent = await telegramService.sendPositionAlert(alert);
        if (sent) {
          telegramSent++;
          // 保存预警记录
          await positionService.savePositionAlert({
            ...alert,
            telegramSent: true
          });
        }
      }
    }
    
    return c.json({
      success: true,
      alerts,
      telegram: {
        sent: telegramSent,
        total: alerts.length
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========== 模拟交易系统 API ==========

// API: 获取所有模拟账户
app.get('/api/simulated/accounts', async (c) => {
  try {
    const tradingService = new SimulatedTradingService(c.env.DB);
    const accounts = await tradingService.getAllAccounts();
    return c.json({ success: true, accounts });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 创建模拟账户
app.post('/api/simulated/accounts', async (c) => {
  try {
    const body = await c.req.json();
    const tradingService = new SimulatedTradingService(c.env.DB);
    
    const result = await tradingService.createAccount({
      accountName: body.account_name,
      initialBalance: parseFloat(body.initial_balance),
      leverage: body.leverage ? parseFloat(body.leverage) : undefined,
      tradingFeeRate: body.trading_fee_rate ? parseFloat(body.trading_fee_rate) : undefined
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取账户详情
app.get('/api/simulated/accounts/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const tradingService = new SimulatedTradingService(c.env.DB);
    const account = await tradingService.getAccount(id);
    return c.json({ success: true, account });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新账户状态
app.put('/api/simulated/accounts/:id/status', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const tradingService = new SimulatedTradingService(c.env.DB);
    
    await tradingService.updateAccountStatus(id, body.status);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取账户持仓
app.get('/api/simulated/accounts/:id/positions', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const tradingService = new SimulatedTradingService(c.env.DB);
    const positions = await tradingService.getOpenTrades(id);
    return c.json({ success: true, positions });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取交易历史
app.get('/api/simulated/accounts/:id/history', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const limit = parseInt(c.req.query('limit') || '100');
    const tradingService = new SimulatedTradingService(c.env.DB);
    const history = await tradingService.getTradeHistory(id, limit);
    return c.json({ success: true, history });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 手动开仓
app.post('/api/simulated/trades/open', async (c) => {
  try {
    const body = await c.req.json();
    const tradingService = new SimulatedTradingService(c.env.DB);
    
    const result = await tradingService.openTrade({
      accountId: body.account_id,
      strategyId: body.strategy_id,
      symbol: body.symbol,
      positionType: body.position_type,
      entryPrice: parseFloat(body.entry_price),
      quantity: parseFloat(body.quantity),
      signalSource: body.signal_source,
      notes: body.notes
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 平仓
app.post('/api/simulated/trades/:id/close', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const tradingService = new SimulatedTradingService(c.env.DB);
    
    const result = await tradingService.closeTrade(id, parseFloat(body.exit_price));
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 根据信号自动交易
app.post('/api/simulated/auto-trade', async (c) => {
  try {
    const body = await c.req.json();
    const tradingService = new SimulatedTradingService(c.env.DB);
    
    const result = await tradingService.executeTradeBySignal({
      accountId: body.account_id,
      strategyId: body.strategy_id,
      symbol: body.symbol,
      signalType: body.signal_type,
      currentPrice: parseFloat(body.current_price),
      quantity: body.quantity ? parseFloat(body.quantity) : undefined
    });
    
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 批量自动交易所有币种
app.post('/api/simulated/auto-trade-all', async (c) => {
  try {
    const body = await c.req.json();
    const tradingService = new SimulatedTradingService(c.env.DB);
    
    const result = await tradingService.autoTradeAllSymbols(
      body.account_id,
      body.strategy_id
    );
    
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取所有策略
app.get('/api/simulated/strategies', async (c) => {
  try {
    const tradingService = new SimulatedTradingService(c.env.DB);
    const strategies = await tradingService.getAllStrategies();
    return c.json({ success: true, strategies });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==================== 震荡收敛统计 API ====================

// API: 获取指定币种的震荡收敛统计
app.get('/api/convergence/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  const days = parseInt(c.req.query('days') || '30');
  
  try {
    const { ConvergenceStatsService } = await import('./services/convergenceStatsService');
    const convergenceService = new ConvergenceStatsService(c.env.DB);
    const stats = await convergenceService.getConvergenceStats(symbol, days);
    
    if (!stats) {
      return c.json({ success: false, message: '暂无震荡收敛数据' });
    }
    
    return c.json({ success: true, stats });
  } catch (error: any) {
    console.error('获取震荡收敛统计失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取所有币种的震荡收敛统计（简化版）
app.get('/api/convergence/all/stats', async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  
  try {
    const { ConvergenceStatsService } = await import('./services/convergenceStatsService');
    const convergenceService = new ConvergenceStatsService(c.env.DB);
    const allStats = await convergenceService.getAllConvergenceStats(days);
    
    return c.json({ success: true, stats: allStats });
  } catch (error: any) {
    console.error('获取所有震荡收敛统计失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取今日震荡收敛次数
app.get('/api/convergence/:symbol/today', async (c) => {
  const symbol = c.req.param('symbol');
  
  try {
    const { ConvergenceStatsService } = await import('./services/convergenceStatsService');
    const convergenceService = new ConvergenceStatsService(c.env.DB);
    const count = await convergenceService.getTodayConvergenceCount(symbol);
    
    return c.json({ success: true, symbol, count });
  } catch (error: any) {
    console.error('获取今日震荡收敛次数失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// 模式特征分析 API
// ========================================

// API: 分析所有币种的起涨起跌模式
app.post('/api/pattern/analyze', async (c) => {
  try {
    const patternService = new PatternService(c.env.DB);
    const coinService = new CoinService(c.env.DB);
    
    // 获取所有币种
    const coins = await coinService.getAllCoins();
    const symbols = coins.map((coin: any) => coin.symbol);
    
    const results = {
      surge: 0,
      crash: 0,
      processed: [] as string[]
    };
    
    // 逐个分析币种
    for (const symbol of symbols) {
      // 分析起涨模式
      const surgePatterns = await patternService.analyzeSurgePatterns(symbol);
      for (const pattern of surgePatterns) {
        await patternService.savePattern('surge', pattern);
        results.surge++;
      }
      
      // 分析起跌模式
      const crashPatterns = await patternService.analyzeCrashPatterns(symbol);
      for (const pattern of crashPatterns) {
        await patternService.savePattern('crash', pattern);
        results.crash++;
      }
      
      results.processed.push(symbol);
    }
    
    return c.json({
      success: true,
      message: '特征分析完成',
      results
    });
  } catch (error: any) {
    console.error('特征分析失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取起涨模式
app.get('/api/pattern/surge', async (c) => {
  try {
    const patternService = new PatternService(c.env.DB);
    const limit = parseInt(c.req.query('limit') || '100');
    const patterns = await patternService.getSurgePatterns(limit);
    
    return c.json({ success: true, patterns });
  } catch (error: any) {
    console.error('获取起涨模式失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取起跌模式
app.get('/api/pattern/crash', async (c) => {
  try {
    const patternService = new PatternService(c.env.DB);
    const limit = parseInt(c.req.query('limit') || '100');
    const patterns = await patternService.getCrashPatterns(limit);
    
    return c.json({ success: true, patterns });
  } catch (error: any) {
    console.error('获取起跌模式失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取特征统计
app.get('/api/pattern/stats', async (c) => {
  try {
    const patternService = new PatternService(c.env.DB);
    const stats = await patternService.getPatternStats();
    
    return c.json({ success: true, stats });
  } catch (error: any) {
    console.error('获取特征统计失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// 数据纠错 API
// ========================================

// API: 获取指定日期的数据
app.get('/api/correct/data', async (c) => {
  try {
    const date = c.req.query('date') || '';
    if (!date) {
      return c.json({ success: false, error: '请提供日期参数' }, 400);
    }
    
    const coinService = new CoinService(c.env.DB);
    const data = await coinService.getTodayStats(date);
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error('获取数据失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 保存修改后的数据
app.post('/api/correct/save', async (c) => {
  try {
    const { date, updates } = await c.req.json();
    
    if (!date || !updates || !Array.isArray(updates)) {
      return c.json({ success: false, error: '参数错误' }, 400);
    }
    
    // 直接使用SQL更新，避免复杂的参数传递
    const statements = updates.map((update: any) => 
      c.env.DB
        .prepare(`
          UPDATE daily_stats 
          SET total_surges = ?, 
              total_crashes = ?, 
              new_high_count = ?, 
              new_low_count = ?
          WHERE date = ? AND symbol = ?
        `)
        .bind(
          update.total_surges || 0,
          update.total_crashes || 0,
          update.new_high_count || 0,
          update.new_low_count || 0,
          date,
          update.symbol
        )
    );
    
    await c.env.DB.batch(statements);
    
    return c.json({ success: true, message: '数据已保存' });
  } catch (error: any) {
    console.error('保存数据失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 清空指定日期的数据
app.post('/api/correct/reset', async (c) => {
  try {
    const { date } = await c.req.json();
    
    if (!date) {
      return c.json({ success: false, error: '请提供日期参数' }, 400);
    }
    
    // 清空该日期的daily_stats数据（将所有计数重置为0）
    await c.env.DB
      .prepare(`
        UPDATE daily_stats 
        SET total_surges = 0, 
            total_crashes = 0, 
            new_high_count = 0, 
            new_low_count = 0
        WHERE date = ?
      `)
      .bind(date)
      .run();
    
    return c.json({ success: true, message: '数据已清空' });
  } catch (error: any) {
    console.error('清空数据失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取指定日期的轮次统计（包含风险提示次数）
app.get('/api/correct/rounds', async (c) => {
  try {
    const date = c.req.query('date') || '';
    if (!date) {
      return c.json({ success: false, error: '请提供日期参数' }, 400);
    }
    
    const coinService = new CoinService(c.env.DB);
    const rounds = await coinService.getRoundStatsByDate(date);
    
    return c.json({ success: true, rounds });
  } catch (error: any) {
    console.error('获取轮次数据失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新轮次的风险提示次数
app.post('/api/correct/rounds/save', async (c) => {
  try {
    const { updates } = await c.req.json();
    
    if (!updates || !Array.isArray(updates)) {
      return c.json({ success: false, error: '参数错误' }, 400);
    }
    
    const statements = updates.map((update: any) => 
      c.env.DB
        .prepare(`
          UPDATE round_stats 
          SET risk_alert_count = ?
          WHERE round_time = ?
        `)
        .bind(
          update.risk_alert_count || 0,
          update.round_time
        )
    );
    
    await c.env.DB.batch(statements);
    
    return c.json({ success: true, message: '风险提示数据已保存' });
  } catch (error: any) {
    console.error('保存风险提示数据失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新价格极值
app.post('/api/price/extreme/update', async (c) => {
  try {
    const { symbol, type, price } = await c.req.json();
    
    if (!symbol || !type || !price) {
      return c.json({ success: false, error: '参数不完整' }, 400);
    }
    
    const coinService = new CoinService(c.env.DB);
    await coinService.updatePriceExtreme(symbol, type, price);
    
    return c.json({ success: true, message: `${symbol} 的${type === 'high' ? '最高' : '最低'}价格已更新` });
  } catch (error: any) {
    console.error('更新价格极值失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 批量导入价格极值数据
app.post('/api/extremes/import', async (c) => {
  try {
    const { symbol, all_time_high, high_count, all_time_low, low_count } = await c.req.json();
    
    if (!symbol || !all_time_high || !all_time_low) {
      return c.json({ success: false, error: '参数不完整' }, 400);
    }
    
    // 使用 INSERT OR REPLACE 来更新或插入数据
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, high_count, all_time_low, low_count, last_updated)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(symbol, all_time_high, high_count || 0, all_time_low, low_count || 0).run();
    
    return c.json({ success: true, message: `${symbol} 数据已导入` });
  } catch (error: any) {
    console.error('导入价格极值失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// 系统设置 API
// ========================================

// API: 获取所有设置
app.get('/api/settings', async (c) => {
  try {
    const settingsService = new SettingsService(c.env.DB);
    const settings = await settingsService.getAllSettings();
    
    return c.json({ success: true, settings });
  } catch (error: any) {
    console.error('获取设置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 按分类获取设置
app.get('/api/settings/category/:category', async (c) => {
  try {
    const category = c.req.param('category');
    const settingsService = new SettingsService(c.env.DB);
    const settings = await settingsService.getSettingsByCategory(category);
    
    return c.json({ success: true, settings });
  } catch (error: any) {
    console.error('获取设置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新单个设置
app.put('/api/settings/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const { value } = await c.req.json();
    
    const settingsService = new SettingsService(c.env.DB);
    await settingsService.updateSetting(key, value);
    
    return c.json({ success: true, message: '设置已更新' });
  } catch (error: any) {
    console.error('更新设置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 批量更新设置
app.put('/api/settings', async (c) => {
  try {
    const { settings } = await c.req.json();
    
    const settingsService = new SettingsService(c.env.DB);
    await settingsService.updateSettings(settings);
    
    return c.json({ success: true, message: '设置已批量更新' });
  } catch (error: any) {
    console.error('批量更新设置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 重置设置为默认值
app.post('/api/settings/reset', async (c) => {
  try {
    const settingsService = new SettingsService(c.env.DB);
    await settingsService.resetToDefaults();
    
    return c.json({ success: true, message: '设置已重置为默认值' });
  } catch (error: any) {
    console.error('重置设置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app
