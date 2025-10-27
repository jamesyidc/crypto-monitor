// 全局状态
let currentSymbol = 'BTC';
let currentTimeframe = '15m';
let klineChart = null;
let allCoins = [];

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadCoins();
  bindTimeframeButtons();
  document.getElementById('syncBtn').addEventListener('click', syncKlineData);
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

// 加载 K线数据
async function loadKlineData() {
  try {
    showLoading();
    
    // 获取 K线数据
    const response = await axios.get(`/api/kline/${currentSymbol}`, {
      params: {
        timeframe: currentTimeframe,
        limit: 100
      }
    });

    const klineData = response.data;

    if (!klineData || klineData.length === 0) {
      showNoData();
      return;
    }

    // 获取统计信息
    const statsResponse = await axios.get(`/api/kline/${currentSymbol}/stats`, {
      params: {
        timeframe: currentTimeframe,
        limit: 100
      }
    });

    const stats = statsResponse.data;

    // 渲染数据
    renderStats(stats);
    renderChart(klineData);
    renderTable(klineData);

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
  
  tbody.innerHTML = klineData.map((k, index) => {
    const prevClose = index < klineData.length - 1 ? klineData[index + 1].close : k.open;
    const change = ((k.close - prevClose) / prevClose) * 100;
    const changeClass = change > 0 ? 'text-green-600' : (change < 0 ? 'text-red-600' : 'text-gray-600');

    return `
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="py-3 px-2 text-gray-700">${formatDateTime(k.open_time)}</td>
        <td class="py-3 px-2 text-right font-mono">${k.open.toFixed(4)}</td>
        <td class="py-3 px-2 text-right font-mono text-green-600">${k.high.toFixed(4)}</td>
        <td class="py-3 px-2 text-right font-mono text-red-600">${k.low.toFixed(4)}</td>
        <td class="py-3 px-2 text-right font-mono font-bold">${k.close.toFixed(4)}</td>
        <td class="py-3 px-2 text-right font-bold ${changeClass}">
          ${change > 0 ? '+' : ''}${change.toFixed(2)}%
        </td>
        <td class="py-3 px-2 text-right font-mono text-gray-600">${formatVolume(k.volume)}</td>
      </tr>
    `;
  }).join('');
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
