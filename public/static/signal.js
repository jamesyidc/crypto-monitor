// 买卖点信号分析页面 JavaScript

let signalData = null;
let autoRefreshInterval = null; // 自动刷新定时器
let isAutoRefreshEnabled = true; // 自动刷新开关状态
let currentDataMode = '24h'; // 当前数据模式：'24h' 或 'realtime'

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 默认加载24小时数据
  load24HourSignalData();
  
  // 🆕 启动自动刷新（1分钟间隔）
  startAutoRefresh();
  
  // 实时信号按钮
  document.getElementById('refreshBtn').addEventListener('click', () => {
    currentDataMode = 'realtime';
    loadSignalData();
  });
  
  // 24小时信号按钮
  document.getElementById('refresh24hBtn').addEventListener('click', () => {
    currentDataMode = '24h';
    load24HourSignalData();
  });
});

// 加载信号数据（实时 - 默认100根K线）
async function loadSignalData() {
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<i class="fas fa-spinner loading mr-2"></i>加载中...';
  
  try {
    const response = await axios.get('/api/signal/all', {
      params: {
        timeframe: '5m',
        limit: 100
      }
    });
    
    if (response.data.success) {
      signalData = response.data;
      updateStatistics(signalData.summary);
      renderAlertPool(signalData.results);
      renderTopBuySignals(signalData.summary.topBuySignals);
      renderTopSellSignals(signalData.summary.topSellSignals);
      renderAllSignals(signalData.results);
      updateLastUpdateTime();
      updateDataRange('实时数据（最近100根K线，约8小时）');
    } else {
      showError('加载失败: ' + response.data.error);
    }
  } catch (error) {
    showError('网络错误: ' + error.message);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>实时信号';
  }
}

// 加载24小时信号数据（从数据库读取历史数据）
async function load24HourSignalData() {
  const refreshBtn = document.getElementById('refresh24hBtn');
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<i class="fas fa-spinner loading mr-2"></i>加载中...';
  
  try {
    // 从数据库读取历史信号
    const response = await axios.get('/api/signal/history', {
      params: {
        hours: 24,
        limit: 1000
      }
    });
    
    if (response.data.success) {
      console.log('📊 历史数据加载成功:', {
        signals: response.data.stats.tradingSignals.total,
        alerts: response.data.stats.alertSignals.total
      });
      
      // 转换数据格式以匹配现有渲染函数
      const formattedData = formatHistoryData(response.data);
      console.log('✅ 数据格式化完成:', {
        totalSignals: formattedData.summary.totalSignals,
        symbolsCount: formattedData.summary.symbolsWithSignals.length
      });
      
      signalData = formattedData;
      
      updateStatistics(formattedData.summary);
      renderAlertPool(formattedData.results);
      renderTopBuySignals(formattedData.summary.topBuySignals);
      renderTopSellSignals(formattedData.summary.topSellSignals);
      renderAllSignals(formattedData.results);
      updateLastUpdateTime();
      updateDataRange(`过去24小时历史数据（数据库存储，共${response.data.stats.tradingSignals.total}个买卖点信号，${response.data.stats.alertSignals.total}个预警）`);
    } else {
      console.error('❌ 加载失败:', response.data.error);
      showError('加载失败: ' + response.data.error);
    }
  } catch (error) {
    console.error('❌ 网络错误:', error);
    showError('网络错误: ' + error.message);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-database mr-2"></i>历史数据';
  }
}

