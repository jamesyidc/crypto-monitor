// 买卖点识别服务
import { ConvergenceStatsService } from './convergenceStatsService';
import { getBeijingTodayStart } from '../utils/timeUtils';

export class SignalService {
  private db?: D1Database;
  private convergenceService?: ConvergenceStatsService;

  constructor(db?: D1Database) {
    this.db = db;
    if (db) {
      this.convergenceService = new ConvergenceStatsService(db);
    }
  }
  // 识别买卖点信号
  // coinLevel: 币种优先级等级（1-6），用于主升信号判断
  detectTradingSignals(klineData: any[], coinLevel?: number): any {
    if (klineData.length < 30) {
      return { signals: [], stats: null, alerts: [] };
    }

    const signals: any[] = [];
    const alerts: any[] = []; // 新增：预警列表（满足任一触发条件）
    
    // 🆕 先记录所有震荡收敛数据（用于统计分析）
    if (this.convergenceService) {
      for (let i = 0; i < klineData.length; i++) {
        const k = klineData[i];
        // 注意：字段名是 channel_state，不是 channelState
        if (k.channel_state && k.channel_state.includes('震荡收敛') && k.boll_ub && k.boll_mb && k.boll_lb) {
          const bollWidth = k.boll_ub - k.boll_lb;
          const bollWidthPercent = (bollWidth / k.boll_mb) * 100;
          
          this.convergenceService.recordConvergence({
            symbol: k.symbol,
            timeframe: '5m',
            convergence_time: k.time,
            boll_width: bollWidth,
            boll_width_percent: bollWidthPercent,
            boll_upper: k.boll_ub,
            boll_middle: k.boll_mb,
            boll_lower: k.boll_lb,
            close_price: parseFloat(k.close),
            rsi_5min: k.rsi_5min,
            sar_direction: k.signal
          }).catch(err => {
            console.error(`记录${k.symbol}震荡收敛数据失败:`, err);
          });
        }
      }
    }
    
    // 计算成交量平均值（用于V1, V2判断）
    const volumes = klineData.map(k => parseFloat(k.volume || '0'));
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const v1 = avgVolume * 1.5; // V1 = 1.5倍平均量
    const v2 = avgVolume * 1.0; // V2 = 1倍平均量

    // 从第2根开始遍历（需要对比前一根）
    for (let i = 1; i < klineData.length; i++) {
      const current = klineData[i];
      const previous = klineData[i - 1];
      
      // 解析数据
      const currentHigh = parseFloat(current.high);
      const currentLow = parseFloat(current.low);
      const currentOpen = parseFloat(current.open);
      const currentClose = parseFloat(current.close);
      const currentVolume = parseFloat(current.volume || '0');
      
      const prevHigh = parseFloat(previous.high);
      const prevLow = parseFloat(previous.low);
      const prevVolume = parseFloat(previous.volume || '0');
      
      // 计算震荡幅度（波动率）
      const volatility = ((currentHigh - currentLow) / currentLow) * 100;
      
      // 计算上下影线
      const bodyHigh = Math.max(currentOpen, currentClose);
      const bodyLow = Math.min(currentOpen, currentClose);
      const upperShadow = currentHigh - bodyHigh;
      const lowerShadow = bodyLow - currentLow;
      const bodySize = Math.abs(currentClose - currentOpen);
      
      // 长上影线：上影线 > 实体的2倍
      const hasLongUpperShadow = upperShadow > bodySize * 2;
      // 长下影线：下影线 > 实体的2倍
      const hasLongLowerShadow = lowerShadow > bodySize * 2;
      
      // 量能衰减：当前量 < 前一根的30%
      const volumeDecay = currentVolume < prevVolume * 0.3;
      
      // 获取指标数据
      const sarChangePercent = parseFloat(current.sarChangePercent || '0');
      const changePercent = parseFloat(current.change?.replace('%', '') || '0');
      const rsi5min = parseFloat(current.rsi_5min || '50');
      
      // 显著变化：涨跌幅 >= 1%
      const significantChange = Math.abs(changePercent) >= 1;
      
      // ===== 触发条件检测（满足任一即预警） =====
      const triggerConditions: string[] = [];
      
      // 1. 成交量触发：V1 或 V2
      const volumeAboveV1 = currentVolume >= v1;
      const volumeAboveV2 = currentVolume >= v2;
      if (volumeAboveV1) triggerConditions.push('成交量≥V1');
      else if (volumeAboveV2) triggerConditions.push('成交量≥V2');
      
      // 2. 涨跌幅触发：±1%
      const changeUp1Percent = changePercent >= 1;
      const changeDown1Percent = changePercent <= -1;
      if (changeUp1Percent) triggerConditions.push('涨幅≥1%');
      if (changeDown1Percent) triggerConditions.push('跌幅≤-1%');
      
      // 3. 震荡（波动率）触发：±1%
      const volatilityHigh = volatility >= 1;
      if (volatilityHigh) triggerConditions.push('震荡≥1%');
      
      // 如果满足任一触发条件，生成预警
      if (triggerConditions.length > 0) {
        alerts.push({
          symbol: current.symbol,
          time: current.time,
          index: current.index,
          triggers: triggerConditions,
          // K线原始数据
          klineData: {
            open: currentOpen,
            high: currentHigh,
            low: currentLow,
            close: currentClose,
            volume: currentVolume,
            // BOLL指标（使用正确的字段名）
            boll_upper: parseFloat(current.boll_ub || '0'),
            boll_middle: parseFloat(current.boll_mb || '0'),
            boll_lower: parseFloat(current.boll_lb || '0'),
            // 其他指标
            rsi_1h: parseFloat(current.rsi_1h || '0'),
            sar_value: parseFloat(current.sar || '0'),
            sar_direction: current.signal || ''
          },
          data: {
            volume: currentVolume.toFixed(2),
            volumeLevel: volumeAboveV1 ? 'V1+' : volumeAboveV2 ? 'V2+' : 'Normal',
            changePercent: changePercent.toFixed(2) + '%',
            volatility: volatility.toFixed(2) + '%',
            rsi5min: rsi5min.toFixed(2),
            sarChangePercent: sarChangePercent.toFixed(2) + '%'
          }
        });
      }
      
      // === 见顶信号检测（做空） - 进一步放宽条件 ===
      // 满足以下任意组合即可：
      // 1. 长上影线 + RSI超买(>60)
      // 2. 长上影线 + SAR加速向下
      // 3. RSI极度超买(>75) + 震荡>1%
      const sellCondition1 = hasLongUpperShadow && rsi5min > 60;
      const sellCondition2 = hasLongUpperShadow && sarChangePercent < 0 && Math.abs(sarChangePercent) > 3;
      const sellCondition3 = rsi5min > 75 && volatility > 1;
      
      if (
        (sellCondition1 || sellCondition2 || sellCondition3) &&
        (volumeAboveV1 || volumeAboveV2 || significantChange || volatility > 1)
      ) {
        signals.push({
          symbol: current.symbol,
          time: current.time,
          type: 'SELL', // 做空信号
          price: currentHigh, // 以最高价作为做空价格
          reason: '见顶信号',
          details: {
            volatility: volatility.toFixed(2) + '%',
            upperShadowRatio: (upperShadow / bodySize).toFixed(2) + 'x',
            volumeDecay: ((currentVolume / prevVolume) * 100).toFixed(1) + '%',
            sarChangePercent: sarChangePercent.toFixed(2) + '%',
            changePercent: changePercent.toFixed(2) + '%',
            rsi5min: rsi5min.toFixed(2),
            currentVolume: currentVolume.toFixed(2),
            volumeLevel: volumeAboveV1 ? 'V1+' : volumeAboveV2 ? 'V2+' : 'Normal'
          },
          strength: this.calculateSignalStrength({
            volatility,
            rsi: rsi5min,
            sarChange: Math.abs(sarChangePercent),
            volumeRatio: currentVolume / avgVolume,
            isTop: true
          }),
          keepBars: 10 // 保留10根K线
        });
      }
      
      // === 见底信号检测（做多） - 进一步放宽条件 ===
      // 满足以下任意组合即可：
      // 1. 长下影线 + RSI超卖(<40)
      // 2. 长下影线 + SAR加速向上
      // 3. RSI极度超卖(<25) + 震荡>1%
      const buyCondition1 = hasLongLowerShadow && rsi5min < 40;
      const buyCondition2 = hasLongLowerShadow && sarChangePercent > 0 && Math.abs(sarChangePercent) > 3;
      const buyCondition3 = rsi5min < 25 && volatility > 1;
      
      if (
        (buyCondition1 || buyCondition2 || buyCondition3) &&
        (volumeAboveV1 || volumeAboveV2 || significantChange || volatility > 1)
      ) {
        signals.push({
          symbol: current.symbol,
          time: current.time,
          type: 'BUY', // 做多信号
          price: currentLow, // 以最低价作为做多价格
          reason: '见底信号',
          details: {
            volatility: volatility.toFixed(2) + '%',
            lowerShadowRatio: (lowerShadow / bodySize).toFixed(2) + 'x',
            volumeDecay: ((currentVolume / prevVolume) * 100).toFixed(1) + '%',
            sarChangePercent: sarChangePercent.toFixed(2) + '%',
            changePercent: changePercent.toFixed(2) + '%',
            rsi5min: rsi5min.toFixed(2),
            currentVolume: currentVolume.toFixed(2),
            volumeLevel: volumeAboveV1 ? 'V1+' : volumeAboveV2 ? 'V2+' : 'Normal'
          },
          strength: this.calculateSignalStrength({
            volatility,
            rsi: rsi5min,
            sarChange: Math.abs(sarChangePercent),
            volumeRatio: currentVolume / avgVolume,
            isTop: false
          }),
          keepBars: 20 // 保留20根K线
        });
      }
    }

    // 🆕 === 主升信号检测 ===
    // 条件：
    // 1. 币种等级 >= 2
    // 2. 下跌后在底部
    // 3. 连续出现2个"震荡收敛"信号
    if (coinLevel !== undefined && coinLevel >= 1 && coinLevel <= 2) {
      // 查找连续的震荡收敛信号
      const convergenceSignals: number[] = []; // 记录震荡收敛信号的索引
      
      for (let i = 0; i < klineData.length; i++) {
        const k = klineData[i];
        // 检查通道状态是否为"震荡收敛"（注意字段名是 channel_state）
        if (k.channel_state && k.channel_state.includes('震荡收敛')) {
          convergenceSignals.push(i);
        }
      }
      
      // 检查是否有连续的2个震荡收敛信号
      for (let i = 0; i < convergenceSignals.length - 1; i++) {
        const idx1 = convergenceSignals[i];
        const idx2 = convergenceSignals[i + 1];
        
        // 判断是否连续（间隔不超过3根K线）
        if (idx2 - idx1 <= 3) {
          const signal1 = klineData[idx1];
          const signal2 = klineData[idx2];
          
          // 检查是否在底部：通过价格位置判断
          // 计算最近20根K线的价格范围
          const recentStart = Math.max(0, idx2 - 20);
          const recentKlines = klineData.slice(recentStart, idx2 + 1);
          const recentPrices = recentKlines.map(k => parseFloat(k.close));
          const recentHigh = Math.max(...recentPrices);
          const recentLow = Math.min(...recentPrices);
          const priceRange = recentHigh - recentLow;
          
          // 当前价格在底部30%区域
          const currentPrice = parseFloat(signal2.close);
          const pricePosition = ((currentPrice - recentLow) / priceRange) * 100;
          const isInBottomArea = pricePosition <= 30;
          
          // 检查是否从高位下跌：最近的最高价 > 当前价格的20%
          const priceDropPercent = ((recentHigh - currentPrice) / recentHigh) * 100;
          const hasDroppedFromHigh = priceDropPercent >= 20;
          
          // 如果在底部区域且从高位下跌，生成主升信号
          if (isInBottomArea && hasDroppedFromHigh) {
            const currentVolume = parseFloat(signal2.volume || '0');
            const avgVolume = klineData.slice(0, idx2).reduce((sum, k) => sum + parseFloat(k.volume || '0'), 0) / idx2;
            
            signals.push({
              symbol: signal2.symbol,
              time: signal2.time,
              type: 'BUY', // 做多信号
              price: parseFloat(signal2.close),
              reason: '主升信号 🚀',
              details: {
                convergenceCount: '2次连续',
                coinLevel: `等级${coinLevel}`,
                pricePosition: pricePosition.toFixed(1) + '%（底部）',
                priceDropFromHigh: priceDropPercent.toFixed(1) + '%',
                signal1Time: signal1.time,
                signal2Time: signal2.time,
                channelState: signal2.channelState || '震荡收敛',
                currentVolume: currentVolume.toFixed(2),
                volumeRatio: (currentVolume / avgVolume).toFixed(2) + 'x'
              },
              strength: this.calculateMainRiseStrength({
                coinLevel,
                pricePosition,
                priceDropPercent,
                volumeRatio: currentVolume / avgVolume
              }),
              keepBars: 30 // 主升信号保留30根K线观察
            });
          }
        }
      }
    }

    // 统计信息
    const stats = {
      totalSignals: signals.length,
      buySignals: signals.filter(s => s.type === 'BUY').length,
      sellSignals: signals.filter(s => s.type === 'SELL').length,
      totalAlerts: alerts.length, // 新增：预警总数
      avgVolume: avgVolume.toFixed(2),
      v1Threshold: v1.toFixed(2),
      v2Threshold: v2.toFixed(2)
    };

    return { signals, alerts, stats };
  }

