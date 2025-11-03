/**
 * 信号匹配服务
 * 
 * 核心流程：
 * 1. K线数据采集 → 存储最新3根K线快照
 * 2. 待匹配信号池 ← 筛选有操作提示的数据
 * 3. 信号匹配引擎 → 与交易信号库匹配
 * 4. 已匹配信号池 → 存储匹配成功的信号
 * 5. 策略匹配引擎 → 与交易策略匹配
 * 6. 生产池待执行 → 符合条件的策略待执行
 */

import { D1Database } from '@cloudflare/workers-types';

// ==================== 类型定义 ====================

export interface KlineSnapshot {
  id?: number;
  symbol: string;
  timeframe: string;
  kline_time: number;
  kline_index: number;
  
  // 基础K线数据
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  change_percent: number;
  
  // 首页数据
  homepage_rank?: number;
  surge_start_point?: string;
  crash_start_point?: string;
  operation_tip?: string;
  
  // 统计数据
  today_surge_count?: number;
  today_crash_count?: number;
  rounds_since_48h_high?: number;
  decline_from_48h_high?: number;
  rounds_since_48h_low?: number;
  rise_from_48h_low?: number;
  
  // 成交量标记
  v1_flag?: number;
  v2_flag?: number;
  
  // 技术指标
  rsi_5?: number;
  rsi_14?: number;
  sar_value?: number;
  sar_position?: string;
  sar_distance_percent?: number;
  macd_value?: number;
  macd_signal?: number;
  macd_histogram?: number;
  
  // 布林带
  bollinger_middle?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
  bollinger_width?: number;
  bollinger_position?: string;
  
  // 通道占比
  channel_decline_ratio?: number;
  channel_rise_ratio?: number;
  
  // 信号
  buy_signal?: string;
  sell_signal?: string;
  
  created_at: number;
}

export interface PendingSignal {
  id?: number;
  snapshot_id: number;
  symbol: string;
  kline_time: number;
  operation_tip: string;
  snapshot_data: string; // JSON
  status: 'pending' | 'matched' | 'expired';
  match_count: number;
  created_at: number;
  matched_at?: number;
  expired_at?: number;
}

export interface MatchedSignal {
  id?: number;
  pending_signal_id: number;
  symbol: string;
  kline_time: number;
  signal_type: 'buy' | 'sell';
  signal_name: string;
  signal_id?: number;
  match_conditions?: string; // JSON
  match_score: number;
  snapshot_data: string; // JSON
  status: 'pending_strategy' | 'strategy_matched' | 'executed';
  strategy_match_count: number;
  created_at: number;
  strategy_matched_at?: number;
  executed_at?: number;
}

export interface TodayMatchedRecord {
  id?: number;
  matched_signal_id: number;
  symbol: string;
  kline_time: number;
  strategy_id: number;
  strategy_name: string;
  signal_type: 'buy' | 'sell';
  buy_point_name?: string;
  sell_point_name?: string;
  match_details?: string; // JSON
  condition_check_passed: number;
  condition_check_details?: string; // JSON
  status: 'pending_execution' | 'in_production' | 'executed';
  created_at: number;
  production_at?: number;
  executed_at?: number;
}

export interface ProductionPoolItem {
  id?: number;
  today_matched_id: number;
  symbol: string;
  kline_time: number;
  strategy_id: number;
  strategy_name: string;
  signal_type: 'buy' | 'sell';
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  position_size?: number;
  leverage: number;
  snapshot_data: string; // JSON
  strategy_config?: string; // JSON
  priority: number;
  status: 'pending' | 'executing' | 'executed' | 'cancelled';
  execution_type: 'simulated' | 'live';
  execution_id?: number;
  execution_result?: string; // JSON
  created_at: number;
  executed_at?: number;
  cancelled_at?: number;
}

// ==================== 服务类 ====================

export class SignalMatchingService {
  constructor(private db: D1Database) {}

