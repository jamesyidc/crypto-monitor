/**
 * 操作提示信号映射配置
 * 
 * 定义每个操作提示如何映射到做多/做空的买入/卖出信号
 */

export interface OperationTipMapping {
  /** 做多买点 */
  long_buy: boolean;
  /** 做多卖点 */
  long_sell: boolean;
  /** 做空买点 */
  short_buy: boolean;
  /** 做空卖点 */
  short_sell: boolean;
}

/**
 * 操作提示到交易信号的映射表
 * 
 * 映射规则：
 * - 抄底做多：做多买点 + 做空卖点
 * - 顶部做空：做多卖点 + 做空买点
 * - 波段高点：做多卖点 + 做空买点
 * - 注意启动：做多买点 + 做空卖点
 * - 次日主升：做多买点 + 不做空
 * - 高抛：做多卖点 + 做空买点
 * - 低吸：做多买点 + 做空卖点
 * - 支撑买入：做多买点 + 做空卖点
 * - 通用卖点：做多卖点 + 做空买点
 * - 超跌反弹：做多买点 + 做空卖点
 */
export const OPERATION_TIP_MAPPINGS: Record<string, OperationTipMapping> = {
  '抄底做多': {
    long_buy: true,
    long_sell: false,
    short_buy: false,
    short_sell: true
  },
  '顶部做空': {
    long_buy: false,
    long_sell: true,
    short_buy: true,
    short_sell: false
  },
  '波段高点': {
    long_buy: false,
    long_sell: true,
    short_buy: true,
    short_sell: false
  },
  '注意启动': {
    long_buy: true,
    long_sell: false,
    short_buy: false,
    short_sell: true
  },
  '次日主升': {
    long_buy: true,
    long_sell: false,
    short_buy: false,
    short_sell: false // 不做空
  },
  '高抛': {
    long_buy: false,
    long_sell: true,
    short_buy: true,
    short_sell: false
  },
  '低吸': {
    long_buy: true,
    long_sell: false,
    short_buy: false,
    short_sell: true
  },
  '支撑买入': {
    long_buy: true,
    long_sell: false,
    short_buy: false,
    short_sell: true
  },
  '通用卖点': {
    long_buy: false,
    long_sell: true,
    short_buy: true,
    short_sell: false
  },
  '超跌反弹': {
    long_buy: true,
    long_sell: false,
    short_buy: false,
    short_sell: true
  }
};

/**
 * 需要进行信号匹配的操作提示列表
 * 
 * 只有这些操作提示才会触发信号匹配流程
 */
export const MATCHABLE_OPERATION_TIPS: string[] = [
  '抄底做多',
  '顶部做空',
  '波段高点',
  '注意启动',
  '次日主升',
  '高抛',
  '低吸',
  '支撑买入',
  '通用卖点',
  '超跌反弹'
];

/**
 * 检查操作提示是否应该触发匹配
 */
export function shouldTriggerMatching(operationTip: string | null | undefined): boolean {
  if (!operationTip) return false;
  return MATCHABLE_OPERATION_TIPS.includes(operationTip);
}

/**
 * 获取操作提示对应的信号类型
 */
export function getSignalsFromOperationTip(operationTip: string): OperationTipMapping | null {
  return OPERATION_TIP_MAPPINGS[operationTip] || null;
}

/**
 * 生成信号描述文本
 */
export function getSignalDescription(operationTip: string): string {
  const mapping = OPERATION_TIP_MAPPINGS[operationTip];
  if (!mapping) return '';
  
  const signals: string[] = [];
  if (mapping.long_buy) signals.push('做多买点');
  if (mapping.long_sell) signals.push('做多卖点');
  if (mapping.short_buy) signals.push('做空买点');
  if (mapping.short_sell) signals.push('做空卖点');
  
  return signals.join(' + ');
}