  // 计算信号强度（0-100）
  private calculateSignalStrength(params: {
    volatility: number;
    rsi: number;
    sarChange: number;
    volumeRatio: number;
    isTop: boolean;
  }): number {
    let strength = 0;

    // RSI极值加分（0-30分）
    if (params.isTop) {
      if (params.rsi > 80) strength += 30;
      else if (params.rsi > 75) strength += 20;
      else if (params.rsi > 70) strength += 10;
    } else {
      if (params.rsi < 20) strength += 30;
      else if (params.rsi < 25) strength += 20;
      else if (params.rsi < 30) strength += 10;
    }

    // SAR加速度加分（0-25分）
    if (params.sarChange > 20) strength += 25;
    else if (params.sarChange > 15) strength += 20;
    else if (params.sarChange > 10) strength += 15;
    else if (params.sarChange > 5) strength += 10;

    // 震荡幅度加分（0-20分）
    if (params.volatility > 3) strength += 20;
    else if (params.volatility > 2) strength += 15;
    else if (params.volatility > 1.5) strength += 10;
    else if (params.volatility > 1) strength += 5;

    // 成交量加分（0-25分）
    if (params.volumeRatio > 2) strength += 25;
    else if (params.volumeRatio > 1.5) strength += 20;
    else if (params.volumeRatio > 1.2) strength += 15;
    else if (params.volumeRatio > 1) strength += 10;

    return Math.min(100, strength);
  }