// 格式化历史数据以匹配现有渲染函数的格式
function formatHistoryData(historyData) {
  const { tradingSignals, alertSignals, stats } = historyData;
  
  // 按币种分组
  const symbolMap = new Map();
  
  // 处理买卖点信号
  tradingSignals.forEach(signal => {
    if (!symbolMap.has(signal.symbol)) {
      symbolMap.set(signal.symbol, {
        success: true,
        signals: [],
        alerts: []
      });
    }
    
    const symbolData = symbolMap.get(signal.symbol);
    symbolData.signals.push({
      type: signal.signal_type,
      index: 0, // 历史数据没有index
      time: signal.signal_time,
      price: signal.price,
      reason: signal.reason,
      strength: signal.strength,
      details: signal.details,
      keepBars: signal.keep_bars
    });
  });
  
  // 处理预警信号
  alertSignals.forEach(alert => {
    if (!symbolMap.has(alert.symbol)) {
      symbolMap.set(alert.symbol, {
        success: true,
        signals: [],
        alerts: []
      });
    }
    
    const symbolData = symbolMap.get(alert.symbol);
    
    // triggers已经是数组类型（后端已解析），直接使用
    const triggers = alert.triggers || [];
    
    symbolData.alerts.push({
      index: alert.kline_index || 0,
      time: alert.alert_time,
      triggers: triggers,
      volume: alert.volume,
      volumeLevel: alert.volume_level,
      changePercent: alert.change_percent,
      volatility: alert.volatility,
      rsi5m: alert.rsi_5min,
      sarChangePercent: alert.sar_change_percent,
      // K线完整数据（用于详情展示）
      klineData: alert.klineData || {
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: alert.volume || 0,
        boll_upper: 0,
        boll_middle: 0,
        boll_lower: 0,
        rsi_1h: 0,
        rsi_5min: alert.rsi_5min || 0,
        sar_value: 0,
        sar_direction: ''
      },
      data: alert.data || {
        volume: alert.volume?.toString() || '0',
        volumeLevel: alert.volume_level,
        changePercent: alert.change_percent?.toFixed(2) + '%',
        volatility: alert.volatility?.toFixed(2) + '%',
        rsi5min: alert.rsi_5min?.toFixed(2),
        sarChangePercent: alert.sar_change_percent?.toFixed(2) + '%'
      }
    });
  });
  
  // 转换为results格式
  const results = {};
  symbolMap.forEach((data, symbol) => {
    results[symbol] = data;
  });
  
  // 生成摘要
  const buySignals = tradingSignals.filter(s => s.signal_type === 'BUY');
  const sellSignals = tradingSignals.filter(s => s.signal_type === 'SELL');
  
  // 按强度排序获取Top信号
  const topBuySignals = buySignals
    .sort((a, b) => (b.strength || 0) - (a.strength || 0))
    .slice(0, 10)
    .map(s => ({
      symbol: s.symbol,
      time: s.signal_time,
      strength: s.strength,
      reason: s.reason,
      price: s.price,
      details: s.details || {},
      keepBars: s.keep_bars || 0
    }));
  
  const topSellSignals = sellSignals
    .sort((a, b) => (b.strength || 0) - (a.strength || 0))
    .slice(0, 10)
    .map(s => ({
      symbol: s.symbol,
      time: s.signal_time,
      strength: s.strength,
      reason: s.reason,
      price: s.price,
      details: s.details || {},
      keepBars: s.keep_bars || 0
    }));
  
  const summary = {
    totalSignals: stats.tradingSignals.total,
    totalBuySignals: stats.tradingSignals.buy,
    totalSellSignals: stats.tradingSignals.sell,
    symbolsWithSignals: Array.from(symbolMap.keys()),
    topBuySignals,
    topSellSignals,
    totalAlerts: stats.alertSignals.total
  };
  
  return {
    success: true,
    summary,
    results,
    timeRange: '24h',
    barsAnalyzed: 288
  };
}

// 更新统计数据
function updateStatistics(summary) {
  document.getElementById('totalSignals').textContent = summary.totalSignals;
  document.getElementById('buySignals').textContent = summary.totalBuySignals;
  document.getElementById('sellSignals').textContent = summary.totalSellSignals;
  document.getElementById('symbolsWithSignals').textContent = summary.symbolsWithSignals.length;
}

// 更新预警总数
function updateAlertCount(count) {
  const alertCountEl = document.getElementById('totalAlerts');
  if (alertCountEl) {
    alertCountEl.textContent = count;
  }
}

// 全局变量：存储所有预警数据（用于过滤）
let globalAlerts = [];

