// 全局状态
let accounts = [];
let currentAccount = null;
let currentPositions = [];
let tradeHistory = [];
let autoRefreshInterval = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadAccounts();
  
  // 绑定按钮事件
  document.getElementById('createAccountBtn').addEventListener('click', openCreateAccountModal);
  document.getElementById('createAccountForm').addEventListener('submit', createAccount);
  document.getElementById('manualTradeForm').addEventListener('submit', executeManualTrade);
  document.getElementById('autoTradeBtn').addEventListener('click', executeAutoTrade);
  document.getElementById('refreshDataBtn').addEventListener('click', refreshAccountData);
  document.getElementById('pauseAccountBtn').addEventListener('click', toggleAccountStatus);
  document.getElementById('backtestBtn').addEventListener('click', executeBacktest);
  document.getElementById('backtestForm').addEventListener('submit', runBacktest);
});

// 加载所有账户
async function loadAccounts() {
  try {
    const response = await axios.get('/api/simulated/accounts');
    accounts = response.data.accounts || [];
    renderAccounts();
    
    // 如果有账户，默认选择第一个
    if (accounts.length > 0 && !currentAccount) {
      selectAccount(accounts[0].id);
    }
  } catch (error) {
    console.error('加载账户失败:', error);
    showStatus('加载账户失败: ' + error.message, 'error');
  }
}