  // 🆕 计算主升信号强度
  private calculateMainRiseStrength(params: {
    coinLevel: number;      // 币种等级（1-6）
    pricePosition: number;  // 价格位置百分比（0-100，越小越靠近底部）
    priceDropPercent: number; // 从高位下跌的百分比
    volumeRatio: number;    // 成交量比率
  }): number {
    let strength = 0;

    // 币种等级加分（0-40分）
    // 等级越高（数字越小），加分越高
    if (params.coinLevel === 1) strength += 40;
    else if (params.coinLevel === 2) strength += 35;
    else if (params.coinLevel === 3) strength += 25;
    else if (params.coinLevel === 4) strength += 15;
    else if (params.coinLevel === 5) strength += 10;
    else if (params.coinLevel === 6) strength += 5;

    // 价格位置加分（0-30分）
    // 越靠近底部，加分越高
    if (params.pricePosition <= 10) strength += 30;
    else if (params.pricePosition <= 20) strength += 25;
    else if (params.pricePosition <= 30) strength += 20;
    else if (params.pricePosition <= 40) strength += 10;

    // 下跌幅度加分（0-20分）
    // 从高位下跌幅度越大，反弹潜力越大
    if (params.priceDropPercent >= 50) strength += 20;
    else if (params.priceDropPercent >= 40) strength += 18;
    else if (params.priceDropPercent >= 30) strength += 15;
    else if (params.priceDropPercent >= 20) strength += 10;

    // 成交量加分（0-10分）
    if (params.volumeRatio > 1.5) strength += 10;
    else if (params.volumeRatio > 1.2) strength += 8;
    else if (params.volumeRatio > 1) strength += 5;

    return Math.min(100, strength);
  }