  /**
   * 步骤1: 保存最新K线快照 (最新3根)
   * 每30秒执行一次，27个币种全部存储
   */
  async saveLatestKlineSnapshots(
    symbol: string,
    klines: any[], // 从K线服务获取的数据
    additionalData?: Partial<KlineSnapshot>
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const timeframe = '5m';
    
    // 只保存最新3根K线
    const latestThree = klines.slice(-3);
    
    for (let i = 0; i < latestThree.length; i++) {
      const kline = latestThree[i];
      const klineIndex = latestThree.length - i; // 1=最新, 2=前1根, 3=前2根
      
      const snapshot: KlineSnapshot = {
        symbol,
        timeframe,
        kline_time: kline.time,
        kline_index: klineIndex,
        open_price: kline.open,
        high_price: kline.high,
        low_price: kline.low,
        close_price: kline.close,
        volume: kline.volume,
        change_percent: kline.change_percent || 0,
        created_at: now,
        ...additionalData
      };
      
      await this.insertOrUpdateSnapshot(snapshot);
    }
    
    // 清理旧数据 (保留最近1小时的数据)
    const oneHourAgo = now - 3600;
    await this.db.prepare(`
      DELETE FROM kline_snapshot_latest 
      WHERE symbol = ? AND created_at < ?
    `).bind(symbol, oneHourAgo).run();
  }

  /**
   * 插入或更新快照
   */
  private async insertOrUpdateSnapshot(snapshot: KlineSnapshot): Promise<void> {
    const fields = Object.keys(snapshot).join(', ');
    const placeholders = Object.keys(snapshot).map(() => '?').join(', ');
    const values = Object.values(snapshot);
    
    await this.db.prepare(`
      INSERT OR REPLACE INTO kline_snapshot_latest 
      (${fields}) VALUES (${placeholders})
    `).bind(...values).run();
  }

