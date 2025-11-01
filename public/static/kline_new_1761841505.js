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
  
  // 页面加载时先同步一次最新数据
  await syncLatestDataQuietly();
  
  // 启动自动刷新（30秒）
  startAutoRefresh();
});

// 启动自动刷新
function startAutoRefresh() {
  // 设置30秒自动刷新
  autoRefreshInterval = setInterval(async () => {
    // 先同步最新数据，再加载显示
    await syncLatestDataQuietly();
    loadKlineData();
    resetCountdown();
  }, 30000);
  
  // 启动倒计时显示
  startCountdown();
}

// 静默同步最新数据（不显示提示）
async function syncLatestDataQuietly() {
  try {
    // 调用自动同步API（同步所有币种的最新100根K线，并自动回填operation_tip）
    await axios.post('/api/kline/sync/auto');
    console.log('✅ 自动同步完成');
  } catch (error) {
    console.error('❌ 自动同步失败:', error);
  }
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
    const response = await axios.get('/api/coins/with-priority');
    allCoins = response.data;
    renderCoinSelector();
  } catch (error) {
    console.error('加载币种失败:', error);
    alert('加载币种列表失败: ' + error.message);
  }
}

// 渲染币种选择器（按等级分组）
function renderCoinSelector() {
  const container = document.getElementById('coinSelector');
  
  // 按等级分组
  const levelGroups = {
    1: { title: '⭐ 等级1 - TAO', coins: [] },
    2: { title: '⭐⭐ 等级2 - BNB/BCH', coins: [] },
    3: { title: '⭐⭐⭐ 等级3', coins: [] },
    4: { title: '⭐⭐⭐⭐ 等级4 - XRP', coins: [] },
    5: { title: '⭐⭐⭐⭐⭐ 等级5 - BTC', coins: [] },
    6: { title: '⭐⭐⭐⭐⭐⭐ 等级6 - ETH/SOL等', coins: [] }
  };
  
  // 分组币种
  allCoins.forEach(coin => {
    const level = coin.level || 6; // 默认等级6
    if (levelGroups[level]) {
      levelGroups[level].coins.push(coin);
    }
  });
  
  // 渲染分组
  let html = '';
  [1, 2, 4, 5, 3, 6].forEach(level => { // 按重要性排序：1,2,4,5,3,6
    const group = levelGroups[level];
    if (group.coins.length > 0) {
      html += `
        <div class="level-group">
          <div class="level-title level-${level}-title">${group.title} (${group.coins.length})</div>
          <div class="coin-grid">
            ${group.coins.map(coin => `
              <button 
                class="coin-btn px-4 py-2 rounded-lg border border-gray-300 font-semibold ${coin.symbol === currentSymbol ? 'active' : ''}"
                data-symbol="${coin.symbol}"
              >
                ${coin.symbol}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
  });
  
  container.innerHTML = html;

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
    
    // 获取带技术指标的 K线数据（72小时 = 864根5分钟K线）
    const klineResponse = await axios.get(`/api/kline/${currentSymbol}/indicators`, {
      params: {
        timeframe: currentTimeframe,
        limit: 864
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
    
    // 计算并显示当天统计
    calculateDailyStats(klineData);
    
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
  
  // 🐛 调试：函数开始执行
  console.log(`🔍 [renderTable] 开始渲染，数据量: ${klineData.length} 条`);
  if (klineData.length > 0) {
    console.log(`🔍 [renderTable] 第一条数据:`, klineData[0]);
  }
  
  // 创建预警索引映射（用于快速查找）
  const alertMap = {};
  alerts.forEach(alert => {
    alertMap[alert.index] = alert;
  });
  
  tbody.innerHTML = klineData.map((k, index) => {
    // 检查是否有预警
    const hasAlert = alertMap[k.index];
    
    // 计算向上20根K线的累计涨跌幅（向下看20行，从旧到新）
    // 表格从新到旧排列，向下看就是看过去的数据
    let cumulative20Change = 0;
    let hasEnoughData = false;
    
    if (index >= 20) {
      // 从当前行向上（向旧数据）回溯20根K线
      // index-20 到 index-1 是过去的20根K线
      for (let i = index - 20; i < index; i++) {
        const changeStr = klineData[i].change;
        if (changeStr) {
          const changeValue = parseFloat(changeStr);
          if (!isNaN(changeValue)) {
            cumulative20Change += changeValue;
          }
        }
      }
      hasEnoughData = true;
    }
    
    // 判断是否需要高亮（起涨 > 2% 或 起跌 < -3%）
    const isRisingPattern = hasEnoughData && cumulative20Change > 2;
    const isFallingPattern = hasEnoughData && cumulative20Change < -3;
    const needHighlight = isRisingPattern || isFallingPattern;
    
    // 行背景色和边框（预警优先，否则检查起涨起跌）
    let rowClass = '';
    if (hasAlert) {
      rowClass = 'bg-yellow-50 border-l-4 border-yellow-500';
    } else if (isRisingPattern) {
      rowClass = 'border-l-4 border-green-500 bg-green-50';
    } else if (isFallingPattern) {
      rowClass = 'border-l-4 border-red-500 bg-red-50';
    }
    
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
    
    // ✅ 高抛判断逻辑
    // 条件：1) 信号=多头  2) SAR变化%在增加（与上一根K线比较）  3) 涨跌幅<0.1%  4) 5分钟RSI>69
    // 🆕 使用数据库的operation_tip，根据不同类型显示不同颜色
    let operationTipDisplay = '';
    if (k.operation_tip) {
      let bgColor = 'bg-blue-500'; // 默认蓝色（注意启动）
      let title = k.operation_tip;
      
      if (k.operation_tip === '高抛') {
        bgColor = 'bg-orange-500'; // 橙色
        title = '高抛：多头信号+SAR变化%增加+涨跌幅<0.1%+RSI5分钟>69';
      } else if (k.operation_tip === '低吸') {
        bgColor = 'bg-green-600'; // 绿色
        title = '低吸：RSI 5分钟<25 且 成交量≥V1或V2';
      } else if (k.operation_tip === '波段高点') {
        bgColor = 'bg-purple-600'; // 紫色
        title = '波段高点：RSI>65 且 涨跌幅≤0.1% 且 成交量≥V2';
      } else if (k.operation_tip === '注意启动') {
        bgColor = 'bg-blue-500'; // 蓝色
        title = '注意启动：5根K线内有2个以上震荡收敛';
      }
      
      operationTipDisplay = `<span class="inline-block px-2 py-1 ${bgColor} text-white text-xs rounded font-bold" title="${title}">${k.operation_tip}</span>`;
    }
    
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

    // 累计涨跌幅标记（起涨/起跌点）
    const cumulativeBadge = hasEnoughData 
      ? `<span class="inline-block px-1 py-0.5 text-xs rounded ${
          isRisingPattern ? 'bg-green-600 text-white font-bold' : 
          isFallingPattern ? 'bg-red-600 text-white font-bold' : 
          'bg-gray-300 text-gray-700'
        }" title="过去20根K线累计涨跌幅（起涨/起跌点识别）">${cumulative20Change > 0 ? '+' : ''}${cumulative20Change.toFixed(2)}%</span>`
      : '-';
    
    // 🐛 调试日志：查看关键行的数据
    if (index < 3 || (index >= 20 && index < 23)) {
      console.log(`🔍 [Row ${index}] hasEnoughData=${hasEnoughData}, cumulative=${cumulative20Change.toFixed(2)}%, badge="${cumulativeBadge.substring(0, 50)}..."`);
    }

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs ${rowClass}">
        <td class="py-2 px-1 text-gray-700 sticky left-0 ${hasAlert ? 'bg-yellow-50' : needHighlight ? (isRisingPattern ? 'bg-green-50' : 'bg-red-50') : 'bg-white'}">
          ${k.time || '-'}${alertBadge}
        </td>
        <td class="py-2 px-3 text-center min-w-[80px] ${hasAlert ? 'bg-yellow-50' : needHighlight ? (isRisingPattern ? 'bg-green-50' : 'bg-red-50') : 'bg-blue-50'}">
          ${cumulativeBadge}
        </td>
        <td class="py-2 px-3 text-center min-w-[80px] ${hasAlert ? 'bg-yellow-50' : needHighlight ? (isRisingPattern ? 'bg-green-50' : 'bg-red-50') : 'bg-orange-50'}">
          ${operationTipDisplay || '-'}
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
  
  // 🐛 调试：表格渲染完成
  console.log(`✅ [renderTable] 表格渲染完成，生成了 ${klineData.length} 行HTML`);
}

// 计算当天统计
function calculateDailyStats(klineData) {
  // 获取当天日期（Asia/Shanghai时区）
  const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const [year, month, day] = today.split('/');
  const todayStr = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
  
  console.log('🔍 计算当天统计，目标日期:', todayStr);
  
  // 筛选当天数据（0:00-23:59）- 用于常规统计
  const todayData = klineData.filter(k => {
    if (!k.time) return false;
    return k.time.startsWith(todayStr);
  });
  
  console.log(`📊 当天数据条数: ${todayData.length} / 总数: ${klineData.length}`);
  
  // 如果当天数据不足20根，隐藏面板
  if (todayData.length < 20) {
    // document.getElementById('dailyStatsPanel').classList.add('hidden');
    console.log('⚠️ 当天数据不足20根，但统计面板始终显示');
    return;
  }
  
  let risingTriggers = 0;
  let fallingTriggers = 0;
  let currentRisingStreak = 0;
  let longestRisingStreak = 0;
  let longestRisingEndTime = null;
  let currentFallingStreak = 0;
  let longestFallingStreak = 0;
  let longestFallingEndTime = null;
  
  // 用于调试的累计涨跌幅数组
  const cumulativeChanges = [];
  
  // 遍历当天每个数据点
  todayData.forEach((k, index) => {
    // 计算累计20根涨跌幅（需要至少20根历史数据）
    if (index >= 20) {
      let cumulative = 0;
      for (let i = index - 20; i < index; i++) {
        const change = parseFloat(todayData[i].change);
        if (!isNaN(change)) {
          cumulative += change;
        }
      }
      
      // 记录累计涨跌幅（用于调试）
      cumulativeChanges.push({
        time: k.time,
        cumulative: cumulative.toFixed(2),
        isRising: cumulative > 2,
        isFalling: cumulative < -3
      });
      
      // 判断起涨点和起跌点
      if (cumulative > 2) risingTriggers++;
      if (cumulative < -3) fallingTriggers++;  // 起点线红交叉：跌计20圈 > -3%
    }
    
    // 检查上涨/下跌占比，计算连续上涨数和连续下跌数
    const upRatio = k.up_channel_exhaustion_ratio || 0;
    const downRatio = k.down_channel_exhaustion_ratio || 0;
    
    if (upRatio > downRatio) {
      // 连续上涨
      currentRisingStreak++;
      currentFallingStreak = 0;
      if (currentRisingStreak >= longestRisingStreak) {
        longestRisingStreak = currentRisingStreak;
        longestRisingEndTime = k.time;
      }
    } else if (downRatio > upRatio) {
      // 连续下跌
      currentFallingStreak++;
      currentRisingStreak = 0;
      if (currentFallingStreak >= longestFallingStreak) {
        longestFallingStreak = currentFallingStreak;
        longestFallingEndTime = k.time;
      }
    } else {
      // 相等时重置
      currentRisingStreak = 0;
      currentFallingStreak = 0;
    }
  });
  
  console.log('📈 统计结果:', { 
    risingTriggers, 
    fallingTriggers, 
    longestRisingStreak, 
    longestRisingEndTime,
    longestFallingStreak,
    longestFallingEndTime
  });
  
  // 🔍 调试信息：显示所有累计涨跌幅
  console.log('📊 累计涨跌幅详情（共' + cumulativeChanges.length + '个数据点）:');
  console.log('   最小值:', Math.min(...cumulativeChanges.map(c => parseFloat(c.cumulative))).toFixed(2) + '%');
  console.log('   最大值:', Math.max(...cumulativeChanges.map(c => parseFloat(c.cumulative))).toFixed(2) + '%');
  console.log('   起涨点(>2%):', cumulativeChanges.filter(c => c.isRising).length + '个');
  console.log('   起跌点(<-3%):', cumulativeChanges.filter(c => c.isFalling).length + '个');  // 起点线红交叉阈值-3%
  
  // 显示累计涨跌幅最小的5个时间点
  const sortedByValue = [...cumulativeChanges].sort((a, b) => parseFloat(a.cumulative) - parseFloat(b.cumulative));
  console.log('   📉 累计跌幅最大的5个时间点:');
  sortedByValue.slice(0, 5).forEach(item => {
    console.log(`      ${item.time}: ${item.cumulative}%`);
  });
  
  // 🆕 计算震荡收敛带宽均值（只找最近1个起涨点）
  // ✅ 按用户要求：1) 找最近1个起涨点  2) 往前找震荡收敛  3) 取区间内最小3个带宽  4) 计算平均
  let avgConvergenceBandwidth = null;
  let convergenceSegments = 0;
  
  const allData = klineData;  // 使用全部K线数据
  
  // ✅ 步骤1：找到离现在最近的一个起涨点（索引最小的，即最新的）
  let risingPointIndex = null;
  let risingPointTime = null;
  let risingCumulative = 0;
  
  for (let i = 0; i < allData.length - 20; i++) {
    let cumulative = 0;
    // 计算当前K线往后20根的累计涨跌幅
    for (let j = i; j < i + 20; j++) {
      const changeStr = allData[j].change || '0%';
      const change = parseFloat(changeStr.replace('%', ''));
      if (!isNaN(change)) {
        cumulative += change;
      }
    }
    
    if (cumulative > 2) {
      risingPointIndex = i;
      risingPointTime = allData[i].time;
      risingCumulative = cumulative;
      const timeStr = risingPointTime ? risingPointTime.substring(11, 16) : '未知';
      console.log(`🔍 找到最近起涨点: ${timeStr} (index=${i}, 累计涨幅=${cumulative.toFixed(2)}%)`);
      break;  // ✅ 只找第一个（最近的）就停止
    }
  }
  
  if (risingPointIndex === null) {
    console.log('⚠️ 没有找到起涨点（累计20根 > +2%）');
  } else {
    // ✅ 步骤2：从起涨点向前查找震荡收敛状态（向数组后方，即更早的数据）
    let convergenceIndex = null;
    let convergenceTime = null;
    
    for (let i = risingPointIndex + 1; i < allData.length; i++) {
      const k = allData[i];
      const channelState = k.channel_state || '';
      
      if (channelState.includes('震荡收敛')) {
        convergenceIndex = i;
        convergenceTime = k.time;
        const timeStr = convergenceTime ? convergenceTime.substring(11, 16) : '未知';
        console.log(`   ✓ 找到震荡收敛: ${timeStr} (index=${i}, 距离起涨点=${i - risingPointIndex}根K线)`);
        break;  // ✅ 找到第一个（最近的）就停止
      }
    }
    
    if (convergenceIndex === null) {
      const risingTimeStr = risingPointTime ? risingPointTime.substring(11, 16) : '未知';
      console.log(`   ✗ 起涨点 ${risingTimeStr} 往前未找到震荡收敛状态`);
    } else {
      // ✅ 步骤3：收集区间内的带宽值
      const risingTimeStr = risingPointTime ? risingPointTime.substring(11, 16) : '未知';
      const convergenceTimeStr = convergenceTime ? convergenceTime.substring(11, 16) : '未知';
      const rangeLength = convergenceIndex - risingPointIndex + 1;
      console.log(`   📐 收集区间带宽: [${risingTimeStr} (index=${risingPointIndex}) → ${convergenceTimeStr} (index=${convergenceIndex})], 共${rangeLength}根K线`);
      
      const segmentBandwidths = [];
      for (let j = risingPointIndex; j <= convergenceIndex; j++) {
        const k = allData[j];
        // 🔧 使用 boll_ub - boll_lb 计算带宽
        const bandwidth = (k.boll_ub && k.boll_lb) ? (k.boll_ub - k.boll_lb) : null;
        
        if (bandwidth !== null && bandwidth !== undefined && !isNaN(bandwidth)) {
          const timeStr = k.time ? k.time.substring(11, 16) : '未知';
          segmentBandwidths.push({
            index: j,
            time: timeStr,
            bandwidth: parseFloat(bandwidth)
          });
        }
      }
      
      console.log(`      收集到 ${segmentBandwidths.length} 个有效带宽值`);
      
      // ✅ 步骤4：取最小3个并计算平均值
      if (segmentBandwidths.length >= 3) {
        segmentBandwidths.sort((a, b) => a.bandwidth - b.bandwidth);
        const top3 = segmentBandwidths.slice(0, 3);
        
        console.log(`      带宽最小3个:`, top3.map(item => `${item.time}(${item.bandwidth.toFixed(4)})`).join(', '));
        
        const sum = top3[0].bandwidth + top3[1].bandwidth + top3[2].bandwidth;
        avgConvergenceBandwidth = (sum / 3).toFixed(4);  // ✅ 保留4位小数
        convergenceSegments = 1;
        
        console.log(`📊 震荡收敛带宽均值: ${avgConvergenceBandwidth}`);
        console.log(`   计算过程: (${top3[0].bandwidth.toFixed(4)} + ${top3[1].bandwidth.toFixed(4)} + ${top3[2].bandwidth.toFixed(4)}) / 3 = ${avgConvergenceBandwidth}`);
      } else {
        console.log(`      ⚠️ 区间只有 ${segmentBandwidths.length} 个有效带宽值，需要至少3个`);
      }
    }
  }
  
  // 更新UI
  document.getElementById('newHighCount').textContent = risingTriggers;
  document.getElementById('newLowCount').textContent = fallingTriggers;
  document.getElementById('fastUpperTouch').textContent = longestRisingStreak;
  document.getElementById('fastLowerTouch').textContent = longestFallingStreak;
  
  // 显示最长连续上涨的时间（检查元素是否存在）
  const risingTimeEl = document.getElementById('longestRisingTime');
  if (risingTimeEl) {
    if (longestRisingEndTime && longestRisingStreak > 0) {
      const timeStr = longestRisingEndTime.substring(11, 16);
      risingTimeEl.textContent = `结束于 ${timeStr}`;
    } else {
      risingTimeEl.textContent = '-';
    }
  }
  
  // 显示最长连续下跌的时间（检查元素是否存在）
  const fallingTimeEl = document.getElementById('longestFallingTime');
  if (fallingTimeEl) {
    if (longestFallingEndTime && longestFallingStreak > 0) {
      const timeStr = longestFallingEndTime.substring(11, 16);
      fallingTimeEl.textContent = `结束于 ${timeStr}`;
    } else {
      fallingTimeEl.textContent = '-';
    }
  }
  
  // 🆕 显示震荡收敛带宽均值
  const convergenceBandwidthEl = document.getElementById('convergenceBandwidth');
  const convergenceCountEl = document.getElementById('convergenceCount');
  
  if (convergenceBandwidthEl) {
    if (avgConvergenceBandwidth !== null) {
      convergenceBandwidthEl.textContent = avgConvergenceBandwidth;
    } else {
      convergenceBandwidthEl.textContent = '-';
    }
  }
  
  if (convergenceCountEl) {
    if (avgConvergenceBandwidth !== null) {
      convergenceCountEl.textContent = `${convergenceSegments}个区间`;
    } else {
      convergenceCountEl.textContent = '无数据';
    }
  }
  
  // document.getElementById('dailyStatsPanel').classList.remove('hidden');
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
        limit: 864
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