  // 获取多个币种的买卖点信号
  async detectMultiSymbolSignals(
    symbols: string[],
    getKlineData: (symbol: string) => Promise<any>
  ): Promise<any> {
    const results: any = {};

    // 🆕 批量获取所有币种的优先级等级
    const priorityLevels = new Map<string, number>();
    if (this.db) {
      const prioritiesResult: any = await this.db
        .prepare('SELECT symbol, level FROM coin_priority')
        .all();
      
      if (prioritiesResult.results) {
        prioritiesResult.results.forEach((p: any) => {
          priorityLevels.set(p.symbol, p.level);
        });
      }
    }

    for (const symbol of symbols) {
      try {
        const klineData = await getKlineData(symbol);
        // 🆕 获取币种等级
        const coinLevel = priorityLevels.get(symbol);
        const detection = this.detectTradingSignals(klineData, coinLevel);
        
        results[symbol] = {
          success: true,
          ...detection
        };
      } catch (error: any) {
        results[symbol] = {
          success: false,
          error: error.message
        };
      }
    }

    return results;
  }

  // 生成买卖点摘要
  generateSignalSummary(allResults: any): any {
    const summary: any = {
      totalSymbols: 0,
      totalSignals: 0,
      totalBuySignals: 0,
      totalSellSignals: 0,
      topBuySignals: [],
      topSellSignals: [],
      symbolsWithSignals: []
    };

    for (const [symbol, result] of Object.entries(allResults)) {
      if ((result as any).success && (result as any).signals) {
        summary.totalSymbols++;
        const signals = (result as any).signals || [];
        const buySignals = signals.filter((s: any) => s.type === 'BUY');
        const sellSignals = signals.filter((s: any) => s.type === 'SELL');

        summary.totalSignals += signals.length;
        summary.totalBuySignals += buySignals.length;
        summary.totalSellSignals += sellSignals.length;

        if (signals.length > 0) {
          summary.symbolsWithSignals.push({
            symbol,
            buyCount: buySignals.length,
            sellCount: sellSignals.length
          });

          // 收集高强度信号
          buySignals.forEach((s: any) => {
            if (s.strength >= 60) {
              summary.topBuySignals.push({ symbol, ...s });
            }
          });

          sellSignals.forEach((s: any) => {
            if (s.strength >= 60) {
              summary.topSellSignals.push({ symbol, ...s });
            }
          });
        }
      }
    }

    // 按强度排序
    summary.topBuySignals.sort((a: any, b: any) => b.strength - a.strength);
    summary.topSellSignals.sort((a: any, b: any) => b.strength - a.strength);

    // 只保留前10个
    summary.topBuySignals = summary.topBuySignals.slice(0, 10);
    summary.topSellSignals = summary.topSellSignals.slice(0, 10);

    return summary;
  }

