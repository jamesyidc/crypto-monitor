import { CoinService, coingeckoIdToSymbol } from './coinService';
import type { MarketTrend, StarType, CoinLevel } from '../types';

export class AnalysisService {
  private coinService: CoinService;

  constructor(coinService: CoinService) {
    this.coinService = coinService;
  }

  // 执行一轮分析
  async performRoundAnalysis() {
    const roundTime = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. 获取最新价格数据 (带重试机制)
      let priceData = await this.coinService.fetchPricesFromCoinGecko();
      
      // 验证数据完整性 - 确保change_24h有值
      let hasValidChanges = Object.values(priceData).every((data: any) => 
        data.usd_24h_change !== undefined && data.usd_24h_change !== null
      );
      
      // 如果数据不完整,最多重试2次
      let retryCount = 0;
      while (!hasValidChanges && retryCount < 2) {
        console.log(`数据不完整,重试第 ${retryCount + 1} 次...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
        priceData = await this.coinService.fetchPricesFromCoinGecko();
        hasValidChanges = Object.values(priceData).every((data: any) => 
          data.usd_24h_change !== undefined && data.usd_24h_change !== null
        );
        retryCount++;
      }
      
      if (!hasValidChanges) {
        console.warn('⚠️  警告: 部分币种的24小时涨跌幅数据缺失');
      }
      
      // 2. 分析每个币种
      const coinDetails: any[] = [];
      let greenCount = 0;
      let redCount = 0;
      let extremeUpCount = 0;
      let extremeDownCount = 0;
      let surgeCount = 0;
      let crashCount = 0;

      for (const [coinGeckoId, data] of Object.entries(priceData)) {
        const symbol = coingeckoIdToSymbol(coinGeckoId);
        if (!symbol) continue;

        // 保存价格记录
        await this.coinService.savePriceRecord(symbol, data);

        // 获取上一次价格
        const prevRecord: any = await this.coinService.getPreviousPriceRecord(symbol);
        
        let changePercent = 0;
        let changeAmount = 0;
        
        if (prevRecord) {
          changeAmount = data.usd - prevRecord.price;
          changePercent = (changeAmount / prevRecord.price) * 100;
        }

        // 判断涨跌
        const isGreen = changePercent > 0;
        const isRed = changePercent < 0;
        
        if (isGreen) greenCount++;
        if (isRed) redCount++;

        // 判断极端行情
        const isExtremeUp = changePercent >= 4;
        const isExtremeDown = changePercent <= -3;
        
        if (isExtremeUp) extremeUpCount++;
        if (isExtremeDown) extremeDownCount++;

        // 判断急涨急跌
        const isSurge = changePercent >= 1;
        const isCrash = changePercent <= -1;
        
        if (isSurge) surgeCount++;
        if (isCrash) crashCount++;

        // 检查创新高/新低，并实现动态计次系统
        const extreme: any = await this.coinService.getOrCreatePriceExtreme(symbol, data.usd);
        let newHighCount = 0;
        let newLowCount = 0;

        // 检查是否创新高
        if (data.usd > extreme.all_time_high) {
          // 创新高：更新极值并重置计次为0
          await this.coinService.updatePriceExtreme(symbol, 'high', data.usd);
          await this.coinService.saveExtremeRecord(symbol, 'new_high', data.usd, extreme.all_time_high, 0);
          newHighCount = 1;
        } else {
          // 未创新高：计次加1
          await this.coinService.incrementExtremeCount(symbol, 'high');
        }

        // 检查是否创新低
        if (data.usd < extreme.all_time_low) {
          // 创新低：更新极值并重置计次为0
          await this.coinService.updatePriceExtreme(symbol, 'low', data.usd);
          await this.coinService.saveExtremeRecord(symbol, 'new_low', data.usd, extreme.all_time_low, 0);
          newLowCount = 1;
        } else {
          // 未创新低：计次加1
          await this.coinService.incrementExtremeCount(symbol, 'low');
        }

        coinDetails.push({
          symbol,
          price: data.usd,
          prev_price: prevRecord?.price || null,
          change_amount: changeAmount,
          change_percent: changePercent,
          is_green: isGreen,
          is_extreme_up: isExtremeUp,
          is_extreme_down: isExtremeDown,
          is_surge: isSurge,
          is_crash: isCrash,
          change_24h: data.usd_24h_change || 0,
          new_high_count: newHighCount,
          new_low_count: newLowCount
        });
      }

      // 3. 计算绿色占比
      const totalCoins = coinDetails.length;
      const greenRatio = totalCoins > 0 ? (greenCount / totalCoins) * 100 : 0;

      // 4. 风险提示
      let riskAlertCount = 0;
      if (greenRatio === 0) {
        riskAlertCount = 1;
      }

      // 5. 按24小时涨跌幅排名
      coinDetails.sort((a, b) => b.change_24h - a.change_24h);
      coinDetails.forEach((detail, index) => {
        detail.rank_in_round = index + 1;
      });

      // 6. 保存轮次统计
      await this.coinService.saveRoundStat(roundTime, {
        green_count: greenCount,
        red_count: redCount,
        green_ratio: greenRatio,
        extreme_up_count: extremeUpCount,
        extreme_down_count: extremeDownCount,
        surge_count: surgeCount,
        crash_count: crashCount,
        risk_alert_count: riskAlertCount
      });

      // 7. 计算相对上一轮的涨跌幅并保存单币详情
      for (const detail of coinDetails) {
        // 获取上一轮的数据用于计算涨跌幅
        const previousRoundDetail: any = await this.coinService.getPreviousRoundDetail(detail.symbol);
        
        let changeVsPrevRound = 0;
        let isSurgeVsPrev = false;
        let isCrashVsPrev = false;
        let previousRoundTime = null;
        
        if (previousRoundDetail) {
          previousRoundTime = previousRoundDetail.round_time;
          changeVsPrevRound = ((detail.price - previousRoundDetail.price) / previousRoundDetail.price) * 100;
          isSurgeVsPrev = changeVsPrevRound >= 1;
          isCrashVsPrev = changeVsPrevRound <= -1;
        }
        
        // 添加轮次对比数据
        const extendedDetail = {
          ...detail,
          previous_round_time: previousRoundTime,
          change_vs_prev_round: changeVsPrevRound,
          is_surge_vs_prev: isSurgeVsPrev ? 1 : 0,
          is_crash_vs_prev: isCrashVsPrev ? 1 : 0
        };
        
        await this.coinService.saveCoinRoundDetail(detail.symbol, roundTime, extendedDetail);
      }

      // 8. 更新日统计
      await this.updateDailyStats(today, coinDetails, surgeCount, crashCount);

      // 9. 更新币种优先级
      await this.updateCoinPriorities(coinDetails);

      return {
        success: true,
        roundTime,
        greenCount,
        redCount,
        greenRatio,
        extremeUpCount,
        extremeDownCount,
        surgeCount,
        crashCount,
        riskAlertCount
      };
    } catch (error: any) {
      console.error('Analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新日统计
  private async updateDailyStats(date: string, coinDetails: any[], roundSurges: number, roundCrashes: number) {
    for (const detail of coinDetails) {
      const existing: any = await this.coinService.getTodayStats(date);
      const coinStat = existing.find((s: any) => s.symbol === detail.symbol);

      const totalSurges = (coinStat?.total_surges || 0) + (detail.is_surge ? 1 : 0);
      const totalCrashes = (coinStat?.total_crashes || 0) + (detail.is_crash ? 1 : 0);
      const newHighCount = (coinStat?.new_high_count || 0) + detail.new_high_count;
      const newLowCount = (coinStat?.new_low_count || 0) + detail.new_low_count;

      // 计算市场趋势
      const { trend, strength, starRating, starType } = this.calculateMarketTrend(
        totalSurges,
        totalCrashes,
        newHighCount,
        newLowCount
      );

      await this.coinService.updateDailyStat(date, detail.symbol, {
        total_surges: totalSurges,
        total_crashes: totalCrashes,
        new_high_count: newHighCount,
        new_low_count: newLowCount,
        market_trend: trend,
        trend_strength: strength,
        star_rating: starRating,
        star_type: starType
      });
    }
  }

  // 计算市场趋势
  private calculateMarketTrend(surges: number, crashes: number, newHighs: number, newLows: number) {
    let trend: MarketTrend = '无序震荡';
    let strength = 0;
    let starRating = 0;
    let starType: StarType | null = null;

    const highLowDiff = newHighs - newLows;

    if (surges >= 10) {
      const diff = surges - crashes;
      strength = crashes > 0 ? diff / crashes : diff;

      if (highLowDiff >= 3) {
        trend = '单边主升';
      } else if (highLowDiff >= 1) {
        trend = '震荡偏多';
      }

      starType = '急涨';
      if (strength >= 1 && strength < 2) starRating = 1;
      else if (strength >= 2 && strength < 3) starRating = 2;
      else if (strength >= 3) starRating = 3;

    } else if (crashes >= 10) {
      const diff = crashes - surges;
      strength = surges > 0 ? diff / surges : diff;

      const lowHighDiff = newLows - newHighs;
      if (lowHighDiff >= 3) {
        trend = '单边主跌';
      } else if (lowHighDiff >= 1) {
        trend = '震荡偏空';
      }

      starType = '急跌';
      if (strength >= 1 && strength < 2) starRating = 1;
      else if (strength >= 2 && strength < 3) starRating = 2;
      else if (strength >= 3) starRating = 3;
    }

    return { trend, strength, starRating, starType };
  }

  // 更新币种优先级
  private async updateCoinPriorities(coinDetails: any[]) {
    const extremes: any = await this.coinService.getAllPriceExtremes();
    
    for (const detail of coinDetails) {
      const extreme = extremes.find((e: any) => e.symbol === detail.symbol);
      if (!extreme) continue;

      const lowRatio = (detail.price / extreme.all_time_low) * 100;
      const highRatio = (detail.price / extreme.all_time_high) * 100;

      const level = this.calculateCoinLevel(lowRatio, highRatio);

      await this.coinService.updateCoinPriority(detail.symbol, level, lowRatio, highRatio);
    }
  }

  // 计算币种等级
  private calculateCoinLevel(lowRatio: number, highRatio: number): CoinLevel {
    if (lowRatio >= 120 && highRatio >= 90) return 1;
    if (lowRatio >= 120 && highRatio >= 80) return 2;
    if (lowRatio >= 110 && highRatio >= 90) return 3;
    if (lowRatio >= 110 && highRatio >= 80) return 4;
    if (lowRatio < 110 && highRatio >= 90) return 5;
    return 6;
  }

  // 获取仪表板数据
  async getDashboardData() {
    // 获取最新轮次统计
    const latestRounds: any = await this.coinService.getLatestRoundStats(1);
    const latestRound = latestRounds[0];

    // 获取最新币种详情
    const coinDetails = latestRound 
      ? await this.coinService.getLatestCoinDetails(latestRound.round_time)
      : [];

    // 获取今日统计
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await this.coinService.getTodayStats(today);

    // 获取极值数据
    const extremes = await this.coinService.getAllPriceExtremes();

    // 获取优先级
    const priorities = await this.coinService.getAllCoinPriorities();
    
    // 增强coinDetails数据：添加当天急涨急跌累计次数
    const enhancedCoinDetails = coinDetails.map((detail: any) => {
      const todayStat = todayStats.find((stat: any) => stat.symbol === detail.symbol);
      return {
        ...detail,
        // 当天急涨急跌累计次数
        today_surge_count: todayStat?.total_surges || 0,
        today_crash_count: todayStat?.total_crashes || 0
      };
    });

    return {
      latestRound,
      coinDetails: enhancedCoinDetails,
      todayStats,
      extremes,
      priorities
    };
  }

  // 获取指定轮次的仪表板数据(用于历史回看)
  async getDashboardDataByRound(roundTime: string) {
    // 获取指定轮次统计
    const roundStat = await this.coinService.getRoundStatByTime(roundTime);
    
    if (!roundStat) {
      throw new Error('指定轮次不存在');
    }

    // 获取指定轮次的币种详情
    const coinDetails = await this.coinService.getLatestCoinDetails(roundTime);

    // 获取该轮次日期的统计
    const date = roundTime.split('T')[0];
    const todayStats = await this.coinService.getTodayStats(date);

    // 获取极值数据(使用当前最新的,因为极值会持续更新)
    const extremes = await this.coinService.getAllPriceExtremes();

    // 获取优先级(使用当前最新的)
    const priorities = await this.coinService.getAllCoinPriorities();

    return {
      latestRound: roundStat,
      coinDetails,
      todayStats,
      extremes,
      priorities,
      isHistorical: true,
      historicalRoundTime: roundTime
    };
  }
}
