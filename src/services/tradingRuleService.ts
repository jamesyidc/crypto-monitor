/**
 * 交易规则服务
 * 管理每个币种的交易权限：能否开单、能开多单还是空单
 */

export interface TradingRule {
  id: number;
  symbol: string;
  trading_allowed: number;  // 1=允许交易, 0=禁止交易
  long_allowed: number;     // 1=允许做多, 0=禁止做多
  short_allowed: number;    // 1=允许做空, 0=禁止做空
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TradingRuleUpdate {
  symbol: string;
  trading_allowed?: number;
  long_allowed?: number;
  short_allowed?: number;
  notes?: string;
}

export class TradingRuleService {
  constructor(private db: D1Database) {}

  /**
   * 获取所有交易规则
   */
  async getAllRules(): Promise<TradingRule[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM trading_rules 
        ORDER BY symbol ASC
      `)
      .all();

    return result.results as TradingRule[];
  }

  /**
   * 获取单个币种的交易规则
   */
  async getRuleBySymbol(symbol: string): Promise<TradingRule | null> {
    const result = await this.db
      .prepare(`
        SELECT * FROM trading_rules 
        WHERE symbol = ?
      `)
      .bind(symbol)
      .first();

    return result as TradingRule | null;
  }

  /**
   * 检查币种是否允许交易
   */
  async isTradingAllowed(symbol: string): Promise<boolean> {
    const rule = await this.getRuleBySymbol(symbol);
    return rule ? rule.trading_allowed === 1 : false;
  }

  /**
   * 检查币种是否允许做多
   */
  async isLongAllowed(symbol: string): Promise<boolean> {
    const rule = await this.getRuleBySymbol(symbol);
    if (!rule || rule.trading_allowed !== 1) return false;
    return rule.long_allowed === 1;
  }

  /**
   * 检查币种是否允许做空
   */
  async isShortAllowed(symbol: string): Promise<boolean> {
    const rule = await this.getRuleBySymbol(symbol);
    if (!rule || rule.trading_allowed !== 1) return false;
    return rule.short_allowed === 1;
  }

  /**
   * 更新交易规则
   */
  async updateRule(update: TradingRuleUpdate): Promise<void> {
    const { symbol, trading_allowed, long_allowed, short_allowed, notes } = update;

    // 构建动态更新SQL
    const updates: string[] = [];
    const params: any[] = [];

    if (trading_allowed !== undefined) {
      updates.push('trading_allowed = ?');
      params.push(trading_allowed);
    }

    if (long_allowed !== undefined) {
      updates.push('long_allowed = ?');
      params.push(long_allowed);
    }

    if (short_allowed !== undefined) {
      updates.push('short_allowed = ?');
      params.push(short_allowed);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return; // 没有需要更新的字段
    }

    // 添加 updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(symbol);

    const sql = `
      UPDATE trading_rules 
      SET ${updates.join(', ')}
      WHERE symbol = ?
    `;

    await this.db.prepare(sql).bind(...params).run();
  }

  /**
   * 批量更新交易规则
   */
  async batchUpdateRules(updates: TradingRuleUpdate[]): Promise<void> {
    for (const update of updates) {
      await this.updateRule(update);
    }
  }

  /**
   * 获取交易统计（多少币种允许交易、允许做多、允许做空）
   */
  async getTradingStats(): Promise<{
    total: number;
    trading_allowed: number;
    long_allowed: number;
    short_allowed: number;
    both_allowed: number;
    trading_disabled: number;
  }> {
    const result = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN trading_allowed = 1 THEN 1 ELSE 0 END) as trading_allowed,
          SUM(CASE WHEN trading_allowed = 1 AND long_allowed = 1 THEN 1 ELSE 0 END) as long_allowed,
          SUM(CASE WHEN trading_allowed = 1 AND short_allowed = 1 THEN 1 ELSE 0 END) as short_allowed,
          SUM(CASE WHEN trading_allowed = 1 AND long_allowed = 1 AND short_allowed = 1 THEN 1 ELSE 0 END) as both_allowed,
          SUM(CASE WHEN trading_allowed = 0 THEN 1 ELSE 0 END) as trading_disabled
        FROM trading_rules
      `)
      .first();

    return result as any;
  }

  /**
   * 重置所有规则为默认（允许所有交易）
   */
  async resetAllRules(): Promise<void> {
    await this.db
      .prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 1, 
            long_allowed = 1, 
            short_allowed = 1,
            notes = '重置为默认允许所有交易',
            updated_at = CURRENT_TIMESTAMP
      `)
      .run();
  }

  /**
   * 快速设置：禁止所有交易
   */
  async disableAllTrading(): Promise<void> {
    await this.db
      .prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 0,
            notes = '全部禁止交易',
            updated_at = CURRENT_TIMESTAMP
      `)
      .run();
  }

  /**
   * 快速设置：仅允许做多
   */
  async setLongOnly(): Promise<void> {
    await this.db
      .prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 1,
            long_allowed = 1,
            short_allowed = 0,
            notes = '仅允许做多',
            updated_at = CURRENT_TIMESTAMP
      `)
      .run();
  }

  /**
   * 快速设置：仅允许做空
   */
  async setShortOnly(): Promise<void> {
    await this.db
      .prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 1,
            long_allowed = 0,
            short_allowed = 1,
            notes = '仅允许做空',
            updated_at = CURRENT_TIMESTAMP
      `)
      .run();
  }
}
