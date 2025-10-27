import { IndicatorService } from './indicatorService';

export class KlineService {
  private db: D1Database;
  private indicatorService: IndicatorService;

  constructor(db: D1Database) {
    this.db = db;
    this.indicatorService = new IndicatorService();
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

  // 保存 K线数据 (优化：使用批量插入)
  async saveKlineData(symbol: string, timeframe: string, klineArray: any[]) {
    if (klineArray.length === 0) return;
    
    // 使用 D1 batch API 批量插入
    const statements = klineArray.map((kline) => {
      // OKX K线格式: [timestamp, open, high, low, close, volume, volumeCcy, volCcyQuote, confirm]
      const [openTime, open, high, low, close, volume, volumeCcy, volCcyQuote] = kline;
      
      return this.db.prepare(`
        INSERT OR IGNORE INTO kline_data (
          symbol, timeframe, open_time, open, high, low, close, volume,
          quote_volume, trades_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
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
      );
    });
    
    // 批量执行
    await this.db.batch(statements);
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

  // 同步所有币种的 K线数据 (优化：添加延迟避免速率限制)
  async syncAllKlineData(timeframe: string = '5m', limit: number = 300) {
    const configs: any = await this.getAllOKXConfigs();
    const results = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      try {
        const klineData = await this.fetchKlineFromOKX(config.okx_symbol, timeframe, limit);
        await this.saveKlineData(config.symbol, timeframe, klineData);
        results.push({
          symbol: config.symbol,
          success: true,
          count: klineData.length
        });
        
        // 避免OKX API速率限制：每请求后延迟100ms
        if (i < configs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
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

  // 获取带技术指标的 K线数据
  async getKlineWithIndicators(symbol: string, timeframe: string = '5m', limit: number = 300) {
    // 为了确保所有返回的K线都有完整的指标值，需要获取额外的历史数据
    // BOLL 需要 20 个周期，RSI 需要 14 个周期，为安全起见，额外获取 50 根K线
    const EXTRA_BARS = 50;
    const fetchLimit = limit + EXTRA_BARS;
    
    // 先尝试从数据库获取（获取比需要更多的数据）
    const dbData: any = await this.getKlineData(symbol, timeframe, fetchLimit);
    
    let klineData: any[];
    
    if (dbData && dbData.length >= fetchLimit) {
      // 数据库中有足够的数据，转换格式为 OKX 格式
      // OKX 格式: [timestamp, open, high, low, close, volume, ...]
      klineData = dbData.reverse().map((k: any) => [
        k.open_time.toString(),
        k.open.toString(),
        k.high.toString(),
        k.low.toString(),
        k.close.toString(),
        k.volume.toString()
      ]);
    } else {
      // 数据库数据不足，从 OKX 获取
      const config: any = await this.getOKXConfig(symbol);
      if (!config) {
        throw new Error(`未找到 ${symbol} 的 OKX 配置`);
      }
      klineData = await this.fetchKlineFromOKX(config.okx_symbol, timeframe, fetchLimit);
    }
    
    // 计算技术指标（使用所有获取的数据）
    const indicators = this.indicatorService.calculateSARRSIBoll(klineData, symbol);

    // 只返回用户请求的数量（最新的 limit 根K线）
    // indicators 数组是从旧到新排列（因为输入的 klineData 已经 reverse 过）
    // slice(-limit) 取最后 N 条（最新的数据）
    let trimmedIndicators = indicators.slice(-limit);
    
    // ===== 关键修改：反转为从新到旧排列 =====
    // 前端和用户期望看到的是：最新的K线在序号0，越往下时间越早
    // 所以需要将数组反转：从[旧...新]变成[新...旧]
    trimmedIndicators = trimmedIndicators.reverse();
    
    // 重新计算 index，从 0 开始递增
    // 现在 index=0 是最新时间，index 越大时间越早
    trimmedIndicators = trimmedIndicators.map((item, idx) => ({
      ...item,
      index: idx
    }));

    return {
      symbol,
      timeframe,
      dataCount: trimmedIndicators.length,
      data: trimmedIndicators
    };
  }

  // 批量获取多个币种的技术指标
  async getMultiSymbolIndicators(symbols: string[], timeframe: string = '5m', limit: number = 300) {
    const results: any = {};

    for (const symbol of symbols) {
      try {
        const data = await this.getKlineWithIndicators(symbol, timeframe, limit);
        results[symbol] = {
          success: true,
          data: data
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

  // 批量获取历史数据（支持超过300根K线）
  async fetchHistoricalKline(okxSymbol: string, timeframe: string = '5m', totalLimit: number = 576) {
    const batchSize = 300; // OKX 单次最大限制
    const batches = Math.ceil(totalLimit / batchSize);
    let allKlines: any[] = [];
    let after: string | null = null; // OKX 分页参数

    for (let i = 0; i < batches; i++) {
      const currentLimit = Math.min(batchSize, totalLimit - allKlines.length);
      
      // 构建 URL
      let url = `https://www.okx.com/api/v5/market/candles?instId=${okxSymbol}&bar=${timeframe}&limit=${currentLimit}`;
      if (after) {
        url += `&after=${after}`;
      }

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

      const klines = data.data;
      if (!klines || klines.length === 0) {
        break; // 没有更多数据
      }

      allKlines = allKlines.concat(klines);

      // 设置下一批的 after 参数（最后一根K线的时间戳）
      after = klines[klines.length - 1][0];

      // 达到目标数量后停止
      if (allKlines.length >= totalLimit) {
        break;
      }

      // 避免请求过快，等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allKlines;
  }

  // 同步48小时历史数据（576根5分钟K线）
  async sync48HoursData(symbol: string) {
    const config: any = await this.getOKXConfig(symbol);
    if (!config) {
      throw new Error(`未找到 ${symbol} 的 OKX 配置`);
    }

    console.log(`开始同步 ${symbol} 的48小时数据...`);

    // 获取576根5分钟K线（48小时）
    const klineData = await this.fetchHistoricalKline(config.okx_symbol, '5m', 576);
    
    // 保存到数据库
    await this.saveKlineData(symbol, '5m', klineData);

    console.log(`${symbol} 同步完成，共 ${klineData.length} 根K线`);

    return {
      symbol,
      success: true,
      count: klineData.length
    };
  }

  // 批量同步所有币种的48小时数据
  async syncAll48HoursData() {
    const configs: any = await this.getAllOKXConfigs();
    const results = [];

    for (const config of configs) {
      try {
        const result = await this.sync48HoursData(config.symbol);
        results.push(result);
      } catch (error: any) {
        results.push({
          symbol: config.symbol,
          success: false,
          error: error.message
        });
      }

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }
}
