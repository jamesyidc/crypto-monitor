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
import { TradingRuleService } from './services/tradingRuleService'
import { SupportLineService } from './services/supportLineService'
import { ConsecutiveRiseService } from './services/ConsecutiveRiseService'
import { OKXService } from './services/okxService'
import { RiskControlService } from './services/riskControlService'
import { SignalMatchingService } from './services/signalMatchingService'

// 导入HTML文件作为原始文本
import historyHtml from '../public/history-new.html?raw'
import correctHtml from '../public/correct.html?raw'
import patternHtml from '../public/pattern.html?raw'
import tradingHtml from '../public/trading.html?raw'
import monitorLogHtml from '../public/monitor-log.html?raw'
import monitorHtml from '../public/monitor.html?raw'
import klineHtml from '../public/kline.html?raw'
import klineNewHtml from '../public/kline_new.html?raw'
import klineV2Html from '../public/kline_v2.html?raw'
import klineRedirectHtml from '../public/kline_redirect.html?raw'
import compareHtml from '../public/compare.html?raw'
import signalHtml from '../public/signal.html?raw'
import positionsHtml from '../public/positions.html?raw'
import settingsHtml from '../public/settings.html?raw'
import dashboardOverrideHtml from '../public/dashboard-override.html?raw'
import extremesDataHtml from '../public/extremes-data.html?raw'
import importHtml from '../public/import.html?raw'
import healthMonitorHtml from '../public/health-monitor.html?raw'
import liveTradingHtml from '../public/live-trading.html?raw'
import coinPriorityHtml from '../public/coin-priority.html?raw'
import strategyLibraryHtml from '../public/strategy-library.html?raw'
import signalMatchingHtml from '../public/signal-matching.html?raw'

/**
 * 🔒 数据库访问控制说明
 * 
 * kline_data 表访问规则：
 * - ✅ 允许写入：只有 KlineService（K线同步API）
 * - ✅ 允许读取：所有服务
 * - ❌ 禁止：其他业务逻辑写入K线数据
 * 
 * 守卫机制在 KlineDbGuard 中实现，KlineService 构造函数会自动验证权限
 */

const app = new Hono<{ Bindings: Bindings }>()

// 🔧 首页数据手动覆盖存储（内存存储，服务重启后清除）
const dashboardOverride = new Map<string, any>()

// 启用 CORS
app.use('/api/*', cors())

// 静态文件服务
app.use('/static/*', serveStatic({ root: './public' }))

// HTML页面服务（必须显式配置）
app.use('/*.html', serveStatic({ root: './public' }))

// API: 执行一轮分析
app.post('/api/analyze', async (c) => {
  const coinService = new CoinService(c.env.DB);
  
  // 🔒 核心逻辑：强制10分钟间隔（600秒）- 不可修改
  const REQUIRED_INTERVAL_SECONDS = 600; // 10分钟
  const latestRounds = await coinService.getLatestRoundStats(1);
  const latestRound = latestRounds[0];
  
  console.log('⏱️  10分钟间隔检查:', {
    hasLatestRound: !!latestRound,
    latestRoundTime: latestRound?.round_time
  });
  
  if (latestRound) {
    const lastAnalysisTime = new Date(latestRound.round_time).getTime();
    const now = Date.now();
    const timeSinceLastAnalysis = (now - lastAnalysisTime) / 1000;
    const minutesSinceLastAnalysis = timeSinceLastAnalysis / 60;
    
    console.log('时间检查:', {
      lastAnalysisTime: new Date(lastAnalysisTime).toISOString(),
      now: new Date(now).toISOString(),
      secondsSinceLastAnalysis: timeSinceLastAnalysis.toFixed(1),
      minutesSinceLastAnalysis: minutesSinceLastAnalysis.toFixed(2),
      shouldBlock: timeSinceLastAnalysis < REQUIRED_INTERVAL_SECONDS
    });
    
    if (timeSinceLastAnalysis < REQUIRED_INTERVAL_SECONDS) {
      const remainingSeconds = Math.ceil(REQUIRED_INTERVAL_SECONDS - timeSinceLastAnalysis);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      console.log(`🚫 核心规则拒绝: 距离上次分析${minutesSinceLastAnalysis.toFixed(2)}分钟，需等待${remainingMinutes}分钟`);
      return c.json({
        success: false,
        error: `核心规则：分析间隔必须≥10分钟，请等待${remainingMinutes}分钟后再执行`,
        nextAvailableIn: remainingSeconds,
        nextAvailableInMinutes: remainingMinutes,
        lastAnalysisTime: latestRound.round_time,
        requiredIntervalMinutes: 10
      }, 429); // 429 Too Many Requests
    }
  }
  
  console.log('✅ 10分钟间隔检查通过，开始执行分析');
  const analysisService = new AnalysisService(coinService);
  const result = await analysisService.performRoundAnalysis();
  return c.json(result);
});

// 🆕 API: 获取风险事件历史记录
app.get('/api/risk-events', async (c) => {
  const coinService = new CoinService(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '100');
  
  const events = await coinService.getAllRiskAlertEvents(limit);
  
  // 转换时间为北京时间显示
  const eventsWithBJTime = events.map((event: any) => ({
    ...event,
    event_time_bj: new Date(new Date(event.event_time).getTime() + 8 * 60 * 60 * 1000)
      .toISOString().replace('T', ' ').substring(0, 19),
    round_time_bj: new Date(new Date(event.round_time).getTime() + 8 * 60 * 60 * 1000)
      .toISOString().replace('T', ' ').substring(0, 19)
  }));
  
  return c.json({
    success: true,
    total: events.length,
    events: eventsWithBJTime
  });
});

