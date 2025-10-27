// 全局状态
let currentData = null;
let autoRefreshInterval = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  
  // 绑定执行分析按钮
  document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);
  
  // 启动自动刷新 (10分钟)
  startAutoRefresh();
});

// 加载仪表板数据
async function loadDashboard() {
  try {
    const response = await axios.get('/api/dashboard');
    currentData = response.data;
    renderDashboard(currentData);
  } catch (error) {
    console.error('加载数据失败:', error);
    showStatus('加载数据失败: ' + error.message, 'error');
  }
}

// 执行分析
async function runAnalysis() {
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析中...';
  
  try {
    showStatus('正在采集数据并分析...', 'info');
    const response = await axios.post('/api/analyze');
    
    if (response.data.success) {
      showStatus('分析完成!', 'success');
      // 延迟1秒后刷新数据
      setTimeout(loadDashboard, 1000);
    } else {
      showStatus('分析失败: ' + response.data.error, 'error');
    }
  } catch (error) {
    showStatus('分析失败: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-play mr-2"></i>执行分析';
  }
}

// 渲染仪表板
function renderDashboard(data) {
  renderStatsCards(data.latestRound);
  renderMarketTrend(data.todayStats);
  renderCoinTable(data.coinDetails, data.extremes, data.priorities);
}

// 渲染统计卡片
function renderStatsCards(latestRound) {
  const container = document.getElementById('statsCards');
  
  if (!latestRound) {
    container.innerHTML = '<div class="col-span-4 text-center text-gray-500 py-8">暂无统计数据</div>';
    return;
  }
  
  const cards = [
    {
      title: '绿色占比',
      value: latestRound.green_ratio.toFixed(1) + '%',
      icon: 'fa-chart-pie',
      color: 'green',
      detail: `上涨: ${latestRound.green_count} / 下跌: ${latestRound.red_count}`
    },
    {
      title: '急涨/急跌',
      value: `${latestRound.surge_count} / ${latestRound.crash_count}`,
      icon: 'fa-bolt',
      color: 'blue',
      detail: `涨≥1% / 跌≤-1%`
    },
    {
      title: '极端行情',
      value: `${latestRound.extreme_up_count} / ${latestRound.extreme_down_count}`,
      icon: 'fa-exclamation-triangle',
      color: 'yellow',
      detail: `涨≥4% / 跌≤-3%`
    },
    {
      title: '风险提示',
      value: latestRound.risk_alert_count,
      icon: 'fa-shield-alt',
      color: latestRound.risk_alert_count > 0 ? 'red' : 'gray',
      detail: latestRound.risk_alert_count > 0 ? '⚠️ 全部下跌，注意风险' : '市场正常'
    }
  ];
  
  container.innerHTML = cards.map(card => `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-gray-600 text-sm font-medium">${card.title}</h3>
        <i class="fas ${card.icon} text-${card.color}-500"></i>
      </div>
      <div class="text-2xl font-bold text-gray-800 mb-1">${card.value}</div>
      <div class="text-xs text-gray-500">${card.detail}</div>
    </div>
  `).join('');
}

// 渲染市场趋势
function renderMarketTrend(todayStats) {
  const container = document.getElementById('trendContent');
  
  if (!todayStats || todayStats.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-500 py-8">暂无趋势数据</div>';
    return;
  }
  
  // 计算全局趋势
  let totalSurges = 0;
  let totalCrashes = 0;
  let totalNewHighs = 0;
  let totalNewLows = 0;
  
  todayStats.forEach(stat => {
    totalSurges += stat.total_surges || 0;
    totalCrashes += stat.total_crashes || 0;
    totalNewHighs += stat.new_high_count || 0;
    totalNewLows += stat.new_low_count || 0;
  });
  
  // 确定趋势
  let trend = '无序震荡';
  let trendColor = 'gray';
  let stars = '';
  
  const highLowDiff = totalNewHighs - totalNewLows;
  const lowHighDiff = totalNewLows - totalNewHighs;
  
  if (totalSurges >= 10) {
    const diff = totalSurges - totalCrashes;
    const ratio = totalCrashes > 0 ? diff / totalCrashes : diff;
    
    if (highLowDiff >= 3) {
      trend = '单边主升';
      trendColor = 'green';
    } else if (highLowDiff >= 1) {
      trend = '震荡偏多';
      trendColor = 'green';
    }
    
    const starCount = ratio >= 3 ? 3 : (ratio >= 2 ? 2 : (ratio >= 1 ? 1 : 0));
    stars = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);
    
  } else if (totalCrashes >= 10) {
    const diff = totalCrashes - totalSurges;
    const ratio = totalSurges > 0 ? diff / totalSurges : diff;
    
    if (lowHighDiff >= 3) {
      trend = '单边主跌';
      trendColor = 'red';
    } else if (lowHighDiff >= 1) {
      trend = '震荡偏空';
      trendColor = 'red';
    }
    
    const starCount = ratio >= 3 ? 3 : (ratio >= 2 ? 2 : (ratio >= 1 ? 1 : 0));
    stars = '☆'.repeat(starCount) + '★'.repeat(3 - starCount);
  }
  
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="text-center">
        <h3 class="text-lg font-semibold mb-3 text-gray-700">今日市场状态</h3>
        <div class="inline-block px-6 py-3 rounded-lg bg-${trendColor}-100 border-2 border-${trendColor}-300">
          <span class="text-2xl font-bold text-${trendColor}-700">${trend}</span>
        </div>
        ${stars ? `<div class="mt-3 text-3xl">${stars}</div>` : ''}
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-green-50 rounded-lg p-4 text-center">
          <div class="text-sm text-gray-600 mb-1">今日急涨次数</div>
          <div class="text-3xl font-bold text-green-600">${totalSurges}</div>
        </div>
        <div class="bg-red-50 rounded-lg p-4 text-center">
          <div class="text-sm text-gray-600 mb-1">今日急跌次数</div>
          <div class="text-3xl font-bold text-red-600">${totalCrashes}</div>
        </div>
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <div class="text-sm text-gray-600 mb-1">创新高次数</div>
          <div class="text-3xl font-bold text-blue-600">${totalNewHighs}</div>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 text-center">
          <div class="text-sm text-gray-600 mb-1">创新低次数</div>
          <div class="text-3xl font-bold text-purple-600">${totalNewLows}</div>
        </div>
      </div>
    </div>
  `;
}

// 渲染币种表格
function renderCoinTable(coinDetails, extremes, priorities) {
  const tbody = document.getElementById('coinTableBody');
  
  if (!coinDetails || coinDetails.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-500">暂无币种数据</td></tr>';
    return;
  }
  
  tbody.innerHTML = coinDetails.map(coin => {
    const extreme = extremes.find(e => e.symbol === coin.symbol);
    const priority = priorities.find(p => p.symbol === coin.symbol);
    
    const highRatio = extreme ? ((coin.price / extreme.all_time_high) * 100).toFixed(2) : '-';
    const lowRatio = extreme ? ((coin.price / extreme.all_time_low) * 100).toFixed(2) : '-';
    
    const changeClass = coin.change_percent && coin.change_percent > 0 ? 'green-text' : (coin.change_percent && coin.change_percent < 0 ? 'red-text' : '');
    const change24hClass = coin.change_24h && coin.change_24h > 0 ? 'green-text' : (coin.change_24h && coin.change_24h < 0 ? 'red-text' : '');
    
    const levelBadge = priority ? `<span class="level-badge level-${priority.level}">等级${priority.level}</span>` : '-';
    
    let statusBadges = [];
    if (coin.is_surge) statusBadges.push('<span class="status-badge bg-green-100 text-green-700">急涨</span>');
    if (coin.is_crash) statusBadges.push('<span class="status-badge bg-red-100 text-red-700">急跌</span>');
    if (coin.is_extreme_up) statusBadges.push('<span class="status-badge bg-yellow-100 text-yellow-700">极涨</span>');
    if (coin.is_extreme_down) statusBadges.push('<span class="status-badge bg-orange-100 text-orange-700">极跌</span>');
    
    const statusText = statusBadges.length > 0 ? statusBadges.join(' ') : '-';
    
    return `
      <tr class="coin-row border-b border-gray-200">
        <td class="py-3 px-2 text-gray-700">${coin.rank_in_round}</td>
        <td class="py-3 px-2 font-semibold text-gray-800">${coin.symbol}</td>
        <td class="py-3 px-2 text-right font-mono">$${coin.price.toFixed(4)}</td>
        <td class="py-3 px-2 text-right ${changeClass}">
          ${coin.change_percent !== null ? (coin.change_percent > 0 ? '+' : '') + coin.change_percent.toFixed(2) + '%' : '-'}
        </td>
        <td class="py-3 px-2 text-right ${change24hClass}">
          ${coin.change_24h !== null ? (coin.change_24h > 0 ? '+' : '') + coin.change_24h.toFixed(2) + '%' : '-'}
        </td>
        <td class="py-3 px-2 text-right text-gray-700">${highRatio}%</td>
        <td class="py-3 px-2 text-right text-gray-700">${lowRatio}%</td>
        <td class="py-3 px-2 text-center">${levelBadge}</td>
        <td class="py-3 px-2 text-center">${statusText}</td>
      </tr>
    `;
  }).join('');
}

// 显示状态消息
function showStatus(message, type) {
  const el = document.getElementById('statusMessage');
  el.className = 'p-4 rounded-lg mb-4';
  
  if (type === 'success') {
    el.className += ' bg-green-100 text-green-800 border border-green-300';
    el.innerHTML = '<i class="fas fa-check-circle mr-2"></i>' + message;
  } else if (type === 'error') {
    el.className += ' bg-red-100 text-red-800 border border-red-300';
    el.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>' + message;
  } else if (type === 'info') {
    el.className += ' bg-blue-100 text-blue-800 border border-blue-300';
    el.innerHTML = '<i class="fas fa-info-circle mr-2"></i>' + message;
  }
  
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

// 启动自动刷新
function startAutoRefresh() {
  // 每10分钟自动执行分析
  autoRefreshInterval = setInterval(() => {
    console.log('自动执行分析...');
    runAnalysis();
  }, 10 * 60 * 1000); // 10分钟
  
  console.log('自动刷新已启动: 每10分钟执行一次');
}

// 停止自动刷新
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('自动刷新已停止');
  }
}