// 渲染账户列表
function renderAccounts() {
  const container = document.getElementById('accountsList');
  
  if (accounts.length === 0) {
    container.innerHTML = `
      <div class="col-span-3 text-center py-8 text-gray-500">
        <i class="fas fa-inbox text-4xl mb-2"></i>
        <p>还没有账户，点击"创建账户"开始</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = accounts.map(account => {
    const statusClass = `status-${account.status.toLowerCase()}`;
    const isSelected = currentAccount && currentAccount.id === account.id;
    const borderClass = isSelected ? 'border-4 border-blue-500' : 'border border-gray-200';
    
    return `
      <div onclick="selectAccount(${account.id})" 
           class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition ${borderClass}">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-bold text-gray-800">${account.account_name}</h3>
          <span class="text-xs px-2 py-1 rounded-full ${statusClass}">
            ${account.status}
          </span>
        </div>
        <div class="text-sm text-gray-600 space-y-1">
          <div class="flex justify-between">
            <span>余额:</span>
            <span class="font-bold">$${account.current_balance.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>杠杆:</span>
            <span>${account.leverage}x</span>
          </div>
          <div class="flex justify-between">
            <span>费率:</span>
            <span>${(account.trading_fee_rate * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 选择账户
async function selectAccount(accountId) {
  try {
    showStatus('加载账户数据...', 'info');
    
    // 获取账户详情
    const response = await axios.get(`/api/simulated/accounts/${accountId}`);
    currentAccount = response.data.account;
    
    // 显示账户详情区域
    document.getElementById('accountDetails').classList.remove('hidden');
    
    // 更新统计卡片
    updateAccountStats();
    
    // 加载持仓和历史
    await loadPositions();
    await loadHistory();
    
    // 重新渲染账户列表以更新选中状态
    renderAccounts();
    
    showStatus('账户数据加载成功', 'success');
    setTimeout(() => {
      document.getElementById('statusMessage').classList.add('hidden');
    }, 2000);
    
    // 启动自动刷新
    startAutoRefresh();
  } catch (error) {
    console.error('加载账户失败:', error);
    showStatus('加载失败: ' + error.message, 'error');
  }
}

// 更新账户统计
function updateAccountStats() {
  if (!currentAccount) return;
  
  const stats = currentAccount.stats;
  const profitLoss = stats.total_profit_loss || 0;
  const profitPercent = currentAccount.initial_balance > 0 
    ? (profitLoss / currentAccount.initial_balance * 100) 
    : 0;
  
  document.getElementById('statBalance').textContent = `$${currentAccount.current_balance.toFixed(2)}`;
  document.getElementById('statBalanceChange').textContent = 
    `初始: $${currentAccount.initial_balance.toFixed(2)}`;
  
  const profitClass = profitLoss >= 0 ? 'profit' : 'loss';
  document.getElementById('statProfitLoss').className = `text-2xl font-bold ${profitClass}`;
  document.getElementById('statProfitLoss').textContent = 
    `${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}`;
  document.getElementById('statProfitPercent').className = `text-xs mt-1 ${profitClass}`;
  document.getElementById('statProfitPercent').textContent = 
    `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`;
  
  document.getElementById('statTotalTrades').textContent = stats.total_trades || 0;
  document.getElementById('statWinRate').textContent = `胜率: ${stats.win_rate || 0}%`;
  
  document.getElementById('statLeverage').textContent = `${currentAccount.leverage}x`;
  document.getElementById('statFeeRate').textContent = 
    `费率: ${(currentAccount.trading_fee_rate * 100).toFixed(2)}%`;
  
  // 更新按钮文本
  const pauseBtn = document.getElementById('pauseAccountBtn');
  if (currentAccount.status === 'ACTIVE') {
    pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>暂停';
    pauseBtn.className = 'bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition';
  } else {
    pauseBtn.innerHTML = '<i class="fas fa-play mr-2"></i>启动';
    pauseBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition';
  }
}

// 加载持仓
async function loadPositions() {
  if (!currentAccount) return;
  
  try {
    const response = await axios.get(`/api/simulated/accounts/${currentAccount.id}/positions`);
    currentPositions = response.data.positions || [];
    renderPositions();
  } catch (error) {
    console.error('加载持仓失败:', error);
  }
}

// 渲染持仓列表
function renderPositions() {
  const tbody = document.getElementById('positionsTable');
  
  if (currentPositions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-gray-500">
          暂无持仓
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = currentPositions.map(pos => {
    const directionBadge = pos.position_type === 'LONG'
      ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">多单</span>'
      : '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">空单</span>';
    
    const entryTime = new Date(pos.entry_time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <tr class="trade-row">
        <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${pos.symbol}</td>
        <td class="px-6 py-4 whitespace-nowrap">${directionBadge}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">$${pos.entry_price.toFixed(4)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">${pos.quantity.toFixed(4)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">${pos.leverage}x</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">$${pos.fee.toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">${entryTime}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <button onclick="closeTrade(${pos.id})" class="text-blue-600 hover:text-blue-800">
            <i class="fas fa-times-circle mr-1"></i>平仓
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 加载交易历史
async function loadHistory() {
  if (!currentAccount) return;
  
  try {
    const response = await axios.get(`/api/simulated/accounts/${currentAccount.id}/history?limit=50`);
    tradeHistory = response.data.history || [];
    renderHistory();
  } catch (error) {
    console.error('加载历史失败:', error);
  }
}

// 渲染交易历史
function renderHistory() {
  const tbody = document.getElementById('historyTable');
  
  if (tradeHistory.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-gray-500">
          暂无交易历史
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = tradeHistory.map(trade => {
    const directionBadge = trade.position_type === 'LONG'
      ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">多</span>'
      : '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">空</span>';
    
    const profitClass = trade.profit_loss >= 0 ? 'profit' : 'loss';
    const profitSign = trade.profit_loss >= 0 ? '+' : '';
    
    const statusBadge = trade.status === 'CLOSED'
      ? '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">已平仓</span>'
      : '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">持仓中</span>';
    
    const entryTime = new Date(trade.entry_time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <tr class="trade-row">
        <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${trade.symbol}</td>
        <td class="px-6 py-4 whitespace-nowrap">${directionBadge}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">$${trade.entry_price.toFixed(4)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">
          ${trade.exit_price ? '$' + trade.exit_price.toFixed(4) : '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap ${profitClass}">
          ${trade.profit_loss ? profitSign + '$' + trade.profit_loss.toFixed(2) : '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap ${profitClass}">
          ${trade.profit_loss_percent ? profitSign + trade.profit_loss_percent.toFixed(2) + '%' : '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">${entryTime}</td>
      </tr>
    `;
  }).join('');
}

// 创建账户
async function createAccount(e) {
  e.preventDefault();
  
  const accountData = {
    account_name: document.getElementById('accountName').value.trim(),
    initial_balance: parseFloat(document.getElementById('initialBalance').value),
    leverage: parseFloat(document.getElementById('leverage').value),
    trading_fee_rate: parseFloat(document.getElementById('tradingFeeRate').value)
  };
  
  try {
    await axios.post('/api/simulated/accounts', accountData);
    showStatus('账户创建成功！', 'success');
    closeCreateAccountModal();
    loadAccounts();
  } catch (error) {
    showStatus('创建失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 手动交易
async function executeManualTrade(e) {
  e.preventDefault();
  
  if (!currentAccount) {
    showStatus('请先选择账户', 'error');
    return;
  }
  
  const tradeData = {
    account_id: currentAccount.id,
    symbol: document.getElementById('tradeSymbol').value.trim().toUpperCase(),
    position_type: document.getElementById('tradeDirection').value,
    entry_price: parseFloat(document.getElementById('tradePrice').value),
    quantity: parseFloat(document.getElementById('tradeQuantity').value),
    signal_source: 'MANUAL',
    notes: '手动交易'
  };
  
  try {
    showStatus('执行交易中...', 'info');
    await axios.post('/api/simulated/trades/open', tradeData);
    showStatus('交易执行成功！', 'success');
    closeManualTradeModal();
    refreshAccountData();
  } catch (error) {
    showStatus('交易失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 平仓
async function closeTrade(tradeId) {
  const exitPrice = prompt('请输入平仓价格:');
  if (!exitPrice) return;
  
  try {
    showStatus('平仓中...', 'info');
    const response = await axios.post(`/api/simulated/trades/${tradeId}/close`, {
      exit_price: parseFloat(exitPrice)
    });
    
    const result = response.data.data;
    const profitText = result.profitLoss >= 0 ? `盈利 $${result.profitLoss.toFixed(2)}` : `亏损 $${Math.abs(result.profitLoss).toFixed(2)}`;
    showStatus(`平仓成功！${profitText} (${result.profitLossPercent.toFixed(2)}%)`, 'success');
    refreshAccountData();
  } catch (error) {
    showStatus('平仓失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 自动交易
async function executeAutoTrade() {
  if (!currentAccount) {
    showStatus('请先选择账户', 'error');
    return;
  }
  
  if (currentAccount.status !== 'ACTIVE') {
    showStatus('账户未激活，无法执行自动交易', 'error');
    return;
  }
  
  if (!confirm('确认执行自动交易？系统将根据当前信号自动开平仓。')) {
    return;
  }
  
  try {
    showStatus('正在执行自动交易...', 'info');
    const response = await axios.post('/api/simulated/auto-trade-all', {
      account_id: currentAccount.id,
      strategy_id: 1 // 使用SAR信号策略
    });
    
    const trades = response.data.trades || [];
    showStatus(`自动交易完成！处理了 ${trades.length} 个交易信号`, 'success');
    refreshAccountData();
  } catch (error) {
    showStatus('自动交易失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 切换账户状态
async function toggleAccountStatus() {
  if (!currentAccount) return;
  
  const newStatus = currentAccount.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  
  try {
    await axios.put(`/api/simulated/accounts/${currentAccount.id}/status`, {
      status: newStatus
    });
    currentAccount.status = newStatus;
    updateAccountStats();
    renderAccounts();
    showStatus(`账户已${newStatus === 'ACTIVE' ? '启动' : '暂停'}`, 'success');
  } catch (error) {
    showStatus('操作失败: ' + error.message, 'error');
  }
}

// 刷新账户数据
async function refreshAccountData() {
  if (currentAccount) {
    await selectAccount(currentAccount.id);
  }
}

// 启动自动刷新（30秒）
function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    if (currentAccount) {
      refreshAccountData();
    }
  }, 30000);
}

// 模态框控制
function openCreateAccountModal() {
  document.getElementById('createAccountModal').classList.remove('hidden');
}

function closeCreateAccountModal() {
  document.getElementById('createAccountModal').classList.add('hidden');
  document.getElementById('createAccountForm').reset();
}

function openManualTradeModal() {
  document.getElementById('manualTradeModal').classList.remove('hidden');
}

function closeManualTradeModal() {
  document.getElementById('manualTradeModal').classList.add('hidden');
  document.getElementById('manualTradeForm').reset();
}

// 显示状态消息
function showStatus(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  const colors = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };
  
  statusDiv.className = `border-l-4 p-4 rounded ${colors[type]}`;
  statusDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${icons[type]} mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  statusDiv.classList.remove('hidden');
}

// 绑定手动交易按钮
document.getElementById('manualTradeBtn').addEventListener('click', openManualTradeModal);

// 波段交易回测
function executeBacktest() {
  if (!currentAccount) {
    showStatus('请先选择账户以查看回测结果', 'error');
    return;
  }
  openBacktestModal();
}

// 打开回测模态框
function openBacktestModal() {
  document.getElementById('backtestModal').classList.remove('hidden');
}

// 关闭回测模态框
function closeBacktestModal() {
  document.getElementById('backtestModal').classList.add('hidden');
  document.getElementById('backtestForm').reset();
}

// 运行回测
async function runBacktest(e) {
  e.preventDefault();
  
  const symbol = document.getElementById('backtestSymbol').value;
  const timeframe = document.getElementById('backtestTimeframe').value;
  const limit = parseInt(document.getElementById('backtestLimit').value);
  
  // 收集策略选择
  const strategies = Array.from(document.querySelectorAll('input[name="strategy"]:checked'))
    .map(el => el.value);
  
  if (strategies.length === 0) {
    showStatus('请至少选择一个交易策略', 'error');
    return;
  }
  
  // 收集币种等级筛选
  const coinLevels = Array.from(document.querySelectorAll('input[name="coin_level"]:checked'))
    .map(el => parseInt(el.value));
  
  // 收集其他配置
  const leverage = parseInt(document.getElementById('backtestLeverage').value);
  const positionDivisions = parseInt(document.getElementById('backtestPositionDivisions').value);
  const stopLoss = parseFloat(document.getElementById('backtestStopLoss').value);
  
  // 计算每份金额：100,000 / 份数
  const positionSizeFixed = 100000 / positionDivisions;
  
  // 构建配置对象
  const config = {
    timeframe,
    limit,
    strategies,
    coinLevels: coinLevels.length > 0 ? coinLevels : null, // null表示全部等级
    leverage,
    positionSizeFixed, // 固定每份金额（例如：10份 = 每份$10,000）
    stopLoss: stopLoss === 0 ? null : stopLoss / 100 // 转换为小数，0表示不止损
  };
  
  console.log('回测配置:', config);
  
  closeBacktestModal();
  
  if (symbol === 'ALL') {
    // 回测所有交易对
    await runBatchBacktest(config);
  } else {
    // 回测单个交易对
    await runSingleBacktest(symbol, config);
  }
}

// 单个交易对回测
async function runSingleBacktest(symbol, config) {
  try {
    showStatus('正在运行回测...', 'info');
    
    // 去掉USDT后缀，因为后端数据库存储的是BTC、ETH等格式
    const cleanSymbol = symbol.replace('USDT', '');
    
    const response = await axios.post('/api/backtest/convergence-trading', {
      symbol: cleanSymbol,
      timeframe: config.timeframe,
      limit: config.limit,
      strategies: config.strategies,
      leverage: config.leverage,
      positionSizeFixed: config.positionSizeFixed,
      stopLoss: config.stopLoss
    });
    
    if (response.data.success) {
      displayBacktestResults(response.data);
      showStatus('回测完成！', 'success');
    } else {
      showStatus('回测失败: ' + response.data.error, 'error');
    }
  } catch (error) {
    console.error('回测失败:', error);
    showStatus('回测失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 批量回测所有交易对
async function runBatchBacktest(config) {
  // 原始symbol列表（带USDT）- 带等级信息
  const symbolsWithLevels = {
    'TAOUSDT': 1,      // 1级
    'BNBUSDT': 2, 'BCHUSDT': 2,  // 2级
    'XRPUSDT': 4,      // 4级
    'BTCUSDT': 5,      // 5级
    // 6级（默认）
    'AAVEUSDT': 6, 'ADAUSDT': 6, 'APTUSDT': 6, 'CFXUSDT': 6, 'CROUSDT': 6,
    'CRVUSDT': 6, 'DOGEUSDT': 6, 'DOTUSDT': 6, 'ETCUSDT': 6, 'ETHUSDT': 6,
    'FILUSDT': 6, 'HBARUSDT': 6, 'LDOUSDT': 6, 'LINKUSDT': 6, 'LTCUSDT': 6,
    'NEARUSDT': 6, 'OKBUSDT': 6, 'SOLUSDT': 6, 'STXUSDT': 6, 'SUIUSDT': 6,
    'TONUSDT': 6, 'TRXUSDT': 6, 'UNIUSDT': 6, 'XLMUSDT': 6
  };
  
  // 根据等级筛选币种
  let symbolsWithUSDT = Object.keys(symbolsWithLevels);
  if (config.coinLevels && config.coinLevels.length > 0) {
    symbolsWithUSDT = symbolsWithUSDT.filter(s => 
      config.coinLevels.includes(symbolsWithLevels[s])
    );
  }
  
  // 去掉USDT后缀
  const symbols = symbolsWithUSDT.map(s => s.replace('USDT', ''));
  
  if (symbols.length === 0) {
    showStatus('所选等级没有可用的币种', 'error');
    return;
  }
  
  const levelText = config.coinLevels && config.coinLevels.length > 0 
    ? `(${config.coinLevels.sort().join(',')}级)` 
    : '(全部等级)';
  
  showStatus(`正在回测 ${symbols.length} 个交易对${levelText}（统一本金池）...`, 'info');
  
  try {
    // 使用新的批量回测API - 统一本金池
    const response = await axios.post('/api/backtest/batch-all', {
      symbols: symbols,
      timeframe: config.timeframe,
      limit: config.limit,
      strategies: config.strategies,
      leverage: config.leverage,
      positionSizeFixed: config.positionSizeFixed,
      stopLoss: config.stopLoss
    });
    
    if (response.data.success) {
      console.log('API返回数据:', response.data);
      console.log('交易数量:', response.data.trades?.length || 0);
      displayBatchAllResults(response.data);
      showStatus(`批量回测完成！`, 'success');
    } else {
      showStatus('批量回测失败: ' + response.data.error, 'error');
    }
  } catch (error) {
    console.error('批量回测失败:', error);
    showStatus('批量回测失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 显示回测结果
function displayBacktestResults(data) {
  const resultDiv = document.getElementById('backtestResult');
  const { backtest, capital, trading, trades } = data;
  
  const profitClass = capital.profit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitSign = capital.profit >= 0 ? '+' : '';
  
  resultDiv.innerHTML = `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-800 flex items-center">
          <i class="fas fa-chart-line text-purple-600 mr-3"></i>
          波段交易回测报告
        </h3>
        <button onclick="document.getElementById('backtestResult').classList.add('hidden')" 
                class="text-gray-400 hover:text-gray-600 transition">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <!-- 基本信息 -->
      <div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div class="grid grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-gray-500 mb-1">交易对</div>
            <div class="font-bold text-gray-800">${backtest.symbol}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">时间周期</div>
            <div class="font-bold text-gray-800">${backtest.timeframe}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">买入信号</div>
            <div class="font-bold text-blue-600">${backtest.buySignals} 次</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">卖出信号</div>
            <div class="font-bold text-orange-600">${backtest.sellSignals} 次</div>
          </div>
        </div>
      </div>
      
      <!-- 资金统计 -->
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-xs text-gray-500 mb-1">初始资金</div>
          <div class="text-lg font-bold text-gray-800">$${capital.initial.toLocaleString()}</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-xs text-gray-500 mb-1">最终资金</div>
          <div class="text-lg font-bold text-gray-800">$${capital.final.toLocaleString()}</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-xs text-gray-500 mb-1">净盈亏</div>
          <div class="text-lg font-bold ${profitClass}">${profitSign}$${capital.profit.toLocaleString()}</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-xs text-gray-500 mb-1">收益率</div>
          <div class="text-lg font-bold ${profitClass}">${profitSign}${capital.returnRate.toFixed(2)}%</div>
        </div>
      </div>
      
      <!-- 交易统计 -->
      <div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div class="grid grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-gray-500 mb-1">总交易次数</div>
            <div class="font-bold text-gray-800">${trading.totalTrades} 次</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">盈利次数</div>
            <div class="font-bold text-green-600">${trading.winningTrades} 次</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">亏损次数</div>
            <div class="font-bold text-red-600">${trading.losingTrades} 次</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">胜率</div>
            <div class="font-bold ${trading.winRate >= 50 ? 'text-green-600' : 'text-red-600'}">
              ${trading.winRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- 交易明细表格 -->
      ${trades.length > 0 ? `
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <h4 class="font-bold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-list-ul text-purple-600 mr-2"></i>
          交易明细 (最近20笔)
        </h4>
        <div class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500">序号</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">开仓时间</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">平仓时间</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">开仓价</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">平仓价</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">涨跌</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">净盈亏</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">本金前</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">本金后</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">累计胜率</th>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500">结果</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${trades.map((trade, index) => {
                const netProfit = parseFloat(trade.netProfit);
                const isWin = netProfit > 0;
                const plClass = isWin ? 'text-green-600' : 'text-red-600';
                const plSign = isWin ? '+' : '';
                const statusClass = isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-600 font-semibold">${index + 1}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-600">${trade.entryTime}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-600">${trade.exitTime}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.entryPrice).toFixed(4)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.exitPrice).toFixed(4)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-xs font-semibold ${plClass}">${trade.leveragedReturn}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-xs font-semibold ${plClass}">${plSign}$${Math.abs(netProfit).toFixed(2)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.capitalBefore).toFixed(2)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.capitalAfter).toFixed(2)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-xs text-blue-600 font-semibold">${trade.winRate}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-center">
                      <span class="px-2 py-1 rounded text-xs font-bold ${statusClass}">
                        ${trade.status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${trades.length > 50 ? `<div class="text-xs text-gray-500 mt-2 text-center">显示全部${trades.length}笔交易</div>` : ''}
      </div>
      ` : '<div class="text-center text-gray-500 py-4">未生成交易记录</div>'}
    </div>
  `;
  
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 显示批量回测结果
function displayBatchBacktestResults(results, timeframe) {
  const resultDiv = document.getElementById('backtestResult');
  
  // 计算汇总数据
  let totalInitial = 0;
  let totalFinal = 0;
  let totalTrades = 0;
  let totalWinning = 0;
  let totalLosing = 0;
  
  results.forEach(result => {
    totalInitial += result.capital.initial;
    totalFinal += parseFloat(result.capital.final);
    totalTrades += result.trading.totalTrades;
    totalWinning += result.trading.winningTrades;
    totalLosing += result.trading.losingTrades;
  });
  
  const totalProfit = totalFinal - totalInitial;
  const totalReturnRate = totalInitial > 0 ? (totalProfit / totalInitial * 100) : 0;
  const totalWinRate = totalTrades > 0 ? (totalWinning / totalTrades * 100) : 0;
  
  const profitClass = totalProfit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitSign = totalProfit >= 0 ? '+' : '';
  
  // 按收益率排序（需要解析字符串，去掉%符号）
  const sortedResults = [...results].sort((a, b) => {
    const aRate = parseFloat(a.capital.returnRate);
    const bRate = parseFloat(b.capital.returnRate);
    return bRate - aRate;
  });
  
  resultDiv.innerHTML = `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-800 flex items-center">
          <i class="fas fa-chart-line text-purple-600 mr-3"></i>
          批量回测报告 (${results.length}个交易对)
        </h3>
        <button onclick="document.getElementById('backtestResult').classList.add('hidden')" 
                class="text-gray-400 hover:text-gray-600 transition">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <!-- 汇总统计 -->
      <div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h4 class="font-bold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-calculator text-blue-600 mr-2"></i>
          汇总数据 - ${timeframe}
        </h4>
        <div class="grid grid-cols-5 gap-4">
          <div>
            <div class="text-xs text-gray-500 mb-1">总初始资金</div>
            <div class="text-lg font-bold text-gray-800">$${totalInitial.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">总最终资金</div>
            <div class="text-lg font-bold text-gray-800">$${totalFinal.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">总净盈亏</div>
            <div class="text-lg font-bold ${profitClass}">${profitSign}$${totalProfit.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">总收益率</div>
            <div class="text-lg font-bold ${profitClass}">${profitSign}${totalReturnRate.toFixed(2)}%</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">综合胜率</div>
            <div class="text-lg font-bold ${totalWinRate >= 50 ? 'text-green-600' : 'text-red-600'}">
              ${totalWinRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- 各交易对详情表格 -->
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <h4 class="font-bold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-table text-purple-600 mr-2"></i>
          各交易对表现
        </h4>
        <div class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">排名</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">交易对</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">收益率</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">盈亏</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">交易次数</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">胜率</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">信号</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${sortedResults.map((result, index) => {
                // 解析字符串为数字
                const profit = parseFloat(result.capital.profit);
                const returnRate = parseFloat(result.capital.returnRate);
                const winRate = parseFloat(result.trading.winRate);
                
                const plClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
                const plSign = profit >= 0 ? '+' : '';
                const rankClass = index === 0 ? 'bg-yellow-100' : (index === 1 ? 'bg-gray-100' : (index === 2 ? 'bg-orange-100' : ''));
                const rankIcon = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : ''));
                
                return `
                  <tr class="hover:bg-gray-50 ${rankClass}">
                    <td class="px-4 py-2 whitespace-nowrap text-center text-sm font-bold">
                      ${rankIcon} ${index + 1}
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap font-bold text-gray-800">
                      ${result.backtest.symbol}
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap text-right font-bold ${plClass}">
                      ${plSign}${Math.abs(returnRate).toFixed(2)}%
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap text-right font-semibold ${plClass}">
                      ${plSign}$${Math.abs(profit).toFixed(2)}
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap text-right text-gray-700">
                      ${result.trading.totalTrades}
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap text-right font-semibold ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}">
                      ${winRate.toFixed(1)}%
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-600">
                      ${result.backtest.buySignals}/${result.backtest.sellSignals}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 显示批量回测结果（统一本金池）
function displayBatchAllResults(data) {
  const resultDiv = document.getElementById('backtestResult');
  const { backtest, capital, trading, trades } = data;
  
  console.log('displayBatchAllResults 收到数据:', {
    backtest,
    capital,
    trading,
    trades: trades?.length || 0,
    tradesData: trades
  });
  
  // 添加alert确认数据
  if (!trades || trades.length === 0) {
    console.error('❌ trades数组为空！', { trades, data });
    alert('调试信息：trades数组为空或undefined！\n请查看Console日志');
  } else {
    console.log('✅ trades数组有', trades.length, '笔交易');
    console.log('第一笔交易leveragedReturn:', trades[0].leveragedReturn);
  }
  
  const profit = parseFloat(capital.profit);
  const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitSign = profit >= 0 ? '+' : '';
  
  resultDiv.innerHTML = `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-800 flex items-center">
          <i class="fas fa-chart-line text-purple-600 mr-3"></i>
          批量回测报告（统一本金池 - ${backtest.symbols}个交易对）
        </h3>
        <button onclick="document.getElementById('backtestResult').classList.add('hidden')" 
                class="text-gray-400 hover:text-gray-600 transition">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <!-- 汇总统计 -->
      <div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h4 class="font-bold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-calculator text-blue-600 mr-2"></i>
          资金统计 - ${backtest.timeframe}
        </h4>
        <div class="grid grid-cols-5 gap-4">
          <div>
            <div class="text-xs text-gray-500 mb-1">初始本金</div>
            <div class="text-lg font-bold text-gray-800">$${capital.initial.toLocaleString()}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">最终本金</div>
            <div class="text-lg font-bold text-gray-800">$${parseFloat(capital.final).toLocaleString()}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">净盈亏</div>
            <div class="text-lg font-bold ${profitClass}">${profitSign}$${Math.abs(profit).toLocaleString()}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">收益率</div>
            <div class="text-lg font-bold ${profitClass}">${profitSign}${capital.returnRate}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">综合胜率</div>
            <div class="text-lg font-bold ${parseFloat(trading.winRate) >= 50 ? 'text-green-600' : 'text-red-600'}">
              ${trading.winRate}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div>
            <div class="text-xs text-gray-500 mb-1">总交易数</div>
            <div class="text-base font-semibold text-gray-700">${trading.totalTrades} 笔</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">盈利交易</div>
            <div class="text-base font-semibold text-green-600">${trading.winningTrades} 笔</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">亏损交易</div>
            <div class="text-base font-semibold text-red-600">${trading.losingTrades} 笔</div>
          </div>
        </div>
      </div>
      
      <!-- 交易明细 -->
      ${trades.length > 0 ? `
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <h4 class="font-bold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-list text-purple-600 mr-2"></i>
          交易明细（按时间顺序）
        </h4>
        <div class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500">序号</th>
                <th class="px-2 py-2 text-left text-xs font-medium text-gray-500">币种</th>
                <th class="px-2 py-2 text-left text-xs font-medium text-gray-500">开仓时间</th>
                <th class="px-2 py-2 text-left text-xs font-medium text-gray-500">平仓时间</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">开仓价</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">平仓价</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">买入金额</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">杠杆</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">盈亏率</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">净盈亏</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">本金前</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">本金后</th>
                <th class="px-2 py-2 text-right text-xs font-medium text-gray-500">累计胜率</th>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500">结果</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${trades.map((trade, index) => {
                const netProfit = parseFloat(trade.netProfit);
                const isWin = netProfit > 0;
                const plClass = isWin ? 'text-green-600' : 'text-red-600';
                const plSign = isWin ? '+' : '';
                const statusClass = trade.status === 'STOP_LOSS' ? 'bg-orange-100 text-orange-700' : 
                                    (isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700');
                
                // 调试：检查时间字段
                if (index === 0) {
                  console.log('第一笔交易数据:', trade);
                  console.log('entryTime:', trade.entryTime, 'exitTime:', trade.exitTime);
                }
                
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-600 font-semibold">${index + 1}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-xs font-bold text-gray-800">${trade.symbol}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-xs text-gray-600">${trade.entryTime || '-'}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-xs text-gray-600">${trade.exitTime || '-'}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.entryPrice).toFixed(4)}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.exitPrice).toFixed(4)}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs font-semibold text-blue-600">$${parseFloat(trade.positionValue).toLocaleString()}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-center text-xs text-purple-600 font-bold">${trade.leverage}x</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs font-bold ${plClass}">${trade.leveragedReturn}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs font-semibold ${plClass}">${plSign}$${Math.abs(netProfit).toLocaleString()}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.capitalBefore).toLocaleString()}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs text-gray-700">$${parseFloat(trade.capitalAfter).toLocaleString()}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-right text-xs text-blue-600 font-semibold">${trade.winRate}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-center">
                      <span class="px-2 py-1 rounded text-xs font-bold ${statusClass}">
                        ${trade.status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${trades.length > 20 ? `<div class="text-xs text-gray-500 mt-2 text-center">显示全部${trades.length}笔交易</div>` : ''}
      </div>
      ` : '<div class="text-center text-gray-500 py-4">未生成交易记录</div>'}
    </div>
  `;
  
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
