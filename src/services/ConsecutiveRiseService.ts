// 连续上涨占优统计服务
// 统计币种连续上涨占比大于下跌占比的K线数量

export class ConsecutiveRiseService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 每次K线数据更新后调用，检查并更新连续统计
   */
  async updateKlineStats() {
    try {
      // 获取最新的round_time
      const latestRoundResult = await this.db
        .prepare('SELECT MAX(round_time) as round_time FROM round_stats')
        .first();
      
      if (!latestRoundResult || !latestRoundResult.round_time) {
        throw new Error('没有找到最新的round_time');
      }

      const roundTime = latestRoundResult.round_time as string;

      // 获取所有币种的当前占比数据
      const result = await this.db
        .prepare(`
          SELECT 
            pe.symbol,
            cd.price as current_price,
            pe.all_time_high,
            pe.all_time_low,
            CASE 
              WHEN pe.all_time_high > 0 
              THEN (cd.price * 100.0 / pe.all_time_high)
              ELSE 0 
            END as high_ratio,
            CASE 
              WHEN pe.all_time_low > 0 
              THEN (cd.price * 100.0 / pe.all_time_low)
              ELSE 0 
            END as low_ratio
          FROM price_extremes pe
          JOIN coin_round_details cd ON pe.symbol = cd.symbol
          WHERE cd.round_time = ?
        `)
        .bind(roundTime)
        .all();

      const coins = result.results;

      for (const coin of coins) {
        await this.updateCoinStreak(
          coin.symbol as string,
          coin.high_ratio as number,
          coin.low_ratio as number,
          roundTime
        );
      }

      return {
        success: true,
        processedCoins: coins.length,
        roundTime: roundTime
      };
    } catch (error: any) {
      console.error('更新连续上涨统计失败:', error);
      throw error;
    }
  }

  /**
   * 更新单个币种的连续统计
   */
  private async updateCoinStreak(
    symbol: string,
    highRatio: number,
    lowRatio: number,
    checkTime: string
  ) {
    try {
      // 获取现有记录
      const existing = await this.db
        .prepare(`
          SELECT * FROM consecutive_rise_dominance
          WHERE symbol = ?
        `)
        .bind(symbol)
        .first();

      const isRiseDominant = highRatio > lowRatio;

      if (!existing) {
        // 新币种：创建记录
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
            isRiseDominant ? checkTime : null,
            isRiseDominant ? checkTime : null,
            checkTime,
            highRatio,
            lowRatio
          )
          .run();
      } else {
        // 现有币种：更新统计
        const lastCheckTime = existing.last_check_time as string;
        const currentStreak = existing.current_streak as number;
        const maxStreak = existing.max_streak as number;

        // 检查是否是重复的round_time（避免重复统计）
        if (lastCheckTime === checkTime) {
          return; // 这个K线已经统计过了
        }

        let newCurrentStreak: number;
        let newMaxStreak: number = maxStreak;
        let newMaxStreakStart: string | null = existing.max_streak_start_time as string;
        let newMaxStreakEnd: string | null = existing.max_streak_end_time as string;

        if (isRiseDominant) {
          // 上涨占优：连续K线数+1
          newCurrentStreak = currentStreak + 1;

          // 判断是否打破历史记录
          if (newCurrentStreak > maxStreak) {
            newMaxStreak = newCurrentStreak;
            // 如果是新的连续开始，记录开始时间；否则保持原开始时间
            if (currentStreak === 0) {
              newMaxStreakStart = checkTime;
            }
            newMaxStreakEnd = checkTime;
          }
        } else {
          // 下跌占优或平：连续中断，重置为0
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
            checkTime,
            highRatio,
            lowRatio,
            symbol
          )
          .run();
      }
    } catch (error: any) {
      console.error(`更新 ${symbol} 连续统计失败:`, error);
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
            pe.all_time_low,
            cd.price as current_price
          FROM consecutive_rise_dominance crd
          LEFT JOIN price_extremes pe ON crd.symbol = pe.symbol
          LEFT JOIN coin_round_details cd ON crd.symbol = cd.symbol
          WHERE crd.max_streak >= ?
            AND cd.round_time = (SELECT MAX(round_time) FROM coin_round_details)
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
            pe.all_time_low,
            cd.price as current_price
          FROM consecutive_rise_dominance crd
          LEFT JOIN price_extremes pe ON crd.symbol = pe.symbol
          LEFT JOIN coin_round_details cd ON crd.symbol = cd.symbol
          WHERE cd.round_time = (SELECT MAX(round_time) FROM coin_round_details)
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
