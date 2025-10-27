// 全局状态
let allRounds = [];
let currentRoundData = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadRoundsList();
});

// 加载轮次列表
async function loadRoundsList() {
  try {
    const response = await axios.get('/api/history?limit=100');
    allRounds = response.data.rounds || [];
    renderRoundsList();
  } catch (error) {
    console.error('加载轮次列表失败:', error);
    document.getElementById('roundsList').innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fas fa-exclamation-triangle mb-2"></i>
        <p>加载失败: ${error.message}</p>
      </div>
    `;
  }
}

// 渲染轮次列表
function renderRoundsList() {
  const container = document.getElementById('roundsList');
  
  if (allRounds.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        暂无历史数据
      </div>
    `;
    return;
  }

  const html = allRounds.map((round, index) => {
    const time = new Date(round.round_time);
    const dateStr = time.toLocaleDateString('zh-CN');
    const timeStr = time.toLocaleTimeString('zh-CN');
    const greenRatio = round.green_ratio.toFixed(1);
    const trendClass = round.green_count > round.red_count ? 'text-green-600' : 'text-red-600';
    
    return `
      <div class="round-item p-3 border rounded-lg ${index === 0 ? 'active' : ''}" 
           onclick="loadRoundData('${round.round_time}', this)">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-sm">${dateStr}</span>
          <span class="${trendClass} font-bold">${greenRatio}%</span>
        </div>
        <div class="text-xs text-gray-500">${timeStr}</div>
        <div class="flex items-center justify-between mt-1 text-xs">
          <span class="text-green-600">↑${round.green_count}</span>
          <span class="text-red-600">↓${round.red_count}</span>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
  
  // 自动加载第一个轮次
  if (allRounds.length > 0) {
    loadRoundData(allRounds[0].round_time);
  }
}

// 加载指定轮次的数据
async function loadRoundData(roundTime, element) {
  try {
    // 更新选中状态
    if (element) {
      document.querySelectorAll('.round-item').forEach(el => el.classList.remove('active'));
      element.classList.add('active');
    }
    
    const response = await axios.get(`/api/history?round_time=${encodeURIComponent(roundTime)}`);
    currentRoundData = response.data;
    
    renderDashboard(currentRoundData);
  } catch (error) {
    console.error('加载轮次数据失败:', error);
    showError('加载数据失败: ' + error.message);
  }
}

// 渲染仪表板
function renderDashboard(data) {
  if (!data || !data.latestRound) return;
  
  renderStatsCards(data.latestRound);
  renderMarketTrend(data.todayStats);
  renderCoinTable(data.coinDetails, data.extremes, data.priorities);
}

// 渲染统计卡片
function renderStatsCards(latestRound) {
  const container = document.getElementById('statsCards');
  
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
      title: '风险警告',
      value: latestRound.risk_alert_count,
      icon: 'fa-exclamation-circle',
      color: latestRound.risk_alert_count > 0 ? 'red' : 'gray',
      detail: '全部下跌'
    }
  ];

  container.innerHTML = cards.map(card => `
    <div class="bg-white rounded-lg shadow-md p-4">
      <div class="flex items-center justify-between mb-2">
        <i class="fas ${card.icon} text-${card.color}-500 text-xl"></i>
        <span class="text-2xl font-bold text-${card.color}-600">${card.value}</span>
      </div>
      <div class="text-sm font-semibold text-gray-700">${card.title}</div>
      <div class="text-xs text-gray-500 mt-1">${card.detail}</div>
    </div>
  `).join('');
}

// 渲染市场趋势
function renderMarketTrend(todayStats) {
  const container = document.getElementById('trendContent');
  
  if (!todayStats || todayStats.length === 0) {
    container.innerHTML = '<p class="text-gray-500">当日统计数据不足</p>';
    return;
  }

  // 汇总统计
  const totalSurges = todayStats.reduce((sum, s) => sum + s.total_surges, 0);
  const totalCrashes = todayStats.reduce((sum, s) => sum + s.total_crashes, 0);
  const totalNewHighs = todayStats.reduce((sum, s) => sum + s.new_high_count, 0);
  const totalNewLows = todayStats.reduce((sum, s) => sum + s.new_low_count, 0);

  // 判断趋势
  let trendText = '无序震荡';
  let trendClass = 'text-gray-600';
  
  if (totalSurges >= 10 && (totalNewHighs - totalNewLows) >= 3) {
    trendText = '单边主升 ⭐⭐⭐';
    trendClass = 'text-green-600';
  } else if (totalSurges >= 10 && (totalNewHighs - totalNewLows) >= 1) {
    trendText = '震荡偏多 ⭐⭐';
    trendClass = 'text-green-600';
  } else if (totalCrashes >= 10 && (totalNewLows - totalNewHighs) >= 1) {
    trendText = '震荡偏空 ☆☆';
    trendClass = 'text-red-600';
  } else if (totalCrashes >= 10 && (totalNewLows - totalNewHighs) >= 3) {
    trendText = '单边主跌 ☆☆☆';
    trendClass = 'text-red-600';
  }

  container.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">${totalSurges}</div>
        <div class="text-sm text-gray-600">总急涨次数</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-red-600">${totalCrashes}</div>
        <div class="text-sm text-gray-600">总急跌次数</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">${totalNewHighs}</div>
        <div class="text-sm text-gray-600">创新高</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600">${totalNewLows}</div>
        <div class="text-sm text-gray-600">创新低</div>
      </div>
    </div>
    <div class="text-center py-4 border-t">
      <span class="text-lg font-semibold ${trendClass}">${trendText}</span>
    </div>
  `;
}

// 渲染币种表格
function renderCoinTable(coinDetails, extremes, priorities) {
  const tbody = document.getElementById('coinTableBody');
  
  if (!coinDetails || coinDetails.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          暂无数据
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = coinDetails.map((coin, index) => {
    const changeClass = coin.change_percent > 0 ? 'green-text' : 
                       coin.change_percent < 0 ? 'red-text' : '';
    const change24Class = coin.change_24h > 0 ? 'green-text' : 
                         coin.change_24h < 0 ? 'red-text' : '';
    
    return `
      <tr class="coin-row border-b text-xs">
        <td class="text-center py-2 px-1">${index + 1}</td>
        <td class="text-left py-2 px-1 font-semibold">${coin.symbol}</td>
        <td class="text-center py-2 px-1 ${changeClass}">
          ${coin.change_percent.toFixed(2)}%
        </td>
        <td class="text-right py-2 px-1">${coin.price.toFixed(6)}</td>
        <td class="text-right py-2 px-1 ${change24Class}">
          ${coin.change_24h.toFixed(2)}%
        </td>
        <td class="text-center py-2 px-1">${coin.rank_in_round}</td>
      </tr>
    `;
  }).join('');
}

// 显示错误
function showError(message) {
  const container = document.getElementById('trendContent');
  container.innerHTML = `
    <div class="text-center py-8 text-red-500">
      <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
      <p>${message}</p>
    </div>
  `;
}
