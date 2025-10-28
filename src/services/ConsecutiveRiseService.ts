// 连续上涨占优统计服务
// 统计币种连续上涨占比大于下跌占比的K线数量
// 
// 重要：使用 kline_data 表的真实K线数据，而非 coin_round_details 的采集轮次

export class ConsecutiveRiseService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 回溯分析所有历史K线数据，重新计算连续统计
   * 使用 kline_data 表的真实K线数据
   */
  async analyzeHistoricalData(timeframe: string = '5m', limit: number = 1000) {
    try {
      console.log(`开始分析历史K线数据 (timeframe: ${timeframe}, limit: ${limit})...`);

      // 清空现有统计数据
      await this.db
        .prepare('DELETE FROM consecutive_rise_dominance')
        .run();

      // 获取所有币种列表
      const symbolsResult = await this.db
        .prepare('SELECT DISTINCT symbol FROM kline_data WHERE timeframe = ? ORDER BY symbol')
        .bind(timeframe)
        .all();

      const symbols = symbolsResult.results.map(r => r.symbol as string);
      console.log(`找到 ${symbols.length} 个币种`);

      let processedCount = 0;

      // 逐个币种分析
      for (const symbol of symbols) {
        try {
          await this.analyzeSymbolKlines(symbol, timeframe, limit);
          processedCount++;
          
          if (processedCount % 5 === 0) {
            console.log(`已处理 ${processedCount}/${symbols.length} 个币种...`);
          }
        } catch (error: any) {
          console.error(`处理 ${symbol} 失败:`, error.message);
        }
      }

      console.log(`历史数据分析完成，共处理 ${processedCount} 个币种`);

      return {
        success: true,
        processedSymbols: processedCount,
        totalSymbols: symbols.length,
        timeframe,
        message: '历史数据分析完成'
      };
    } catch (error: any) {
      console.error('分析历史数据失败:', error);
      throw error;
    }
  }

  /**
   * 分析单个币种的所有K线数据
   */
  private async analyzeSymbolKlines(symbol: string, timeframe: string, limit: number) {
    // 获取该币种的历史K线数据（最近N根）
    const klinesResult = await this.db
      .prepare(`
        SELECT 
          kd.open_time,
          kd.close as price,
          pe.all_time_high,
          pe.all_time_low
        FROM kline_data kd
        JOIN price_extremes pe ON kd.symbol = pe.symbol
        WHERE kd.symbol = ? 
          AND kd.timeframe = ?
        ORDER BY kd.open_time DESC
        LIMIT ?
      `)
      .bind(symbol, timeframe, limit)
      .all();

    const klines = klinesResult.results.reverse(); // 按时间正序

    if (klines.length === 0) {
      return; // 没有K线数据，跳过
    }

    // 统计连续上涨占优
    let currentStreak = 0;
    let maxStreak = 0;
    let maxStreakStartTime: string | null = null;
    let maxStreakEndTime: string | null = null;
    let lastHighRatio = 0;
    let lastLowRatio = 0;

    for (const kline of klines) {
      const price = kline.price as number;
      const allTimeHigh = kline.all_time_high as number;
      const allTimeLow = kline.all_time_low as number;
      const openTime = new Date(kline.open_time as number).toISOString();

      // 计算占比
      const highRatio = allTimeHigh > 0 ? (price * 100.0 / allTimeHigh) : 0;
      const lowRatio = allTimeLow > 0 ? (price * 100.0 / allTimeLow) : 0;

      lastHighRatio = highRatio;
      lastLowRatio = lowRatio;

      // 判断是否上涨占优
      const isRiseDominant = highRatio > lowRatio;

      if (isRiseDominant) {
        if (currentStreak === 0) {
          // 新的连续开始
          currentStreak = 1;
        } else {
          currentStreak++;
        }

        // 更新最大连续记录
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          maxStreakEndTime = openTime;
          
          // 计算开始时间（往前推N根K线）
          const startIndex = klines.findIndex(k => new Date(k.open_time as number).toISOString() === openTime) - currentStreak + 1;
          if (startIndex >= 0) {
            maxStreakStartTime = new Date(klines[startIndex].open_time as number).toISOString();
          } else {
            maxStreakStartTime = openTime;
          }
        }
      } else {
        // 连续中断
        currentStreak = 0;
      }
    }

    // 保存到数据库
    await this.db
      .prepare(`
        INSERT INTO consecutive_rise_dominance (
          symbol, current_streak, max_streak, 
          max_streak_start_time, max_streak_end_time,
          last_check_time, last_high_ratio, last_low_ratio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        symbol,
        currentStreak,
        maxStreak,
        maxStreakStartTime,
        maxStreakEndTime,
        new Date().toISOString(),
        lastHighRatio,
        lastLowRatio
      )
      .run();
  }

  /**
   * 每次K线数据更新后调用，增量更新单个币种的统计
   */
  async updateSymbolKline(symbol: string, timeframe: string = '5m') {
    try {
      // 获取该币种最新的K线
      const latestKline = await this.db
        .prepare(`
          SELECT 
            kd.open_time,
            kd.close as price,
            pe.all_time_high,
            pe.all_time_low
          FROM kline_data kd
          JOIN price_extremes pe ON kd.symbol = pe.symbol
          WHERE kd.symbol = ? 
            AND kd.timeframe = ?
          ORDER BY kd.open_time DESC
          LIMIT 1
        `)
        .bind(symbol, timeframe)
        .first();

      if (!latestKline) {
        return; // 没有K线数据
      }

      const price = latestKline.price as number;
      const allTimeHigh = latestKline.all_time_high as number;
      const allTimeLow = latestKline.all_time_low as number;
      const openTime = new Date(latestKline.open_time as number).toISOString();

      // 计算占比
      const highRatio = allTimeHigh > 0 ? (price * 100.0 / allTimeHigh) : 0;
      const lowRatio = allTimeLow > 0 ? (price * 100.0 / allTimeLow) : 0;
      const isRiseDominant = highRatio > lowRatio;

      // 获取现有统计
      const existing = await this.db
        .prepare('SELECT * FROM consecutive_rise_dominance WHERE symbol = ?')
        .bind(symbol)
        .first();

      if (!existing) {
        // 新币种，创建记录
        await this.db
          .prepare(`
            INSERT INTO consecutive_rise_dominance (
              symbol, current_streak, max_streak,
              max_streak_start_time, max_streak_end_time,
              last_check_time, last_high_ratio, last_low_ratio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            symbol,
            isRiseDominant ? 1 : 0,
            isRiseDominant ? 1 : 0,
            isRiseDominant ? openTime : null,
            isRiseDominant ? openTime : null,
            openTime,
            highRatio,
            lowRatio
          )
          .run();
      } else {
        // 更新现有记录
        const currentStreak = existing.current_streak as number;
        const maxStreak = existing.max_streak as number;

        let newCurrentStreak: number;
        let newMaxStreak = maxStreak;
        let newMaxStreakStart = existing.max_streak_start_time as string | null;
        let newMaxStreakEnd = existing.max_streak_end_time as string | null;

        if (isRiseDominant) {
          newCurrentStreak = currentStreak + 1;
          
          if (newCurrentStreak > maxStreak) {
            newMaxStreak = newCurrentStreak;
            newMaxStreakEnd = openTime;
            if (currentStreak === 0) {
              newMaxStreakStart = openTime;
            }
          }
        } else {
          newCurrentStreak = 0;
        }

        await this.db
          .prepare(`
            UPDATE consecutive_rise_dominance
            SET 
              current_streak = ?,
              max_streak = ?,
              max_streak_start_time = ?,
              max_streak_end_time = ?,
              last_check_time = ?,
              last_high_ratio = ?,
              last_low_ratio = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE symbol = ?
          `)
          .bind(
            newCurrentStreak,
            newMaxStreak,
            newMaxStreakStart,
            newMaxStreakEnd,
            openTime,
            highRatio,
            lowRatio,
            symbol
          )
          .run();
      }
    } catch (error: any) {
      console.error(`更新 ${symbol} K线统计失败:`, error);
      throw error;
    }
  }

  /**
   * 获取连续K线数超过指定阈值的币种
   */
  async getCoinsAboveThreshold(threshold: number = 20) {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            crd.*,
            pe.all_time_high,
            pe.all_time_low
          FROM consecutive_rise_dominance crd
          LEFT JOIN price_extremes pe ON crd.symbol = pe.symbol
          WHERE crd.max_streak >= ?
          ORDER BY crd.max_streak DESC, crd.current_streak DESC
        `)
        .bind(threshold)
        .all();

      return result.results;
    } catch (error: any) {
      console.error('获取连续统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有币种的连续统计
   */
  async getAllStats() {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            crd.*,
            pe.all_time_high,
            pe.all_time_low
          FROM consecutive_rise_dominance crd
          LEFT JOIN price_extremes pe ON crd.symbol = pe.symbol
          ORDER BY crd.max_streak DESC, crd.current_streak DESC
        `)
        .all();

      return result.results;
    } catch (error: any) {
      console.error('获取所有连续统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取统计概览
   */
  async getStatsOverview() {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            COUNT(*) as total_coins,
            COUNT(CASE WHEN max_streak >= 20 THEN 1 END) as above_20,
            COUNT(CASE WHEN max_streak >= 30 THEN 1 END) as above_30,
            COUNT(CASE WHEN max_streak >= 40 THEN 1 END) as above_40,
            COUNT(CASE WHEN current_streak > 0 THEN 1 END) as currently_rising,
            MAX(max_streak) as max_streak_overall,
            AVG(max_streak) as avg_max_streak
          FROM consecutive_rise_dominance
        `)
        .first();

      return result;
    } catch (error: any) {
      console.error('获取统计概览失败:', error);
      throw error;
    }
  }
}
