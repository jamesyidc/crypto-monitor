// 测试V1/V2检测逻辑
const VOLUME_THRESHOLDS = {
  SUI: { v1: 2000000, v2: 800000 },
  BTC: { v1: 200000, v2: 100000 }
};

function isVolumeAboveV1(symbol, volume) {
  const threshold = VOLUME_THRESHOLDS[symbol]?.v1 || 100000;
  return volume > threshold;
}

function isVolumeAboveV2(symbol, volume) {
  const threshold = VOLUME_THRESHOLDS[symbol]?.v2 || 50000;
  return volume > threshold;
}

// 测试用例
const testCases = [
  { symbol: 'SUI', volume: 697001 },  // 应该是V2
  { symbol: 'SUI', volume: 337536 },  // 低于V2阈值
  { symbol: 'SUI', volume: 2500000 }, // 应该是V1
  { symbol: 'BTC', volume: 28000 },   // 低于阈值
  { symbol: 'BTC', volume: 150000 },  // 应该是V2
  { symbol: 'BTC', volume: 250000 }   // 应该是V1
];

console.log('V1/V2 检测测试:\n');
testCases.forEach(test => {
  const v1 = isVolumeAboveV1(test.symbol, test.volume) ? 1 : 0;
  const v2 = isVolumeAboveV2(test.symbol, test.volume) ? 1 : 0;
  const threshold_v1 = VOLUME_THRESHOLDS[test.symbol].v1;
  const threshold_v2 = VOLUME_THRESHOLDS[test.symbol].v2;
  
  console.log(`${test.symbol} volume=${test.volume.toLocaleString()}`);
  console.log(`  阈值: V1=${threshold_v1.toLocaleString()}, V2=${threshold_v2.toLocaleString()}`);
  console.log(`  结果: V1=${v1}, V2=${v2}`);
  console.log(`  标记: ${v1 ? 'V1' : v2 ? 'V2' : 'Normal'}\n`);
});
