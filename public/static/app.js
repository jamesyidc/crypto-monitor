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
  renderSurgeStats(data.latestRound, data.todayStats);
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

// 渲染急涨急跌统计
function renderSurgeStats(latestRound, todayStats) {
  // 本轮急涨急跌
  const currentSurge = latestRound ? latestRound.surge_count : 0;
  const currentCrash = latestRound ? latestRound.crash_count : 0;
  
  // 总急涨急跌
  let totalSurge = 0;
  let totalCrash = 0;
  
  if (todayStats && Array.isArray(todayStats)) {
    todayStats.forEach(stat => {
      totalSurge += stat.surge_count || 0;
      totalCrash += stat.crash_count || 0;
    });
  }
  
  // 差值和比值
  const surgeDiff = totalSurge - totalCrash;
  const surgeRatio = totalCrash > 0 ? (totalSurge / totalCrash).toFixed(2) : (totalSurge > 0 ? '∞' : '-');
  
  // 更新DOM
  document.getElementById('currentSurge').textContent = currentSurge;
  document.getElementById('currentCrash').textContent = currentCrash;
  document.getElementById('totalSurge').textContent = totalSurge;
  document.getElementById('totalCrash').textContent = totalCrash;
  document.getElementById('surgeDiff').textContent = surgeDiff >= 0 ? `+${surgeDiff}` : surgeDiff;
  document.getElementById('surgeRatio').textContent = surgeRatio;
}

