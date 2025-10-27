// 技术指标计算服务
export class IndicatorService {
  // ===================== 常量定义 =====================
  private readonly AF = 0.02;
  private readonly MAX_AF = 0.2;
  private readonly PERIOD_MS = 5 * 60 * 1000;
  private readonly MAX_SIGNAL = 100;
  private readonly RSI_PERIOD = 14;
  private readonly BOLL_PERIOD = 20;
  private readonly BOLL_K = 2;

  // ===================== 工具函数 =====================
  formatTime(ms: number): string {
    const date = new Date(parseInt(ms.toString()) + this.PERIOD_MS);
    return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }

  // ===================== RSI 计算 =====================
  calculateRSI(closes: number[], period: number = this.RSI_PERIOD): (number | null)[] {
    const rsiArray: (number | null)[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // 计算初始平均涨跌
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }

    let avgGain = gains.reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    rsiArray[period] = 100 - (100 / (1 + avgGain / avgLoss));

    // 计算后续 RSI
    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsiArray[i] = 100 - (100 / (1 + avgGain / avgLoss));
    }

    // 前面不足周期的设为 null
    for (let i = 0; i < period; i++) {
      rsiArray[i] = null;
    }

    return rsiArray;
  }

  // ===================== 布林带计算 =====================
  calculateBollingerBands(closes: number[], period: number = this.BOLL_PERIOD, k: number = this.BOLL_K) {
    const bands: Array<{ MB: number | null; UB: number | null; LB: number | null }> = [];

    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        bands.push({ MB: null, UB: null, LB: null });
        continue;
      }

      const window = closes.slice(i - period + 1, i + 1);
      const MB = window.reduce((a, b) => a + b, 0) / period;
      const variance = window.reduce((a, b) => a + Math.pow(b - MB, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      bands.push({
        MB: MB,
        UB: MB + k * stdDev,
        LB: MB - k * stdDev
      });
    }

    return bands;
  }

  // ===================== 通道状态识别 =====================
  getChannelState(
    UB_prev: number,
    UB_now: number,
    MB_prev: number,
    MB_now: number,
    LB_prev: number,
    LB_now: number
  ) {
    // 计算角度
    const angle = (a: number, b: number) => {
      const scale = ((a + b) / 2) * 0.001;
      return (Math.atan((b - a) / scale) * 180) / Math.PI;
    };

    const angle_MB = angle(MB_prev, MB_now);
    const width_prev = UB_prev - LB_prev;
    const width_now = UB_now - LB_now;
    const width_change = ((width_now - width_prev) / width_prev) * 100;

    let state = '中性';
    if (angle_MB > 5 && width_change > 3) state = '上升通道 📈';
    else if (angle_MB < -5 && width_change > 3) state = '下降通道 📉';
    else if (Math.abs(angle_MB) < 5 && width_change < -3) state = '震荡收敛 🔁';
    else if (Math.abs(angle_MB) < 5 && width_change > 3) state = '放量突破 ⚡';
    else if (angle_MB > 5 && width_change < -3) state = '上升衰竭 ⚠️';
    else if (angle_MB < -5 && width_change < -3) state = '下跌衰竭 ⚠️';

    return {
      angle_MB: parseFloat(angle_MB.toFixed(2)),
      width_change: parseFloat(width_change.toFixed(2)),
      state
    };
  }

  // ===================== SAR + RSI + BOLL 综合计算 =====================
  calculateSARRSIBoll(data: any[], symbol: string) {
    const result: any[] = [];
    let uptrend = true;
    let sar = parseFloat(data[0][3]); // 初始 SAR 为第一根K线的低点
    let afCurr = this.AF;
    let ep = parseFloat(data[0][2]); // 初始 EP 为第一根K线的高点
    let currentTrend: string | null = null;
    let trendCount = 0;

    // 提取收盘价数组
    const closes = data.map((d) => parseFloat(d[4]));

    // 计算 5分钟 RSI
    const rsi_5min = this.calculateRSI(closes);

    // 计算布林带
    const bb = this.calculateBollingerBands(closes);

    // ===== RSI_1h 计算（使用滑动窗口，每根K线都计算） =====
    // 1小时 = 12根5分钟K线
    // 使用过去12根K线计算RSI，代表"1小时周期的RSI"
    const rsi_1h_full: (number | null)[] = Array(closes.length).fill(null);
    
    // 从第12根开始，每根K线都计算RSI_1h（使用过去12根的数据）
    for (let i = 11; i < closes.length; i++) {
      const hourSlice = closes.slice(i - 11, i + 1); // 取12根K线
      const hourRSI = this.calculateRSI(hourSlice);
      const last = hourRSI[hourRSI.length - 1];
      if (last !== null) {
        rsi_1h_full[i] = parseFloat(last.toFixed(2));
      }
    }

    // ===== SAR 计算循环 =====
    for (let i = 1; i < data.length; i++) {
      const open = parseFloat(data[i][1]);
      const high = parseFloat(data[i][2]);
      const low = parseFloat(data[i][3]);
      const close = parseFloat(data[i][4]);

      let newTrend = currentTrend;

      if (uptrend) {
        // 上升趋势
        sar = sar + afCurr * (ep - sar);
        if (low < sar) {
          // 转为下降趋势
          uptrend = false;
          sar = ep;
          ep = low;
          afCurr = this.AF;
          newTrend = '空头';
          trendCount = 0;
        } else {
          if (high > ep) ep = high;
          afCurr = Math.min(afCurr + this.AF, this.MAX_AF);
          if (currentTrend !== '多头') trendCount = 0;
          newTrend = '多头';
        }
      } else {
        // 下降趋势
        sar = sar + afCurr * (ep - sar);
        if (high > sar) {
          // 转为上升趋势
          uptrend = true;
          sar = ep;
          ep = high;
          afCurr = this.AF;
          newTrend = '多头';
          trendCount = 0;
        } else {
          if (low < ep) ep = low;
          afCurr = Math.min(afCurr + this.AF, this.MAX_AF);
          if (currentTrend !== '空头') trendCount = 0;
          newTrend = '空头';
        }
      }

      if (currentTrend === newTrend) {
        trendCount = (trendCount + 1) % (this.MAX_SIGNAL + 1);
      }
      currentTrend = newTrend;

      // 获取当前和前一根K线的布林带数据
      const bbItem = bb[i] || { MB: null, UB: null, LB: null };
      const bbPrev = bb[i - 1] || bbItem;

      // 计算 SAR 变化
      let sarChange: number | null = null;
      let sarChangePercent: number | null = null;
      if (i > 1 && result.length > 0) {
        sarChange = sar - result[result.length - 1].sar;
        if (bbItem.UB !== null && bbItem.LB !== null) {
          sarChangePercent = (sarChange / (bbItem.UB - bbItem.LB)) * 100;
        }
      }

      // 计算通道状态
      let chState = { angle_MB: null, width_change: null, state: '无数据' };
      if (bbPrev.MB !== null && bbItem.MB !== null) {
        chState = this.getChannelState(
          bbPrev.UB!,
          bbItem.UB!,
          bbPrev.MB,
          bbItem.MB,
          bbPrev.LB!,
          bbItem.LB!
        );
      }

      // 计算涨跌幅
      const change = (((close - open) / open) * 100).toFixed(2) + '%';
      const change_diff = (((high - low) / open) * 100).toFixed(2);
      const bollSarDiff = bbItem.MB !== null ? bbItem.MB - sar : null;

      result.push({
        symbol: symbol,
        index: i,
        time: this.formatTime(data[i][0]),
        open,
        high,
        low,
        close,
        volume: data[i][5],
        sar,
        sarChange: sarChange ? parseFloat(sarChange.toFixed(4)) : null,
        sarChangePercent: sarChangePercent ? parseFloat(sarChangePercent.toFixed(2)) : null,
        signal: `${currentTrend}${trendCount.toString().padStart(2, '0')}`,
        rsi_5min: rsi_5min[i] ? parseFloat(rsi_5min[i]!.toFixed(2)) : null,
        rsi_1h: rsi_1h_full[i] ? rsi_1h_full[i] : null,
        change,
        'change-diff': parseFloat(change_diff),
        boll_mb: bbItem.MB ? parseFloat(bbItem.MB.toFixed(4)) : null,
        boll_ub: bbItem.UB ? parseFloat(bbItem.UB.toFixed(4)) : null,
        boll_lb: bbItem.LB ? parseFloat(bbItem.LB.toFixed(4)) : null,
        boll_sar_diff: bollSarDiff ? parseFloat(bollSarDiff.toFixed(4)) : null,
        boll_angle_mb: chState.angle_MB,
        boll_width_change: chState.width_change,
        channel_state: chState.state
      });
    }

    // 🆕 使用数据库中的固定V1/V2阈值标注（严格按用户提供的标准）
    // 从原始K线数据中读取 volume_v1 和 volume_v2 标注
    result.forEach((k, idx) => {
      // data数组中第idx+1个元素对应result中第idx个元素（因为result从i=1开始）
      const dataIndex = idx + 1;
      const klineArray = data[dataIndex];
      // 如果K线数据中有 volume_v1/v2 标注，使用它；否则默认为0
      const volumeV1 = klineArray?.volume_v1 !== undefined ? klineArray.volume_v1 : 0;
      const volumeV2 = klineArray?.volume_v2 !== undefined ? klineArray.volume_v2 : 0;
      
      (k as any).volume_v1 = volumeV1;
      (k as any).volume_v2 = volumeV2;
      (k as any).is_v1 = volumeV1 === 1;
      (k as any).is_v2 = volumeV2 === 1;
      (k as any).volume_level = volumeV1 === 1 ? 'V1' : volumeV2 === 1 ? 'V2' : 'Normal';
    });

    return result;
  }
}
