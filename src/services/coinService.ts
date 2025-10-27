import type { Bindings, CoinGeckoSimplePrice } from '../types';

// 币种符号到 CoinGecko ID 的映射
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'XRP': 'ripple',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'LTC': 'litecoin',
  'DOGE': 'dogecoin',
  'SUI': 'sui',
  'TRX': 'tron',
  'TON': 'the-open-network',
  'ETC': 'ethereum-classic',
  'BCH': 'bitcoin-cash',
  'HBAR': 'hedera-hashgraph',
  'XLM': 'stellar',
  'FIL': 'filecoin',
  'ADA': 'cardano',
  'LINK': 'chainlink',
  'CRO': 'crypto-com-chain',
  'DOT': 'polkadot',
  'OKB': 'okb',
  'AAVE': 'aave',
  'UNI': 'uniswap',
  'NEAR': 'near',
  'APT': 'aptos',
  'CFX': 'conflux-token',
  'CRV': 'curve-dao-token',
  'STX': 'blockstack',
  'LDO': 'lido-dao',
  'TAO': 'bittensor'
};

export class CoinService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // 获取所有币种
  async getAllCoins() {
    const result = await this.db
      .prepare('SELECT * FROM coins ORDER BY rank_order')
      .all();
    return result.results;
  }

  // 从 CoinGecko 获取价格数据
  async fetchPricesFromCoinGecko(): Promise<CoinGeckoSimplePrice> {
    const coins = await this.getAllCoins();
    const ids = coins.map((c: any) => SYMBOL_TO_COINGECKO_ID[c.symbol]).join(',');
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    return await response.json();
  }

  // 保存价格记录
  async savePriceRecord(symbol: string, data: any) {
    await this.db
      .prepare(`
        INSERT INTO price_records (symbol, price, change_24h, market_cap, volume_24h)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        symbol,
        data.usd,
        data.usd_24h_change || null,
        data.usd_market_cap || null,
        data.usd_24h_vol || null
      )
      .run();
  }

  // 获取上一次的价格记录
  async getPreviousPriceRecord(symbol: string) {
    const result = await this.db
      .prepare(`
        SELECT * FROM price_records 
        WHERE symbol = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `)
      .bind(symbol)
      .first();
    return result;
  }

  // 获取上一轮的币种详情（用于计算轮次涨跌幅）
  async getPreviousRoundDetail(symbol: string) {
    const result = await this.db
      .prepare(`
        SELECT * FROM coin_round_details 
        WHERE symbol = ? 
        ORDER BY round_time DESC 
        LIMIT 1
      `)
      .bind(symbol)
      .first();
    return result;
  }

  // 获取或创建极值记录
  async getOrCreatePriceExtreme(symbol: string, initialPrice: number) {
    let extreme = await this.db
      .prepare('SELECT * FROM price_extremes WHERE symbol = ?')
      .bind(symbol)
      .first();

    if (!extreme) {
      await this.db
        .prepare(`
          INSERT INTO price_extremes (symbol, all_time_high, all_time_low, ath_date, atl_date)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `)
        .bind(symbol, initialPrice, initialPrice)
        .run();

      extreme = await this.db
        .prepare('SELECT * FROM price_extremes WHERE symbol = ?')
        .bind(symbol)
        .first();
    }

    return extreme;
  }

  // 更新极值记录
  async updatePriceExtreme(symbol: string, type: 'high' | 'low', price: number) {
    if (type === 'high') {
      await this.db
        .prepare(`
          UPDATE price_extremes 
          SET all_time_high = ?, ath_date = datetime('now'), last_updated = datetime('now')
          WHERE symbol = ?
        `)
        .bind(price, symbol)
        .run();
    } else {
      await this.db
        .prepare(`
          UPDATE price_extremes 
          SET all_time_low = ?, atl_date = datetime('now'), last_updated = datetime('now')
          WHERE symbol = ?
        `)
        .bind(price, symbol)
        .run();
    }
  }

  // 保存极值记录历史
  async saveExtremeRecord(symbol: string, type: 'new_high' | 'new_low', price: number, prevExtreme: number, zeroCount: number) {
    await this.db
      .prepare(`
        INSERT INTO extreme_records (symbol, record_type, price, prev_extreme, zero_count)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(symbol, type, price, prevExtreme, zeroCount)
      .run();
  }

  // 保存轮次统计
  async saveRoundStat(roundTime: string, stats: any) {
    await this.db
      .prepare(`
        INSERT INTO round_stats (
          round_time, green_count, red_count, green_ratio,
          extreme_up_count, extreme_down_count, surge_count, crash_count, risk_alert_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        roundTime,
        stats.green_count,
        stats.red_count,
        stats.green_ratio,
        stats.extreme_up_count,
        stats.extreme_down_count,
        stats.surge_count,
        stats.crash_count,
        stats.risk_alert_count
      )
      .run();
  }

  // 保存单币轮次详情
  async saveCoinRoundDetail(symbol: string, roundTime: string, detail: any) {
    await this.db
      .prepare(`
        INSERT INTO coin_round_details (
          symbol, round_time, price, prev_price, change_amount, change_percent,
          is_green, is_extreme_up, is_extreme_down, is_surge, is_crash, rank_in_round, change_24h,
          previous_round_time, change_vs_prev_round, is_surge_vs_prev, is_crash_vs_prev
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        symbol,
        roundTime,
        detail.price,
        detail.prev_price,
        detail.change_amount,
        detail.change_percent,
        detail.is_green ? 1 : 0,
        detail.is_extreme_up ? 1 : 0,
        detail.is_extreme_down ? 1 : 0,
        detail.is_surge ? 1 : 0,
        detail.is_crash ? 1 : 0,
        detail.rank_in_round,
        detail.change_24h || 0,
        detail.previous_round_time || null,
        detail.change_vs_prev_round || 0,
        detail.is_surge_vs_prev || 0,
        detail.is_crash_vs_prev || 0
      )
      .run();
  }

  // 更新或创建日统计
  async updateDailyStat(date: string, symbol: string, updates: any) {
    const existing = await this.db
      .prepare('SELECT * FROM daily_stats WHERE date = ? AND symbol = ?')
      .bind(date, symbol)
      .first();

    if (existing) {
      await this.db
        .prepare(`
          UPDATE daily_stats 
          SET total_surges = ?, total_crashes = ?, new_high_count = ?, new_low_count = ?,
              market_trend = ?, trend_strength = ?, star_rating = ?, star_type = ?
          WHERE date = ? AND symbol = ?
        `)
        .bind(
          updates.total_surges,
          updates.total_crashes,
          updates.new_high_count,
          updates.new_low_count,
          updates.market_trend,
          updates.trend_strength,
          updates.star_rating,
          updates.star_type,
          date,
          symbol
        )
        .run();
    } else {
      await this.db
        .prepare(`
          INSERT INTO daily_stats (
            date, symbol, total_surges, total_crashes, new_high_count, new_low_count,
            market_trend, trend_strength, star_rating, star_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          date,
          symbol,
          updates.total_surges,
          updates.total_crashes,
          updates.new_high_count,
          updates.new_low_count,
          updates.market_trend,
          updates.trend_strength,
          updates.star_rating,
          updates.star_type
        )
        .run();
    }
  }

  // 获取今日统计
  async getTodayStats(date: string) {
    const result = await this.db
      .prepare('SELECT * FROM daily_stats WHERE date = ?')
      .bind(date)
      .all();
    return result.results;
  }

  // 更新币种优先级
  async updateCoinPriority(symbol: string, level: number, lowRatio: number, highRatio: number) {
    await this.db
      .prepare(`
        INSERT INTO coin_priority (symbol, level, low_ratio, high_ratio)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          level = excluded.level,
          low_ratio = excluded.low_ratio,
          high_ratio = excluded.high_ratio,
          last_updated = datetime('now')
      `)
      .bind(symbol, level, lowRatio, highRatio)
      .run();
  }

  // 获取最新的轮次统计
  async getLatestRoundStats(limit: number = 10) {
    const result = await this.db
      .prepare('SELECT * FROM round_stats ORDER BY round_time DESC LIMIT ?')
      .bind(limit)
      .all();
    return result.results;
  }

  // 获取最新的币种详情
  async getLatestCoinDetails(roundTime: string) {
    const result = await this.db
      .prepare('SELECT * FROM coin_round_details WHERE round_time = ? ORDER BY rank_in_round')
      .bind(roundTime)
      .all();
    return result.results;
  }

  // 获取所有极值数据
  async getAllPriceExtremes() {
    const result = await this.db
      .prepare('SELECT * FROM price_extremes')
      .all();
    return result.results;
  }

  // 获取所有优先级
  async getAllCoinPriorities() {
    const result = await this.db
      .prepare('SELECT * FROM coin_priority ORDER BY level')
      .all();
    return result.results;
  }
}

// 将 CoinGecko ID 转换为符号
export function coingeckoIdToSymbol(id: string): string | null {
  const entry = Object.entries(SYMBOL_TO_COINGECKO_ID).find(([_, value]) => value === id);
  return entry ? entry[0] : null;
}