  /**
   * 步骤2: 扫描并填充待匹配信号池
   * 筛选有操作提示的数据
   */
  async scanAndFillPendingPool(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    
    // 查找有操作提示的最新快照 (kline_index=1表示最新的K线)
    const { results } = await this.db.prepare(`
      SELECT * FROM kline_snapshot_latest
      WHERE operation_tip IS NOT NULL 
        AND operation_tip != ''
        AND kline_index = 1
        AND id NOT IN (
          SELECT snapshot_id FROM signal_pool_pending 
          WHERE status != 'expired'
        )
    `).all<KlineSnapshot>();
    
    if (!results || results.length === 0) {
      return 0;
    }
    
    // 插入待匹配信号池
    let count = 0;
    for (const snapshot of results) {
      const snapshotData = JSON.stringify(snapshot);
      
      await this.db.prepare(`
        INSERT INTO signal_pool_pending 
        (snapshot_id, symbol, kline_time, operation_tip, snapshot_data, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).bind(
        snapshot.id!,
        snapshot.symbol,
        snapshot.kline_time,
        snapshot.operation_tip!,
        snapshotData,
        now
      ).run();
      
      count++;
    }
    
    return count;
  }

  /**
   * 步骤3: 信号匹配引擎
   * 将待匹配信号池中的信号与交易信号库匹配
   */
  async matchSignalsWithLibrary(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    
    // 获取所有待匹配的信号
    const { results: pendingSignals } = await this.db.prepare(`
      SELECT * FROM signal_pool_pending 
      WHERE status = 'pending'
    `).all<PendingSignal>();
    
    if (!pendingSignals || pendingSignals.length === 0) {
      return 0;
    }
    
    let matchCount = 0;
    
    for (const pending of pendingSignals) {
      const snapshot = JSON.parse(pending.snapshot_data) as KlineSnapshot;
      
      // 根据操作提示确定信号类型
      const signalType = this.determineSignalType(pending.operation_tip);
      if (!signalType) continue;
      
      // 从买点库或卖点库获取匹配的信号
      const matchedSignals = await this.findMatchingSignals(snapshot, signalType);
      
      if (matchedSignals.length > 0) {
        // 保存到已匹配信号池
        for (const signal of matchedSignals) {
          await this.db.prepare(`
            INSERT INTO signal_pool_matched 
            (pending_signal_id, symbol, kline_time, signal_type, signal_name, 
             signal_id, match_conditions, match_score, snapshot_data, 
             status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_strategy', ?)
          `).bind(
            pending.id!,
            pending.symbol,
            pending.kline_time,
            signal.type,
            signal.name,
            signal.id || null,
            JSON.stringify(signal.conditions),
            signal.score,
            pending.snapshot_data,
            now
          ).run();
          
          matchCount++;
        }
        
        // 更新待匹配信号状态
        await this.db.prepare(`
          UPDATE signal_pool_pending 
          SET status = 'matched', 
              match_count = ?,
              matched_at = ?
          WHERE id = ?
        `).bind(matchedSignals.length, now, pending.id!).run();
      }
    }
    
    return matchCount;
  }

  /**
   * 确定信号类型
   */
  private determineSignalType(operationTip: string): 'buy' | 'sell' | null {
    const tip = operationTip.toLowerCase();
    if (tip.includes('做多') || tip.includes('买入') || tip.includes('long')) {
      return 'buy';
    }
    if (tip.includes('做空') || tip.includes('卖出') || tip.includes('short')) {
      return 'sell';
    }
    return null;
  }

  /**
   * 查找匹配的信号
   */
  private async findMatchingSignals(
    snapshot: KlineSnapshot,
    signalType: 'buy' | 'sell'
  ): Promise<Array<{
    id?: number;
    name: string;
    type: 'buy' | 'sell';
    conditions: any;
    score: number;
  }>> {
    const table = signalType === 'buy' ? 'buy_point_strategies' : 'sell_point_strategies';
    
    // 获取启用的信号
    const { results: signals } = await this.db.prepare(`
      SELECT * FROM ${table} 
      WHERE enabled = 1
    `).all();
    
    if (!signals || signals.length === 0) {
      return [];
    }
    
    const matched: Array<{
      id?: number;
      name: string;
      type: 'buy' | 'sell';
      conditions: any;
      score: number;
    }> = [];
    
    for (const signal of signals as any[]) {
      const conditions = typeof signal.conditions === 'string' 
        ? JSON.parse(signal.conditions) 
        : signal.conditions;
      
      // 检查条件是否匹配
      const { isMatch, score } = this.checkSignalConditions(snapshot, conditions);
      
      if (isMatch) {
        matched.push({
          id: signal.id,
          name: signal.name,
          type: signalType,
          conditions,
          score
        });
      }
    }
    
    return matched;
  }

  /**
   * 检查信号条件
   */
  private checkSignalConditions(
    snapshot: KlineSnapshot,
    conditions: any
  ): { isMatch: boolean; score: number } {
    let score = 0;
    let totalWeight = 0;
    let matchedCount = 0;
    let totalConditions = 0;
    
    // 如果conditions是数组，遍历检查每个条件
    const conditionArray = Array.isArray(conditions) ? conditions : [conditions];
    
    for (const condition of conditionArray) {
      totalConditions++;
      const weight = condition.weight || 1;
      totalWeight += weight;
      
      const field = condition.field;
      const operator = condition.operator;
      const value = condition.value;
      
      const fieldValue = (snapshot as any)[field];
      
      let conditionMet = false;
      
      switch (operator) {
        case '>':
          conditionMet = fieldValue > value;
          break;
        case '<':
          conditionMet = fieldValue < value;
          break;
        case '>=':
          conditionMet = fieldValue >= value;
          break;
        case '<=':
          conditionMet = fieldValue <= value;
          break;
        case '==':
        case '=':
          conditionMet = fieldValue == value;
          break;
        case '!=':
          conditionMet = fieldValue != value;
          break;
        case 'not_null':
          conditionMet = fieldValue != null && fieldValue !== '';
          break;
        case 'contains':
          conditionMet = fieldValue && fieldValue.toString().includes(value);
          break;
      }
      
      if (conditionMet) {
        matchedCount++;
        score += weight;
      }
    }
    
    // 计算匹配分数 (0-100)
    const finalScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;
    
    // 至少匹配50%的条件才算匹配
    const isMatch = matchedCount >= totalConditions * 0.5;
    
    return { isMatch, score: finalScore };
  }

  /**
   * 步骤4: 策略匹配引擎
   * 将已匹配信号与交易策略匹配
   */
  async matchSignalsWithStrategies(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    
    // 获取待策略匹配的信号
    const { results: matchedSignals } = await this.db.prepare(`
      SELECT * FROM signal_pool_matched 
      WHERE status = 'pending_strategy'
    `).all<MatchedSignal>();
    
    if (!matchedSignals || matchedSignals.length === 0) {
      return 0;
    }
    
    let matchCount = 0;
    
    for (const matched of matchedSignals) {
      const snapshot = JSON.parse(matched.snapshot_data) as KlineSnapshot;
      
      // 获取启用的交易策略
      const { results: strategies } = await this.db.prepare(`
        SELECT * FROM combined_strategies 
        WHERE enabled = 1 
          AND (
            (? = 'buy' AND buy_point_id IS NOT NULL) OR
            (? = 'sell' AND sell_point_id IS NOT NULL)
          )
      `).bind(matched.signal_type, matched.signal_type).all();
      
      if (!strategies || strategies.length === 0) continue;
      
      for (const strategy of strategies as any[]) {
        // 检查策略条件
        const conditionsPassed = await this.checkStrategyConditions(
          snapshot,
          strategy
        );
        
        if (conditionsPassed.passed) {
          // 保存到今日已匹配
          await this.db.prepare(`
            INSERT INTO signal_matched_today 
            (matched_signal_id, symbol, kline_time, strategy_id, strategy_name,
             signal_type, buy_point_name, sell_point_name, match_details,
             condition_check_passed, condition_check_details, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'pending_execution', ?)
          `).bind(
            matched.id!,
            matched.symbol,
            matched.kline_time,
            strategy.id,
            strategy.name,
            matched.signal_type,
            strategy.buy_point_name || null,
            strategy.sell_point_name || null,
            JSON.stringify({ strategy_id: strategy.id }),
            JSON.stringify(conditionsPassed.details),
            now
          ).run();
          
          matchCount++;
        }
      }
      
      // 更新已匹配信号状态
      if (matchCount > 0) {
        await this.db.prepare(`
          UPDATE signal_pool_matched 
          SET status = 'strategy_matched',
              strategy_match_count = strategy_match_count + ?,
              strategy_matched_at = ?
          WHERE id = ?
        `).bind(matchCount, now, matched.id!).run();
      }
    }
    
    return matchCount;
  }

  /**
   * 检查策略条件
   */
  private async checkStrategyConditions(
    snapshot: KlineSnapshot,
    strategy: any
  ): Promise<{ passed: boolean; details: any }> {
    const details: any = {
      checks: []
    };
    
    // 解析策略条件
    const conditions = typeof strategy.conditions === 'string'
      ? JSON.parse(strategy.conditions)
      : strategy.conditions || {};
    
    // 检查当日涨跌幅条件
    if (conditions.daily_change_min !== undefined || conditions.daily_change_max !== undefined) {
      const change = snapshot.change_percent || 0;
      
      if (conditions.daily_change_min !== undefined && change < conditions.daily_change_min) {
        details.checks.push({
          name: 'daily_change_min',
          passed: false,
          value: change,
          required: conditions.daily_change_min
        });
        return { passed: false, details };
      }
      
      if (conditions.daily_change_max !== undefined && change > conditions.daily_change_max) {
        details.checks.push({
          name: 'daily_change_max',
          passed: false,
          value: change,
          required: conditions.daily_change_max
        });
        return { passed: false, details };
      }
      
      details.checks.push({
        name: 'daily_change',
        passed: true,
        value: change
      });
    }
    
    // 检查RSI条件
    if (conditions.rsi_min !== undefined || conditions.rsi_max !== undefined) {
      const rsi = snapshot.rsi_14 || 50;
      
      if (conditions.rsi_min !== undefined && rsi < conditions.rsi_min) {
        details.checks.push({
          name: 'rsi_min',
          passed: false,
          value: rsi,
          required: conditions.rsi_min
        });
        return { passed: false, details };
      }
      
      if (conditions.rsi_max !== undefined && rsi > conditions.rsi_max) {
        details.checks.push({
          name: 'rsi_max',
          passed: false,
          value: rsi,
          required: conditions.rsi_max
        });
        return { passed: false, details };
      }
      
      details.checks.push({
        name: 'rsi',
        passed: true,
        value: rsi
      });
    }
    
    // 检查成交量条件
    if (conditions.require_v1 && !snapshot.v1_flag) {
      details.checks.push({
        name: 'v1_required',
        passed: false
      });
      return { passed: false, details };
    }
    
    if (conditions.require_v2 && !snapshot.v2_flag) {
      details.checks.push({
        name: 'v2_required',
        passed: false
      });
      return { passed: false, details };
    }
    
    // 所有条件通过
    return { passed: true, details };
  }

  /**
   * 步骤5: 填充生产池
   * 将符合条件的策略加入生产池待执行
   */
  async fillProductionPool(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    
    // 获取待执行的今日已匹配记录
    const { results: todayMatched } = await this.db.prepare(`
      SELECT * FROM signal_matched_today 
      WHERE status = 'pending_execution'
        AND condition_check_passed = 1
    `).all<TodayMatchedRecord>();
    
    if (!todayMatched || todayMatched.length === 0) {
      return 0;
    }
    
    let count = 0;
    
    for (const record of todayMatched) {
      // 获取完整的快照数据
      const { results: matchedSignals } = await this.db.prepare(`
        SELECT snapshot_data FROM signal_pool_matched 
        WHERE id = ?
      `).bind(record.matched_signal_id).all();
      
      if (!matchedSignals || matchedSignals.length === 0) continue;
      
      const snapshotData = (matchedSignals[0] as any).snapshot_data;
      const snapshot = JSON.parse(snapshotData) as KlineSnapshot;
      
      // 获取策略配置
      const { results: strategies } = await this.db.prepare(`
        SELECT * FROM combined_strategies WHERE id = ?
      `).bind(record.strategy_id).all();
      
      if (!strategies || strategies.length === 0) continue;
      
      const strategy = strategies[0] as any;
      
      // 计算交易参数
      const entryPrice = snapshot.close_price;
      const stopLoss = this.calculateStopLoss(snapshot, strategy);
      const takeProfit = this.calculateTakeProfit(snapshot, strategy);
      
      // 插入生产池
      await this.db.prepare(`
        INSERT INTO production_pool_pending 
        (today_matched_id, symbol, kline_time, strategy_id, strategy_name,
         signal_type, entry_price, stop_loss, take_profit, leverage,
         snapshot_data, strategy_config, priority, status, execution_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'simulated', ?)
      `).bind(
        record.id!,
        record.symbol,
        record.kline_time,
        record.strategy_id,
        record.strategy_name,
        record.signal_type,
        entryPrice,
        stopLoss,
        takeProfit,
        strategy.leverage || 1,
        snapshotData,
        JSON.stringify(strategy),
        strategy.priority || 5,
        now
      ).run();
      
      // 更新今日已匹配记录状态
      await this.db.prepare(`
        UPDATE signal_matched_today 
        SET status = 'in_production',
            production_at = ?
        WHERE id = ?
      `).bind(now, record.id!).run();
      
      count++;
    }
    
    return count;
  }

  /**
   * 计算止损价格
   */
  private calculateStopLoss(snapshot: KlineSnapshot, strategy: any): number {
    const entryPrice = snapshot.close_price;
    const stopLossPercent = strategy.stop_loss_percent || 2; // 默认2%
    
    if (strategy.signal_type === 'buy') {
      return entryPrice * (1 - stopLossPercent / 100);
    } else {
      return entryPrice * (1 + stopLossPercent / 100);
    }
  }

  /**
   * 计算止盈价格
   */
  private calculateTakeProfit(snapshot: KlineSnapshot, strategy: any): number {
    const entryPrice = snapshot.close_price;
    const takeProfitPercent = strategy.take_profit_percent || 5; // 默认5%
    
    if (strategy.signal_type === 'buy') {
      return entryPrice * (1 + takeProfitPercent / 100);
    } else {
      return entryPrice * (1 - takeProfitPercent / 100);
    }
  }

  /**
   * 完整流程执行
   * 自动执行所有步骤
   */
  async runCompleteFlow(): Promise<{
    snapshotsSaved: number;
    pendingFilled: number;
    signalsMatched: number;
    strategiesMatched: number;
    productionFilled: number;
  }> {
    // 步骤2: 扫描并填充待匹配信号池
    const pendingFilled = await this.scanAndFillPendingPool();
    
    // 步骤3: 信号匹配
    const signalsMatched = await this.matchSignalsWithLibrary();
    
    // 步骤4: 策略匹配
    const strategiesMatched = await this.matchSignalsWithStrategies();
    
    // 步骤5: 填充生产池
    const productionFilled = await this.fillProductionPool();
    
    return {
      snapshotsSaved: 0, // 需要从外部K线同步获取
      pendingFilled,
      signalsMatched,
      strategiesMatched,
      productionFilled
    };
  }

  /**
   * 获取系统状态概览
   */
  async getSystemOverview(): Promise<any> {
    const { results } = await this.db.prepare(`
      SELECT * FROM v_signal_overview
    `).all();
    
    return results;
  }

  /**
   * 清理过期信号
   */
  async cleanupExpiredSignals(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    
    // 获取过期时间配置 (默认30分钟)
    const { results: config } = await this.db.prepare(`
      SELECT config_value FROM signal_system_config 
      WHERE config_key = 'signal_expiry_minutes'
    `).all();
    
    const expiryMinutes = config && config.length > 0 
      ? parseInt((config[0] as any).config_value) 
      : 30;
    
    const expiryTime = now - (expiryMinutes * 60);
    
    // 标记过期的待匹配信号
    const result = await this.db.prepare(`
      UPDATE signal_pool_pending 
      SET status = 'expired',
          expired_at = ?
      WHERE status = 'pending' 
        AND created_at < ?
    `).bind(now, expiryTime).run();
    
    return result.meta.changes;
  }
}
