// 买卖点信号分析页面 JavaScript

let signalData = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  loadSignalData();
  
  // 实时信号按钮
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadSignalData();
  });
  
  // 24小时信号按钮
  document.getElementById('refresh24hBtn').addEventListener('click', () => {
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

// 加载24小时信号数据
async function load24HourSignalData() {
  const refreshBtn = document.getElementById('refresh24hBtn');
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<i class="fas fa-spinner loading mr-2"></i>加载中...';
  
  try {
    const response = await axios.get('/api/signal/24h', {
      params: {
        timeframe: '5m'
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
      updateDataRange(`过去24小时数据（${signalData.barsAnalyzed}根K线，${signalData.timeframe}周期）`);
    } else {
      showError('加载失败: ' + response.data.error);
    }
  } catch (error) {
    showError('网络错误: ' + error.message);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-clock mr-2"></i>过去24小时';
  }
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
    // 假设时间格式是 "YYYY-MM-DD HH:mm:ss"
    return b.time.localeCompare(a.time);
  });
  
  // 更新预警数量
  countEl.textContent = allAlerts.length;
  updateAlertCount(allAlerts.length);
  updateAlertCount(allAlerts.length);
  
  if (allAlerts.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <i class="fas fa-check-circle text-4xl mb-2 text-green-500"></i>
        <p class="text-gray-600">暂无触发预警条件的K线</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = allAlerts.map(alert => `
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
iner.innerHTML = `
        <div class="text-center text-red-500 py-8">
          <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
          <p>${message}</p>
        </div>
      `;
    }
  });
}