// 🆕 API: 清理短间隔轮次数据（管理功能）
app.post('/api/admin/cleanup-short-intervals', async (c) => {
  try {
    // 1. 查询所有间隔<5分钟的轮次
    const query = `
      WITH round_intervals AS (
        SELECT 
          round_time,
          LAG(round_time) OVER (ORDER BY round_time) as prev_round_time,
          CAST((julianday(round_time) - julianday(LAG(round_time) OVER (ORDER BY round_time))) * 24 * 60 AS REAL) as minutes_diff
        FROM round_stats
        ORDER BY round_time
      )
      SELECT round_time
      FROM round_intervals 
      WHERE minutes_diff < 5 AND prev_round_time IS NOT NULL
    `;
    
    const result = await c.env.DB.prepare(query).all();
    const roundsToDelete = result.results.map((r: any) => r.round_time);
    
    if (roundsToDelete.length === 0) {
      return c.json({ success: true, message: '没有需要清理的数据', deleted: 0 });
    }
    
    // 2. 批量删除（每次处理10条，避免超时）
    let deleted = 0;
    const batchSize = 10;
    
    for (let i = 0; i < roundsToDelete.length; i += batchSize) {
      const batch = roundsToDelete.slice(i, i + batchSize);
      
      for (const roundTime of batch) {
        // 删除 round_stats
        await c.env.DB.prepare('DELETE FROM round_stats WHERE round_time = ?').bind(roundTime).run();
        // 删除 coin_round_details
        await c.env.DB.prepare('DELETE FROM coin_round_details WHERE round_time = ?').bind(roundTime).run();
        deleted++;
      }
    }
    
    const remaining = await c.env.DB.prepare('SELECT COUNT(*) as count FROM round_stats').first();
    
    return c.json({ 
      success: true, 
      message: `成功清理${deleted}条短间隔轮次`,
      deleted,
      remaining: (remaining as any).count
    });
  } catch (error: any) {
    console.error('清理失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取仪表板数据
app.get('/api/dashboard', async (c) => {
  const coinService = new CoinService(c.env.DB);
  const analysisService = new AnalysisService(coinService);
  
  const data = await analysisService.getDashboardData();
  
  // 🔧 应用首页数据覆盖（如果存在）
  const override = dashboardOverride.get('current');
  if (override) {
    // 合并 latestRound 覆盖数据
    if (data.latestRound && override.latestRound) {
      data.latestRound = {
        ...data.latestRound,
        ...override.latestRound
      };
    }
    
    // 合并 specialStats 覆盖数据
    if (data.specialStats && override.specialStats) {
      data.specialStats = {
        ...data.specialStats,
        ...override.specialStats
      };
    }
  }
  
  return c.json(data);
});

// 🔧 API: 获取首页数据覆盖状态
app.get('/api/dashboard/override', async (c) => {
  const override = dashboardOverride.get('current');
  return c.json({
    success: true,
    hasOverride: !!override,
    data: override || null
  });
});

// 🔧 API: 设置首页数据覆盖
app.post('/api/dashboard/override', async (c) => {
  try {
    const body = await c.req.json();
    const overrideData: any = {};
    
    // 构建 latestRound 覆盖数据
    if (body.risk_alert_count !== undefined) {
      overrideData.latestRound = overrideData.latestRound || {};
      overrideData.latestRound.risk_alert_count = body.risk_alert_count;
    }
    if (body.average_change !== undefined) {
      overrideData.latestRound = overrideData.latestRound || {};
      overrideData.latestRound.average_change = body.average_change;
    }
    if (body.surge_count !== undefined) {
      overrideData.latestRound = overrideData.latestRound || {};
      overrideData.latestRound.surge_count = body.surge_count;
    }
    if (body.crash_count !== undefined) {
      overrideData.latestRound = overrideData.latestRound || {};
      overrideData.latestRound.crash_count = body.crash_count;
    }
    
    // 构建 specialStats 覆盖数据
    if (body.change24hOver10Up !== undefined) {
      overrideData.specialStats = overrideData.specialStats || {};
      overrideData.specialStats.change24hOver10Up = body.change24hOver10Up;
    }
    if (body.change24hOver10Down !== undefined) {
      overrideData.specialStats = overrideData.specialStats || {};
      overrideData.specialStats.change24hOver10Down = body.change24hOver10Down;
    }
    if (body.todayNewHighCount !== undefined) {
      overrideData.specialStats = overrideData.specialStats || {};
      overrideData.specialStats.todayNewHighCount = body.todayNewHighCount;
    }
    if (body.todayNewLowCount !== undefined) {
      overrideData.specialStats = overrideData.specialStats || {};
      overrideData.specialStats.todayNewLowCount = body.todayNewLowCount;
    }
    
    // 保存覆盖数据
    dashboardOverride.set('current', overrideData);
    
    return c.json({
      success: true,
      message: '首页数据覆盖已设置',
      data: overrideData
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});

// 🔧 API: 清除首页数据覆盖
app.delete('/api/dashboard/override', async (c) => {
  dashboardOverride.delete('current');
  return c.json({
    success: true,
    message: '首页数据覆盖已清除，已恢复真实数据'
  });
});

// API: 获取所有币种
app.get('/api/coins', async (c) => {
  const coinService = new CoinService(c.env.DB);
  const coins = await coinService.getAllCoins();
  return c.json(coins);
});

// API: 获取带优先级的所有币种
app.get('/api/coins/with-priority', async (c) => {
  const result = await c.env.DB
    .prepare(`
      SELECT c.id, c.symbol, c.name, c.rank_order, p.level
      FROM coins c
      LEFT JOIN coin_priority p ON c.symbol = p.symbol
      ORDER BY c.rank_order
    `)
    .all();
  return c.json(result.results);
});

// API: 获取历史轮次统计
app.get('/api/rounds', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const coinService = new CoinService(c.env.DB);
  const rounds = await coinService.getLatestRoundStats(limit);
  return c.json(rounds);
});

// API: 获取历史数据(回看首页数据) - 已废弃，使用 /api/snapshots 代替
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

// 🆕 API: 获取可用的快照日期列表
app.get('/api/snapshots/dates', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT DISTINCT snapshot_date 
      FROM dashboard_snapshots 
      ORDER BY snapshot_date DESC 
      LIMIT 30
    `).all();
    
    const dates = result.results ? result.results.map((row: any) => row.snapshot_date) : [];
    
    return c.json({
      success: true,
      dates: dates
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 获取指定日期的快照时间列表（每个时间点返回所有币种数据）
app.get('/api/snapshots/times', async (c) => {
  const date = c.req.query('date');
  
  if (!date) {
    return c.json({ success: false, error: '缺少日期参数' }, 400);
  }
  
  try {
    // 获取所有快照时间点（去重）
    const timesResult = await c.env.DB.prepare(`
      SELECT DISTINCT snapshot_time, snapshot_hour, snapshot_minute
      FROM dashboard_snapshots 
      WHERE snapshot_date = ?
      ORDER BY snapshot_time DESC
    `).bind(date).all();
    
    const snapshots = [];
    
    // 对每个时间点，获取所有币种数据和聚合统计
    for (const timeRow of (timesResult.results || [])) {
      const coinsResult = await c.env.DB.prepare(`
        SELECT 
          rank_num, symbol, prev_round_change, this_round_price,
          today_surge_count, today_crash_count, today_change_percent,
          extreme_up_4_count, extreme_down_3_count, today_v1_count,
          update_time, all_time_high, ath_time, price_drop_from_ath,
          change_24h, rank_24h, priority_level, highest_ratio, lowest_ratio
        FROM dashboard_snapshots 
        WHERE snapshot_time = ?
        ORDER BY rank_num
      `).bind(timeRow.snapshot_time).all();
      
      // 🆕 获取聚合统计数据
      const aggregateResult = await c.env.DB.prepare(`
        SELECT * FROM snapshot_aggregates WHERE snapshot_time = ?
      `).bind(timeRow.snapshot_time).first();
      
      snapshots.push({
        snapshot_time: timeRow.snapshot_time,
        snapshot_hour: timeRow.snapshot_hour,
        snapshot_minute: timeRow.snapshot_minute,
        coins: coinsResult.results || [],
        aggregate: aggregateResult || null
      });
    }
    
    return c.json({
      success: true,
      snapshots: snapshots
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 获取指定时间的所有币种快照数据
app.get('/api/snapshots/time/:snapshotTime', async (c) => {
  const snapshotTime = c.req.param('snapshotTime');
  
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        rank_num, symbol, prev_round_change, this_round_price,
        today_surge_count, today_crash_count, today_change_percent,
        extreme_up_4_count, extreme_down_3_count, today_v1_count,
        update_time, all_time_high, ath_time, price_drop_from_ath,
        change_24h, rank_24h, priority_level, highest_ratio, lowest_ratio
      FROM dashboard_snapshots 
      WHERE snapshot_time = ?
      ORDER BY rank_num
    `).bind(snapshotTime).all();
    
    if (!result.results || result.results.length === 0) {
      return c.json({ success: false, error: '快照不存在' }, 404);
    }
    
    return c.json({
      success: true,
      snapshot_time: snapshotTime,
      coins: result.results
    });
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

// 🆕 API: 比价页面 - 汇总统计（左栏）
app.get('/api/compare/summary', async (c) => {
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
      const highRatio = extreme.all_time_high > 0 
        ? (currentPrice / extreme.all_time_high) * 100 
        : 0;
      
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
        highRatio: highRatio,
        lowRatio: lowRatio
      };
    });
    
    return c.json({
      success: true,
      updateTime: latestRound.round_time,
      coins: coins
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 比价页面 - 极值记录（中栏）
app.get('/api/compare/records', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const coinService = new CoinService(c.env.DB);
    
    const records = await coinService.getLatestExtremeRecords(limit);
    
    return c.json({
      success: true,
      records: records
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 比价页面 - 时间段统计（右栏）
app.get('/api/compare/timestats', async (c) => {
  try {
    const coinService = new CoinService(c.env.DB);
    
    // 获取时间段统计
    const stats = await coinService.getTimeRangeStats();
    
    return c.json({
      success: true,
      stats: stats
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取极值记录（用于比价页面左栏显示）
app.get('/api/extreme-records', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const coinService = new CoinService(c.env.DB);
    
    const records = await coinService.getLatestExtremeRecords(limit);
    
    return c.json({
      success: true,
      records: records,
      count: records.length
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
  
  // 🔒 使用只读服务
  const { ReadOnlyKlineService } = await import('./services/ReadOnlyKlineService');
  const klineService = new ReadOnlyKlineService(c.env.DB);
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
    // 🔒 使用只读服务
    const { ReadOnlyKlineService } = await import('./services/ReadOnlyKlineService');
    const klineService = new ReadOnlyKlineService(c.env.DB);
    const data = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
    
    // 🆕 实时计算操作提示和新增字段（用于最新的K线，数据库中可能还没有）
    if (data.data && data.data.length > 0) {
      const klines = data.data;
      
      // 🆕 步骤0：计算新增字段（当天涨幅、10格比价、48小时涨跌幅）
      // 💡 获取今天的日期（北京时间）
      const now = new Date();
      const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const todayYear = beijingTime.getUTCFullYear();
      const todayMonth = beijingTime.getUTCMonth() + 1;
      const todayDay = beijingTime.getUTCDate();
      const realTodayDateStr = `${todayYear}/${todayMonth}/${todayDay}`;
      
      // 💡 找到今天的第一根K线（只查找一次）
      // ⚠️ 注意：klines数组是从新到旧排列（index=0是最新的）
      // 所以要找今天最早的K线，需要从后往前找，找到最后一个匹配今天的K线
      let todayFirstBar = null;
      for (let j = 0; j < klines.length; j++) {
        if (klines[j].time) {
          const barTimeMatch = klines[j].time.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
          if (barTimeMatch) {
            const [_, barYear, barMonth, barDay] = barTimeMatch;
            const barDateStr = `${barYear}/${parseInt(barMonth)}/${parseInt(barDay)}`;
            
            if (barDateStr === realTodayDateStr) {
              // 找到今天的K线，继续找直到找完所有今天的（最后一个就是最早的）
              todayFirstBar = klines[j];
            } else if (todayFirstBar) {
              // 已经找到今天的K线，但现在遇到了昨天的日期，说明已经找完了
              // todayFirstBar现在指向今天最早的一根
              break;
            }
          }
        }
      }
      
      for (let i = 0; i < klines.length; i++) {
        const k = klines[i];
        
        // 1. 计算当天涨幅（从今天0点北京时间到当前K线的涨跌幅）
        // 💡 只有当K线是今天的，才计算change_today
        if (k.time && todayFirstBar) {
          const timeMatch = k.time.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
          if (timeMatch) {
            const [_, year, month, day] = timeMatch;
            const kDateStr = `${year}/${parseInt(month)}/${parseInt(day)}`;
            
            // 只有今天的K线才计算change_today
            if (kDateStr === realTodayDateStr && todayFirstBar.open > 0 && k.close > 0) {
              k.change_today = ((k.close - todayFirstBar.open) / todayFirstBar.open * 100);
            }
          }
        }
        
        // 2. 计算10格比价（往后10根K线是否创新低/新高）
        // 包含当前这根，往前数10根K线
        const bar10Start = Math.max(0, i - 9); // 包含当前K线
        const bar10Range = klines.slice(bar10Start, i + 1);
        
        if (bar10Range.length >= 2) {
          const currentLow = k.low;
          const currentHigh = k.high;
          
          // 🔥 修正逻辑：从10根K线中找出最高价和最低价
          let highest = bar10Range[0].high;
          let lowest = bar10Range[0].low;
          
          for (const bar of bar10Range) {
            if (bar.high > highest) highest = bar.high;
            if (bar.low < lowest) lowest = bar.low;
          }
          
          // 🔥 只判断当前K线是否等于这个最高/最低价
          // 创新高优先（如果同时创新高和新低，显示创新高）
          if (currentHigh >= highest) {
            k.bar_10_compare = 1;  // 创新高
          } else if (currentLow <= lowest) {
            k.bar_10_compare = -1; // 创新低
          } else {
            k.bar_10_compare = 0;  // 无信号
          }
        } else {
          k.bar_10_compare = 0;
        }
        
        // 3. 计算距离48小时高点最大跌幅
        // 4. 计算距离48小时低点最大涨幅
        // 🆕 从币安API实时查询该币种2天K线，而不是使用自己的数据
        // 注意：这里只为每个symbol查询一次，避免重复请求
      }
      
      // 🆕 从OKX API查询该币种永续合约2天K线数据（只需1根）
      let high48h = null;
      let low48h = null;
      
      try {
        // OKX永续合约交易对格式：BTC-USDT-SWAP
        const instId = `${symbol}-USDT-SWAP`;
        // 查询2天周期K线，bar=2D表示2天
        const okxUrl = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=2D&limit=1`;
        const response = await fetch(okxUrl);
        
        if (response.ok) {
          const result = await response.json();
          
          // OKX返回格式：{code: "0", msg: "", data: [[ts, o, h, l, c, vol, ...]]}
          if (result.code === "0" && result.data && result.data.length > 0) {
            const kline = result.data[0];
            high48h = parseFloat(kline[2]); // 索引2是最高价
            low48h = parseFloat(kline[3]);  // 索引3是最低价
            
            console.log(`✅ 从OKX API获取 ${symbol} 永续合约2天K线: 最高=${high48h}, 最低=${low48h}`);
          } else {
            console.warn(`⚠️ OKX API返回异常 ${symbol}: code=${result.code}, msg=${result.msg}`);
          }
        } else {
          console.warn(`⚠️ OKX API查询失败 ${symbol}: ${response.status}`);
        }
      } catch (error: any) {
        console.error(`❌ OKX API请求异常 ${symbol}:`, error.message);
      }
      
      // 将48小时最高价和最低价应用到所有K线
      for (let i = 0; i < klines.length; i++) {
        const k = klines[i];
        
        if (high48h !== null && k.close > 0) {
          k.high_48h = high48h;
          k.drop_from_48h_high = ((k.close - high48h) / high48h * 100);
        }
        
        if (low48h !== null && k.close > 0) {
          k.low_48h = low48h;
          k.rise_from_48h_low = ((k.close - low48h) / low48h * 100);
        }
      }
      
      // 🆕 步骤0.5：查询 ATH/ATL 和计算30天内最大波动
      let ath = null;
      let atl = null;
      let max30dDrop = 0;  // 30天内最大跌幅（绝对值）
      let max30dRise = 0;  // 30天内最大涨幅（绝对值）
      
      try {
        // 1. 从 price_extremes 表获取 ATH 和 ATL
        const extremesResult: any = await c.env.DB
          .prepare('SELECT all_time_high, all_time_low FROM price_extremes WHERE symbol = ?')
          .bind(symbol)
          .first();
        
        if (extremesResult) {
          ath = extremesResult.all_time_high;
          atl = extremesResult.all_time_low;
          console.log(`✅ 获取 ${symbol} ATH=${ath}, ATL=${atl}`);
        }
        
        // 2. 计算30天内最大波动：查询最近30天的K线数据
        // 计算每根K线的 drop_from_48h_high 和 rise_from_48h_low
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        
        for (let i = 0; i < klines.length; i++) {
          const k = klines[i];
          
          // 只统计最近30天内的数据
          if (k.open_time && k.open_time >= thirtyDaysAgo) {
            // 统计30天内最大跌幅（距48h高点）
            if (k.drop_from_48h_high !== null && k.drop_from_48h_high !== undefined) {
              const dropAbs = Math.abs(k.drop_from_48h_high);
              if (dropAbs > max30dDrop) {
                max30dDrop = dropAbs;
              }
            }
            
            // 统计30天内最大涨幅（距48h低点）
            if (k.rise_from_48h_low !== null && k.rise_from_48h_low !== undefined) {
              const riseAbs = Math.abs(k.rise_from_48h_low);
              if (riseAbs > max30dRise) {
                max30dRise = riseAbs;
              }
            }
          }
        }
        
        console.log(`✅ ${symbol} 30天内最大跌幅=${max30dDrop.toFixed(2)}%, 最大涨幅=${max30dRise.toFixed(2)}%`);
        
        // 3. 为所有K线添加 ATH/ATL 相关字段
        for (let i = 0; i < klines.length; i++) {
          const k = klines[i];
          
          if (ath !== null && k.close > 0) {
            k.all_time_high = ath;
            k.price_drop_from_ath = ((k.close - ath) / ath * 100); // 距离ATH的跌幅（负数）
          }
          
          if (atl !== null && k.close > 0) {
            k.all_time_low = atl;
            k.price_rise_from_atl = ((k.close - atl) / atl * 100); // 距离ATL的涨幅（正数）
          }
        }
      } catch (error: any) {
        console.error(`❌ 获取 ${symbol} ATH/ATL 或计算30天波动失败:`, error.message);
      }
      
      // 步骤1：检测低吸、高抛、注意启动（优先使用数据库的，没有则实时计算）
      // 🆕 添加10格内防重复标记数组
      const signalIndexes: number[] = []; // 记录所有已显示信号的K线索引
      
      for (let i = 0; i < klines.length; i++) {
        const k = klines[i];
        
        // 如果数据库已经有operation_tip，跳过
        if (k.operation_tip && k.operation_tip !== 'null') {
          continue;
        }
        
        // 🆕 【新逻辑】基于ATH/ATL空间比值的抄底做多和顶部做空判断
        // 前提条件：必须有 ATH 和 ATL 数据
        if (ath && atl && k.price_drop_from_ath !== undefined && k.price_rise_from_atl !== undefined) {
          // 获取距离ATH的跌幅空间和距离ATL的涨幅空间（都取绝对值）
          const dropFromATH = Math.abs(k.price_drop_from_ath);  // 例如：12.29
          const riseFromATL = Math.abs(k.price_rise_from_atl);  // 例如：3.28
          
          // 🔥 前置条件：距离ATH或ATL的空间必须大于0.5%
          if (dropFromATH <= 0.5 && riseFromATL <= 0.5) {
            continue; // 空间太小，跳过
          }
          
          // 🔥 新增条件：距离ATH空间 + 距离ATL空间 必须大于4
          const totalSpace = dropFromATH + riseFromATL;
          if (totalSpace <= 4) {
            continue; // 总空间太小，跳过
          }
          
          // 🔥 第一步：确定阈值（取30天内最大跌幅和最大涨幅中的较大值）
          const max30dValue = Math.max(max30dDrop, max30dRise);
          let threshold = 3;  // 默认阈值
          
          if (max30dValue < 5) {
            threshold = 3;
          } else if (max30dValue >= 5 && max30dValue < 10) {
            threshold = 4;
          } else if (max30dValue >= 10 && max30dValue < 15) {
            threshold = 6;
          } else if (max30dValue >= 15) {
            threshold = 9;
          }
          
          // 📊 情况A：顶部做空 = (距离历史最大涨幅 / 距离历史最大跌幅) > 阈值 + RSI5 > 65
          // 含义：当前价格距离ATL的涨幅空间 远大于 距离ATH的跌幅空间时，说明在顶部，适合做空
          // 🆕 新增条件：RSI5分钟 > 65（超买状态，确认顶部）
          if (riseFromATL > dropFromATH && riseFromATL > 0.5) {
            const ratio = riseFromATL / dropFromATH;  // 比值 = 距ATL涨幅 / 距ATH跌幅
            const rsi5 = k.rsi_5min || 0;  // 获取RSI5指标
            
            // 满足条件：比值 > 阈值 且 RSI5 > 65
            if (ratio > threshold && rsi5 > 65) {
              // 🔥 检查10格内是否已有信号
              const canShow = !signalIndexes.some(idx => Math.abs(idx - i) < 10);
              
              if (canShow) {
                k.operation_tip = '顶部做空';
                signalIndexes.push(i); // 记录此索引
                console.log(`🔻 ${symbol} 顶部做空: 比值=${ratio.toFixed(2)}, 阈值=${threshold}, RSI5=${rsi5.toFixed(2)}, 距ATL=${riseFromATL.toFixed(2)}%, 距ATH=${dropFromATH.toFixed(2)}%, 总空间=${totalSpace.toFixed(2)}%, 30天最大波动=${max30dValue.toFixed(2)}%`);
                continue;
              }
            }
          }
          
          // 📊 情况B：抄底做多 = (距离历史最大跌幅 / 距离历史最大涨幅) > 阈值 + RSI5 < 35
          // 含义：当前价格距离ATH的跌幅空间 远大于 距离ATL的涨幅空间时，说明在底部，适合做多
          // 🆕 新增条件：RSI5分钟 < 35（超卖状态，确认底部）
          if (dropFromATH > riseFromATL && dropFromATH > 0.5) {
            const ratio = dropFromATH / riseFromATL;  // 比值 = 距ATH跌幅 / 距ATL涨幅
            const rsi5 = k.rsi_5min || 0;  // 获取RSI5指标
            
            // 满足条件：比值 > 阈值 且 RSI5 < 35
            if (ratio > threshold && rsi5 < 35) {
              // 🔥 检查10格内是否已有信号
              const canShow = !signalIndexes.some(idx => Math.abs(idx - i) < 10);
              
              if (canShow) {
                k.operation_tip = '抄底做多';
                signalIndexes.push(i); // 记录此索引
                console.log(`🔺 ${symbol} 抄底做多: 比值=${ratio.toFixed(2)}, 阈值=${threshold}, RSI5=${rsi5.toFixed(2)}, 距ATH=${dropFromATH.toFixed(2)}%, 距ATL=${riseFromATL.toFixed(2)}%, 总空间=${totalSpace.toFixed(2)}%, 30天最大波动=${max30dValue.toFixed(2)}%`);
                continue;
              }
            }
          }
        }
        
        // 🆕 【通用卖点】检测：10格连续5个0 + RSI5 > 65
        // 如果已经有操作提示，跳过（优先级：抄底做多 > 顶部做空 > 通用卖点）
        if (!k.operation_tip || k.operation_tip === 'null') {
          const rsi5min = k.rsi_5min || 0;
          
          // 条件1：RSI5分钟 > 65
          if (rsi5min > 65) {
            // 条件2：检查当前K线往前连续5根的10格比价都是0
            // 注意：klines数组是从新到旧，i=0是最新的
            // 所以往前5根就是 [i, i+1, i+2, i+3, i+4]
            if (i + 4 < klines.length) {
              let consecutive5Zeros = true;
              
              for (let j = 0; j < 5; j++) {
                const checkIndex = i + j;
                const bar10Compare = klines[checkIndex].bar_10_compare;
                
                // 如果任何一根不是0，则不满足条件
                if (bar10Compare !== 0) {
                  consecutive5Zeros = false;
                  break;
                }
              }
              
              // 满足条件：连续5个0 + RSI > 65
              if (consecutive5Zeros) {
                k.operation_tip = '通用卖点';
                console.log(`🔻 ${symbol} 通用卖点: RSI5=${rsi5min.toFixed(2)}, 10格连续5个0`);
              }
            }
          }
        }
        
        // 检测注意启动：震荡收敛相关逻辑（保持原有逻辑）
        // 这个逻辑比较复杂，暂时不在这里实时计算，依赖数据库
      }
      
      // 步骤2：添加带宽最小高亮标记（用于注意启动信号）
      const convergenceIndices: number[] = [];
      
      // 找出所有有"注意启动"操作提示的K线索引
      for (let i = 0; i < klines.length; i++) {
        if (klines[i].operation_tip === '注意启动') {
          convergenceIndices.push(i);
        }
      }
      
      // 为每个注意启动信号，找到前后10根K线中带宽最小的K线
      for (const convIndex of convergenceIndices) {
        const searchStart = Math.max(0, convIndex - 10);
        const searchEnd = Math.min(klines.length, convIndex + 11);
        const searchRange = klines.slice(searchStart, searchEnd);
        
        let minWidthIndex = searchStart;
        let minWidth = Infinity;
        
        for (let j = 0; j < searchRange.length; j++) {
          const width = searchRange[j].boll_width_change;
          if (width !== null && width !== undefined) {
            const widthValue = Math.abs(parseFloat(width.toString()));
            if (widthValue < minWidth) {
              minWidth = widthValue;
              minWidthIndex = searchStart + j;
            }
          }
        }
        
        // 添加带宽最小标记
        if (minWidthIndex >= 0 && minWidthIndex < klines.length) {
          klines[minWidthIndex].min_width_highlight = true;
        }
      }
      
      // 🔥 重要：将修改后的klines数组更新回data对象
      data.data = klines;
      data.klines = klines; // 同时更新klines字段（供前端使用）
      console.log(`✅ 更新 ${symbol} 数据: klines数组长度=${klines.length}, 第一根K线有ATH=${klines[0]?.all_time_high}, ATL=${klines[0]?.all_time_low}`);
    }
    
    // 确保klines字段始终存在
    if (!data.klines && data.data) {
      data.klines = data.data;
      console.log(`🔄 ${symbol} 添加klines字段（从data复制）`);
    }
    
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
    
    // 🔥 轻量级自动同步：只同步最新10根K线（50分钟数据）
    // 技术指标在用户查看时动态计算，不在这里回填
    const timeframe = '5m';
    const limit = 10;  // 减少到10根，快速同步
    
    console.log(`🔄 自动同步开始（轻量级）: timeframe=${timeframe}, limit=${limit}`);
    
    const results = await klineService.syncAllKlineData(timeframe, limit);
    
    // 统计结果
    const syncSummary = {
      total: results.length,
      success: results.filter((r: any) => r.success).length,
      failed: results.filter((r: any) => !r.success).length,
      duration: ((Date.now() - startTime) / 1000).toFixed(2)
    };
    
    console.log(`✅ K线数据同步完成: ${syncSummary.success}/${syncSummary.total} 成功, 耗时 ${syncSummary.duration}秒`);
    
    // 🆕 自动触发信号匹配流程
    let matchingStatus = { enabled: false, success: false, message: '', counts: {} };
    try {
      const signalMatchingService = new SignalMatchingService(c.env.DB);
      console.log('🔄 开始自动信号匹配流程...');
      
      // 步骤1: 为每个币种保存最新K线快照（直接使用数据库中已计算好的数据）
      let snapshotsSaved = 0;
      console.log(`📸 开始保存K线快照，共 ${results.length} 个币种...`);
      
      for (const result of results) {
        if (result.success) {
          try {
            console.log(`   处理 ${result.symbol}...`);
            
            // 🔥 直接从数据库获取已计算好的K线数据（包含SAR, RSI, BOLL, operation_tip等所有字段）
            const { ReadOnlyKlineService } = await import('./services/ReadOnlyKlineService');
            const readOnlyKlineService = new ReadOnlyKlineService(c.env.DB);
            const klineData = await readOnlyKlineService.getKlineData(result.symbol, timeframe, 3);
            
            console.log(`   ${result.symbol}: 获取到 ${klineData?.length || 0} 条数据库记录`);
            
            // 🐛 DEBUG: 打印第一条数据的字段
            if (klineData && klineData.length > 0) {
              const firstRecord = klineData[0];
              console.log(`   🐛 ${result.symbol} 样例数据:`);
              console.log(`      - sar: ${firstRecord.sar}`);
              console.log(`      - rsi_5min: ${firstRecord.rsi_5min}`);
              console.log(`      - operation_tip: ${firstRecord.operation_tip}`);
              console.log(`      - signal: ${firstRecord.signal}`);
              console.log(`      - homepage_rank: ${firstRecord.homepage_rank}`);
              console.log(`      - boll_mb: ${firstRecord.boll_mb}`);
              console.log(`      - volume_v1: ${firstRecord.volume_v1}`);
              console.log(`      - channel_state: ${firstRecord.channel_state}`);
            }
            
            if (klineData && klineData.length > 0) {
              // 保存最新3条K线快照（直接使用数据库中已计算好的数据）
              await signalMatchingService.saveLatestKlineSnapshots(result.symbol, klineData);
              snapshotsSaved++;
              console.log(`   ✅ ${result.symbol}: 快照已保存（使用数据库已计算数据）`);
            } else {
              console.log(`   ⚠️  ${result.symbol}: 无K线数据`);
            }
          } catch (error: any) {
            console.error(`❌ 保存 ${result.symbol} K线快照失败:`, error.message, error.stack);
          }
        }
      }
      console.log(`✅ K线快照保存完成: ${snapshotsSaved}/${results.length}`);
      
      // 步骤2-5: 执行信号匹配流程
      const matchingResult = await signalMatchingService.runCompleteFlow();
      matchingResult.snapshotsSaved = snapshotsSaved;
      
      matchingStatus = {
        enabled: true,
        success: true,
        message: '信号匹配流程执行完成',
        counts: matchingResult
      };
      
      console.log(`✅ 信号匹配完成: ${JSON.stringify(matchingResult)}`);
    } catch (error: any) {
      console.error('❌ 信号匹配失败:', error.message);
      matchingStatus = {
        enabled: true,
        success: false,
        message: error.message,
        counts: {}
      };
    }
    
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // ✅ 返回轻量级同步结果（无技术指标回填）+ 信号匹配状态
    return c.json({ 
      success: true, 
      message: 'K线数据自动同步完成（轻量级，技术指标按需计算）',
      sync_summary: syncSummary,
      signal_matching: matchingStatus,
      total_duration: totalDuration,
      sync_results: results,
      note: '技术指标在用户查看时动态计算，无需后台回填'
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

// API: 批量回填信号和操作提示到 kline_data 表
app.post('/api/kline/backfill-signals', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const symbol = body.symbol || 'BTC'; // 默认BTC，也可以指定币种
    const timeframe = body.timeframe || '5m';
    const batchSize = body.batchSize || 500; // 每批处理500条
    
    console.log(`🔄 开始回填信号数据: ${symbol} ${timeframe}`);
    
    // 使用 KlineService 获取所有数据（不限制数量）
    const klineService = new KlineService(c.env.DB);
    
    // 获取该币种的所有K线数据
    const allKlines: any = await c.env.DB.prepare(`
      SELECT id, symbol, timeframe, open_time, open, high, low, close, volume
      FROM kline_data 
      WHERE symbol = ? AND timeframe = ?
      ORDER BY open_time ASC
    `).bind(symbol, timeframe).all();
    
    if (!allKlines.results || allKlines.results.length === 0) {
      return c.json({ 
        success: false, 
        message: `未找到 ${symbol} ${timeframe} 的K线数据` 
      });
    }
    
    const totalCount = allKlines.results.length;
    console.log(`📊 找到 ${totalCount} 条K线数据，开始计算信号...`);
    
    // 转换为OKX格式以便计算指标
    const okxFormatData = allKlines.results.map((k: any) => [
      k.open_time.toString(),
      k.open.toString(),
      k.high.toString(),
      k.low.toString(),
      k.close.toString(),
      k.volume.toString()
    ]);
    
    // 计算所有技术指标
    const { IndicatorService } = await import('./services/indicatorService');
    const indicatorService = new IndicatorService();
    const indicators = indicatorService.calculateSARRSIBoll(okxFormatData, symbol);
    
    console.log(`✅ 指标计算完成，共 ${indicators.length} 条数据`);
    
    // 批量更新数据库
    let updatedCount = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < indicators.length; i++) {
      const indicator = indicators[i];
      const dbRecord = allKlines.results[i];
      
      if (!dbRecord) continue;
      
      try {
        // 更新数据库中的 signal 和 operation_tip 字段
        // operation_tip 暂时留空，后续可以根据条件填充（如高抛判断）
        await c.env.DB.prepare(`
          UPDATE kline_data 
          SET signal = ?, operation_tip = ?
          WHERE id = ?
        `).bind(
          indicator.signal || null,
          null, // operation_tip 暂时为空
          dbRecord.id
        ).run();
        
        updatedCount++;
        
        // 每100条打印一次进度
        if ((i + 1) % 100 === 0) {
          console.log(`⏳ 进度: ${i + 1}/${indicators.length} (${((i + 1) / indicators.length * 100).toFixed(1)}%)`);
        }
      } catch (error: any) {
        errors.push({
          id: dbRecord.id,
          time: indicator.time,
          error: error.message
        });
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`🎉 回填完成！更新了 ${updatedCount}/${totalCount} 条记录，耗时 ${duration}秒`);
    
    return c.json({
      success: true,
      message: '信号数据回填完成',
      summary: {
        total: totalCount,
        updated: updatedCount,
        errors: errors.length,
        duration: `${duration}秒`
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [] // 只返回前10个错误
    });
    
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 回填失败 (耗时 ${duration}秒):`, error.message);
    return c.json({ 
      success: false, 
      error: error.message,
      duration: `${duration}秒`
    }, 500);
  }
});

// API: 清理并重新回填信号数据（清除signal中的附加内容）
app.post('/api/kline/clean-and-backfill-signals', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const symbol = body.symbol || 'BTC';
    const timeframe = body.timeframe || '5m';
    
    console.log(`🧹 开始清理并重新回填信号数据: ${symbol} ${timeframe}`);
    
    // 第1步：获取所有K线数据
    const allKlines: any = await c.env.DB.prepare(`
      SELECT id, symbol, timeframe, open_time, open, high, low, close, volume
      FROM kline_data 
      WHERE symbol = ? AND timeframe = ?
      ORDER BY open_time ASC
    `).bind(symbol, timeframe).all();
    
    if (!allKlines.results || allKlines.results.length === 0) {
      return c.json({ 
        success: false, 
        message: `未找到 ${symbol} ${timeframe} 的K线数据` 
      });
    }
    
    const totalCount = allKlines.results.length;
    console.log(`📊 找到 ${totalCount} 条K线数据，开始重新计算...`);
    
    // 第2步：转换为OKX格式并计算指标
    const okxFormatData = allKlines.results.map((k: any) => [
      k.open_time.toString(),
      k.open.toString(),
      k.high.toString(),
      k.low.toString(),
      k.close.toString(),
      k.volume.toString()
    ]);
    
    // 计算技术指标（只生成纯净的signal：多头XX或空头XX）
    const { IndicatorService } = await import('./services/indicatorService');
    const indicatorService = new IndicatorService();
    const indicators = indicatorService.calculateSARRSIBoll(okxFormatData, symbol);
    
    console.log(`✅ 指标计算完成，共 ${indicators.length} 条数据`);
    
    // 第3步：批量更新数据库（只存储纯净的signal，operation_tip留空）
    let updatedCount = 0;
    
    for (let i = 0; i < indicators.length; i++) {
      const indicator = indicators[i];
      const dbRecord = allKlines.results[i];
      
      if (!dbRecord) continue;
      
      try {
        // 提取纯净的signal（只保留 "多头XX" 或 "空头XX"）
        let cleanSignal = indicator.signal || null;
        if (cleanSignal && cleanSignal.includes('|')) {
          // 如果包含 |，只取第一部分
          cleanSignal = cleanSignal.split('|')[0].trim();
        }
        
        await c.env.DB.prepare(`
          UPDATE kline_data 
          SET signal = ?, operation_tip = ?
          WHERE id = ?
        `).bind(
          cleanSignal,
          null, // operation_tip 清空，由indicators API动态计算
          dbRecord.id
        ).run();
        
        updatedCount++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`⏳ 进度: ${i + 1}/${indicators.length} (${((i + 1) / indicators.length * 100).toFixed(1)}%)`);
        }
      } catch (error: any) {
        console.error(`❌ 更新失败 (id=${dbRecord.id}):`, error.message);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`🎉 清理并回填完成！更新了 ${updatedCount}/${totalCount} 条记录，耗时 ${duration}秒`);
    
    return c.json({
      success: true,
      message: '信号数据已清理并重新回填',
      summary: {
        total: totalCount,
        updated: updatedCount,
        duration: `${duration}秒`
      }
    });
    
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 清理回填失败 (耗时 ${duration}秒):`, error.message);
    return c.json({ 
      success: false, 
      error: error.message,
      duration: `${duration}秒`
    }, 500);
  }
});

// API: 批量清理所有币种的信号数据
app.post('/api/kline/clean-signals/all', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const timeframe = body.timeframe || '5m';
    
    console.log(`🧹 开始批量清理所有币种的信号数据...`);
    
    // 获取所有币种列表
    const coinsResult: any = await c.env.DB.prepare(`
      SELECT DISTINCT symbol FROM kline_data WHERE timeframe = ?
    `).bind(timeframe).all();
    
    const symbols = coinsResult.results.map((r: any) => r.symbol);
    console.log(`📊 找到 ${symbols.length} 个币种: ${symbols.join(', ')}`);
    
    const results: any[] = [];
    
    // 逐个清理每个币种
    for (const symbol of symbols) {
      try {
        console.log(`\n🧹 清理 ${symbol}...`);
        
        // 获取该币种的所有K线数据
        const allKlines: any = await c.env.DB.prepare(`
          SELECT id, symbol, timeframe, open_time, open, high, low, close, volume
          FROM kline_data 
          WHERE symbol = ? AND timeframe = ?
          ORDER BY open_time ASC
        `).bind(symbol, timeframe).all();
        
        if (!allKlines.results || allKlines.results.length === 0) {
          results.push({ symbol, success: false, message: '无数据' });
          continue;
        }
        
        const totalCount = allKlines.results.length;
        
        // 转换为OKX格式
        const okxFormatData = allKlines.results.map((k: any) => [
          k.open_time.toString(),
          k.open.toString(),
          k.high.toString(),
          k.low.toString(),
          k.close.toString(),
          k.volume.toString()
        ]);
        
        // 计算指标
        const { IndicatorService } = await import('./services/indicatorService');
        const indicatorService = new IndicatorService();
        const indicators = indicatorService.calculateSARRSIBoll(okxFormatData, symbol);
        
        // 批量更新（只保留纯净signal）
        let updatedCount = 0;
        for (let i = 0; i < indicators.length; i++) {
          const indicator = indicators[i];
          const dbRecord = allKlines.results[i];
          
          if (dbRecord) {
            // 清理signal（只保留多头XX或空头XX）
            let cleanSignal = indicator.signal || null;
            if (cleanSignal && cleanSignal.includes('|')) {
              cleanSignal = cleanSignal.split('|')[0].trim();
            }
            
            await c.env.DB.prepare(`
              UPDATE kline_data 
              SET signal = ?, operation_tip = ?
              WHERE id = ?
            `).bind(
              cleanSignal,
              null, // operation_tip由API动态生成
              dbRecord.id
            ).run();
            updatedCount++;
          }
        }
        
        console.log(`✅ ${symbol}: ${updatedCount}/${totalCount} 条记录已清理`);
        results.push({
          symbol,
          success: true,
          total: totalCount,
          updated: updatedCount
        });
        
      } catch (error: any) {
        console.error(`❌ ${symbol} 清理失败:`, error.message);
        results.push({
          symbol,
          success: false,
          error: error.message
        });
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`\n🎉 批量清理完成！${successCount}/${symbols.length} 个币种成功，耗时 ${duration}秒`);
    
    return c.json({
      success: true,
      message: `批量清理完成`,
      summary: {
        totalSymbols: symbols.length,
        successSymbols: successCount,
        failedSymbols: symbols.length - successCount,
        duration: `${duration}秒`
      },
      results
    });
    
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 批量清理失败 (耗时 ${duration}秒):`, error.message);
    return c.json({ 
      success: false, 
      error: error.message,
      duration: `${duration}秒`
    }, 500);
  }
});

// API: 批量回填所有币种的信号数据
app.post('/api/kline/backfill-signals/all', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const timeframe = body.timeframe || '5m';
    
    console.log(`🔄 开始批量回填所有币种的信号数据...`);
    
    // 获取所有币种列表
    const coinsResult: any = await c.env.DB.prepare(`
      SELECT DISTINCT symbol FROM kline_data WHERE timeframe = ?
    `).bind(timeframe).all();
    
    const symbols = coinsResult.results.map((r: any) => r.symbol);
    console.log(`📊 找到 ${symbols.length} 个币种: ${symbols.join(', ')}`);
    
    const results: any[] = [];
    
    // 逐个处理每个币种
    for (const symbol of symbols) {
      try {
        console.log(`\n🔄 处理 ${symbol}...`);
        
        // 获取该币种的所有K线数据
        const allKlines: any = await c.env.DB.prepare(`
          SELECT id, symbol, timeframe, open_time, open, high, low, close, volume
          FROM kline_data 
          WHERE symbol = ? AND timeframe = ?
          ORDER BY open_time ASC
        `).bind(symbol, timeframe).all();
        
        if (!allKlines.results || allKlines.results.length === 0) {
          results.push({ symbol, success: false, message: '无数据' });
          continue;
        }
        
        const totalCount = allKlines.results.length;
        
        // 转换为OKX格式
        const okxFormatData = allKlines.results.map((k: any) => [
          k.open_time.toString(),
          k.open.toString(),
          k.high.toString(),
          k.low.toString(),
          k.close.toString(),
          k.volume.toString()
        ]);
        
        // 计算指标
        const { IndicatorService } = await import('./services/indicatorService');
        const indicatorService = new IndicatorService();
        const indicators = indicatorService.calculateSARRSIBoll(okxFormatData, symbol);
        
        // 批量更新
        let updatedCount = 0;
        for (let i = 0; i < indicators.length; i++) {
          const indicator = indicators[i];
          const dbRecord = allKlines.results[i];
          
          if (dbRecord) {
            await c.env.DB.prepare(`
              UPDATE kline_data 
              SET signal = ?, operation_tip = ?
              WHERE id = ?
            `).bind(
              indicator.signal || null,
              null,
              dbRecord.id
            ).run();
            updatedCount++;
          }
        }
        
        console.log(`✅ ${symbol}: ${updatedCount}/${totalCount} 条记录已更新`);
        results.push({
          symbol,
          success: true,
          total: totalCount,
          updated: updatedCount
        });
        
      } catch (error: any) {
        console.error(`❌ ${symbol} 回填失败:`, error.message);
        results.push({
          symbol,
          success: false,
          error: error.message
        });
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`\n🎉 批量回填完成！${successCount}/${symbols.length} 个币种成功，耗时 ${duration}秒`);
    
    return c.json({
      success: true,
      message: `批量回填完成`,
      summary: {
        totalSymbols: symbols.length,
        successSymbols: successCount,
        failedSymbols: symbols.length - successCount,
        duration: `${duration}秒`
      },
      results
    });
    
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 批量回填失败 (耗时 ${duration}秒):`, error.message);
    return c.json({ 
      success: false, 
      error: error.message,
      duration: `${duration}秒`
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
// 🔕 Telegram通知已禁用 - 买卖点系统正常运行

// API: 获取所有币种的买卖点信号
app.get('/api/signal/all', async (c) => {
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '100');
  const sendTelegram = c.req.query('telegram') === 'true'; // 🔕 默认不发送Telegram，需要明确指定 telegram=true
  
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
    
    // 🆕 发送新出现的信号到Telegram（使用新的过滤逻辑）
    let telegramStatus = { totalSent: 0, totalFailed: 0, totalSkipped: 0, symbols: [] as string[], details: [] as any[] };
    if (sendTelegram) {
      try {
        const telegramService = new TelegramService(
          '8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0',
          '-1003227444260'
        );
        
        // 🔥 使用新的过滤逻辑获取符合条件的信号
        // 规则：
        // 1. 同一币种同一5分钟K线只发一个信号
        // 2. 只发本小时和上个小时最后10分钟的信号
        // 3. 遵守配置表的启用/禁用设置
        const signalsToSend = await signalService.getSignalsToSend();
        
        console.log(`📊 信号过滤完成: ${signalsToSend.length} 个信号符合发送条件`);
        
        // 按币种分组统计
        const symbolGroups = new Map<string, number>();
        signalsToSend.forEach(signal => {
          symbolGroups.set(signal.symbol, (symbolGroups.get(signal.symbol) || 0) + 1);
        });
        
        if (signalsToSend.length > 0) {
          console.log(`📤 开始发送信号到Telegram...`);
          
          // 发送买卖点信号（每条消息间隔3秒，避免429错误）
          for (let i = 0; i < signalsToSend.length; i++) {
            const signal = signalsToSend[i];
            try {
              console.log(`   [${i+1}/${signalsToSend.length}] 发送 ${signal.symbol} ${signal.signal_type} 信号 (K线: ${signal.kline_time})...`);
              await telegramService.sendTradingSignal(signal);
              telegramStatus.totalSent++;
              
              // 标记为已发送
              await signalService.markTradingSignalsAsSent([signal.id]);
              
              // 记录发送日志（防止同一K线重复发送）
              await signalService.recordSignalSent(signal.symbol, signal.kline_time, 'trading', signal.id);
              
              if (!telegramStatus.symbols.includes(signal.symbol)) {
                telegramStatus.symbols.push(signal.symbol);
              }
              
              telegramStatus.details.push({
                symbol: signal.symbol,
                type: signal.signal_type,
                klineTime: signal.kline_time,
                signalTime: signal.signal_time,
                price: signal.price
              });
              
              // ⚠️ 每条消息后等待3秒，避免Telegram API 429限流
              if (i < signalsToSend.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
            } catch (error: any) {
              console.error(`❌ 发送买卖点信号失败 (${signal.symbol}):`, error);
              // 如果遇到429错误，等待更长时间
              if (error.message && error.message.includes('429')) {
                console.log(`   ⏳ 遇到速率限制，等待10秒后继续...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
              }
              telegramStatus.totalFailed++;
            }
          }
          
          console.log(`✅ Telegram发送完成: ${telegramStatus.totalSent} 条新信号已发送`);
        } else {
          console.log(`ℹ️  没有符合条件的信号需要发送`);
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

// API: 获取单个币种的买卖点信号（🔕 Telegram通知已默认禁用）
app.get('/api/signal/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  const timeframe = c.req.query('timeframe') || '5m';
  const limit = parseInt(c.req.query('limit') || '100');
  const sendTelegram = c.req.query('telegram') === 'true'; // 🔕 默认不发送Telegram，需要明确指定 telegram=true
  
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

// 旧的页面重定向已被新的HTML导入路由替代（见文件后面）

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

// 📄 页面路由（返回HTML文件内容）
app.get('/history', (c) => c.html(historyHtml))
app.get('/history-new', (c) => c.html(historyHtml))
app.get('/correct', (c) => c.html(correctHtml))
app.get('/pattern', (c) => c.html(patternHtml))
app.get('/backtest', (c) => c.html(tradingHtml))
app.get('/strategies', (c) => c.html(tradingHtml))
app.get('/monitor-log', (c) => c.html(monitorLogHtml))
app.get('/monitor', (c) => c.html(monitorHtml))
app.get('/kline', (c) => c.html(klineHtml))
app.get('/kline_new', (c) => c.html(klineNewHtml))
app.get('/kline_v2', (c) => c.html(klineV2Html))
app.get('/kline_redirect', (c) => c.html(klineRedirectHtml))
app.get('/compare', (c) => c.html(compareHtml))
app.get('/signal', (c) => c.html(signalHtml))
app.get('/positions', (c) => c.html(positionsHtml))
app.get('/settings', (c) => c.html(settingsHtml))
app.get('/trading', (c) => c.html(tradingHtml))
app.get('/dashboard-override', (c) => c.html(dashboardOverrideHtml))
app.get('/extremes-data', (c) => c.html(extremesDataHtml))
app.get('/import', (c) => c.html(importHtml))
app.get('/health-monitor', (c) => c.html(healthMonitorHtml))
app.get('/live-trading', (c) => c.html(liveTradingHtml))
app.get('/coin-priority', (c) => c.html(coinPriorityHtml))
app.get('/coin-priority.html', (c) => c.html(coinPriorityHtml))
app.get('/strategy-library', (c) => c.html(strategyLibraryHtml))
app.get('/strategy-library.html', (c) => c.html(strategyLibraryHtml))
app.get('/signal-matching', (c) => c.html(signalMatchingHtml))
app.get('/signal-matching.html', (c) => c.html(signalMatchingHtml))

// 🆕 风险事件历史查看页面
app.get('/risk-events', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>风险事件历史 - 实时币价监控</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- 导航栏 -->
        <nav class="bg-white shadow-sm mb-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <i class="fas fa-exclamation-triangle text-2xl text-red-600 mr-3"></i>
                            <span class="text-xl font-bold text-gray-900">风险事件历史</span>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <a href="/" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-home mr-1"></i>返回首页
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- 统计卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-red-100 rounded-md p-3">
                            <i class="fas fa-exclamation-circle text-2xl text-red-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">今日累计次数</p>
                            <p id="todayCount" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-blue-100 rounded-md p-3">
                            <i class="fas fa-list text-2xl text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">历史总记录</p>
                            <p id="totalCount" class="text-2xl font-bold text-gray-900">-</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-green-100 rounded-md p-3">
                            <i class="fas fa-clock text-2xl text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">最后事件</p>
                            <p id="lastEventTime" class="text-lg font-bold text-gray-900">-</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 事件列表 -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-history mr-2"></i>风险事件记录
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">所有绿色占比=0%的事件记录（间隔≥10分钟）</p>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事件时间（北京）</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分析轮次时间</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">绿色占比</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">币种数量</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">距上次间隔</th>
                            </tr>
                        </thead>
                        <tbody id="eventsTableBody" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                                    <i class="fas fa-spinner fa-spin mr-2"></i>加载中...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            async function loadRiskEvents() {
                try {
                    const response = await axios.get('/api/risk-events?limit=100');
                    const { events, total } = response.data;
                    
                    // 更新统计信息
                    document.getElementById('totalCount').textContent = total;
                    
                    if (events.length > 0) {
                        document.getElementById('lastEventTime').textContent = events[0].event_time_bj;
                        
                        // 计算今日次数
                        const today = new Date().toISOString().split('T')[0];
                        const todayEvents = events.filter(e => e.event_time_bj.startsWith(today));
                        document.getElementById('todayCount').textContent = todayEvents.length;
                    }
                    
                    // 渲染表格
                    const tbody = document.getElementById('eventsTableBody');
                    if (events.length === 0) {
                        tbody.innerHTML = \`
                            <tr>
                                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                                    <i class="fas fa-info-circle mr-2"></i>暂无风险事件记录
                                </td>
                            </tr>
                        \`;
                        return;
                    }
                    
                    tbody.innerHTML = events.map((event, index) => {
                        let intervalText = '-';
                        if (index < events.length - 1) {
                            const currentTime = new Date(event.event_time).getTime();
                            const prevTime = new Date(events[index + 1].event_time).getTime();
                            const minutes = Math.round((currentTime - prevTime) / (60 * 1000));
                            if (minutes < 60) {
                                intervalText = minutes + '分钟';
                            } else if (minutes < 1440) {
                                intervalText = Math.floor(minutes / 60) + '小时' + (minutes % 60) + '分';
                            } else {
                                intervalText = Math.floor(minutes / 1440) + '天';
                            }
                        }
                        
                        return \`
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${index + 1}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${event.event_time_bj}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${event.round_time_bj}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        \${event.green_ratio.toFixed(1)}%
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${event.total_coins}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">\${intervalText}</td>
                            </tr>
                        \`;
                    }).join('');
                    
                } catch (error) {
                    console.error('加载失败:', error);
                    document.getElementById('eventsTableBody').innerHTML = \`
                        <tr>
                            <td colspan="6" class="px-6 py-4 text-center text-red-500">
                                <i class="fas fa-exclamation-triangle mr-2"></i>加载失败: \${error.message}
                            </td>
                        </tr>
                    \`;
                }
            }
            
            // 页面加载时加载数据
            loadRiskEvents();
            
            // 每30秒刷新一次
            setInterval(loadRiskEvents, 30000);
        </script>
    </body>
    </html>
  `);
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
                        <a href="/history-new.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-history mr-2"></i>历史回看
                        </a>
                        <a href="/compare.html" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-balance-scale mr-2"></i>比价比对
                        </a>
                        <a href="/signal.html" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-signal mr-2"></i>买卖点信号
                        </a>
                        <a href="/kline_v2.html" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-chart-candlestick mr-2"></i>K线查询 V2
                        </a>
                        <a href="/pattern.html" class="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-brain mr-2"></i>特征库
                        </a>
                        <a href="/correct.html" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-edit mr-2"></i>数据纠错
                        </a>
                        <a href="/live-trading" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-coins mr-2"></i>实盘交易
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
                <div id="statsCards" class="col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <!-- 统计卡片将在这里动态生成（现在有5个卡片） -->
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
                                <th class="text-center py-2 px-1 bg-yellow-50">当天涨幅</th>
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
                                <td colspan="22" class="text-center py-8 text-gray-500">
                                    加载中...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js?v=${Date.now()}"></script>
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
    
    console.log(`📝 开始保存数据: 日期=${date}, 更新数量=${updates.length}`);
    
    // 使用 UPSERT 逻辑：如果记录不存在则插入，存在则更新
    const statements = updates.map((update: any) => {
      console.log(`  更新币种: ${update.symbol}, 急涨=${update.total_surges}, 急跌=${update.total_crashes}, 新高=${update.new_high_count}, 新低=${update.new_low_count}`);
      
      return c.env.DB
        .prepare(`
          INSERT INTO daily_stats (date, symbol, total_surges, total_crashes, new_high_count, new_low_count)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(date, symbol) DO UPDATE SET
            total_surges = excluded.total_surges,
            total_crashes = excluded.total_crashes,
            new_high_count = excluded.new_high_count,
            new_low_count = excluded.new_low_count
        `)
        .bind(
          date,
          update.symbol,
          update.total_surges || 0,
          update.total_crashes || 0,
          update.new_high_count || 0,
          update.new_low_count || 0
        )
    });
    
    const results = await c.env.DB.batch(statements);
    console.log(`✅ 批量更新完成，结果数量: ${results.length}`);
    
    // 验证更新是否成功
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.success) {
        successCount++;
      } else {
        console.error(`❌ 更新失败 [${updates[index].symbol}]:`, result.error);
      }
    });
    
    console.log(`✅ 保存成功: ${successCount}/${updates.length}`);
    
    return c.json({ 
      success: true, 
      message: `数据已保存 (${successCount}/${updates.length})`,
      successCount,
      totalCount: updates.length
    });
  } catch (error: any) {
    console.error('❌ 保存数据失败:', error);
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
    
    console.log(`📝 开始保存轮次风险提示数据: 更新数量=${updates.length}`);
    
    const statements = updates.map((update: any) => {
      console.log(`  更新轮次: ${update.round_time}, 风险提示=${update.risk_alert_count}`);
      
      return c.env.DB
        .prepare(`
          INSERT INTO round_stats (round_time, risk_alert_count, green_count, red_count, surge_count, crash_count)
          VALUES (?, ?, 0, 0, 0, 0)
          ON CONFLICT(round_time) DO UPDATE SET
            risk_alert_count = excluded.risk_alert_count
        `)
        .bind(
          update.round_time,
          update.risk_alert_count || 0
        )
    });
    
    const results = await c.env.DB.batch(statements);
    console.log(`✅ 批量更新完成，结果数量: ${results.length}`);
    
    // 验证更新是否成功
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.success) {
        successCount++;
      } else {
        console.error(`❌ 更新失败 [${updates[index].round_time}]:`, result.error);
      }
    });
    
    console.log(`✅ 保存成功: ${successCount}/${updates.length}`);
    
    return c.json({ 
      success: true, 
      message: `风险提示数据已保存 (${successCount}/${updates.length})`,
      successCount,
      totalCount: updates.length
    });
  } catch (error: any) {
    console.error('❌ 保存风险提示数据失败:', error);
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

// ========== 信号发送配置 API ==========

// API: 获取所有信号发送配置
app.get('/api/signal-config', async (c) => {
  try {
    const result = await c.env.DB
      .prepare('SELECT * FROM signal_send_config ORDER BY signal_category, signal_type')
      .all();

    return c.json({
      success: true,
      configs: result.results
    });
  } catch (error: any) {
    console.error('获取信号配置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新信号发送配置
app.put('/api/signal-config', async (c) => {
  try {
    const body = await c.req.json();
    const { signal_category, signal_type, enabled } = body;
    
    if (!signal_category || !signal_type || enabled === undefined) {
      return c.json({ 
        success: false, 
        error: '缺少必需参数: signal_category, signal_type, enabled' 
      }, 400);
    }

    await c.env.DB
      .prepare(`
        UPDATE signal_send_config 
        SET enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE signal_category = ? AND signal_type = ?
      `)
      .bind(enabled ? 1 : 0, signal_category, signal_type)
      .run();

    return c.json({ 
      success: true, 
      message: `信号配置已更新: ${signal_category}:${signal_type} = ${enabled ? '启用' : '禁用'}` 
    });
  } catch (error: any) {
    console.error('更新信号配置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 批量更新信号发送配置
app.post('/api/signal-config/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { configs } = body; // configs: [{signal_category, signal_type, enabled}, ...]
    
    if (!Array.isArray(configs)) {
      return c.json({ success: false, error: 'configs必须是数组' }, 400);
    }

    for (const config of configs) {
      const { signal_category, signal_type, enabled } = config;
      
      await c.env.DB
        .prepare(`
          UPDATE signal_send_config 
          SET enabled = ?, updated_at = CURRENT_TIMESTAMP
          WHERE signal_category = ? AND signal_type = ?
        `)
        .bind(enabled ? 1 : 0, signal_category, signal_type)
        .run();
    }

    return c.json({ 
      success: true, 
      message: `批量更新完成: ${configs.length} 个配置已更新` 
    });
  } catch (error: any) {
    console.error('批量更新信号配置失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==================== 交易规则 API ====================

// API: 获取交易统计（必须放在 :symbol 路由之前）
app.get('/api/trading-rules/stats', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    const stats = await tradingRuleService.getTradingStats();
    
    return c.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('获取交易统计失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取所有交易规则
app.get('/api/trading-rules', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    const rules = await tradingRuleService.getAllRules();
    
    return c.json({
      success: true,
      rules
    });
  } catch (error: any) {
    console.error('获取交易规则失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 应用单边市场策略（必须在 :symbol 路由之前）
app.post('/api/trading-rules/apply-unilateral-strategy', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    
    // 获取今日市场统计
    const stats = await tradingRuleService.getTodayMarketStats();
    
    // 应用单边策略
    const result = await tradingRuleService.applyUnilateralStrategy(
      stats.todaySurgeCount,
      stats.todayCrashCount
    );
    
    return c.json({
      success: true,
      message: `已应用单边策略：${result.strategy}`,
      strategy: result.strategy,
      todaySurgeCount: stats.todaySurgeCount,
      todayCrashCount: stats.todayCrashCount,
      long_allowed: result.long_allowed,
      short_allowed: result.short_allowed
    });
  } catch (error: any) {
    console.error('应用单边策略失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 获取今日市场统计和策略建议（必须在 :symbol 路由之前）
app.get('/api/trading-rules/market-strategy', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    
    // 获取今日市场统计
    const stats = await tradingRuleService.getTodayMarketStats();
    
    // 判断策略（不实际应用）
    let strategy = '';
    let long_allowed = true;
    let short_allowed = true;
    
    if (stats.todaySurgeCount > 0 && stats.todayCrashCount === 0) {
      strategy = '单边主升';
      long_allowed = true;
      short_allowed = false;
    } else if (stats.todayCrashCount > 0 && stats.todaySurgeCount === 0) {
      strategy = '单边主跌';
      long_allowed = false;
      short_allowed = true;
    } else {
      strategy = '双边震荡';
      long_allowed = true;
      short_allowed = true;
    }
    
    return c.json({
      success: true,
      todaySurgeCount: stats.todaySurgeCount,
      todayCrashCount: stats.todayCrashCount,
      strategy,
      long_allowed,
      short_allowed,
      recommendation: strategy === '单边主升' 
        ? '建议：只做多单，禁止做空' 
        : strategy === '单边主跌' 
        ? '建议：只做空单，禁止做多' 
        : '建议：可以做多做空'
    });
  } catch (error: any) {
    console.error('获取市场策略失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取单个币种的交易规则
app.get('/api/trading-rules/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const tradingRuleService = new TradingRuleService(c.env.DB);
    const rule = await tradingRuleService.getRuleBySymbol(symbol);
    
    if (!rule) {
      return c.json({ success: false, error: '未找到该币种的交易规则' }, 404);
    }
    
    return c.json({
      success: true,
      rule
    });
  } catch (error: any) {
    console.error('获取交易规则失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新单个币种的交易规则
app.put('/api/trading-rules/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const body = await c.req.json();
    const { trading_allowed, long_allowed, short_allowed, notes } = body;
    
    const tradingRuleService = new TradingRuleService(c.env.DB);
    await tradingRuleService.updateRule({
      symbol,
      trading_allowed,
      long_allowed,
      short_allowed,
      notes
    });
    
    return c.json({
      success: true,
      message: `${symbol} 交易规则已更新`
    });
  } catch (error: any) {
    console.error('更新交易规则失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 批量更新交易规则
app.post('/api/trading-rules/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { updates } = body;
    
    if (!Array.isArray(updates)) {
      return c.json({ success: false, error: 'updates必须是数组' }, 400);
    }
    
    const tradingRuleService = new TradingRuleService(c.env.DB);
    await tradingRuleService.batchUpdateRules(updates);
    
    return c.json({
      success: true,
      message: `批量更新完成: ${updates.length} 个规则已更新`
    });
  } catch (error: any) {
    console.error('批量更新交易规则失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 快速设置 - 重置所有规则
app.post('/api/trading-rules/reset', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    await tradingRuleService.resetAllRules();
    
    return c.json({
      success: true,
      message: '所有规则已重置为默认（允许所有交易）'
    });
  } catch (error: any) {
    console.error('重置交易规则失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 快速设置 - 禁止所有交易
app.post('/api/trading-rules/disable-all', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    await tradingRuleService.disableAllTrading();
    
    return c.json({
      success: true,
      message: '已禁止所有币种的交易'
    });
  } catch (error: any) {
    console.error('禁止所有交易失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 快速设置 - 仅允许做多
app.post('/api/trading-rules/long-only', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    await tradingRuleService.setLongOnly();
    
    return c.json({
      success: true,
      message: '已设置所有币种为仅允许做多'
    });
  } catch (error: any) {
    console.error('设置仅允许做多失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 快速设置 - 仅允许做空
app.post('/api/trading-rules/short-only', async (c) => {
  try {
    const tradingRuleService = new TradingRuleService(c.env.DB);
    await tradingRuleService.setShortOnly();
    
    return c.json({
      success: true,
      message: '已设置所有币种为仅允许做空'
    });
  } catch (error: any) {
    console.error('设置仅允许做空失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 根据风险等级应用交易规则
app.post('/api/trading-rules/apply-risk-rules', async (c) => {
  try {
    const { riskLevel } = await c.req.json();
    
    if (!riskLevel || !['高风险', '中风险', '低风险'].includes(riskLevel)) {
      return c.json({
        success: false,
        error: '无效的风险等级，必须是：高风险、中风险或低风险'
      }, 400);
    }
    
    const tradingRuleService = new TradingRuleService(c.env.DB);
    await tradingRuleService.applyRiskBasedRules(riskLevel);
    
    return c.json({
      success: true,
      message: `已应用${riskLevel}交易规则`,
      riskLevel
    });
  } catch (error: any) {
    console.error('应用风险规则失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 获取当前风险等级下允许交易的币种
app.get('/api/trading-rules/allowed-by-risk', async (c) => {
  try {
    const riskLevel = c.req.query('riskLevel');
    
    if (!riskLevel || !['高风险', '中风险', '低风险'].includes(riskLevel)) {
      return c.json({
        success: false,
        error: '无效的风险等级'
      }, 400);
    }
    
    const tradingRuleService = new TradingRuleService(c.env.DB);
    const allowedCoins = await tradingRuleService.getAllowedCoinsByRisk(riskLevel);
    
    return c.json({
      success: true,
      riskLevel,
      allowedCoins,
      count: allowedCoins.length
    });
  } catch (error: any) {
    console.error('获取允许交易币种失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// 币种优先级 API
// ========================================

// API: 获取所有币种优先级
// API: 获取所有交易策略
app.get('/api/trading-strategies', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT * FROM trading_strategies
        ORDER BY is_active DESC, strategy_type
      `)
      .all();
    
    return c.json({
      success: true,
      strategies: result.results,
      count: result.results.length
    });
  } catch (error: any) {
    console.error('获取交易策略失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新交易策略状态
app.put('/api/trading-strategies/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { is_active, config } = await c.req.json();
    
    await c.env.DB
      .prepare(`
        UPDATE trading_strategies
        SET is_active = ?, 
            config = COALESCE(?, config),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(is_active, config, id)
      .run();
    
    return c.json({
      success: true,
      message: '策略已更新'
    });
  } catch (error: any) {
    console.error('更新交易策略失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/coin-priority', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT * FROM coin_priority
        ORDER BY level, symbol
      `)
      .all();
    
    return c.json({
      success: true,
      coins: result.results,
      count: result.results.length
    });
  } catch (error: any) {
    console.error('获取币种优先级失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 手动添加等级历史
app.post('/api/coin-priority/level-history/manual', async (c) => {
  try {
    const { symbol, level, reached_time } = await c.req.json();
    
    if (!symbol || !level) {
      return c.json({ success: false, error: '币种和等级不能为空' }, 400);
    }
    
    if (level < 1 || level > 5) {
      return c.json({ success: false, error: '等级必须在1-5之间' }, 400);
    }
    
    const reachedTime = reached_time || new Date().toISOString();
    const expiryTime = new Date(new Date(reachedTime).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // 检查是否已存在该币种的等级历史
    const existing = await c.env.DB.prepare(`
      SELECT * FROM coin_priority_level_history 
      WHERE symbol = ? AND level = ?
    `).bind(symbol, level).first();
    
    if (existing) {
      // 更新现有记录
      await c.env.DB.prepare(`
        UPDATE coin_priority_level_history 
        SET reached_time = ?, expiry_time = ?
        WHERE symbol = ? AND level = ?
      `).bind(reachedTime, expiryTime, symbol, level).run();
    } else {
      // 插入新记录
      await c.env.DB.prepare(`
        INSERT INTO coin_priority_level_history (symbol, level, reached_time, expiry_time)
        VALUES (?, ?, ?, ?)
      `).bind(symbol, level, reachedTime, expiryTime).run();
    }
    
    return c.json({
      success: true,
      message: `成功添加 ${symbol} 的等级${level}历史记录`,
      data: {
        symbol,
        level,
        reached_time: reachedTime,
        expiry_time: expiryTime
      }
    });
  } catch (error: any) {
    console.error('手动添加等级历史失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// 支撑线低吸策略 API
// ========================================

// API: 获取今天的所有支撑线
app.get('/api/support-lines', async (c) => {
  try {
    const supportLineService = new SupportLineService(c.env.DB);
    const lines = await supportLineService.getTodaySupportLines();
    
    return c.json({
      success: true,
      lines,
      count: lines.length
    });
  } catch (error: any) {
    console.error('获取支撑线失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 检查低吸机会（必须在 :symbol 之前）
app.get('/api/support-lines/opportunities', async (c) => {
  try {
    const supportLineService = new SupportLineService(c.env.DB);
    const summary = await supportLineService.getOpportunitySummary();
    
    return c.json({
      success: true,
      ...summary
    });
  } catch (error: any) {
    console.error('检查低吸机会失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取单个币种的支撑线
app.get('/api/support-lines/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const supportLineService = new SupportLineService(c.env.DB);
    const line = await supportLineService.getSupportLine(symbol);
    
    if (!line) {
      return c.json({ success: false, error: '未找到该币种的支撑线' }, 404);
    }
    
    return c.json({
      success: true,
      line
    });
  } catch (error: any) {
    console.error('获取支撑线失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 设置或更新支撑线
app.post('/api/support-lines', async (c) => {
  try {
    const { symbol, support_price, notes } = await c.req.json();
    
    if (!symbol || !support_price) {
      return c.json({ success: false, error: '币种和支撑价格不能为空' }, 400);
    }
    
    const supportLineService = new SupportLineService(c.env.DB);
    await supportLineService.setSupportLine(symbol, support_price, notes);
    
    return c.json({
      success: true,
      message: `${symbol} 的支撑线已设置为 ${support_price}`
    });
  } catch (error: any) {
    console.error('设置支撑线失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 批量设置支撑线（必须在 :symbol 之前）
app.post('/api/support-lines/batch', async (c) => {
  try {
    const { lines } = await c.req.json();
    
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return c.json({ success: false, error: '参数错误' }, 400);
    }
    
    const supportLineService = new SupportLineService(c.env.DB);
    await supportLineService.batchSetSupportLines(lines);
    
    return c.json({
      success: true,
      message: `已批量设置 ${lines.length} 个支撑线`
    });
  } catch (error: any) {
    console.error('批量设置支撑线失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 清零今天的所有支撑线（必须在 :symbol 之前）
app.post('/api/support-lines/clear', async (c) => {
  try {
    const supportLineService = new SupportLineService(c.env.DB);
    const count = await supportLineService.clearTodaySupportLines();
    
    return c.json({
      success: true,
      message: `已清零 ${count} 个支撑线`,
      count
    });
  } catch (error: any) {
    console.error('清零支撑线失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 删除支撑线
app.delete('/api/support-lines/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const supportLineService = new SupportLineService(c.env.DB);
    await supportLineService.deleteSupportLine(symbol);
    
    return c.json({
      success: true,
      message: `${symbol} 的支撑线已删除`
    });
  } catch (error: any) {
    console.error('删除支撑线失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// 连续上涨占优统计 API
// ========================================

// API: 获取连续上涨占优统计概览
app.get('/api/consecutive-rise/overview', async (c) => {
  try {
    const consecutiveRiseService = new ConsecutiveRiseService(c.env.DB);
    const overview = await consecutiveRiseService.getStatsOverview();
    
    return c.json({
      success: true,
      overview
    });
  } catch (error: any) {
    console.error('获取连续上涨统计概览失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取所有币种的连续上涨统计
app.get('/api/consecutive-rise/all', async (c) => {
  try {
    const consecutiveRiseService = new ConsecutiveRiseService(c.env.DB);
    const stats = await consecutiveRiseService.getAllStats();
    
    return c.json({
      success: true,
      stats,
      count: stats.length
    });
  } catch (error: any) {
    console.error('获取连续上涨统计失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取连续天数超过阈值的币种
app.get('/api/consecutive-rise/above-threshold', async (c) => {
  try {
    const threshold = parseInt(c.req.query('threshold') || '20');
    const consecutiveRiseService = new ConsecutiveRiseService(c.env.DB);
    const coins = await consecutiveRiseService.getCoinsAboveThreshold(threshold);
    
    return c.json({
      success: true,
      threshold,
      coins,
      count: coins.length
    });
  } catch (error: any) {
    console.error('获取连续上涨统计失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 手动更新每日连续上涨统计
// API: 回溯分析历史K线数据（修复后的正确版本）
app.post('/api/consecutive-rise/analyze-history', async (c) => {
  try {
    const timeframe = c.req.query('timeframe') || '5m';
    const limit = parseInt(c.req.query('limit') || '1000');
    
    const consecutiveRiseService = new ConsecutiveRiseService(c.env.DB);
    const result = await consecutiveRiseService.analyzeHistoricalData(timeframe, limit);
    
    return c.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('分析历史数据失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 更新单个币种的K线统计
app.post('/api/consecutive-rise/update/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const timeframe = c.req.query('timeframe') || '5m';
    
    const consecutiveRiseService = new ConsecutiveRiseService(c.env.DB);
    await consecutiveRiseService.updateSymbolKline(symbol, timeframe);
    
    return c.json({
      success: true,
      message: `${symbol} 的连续统计已更新`
    });
  } catch (error: any) {
    console.error('更新K线统计失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取监控日志（通过shell命令）
app.get('/api/monitor-log', async (c) => {
  try {
    const lines = parseInt(c.req.query('lines') || '100');
    
    // 使用shell命令读取日志
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const { stdout } = await execPromise(`tail -n 500 /home/user/webapp/health-monitor.log`);
    const logLines = stdout.trim().split('\n');
    
    // 提取所有"开始健康检查"的记录
    const checkLines = logLines.filter((line: string) => line.includes('开始健康检查'));
    const recentChecks = checkLines.slice(-lines);
    
    // 解析检查记录
    const checks: any[] = [];
    let prevEpoch: number | null = null;
    
    recentChecks.forEach((line: string) => {
      const match = line.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
      if (match) {
        const time = match[1];
        const epoch = new Date(time).getTime() / 1000;
        
        let interval = '-';
        let status = '-';
        
        if (prevEpoch !== null) {
          const diff = Math.round(epoch - prevEpoch);
          interval = diff.toString();
          
          if (diff >= 210 && diff <= 270) {
            status = '✅';
          } else if (diff < 10) {
            status = '⚪';
          } else {
            status = '⚠️';
          }
        }
        
        // 查找该检查的结果
        const checkIndex = logLines.indexOf(line);
        let result = '检查中';
        for (let i = checkIndex + 1; i < checkIndex + 10 && i < logLines.length; i++) {
          if (logLines[i].includes('所有检查通过')) {
            result = '✅ 全部通过';
            break;
          } else if (logLines[i].includes('服务重启成功')) {
            result = '🔄 已自动修复';
            break;
          } else if (logLines[i].includes('异常')) {
            result = '❌ 检测到异常';
            break;
          }
        }
        
        checks.push({ time, interval, status, result });
        prevEpoch = epoch;
      }
    });
    
    // 计算统计信息
    const totalChecks = checkLines.length;
    const validIntervals = checks.filter((c: any) => c.interval !== '-' && parseInt(c.interval) > 10).map((c: any) => parseInt(c.interval));
    const avgInterval = validIntervals.length > 0 
      ? Math.round(validIntervals.reduce((a: number, b: number) => a + b, 0) / validIntervals.length)
      : 0;
    
    const lastCheckTime = checks.length > 0 ? checks[checks.length - 1].time : '-';
    const lastEpoch = lastCheckTime !== '-' ? new Date(lastCheckTime).getTime() / 1000 : 0;
    const nextEpoch = lastEpoch + 240;
    const nextCheck = lastEpoch > 0 ? new Date(nextEpoch * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/\//g, '-').substring(0, 19) : '-';
    
    return c.json({
      totalChecks,
      avgInterval,
      lastCheck: lastCheckTime,
      nextCheck,
      checks: checks.reverse(),
      rawLog: logLines.slice(-50).join('\n')
    });
    
  } catch (error: any) {
    console.error('读取监控日志失败:', error);
    return c.json({ 
      totalChecks: 0,
      avgInterval: 0,
      lastCheck: '-',
      nextCheck: '-',
      checks: [],
      rawLog: '日志文件读取失败: ' + error.message 
    }, 500);
  }
});

// API: 波段交易回测
app.post('/api/backtest/convergence-trading', async (c) => {
  try {
    const body = await c.req.json();
    const symbol = body.symbol;
    const timeframe = body.timeframe || '15m';
    const limit = body.limit || 300;
    
    // 🔒 使用只读K线服务（安全：不允许写入K线数据库）
    const { ReadOnlyKlineService } = await import('./services/ReadOnlyKlineService');
    const klineService = new ReadOnlyKlineService(c.env.DB);
    const result = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
    
    // getKlineWithIndicators 返回 { symbol, timeframe, dataCount, data }，没有 success 字段
    if (!result || !result.data || result.data.length === 0) {
      return c.json({ success: false, error: '无法获取K线数据' });
    }
    
    const klineData = result.data;
    
    // 回测参数
    const initialCapital = 100000; // 10万USDT
    const leverage = 10; // 10倍杠杆
    const feeRate = 0.0005; // 0.05% 手续费
    const maxPositions = 2; // 最多同时持有2个仓位
    
    // 回测状态（动态更新）
    let currentCapital = initialCapital; // 当前可用本金
    let totalProfit = 0;
    let totalFees = 0;
    const allTrades: any[] = []; // 所有交易记录
    const openPositions: Map<number, any> = new Map(); // 当前持仓 <index, position>
    
    // 震荡收敛检测（与前端逻辑一致）
    const convergenceAlertIndex = new Set();
    const peakAlertIndex = new Set();
    const processedRanges: any[] = [];
    
    for (let index = 4; index < klineData.length; index++) {
      let convergenceCount = 0;
      const convergencePositions: number[] = [];
      
      for (let i = index - 4; i <= index; i++) {
        const channelState = klineData[i].channel_state || '';
        if (channelState.includes('震荡收敛')) {
          convergenceCount++;
          convergencePositions.push(i);
        }
      }
      
      if (convergenceCount >= 2 && convergencePositions.length >= 2) {
        const first = convergencePositions[0];
        const last = convergencePositions[convergencePositions.length - 1];
        
        const alreadyProcessed = processedRanges.some(range => {
          return first >= range.start && last <= range.end;
        });
        
        if (alreadyProcessed) continue;
        
        const rangeStart = Math.max(0, first - 10);
        const rangeEnd = Math.min(klineData.length - 1, last + 10);
        processedRanges.push({ start: rangeStart, end: rangeEnd });
        
        let minBandwidth = Infinity;
        let minBandwidthIndex = -1;
        
        for (let i = rangeStart; i <= rangeEnd; i++) {
          const bollUB = klineData[i].boll_ub;
          const bollLB = klineData[i].boll_lb;
          if (bollUB && bollLB) {
            const bandwidth = bollUB - bollLB;
            if (bandwidth < minBandwidth) {
              minBandwidth = bandwidth;
              minBandwidthIndex = i;
            }
          }
        }
        
        if (minBandwidthIndex >= 0) {
          convergenceAlertIndex.add(minBandwidthIndex);
          
          const searchEnd = Math.max(0, minBandwidthIndex - 20);
          for (let i = minBandwidthIndex - 1; i >= searchEnd; i--) {
            const rsi5min = klineData[i].rsi_5min;
            const changeStr = klineData[i].change;
            
            if (rsi5min && changeStr) {
              const changeValue = parseFloat(changeStr);
              if (rsi5min > 65 && changeValue <= 0.1) {
                peakAlertIndex.add(i);
                break;
              }
            }
          }
        }
      }
    }
    
    // ===== 按时间正序执行交易（从旧到新）=====
    // klineData[0]是最新，klineData[length-1]是最旧
    // 所以我们从后往前遍历（从旧到新的时间顺序）
    
    let winningTrades = 0;
    let losingTrades = 0;
    
    for (let i = klineData.length - 1; i >= 0; i--) {
      const k = klineData[i];
      
      // ===== 1. 先处理卖出信号（平仓）=====
      if (peakAlertIndex.has(i) && k.close) {
        // 平掉所有该币种的持仓
        const positionsToClose = Array.from(openPositions.entries())
          .filter(([idx, pos]) => pos.symbol === symbol);
        
        for (const [entryIdx, pos] of positionsToClose) {
          const exitPrice = k.close;
          const priceChange = (exitPrice - pos.entryPrice) / pos.entryPrice;
          const profit = pos.positionValue * priceChange;
          const exitFee = pos.positionValue * feeRate;
          const netProfit = profit - pos.entryFee - exitFee;
          
          // 记录平仓前的本金
          const capitalBeforeClose = currentCapital;
          
          // 更新本金
          currentCapital += pos.positionSize + netProfit;
          totalProfit += netProfit;
          totalFees += exitFee;
          
          // 更新胜率统计
          if (netProfit > 0) {
            winningTrades++;
          } else {
            losingTrades++;
          }
          
          const currentWinRate = (winningTrades + losingTrades) > 0 
            ? ((winningTrades / (winningTrades + losingTrades)) * 100).toFixed(2) 
            : '0.00';
          
          // 记录交易
          allTrades.push({
            symbol: pos.symbol,
            type: 'LONG',
            entryTime: pos.entryTime,
            entryPrice: pos.entryPrice,
            exitTime: k.time,
            exitPrice,
            positionSize: pos.positionSize,
            leverage: pos.leverage,
            priceChange: (priceChange * 100).toFixed(2) + '%',
            profit: profit.toFixed(2),
            fees: (pos.entryFee + exitFee).toFixed(2),
            netProfit: netProfit.toFixed(2),
            capitalBefore: capitalBeforeClose.toFixed(2),
            capitalAfter: currentCapital.toFixed(2),
            winRate: currentWinRate + '%',
            status: netProfit > 0 ? 'WIN' : 'LOSS'
          });
          
          // 移除持仓
          openPositions.delete(entryIdx);
        }
      }
      
      // ===== 2. 再处理买入信号（开仓）=====
      if (convergenceAlertIndex.has(i) && k.close) {
        // 检查条件：
        // 1. 当前持仓数 < maxPositions
        // 2. 有足够的本金
        const currentPositions = openPositions.size;
        
        if (currentPositions < maxPositions && currentCapital > 0) {
          // 计算每个仓位使用的本金（剩余本金的50%）
          const positionSize = currentCapital * 0.5;
          const entryPrice = k.close;
          const positionValue = positionSize * leverage;
          const entryFee = positionValue * feeRate;
          
          // 检查本金是否足够支付手续费
          if (positionSize > entryFee) {
            // 扣除本金
            currentCapital -= positionSize;
            totalFees += entryFee;
            
            // 开仓
            openPositions.set(i, {
              symbol,
              entryPrice,
              entryTime: k.time,
              entryIndex: i,
              positionSize,
              leverage,
              positionValue,
              entryFee
            });
          }
        }
      }
    }
    
    // 计算最终统计数据
    const finalCapital = currentCapital; // 剩余本金
    const totalTrades = allTrades.length;
    const finalWinRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : '0.00';
    const returnRate = ((finalCapital - initialCapital) / initialCapital * 100).toFixed(2);
    
    // 交易记录已经按时间正序（从旧到新），无需reverse
    
    return c.json({
      success: true,
      backtest: {
        symbol,
        timeframe,
        dataPoints: klineData.length,
        buySignals: convergenceAlertIndex.size,
        sellSignals: peakAlertIndex.size
      },
      capital: {
        initial: initialCapital,
        final: finalCapital.toFixed(2),
        profit: totalProfit.toFixed(2),
        fees: totalFees.toFixed(2),
        returnRate: returnRate + '%'
      },
      trading: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: finalWinRate + '%',
        openPositions: openPositions.size
      },
      trades: allTrades
    });
    
  } catch (error: any) {
    console.error('回测失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 批量回测API - 统一本金池
app.post('/api/backtest/batch-all', async (c) => {
  try {
    const body = await c.req.json();
    const symbols = body.symbols || []; // 所有币种数组
    const timeframe = body.timeframe || '5m';
    const limit = body.limit || 500;
    
    // 新增配置参数
    const strategies = body.strategies || ['convergence']; // 策略：['convergence', 'peak']
    const leverage = body.leverage || 10; // 杠杆倍数
    const positionSizeFixed = body.positionSizeFixed || 10000; // 固定开仓金额（例如：10,000 USDT）
    const stopLossRatio = body.stopLoss || null; // 止损阈值（小数，null表示不止损）
    
    if (symbols.length === 0) {
      return c.json({ success: false, error: '未提供币种列表' });
    }
    
    console.log('回测配置:', {
      symbols: symbols.length,
      strategies,
      leverage,
      positionSizeFixed: `$${positionSizeFixed.toLocaleString()}`,
      stopLossRatio: stopLossRatio ? `${(stopLossRatio * 100).toFixed(1)}%` : '不止损'
    });
    
    // 🔒 1. 使用只读K线服务（安全：不允许写入K线数据库）
    const { ReadOnlyKlineService } = await import('./services/ReadOnlyKlineService');
    const klineService = new ReadOnlyKlineService(c.env.DB);
    const allSignals: any[] = []; // 所有买卖信号
    
    for (const symbol of symbols) {
      try {
        const result = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
        
        if (!result || !result.data || result.data.length === 0) {
          continue; // 跳过无数据的币种
        }
        
        const klineData = result.data;
        
        // 检测震荡收敛信号（买入）
        const convergenceAlertIndex = new Set();
        const processedRanges: any[] = [];
        
        for (let index = 4; index < klineData.length; index++) {
          let convergenceCount = 0;
          const convergencePositions: number[] = [];
          
          for (let i = index - 4; i <= index; i++) {
            const channelState = klineData[i].channel_state || '';
            if (channelState.includes('震荡收敛')) {
              convergenceCount++;
              convergencePositions.push(i);
            }
          }
          
          if (convergenceCount >= 2 && convergencePositions.length >= 2) {
            const first = convergencePositions[0];
            const last = convergencePositions[convergencePositions.length - 1];
            
            const hasOverlap = processedRanges.some(range => {
              return !(last < range.start || first > range.end);
            });
            
            if (!hasOverlap) {
              processedRanges.push({ start: first, end: last });
              convergenceAlertIndex.add(index);
              
              // 添加买入信号
              allSignals.push({
                type: 'BUY',
                symbol,
                time: klineData[index].time,
                timestamp: new Date(klineData[index].time).getTime(),
                price: klineData[index].close,
                index,
                klineData
              });
            }
          }
        }
        
        // 检测波段高点信号（卖出） - 从震荡收敛点往后搜索25根K线
        for (const convIndex of Array.from(convergenceAlertIndex)) {
          // 从收敛点往后搜索25根K线
          const searchEnd = Math.min(klineData.length, convIndex + 25);
          let peakFound = false;
          
          for (let i = convIndex + 1; i < searchEnd; i++) {
            const k = klineData[i];
            const rsi5min = k.rsi_5min;
            const changeStr = k.change;
            
            if (rsi5min && changeStr) {
              const changeValue = parseFloat(changeStr);
              // RSI>65 且 涨幅<=0.1%
              if (rsi5min > 65 && changeValue <= 0.1) {
                // 找到波段高点，添加卖出信号
                allSignals.push({
                  type: 'SELL',
                  symbol,
                  time: k.time,
                  timestamp: new Date(k.time).getTime(),
                  price: k.close,
                  index: i,
                  reason: 'peak' // 标记为波段高点
                });
                peakFound = true;
                break; // 找到一个就跳出
              }
            }
          }
          
          // 如果25根K线内没找到波段高点，第25根K线默认为波段高点
          if (!peakFound && searchEnd > convIndex + 1) {
            const defaultPeakIndex = searchEnd - 1;
            const k = klineData[defaultPeakIndex];
            allSignals.push({
              type: 'SELL',
              symbol,
              time: k.time,
              timestamp: new Date(k.time).getTime(),
              price: k.close,
              index: defaultPeakIndex,
              reason: 'default_peak' // 标记为默认波段高点（第25根）
            });
          }
        }
        
      } catch (error) {
        console.error(`获取 ${symbol} 数据失败:`, error);
      }
    }
    
    // 2. 按时间排序所有信号
    allSignals.sort((a, b) => a.timestamp - b.timestamp);
    
    // 🔧 简单去重策略：同symbol+time+type只保留一个
    const uniqueSignalsMap = new Map<string, any>();
    for (const signal of allSignals) {
      const key = `${signal.symbol}_${signal.time}_${signal.type}`;
      if (!uniqueSignalsMap.has(key)) {
        uniqueSignalsMap.set(key, signal);
      }
    }
    const uniqueSignals = Array.from(uniqueSignalsMap.values());
    
    console.log(`🔍 信号去重: ${allSignals.length} → ${uniqueSignals.length} (移除了 ${allSignals.length - uniqueSignals.length} 个重复信号)`);
    
    // 打印前10个信号及其来源
    console.log('前10个信号:', uniqueSignals.slice(0, 10).map(s => ({
      type: s.type,
      symbol: s.symbol,
      time: s.time,
      price: s.price,
      reason: s.reason // peak/default_peak
    })));
    
    // 3. 统一本金池执行交易
    const initialCapital = 100000;
    const feeRate = 0.0005;
    const maxPositions = 2;
    
    let currentCapital = initialCapital;
    let totalProfit = 0;
    let totalFees = 0;
    const allTrades: any[] = [];
    const openPositions: Map<string, any> = new Map(); // <symbol+index, position>
    
    let winningTrades = 0;
    let losingTrades = 0;
    
    // 按时间顺序处理信号（使用去重后的信号）
    let buyCount = 0;
    let sellCount = 0;
    
    for (const signal of uniqueSignals) {
      if (signal.type === 'SELL') {
        sellCount++;
        // 平仓：找到该币种的所有持仓
        const positionsToClose = Array.from(openPositions.entries())
          .filter(([key, pos]) => pos.symbol === signal.symbol);
        
        // 没有匹配的持仓是正常的（可能该币种还没开仓，或已平仓）
        // 不需要警告日志
        
        for (const [key, pos] of positionsToClose) {
          const exitPrice = signal.price;
          const priceChange = (exitPrice - pos.entryPrice) / pos.entryPrice;
          
          // 修正杠杆计算：杠杆倍数×价格变化 = 收益率
          // 例如：10倍杠杆，涨1%，则本金收益10%
          const leveragedReturn = priceChange * leverage;
          const profit = pos.positionSize * leveragedReturn; // 本金×杠杆收益率
          
          const exitFee = pos.positionSize * leverage * feeRate; // 手续费基于杠杆后价值
          const netProfit = profit - pos.entryFee - exitFee;
          
          // 记录平仓前本金
          const capitalBeforeClose = currentCapital;
          
          // 更新本金
          currentCapital += pos.positionSize + netProfit;
          totalProfit += netProfit;
          totalFees += exitFee;
          
          // 更新胜率
          if (netProfit > 0) {
            winningTrades++;
          } else {
            losingTrades++;
          }
          
          const currentWinRate = (winningTrades + losingTrades) > 0 
            ? ((winningTrades / (winningTrades + losingTrades)) * 100).toFixed(2) 
            : '0.00';
          
          // 记录交易
          allTrades.push({
            symbol: pos.symbol,
            type: 'LONG',
            entryTime: pos.entryTime,
            entryPrice: pos.entryPrice,
            exitTime: signal.time,
            exitPrice,
            positionSize: pos.positionSize,
            positionValue: (pos.positionSize * leverage).toFixed(2), // 买入金额 = 本金 × 杠杆
            leverage: pos.leverage,
            priceChange: (priceChange * 100).toFixed(2) + '%', // 价格涨跌幅
            leveragedReturn: (leveragedReturn * 100).toFixed(2) + '%', // 杠杆后收益率
            profit: profit.toFixed(2),
            fees: (pos.entryFee + exitFee).toFixed(2),
            netProfit: netProfit.toFixed(2),
            capitalBefore: capitalBeforeClose.toFixed(2),
            capitalAfter: currentCapital.toFixed(2),
            winRate: currentWinRate + '%',
            status: netProfit > 0 ? 'WIN' : 'LOSS'
          });
          
          openPositions.delete(key);
        }
        
      } else if (signal.type === 'BUY') {
        buyCount++;
        
        // 开仓
        const currentPositions = openPositions.size;
        
        // 🔧 检查该币种是否已经有持仓（避免重复开仓）
        const hasPositionForSymbol = Array.from(openPositions.values())
          .some(pos => pos.symbol === signal.symbol);
        
        if (currentPositions < maxPositions && currentCapital > 0 && !hasPositionForSymbol) {
          // 使用固定开仓金额（例如：10,000 USDT）
          // 如果剩余本金不足，则使用剩余全部本金
          const positionSize = Math.min(positionSizeFixed, currentCapital);
          const entryPrice = signal.price;
          const entryFee = positionSize * leverage * feeRate;
          
          if (positionSize > entryFee && positionSize > 0) {
            currentCapital -= positionSize;
            totalFees += entryFee;
            
            const posKey = `${signal.symbol}_${signal.index}`;
            openPositions.set(posKey, {
              symbol: signal.symbol,
              entryPrice,
              entryTime: signal.time,
              entryIndex: signal.index,
              positionSize,
              leverage,
              entryFee
            });
            console.log(`✅ 开仓成功: ${signal.symbol} @ ${entryPrice} (${signal.time}), 本金=$${positionSize.toFixed(2)}`);
          }
        } else {
          if (hasPositionForSymbol) {
            console.log(`⚠️ BUY信号跳过: ${signal.symbol} 已有持仓`);
          } else if (currentPositions >= maxPositions) {
            console.log(`⚠️ BUY信号跳过: ${signal.symbol} 达到最大持仓数(${maxPositions})`);
          }
        }
      }
      
      // 检查止损（在每个信号处理后检查所有持仓）
      if (stopLossRatio !== null) {
        const currentPrice = signal.price;
        const positionsToStopLoss: [string, any][] = [];
        
        // 找出需要止损的仓位
        for (const [key, pos] of openPositions.entries()) {
          // 只检查当前信号相关的币种
          if (pos.symbol === signal.symbol) {
            const priceChange = (currentPrice - pos.entryPrice) / pos.entryPrice;
            const leveragedReturn = priceChange * leverage;
            
            // 如果亏损超过止损阈值
            if (leveragedReturn <= -stopLossRatio) {
              positionsToStopLoss.push([key, pos]);
            }
          }
        }
        
        // 执行止损平仓
        for (const [key, pos] of positionsToStopLoss) {
          const exitPrice = currentPrice;
          const priceChange = (exitPrice - pos.entryPrice) / pos.entryPrice;
          const leveragedReturn = priceChange * leverage;
          const profit = pos.positionSize * leveragedReturn;
          const exitFee = pos.positionSize * leverage * feeRate;
          const netProfit = profit - pos.entryFee - exitFee;
          
          const capitalBeforeClose = currentCapital;
          currentCapital += pos.positionSize + netProfit;
          totalProfit += netProfit;
          totalFees += exitFee;
          
          losingTrades++; // 止损一定是亏损
          
          const currentWinRate = (winningTrades + losingTrades) > 0 
            ? ((winningTrades / (winningTrades + losingTrades)) * 100).toFixed(2) 
            : '0.00';
          
          allTrades.push({
            symbol: pos.symbol,
            type: 'LONG',
            entryTime: pos.entryTime,
            entryPrice: pos.entryPrice,
            exitTime: signal.time,
            exitPrice,
            positionSize: pos.positionSize,
            positionValue: (pos.positionSize * leverage).toFixed(2), // 买入金额
            leverage: pos.leverage,
            priceChange: (priceChange * 100).toFixed(2) + '%', // 价格涨跌幅
            leveragedReturn: (leveragedReturn * 100).toFixed(2) + '%', // 杠杆后收益率
            profit: profit.toFixed(2),
            fees: (pos.entryFee + exitFee).toFixed(2),
            netProfit: netProfit.toFixed(2),
            capitalBefore: capitalBeforeClose.toFixed(2),
            capitalAfter: currentCapital.toFixed(2),
            winRate: currentWinRate + '%',
            status: 'STOP_LOSS'
          });
          
          openPositions.delete(key);
        }
      }
    }
    
    // 4. 计算最终统计
    console.log(`📊 信号统计: BUY=${buyCount}, SELL=${sellCount}`);
    console.log(`📊 交易统计: 完成交易=${allTrades.length}, 持仓中=${openPositions.size}`);
    
    // 需要把未平仓的本金加回来
    let lockedCapital = 0;
    for (const [key, pos] of openPositions.entries()) {
      lockedCapital += pos.positionSize;
      console.log(`持仓: ${pos.symbol} @ ${pos.entryPrice} (${pos.entryTime})`);
    }
    
    const finalCapital = currentCapital + lockedCapital;
    const totalTrades = allTrades.length;
    const finalWinRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : '0.00';
    const returnRate = ((finalCapital - initialCapital) / initialCapital * 100).toFixed(2);
    
    return c.json({
      success: true,
      backtest: {
        symbols: symbols.length,
        timeframe,
        totalSignals: allSignals.length
      },
      capital: {
        initial: initialCapital,
        final: finalCapital.toFixed(2),
        profit: (finalCapital - initialCapital).toFixed(2),
        fees: totalFees.toFixed(2),
        returnRate: returnRate + '%'
      },
      trading: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: finalWinRate + '%',
        openPositions: openPositions.size
      },
      trades: allTrades
    });
    
  } catch (error: any) {
    console.error('批量回测失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 回填注意启动操作提示
app.post('/api/kline/backfill-operation-tips', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const symbol = body.symbol || 'BTC';
    const timeframe = body.timeframe || '5m';
    
    console.log(`🔄 开始回填操作提示: ${symbol} ${timeframe}`);
    
    // 获取该币种的所有K线数据（包括技术指标）
    const { ReadOnlyKlineService } = await import('./services/ReadOnlyKlineService');
    const klineService = new ReadOnlyKlineService(c.env.DB);
    const result = await klineService.getKlineWithIndicators(symbol, timeframe, 10000);
    
    if (!result.data || result.data.length === 0) {
      return c.json({ 
        success: false, 
        message: `未找到 ${symbol} ${timeframe} 的K线数据` 
      });
    }
    
    const klines = result.data;
    console.log(`📊 找到 ${klines.length} 条K线数据，开始计算操作提示...`);
    
    // 1. 检测震荡收敛（注意启动）
    // 规则：10根K线内只允许有1个注意启动
    const convergenceIndices: number[] = [];
    const operationTips: Map<number, string> = new Map();
    const usedRanges: Array<{start: number, end: number}> = [];
    
    for (let i = 4; i < klines.length; i++) {
      // 🔴 关键条件：当前K线本身必须是"震荡收敛"
      const currentK = klines[i];
      if (!currentK.channel_state || !currentK.channel_state.includes('震荡收敛')) {
        continue; // 当前K线不是震荡收敛，跳过
      }
      
      const last5 = klines.slice(i - 4, i + 1);
      let convergenceCount = 0;
      
      // 统计5根K线中震荡收敛的数量
      for (const k of last5) {
        if (k.channel_state && k.channel_state.includes('震荡收敛')) {
          convergenceCount++;
        }
      }
      
      // 如果5根K线中有2个或以上震荡收敛（包括当前这根）
      if (convergenceCount >= 2) {
        // 🆕 新增条件：RSI 5分钟必须小于40
        const rsi5min = currentK.rsi_5min || 0;
        if (rsi5min >= 40) {
          continue; // RSI不满足条件，跳过
        }
        
        // 检查前后10根范围是否已经有注意启动
        const rangeStart = Math.max(0, i - 10);
        const rangeEnd = Math.min(klines.length - 1, i + 10);
        
        let hasOverlap = false;
        for (const usedRange of usedRanges) {
          // 检查是否有重叠
          if (!(rangeEnd < usedRange.start || rangeStart > usedRange.end)) {
            hasOverlap = true;
            break;
          }
        }
        
        // 如果没有重叠，添加注意启动
        if (!hasOverlap) {
          convergenceIndices.push(i);
          operationTips.set(i, '注意启动');
          usedRanges.push({start: rangeStart, end: rangeEnd});
        }
      }
    }
    
    console.log(`✅ 检测到 ${convergenceIndices.length} 个注意启动信号（去重后）`);
    
    // 2. 检测高抛信号（会覆盖注意启动）
    let highSellCount = 0;
    for (let i = 0; i < klines.length; i++) {
      const k = klines[i];
      
      // 条件1：多头信号
      if (k.signal && k.signal.startsWith('多头')) {
        // 条件2：涨跌幅<0.1%
        const changeValue = k.change ? parseFloat(k.change) : 0;
        const isSmallChange = Math.abs(changeValue) < 0.1;
        
        // 条件3：RSI5分钟>69
        const rsi5min = k.rsi_5min || 0;
        const isHighRSI = rsi5min > 69;
        
        // 条件4：SAR变化%在增加
        const currentSarChangePercent = k.sarChangePercent || 0;
        let isSarIncreasing = false;
        
        if (i + 1 < klines.length) {
          const prevSarChangePercent = klines[i + 1].sarChangePercent || 0;
          isSarIncreasing = currentSarChangePercent > prevSarChangePercent;
        }
        
        // 满足所有条件，添加"高抛"提示（覆盖注意启动）
        if (isSmallChange && isHighRSI && isSarIncreasing) {
          operationTips.set(i, '高抛');
          highSellCount++;
        }
      }
    }
    
    console.log(`✅ 检测到 ${highSellCount} 个高抛信号`);
    
    // 3. 检测低吸信号（会覆盖注意启动，但不覆盖高抛）
    let lowBuyCount = 0;
    for (let i = 0; i < klines.length; i++) {
      const k = klines[i];
      
      // 如果已经是高抛信号，跳过
      if (operationTips.get(i) === '高抛') {
        continue;
      }
      
      // 条件1：RSI 5分钟 < 25
      const rsi5min = k.rsi_5min || 0;
      const isLowRSI = rsi5min < 25;
      
      // 条件2：成交量大于V2或V1
      const isHighVolume = k.is_v2 || k.is_v1;
      
      // 满足所有条件，添加"低吸"提示（覆盖注意启动）
      if (isLowRSI && isHighVolume) {
        operationTips.set(i, '低吸');
        lowBuyCount++;
      }
    }
    
    console.log(`✅ 检测到 ${lowBuyCount} 个低吸信号`);
    
    // 4. 检测波段高点信号（从注意启动往前搜索25根K线，因为数据是倒序）
    let peakCount = 0;
    for (const convIndex of convergenceIndices) {
      // K线数据是倒序（最新在前），所以往前搜索（index减小）代表时间往后
      const searchStart = Math.max(0, convIndex - 25);
      let peakFound = false;
      
      // 从注意启动的下一根开始往前搜索
      for (let i = convIndex - 1; i >= searchStart; i--) {
        const k = klines[i];
        
        // 如果已经是高抛或低吸信号，跳过这根K线
        const currentTip = operationTips.get(i);
        if (currentTip === '高抛' || currentTip === '低吸') {
          continue;
        }
        
        // 条件1：RSI 5分钟 > 65
        const rsi5min = k.rsi_5min || 0;
        const isPeakRSI = rsi5min > 65;
        
        // 条件2：涨跌幅 ≤ 0.1%（横盘）
        const changeValue = k.change ? parseFloat(k.change) : 0;
        const isSmallChange = Math.abs(changeValue) <= 0.1;
        
        // 条件3：成交量大于V2或V1
        const hasVolume = k.is_v2 || k.is_v1;
        
        // 满足所有条件，添加"波段高点"提示
        if (isPeakRSI && isSmallChange && hasVolume) {
          operationTips.set(i, '波段高点');
          peakCount++;
          peakFound = true;
          break; // 找到一个就跳出，继续下一个注意启动
        }
      }
      
      // 如果25根K线内没找到波段高点，第25根默认为波段高点（如果不是高抛或低吸）
      if (!peakFound && convIndex > searchStart) {
        const defaultPeakIndex = searchStart;
        const currentTip = operationTips.get(defaultPeakIndex);
        
        // 只有当该位置不是高抛或低吸时，才设置为默认波段高点
        if (currentTip !== '高抛' && currentTip !== '低吸') {
          operationTips.set(defaultPeakIndex, '波段高点');
          peakCount++;
        }
      }
    }
    
    console.log(`✅ 检测到 ${peakCount} 个波段高点信号`);
    
    // 5. 批量更新数据库
    let updatedCount = 0;
    const errors: any[] = [];
    
    // 先清空该币种所有的operation_tip
    await c.env.DB.prepare(`
      UPDATE kline_data 
      SET operation_tip = NULL
      WHERE symbol = ? AND timeframe = ?
    `).bind(symbol, timeframe).run();
    
    console.log(`🧹 已清空 ${symbol} ${timeframe} 的旧操作提示`);
    
    // 🆕 步骤1: 更新所有K线的技术指标（持久化存储）
    console.log(`📝 开始更新所有K线的技术指标...`);
    let indicatorCount = 0;
    for (let i = 0; i < klines.length; i++) {
      const k = klines[i];
      try {
        await c.env.DB.prepare(`
          UPDATE kline_data 
          SET 
            channel_state = ?,
            sar = ?,
            sar_change = ?,
            sar_change_percent = ?,
            rsi_5min = ?,
            rsi_1h = ?,
            change_percent = ?,
            change_diff = ?,
            boll_mb = ?,
            boll_ub = ?,
            boll_lb = ?,
            boll_sar_diff = ?,
            boll_angle_mb = ?,
            boll_width_change = ?,
            up_channel_exhaustion_ratio = ?,
            down_channel_exhaustion_ratio = ?,
            volume_level = ?
          WHERE symbol = ? AND timeframe = ? AND open_time = ?
        `).bind(
          k.channel_state || null,
          k.sar || null,
          k.sarChange || null,
          k.sarChangePercent || null,
          k.rsi_5min || null,
          k.rsi_1h || null,
          k.change || null,
          k['change-diff'] || null,
          k.boll_mb || null,
          k.boll_ub || null,
          k.boll_lb || null,
          k.boll_sar_diff || null,
          k.boll_angle_mb || null,
          k.boll_width_change || null,
          k.up_channel_exhaustion_ratio || null,
          k.down_channel_exhaustion_ratio || null,
          k.volume_level || null,
          symbol,
          timeframe,
          new Date(k.time).getTime()
        ).run();
        
        indicatorCount++;
        if (indicatorCount % 100 === 0) {
          console.log(`⏳ 技术指标更新进度: ${indicatorCount}/${klines.length}`);
        }
      } catch (error: any) {
        // 静默处理错误，继续处理下一条
      }
    }
    console.log(`✅ 已更新 ${indicatorCount} 条K线的技术指标`);
    
    // 🆕 步骤2: 更新有operation_tip的K线
    console.log(`📝 开始更新operation_tip...`);
    for (const [index, tip] of operationTips.entries()) {
      const k = klines[index];
      
      try {
        await c.env.DB.prepare(`
          UPDATE kline_data 
          SET operation_tip = ?
          WHERE symbol = ? AND timeframe = ? AND open_time = ?
        `).bind(
          tip,
          symbol,
          timeframe,
          new Date(k.time).getTime()
        ).run();
        
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`⏳ operation_tip更新进度: ${updatedCount}/${operationTips.size}`);
        }
      } catch (error: any) {
        errors.push({
          time: k.time,
          tip: tip,
          error: error.message
        });
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`🎉 回填完成！更新了 ${updatedCount} 条记录，耗时 ${duration}秒`);
    
    return c.json({
      success: true,
      message: '操作提示回填完成',
      summary: {
        symbol: symbol,
        timeframe: timeframe,
        total_klines: klines.length,
        convergence_count: convergenceIndices.length,
        high_sell_count: highSellCount,
        low_buy_count: lowBuyCount,
        peak_count: peakCount,
        updated: updatedCount,
        errors: errors.length,
        duration: `${duration}秒`
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : []
    });
    
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ 回填失败 (耗时 ${duration}秒):`, error.message);
    return c.json({ 
      success: false, 
      error: error.message,
      duration: `${duration}秒`
    }, 500);
  }
});

// API: 批量回填所有币种的操作提示
// API: 清除并重新计算所有10格比价数据
app.post('/api/kline/recalculate-bar10/all', async (c) => {
  const startTime = Date.now();
  const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC',
                   'LTC', 'LINK', 'UNI', 'ATOM', 'ETC', 'XLM', 'NEAR', 'APT', 'ARB', 'OP',
                   'FIL', 'LDO', 'IMX', 'STX', 'MKR', 'INJ', 'RUNE', 'HBAR', 'TAO', 'BCH'];
  
  const results: any[] = [];
  
  try {
    // 1. 先清除所有10格数据
    console.log('🗑️  清除所有10格数据...');
    await c.env.DB.prepare(`
      UPDATE kline_data 
      SET bar_10_compare = NULL
      WHERE timeframe = '5m'
    `).run();
    
    // 2. 重新计算每个币种的10格数据
    for (const symbol of symbols) {
      try {
        console.log(`\n🔄 计算 ${symbol} 的10格数据...`);
        
        // 获取该币种的K线数据（最近1000根，足够计算10格）
        const klines: any = await c.env.DB.prepare(`
          SELECT * FROM kline_data 
          WHERE symbol = ? AND timeframe = '5m'
          ORDER BY open_time DESC 
          LIMIT 1000
        `).bind(symbol).all();
        
        if (!klines.results || klines.results.length === 0) {
          results.push({ symbol, success: false, error: '无K线数据' });
          continue;
        }
        
        const klinesArray = klines.results.reverse(); // 从旧到新排列
        let updateCount = 0;
        
        // 遍历每根K线计算10格比价
        for (let i = 0; i < klinesArray.length; i++) {
          const k = klinesArray[i];
          
          // 获取包含当前K线的10根K线范围
          const bar10Start = Math.max(0, i - 9);
          const bar10Range = klinesArray.slice(bar10Start, i + 1);
          
          if (bar10Range.length >= 2) {
            const currentLow = k.low;
            const currentHigh = k.high;
            
            // 从10根K线中找出最高价和最低价
            let highest = bar10Range[0].high;
            let lowest = bar10Range[0].low;
            
            for (const bar of bar10Range) {
              if (bar.high > highest) highest = bar.high;
              if (bar.low < lowest) lowest = bar.low;
            }
            
            // 只判断当前K线是否等于这个最高/最低价
            let bar10Compare = 0;
            if (currentHigh >= highest) {
              bar10Compare = 1;  // 创新高
            } else if (currentLow <= lowest) {
              bar10Compare = -1; // 创新低
            }
            
            // 更新数据库
            await c.env.DB.prepare(`
              UPDATE kline_data 
              SET bar_10_compare = ?
              WHERE symbol = ? AND timeframe = '5m' AND open_time = ?
            `).bind(bar10Compare, symbol, k.open_time).run();
            
            updateCount++;
          }
        }
        
        results.push({
          symbol,
          success: true,
          updated: updateCount,
          total: klinesArray.length
        });
        
        console.log(`✅ ${symbol} 完成: ${updateCount}/${klinesArray.length} 条更新`);
        
      } catch (error: any) {
        console.error(`❌ ${symbol} 计算失败:`, error.message);
        results.push({
          symbol,
          success: false,
          error: error.message
        });
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = results.filter(r => r.success).length;
    const totalUpdated = results.filter(r => r.success).reduce((sum, r) => sum + r.updated, 0);
    
    return c.json({
      success: true,
      message: `10格数据重新计算完成`,
      duration: `${duration}秒`,
      summary: {
        total_symbols: symbols.length,
        success: successCount,
        failed: symbols.length - successCount,
        total_updated: totalUpdated
      },
      results
    });
    
  } catch (error: any) {
    console.error('❌ 批量计算10格数据失败:', error);
    return c.json({
      success: false,
      error: error.message,
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}秒`
    }, 500);
  }
});

app.post('/api/kline/backfill-operation-tips/all', async (c) => {
  const startTime = Date.now();
  const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC',
                   'LTC', 'LINK', 'UNI', 'ATOM', 'ETC', 'XLM', 'NEAR', 'APT', 'ARB', 'OP',
                   'FIL', 'LDO', 'IMX', 'STX', 'MKR', 'INJ', 'RUNE'];
  
  const results: any[] = [];
  
  for (const symbol of symbols) {
    try {
      console.log(`\n🔄 处理 ${symbol}...`);
      
      // 调用单个币种的回填逻辑
      const response = await fetch(`http://localhost:3000/api/kline/backfill-operation-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe: '5m' })
      });
      
      const result = await response.json();
      results.push(result);
      
    } catch (error: any) {
      console.error(`❌ ${symbol} 回填失败:`, error.message);
      results.push({
        success: false,
        symbol,
        error: error.message
      });
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const successCount = results.filter(r => r.success).length;
  
  return c.json({
    success: true,
    message: `批量回填完成，成功: ${successCount}/${symbols.length}`,
    duration: `${duration}秒`,
    results
  });
});

// ==================== 实盘交易 API ====================
// 🚧 OKX API 集成 - 多账户管理

// API: 获取所有交易账户
app.get('/api/live-trading/accounts', async (c) => {
  try {
    // 从数据库获取所有账户（不包括敏感信息）
    const accounts = await c.env.DB.prepare(`
      SELECT 
        id,
        name,
        is_testnet,
        trading_balance,
        funding_balance,
        daily_pnl,
        last_update,
        created_at
      FROM live_trading_accounts
      ORDER BY created_at DESC
    `).all();
    
    return c.json({ 
      success: true, 
      accounts: accounts.results || [] 
    });
  } catch (error: any) {
    console.error('❌ 获取账户列表失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 添加新账户
app.post('/api/live-trading/accounts', async (c) => {
  try {
    const body = await c.req.json();
    const { name, api_key, secret_key, passphrase, is_testnet } = body;
    
    if (!name || !api_key || !secret_key || !passphrase) {
      return c.json({ 
        success: false, 
        error: '缺少必填字段' 
      }, 400);
    }
    
    // 生成唯一ID
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ⚠️ 注意：实际生产环境中，API密钥应该加密存储
    // 这里为了演示简化，直接存储（生产环境需要使用加密）
    await c.env.DB.prepare(`
      INSERT INTO live_trading_accounts (
        id, name, api_key, secret_key, passphrase, is_testnet, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      accountId,
      name,
      api_key,
      secret_key,
      passphrase,
      is_testnet ? 1 : 0,
      new Date().toISOString()
    ).run();
    
    return c.json({ 
      success: true, 
      message: '账户添加成功',
      account: {
        id: accountId,
        name,
        is_testnet: is_testnet || false
      }
    });
  } catch (error: any) {
    console.error('❌ 添加账户失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 删除账户
app.delete('/api/live-trading/accounts/:id', async (c) => {
  try {
    const accountId = c.req.param('id');
    
    // 删除账户
    await c.env.DB.prepare(`
      DELETE FROM live_trading_accounts WHERE id = ?
    `).bind(accountId).run();
    
    // 同时删除该账户的配置
    await c.env.DB.prepare(`
      DELETE FROM live_trading_configs WHERE account_id = ?
    `).bind(accountId).run();
    
    return c.json({ 
      success: true, 
      message: '账户删除成功' 
    });
  } catch (error: any) {
    console.error('❌ 删除账户失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 刷新账户数据（从OKX获取最新余额和盈亏）
app.post('/api/live-trading/accounts/:id/refresh', async (c) => {
  try {
    const accountId = c.req.param('id');
    
    // 获取账户信息
    const account: any = await c.env.DB.prepare(`
      SELECT * FROM live_trading_accounts WHERE id = ?
    `).bind(accountId).first();
    
    if (!account) {
      return c.json({ 
        success: false, 
        error: '账户不存在' 
      }, 404);
    }
    
    // 🔥 使用真实的 OKX API 获取账户数据
    const okxService = new OKXService({
      apiKey: account.api_key,
      secretKey: account.secret_key,
      passphrase: account.passphrase,
      isTestnet: account.is_testnet === 1,
    });
    
    // 并行获取交易账户和资金账户余额
    const [accountBalance, fundingBalance] = await Promise.all([
      okxService.getAccountBalance(),
      okxService.getFundingBalance(),
    ]);
    
    // 计算交易账户 USDT 余额
    const tradingBalanceUSDT = accountBalance.details.find(d => d.currency === 'USDT')?.balance || 0;
    
    // 计算资金账户 USDT 余额
    const fundingBalanceUSDT = fundingBalance.find((b: any) => b.currency === 'USDT')?.balance || 0;
    
    // 获取当日盈亏（未实现盈亏）
    const dailyPnL = accountBalance.unrealizedPnl;
    
    // 更新数据库
    await c.env.DB.prepare(`
      UPDATE live_trading_accounts 
      SET 
        trading_balance = ?,
        funding_balance = ?,
        daily_pnl = ?,
        last_update = ?
      WHERE id = ?
    `).bind(
      tradingBalanceUSDT,
      fundingBalanceUSDT,
      dailyPnL,
      new Date().toISOString(),
      accountId
    ).run();
    
    // 写入交易日志
    const riskService = new RiskControlService(c.env.DB);
    await riskService.writeLog({
      account_id: accountId,
      log_type: 'balance_refresh',
      timestamp: new Date().toISOString(),
      message: `账户余额刷新成功: 交易账户 ${tradingBalanceUSDT.toFixed(2)} USDT, 资金账户 ${fundingBalanceUSDT.toFixed(2)} USDT`,
      raw_data: JSON.stringify({ accountBalance, fundingBalance }),
    });
    
    return c.json({ 
      success: true,
      message: '账户刷新成功',
      account: {
        id: accountId,
        name: account.name,
        trading_balance: tradingBalanceUSDT,
        funding_balance: fundingBalanceUSDT,
        daily_pnl: dailyPnL,
        last_update: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ 刷新账户失败:', error);
    
    // 写入错误日志
    try {
      const riskService = new RiskControlService(c.env.DB);
      await riskService.writeLog({
        account_id: c.req.param('id'),
        log_type: 'balance_refresh_error',
        timestamp: new Date().toISOString(),
        message: `账户余额刷新失败: ${error.message}`,
        raw_data: JSON.stringify({ error: error.message, stack: error.stack }),
      });
    } catch (logError) {
      console.error('写入错误日志失败:', logError);
    }
    
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 保存账户交易配置
app.post('/api/live-trading/accounts/:id/config', async (c) => {
  try {
    const accountId = c.req.param('id');
    const config = await c.req.json();
    
    // 保存或更新配置
    await c.env.DB.prepare(`
      INSERT INTO live_trading_configs (
        account_id, mode, strategy, symbol, direction, leverage,
        position_ratio, funds_partition, funds_upper_limit, funds_lower_limit,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET
        mode = excluded.mode,
        strategy = excluded.strategy,
        symbol = excluded.symbol,
        direction = excluded.direction,
        leverage = excluded.leverage,
        position_ratio = excluded.position_ratio,
        funds_partition = excluded.funds_partition,
        funds_upper_limit = excluded.funds_upper_limit,
        funds_lower_limit = excluded.funds_lower_limit,
        updated_at = excluded.updated_at
    `).bind(
      accountId,
      config.mode,
      config.strategy,
      config.symbol,
      config.direction,
      config.leverage,
      config.positionRatio,
      config.fundsPartition,
      config.fundsUpperLimit,
      config.fundsLowerLimit,
      new Date().toISOString()
    ).run();
    
    return c.json({ 
      success: true, 
      message: '配置保存成功' 
    });
  } catch (error: any) {
    console.error('❌ 保存配置失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 启动交易
app.post('/api/live-trading/accounts/:id/start', async (c) => {
  try {
    const accountId = c.req.param('id');
    
    // 🚧 TODO: 实现交易启动逻辑
    // 1. 验证配置完整性
    // 2. 检查资金是否充足
    // 3. 启动交易引擎
    
    return c.json({ 
      success: true, 
      message: '交易已启动（演示模式）' 
    });
  } catch (error: any) {
    console.error('❌ 启动交易失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 停止交易
app.post('/api/live-trading/accounts/:id/stop', async (c) => {
  try {
    const accountId = c.req.param('id');
    
    // 🚧 TODO: 实现交易停止逻辑
    
    return c.json({ 
      success: true, 
      message: '交易已停止（演示模式）' 
    });
  } catch (error: any) {
    console.error('❌ 停止交易失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 获取账户持仓
app.get('/api/live-trading/accounts/:id/positions', async (c) => {
  try {
    const accountId = c.req.param('id');
    
    // 🚧 TODO: 从 OKX API 获取实时持仓
    // 这里返回空数组作为演示
    
    return c.json({ 
      success: true, 
      positions: [] 
    });
  } catch (error: any) {
    console.error('❌ 获取持仓失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 获取交易历史
app.get('/api/live-trading/accounts/:id/history', async (c) => {
  try {
    const accountId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');
    
    // 🚧 TODO: 从数据库或 OKX API 获取交易历史
    // 这里返回空数组作为演示
    
    return c.json({ 
      success: true, 
      history: [] 
    });
  } catch (error: any) {
    console.error('❌ 获取交易历史失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 平仓
app.post('/api/live-trading/positions/:id/close', async (c) => {
  try {
    const positionId = c.req.param('id');
    
    // 🚧 TODO: 调用 OKX API 执行平仓
    
    return c.json({ 
      success: true, 
      message: '平仓成功（演示模式）' 
    });
  } catch (error: any) {
    console.error('❌ 平仓失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// ==================== 交易日志和风控规则 API ====================

// API: 获取交易日志
app.get('/api/live-trading/logs', async (c) => {
  try {
    const accountId = c.req.query('account_id');
    const logType = c.req.query('log_type');
    const symbol = c.req.query('symbol');
    const limit = parseInt(c.req.query('limit') || '100');
    
    const riskService = new RiskControlService(c.env.DB);
    const logs = await riskService.getLogs({
      accountId,
      logType,
      symbol,
      limit,
    });
    
    return c.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('❌ 获取交易日志失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取所有风控规则
app.get('/api/live-trading/risk-rules', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM risk_control_rules
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json({
      success: true,
      rules: result.results || [],
    });
  } catch (error: any) {
    console.error('❌ 获取风控规则失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 更新风控规则
app.put('/api/live-trading/risk-rules/:id', async (c) => {
  try {
    const ruleId = c.req.param('id');
    const body = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE risk_control_rules
      SET
        rule_name = ?,
        description = ?,
        is_enabled = ?,
        priority = ?,
        conditions = ?,
        action = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.rule_name,
      body.description,
      body.is_enabled ? 1 : 0,
      body.priority,
      body.conditions,
      body.action,
      new Date().toISOString(),
      ruleId
    ).run();
    
    return c.json({
      success: true,
      message: '风控规则更新成功',
    });
  } catch (error: any) {
    console.error('❌ 更新风控规则失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 添加风控规则
app.post('/api/live-trading/risk-rules', async (c) => {
  try {
    const body = await c.req.json();
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO risk_control_rules (
        id, rule_name, rule_type, description, is_enabled,
        priority, conditions, action, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ruleId,
      body.rule_name,
      body.rule_type,
      body.description,
      body.is_enabled ? 1 : 0,
      body.priority,
      body.conditions,
      body.action,
      new Date().toISOString()
    ).run();
    
    return c.json({
      success: true,
      message: '风控规则添加成功',
      ruleId,
    });
  } catch (error: any) {
    console.error('❌ 添加风控规则失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 删除风控规则
app.delete('/api/live-trading/risk-rules/:id', async (c) => {
  try {
    const ruleId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM risk_control_rules WHERE id = ?
    `).bind(ruleId).run();
    
    return c.json({
      success: true,
      message: '风控规则删除成功',
    });
  } catch (error: any) {
    console.error('❌ 删除风控规则失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取当日风控状态
app.get('/api/live-trading/risk-status/:accountId', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const date = c.req.query('date') || new Date().toISOString().split('T')[0];
    
    const riskService = new RiskControlService(c.env.DB);
    const status = await riskService.getDailyRiskStatus(accountId, date);
    
    return c.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error('❌ 获取风控状态失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取风控触发记录
app.get('/api/live-trading/risk-triggers', async (c) => {
  try {
    const accountId = c.req.query('account_id');
    const limit = parseInt(c.req.query('limit') || '50');
    
    let query = 'SELECT * FROM risk_control_triggers WHERE 1=1';
    const bindings: any[] = [];
    
    if (accountId) {
      query += ' AND account_id = ?';
      bindings.push(accountId);
    }
    
    query += ' ORDER BY trigger_time DESC LIMIT ?';
    bindings.push(limit);
    
    const result = await c.env.DB.prepare(query).bind(...bindings).all();
    
    return c.json({
      success: true,
      triggers: result.results || [],
    });
  } catch (error: any) {
    console.error('❌ 获取风控触发记录失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取币种列表（复用现有的币种配置）
app.get('/api/kline/symbols', async (c) => {
  try {
    const klineService = new KlineService(c.env.DB);
    const configs: any = await klineService.getAllOKXConfigs();
    const symbols = configs.map((config: any) => config.symbol);
    
    return c.json({ 
      success: true, 
      symbols 
    });
  } catch (error: any) {
    console.error('❌ 获取币种列表失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// ==================== 交易信号管理 API ====================

// API: 获取做多信号
app.get('/api/signals/long', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'long'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做多信号失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 获取做空信号
app.get('/api/signals/short', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'short'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做空信号失败:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// API: 创建新信号
app.post('/api/signals', async (c) => {
  try {
    const body = await c.req.json();
    const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Validation
    if (!body.signal_name || !body.signal_type || !body.category) {
      return c.json({
        success: false,
        error: '信号名称、类型和分类为必填项'
      }, 400);
    }
    
    if (!['long', 'short'].includes(body.signal_type)) {
      return c.json({
        success: false,
        error: '信号类型必须是 long 或 short'
      }, 400);
    }
    
    await c.env.DB.prepare(`
      INSERT INTO trading_signals_v2 (
        id, signal_type, signal_name, category, description,
        conditions, priority, is_enabled, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      signalId,
      body.signal_type,
      body.category,
      body.description || null,
      body.conditions || null,
      body.priority || 50,
      body.is_enabled !== undefined ? (body.is_enabled ? 1 : 0) : 1,
      now
    ).run();
    
    return c.json({
      success: true,
      message: '信号创建成功',
      signalId
    });
  } catch (error: any) {
    console.error('❌ 创建信号失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// API: 更新信号
app.put('/api/signals/:id', async (c) => {
  try {
    const signalId = c.req.param('id');
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    // Build dynamic update query
    const updates: string[] = [];
    const bindings: any[] = [];
    
    if (body.signal_name !== undefined) {
      updates.push('signal_name = ?');
      bindings.push(body.signal_name);
    }
    if (body.signal_type !== undefined) {
      updates.push('signal_type = ?');
      bindings.push(body.signal_type);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      bindings.push(body.category);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      bindings.push(body.description);
    }
    if (body.conditions !== undefined) {
      updates.push('conditions = ?');
      bindings.push(body.conditions);
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      bindings.push(body.priority);
    }
    if (body.is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      bindings.push(body.is_enabled ? 1 : 0);
    }
    if (body.success_rate !== undefined) {
      updates.push('success_rate = ?');
      bindings.push(body.success_rate);
    }
    
    updates.push('updated_at = ?');
    bindings.push(now);
    bindings.push(signalId);
    
    if (updates.length === 0) {
      return c.json({
        success: false,
        error: '没有需要更新的字段'
      }, 400);
    }
    
    await c.env.DB.prepare(`
      UPDATE trading_signals_v2
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();
    
    return c.json({
      success: true,
      message: '信号更新成功'
    });
  } catch (error: any) {
    console.error('❌ 更新信号失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// API: 删除信号
app.delete('/api/signals/:id', async (c) => {
  try {
    const signalId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM trading_signals_v2 WHERE id = ?
    `).bind(signalId).run();
    
    return c.json({
      success: true,
      message: '信号删除成功'
    });
  } catch (error: any) {
    console.error('❌ 删除信号失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// 🆕 API: 从K线操作提示导入信号到特征库
app.post('/api/signals/import-from-kline', async (c) => {
  try {
    const body = await c.req.json();
    const { symbols, timeframe = '5m', limit = 300 } = body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return c.json({
        success: false,
        error: '请提供要导入的币种列表'
      }, 400);
    }
    
    console.log(`🔄 开始从K线操作提示导入信号: ${symbols.join(', ')}`);
    
    const klineService = new KlineService(c.env.DB);
    const imported = {
      long: 0,  // 做多信号（低吸）
      short: 0, // 做空信号（高抛）
      total: 0
    };
    
    for (const symbol of symbols) {
      try {
        // 获取该币种的K线数据和操作提示
        const klineData = await klineService.getKlineWithIndicators(symbol, timeframe, limit);
        
        if (!klineData.success || !klineData.data) {
          console.log(`⏭️  ${symbol}: 无K线数据`);
          continue;
        }
        
        const klines = klineData.data;
        
        // 筛选有操作提示的K线
        const tipsToImport = klines.filter((k: any) => 
          k.operation_tip && ['抄底做多', '顶部做空', '波段高点', '注意启动', '次日主升'].includes(k.operation_tip)
        );
        
        console.log(`📊 ${symbol}: 找到 ${tipsToImport.length} 个操作提示`);
        
        for (const k of tipsToImport) {
          const now = new Date().toISOString();
          let signalType = '';
          let signalName = '';
          let category = 'action_hint';
          let description = '';
          
          // 根据操作提示类型判断信号类型
          // 用户提供的正确映射：
          // 抄底做多 → 做多买点
          // 顶部做空 → 做多卖点（注意：不是做空信号！）
          // 波段高点 → 做多卖点
          // 注意启动 → 做多买点
          // 次日主升 → 做多买点
          
          if (k.operation_tip === '抄底做多') {
            // 抄底做多 = 做多买点
            signalType = 'long';
            signalName = `${symbol} - 抄底做多（买点）`;
            description = `抄底做多信号，适合做多开仓。时间：${k.time || ''}，价格：${k.close || ''}，RSI：${k.rsi_5min || 'N/A'}`;
            imported.long++;
          } else if (k.operation_tip === '顶部做空') {
            // 顶部做空 = 做多卖点（注意：这是做多的卖出信号，不是做空信号！）
            signalType = 'long';
            signalName = `${symbol} - 顶部做空（卖点）`;
            description = `顶部做空信号，适合做多平仓/卖出。时间：${k.time || ''}，价格：${k.close || ''}，RSI：${k.rsi_5min || 'N/A'}`;
            imported.long++;
          } else if (k.operation_tip === '波段高点') {
            // 波段高点 = 做多卖点
            signalType = 'long';
            signalName = `${symbol} - 波段高点（卖点）`;
            description = `波段高点信号，适合做多平仓/卖出。时间：${k.time || ''}，价格：${k.close || ''}，RSI：${k.rsi_5min || 'N/A'}`;
            imported.long++;
          } else if (k.operation_tip === '注意启动') {
            // 注意启动 = 做多买点
            signalType = 'long';
            signalName = `${symbol} - 注意启动（买点）`;
            description = `注意启动信号，震荡收敛后可能启动，适合做多开仓。时间：${k.time || ''}，价格：${k.close || ''}，RSI：${k.rsi_5min || 'N/A'}`;
            imported.long++;
          } else if (k.operation_tip === '次日主升') {
            // 次日主升 = 做多买点
            signalType = 'long';
            signalName = `${symbol} - 次日主升（买点）`;
            description = `次日主升信号，预期次日将有主升行情，适合做多开仓。时间：${k.time || ''}，价格：${k.close || ''}，RSI：${k.rsi_5min || 'N/A'}`;
            imported.long++;
          }
          
          if (signalType) {
            const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // 构建条件JSON
            const conditions = JSON.stringify({
              symbol: symbol,
              timeframe: timeframe,
              operation_tip: k.operation_tip,
              kline_time: k.time,
              price: k.close,
              rsi_5min: k.rsi_5min,
              is_v1: k.is_v1,
              is_v2: k.is_v2,
              signal: k.signal
            });
            
            await c.env.DB.prepare(`
              INSERT INTO trading_signals_v2 (
                id, signal_type, signal_name, category, description,
                conditions, priority, is_enabled, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              signalId,
              signalType,
              signalName,
              category,
              description,
              conditions,
              60, // 默认优先级60
              1,  // 默认启用
              now
            ).run();
            
            imported.total++;
          }
        }
        
        console.log(`✅ ${symbol}: 导入完成`);
        
      } catch (symbolError: any) {
        console.error(`❌ ${symbol} 导入失败:`, symbolError.message);
      }
    }
    
    return c.json({
      success: true,
      message: `成功导入 ${imported.total} 个信号`,
      imported: {
        long: imported.long,
        short: imported.short,
        total: imported.total
      },
      explanation: {
        long: '做多信号来自：抄底做多（买点）、顶部做空（卖点）、波段高点（卖点）、注意启动（买点）、次日主升（买点）',
        short: '做空信号：暂无（所有operation_tip均为做多相关信号）',
        note: '注意：顶部做空和波段高点虽名称含"空"或"高"，但实际是做多的卖出信号，不是做空信号'
      }
    });
    
  } catch (error: any) {
    console.error('❌ 导入信号失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// API: 获取K线数据中所有唯一的操作提示关键字
app.get('/api/kline/operation-tips/unique', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT DISTINCT operation_tip
      FROM kline_data
      WHERE operation_tip IS NOT NULL AND operation_tip != ''
      ORDER BY operation_tip ASC
    `).all();
    
    const operationTips = result.results.map((row: any) => row.operation_tip);
    
    return c.json({
      success: true,
      operation_tips: operationTips,
      count: operationTips.length
    });
  } catch (error: any) {
    console.error('❌ 获取操作提示失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// API: 获取所有活跃的币种等级历史（7天内）
app.get('/api/coin-levels', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM coin_level_history
      WHERE is_active = 1 AND expired_at > ?
      ORDER BY reached_at DESC
    `).bind(new Date().toISOString()).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取币种等级历史失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// API: 获取特定币种的等级历史
app.get('/api/coin-levels/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    
    const result = await c.env.DB.prepare(`
      SELECT * FROM coin_level_history
      WHERE symbol = ? AND is_active = 1
      ORDER BY reached_at DESC
      LIMIT 10
    `).bind(symbol).all();
    
    return c.json({
      success: true,
      symbol,
      history: result.results || []
    });
  } catch (error: any) {
    console.error('❌ 获取币种等级历史失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// API: 记录币种达到新等级（内部使用）
app.post('/api/coin-levels', async (c) => {
  try {
    const body = await c.req.json();
    const levelId = `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    
    // Validation
    if (!body.symbol || !body.level) {
      return c.json({
        success: false,
        error: '币种和等级为必填项'
      }, 400);
    }
    
    await c.env.DB.prepare(`
      INSERT INTO coin_level_history (
        id, symbol, level, reached_at, expired_at, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      levelId,
      body.symbol,
      body.level,
      now.toISOString(),
      expiredAt.toISOString(),
      1,
      now.toISOString()
    ).run();
    
    return c.json({
      success: true,
      message: '等级历史记录成功',
      levelId
    });
  } catch (error: any) {
    console.error('❌ 记录等级历史失败:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// ========================================
// 信号库管理 API
// ========================================

// API: 获取所有做多信号
app.get('/api/signals/long', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'long' AND is_enabled = 1
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json({
      success: true,
      signals: result.results || [],
    });
  } catch (error: any) {
    console.error('❌ 获取做多信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取所有做空信号
app.get('/api/signals/short', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'short' AND is_enabled = 1
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json({
      success: true,
      signals: result.results || [],
    });
  } catch (error: any) {
    console.error('❌ 获取做空信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取单个信号详情
app.get('/api/signals/:id', async (c) => {
  try {
    const signalId = c.req.param('id');
    
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2 WHERE id = ?
    `).bind(signalId).first();
    
    if (!result) {
      return c.json({
        success: false,
        error: '信号不存在',
      }, 404);
    }
    
    return c.json({
      success: true,
      signal: result,
    });
  } catch (error: any) {
    console.error('❌ 获取信号详情失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 新增信号
app.post('/api/signals', async (c) => {
  try {
    const body = await c.req.json();
    const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO trading_signals_v2 (
        id, signal_type, signal_name, category, description,
        conditions, priority, is_enabled, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      signalId,
      body.signal_type,
      body.signal_name,
      body.category,
      body.description || null,
      body.conditions,
      body.priority || 50,
      body.is_enabled || 1,
      new Date().toISOString()
    ).run();
    
    return c.json({
      success: true,
      message: '信号添加成功',
      signalId,
    });
  } catch (error: any) {
    console.error('❌ 添加信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 更新信号
app.put('/api/signals/:id', async (c) => {
  try {
    const signalId = c.req.param('id');
    const body = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE trading_signals_v2
      SET
        signal_name = ?,
        category = ?,
        description = ?,
        conditions = ?,
        priority = ?,
        is_enabled = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.signal_name,
      body.category,
      body.description || null,
      body.conditions,
      body.priority || 50,
      body.is_enabled || 1,
      new Date().toISOString(),
      signalId
    ).run();
    
    return c.json({
      success: true,
      message: '信号更新成功',
    });
  } catch (error: any) {
    console.error('❌ 更新信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 删除信号
app.delete('/api/signals/:id', async (c) => {
  try {
    const signalId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM trading_signals_v2 WHERE id = ?
    `).bind(signalId).run();
    
    return c.json({
      success: true,
      message: '信号删除成功',
    });
  } catch (error: any) {
    console.error('❌ 删除信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 切换信号启用状态
app.post('/api/signals/:id/toggle', async (c) => {
  try {
    const signalId = c.req.param('id');
    
    // Get current status
    const current: any = await c.env.DB.prepare(`
      SELECT is_enabled FROM trading_signals_v2 WHERE id = ?
    `).bind(signalId).first();
    
    if (!current) {
      return c.json({
        success: false,
        error: '信号不存在',
      }, 404);
    }
    
    // Toggle status
    const newStatus = current.is_enabled ? 0 : 1;
    
    await c.env.DB.prepare(`
      UPDATE trading_signals_v2
      SET is_enabled = ?, updated_at = ?
      WHERE id = ?
    `).bind(newStatus, new Date().toISOString(), signalId).run();
    
    return c.json({
      success: true,
      message: newStatus ? '信号已启用' : '信号已禁用',
      is_enabled: newStatus,
    });
  } catch (error: any) {
    console.error('❌ 切换信号状态失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取币种等级历史（最近N天）
app.get('/api/coin-levels', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7');
    const symbol = c.req.query('symbol');
    
    let query = `
      SELECT * FROM coin_level_history
      WHERE is_active = 1
    `;
    const bindings: any[] = [];
    
    if (symbol) {
      query += ' AND symbol = ?';
      bindings.push(symbol);
    }
    
    // Calculate the date N days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    query += ' AND reached_at >= ? ORDER BY reached_at DESC';
    bindings.push(cutoffDate.toISOString());
    
    const result = await c.env.DB.prepare(query).bind(...bindings).all();
    
    return c.json({
      success: true,
      levels: result.results || [],
    });
  } catch (error: any) {
    console.error('❌ 获取币种等级历史失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取单个币种的等级历史
app.get('/api/coin-levels/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    
    const result = await c.env.DB.prepare(`
      SELECT * FROM coin_level_history
      WHERE symbol = ? AND is_active = 1
      ORDER BY reached_at DESC
    `).bind(symbol).all();
    
    return c.json({
      success: true,
      levels: result.results || [],
    });
  } catch (error: any) {
    console.error('❌ 获取币种等级历史失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 添加币种等级历史记录
app.post('/api/coin-levels', async (c) => {
  try {
    const body = await c.req.json();
    const levelId = `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate expiration date (7 days from reached_at)
    const reachedAt = new Date(body.reached_at);
    const expiredAt = new Date(reachedAt);
    expiredAt.setDate(expiredAt.getDate() + 7);
    
    await c.env.DB.prepare(`
      INSERT INTO coin_level_history (
        id, symbol, level, reached_at, expired_at, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      levelId,
      body.symbol,
      body.level,
      reachedAt.toISOString(),
      expiredAt.toISOString(),
      1,
      new Date().toISOString()
    ).run();
    
    return c.json({
      success: true,
      message: '等级历史记录添加成功',
      levelId,
    });
  } catch (error: any) {
    console.error('❌ 添加等级历史记录失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 更新过期的等级历史记录（标记为非活跃）
app.post('/api/coin-levels/expire', async (c) => {
  try {
    const now = new Date().toISOString();
    
    const result = await c.env.DB.prepare(`
      UPDATE coin_level_history
      SET is_active = 0
      WHERE expired_at <= ? AND is_active = 1
    `).bind(now).run();
    
    return c.json({
      success: true,
      message: '等级历史记录已更新',
      affected: result.meta.changes || 0,
    });
  } catch (error: any) {
    console.error('❌ 更新等级历史记录失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// ========================================
// Trading Signals API (Long/Short Signals)
// ========================================

// API: 获取做多信号
app.get('/api/signals/long', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'long'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做多信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取做空信号
app.get('/api/signals/short', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'short'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做空信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 获取所有信号（可选类型筛选）
app.get('/api/signals', async (c) => {
  try {
    const signalType = c.req.query('type'); // 'long', 'short', or undefined for all
    
    let query = 'SELECT * FROM trading_signals_v2';
    const params: any[] = [];
    
    if (signalType) {
      query += ' WHERE signal_type = ?';
      params.push(signalType);
    }
    
    query += ' ORDER BY priority DESC, created_at DESC';
    
    const result = await c.env.DB.prepare(query)
      .bind(...params)
      .all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 创建新信号
app.post('/api/signals', async (c) => {
  try {
    const body = await c.req.json();
    const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Validate required fields
    if (!body.signal_type || !['long', 'short'].includes(body.signal_type)) {
      return c.json({
        success: false,
        error: '信号类型必须是 long 或 short',
      }, 400);
    }
    
    if (!body.signal_name || !body.category) {
      return c.json({
        success: false,
        error: '信号名称和分类不能为空',
      }, 400);
    }
    
    await c.env.DB.prepare(`
      INSERT INTO trading_signals_v2 (
        id, signal_type, signal_name, category, description,
        conditions, priority, is_enabled, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      signalId,
      body.signal_type,
      body.signal_name,
      body.category,
      body.description || null,
      body.conditions || '{}',
      body.priority || 50,
      body.is_enabled !== undefined ? body.is_enabled : 1,
      now
    ).run();
    
    return c.json({
      success: true,
      message: '信号创建成功',
      signalId,
    });
  } catch (error: any) {
    console.error('❌ 创建信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 更新信号
app.put('/api/signals/:id', async (c) => {
  try {
    const signalId = c.req.param('id');
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.signal_name !== undefined) {
      updates.push('signal_name = ?');
      params.push(body.signal_name);
    }
    
    if (body.category !== undefined) {
      updates.push('category = ?');
      params.push(body.category);
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    
    if (body.conditions !== undefined) {
      updates.push('conditions = ?');
      params.push(body.conditions);
    }
    
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      params.push(body.priority);
    }
    
    if (body.is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      params.push(body.is_enabled);
    }
    
    if (body.success_rate !== undefined) {
      updates.push('success_rate = ?');
      params.push(body.success_rate);
    }
    
    if (updates.length === 0) {
      return c.json({
        success: false,
        error: '没有需要更新的字段',
      }, 400);
    }
    
    updates.push('updated_at = ?');
    params.push(now);
    params.push(signalId);
    
    const query = `
      UPDATE trading_signals_v2
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    const result = await c.env.DB.prepare(query).bind(...params).run();
    
    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        error: '信号不存在',
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '信号更新成功',
    });
  } catch (error: any) {
    console.error('❌ 更新信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 删除信号
app.delete('/api/signals/:id', async (c) => {
  try {
    const signalId = c.req.param('id');
    
    const result = await c.env.DB.prepare(`
      DELETE FROM trading_signals_v2
      WHERE id = ?
    `).bind(signalId).run();
    
    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        error: '信号不存在',
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '信号删除成功',
    });
  } catch (error: any) {
    console.error('❌ 删除信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// API: 清空所有信号
app.delete('/api/signals', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      DELETE FROM trading_signals_v2
    `).run();
    
    return c.json({
      success: true,
      message: '所有信号已清空',
      deletedCount: result.meta.changes || 0,
    });
  } catch (error: any) {
    console.error('❌ 清空信号失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// 🆕 API: 获取做多买点信号 (long + entry)
app.get('/api/signals/long/entry', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'long' AND entry_exit = 'entry'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做多买点信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 获取做多卖点信号 (long + exit)
app.get('/api/signals/long/exit', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'long' AND entry_exit = 'exit'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做多卖点信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 获取做空买点信号 (short + entry)
app.get('/api/signals/short/entry', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'short' AND entry_exit = 'entry'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做空买点信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🆕 API: 获取做空卖点信号 (short + exit)
app.get('/api/signals/short/exit', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM trading_signals_v2
      WHERE signal_type = 'short' AND entry_exit = 'exit'
      ORDER BY priority DESC, created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取做空卖点信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取所有币种等级历史（包括已过期）
app.get('/api/coin-levels', async (c) => {
  try {
    const includeExpired = c.req.query('include_expired') === 'true';
    
    let query = `
      SELECT 
        symbol,
        level,
        reached_time as reached_at,
        expiry_time as expired_at,
        CASE 
          WHEN datetime(expiry_time) > datetime('now') THEN 1 
          ELSE 0 
        END as is_active
      FROM coin_priority_level_history
      WHERE 1=1
    `;
    
    if (!includeExpired) {
      query += ' AND datetime(expiry_time) > datetime(\'now\')';
    }
    
    query += ' ORDER BY reached_time DESC';
    
    const result = await c.env.DB.prepare(query).all();
    
    return c.json(result.results || []);
  } catch (error: any) {
    console.error('❌ 获取等级历史失败:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});


// ==================== 交易策略库 API ====================

// 获取所有策略
app.get('/api/strategies', async (c) => {
  try {
    const result = await c.env.DB
      .prepare('SELECT * FROM trading_strategies ORDER BY created_at DESC')
      .all();
    
    return c.json({ success: true, strategies: result.results || [] });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 获取单个策略
app.get('/api/strategies/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB
      .prepare('SELECT * FROM trading_strategies WHERE id = ?')
      .bind(id)
      .first();
    
    if (!result) {
      return c.json({ success: false, error: '策略不存在' }, 404);
    }
    
    return c.json({ success: true, strategy: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 创建新策略
app.post('/api/strategies', async (c) => {
  try {
    const data = await c.req.json();
    
    const result = await c.env.DB
      .prepare(`
        INSERT INTO trading_strategies (
          strategy_name, strategy_type, priority,
          entry_signal_type, entry_signal_keyword, entry_signal_category, entry_signal_template,
          exit_signal_type, exit_signal_keyword, exit_signal_category, exit_signal_template,
          exit_signals_json, allowed_coin_levels,
          daily_gain_condition_operator, daily_gain_condition_value,
          position_splits, split_interval_pct, max_holding_periods,
          stop_loss_pct, take_profit_pct, max_position_size,
          is_enabled, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.strategy_name, data.strategy_type, data.priority || 'medium',
        data.entry_signal_type || null, data.entry_signal_keyword || null, data.entry_signal_category || null, data.entry_signal_template || null,
        data.exit_signal_type || null, data.exit_signal_keyword || null, data.exit_signal_category || null, data.exit_signal_template || null,
        data.exit_signals_json || null, data.allowed_coin_levels || null,  // 新增字段
        data.daily_gain_condition_operator || null, data.daily_gain_condition_value || null,  // 新增字段
        data.position_splits || 1, data.split_interval_pct || 2.0, data.max_holding_periods || 0,
        data.stop_loss_pct || null, data.take_profit_pct || null, data.max_position_size || 100,
        data.is_enabled !== undefined ? data.is_enabled : 1, data.description || null
      )
      .run();
    
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 更新策略
app.put('/api/strategies/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    // 构建更新字段
    const fields = [];
    const values = [];
    
    if (data.strategy_name !== undefined) {
      fields.push('strategy_name = ?');
      values.push(data.strategy_name);
    }
    if (data.strategy_type !== undefined) {
      fields.push('strategy_type = ?');
      values.push(data.strategy_type);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.entry_signal_type !== undefined) {
      fields.push('entry_signal_type = ?');
      values.push(data.entry_signal_type);
    }
    if (data.entry_signal_keyword !== undefined) {
      fields.push('entry_signal_keyword = ?');
      values.push(data.entry_signal_keyword);
    }
    if (data.exit_signal_type !== undefined) {
      fields.push('exit_signal_type = ?');
      values.push(data.exit_signal_type);
    }
    if (data.exit_signal_keyword !== undefined) {
      fields.push('exit_signal_keyword = ?');
      values.push(data.exit_signal_keyword);
    }
    if (data.exit_signals_json !== undefined) {
      fields.push('exit_signals_json = ?');
      values.push(data.exit_signals_json);
    }
    if (data.allowed_coin_levels !== undefined) {
      fields.push('allowed_coin_levels = ?');
      values.push(data.allowed_coin_levels);
    }
    if (data.daily_gain_condition_operator !== undefined) {
      fields.push('daily_gain_condition_operator = ?');
      values.push(data.daily_gain_condition_operator);
    }
    if (data.daily_gain_condition_value !== undefined) {
      fields.push('daily_gain_condition_value = ?');
      values.push(data.daily_gain_condition_value);
    }
    if (data.position_splits !== undefined) {
      fields.push('position_splits = ?');
      values.push(data.position_splits);
    }
    if (data.split_interval_pct !== undefined) {
      fields.push('split_interval_pct = ?');
      values.push(data.split_interval_pct);
    }
    if (data.max_holding_periods !== undefined) {
      fields.push('max_holding_periods = ?');
      values.push(data.max_holding_periods);
    }
    if (data.stop_loss_pct !== undefined) {
      fields.push('stop_loss_pct = ?');
      values.push(data.stop_loss_pct);
    }
    if (data.take_profit_pct !== undefined) {
      fields.push('take_profit_pct = ?');
      values.push(data.take_profit_pct);
    }
    if (data.max_position_size !== undefined) {
      fields.push('max_position_size = ?');
      values.push(data.max_position_size);
    }
    if (data.is_enabled !== undefined) {
      fields.push('is_enabled = ?');
      values.push(data.is_enabled);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const sql = `UPDATE trading_strategies SET ${fields.join(', ')} WHERE id = ?`;
    
    await c.env.DB.prepare(sql).bind(...values).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 删除策略
app.delete('/api/strategies/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB
      .prepare('DELETE FROM trading_strategies WHERE id = ?')
      .bind(id)
      .run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 清空所有策略
app.delete('/api/strategies/clear', async (c) => {
  try {
    const result = await c.env.DB
      .prepare('DELETE FROM trading_strategies')
      .run();
    
    return c.json({ success: true, deleted: result.meta.changes });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===================================
// 信号匹配系统 API
// ===================================

import { SignalMatchingService } from './services/signalMatchingService';

// API: 获取信号匹配系统概览
app.get('/api/signal-matching/overview', async (c) => {
  try {
    const service = new SignalMatchingService(c.env.DB);
    const overview = await service.getSystemOverview();
    
    return c.json({
      success: true,
      data: overview
    });
  } catch (error: any) {
    console.error('获取系统概览失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 手动触发完整匹配流程
app.post('/api/signal-matching/run', async (c) => {
  try {
    const service = new SignalMatchingService(c.env.DB);
    const result = await service.runCompleteFlow();
    
    return c.json({
      success: true,
      message: '信号匹配流程执行完成',
      ...result
    });
  } catch (error: any) {
    console.error('执行匹配流程失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 扫描并填充待匹配信号池
app.post('/api/signal-matching/scan-pending', async (c) => {
  try {
    const service = new SignalMatchingService(c.env.DB);
    const count = await service.scanAndFillPendingPool();
    
    return c.json({
      success: true,
      message: `成功添加 ${count} 个待匹配信号`,
      count
    });
  } catch (error: any) {
    console.error('扫描待匹配信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 执行信号匹配
app.post('/api/signal-matching/match-signals', async (c) => {
  try {
    const service = new SignalMatchingService(c.env.DB);
    const count = await service.matchSignalsWithLibrary();
    
    return c.json({
      success: true,
      message: `成功匹配 ${count} 个信号`,
      count
    });
  } catch (error: any) {
    console.error('信号匹配失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 执行策略匹配
app.post('/api/signal-matching/match-strategies', async (c) => {
  try {
    const service = new SignalMatchingService(c.env.DB);
    const count = await service.matchSignalsWithStrategies();
    
    return c.json({
      success: true,
      message: `成功匹配 ${count} 个策略`,
      count
    });
  } catch (error: any) {
    console.error('策略匹配失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 填充生产池
app.post('/api/signal-matching/fill-production', async (c) => {
  try {
    const service = new SignalMatchingService(c.env.DB);
    const count = await service.fillProductionPool();
    
    return c.json({
      success: true,
      message: `成功添加 ${count} 个待执行项到生产池`,
      count
    });
  } catch (error: any) {
    console.error('填充生产池失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 清理过期信号
app.post('/api/signal-matching/cleanup', async (c) => {
  try {
    const service = new SignalMatchingService(c.env.DB);
    const count = await service.cleanupExpiredSignals();
    
    return c.json({
      success: true,
      message: `清理了 ${count} 个过期信号`,
      count
    });
  } catch (error: any) {
    console.error('清理过期信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取待匹配信号池
app.get('/api/signal-matching/pending', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM signal_pool_pending 
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('获取待匹配信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取已匹配信号池
app.get('/api/signal-matching/matched', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM signal_pool_matched 
      WHERE status = 'pending_strategy'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('获取已匹配信号失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取今日已匹配记录
app.get('/api/signal-matching/today', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM signal_matched_today 
      WHERE status IN ('pending_execution', 'in_production')
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('获取今日已匹配记录失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取生产池待执行项
app.get('/api/signal-matching/production', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    const status = c.req.query('status') || 'pending';
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM production_pool_pending 
      WHERE status = ?
      ORDER BY priority DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(status, limit, offset).all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('获取生产池失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: 获取最新K线快照
app.get('/api/signal-matching/snapshots/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM kline_snapshot_latest 
      WHERE symbol = ?
      ORDER BY kline_time DESC, kline_index ASC
      LIMIT 3
    `).bind(symbol).all();
    
    return c.json({
      success: true,
      symbol,
      data: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('获取K线快照失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🐛 DEBUG API: 直接查看kline_data表的数据
app.get('/api/debug/kline-data/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol');
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        symbol, timeframe, open_time, open, high, low, close, volume,
        sar, sar_change, sar_change_percent,
        rsi_5min, rsi_1h,
        boll_mb, boll_ub, boll_lb, boll_angle_mb, boll_width_change,
        up_channel_exhaustion_ratio, down_channel_exhaustion_ratio,
        volume_v1, volume_v2, volume_level,
        signal, operation_tip, channel_state, homepage_rank,
        change_percent, change_diff
      FROM kline_data 
      WHERE symbol = ? AND timeframe = '5m'
      ORDER BY open_time DESC
      LIMIT 3
    `).bind(symbol).all();
    
    return c.json({
      success: true,
      symbol,
      source: 'kline_data table (raw database)',
      data: results,
      count: results.length,
      fields_check: results.length > 0 ? {
        has_sar: results[0].sar !== null,
        has_rsi: results[0].rsi_5min !== null,
        has_boll: results[0].boll_mb !== null,
        has_signal: results[0].signal !== null,
        has_operation_tip: results[0].operation_tip !== null,
        has_homepage_rank: results[0].homepage_rank !== null,
        has_volume_flags: results[0].volume_v1 !== null
      } : {}
    });
  } catch (error: any) {
    console.error('获取K线原始数据失败:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});


export default app
