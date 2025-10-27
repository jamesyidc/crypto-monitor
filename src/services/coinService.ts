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

  // 从 CoinGecko 获取价格数据（带重试和指数退避）
  async fetchPricesFromCoinGecko(): Promise<CoinGeckoSimplePrice> {
    const coins = await this.getAllCoins();
    const ids = coins.map((c: any) => SYMBOL_TO_COINGECKO_ID[c.symbol]).join(',');
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    
    // 重试配置：最多重试3次，使用指数退避
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 如果不是第一次尝试，等待一段时间（指数退避）
        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s，最多10s
          console.log(`CoinGecko API 重试 ${attempt}/${maxRetries}，等待 ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          }
        });

        // 429 错误（限流）- 继续重试
        if (response.status === 429) {
          console.warn(`CoinGecko API 限流 (429)，尝试 ${attempt + 1}/${maxRetries + 1}`);
          lastError = new Error(`CoinGecko API 限流: ${response.status}`);
          continue;
        }

        // 其他错误 - 不重试，直接抛出
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        // 成功获取数据
        return await response.json();
        
      } catch (error: any) {
        console.error(`CoinGecko API 请求失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message);
        lastError = error;
        
        // 如果是最后一次尝试，抛出错误
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    // 如果所有重试都失败，尝试使用备份数据源
    console.error('CoinGecko API 所有重试均失败，尝试使用备份数据源...');
    
    // 尝试 Binance API
    try {
      return await this.fetchPricesFromBinance();
    } catch (binanceError: any) {
      console.error('Binance 备份数据源失败:', binanceError.message);
    }
    
    // 尝试 CryptoCompare API 作为第三备份
    try {
      console.log('尝试 CryptoCompare API 作为第三备份数据源...');
      return await this.fetchPricesFromCoinCap();
    } catch (cryptocompareError: any) {
      console.error('CryptoCompare 备份数据源也失败:', cryptocompareError.message);
    }
    
    throw lastError || new Error('所有数据源均请求失败（CoinGecko + Binance + CryptoCompare）');
  }
  
  // 从 CryptoCompare 获取价格数据（第三备份数据源）
  private async fetchPricesFromCoinCap(): Promise<CoinGeckoSimplePrice> {
    const coins = await this.getAllCoins();
    const result: CoinGeckoSimplePrice = {};
    
    console.log('使用 CryptoCompare API 作为第三备份数据源...');
    
    // 将所有币种符号组合成批量请求
    const symbols = coins.map((c: any) => c.symbol).join(',');
    
    try {
      // CryptoCompare 支持批量查询
      const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`CryptoCompare API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.RAW) {
        throw new Error('CryptoCompare API 返回数据格式错误');
      }
      
      // 转换为 CoinGecko 格式
      for (const coin of coins) {
        const symbol = coin.symbol;
        const coinData = data.RAW[symbol]?.USD;
        
        if (coinData) {
          const coinGeckoId = SYMBOL_TO_COINGECKO_ID[symbol];
          result[coinGeckoId] = {
            usd: coinData.PRICE,
            usd_24h_change: coinData.CHANGEPCT24HOUR,
            usd_market_cap: coinData.MKTCAP,
            usd_24h_vol: coinData.VOLUME24HOURTO
          };
        } else {
          console.warn(`CryptoCompare: 未找到 ${symbol} 的数据`);
        }
      }
      
      const successCount = Object.keys(result).length;
      if (successCount < coins.length / 2) {
        throw new Error(`CryptoCompare API 数据不足: 仅获取到 ${successCount}/${coins.length} 个币种`);
      }
      
      console.log(`✅ CryptoCompare API 成功获取 ${successCount}/${coins.length} 个币种的数据`);
      return result;
      
    } catch (error: any) {
      console.error('CryptoCompare API 请求失败:', error.message);
      throw error;
    }
  }
  
  // 从 Binance 获取价格数据（备份数据源）
  private async fetchPricesFromBinance(): Promise<CoinGeckoSimplePrice> {
    const coins = await this.getAllCoins();
    const result: CoinGeckoSimplePrice = {};
    
    console.log('使用 Binance API 作为备份数据源...');
    
    // Binance API 需要单独请求每个币种
    // 为了简化，我们只获取价格，不获取24h变化
    for (const coin of coins) {
      const symbol = coin.symbol;
      const pair = `${symbol}USDT`;
      
      try {
        // Binance 24hr ticker API
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const coinGeckoId = SYMBOL_TO_COINGECKO_ID[symbol];
          
          result[coinGeckoId] = {
            usd: parseFloat(data.lastPrice),
            usd_24h_change: parseFloat(data.priceChangePercent),
            usd_market_cap: 0, // Binance API 不提供市值
            usd_24h_vol: parseFloat(data.quoteVolume)
          };
        } else {
          console.warn(`Binance API 获取 ${symbol} 失败: ${response.status}`);
        }
        
        // 添加小延迟避免被限流
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.warn(`Binance API 请求 ${symbol} 异常:`, error.message);
      }
    }
    
    // 检查是否获取到足够的数据
    const successCount = Object.keys(result).length;
    if (successCount < coins.length / 2) {
      throw new Error(`Binance API 数据不足: 仅获取到 ${successCount}/${coins.length} 个币种`);
    }
    
    console.log(`✅ Binance API 成功获取 ${successCount}/${coins.length} 个币种的数据`);
    return result;
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
        LIMIT 1 OFFSET 1
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

  // 更新极值记录（创新高/新低时调用）
  async updatePriceExtreme(symbol: string, type: 'high' | 'low', price: number) {
    if (type === 'high') {
      await this.db
        .prepare(`
          UPDATE price_extremes 
          SET all_time_high = ?, ath_date = datetime('now'), last_updated = datetime('now'), high_count = 0
          WHERE symbol = ?
        `)
        .bind(price, symbol)
        .run();
    } else {
      await this.db
        .prepare(`
          UPDATE price_extremes 
          SET all_time_low = ?, atl_date = datetime('now'), last_updated = datetime('now'), low_count = 0
          WHERE symbol = ?
        `)
        .bind(price, symbol)
        .run();
    }
  }

  // 增加计次（未创新高/新低时调用）
  async incrementExtremeCount(symbol: string, type: 'high' | 'low') {
    if (type === 'high') {
      await this.db
        .prepare(`
          UPDATE price_extremes 
          SET high_count = high_count + 1, last_updated = datetime('now')
          WHERE symbol = ?
        `)
        .bind(symbol)
        .run();
    } else {
      await this.db
        .prepare(`
          UPDATE price_extremes 
          SET low_count = low_count + 1, last_updated = datetime('now')
          WHERE symbol = ?
        `)
        .bind(symbol)
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

  // 增加极端行情累计次数（涨幅≥4%）
  async incrementExtremeUpCount(symbol: string) {
    await this.db
      .prepare(`
        UPDATE price_extremes 
        SET extreme_up_count = extreme_up_count + 1, last_updated = datetime('now')
        WHERE symbol = ?
      `)
      .bind(symbol)
      .run();
  }

  // 增加极端行情累计次数（跌幅≤-3%）
  async incrementExtremeDownCount(symbol: string) {
    await this.db
      .prepare(`
        UPDATE price_extremes 
        SET extreme_down_count = extreme_down_count + 1, last_updated = datetime('now')
        WHERE symbol = ?
      `)
      .bind(symbol)
      .run();
  }

  // 重置极端上涨计次
  async resetExtremeUpCount(symbol: string) {
    await this.db
      .prepare(`
        UPDATE price_extremes 
        SET extreme_up_count = 0, last_updated = datetime('now')
        WHERE symbol = ?
      `)
      .bind(symbol)
      .run();
  }

  // 重置极端下跌计次
  async resetExtremeDownCount(symbol: string) {
    await this.db
      .prepare(`
        UPDATE price_extremes 
        SET extreme_down_count = 0, last_updated = datetime('now')
        WHERE symbol = ?
      `)
      .bind(symbol)
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

  // 获取指定轮次的统计数据
  async getRoundStatByTime(roundTime: string) {
    const result = await this.db
      .prepare('SELECT * FROM round_stats WHERE round_time = ?')
      .bind(roundTime)
      .first();
    return result;
  }

  // 🆕 获取今日创新高/新低的总次数
  async getTodayExtremeCount(date: string, recordType: 'high' | 'low'): Promise<number> {
    // 数据库中存储的是 'new_high' 和 'new_low'
    const dbRecordType = recordType === 'high' ? 'new_high' : 'new_low';
    const result = await this.db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM extreme_records 
        WHERE DATE(timestamp) = ? AND record_type = ?
      `)
      .bind(date, dbRecordType)
      .first();
    return (result as any)?.count || 0;
  }

  // 🆕 获取今日每个币种的V1触发次数（买卖点信号中的V1）
  async getTodayV1Counts(date: string): Promise<{ [symbol: string]: number }> {
    const result = await this.db
      .prepare(`
        SELECT 
          symbol,
          COUNT(*) as v1_count
        FROM trading_signals
        WHERE DATE(created_at) = ?
          AND (details LIKE '%V1%' OR details LIKE '%V1+%')
        GROUP BY symbol
      `)
      .bind(date)
      .all();
    
    // 转换为Map对象方便查询
    const v1Counts: { [symbol: string]: number } = {};
    (result.results || []).forEach((row: any) => {
      v1Counts[row.symbol] = row.v1_count;
    });
    
    return v1Counts;
  }
}

// 将 CoinGecko ID 转换为符号
export function coingeckoIdToSymbol(id: string): string | null {
  const entry = Object.entries(SYMBOL_TO_COINGECKO_ID).find(([_, value]) => value === id);
  return entry ? entry[0] : null;
}
