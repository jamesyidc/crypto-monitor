// 全局状态
let currentSymbol = 'BTC';
let currentTimeframe = '5m';
let klineChart = null;
let allCoins = [];
let showIndicators = true; // 默认显示技术指标
let autoRefreshInterval = null;
let countdown = 30;
let countdownInterval = null;

// 从URL参数获取初始币种和时间周期
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const symbol = urlParams.get('symbol');
  const timeframe = urlParams.get('timeframe');
  
  if (symbol) {
    currentSymbol = symbol.toUpperCase();
  }
  if (timeframe) {
    currentTimeframe = timeframe;
  }
  
  console.log('📋 URL参数:', { symbol: currentSymbol, timeframe: currentTimeframe });
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 首先从URL读取参数
  getUrlParams();
  
  await loadCoins();
  bindTimeframeButtons();
  document.getElementById('syncBtn').addEventListener('click', syncKlineData);
  document.getElementById('sync48hBtn').addEventListener('click', sync48HoursData);
  document.getElementById('toggleIndicators').addEventListener('click', toggleIndicatorColumns);
  
  // 启动自动刷新（30秒）
  startAutoRefresh();
});

// 启动自动刷新
function startAutoRefresh() {
  // 设置30秒自动刷新
  autoRefreshInterval = setInterval(() => {
    loadKlineData();
    resetCountdown();
  }, 30000);
  
  // 启动倒计时显示
  startCountdown();
}

// 启动倒计时
function startCountdown() {
  countdown = 30;
  updateCountdownDisplay();
  
  countdownInterval = setInterval(() => {
    countdown--;
    updateCountdownDisplay();
    
    if (countdown <= 0) {
      countdown = 30;
    }
  }, 1000);
}

// 重置倒计时
function resetCountdown() {
  countdown = 30;
  updateCountdownDisplay();
}

// 更新倒计时显示
function updateCountdownDisplay() {
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    countdownEl.textContent = `${countdown}秒后自动刷新`;
  }
}

// 加载币种列表
async function loadCoins() {
  try {
    const response = await axios.get('/api/coins');
    allCoins = response.data;
    renderCoinSelector();
  } catch (error) {
    console.error('加载币种失败:', error);
    alert('加载币种列表失败: ' + error.message);
  }
}

// 渲染币种选择器
function renderCoinSelector() {
  const container = document.getElementById('coinSelector');
  container.innerHTML = allCoins.map(coin => `
    <button 
      class="coin-btn px-4 py-2 rounded-lg border border-gray-300 font-semibold ${coin.symbol === currentSymbol ? 'active' : ''}"
      data-symbol="${coin.symbol}"
    >
      ${coin.symbol}
    </button>
  `).join('');

  // 绑定点击事件
  document.querySelectorAll('.coin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.coin-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentSymbol = e.target.dataset.symbol;
      loadKlineData();
    });
  });

  // 加载默认币种数据
  if (allCoins.length > 0) {
    loadKlineData();
  }
}

// 绑定时间周期按钮
function bindTimeframeButtons() {
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    // 设置初始选中状态
    if (btn.dataset.tf === currentTimeframe) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTimeframe = e.target.dataset.tf;
      loadKlineData();
    });
  });
}

// 加载 K线数据（带技术指标和预警）
async function loadKlineData() {
  try {
    showLoading();
    
    // 获取带技术指标的 K线数据
    const klineResponse = await axios.get(`/api/kline/${currentSymbol}/indicators`, {
      params: {
        timeframe: currentTimeframe,
        limit: 300
      }
    });

    if (!klineResponse.data.success) {
      showError(klineResponse.data.error || '加载失败');
      return;
    }

    const klineData = klineResponse.data.data;

    if (!klineData || klineData.length === 0) {
      showNoData();
      return;
    }

    // 直接渲染数据（不再调用耗时的signal API）
    // indicators API已经包含了所有技术指标和信号
    renderChart(klineData);
    renderTable(klineData, []);  // 暂时不显示预警标记
    
    // 显示统计面板
    document.getElementById('statsPanel').classList.remove('hidden');
    
    // 重置倒计时
    resetCountdown();

  } catch (error) {
    console.error('加载K线数据失败:', error);
    showError('加载失败: ' + error.message);
  }
}

// 渲染统计信息
function renderStats(stats) {
  if (!stats) return;

  document.getElementById('statsPanel').classList.remove('hidden');
  document.getElementById('statPrice').textContent = '$' + stats.latestPrice.toFixed(4);
  
  const changeEl = document.getElementById('statChange');
  const changePercent = stats.changePercent;
  changeEl.textContent = (changePercent > 0 ? '+' : '') + changePercent.toFixed(2) + '%';
  changeEl.className = `text-2xl font-bold ${changePercent > 0 ? 'text-green-600' : 'text-red-600'}`;
  
  document.getElementById('statHigh').textContent = '$' + stats.highest.toFixed(4);
  document.getElementById('statLow').textContent = '$' + stats.lowest.toFixed(4);
}