// 渲染预警池（所有触发条件的K线）
function renderAlertPool(results) {
  const container = document.getElementById('alertPool');
  const countEl = document.getElementById('alertPoolCount');
  
  // 收集所有币种的预警数据
  const allAlerts = [];
  
  Object.entries(results).forEach(([symbol, data]) => {
    if (data.success && data.alerts && data.alerts.length > 0) {
      data.alerts.forEach(alert => {
        allAlerts.push({
          symbol,
          ...alert
        });
      });
    }
  });
  
  // 按时间排序（最新的在前）
  allAlerts.sort((a, b) => {
    return b.time.localeCompare(a.time);
  });
  
  // ===== 去重逻辑：同一币种同一轮（同一时间的不同index）只保留最新的一个 =====
  // 因为K线还在形成中，每30秒抓取一次数据，同一根K线会被计算多次
  // 我们需要按"币种-时间"分组，然后只保留index最小的（最新的计算结果）
  const alertsByKey = new Map();
  
  allAlerts.forEach(alert => {
    // 提取时间的"分钟"级别作为轮次标识（例如：2025/10/27 17:25:00 -> 2025/10/27 17:25）
    const roundTime = alert.time.substring(0, 16); // "2025/10/27 17:25"
    const key = `${alert.symbol}-${roundTime}`;
    
    // 如果这个key还没有记录，或者当前alert的index更小（更新），则更新
    if (!alertsByKey.has(key) || alert.index < alertsByKey.get(key).index) {
      alertsByKey.set(key, alert);
    }
  });
  
  // 转换为数组并按时间排序（最新的在前）
  const deduplicatedAlerts = Array.from(alertsByKey.values());
  deduplicatedAlerts.sort((a, b) => b.time.localeCompare(a.time));
  
  // 保存到全局变量供过滤使用
  globalAlerts = deduplicatedAlerts;
  
  // 更新预警数量（去重后）
  countEl.textContent = deduplicatedAlerts.length;
  updateAlertCount(deduplicatedAlerts.length);
  
  // 更新时间范围
  const timeRangeEl = document.getElementById('alertPoolTimeRange');
  if (timeRangeEl && deduplicatedAlerts.length > 0) {
    const firstTime = deduplicatedAlerts[deduplicatedAlerts.length - 1].time; // 最早的
    const lastTime = deduplicatedAlerts[0].time; // 最新的
    timeRangeEl.innerHTML = `<i class="fas fa-clock mr-1"></i>数据范围：${firstTime} ~ ${lastTime}`;
  }
  
  // 渲染预警池
  renderFilteredAlerts(deduplicatedAlerts);
}

