// V1/V2 成交量阈值配置（根据OKEx返回值设定）
// V1: 第一阈值，V2: 第二阈值

export interface VolumeThresholds {
  v1: number;
  v2: number;
}

export const VOLUME_THRESHOLDS: Record<string, VolumeThresholds> = {
  BTC: { v1: 200000, v2: 100000 },
  ETH: { v1: 1300000, v2: 500000 },
  XRP: { v1: 200000, v2: 87000 },
  SOL: { v1: 351620, v2: 246380 },
  BNB: { v1: 2388300, v2: 1737500 },
  LTC: { v1: 50000, v2: 15000 },
  DOGE: { v1: 150000, v2: 60000 },
  SUI: { v1: 2000000, v2: 800000 },
  TRX: { v1: 13280, v2: 6022 },
  TON: { v1: 350000, v2: 200000 },
  ETC: { v1: 12000, v2: 2000 },
  BCH: { v1: 103500, v2: 50000 },
  HBAR: { v1: 103500, v2: 40000 },
  XLM: { v1: 103500, v2: 30000 },
  FIL: { v1: 5003500, v2: 3700000 },
  ADA: { v1: 67210, v2: 44230 },
  LINK: { v1: 280000, v2: 200000 },
  CRO: { v1: 100000, v2: 40000 },
  DOT: { v1: 300000, v2: 250000 },
  UNI: { v1: 140000, v2: 100000 },
  NEAR: { v1: 100000, v2: 50000 },
  APT: { v1: 300000, v2: 200000 },
  CFX: { v1: 300000, v2: 250000 },
  CRV: { v1: 1500000, v2: 1000000 },
  STX: { v1: 50000, v2: 30000 },
  LDO: { v1: 1000000, v2: 600000 },
  TAO: { v1: 300000, v2: 180000 },
  AAVE: { v1: 100000, v2: 50000 }, // 默认值（未在列表中）
  OKB: { v1: 100000, v2: 50000 }   // 默认值（未在列表中）
};

/**
 * 获取币种的V1阈值
 */
export function getV1Threshold(symbol: string): number {
  return VOLUME_THRESHOLDS[symbol]?.v1 || 100000; // 默认10万
}

/**
 * 获取币种的V2阈值
 */
export function getV2Threshold(symbol: string): number {
  return VOLUME_THRESHOLDS[symbol]?.v2 || 50000; // 默认5万
}

/**
 * 检查成交量是否超过V1阈值
 */
export function isVolumeAboveV1(symbol: string, volume: number): boolean {
  return volume > getV1Threshold(symbol);
}

/**
 * 检查成交量是否超过V2阈值
 */
export function isVolumeAboveV2(symbol: string, volume: number): boolean {
  return volume > getV2Threshold(symbol);
}
