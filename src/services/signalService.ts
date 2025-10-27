// 买卖点识别服务
export class SignalService {
  // 识别买卖点信号
  detectTradingSignals(klineData: any[]): any {
    if (klineData.length < 30) {
      return { signals: [], stats: null, alerts: [] };
    }

    const signals: any[] = [];
    const alerts: any[] = []; // 新增：预警列表（满足任一触发条件）
    
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
      
      // === 见顶信号检测（做空） ===
      if (
        volatility > 1 && // 震荡大于1%
        hasLongUpperShadow && // 长上影线
        volumeDecay && // 量能衰减
        sarChangePercent > 0 && // SAR正值
        Math.abs(sarChangePercent) > 5 && // SAR加速（变化率大于5%）
        changePercent < 0 && // 价格转负
        rsi5min > 70 && // RSI超买
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
      
      // === 见底信号检测（做多） ===
      if (
        volatility > 1 && // 震荡大于1%
        hasLongLowerShadow && // 长下影线
        volumeDecay && // 量能衰减
        sarChangePercent < 0 && // SAR负值
        Math.abs(sarChangePercent) > 5 && // SAR加速（变化率大于5%）
        changePercent > 0 && // 价格转正
        rsi5min < 30 && // RSI超卖
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

  // 获取多个币种的买卖点信号
  async detectMultiSymbolSignals(
    symbols: string[],
    getKlineData: (symbol: string) => Promise<any>
  ): Promise<any> {
    const results: any = {};

    for (const symbol of symbols) {
      try {
        const klineData = await getKlineData(symbol);
        const detection = this.detectTradingSignals(klineData);
        
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
}