// 渲染图表
function renderChart(klineData) {
  const ctx = document.getElementById('klineChart').getContext('2d');
  
  // 销毁旧图表
  if (klineChart) {
    klineChart.destroy();
  }

  // 反转数据（从旧到新）
  const data = [...klineData].reverse();

  // 准备数据 - 优先使用 time 字段（格式化时间），如果没有则用 open_time
  const labels = data.map(k => {
    if (k.time) {
      // time 格式：2025/10/27 18:30:00 -> 提取 18:30
      return k.time.substring(11, 16);
    } else if (k.open_time) {
      // 使用 open_time 时间戳
      const date = new Date(k.open_time);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return '';
  });
  const prices = data.map(k => k.close);
  const volumes = data.map(k => k.volume);
  
  // 计算涨幅百分比（相对于第一个价格）
  const firstPrice = prices[0] || 0;
  const changes = prices.map(price => {
    if (!firstPrice) return 0;
    return ((price - firstPrice) / firstPrice * 100);
  });

  // 创建新图表
  klineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '涨幅 (%)',
          data: changes,  // 使用百分比数据而不是价格数据
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: `${currentSymbol} - ${currentTimeframe} K线图`
        },
        tooltip: {
          callbacks: {
            // 自定义tooltip显示价格和涨幅
            label: function(context) {
              const index = context.dataIndex;
              const change = changes[index];
              const price = prices[index];
              const changeText = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
              return [
                `涨幅: ${changeText}`,
                `价格: $${price.toFixed(4)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 20,  // 限制最多显示20个标签，避免重叠
            maxRotation: 45,    // 最大旋转角度
            minRotation: 45,    // 最小旋转角度（保持一致）
            autoSkip: true      // 自动跳过一些标签
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '涨幅 (%) - 基准: $' + (firstPrice ? firstPrice.toFixed(2) : '0')
          },
          // 强制Y轴从0开始（0% = 基准价格）
          beginAtZero: false,
          // Y轴显示百分比
          ticks: {
            callback: function(value) {
              return value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
            }
          }
        }
      }
    }
  });
}

// 渲染表格
function renderTable(klineData, alerts = []) {
  const tbody = document.getElementById('klineTableBody');
  
  // 创建预警索引映射（用于快速查找）
  const alertMap = {};
  alerts.forEach(alert => {
    alertMap[alert.index] = alert;
  });
  
  tbody.innerHTML = klineData.map((k) => {
    // 检查是否有预警
    const hasAlert = alertMap[k.index];
    // 行背景色（预警优先）
    const rowClass = hasAlert 
      ? 'bg-yellow-50 border-l-4 border-yellow-500' 
      : '';
    
    // 基础K线数据 - 涨跌幅颜色
    const getChangeClass = (change) => {
      if (!change) return 'text-gray-400';
      // 如果包含负号 → 红色（跌）
      if (change.includes('-')) return 'text-red-600';
      // 如果包含加号或者是正数（不含负号） → 绿色（涨）
      if (change.includes('+') || parseFloat(change) > 0) return 'text-green-600';
      // 零涨跌幅 → 灰色
      return 'text-gray-400';
    };
    const changeClass = getChangeClass(k.change);
    
    // V1/V2 标记（使用固定阈值）
    const volumeV1 = k.volume_v1 === 1;
    const volumeV2 = k.volume_v2 === 1;
    const v1Badge = volumeV1 ? '<span class="text-red-600 font-bold">V1</span>' : '<span class="text-gray-400">-</span>';
    const v2Badge = volumeV2 ? '<span class="text-orange-600 font-bold">V2</span>' : '<span class="text-gray-400">-</span>';
    
    // 信号样式
    const signalClass = k.signal && k.signal.startsWith('多头') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    
    // RSI 样式
    const getRSIClass = (rsi) => {
      if (!rsi) return 'text-gray-400';
      if (rsi > 70) return 'text-red-600 font-bold';
      if (rsi < 30) return 'text-green-600 font-bold';
      return 'text-gray-700';
    };
    
    // 通道状态样式
    const getChannelIcon = (state) => {
      if (!state) return '-';
      return state;
    };
    
    // 预警标记
    const alertBadge = hasAlert 
      ? `<span class="inline-block px-1 py-0.5 bg-yellow-500 text-white text-xs rounded font-bold ml-1" title="${hasAlert.triggers.join(', ')}">⚠️</span>`
      : '';

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs ${rowClass}">
        <td class="py-2 px-1 text-gray-700 sticky left-0 ${hasAlert ? 'bg-yellow-50' : 'bg-white'}">
          ${k.time || '-'}${alertBadge}
        </td>
        <td class="py-2 px-1 text-right font-mono">${k.open ? k.open.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-mono text-green-600">${k.high ? k.high.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-mono text-red-600">${k.low ? k.low.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-mono font-bold">${k.close ? k.close.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-bold ${changeClass}">${k.change || '-'}</td>
        <td class="py-2 px-1 text-right font-mono text-gray-600">${k.volume ? formatVolume(k.volume) : '-'}</td>
        <td class="py-2 px-1 text-center">${v1Badge}</td>
        <td class="py-2 px-1 text-center">${v2Badge}</td>
        <!-- 技术指标列（默认显示） -->
        <td class="py-2 px-1 text-center indicator-col">
          <span class="inline-block px-2 py-0.5 rounded ${signalClass} text-xs font-semibold">
            ${k.signal || '-'}
          </span>
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col">
          ${k.sar ? k.sar.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${k.sarChange ? (k.sarChange > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}">
          ${k.sarChange ? k.sarChange.toFixed(2) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${k.sarChangePercent ? (k.sarChangePercent > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold') : 'text-gray-400'}">
          ${k.sarChangePercent ? k.sarChangePercent.toFixed(2) + '%' : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${k['change-diff'] ? (k['change-diff'] > 0.1 ? 'text-orange-600 font-bold' : 'text-gray-600') : 'text-gray-400'}">
          ${k['change-diff'] !== undefined ? k['change-diff'].toFixed(2) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${getRSIClass(k.rsi_5min)}">
          ${k.rsi_5min ? k.rsi_5min.toFixed(2) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${getRSIClass(k.rsi_1h)}">
          ${k.rsi_1h ? k.rsi_1h.toFixed(2) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono text-blue-600 indicator-col">
          ${k.boll_mb ? k.boll_mb.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono text-gray-500 indicator-col">
          ${k.boll_ub ? k.boll_ub.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono text-gray-500 indicator-col">
          ${k.boll_lb ? k.boll_lb.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${
          (() => {
            const downRatio = k.down_channel_exhaustion_ratio || 0;
            const upRatio = k.up_channel_exhaustion_ratio || 0;
            if (downRatio > upRatio) {
              return 'bg-red-200 text-red-900 font-bold';
            }
            return 'text-gray-600';
          })()
        }">
          ${k.down_channel_exhaustion_ratio !== null && k.down_channel_exhaustion_ratio !== undefined ? k.down_channel_exhaustion_ratio.toFixed(2) + '%' : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${
          (() => {
            const downRatio = k.down_channel_exhaustion_ratio || 0;
            const upRatio = k.up_channel_exhaustion_ratio || 0;
            if (upRatio > downRatio) {
              return 'bg-green-200 text-green-900 font-bold';
            }
            return 'text-gray-600';
          })()
        }">
          ${k.up_channel_exhaustion_ratio !== null && k.up_channel_exhaustion_ratio !== undefined ? k.up_channel_exhaustion_ratio.toFixed(2) + '%' : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono text-purple-600 font-bold indicator-col">
          ${(k.boll_ub && k.boll_lb) ? (k.boll_ub - k.boll_lb).toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-center indicator-col">
          ${getChannelIcon(k.channel_state)}
        </td>
      </tr>
    `;
  }).join('');
}

// 显示预警统计
function displayAlertStats(alerts, telegramStatus) {
  if (!alerts || alerts.length === 0) {
    return;
  }
  
  // 统计触发条件
  const triggerStats = {};
  alerts.forEach(alert => {
    alert.triggers.forEach(trigger => {
      triggerStats[trigger] = (triggerStats[trigger] || 0) + 1;
    });
  });
  
  // Telegram发送状态
  let telegramStatusHtml = '';
  if (telegramStatus) {
    if (telegramStatus.skipped) {
      telegramStatusHtml = `
        <div class="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <i class="fas fa-info-circle mr-1"></i>
          Telegram通知已跳过
        </div>
      `;
    } else if (telegramStatus.sent > 0) {
      telegramStatusHtml = `
        <div class="mt-2 p-2 bg-green-100 rounded text-xs">
          <i class="fas fa-paper-plane mr-1 text-green-600"></i>
          <span class="text-green-800 font-semibold">已发送到Telegram: ${telegramStatus.sent}条预警</span>
          ${telegramStatus.failed > 0 ? `<span class="ml-2 text-red-600">(失败${telegramStatus.failed}条)</span>` : ''}
        </div>
      `;
    } else if (telegramStatus.failed > 0) {
      telegramStatusHtml = `
        <div class="mt-2 p-2 bg-red-100 rounded text-xs">
          <i class="fas fa-exclamation-circle mr-1 text-red-600"></i>
          <span class="text-red-800">Telegram发送失败: ${telegramStatus.failed}条</span>
        </div>
      `;
    }
  }
  
  const statsHtml = `
    <div class="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
      <h3 class="text-sm font-bold text-yellow-800 mb-2">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        预警统计（共${alerts.length}个预警点）
      </h3>
      <div class="grid grid-cols-3 gap-2 text-xs">
        ${Object.entries(triggerStats).map(([trigger, count]) => `
          <div class="bg-white p-2 rounded">
            <span class="text-gray-600">${trigger}:</span>
            <span class="font-bold text-yellow-700">${count}次</span>
          </div>
        `).join('')}
      </div>
      ${telegramStatusHtml}
    </div>
  `;
  
  const statsPanel = document.getElementById('statsPanel');
  const existingAlert = statsPanel.querySelector('.bg-yellow-50');
  if (existingAlert) {
    existingAlert.remove();
  }
  statsPanel.insertAdjacentHTML('beforeend', statsHtml);
}

// 切换指标列显示/隐藏
function toggleIndicatorColumns() {
  showIndicators = !showIndicators;
  const btn = document.getElementById('toggleIndicators');
  const indicatorCols = document.querySelectorAll('.indicator-col');
  
  if (showIndicators) {
    indicatorCols.forEach(col => col.classList.remove('hidden'));
    btn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>隐藏指标';
  } else {
    indicatorCols.forEach(col => col.classList.add('hidden'));
    btn.innerHTML = '<i class="fas fa-eye mr-1"></i>显示指标';
  }
}

// 同步 K线数据
async function syncKlineData() {
  const btn = document.getElementById('syncBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>同步中...';

  try {
    const response = await axios.post('/api/kline/sync', null, {
      params: {
        timeframe: currentTimeframe,
        limit: 300
      }
    });

    if (response.data.success) {
      alert('数据同步完成！');
      loadKlineData();
    }
  } catch (error) {
    alert('同步失败: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sync mr-2"></i>同步最新';
  }
}

// 同步48小时历史数据
async function sync48HoursData() {
  const btn = document.getElementById('sync48hBtn');
  const syncBtn = document.getElementById('syncBtn');
  
  // 禁用两个按钮
  btn.disabled = true;
  syncBtn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>同步中...';

  const confirmed = confirm(
    '即将补全所有29个币种的48小时数据（576根5分钟K线）\n' +
    '这可能需要3-5分钟，请耐心等待\n\n' +
    '是否继续？'
  );

  if (!confirmed) {
    btn.disabled = false;
    syncBtn.disabled = false;
    btn.innerHTML = '<i class="fas fa-database mr-2"></i>补全48小时';
    return;
  }

  try {
    showStatus('正在批量同步48小时数据，请稍候...', 'info');
    
    const response = await axios.post('/api/kline/sync48h/all');

    if (response.data.success) {
      const results = response.data.results;
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      let message = `数据同步完成！\n成功: ${successCount} 个币种\n失败: ${failCount} 个币种\n\n`;
      
      // 显示详细结果
      results.forEach(r => {
        if (r.success) {
          message += `✓ ${r.symbol}: ${r.count} 根K线\n`;
        } else {
          message += `✗ ${r.symbol}: ${r.error}\n`;
        }
      });
      
      alert(message);
      showStatus('48小时数据同步完成！', 'success');
      
      // 重新加载当前币种的数据
      loadKlineData();
    }
  } catch (error) {
    alert('同步失败: ' + error.message);
    showStatus('同步失败: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    syncBtn.disabled = false;
    btn.innerHTML = '<i class="fas fa-database mr-2"></i>补全48小时';
  }
}

// 格式化时间（简短）
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 格式化时间（完整）
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 格式化成交量
function formatVolume(volume) {
  // 确保volume是数字类型（可能是字符串）
  const vol = typeof volume === 'string' ? parseFloat(volume) : volume;
  
  if (isNaN(vol)) {
    return '-';
  }
  
  if (vol >= 1000000) {
    return (vol / 1000000).toFixed(2) + 'M';
  } else if (vol >= 1000) {
    return (vol / 1000).toFixed(2) + 'K';
  }
  return vol.toFixed(2);
}

// 显示加载状态
function showLoading() {
  const tbody = document.getElementById('klineTableBody');
  tbody.innerHTML = '<tr><td colspan="23" class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</td></tr>';
}

// 显示无数据
function showNoData() {
  const tbody = document.getElementById('klineTableBody');
  tbody.innerHTML = '<tr><td colspan="23" class="text-center py-8 text-gray-500">暂无数据，请点击"同步数据"按钮获取</td></tr>';
  document.getElementById('statsPanel').classList.add('hidden');
}

// 显示错误
function showError(message) {
  const tbody = document.getElementById('klineTableBody');
  tbody.innerHTML = `<tr><td colspan="23" class="text-center py-8 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>${message}</td></tr>`;
}