// 渲染过滤后的预警列表
function renderFilteredAlerts(alerts) {
  const container = document.getElementById('alertPool');
  const countEl = document.getElementById('alertPoolCount');
  
  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-filter text-4xl mb-2 text-gray-400"></i>
        <p class="text-gray-600">没有符合筛选条件的预警</p>
      </div>
    `;
    return;
  }
  
  // 更新显示的数量
  countEl.textContent = alerts.length;
  
  container.innerHTML = alerts.map(alert => `
    <div class="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition border-l-4 ${getBorderColor(alert.triggers)}">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold text-lg text-gray-800">${alert.symbol}</span>
            <span class="text-sm text-gray-500">${alert.time}</span>
            ${getTriggerBadges(alert.triggers)}
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-2">
            <div>
              <span class="text-gray-500">成交量:</span>
              <span class="font-semibold ml-1">${alert.data.volume}</span>
              <span class="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">${alert.data.volumeLevel}</span>
            </div>
            <div>
              <span class="text-gray-500">涨跌幅:</span>
              <span class="font-semibold ml-1 ${parseFloat(alert.data.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${alert.data.changePercent}
              </span>
            </div>
            <div>
              <span class="text-gray-500">波动率:</span>
              <span class="font-semibold ml-1">${alert.data.volatility}</span>
            </div>
            <div>
              <span class="text-gray-500">RSI(5m):</span>
              <span class="font-semibold ml-1 ${getRSIColor(parseFloat(alert.data.rsi5min))}">${alert.data.rsi5min}</span>
            </div>
          </div>
          
          <div class="mt-2 flex flex-wrap gap-1">
            ${alert.triggers.map(trigger => `
              <span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                <i class="fas fa-bolt mr-1"></i>${trigger}
              </span>
            `).join('')}
          </div>
        </div>
        
        <div class="text-right ml-4">
          <div class="text-xs text-gray-500">SAR变化</div>
          <div class="font-bold ${parseFloat(alert.data.sarChangePercent) >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${alert.data.sarChangePercent}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// 获取边框颜色（根据触发条件）
function getBorderColor(triggers) {
  if (triggers.some(t => t.includes('V1'))) return 'border-red-500';
  if (triggers.some(t => t.includes('V2'))) return 'border-orange-500';
  if (triggers.some(t => t.includes('涨幅'))) return 'border-green-500';
  if (triggers.some(t => t.includes('跌幅'))) return 'border-red-500';
  if (triggers.some(t => t.includes('震荡'))) return 'border-purple-500';
  return 'border-yellow-500';
}

// 获取触发条件徽章
function getTriggerBadges(triggers) {
  const badges = [];
  if (triggers.some(t => t.includes('V1'))) {
    badges.push('<span class="px-2 py-0.5 bg-red-500 text-white rounded text-xs font-bold">V1</span>');
  } else if (triggers.some(t => t.includes('V2'))) {
    badges.push('<span class="px-2 py-0.5 bg-orange-500 text-white rounded text-xs font-bold">V2</span>');
  }
  
  if (triggers.some(t => t.includes('涨幅'))) {
    badges.push('<span class="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-bold">↑涨</span>');
  }
  if (triggers.some(t => t.includes('跌幅'))) {
    badges.push('<span class="px-2 py-0.5 bg-red-500 text-white rounded text-xs font-bold">↓跌</span>');
  }
  if (triggers.some(t => t.includes('震荡'))) {
    badges.push('<span class="px-2 py-0.5 bg-purple-500 text-white rounded text-xs font-bold">震荡</span>');
  }
  
  return badges.join('');
}

// 获取RSI颜色
function getRSIColor(rsi) {
  if (rsi >= 70) return 'text-red-600';
  if (rsi <= 30) return 'text-green-600';
  return 'text-gray-700';
}

// 渲染顶级做多信号
function renderTopBuySignals(signals) {
  const container = document.getElementById('topBuySignals');
  
  if (signals.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-info-circle text-4xl mb-2"></i>
        <p>暂无高强度做多信号</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = signals.map(signal => `
    <div class="border border-green-200 rounded-lg p-4 hover:shadow-md transition">
      <div class="flex justify-between items-start mb-2">
        <div>
          <span class="text-lg font-bold text-gray-800">${signal.symbol}</span>
          <span class="signal-badge buy-signal ml-2">
            <i class="fas fa-arrow-up"></i>
            做多
          </span>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-600">${signal.time}</div>
          <div class="text-lg font-bold text-green-600">¥${signal.price.toFixed(2)}</div>
        </div>
      </div>
      
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-600">信号强度</span>
          <span class="font-bold ${getStrengthColor(signal.strength)}">${signal.strength}</span>
        </div>
        <div class="strength-bar">
          <div class="strength-fill ${getStrengthClass(signal.strength)}" style="width: ${signal.strength}%"></div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="detail-row">
          <span class="detail-label">震荡幅度</span>
          <span class="detail-value">${signal.details.volatility}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">RSI</span>
          <span class="detail-value text-green-600">${signal.details.rsi5min}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SAR变化</span>
          <span class="detail-value">${signal.details.sarChangePercent}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">量能水平</span>
          <span class="detail-value">${signal.details.volumeLevel}</span>
        </div>
      </div>
      
      <div class="mt-2 text-xs text-gray-500">
        <i class="fas fa-info-circle mr-1"></i>
        保留 ${signal.keepBars} 根K线观察
      </div>
    </div>
  `).join('');
}

// 渲染顶级做空信号
function renderTopSellSignals(signals) {
  const container = document.getElementById('topSellSignals');
  
  if (signals.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-info-circle text-4xl mb-2"></i>
        <p>暂无高强度做空信号</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = signals.map(signal => `
    <div class="border border-red-200 rounded-lg p-4 hover:shadow-md transition">
      <div class="flex justify-between items-start mb-2">
        <div>
          <span class="text-lg font-bold text-gray-800">${signal.symbol}</span>
          <span class="signal-badge sell-signal ml-2">
            <i class="fas fa-arrow-down"></i>
            做空
          </span>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-600">${signal.time}</div>
          <div class="text-lg font-bold text-red-600">¥${signal.price.toFixed(2)}</div>
        </div>
      </div>
      
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-600">信号强度</span>
          <span class="font-bold ${getStrengthColor(signal.strength)}">${signal.strength}</span>
        </div>
        <div class="strength-bar">
          <div class="strength-fill ${getStrengthClass(signal.strength)}" style="width: ${signal.strength}%"></div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="detail-row">
          <span class="detail-label">震荡幅度</span>
          <span class="detail-value">${signal.details.volatility}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">RSI</span>
          <span class="detail-value text-red-600">${signal.details.rsi5min}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SAR变化</span>
          <span class="detail-value">${signal.details.sarChangePercent}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">量能水平</span>
          <span class="detail-value">${signal.details.volumeLevel}</span>
        </div>
      </div>
      
      <div class="mt-2 text-xs text-gray-500">
        <i class="fas fa-info-circle mr-1"></i>
        保留 ${signal.keepBars} 根K线观察
      </div>
    </div>
  `).join('');
}

// 渲染所有币种信号
function renderAllSignals(results) {
  const container = document.getElementById('allSignals');
  
  // 过滤出有信号的币种
  const symbolsWithSignals = Object.entries(results)
    .filter(([symbol, data]) => data.success && data.signals && data.signals.length > 0)
    .sort(([, a], [, b]) => b.signals.length - a.signals.length);
  
  if (symbolsWithSignals.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-exclamation-circle text-4xl mb-2"></i>
        <p>暂无买卖点信号</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = symbolsWithSignals.map(([symbol, data]) => {
    const buySignals = data.signals.filter(s => s.type === 'BUY');
    const sellSignals = data.signals.filter(s => s.type === 'SELL');
    
    return `
      <div class="border border-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-coins mr-2 text-yellow-600"></i>
            ${symbol}
          </h3>
          <div class="flex gap-2">
            ${buySignals.length > 0 ? `
              <span class="signal-badge buy-signal">
                <i class="fas fa-arrow-up"></i>
                ${buySignals.length}个做多
              </span>
            ` : ''}
            ${sellSignals.length > 0 ? `
              <span class="signal-badge sell-signal">
                <i class="fas fa-arrow-down"></i>
                ${sellSignals.length}个做空
              </span>
            ` : ''}
          </div>
        </div>
        
        <div class="space-y-2">
          ${data.signals.map(signal => `
            <div class="bg-gray-50 rounded p-3 text-sm">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="signal-badge ${signal.type === 'BUY' ? 'buy-signal' : 'sell-signal'}">
                    <i class="fas fa-arrow-${signal.type === 'BUY' ? 'up' : 'down'}"></i>
                    ${signal.type === 'BUY' ? '做多' : '做空'}
                  </span>
                  <span class="ml-2 text-gray-600">${signal.time}</span>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold ${signal.type === 'BUY' ? 'text-green-600' : 'text-red-600'}">
                    ¥${signal.price.toFixed(2)}
                  </div>
                  <div class="text-xs text-gray-500">强度: ${signal.strength}</div>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-2 text-xs mt-2">
                <div>
                  <span class="text-gray-600">震荡: </span>
                  <span class="font-semibold">${signal.details.volatility}</span>
                </div>
                <div>
                  <span class="text-gray-600">RSI: </span>
                  <span class="font-semibold ${signal.type === 'BUY' ? 'text-green-600' : 'text-red-600'}">
                    ${signal.details.rsi5min}
                  </span>
                </div>
                <div>
                  <span class="text-gray-600">量能: </span>
                  <span class="font-semibold">${signal.details.volumeLevel}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// 获取强度颜色
function getStrengthColor(strength) {
  if (strength >= 75) return 'text-green-600';
  if (strength >= 60) return 'text-yellow-600';
  return 'text-gray-600';
}

// 获取强度样式类
function getStrengthClass(strength) {
  if (strength >= 75) return 'strength-high';
  if (strength >= 60) return 'strength-medium';
  return 'strength-low';
}

// 更新最后更新时间
function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById('lastUpdate').textContent = `最后更新: ${timeString}`;
}

// 更新数据范围显示
function updateDataRange(rangeText) {
  const dataRangeEl = document.getElementById('dataRange');
  if (dataRangeEl) {
    dataRangeEl.textContent = rangeText;
  }
}

// 显示错误信息
function showError(message) {
  const containers = ['alertPool', 'topBuySignals', 'topSellSignals', 'allSignals'];
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `
        <div class="text-center text-red-500 py-8">
          <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
          <p>${message}</p>
        </div>
      `;
    }
  });
}

// ===== 预警池过滤功能 =====

// 应用过滤器
function applyAlertFilters() {
  const filters = {
    volume: [],
    change: []
  };
  
  // 收集选中的过滤条件
  document.querySelectorAll('.alert-filter:checked').forEach(checkbox => {
    const filterType = checkbox.dataset.filterType;
    const filterValue = checkbox.dataset.filterValue;
    if (filterType && filterValue) {
      filters[filterType].push(filterValue);
    }
  });
  
  // 如果没有选择任何过滤条件，显示全部
  if (filters.volume.length === 0 && filters.change.length === 0) {
    renderFilteredAlerts(globalAlerts);
    return;
  }
  
  // 过滤数据
  const filtered = globalAlerts.filter(alert => {
    let volumeMatch = filters.volume.length === 0; // 没有选择成交量条件时默认通过
    let changeMatch = filters.change.length === 0; // 没有选择涨跌条件时默认通过
    
    // 检查成交量条件
    if (filters.volume.length > 0) {
      const volumeLevel = alert.data.volumeLevel || '';
      // V1 匹配 "V1" 或 "V1+"
      // V2 匹配 "V2" 或 "V2+"
      if (filters.volume.includes('V1') && (volumeLevel.includes('V1'))) {
        volumeMatch = true;
      }
      if (filters.volume.includes('V2') && (volumeLevel.includes('V2'))) {
        volumeMatch = true;
      }
    }
    
    // 检查涨跌幅条件
    if (filters.change.length > 0) {
      const changePercent = parseFloat(alert.data.changePercent);
      
      if (filters.change.includes('up') && changePercent >= 1.0) {
        changeMatch = true;
      }
      if (filters.change.includes('down') && changePercent <= -1.0) {
        changeMatch = true;
      }
      if (filters.change.includes('flat') && Math.abs(changePercent) < 1.0) {
        changeMatch = true;
      }
    }
    
    return volumeMatch && changeMatch;
  });
  
  renderFilteredAlerts(filtered);
}

// 清空所有过滤器
function clearAlertFilters() {
  document.querySelectorAll('.alert-filter').forEach(checkbox => {
    checkbox.checked = false;
  });
  renderFilteredAlerts(globalAlerts);
}

// 绑定过滤器事件
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.alert-filter').forEach(checkbox => {
    checkbox.addEventListener('change', applyAlertFilters);
  });
});

// 🆕 启动自动刷新（每1分钟）
function startAutoRefresh() {
  // 清除已存在的定时器
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  // 设置1分钟（60000毫秒）自动刷新
  autoRefreshInterval = setInterval(() => {
    if (isAutoRefreshEnabled) {
      console.log('🔄 自动刷新买卖点信号数据...');
      
      // 根据当前模式自动刷新
      if (currentDataMode === '24h') {
        load24HourSignalData();
      } else {
        loadSignalData();
      }
    }
  }, 60000); // 60秒 = 1分钟
  
  console.log('✅ 自动刷新已启动（间隔：1分钟）');
}

// 🆕 停止自动刷新
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
  console.log('⏸️  自动刷新已停止');
}

// 🆕 切换自动刷新状态
function toggleAutoRefresh() {
  isAutoRefreshEnabled = !isAutoRefreshEnabled;
  if (isAutoRefreshEnabled) {
    console.log('▶️  自动刷新已启用');
  } else {
    console.log('⏸️  自动刷新已暂停');
  }
}
