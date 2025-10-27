export class KlineService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // 从 OKX 获取 K线数据
  async fetchKlineFromOKX(okxSymbol: string, timeframe: string = '5m', limit: number = 300) {
    const url = `https://www.okx.com/api/v5/market/candles?instId=${okxSymbol}&bar=${timeframe}&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`OKX API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== '0') {
      throw new Error(`OKX API error: ${data.msg}`);
    }

    return data.data; // 返回 K线数组
  }

  // 保存 K线数据
  async saveKlineData(symbol: string, timeframe: string, klineArray: any[]) {
    for (const kline of klineArray) {
      // OKX K线格式: [timestamp, open, high, low, close, volume, volumeCcy, volCcyQuote, confirm]
      const [openTime, open, high, low, close, volume, volumeCcy, volCcyQuote] = kline;
      
      await this.db
        .prepare(`
          INSERT OR IGNORE INTO kline_data (
            symbol, timeframe, open_time, open, high, low, close, volume,
            quote_volume, trades_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          symbol,
          timeframe,
          parseInt(openTime),
          parseFloat(open),
          parseFloat(high),
          parseFloat(low),
          parseFloat(close),
          parseFloat(volume),
          parseFloat(volCcyQuote || '0'),
          0 // OKX 不提供交易次数
        )
        .run();
    }
  }

  // 获取币种的 K线数据
  async getKlineData(symbol: string, timeframe: string, limit: number = 100) {
    const result = await this.db
      .prepare(`
        SELECT * FROM kline_data 
        WHERE symbol = ? AND timeframe = ?
        ORDER BY open_time DESC 
        LIMIT ?
      `)
      .bind(symbol, timeframe, limit)
      .all();
    
    return result.results;
  }

  // 获取最新的 K线时间
  async getLatestKlineTime(symbol: string, timeframe: string) {
    const result = await this.db
      .prepare(`
        SELECT MAX(open_time) as latest_time 
        FROM kline_data 
        WHERE symbol = ? AND timeframe = ?
      `)
      .bind(symbol, timeframe)
      .first();
    
    return result?.latest_time || 0;
  }

  // 获取 OKX 配置
  async getOKXConfig(symbol: string) {
    const result = await this.db
      .prepare('SELECT * FROM okx_config WHERE symbol = ?')
      .bind(symbol)
      .first();
    
    return result;
  }

  // 获取所有 OKX 配置
  async getAllOKXConfigs() {
    const result = await this.db
      .prepare('SELECT * FROM okx_config')
      .all();
    
    return result.results;
  }

  // 同步所有币种的 K线数据
  async syncAllKlineData(timeframe: string = '5m', limit: number = 300) {
    const configs: any = await this.getAllOKXConfigs();
    const results = [];

    for (const config of configs) {
      try {
        const klineData = await this.fetchKlineFromOKX(config.okx_symbol, timeframe, limit);
        await this.saveKlineData(config.symbol, timeframe, klineData);
        results.push({
          symbol: config.symbol,
          success: true,
          count: klineData.length
        });
      } catch (error: any) {
        results.push({
          symbol: config.symbol,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // 计算 K线统计信息
  async getKlineStats(symbol: string, timeframe: string, limit: number = 100) {
    const klines: any = await this.getKlineData(symbol, timeframe, limit);
    
    if (klines.length === 0) {
      return null;
    }

    // 计算涨跌幅
    const latest = klines[0];
    const oldest = klines[klines.length - 1];
    const changePercent = ((latest.close - oldest.open) / oldest.open) * 100;

    // 计算最高最低
    let highest = klines[0].high;
    let lowest = klines[0].low;
    let totalVolume = 0;

    for (const kline of klines) {
      if (kline.high > highest) highest = kline.high;
      if (kline.low < lowest) lowest = kline.low;
      totalVolume += kline.volume;
    }

    return {
      symbol,
      timeframe,
      dataCount: klines.length,
      latestPrice: latest.close,
      latestTime: latest.open_time,
      changePercent,
      highest,
      lowest,
      totalVolume,
      avgVolume: totalVolume / klines.length
    };
  }

  // 获取多个时间周期的数据
  async getMultiTimeframeData(symbol: string) {
    const timeframes = ['5m', '15m', '1H', '4H', '1D'];
    const results: any = {};

    for (const tf of timeframes) {
      const stats = await this.getKlineStats(symbol, tf, 100);
      if (stats) {
        results[tf] = stats;
      }
    }

    return results;
  }

  // 删除旧数据（保留最近N条）
  async cleanOldKlineData(symbol: string, timeframe: string, keepCount: number = 1000) {
    await this.db
      .prepare(`
        DELETE FROM kline_data 
        WHERE symbol = ? AND timeframe = ? 
        AND open_time < (
          SELECT open_time FROM kline_data 
          WHERE symbol = ? AND timeframe = ?
          ORDER BY open_time DESC 
          LIMIT 1 OFFSET ?
        )
      `)
      .bind(symbol, timeframe, symbol, timeframe, keepCount)
      .run();
  }
}
