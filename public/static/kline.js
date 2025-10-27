// 全局状态
let currentSymbol = 'BTC';
let currentTimeframe = '5m';
let klineChart = null;
let allCoins = [];
let showIndicators = false;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadCoins();
  bindTimeframeButtons();
  document.getElementById('syncBtn').addEventListener('click', syncKlineData);
  document.getElementById('toggleIndicators').addEventListener('click', toggleIndicatorColumns);
});

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
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTimeframe = e.target.dataset.tf;
      loadKlineData();
    });
  });
}

// 加载 K线数据（带技术指标）
async function loadKlineData() {
  try {
    showLoading();
    
    // 获取带技术指标的 K线数据
    const response = await axios.get(`/api/kline/${currentSymbol}/indicators`, {
      params: {
        timeframe: currentTimeframe,
        limit: 300
      }
    });

    if (!response.data.success) {
      showError(response.data.error || '加载失败');
      return;
    }

    const result = response.data;
    const klineData = result.data;

    if (!klineData || klineData.length === 0) {
      showNoData();
      return;
    }

    // 渲染数据
    renderChart(klineData);
    renderTable(klineData);
    
    // 显示数据数量
    document.getElementById('statsPanel').classList.remove('hidden');

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

  // 准备数据
  const labels = data.map(k => formatTime(k.open_time));
  const prices = data.map(k => k.close);
  const volumes = data.map(k => k.volume);

  // 创建新图表
  klineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '价格',
          data: prices,
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
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '价格 (USD)'
          }
        }
      }
    }
  });
}

// 渲染表格
function renderTable(klineData) {
  const tbody = document.getElementById('klineTableBody');
  
  tbody.innerHTML = klineData.map((k) => {
    // 基础K线数据
    const changeClass = k.change && k.change.includes('+') ? 'text-green-600' : 'text-red-600';
    
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

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
        <td class="py-2 px-1 text-gray-700 sticky left-0 bg-white">${k.time || '-'}</td>
        <td class="py-2 px-1 text-right font-mono">${k.open ? k.open.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-mono text-green-600">${k.high ? k.high.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-mono text-red-600">${k.low ? k.low.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-mono font-bold">${k.close ? k.close.toFixed(4) : '-'}</td>
        <td class="py-2 px-1 text-right font-bold ${changeClass}">${k.change || '-'}</td>
        <td class="py-2 px-1 text-right font-mono text-gray-600">${k.volume ? formatVolume(k.volume) : '-'}</td>
        <!-- 技术指标列 -->
        <td class="py-2 px-1 text-center indicator-col ${showIndicators ? '' : 'hidden'}">
          <span class="inline-block px-2 py-0.5 rounded ${signalClass} text-xs font-semibold">
            ${k.signal || '-'}
          </span>
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${showIndicators ? '' : 'hidden'}">
          ${k.sar ? k.sar.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${showIndicators ? '' : 'hidden'} ${getRSIClass(k.rsi_5min)}">
          ${k.rsi_5min ? k.rsi_5min.toFixed(2) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono indicator-col ${showIndicators ? '' : 'hidden'} ${getRSIClass(k.rsi_1h)}">
          ${k.rsi_1h ? k.rsi_1h.toFixed(2) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono text-blue-600 indicator-col ${showIndicators ? '' : 'hidden'}">
          ${k.boll_mb ? k.boll_mb.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono text-gray-500 indicator-col ${showIndicators ? '' : 'hidden'}">
          ${k.boll_ub ? k.boll_ub.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-right font-mono text-gray-500 indicator-col ${showIndicators ? '' : 'hidden'}">
          ${k.boll_lb ? k.boll_lb.toFixed(4) : '-'}
        </td>
        <td class="py-2 px-1 text-center indicator-col ${showIndicators ? '' : 'hidden'}">
          ${getChannelIcon(k.channel_state)}
        </td>
      </tr>
    `;
  }).join('');
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
    btn.innerHTML = '<i class="fas fa-sync mr-2"></i>同步数据';
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
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(2) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(2) + 'K';
  }
  return volume.toFixed(2);
}

// 显示加载状态
function showLoading() {
  const tbody = document.getElementById('klineTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</td></tr>';
}

// 显示无数据
function showNoData() {
  const tbody = document.getElementById('klineTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">暂无数据，请点击"同步数据"按钮获取</td></tr>';
  document.getElementById('statsPanel').classList.add('hidden');
}

// 显示错误
function showError(message) {
  const tbody = document.getElementById('klineTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>${message}</td></tr>`;
}