// 渲染币种表格
function renderCoinTable(coinDetails, extremes, priorities) {
  const tbody = document.getElementById('coinTableBody');
  
  if (!coinDetails || coinDetails.length === 0) {
    tbody.innerHTML = '<tr><td colspan="17" class="text-center py-8 text-gray-500">暂无币种数据</td></tr>';
    return;
  }
  
  tbody.innerHTML = coinDetails.map((coin, index) => {
    const extreme = extremes.find(e => e.symbol === coin.symbol);
    const priority = priorities.find(p => p.symbol === coin.symbol);
    
    const highRatio = extreme ? ((coin.price / extreme.all_time_high) * 100).toFixed(2) : '-';
    const lowRatio = extreme ? ((coin.price / extreme.all_time_low) * 100).toFixed(2) : '-';
    
    // 序号
    const sequenceNum = index + 1;
    
    // 涨跌指示器
    let changeIndicator = '<span class="text-gray-400">-</span>';
    if (coin.is_surge) {
      changeIndicator = '<span class="text-green-600 font-bold">↑</span>';
    } else if (coin.is_crash) {
      changeIndicator = '<span class="text-red-600 font-bold">↓</span>';
    }
    
    // 急涨 - 根据 is_surge 显示背景色
    const surgeCell = coin.is_surge 
      ? '<span class="inline-block w-full py-1 px-2 bg-green-100 text-green-700 font-bold rounded">涨</span>'
      : '<span class="text-gray-300">-</span>';
    
    // 急跌 - 根据 is_crash 显示背景色
    const crashCell = coin.is_crash
      ? '<span class="inline-block w-full py-1 px-2 bg-red-100 text-red-700 font-bold rounded">跌</span>'
      : '<span class="text-gray-300">-</span>';
    
    // 更新时间
    const updateTime = new Date(coin.round_time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 历史高价和时间
    const athPrice = extreme ? `$${extreme.all_time_high.toFixed(6)}` : '-';
    const athTime = extreme && extreme.ath_date 
      ? new Date(extreme.ath_date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      : '-';
    
    // 涨幅 (当前价格相对ATH的涨幅，实际上是跌幅)
    let gainPercent = '-';
    if (extreme && extreme.all_time_high) {
      const change = ((coin.price - extreme.all_time_high) / extreme.all_time_high * 100);
      const changeClass = change >= 0 ? 'text-green-600' : 'text-red-600';
      gainPercent = `<span class="${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>`;
    }
    
    // 24小时涨跌幅
    const change24h = coin.change_24h || 0;
    const change24hClass = change24h >= 0 ? 'text-green-600' : 'text-red-600';
    const change24hDisplay = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
    
    // ++ (创新高次数)
    const newHighCount = extreme ? extreme.new_high_count : 0;
    const newHighDisplay = newHighCount > 0 
      ? `<span class="text-green-600 font-bold">${newHighCount}</span>`
      : '<span class="text-gray-400">0</span>';
    
    // -- (创新低次数)
    const newLowCount = extreme ? extreme.new_low_count : 0;
    const newLowDisplay = newLowCount > 0
      ? `<span class="text-red-600 font-bold">${newLowCount}</span>`
      : '<span class="text-gray-400">0</span>';
    
    // 排行 (优先级)
    let ranking = '-';
    if (priority) {
      const colors = {
        1: 'bg-red-500',
        2: 'bg-orange-500',
        3: 'bg-yellow-500',
        4: 'bg-blue-500',
        5: 'bg-green-500',
        6: 'bg-gray-500'
      };
      ranking = `<span class="inline-block px-2 py-1 ${colors[priority.level]} text-white text-xs rounded font-bold">${priority.level}</span>`;
    }
    
    // 异动 - 综合显示各种异常状态
    let abnormalBadges = [];
    if (coin.is_surge) {
      abnormalBadges.push('<span class="inline-block px-1 py-0.5 bg-green-500 text-white text-xs rounded mr-1">急涨</span>');
    }
    if (coin.is_crash) {
      abnormalBadges.push('<span class="inline-block px-1 py-0.5 bg-red-500 text-white text-xs rounded mr-1">急跌</span>');
    }
    if (coin.is_extreme_up) {
      abnormalBadges.push('<span class="inline-block px-1 py-0.5 bg-green-700 text-white text-xs rounded mr-1">极涨</span>');
    }
    if (coin.is_extreme_down) {
      abnormalBadges.push('<span class="inline-block px-1 py-0.5 bg-red-700 text-white text-xs rounded mr-1">极跌</span>');
    }
    if (coin.is_new_high) {
      abnormalBadges.push('<span class="inline-block px-1 py-0.5 bg-yellow-500 text-white text-xs rounded mr-1">新高</span>');
    }
    if (coin.is_new_low) {
      abnormalBadges.push('<span class="inline-block px-1 py-0.5 bg-gray-600 text-white text-xs rounded mr-1">新低</span>');
    }
    const abnormalCell = abnormalBadges.length > 0 ? abnormalBadges.join('') : '<span class="text-gray-400">-</span>';
    
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td class="text-center py-2 px-1 text-gray-600 text-xs">${sequenceNum}</td>
        <td class="text-left py-2 px-1 font-semibold text-gray-800 text-sm">${coin.symbol}</td>
        <td class="text-center py-2 px-1">${changeIndicator}</td>
        <td class="text-center py-2 px-1">${surgeCell}</td>
        <td class="text-center py-2 px-1">${crashCell}</td>
        <td class="text-right py-2 px-1 text-xs text-gray-600">${updateTime}</td>
        <td class="text-right py-2 px-1 font-mono text-xs text-gray-700">${athPrice}</td>
        <td class="text-right py-2 px-1 text-xs text-gray-600">${athTime}</td>
        <td class="text-right py-2 px-1 text-xs">${gainPercent}</td>
        <td class="text-right py-2 px-1 font-mono text-xs ${change24hClass}">${change24hDisplay}</td>
        <td class="text-center py-2 px-1 text-xs">${newHighDisplay}</td>
        <td class="text-center py-2 px-1 text-xs">${newLowDisplay}</td>
        <td class="text-center py-2 px-1">${ranking}</td>
        <td class="text-right py-2 px-1 font-mono text-sm font-semibold text-gray-800">$${coin.price.toFixed(6)}</td>
        <td class="text-right py-2 px-1 text-xs text-gray-600">${highRatio}%</td>
        <td class="text-right py-2 px-1 text-xs text-gray-600">${lowRatio}%</td>
        <td class="text-center py-2 px-1 text-xs">${abnormalCell}</td>
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