  // 保存买卖点信号到数据库
  async saveTradingSignal(signal: any): Promise<void> {
    if (!this.db) return;

    try {
      await this.db
        .prepare(`
          INSERT INTO trading_signals (
            symbol, signal_time, signal_type, price, reason, 
            strength, details, keep_bars
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          signal.symbol,
          signal.time,
          signal.type,
          signal.price,
          signal.reason || '',
          signal.strength || 0,
          JSON.stringify(signal.details || {}),
          signal.keepBars || 0
        )
        .run();
    } catch (error) {
      console.error('保存买卖点信号失败:', error);
    }
  }

  // 保存预警信号到数据库
  async saveAlertSignal(alert: any): Promise<void> {
    if (!this.db) return;

    try {
      const klineData = alert.klineData || {};
      
      await this.db
        .prepare(`
          INSERT INTO alert_signals (
            symbol, alert_time, kline_index, triggers,
            volume, volume_level, change_percent, volatility,
            rsi_5min, sar_change_percent,
            open_price, high_price, low_price, close_price,
            boll_upper, boll_middle, boll_lower,
            rsi_1h, sar_value, sar_direction
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          alert.symbol,
          alert.time,
          alert.index || 0,
          JSON.stringify(alert.triggers || []),
          parseFloat(alert.data.volume || '0'),
          alert.data.volumeLevel || 'Normal',
          parseFloat(alert.data.changePercent || '0'),
          parseFloat(alert.data.volatility || '0'),
          parseFloat(alert.data.rsi5min || '50'),
          parseFloat(alert.data.sarChangePercent || '0'),
          // 新增K线数据
          klineData.open || 0,
          klineData.high || 0,
          klineData.low || 0,
          klineData.close || 0,
          klineData.boll_upper || 0,
          klineData.boll_middle || 0,
          klineData.boll_lower || 0,
          klineData.rsi_1h || 0,
          klineData.sar_value || 0,
          klineData.sar_direction || ''
        )
        .run();
    } catch (error) {
      console.error('保存预警信号失败:', error);
    }
  }

  // 批量保存信号
  async saveSignalsAndAlerts(signals: any[], alerts: any[]): Promise<void> {
    if (!this.db) return;

    // 保存买卖点信号
    for (const signal of signals) {
      await this.saveTradingSignal(signal);
    }

    // 保存预警
    for (const alert of alerts) {
      await this.saveAlertSignal(alert);
    }
  }

  // 获取最近的买卖点信号（使用北京时间）
  async getRecentTradingSignals(hours: number = 24, limit: number = 100): Promise<any[]> {
    if (!this.db) return [];

    try {
      // 🔥 只统计当天的信号（从北京时间今天0点开始）
      const todayStart = getBeijingTodayStart();
      
      const result = await this.db
        .prepare(`
          SELECT * FROM trading_signals 
          WHERE created_at >= ?
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .bind(todayStart, limit)
        .all();

      return result.results.map((row: any) => ({
        ...row,
        details: JSON.parse(row.details || '{}')
      }));
    } catch (error) {
      console.error('获取买卖点信号失败:', error);
      return [];
    }
  }

  // 获取最近的预警信号
  async getRecentAlertSignals(hours: number = 24, limit: number = 1000): Promise<any[]> {
    if (!this.db) return [];

    try {
      // 🔥 只统计当天的信号（从北京时间今天0点开始）
      const todayStart = getBeijingTodayStart();
      
      const result = await this.db
        .prepare(`
          SELECT * FROM alert_signals 
          WHERE created_at >= ?
          ORDER BY alert_time DESC
          LIMIT ?
        `)
        .bind(todayStart, limit)
        .all();

      return result.results.map((row: any) => ({
        ...row,
        triggers: JSON.parse(row.triggers || '[]'),
        // K线完整数据
        klineData: {
          open: row.open_price || 0,
          high: row.high_price || 0,
          low: row.low_price || 0,
          close: row.close_price || 0,
          volume: row.volume || 0,
          boll_upper: row.boll_upper || 0,
          boll_middle: row.boll_middle || 0,
          boll_lower: row.boll_lower || 0,
          rsi_1h: row.rsi_1h || 0,
          rsi_5min: row.rsi_5min || 0,
          sar_value: row.sar_value || 0,
          sar_direction: row.sar_direction || ''
        },
        data: {
          volume: row.volume?.toString() || '0',
          volumeLevel: row.volume_level,
          changePercent: row.change_percent?.toFixed(2) + '%',
          volatility: row.volatility?.toFixed(2) + '%',
          rsi5min: row.rsi_5min?.toFixed(2),
          sarChangePercent: row.sar_change_percent?.toFixed(2) + '%'
        }
      }));
    } catch (error) {
      console.error('获取预警信号失败:', error);
      return [];
    }
  }

  // 🆕 获取未发送到Telegram的买卖点信号
  async getUnsentTradingSignals(symbol: string, hours: number = 2): Promise<any[]> {
    if (!this.db) return [];

    try {
      // 🔥 只查询当天的信号（从北京时间今天0点开始）
      const todayStart = getBeijingTodayStart();
      
      const result = await this.db
        .prepare(`
          SELECT * FROM trading_signals 
          WHERE symbol = ? 
            AND telegram_sent = 0
            AND created_at >= ?
          ORDER BY signal_time DESC
        `)
        .bind(symbol, todayStart)
        .all();

      return result.results.map((row: any) => ({
        ...row,
        details: JSON.parse(row.details || '{}')
      }));
    } catch (error) {
      console.error('获取未发送买卖点信号失败:', error);
      return [];
    }
  }

  // 🆕 获取未发送到Telegram的预警信号
  async getUnsentAlertSignals(symbol: string, hours: number = 2): Promise<any[]> {
    if (!this.db) return [];

    try {
      // 🔥 只查询当天的信号（从北京时间今天0点开始）
      const todayStart = getBeijingTodayStart();
      
      const result = await this.db
        .prepare(`
          SELECT * FROM alert_signals 
          WHERE symbol = ? 
            AND telegram_sent = 0
            AND created_at >= ?
          ORDER BY alert_time DESC
        `)
        .bind(symbol, todayStart)
        .all();

      return result.results.map((row: any) => ({
        ...row,
        triggers: JSON.parse(row.triggers || '[]'),
        klineData: {
          open: row.open_price || 0,
          high: row.high_price || 0,
          low: row.low_price || 0,
          close: row.close_price || 0,
          volume: row.volume || 0,
          boll_upper: row.boll_upper || 0,
          boll_middle: row.boll_middle || 0,
          boll_lower: row.boll_lower || 0,
          rsi_1h: row.rsi_1h || 0,
          rsi_5min: row.rsi_5min || 0,
          sar_value: row.sar_value || 0,
          sar_direction: row.sar_direction || ''
        },
        data: {
          volume: row.volume?.toString() || '0',
          volumeLevel: row.volume_level,
          changePercent: row.change_percent?.toFixed(2) + '%',
          volatility: row.volatility?.toFixed(2) + '%',
          rsi5min: row.rsi_5min?.toFixed(2),
          sarChangePercent: row.sar_change_percent?.toFixed(2) + '%'
        }
      }));
    } catch (error) {
      console.error('获取未发送预警信号失败:', error);
      return [];
    }
  }

  // 🆕 标记买卖点信号为已发送
  async markTradingSignalsAsSent(signalIds: number[]): Promise<void> {
    if (!this.db || signalIds.length === 0) return;

    try {
      const placeholders = signalIds.map(() => '?').join(',');
      await this.db
        .prepare(`
          UPDATE trading_signals 
          SET telegram_sent = 1 
          WHERE id IN (${placeholders})
        `)
        .bind(...signalIds)
        .run();
      
      console.log(`✅ 标记 ${signalIds.length} 个买卖点信号为已发送`);
    } catch (error) {
      console.error('标记买卖点信号失败:', error);
    }
  }

  // 🆕 标记预警信号为已发送
  async markAlertSignalsAsSent(alertIds: number[]): Promise<void> {
    if (!this.db || alertIds.length === 0) return;

    try {
      const placeholders = alertIds.map(() => '?').join(',');
      await this.db
        .prepare(`
          UPDATE alert_signals 
          SET telegram_sent = 1 
          WHERE id IN (${placeholders})
        `)
        .bind(...alertIds)
        .run();
      
      console.log(`✅ 标记 ${alertIds.length} 个预警信号为已发送`);
    } catch (error) {
      console.error('标记预警信号失败:', error);
    }
  }
}
