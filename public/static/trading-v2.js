// 全局状态
let accounts = [];
let currentAccount = null;
let currentPositions = [];
let tradeHistory = [];
let autoRefreshInterval = null;
let selectedStrategies = new Map(); // 存储已选策略: key=strategyId, value={id, name, value}
let strategyCounter = 0; // 策略计数器

// 信号池数据
let signalPoolData = {
  signals: [],
  summary: {},
  originalSignals: [] // 保存原始未筛选的信号
};

// 策略库（从API动态加载）
let strategyLibrary = {
  'convergence': { name: '震荡收敛策略（5根K线内≥2次震荡收敛）', type: 'buy' },
  'peak': { name: '波段高点策略（RSI>65 且 涨幅≤0.1%）', type: 'sell' },
  'custom_buy_1': { name: '自定义买入策略 1', type: 'buy' },
  'custom_sell_1': { name: '自定义卖出策略 1', type: 'sell' }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [Init] DOM加载完成，开始初始化系统...');
  
  loadAccounts();
  loadStrategyLibrary();
  initializeStrategies();
  loadSignalPoolWithSave(); // 加载信号池（带自动保存）
  initDateControls(); // 初始化日期控件
  initTradeLogsSystem(); // 初始化交易日志系统和一键清仓功能
  initStrategyConfigPanel(); // 🆕 初始化策略配置面板功能
  
  console.log('🔧 [Init] 开始绑定事件监听器...');
  
  // 绑定按钮事件
  document.getElementById('createAccountBtn').addEventListener('click', openCreateAccountModal);
  document.getElementById('createAccountForm').addEventListener('submit', createAccount);
  document.getElementById('manualTradeForm').addEventListener('submit', executeManualTrade);
  document.getElementById('autoTradeBtn').addEventListener('click', executeAutoTrade);
  document.getElementById('refreshDataBtn').addEventListener('click', refreshAccountData);
  document.getElementById('pauseAccountBtn').addEventListener('click', toggleAccountStatus);
  document.getElementById('backtestBtn').addEventListener('click', executeBacktest);
  document.getElementById('backtestForm').addEventListener('submit', runBacktest);
  
  // 自动交易配置
  document.getElementById('autoTradeConfigForm').addEventListener('submit', saveAutoTradeConfig);
  document.getElementById('positionSplits').addEventListener('input', (e) => {
    updatePositionSplitsDisplay(e.target.value);
  });
  document.getElementById('maxPositionValue').addEventListener('input', updateMaxPositionInfo);
  document.getElementById('singleTradeLimit').addEventListener('input', updateSplitCalculation);
  document.getElementById('forceProtectionBalance').addEventListener('input', updateProtectionCalculation);
  
  // 策略管理按钮
  document.getElementById('addStrategyBtn').addEventListener('click', showStrategyDropdown);
  document.getElementById('confirmAddStrategy').addEventListener('click', confirmAddStrategy);
  document.getElementById('cancelAddStrategy').addEventListener('click', hideStrategyDropdown);
  
  // 信号池按钮
  document.getElementById('refreshSignalPoolBtn').addEventListener('click', () => {
    const mode = document.getElementById('signalQueryMode').value;
    if (mode === 'realtime') {
      loadSignalPoolWithSave();
    } else {
      loadHistorySignals();
    }
  });
  
  // 应用筛选按钮
  document.getElementById('applySignalFilter').addEventListener('click', () => {
    console.log('🔍 [筛选] 应用信号池筛选器');
    applySignalFilters();
  });
  
  // "查看历史数据"按钮 - 一键切换到历史查询模式
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', () => {
      console.log('📊 [History] 点击查看历史数据按钮');
      const queryModeSelect = document.getElementById('signalQueryMode');
      queryModeSelect.value = 'history';
      
      // 触发change事件以显示日期选择器
      const event = new Event('change');
      queryModeSelect.dispatchEvent(event);
      
      // 自动设置为查询今天的数据
      setQuickDate(0);
      loadHistorySignals();
      
      // 平滑滚动到信号池区域
      document.getElementById('signalQueryMode').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    });
    console.log('✅ [Init] 已绑定查看历史数据按钮');
  } else {
    console.error('❌ [Init] 找不到 viewHistoryBtn 元素');
  }
  
  // 查询模式切换
  document.getElementById('signalQueryMode').addEventListener('change', (e) => {
    const historyControls = document.getElementById('historyDateControls');
    const modeLabel = document.getElementById('signalPoolModeLabel');
    
    if (e.target.value === 'history') {
      historyControls.classList.remove('hidden');
      modeLabel.textContent = '(历史查询模式)';
    } else {
      historyControls.classList.add('hidden');
      modeLabel.textContent = '(实时监控)';
      loadSignalPoolWithSave(); // 切换回实时模式时自动刷新
    }
  });
  
  // 历史查询按钮
  document.getElementById('queryHistoryBtn').addEventListener('click', loadHistorySignals);
  
  // 快捷日期按钮
  document.getElementById('quickTodayBtn').addEventListener('click', () => {
    setQuickDate(0);
    loadHistorySignals();
  });
  
  document.getElementById('quickYesterdayBtn').addEventListener('click', () => {
    setQuickDate(1);
    loadHistorySignals();
  });
  
  document.getElementById('quickWeekBtn').addEventListener('click', () => {
    setQuickDate(7);
    loadHistorySignals();
  });
  
  // 定时刷新信号池（每30秒，仅在实时模式下）
  setInterval(() => {
    const mode = document.getElementById('signalQueryMode').value;
    if (mode === 'realtime') {
      loadSignalPoolWithSave();
    }
  }, 30000);
  
  console.log('✅ [Init] 所有事件监听器绑定完成');
  console.log('🎉 [Init] 系统初始化完成！');
});

// ==================== 策略管理功能 ====================

// 从API加载策略库
async function loadStrategyLibrary() {
  try {
    // TODO: 调用真实的策略库API
    // const response = await axios.get('/api/strategy-library');
    // strategyLibrary = response.data.strategies;
    
    // 暂时使用静态数据，稍后对接API
    console.log('策略库已加载:', strategyLibrary);
    updateStrategySelector();
  } catch (error) {
    console.error('加载策略库失败:', error);
  }
}

// 初始化默认策略
function initializeStrategies() {
  // 添加默认的震荡收敛策略
  selectedStrategies.set('default-convergence', {
    id: 'default-convergence',
    name: '震荡收敛策略（5根K线内≥2次震荡收敛）',
    value: 'convergence'
  });
}

// 更新策略下拉框选项
function updateStrategySelector() {
  const selector = document.getElementById('strategySelector');
  
  // 清空现有选项（保留第一个提示选项）
  while (selector.options.length > 1) {
    selector.remove(1);
  }
  
  // 创建分组
  const buyGroup = document.createElement('optgroup');
  buyGroup.label = '买入策略';
  
  const sellGroup = document.createElement('optgroup');
  sellGroup.label = '卖出策略';
  
  // 添加策略选项（排除已选策略）
  Object.keys(strategyLibrary).forEach(strategyValue => {
    const strategy = strategyLibrary[strategyValue];
    
    // 检查是否已选
    const isSelected = Array.from(selectedStrategies.values())
      .some(s => s.value === strategyValue);
    
    if (!isSelected) {
      const option = document.createElement('option');
      option.value = strategyValue;
      option.textContent = strategy.name;
      
      if (strategy.type === 'buy') {
        buyGroup.appendChild(option);
      } else {
        sellGroup.appendChild(option);
      }
    }
  });
  
  // 添加分组到选择器
  selector.appendChild(buyGroup);
  selector.appendChild(sellGroup);
}

// 显示策略下拉框
function showStrategyDropdown() {
  const container = document.getElementById('strategyDropdownContainer');
  container.classList.remove('hidden');
  updateStrategySelector();
}

// 隐藏策略下拉框
function hideStrategyDropdown() {
  const container = document.getElementById('strategyDropdownContainer');
  container.classList.add('hidden');
  document.getElementById('strategySelector').value = '';
}

// 确认添加策略
function confirmAddStrategy() {
  const selector = document.getElementById('strategySelector');
  const selectedValue = selector.value;
  
  if (!selectedValue) {
    alert('请选择一个策略');
    return;
  }
  
  const strategy = strategyLibrary[selectedValue];
  if (!strategy) {
    alert('策略不存在');
    return;
  }
  
  // 生成唯一ID
  const strategyId = `strategy-${++strategyCounter}`;
  
  // 添加到已选列表
  selectedStrategies.set(strategyId, {
    id: strategyId,
    name: strategy.name,
    value: selectedValue
  });
  
  // 渲染策略列表
  renderSelectedStrategies();
  
  // 隐藏下拉框
  hideStrategyDropdown();
}

// 移除策略
window.removeStrategy = function(strategyId) {
  selectedStrategies.delete(strategyId);
  renderSelectedStrategies();
};

// 渲染已选策略列表
function renderSelectedStrategies() {
  const container = document.getElementById('selectedStrategiesList');
  
  if (selectedStrategies.size === 0) {
    container.innerHTML = '<p class="text-xs text-gray-500 p-2">还未添加任何策略，点击"添加策略"按钮选择</p>';
    return;
  }
  
  container.innerHTML = Array.from(selectedStrategies.values()).map(strategy => `
    <div class="flex items-center justify-between bg-white p-2 rounded border border-blue-200" data-strategy-id="${strategy.id}">
      <div class="flex items-center space-x-2">
        <i class="fas fa-check-circle text-green-500"></i>
        <span class="text-sm text-gray-700">${strategy.name}</span>
      </div>
      <button type="button" onclick="removeStrategy('${strategy.id}')" class="text-red-500 hover:text-red-700 text-xs">
        <i class="fas fa-times"></i>
      </button>
      <input type="hidden" name="strategy" value="${strategy.value}">
    </div>
  `).join('');
}

// ==================== 原有代码 ====================

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
      ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">多单</span>'
      : '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">空单</span>';
    
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
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">${trade.leverage || 1}x</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">$${trade.entry_price.toFixed(4)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">
          ${trade.exit_price ? '$' + trade.exit_price.toFixed(4) : '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">${trade.quantity ? trade.quantity.toFixed(4) : '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">${trade.fee ? '$' + trade.fee.toFixed(2) : '-'}</td>
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

// 自动交易 - 打开配置对话框
async function executeAutoTrade() {
  if (!currentAccount) {
    showStatus('请先选择账户', 'error');
    return;
  }
  
  if (currentAccount.status !== 'ACTIVE') {
    showStatus('账户未激活，无法配置自动交易', 'error');
    return;
  }
  
  openAutoTradeConfigModal();
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

// 自动交易配置模态框
function openAutoTradeConfigModal() {
  if (!currentAccount) return;
  
  // 填充当前账户信息
  document.getElementById('autoTradeAccountName').textContent = currentAccount.account_name;
  document.getElementById('autoTradeCurrentBalance').textContent = `$${currentAccount.current_balance.toFixed(2)}`;
  
  // 加载现有配置（如果有）
  // 持仓最高金额
  if (currentAccount.max_position_value) {
    document.getElementById('maxPositionValue').value = currentAccount.max_position_value;
  } else {
    // 建议值：余额的 30-50%
    const suggested = Math.floor(currentAccount.current_balance * 0.3 / 100) * 100;
    document.getElementById('maxPositionValue').value = suggested;
  }
  
  // 单次买入上限
  if (currentAccount.single_trade_limit) {
    document.getElementById('singleTradeLimit').value = currentAccount.single_trade_limit;
  } else {
    // 建议值：持仓上限的 30%
    const maxPos = parseFloat(document.getElementById('maxPositionValue').value) || 0;
    const suggestedSingle = Math.floor(maxPos * 0.3 / 100) * 100;
    document.getElementById('singleTradeLimit').value = suggestedSingle;
  }
  
  if (currentAccount.position_splits) {
    document.getElementById('positionSplits').value = currentAccount.position_splits;
    updatePositionSplitsDisplay(currentAccount.position_splits);
  } else {
    // 使用默认值3
    document.getElementById('positionSplits').value = 3;
    updatePositionSplitsDisplay(3);
  }
  
  if (currentAccount.force_protection_balance) {
    document.getElementById('forceProtectionBalance').value = currentAccount.force_protection_balance;
  }
  
  if (currentAccount.auto_trading_enabled) {
    document.getElementById('autoTradingEnabled').checked = true;
  } else {
    document.getElementById('autoTradingEnabled').checked = false;
  }
  
  // 更新计算显示
  updateMaxPositionInfo();
  updateSplitCalculation();
  updateProtectionCalculation();
  
  // 绑定保存按钮事件（每次打开模态框时重新绑定，确保事件监听有效）
  const saveBtn = document.getElementById('saveAutoTradeConfigBtn');
  // 移除旧的事件监听器（如果存在）
  saveBtn.replaceWith(saveBtn.cloneNode(true));
  // 重新获取按钮引用并添加新的事件监听器
  const newSaveBtn = document.getElementById('saveAutoTradeConfigBtn');
  newSaveBtn.addEventListener('click', async (e) => {
    console.log('🔘 [AutoTrade] 保存按钮被点击');
    e.preventDefault();
    await saveAutoTradeConfig(e);
  });
  
  document.getElementById('autoTradeConfigModal').classList.remove('hidden');
}

function closeAutoTradeConfigModal() {
  document.getElementById('autoTradeConfigModal').classList.add('hidden');
  document.getElementById('autoTradeConfigForm').reset();
}

// 更新分批显示
function updatePositionSplitsDisplay(value) {
  document.getElementById('positionSplitsValue').textContent = value;
  updateSplitCalculation();
}

// 更新持仓最高金额信息
function updateMaxPositionInfo() {
  const maxPosition = parseFloat(document.getElementById('maxPositionValue').value) || 0;
  
  // 自动更新单次买入建议值（持仓上限的30%）
  const currentSingle = parseFloat(document.getElementById('singleTradeLimit').value) || 0;
  if (!currentSingle || currentSingle === 0) {
    const suggestedSingle = Math.floor(maxPosition * 0.3 / 100) * 100;
    document.getElementById('singleTradeLimit').value = suggestedSingle;
  }
  
  updateSplitCalculation();
}

// 更新每份金额计算
function updateSplitCalculation() {
  const singleTrade = parseFloat(document.getElementById('singleTradeLimit').value) || 0;
  const splits = parseInt(document.getElementById('positionSplits').value) || 1;
  
  if (singleTrade > 0) {
    const perSplit = (singleTrade / splits).toFixed(2);
    document.getElementById('perSplitAmount').textContent = `$${perSplit} USDT`;
    
    // 更新建议值显示
    const maxPosition = parseFloat(document.getElementById('maxPositionValue').value) || 0;
    if (maxPosition > 0) {
      const suggested = Math.floor(maxPosition * 0.3 / 100) * 100;
      document.getElementById('suggestedSingleTrade').textContent = `$${suggested} USDT (持仓上限的30%)`;
    }
  } else {
    document.getElementById('perSplitAmount').textContent = '--';
    document.getElementById('suggestedSingleTrade').textContent = '--';
  }
}

// 更新保护金额触发点计算
function updateProtectionCalculation() {
  const protectionBalance = parseFloat(document.getElementById('forceProtectionBalance').value) || 0;
  
  if (protectionBalance > 0) {
    const triggerPoint = (protectionBalance * 1.03).toFixed(2);
    document.getElementById('protectionTriggerPoint').textContent = `$${triggerPoint} (保护金额 × 103%)`;
  } else {
    document.getElementById('protectionTriggerPoint').textContent = '--';
  }
}

// 保存自动交易配置
async function saveAutoTradeConfig(e) {
  e.preventDefault();
  
  if (!currentAccount) return;
  
  const maxPositionValue = parseFloat(document.getElementById('maxPositionValue').value);
  const singleTradeLimit = parseFloat(document.getElementById('singleTradeLimit').value);
  const positionSplits = parseInt(document.getElementById('positionSplits').value);
  const forceProtectionBalance = parseFloat(document.getElementById('forceProtectionBalance').value) || null;
  const autoTradingEnabled = document.getElementById('autoTradingEnabled').checked ? 1 : 0;
  
  // 验证输入
  if (!maxPositionValue || maxPositionValue < 100) {
    showStatus('持仓最高金额不能小于100 USDT', 'error');
    return;
  }
  
  if (!singleTradeLimit || singleTradeLimit < 100) {
    showStatus('单次买入上限金额不能小于100 USDT', 'error');
    return;
  }
  
  if (singleTradeLimit > maxPositionValue) {
    showStatus('单次买入上限不能超过持仓最高金额', 'error');
    return;
  }
  
  if (maxPositionValue > currentAccount.current_balance) {
    if (!confirm(`持仓最高金额($${maxPositionValue})超过当前余额($${currentAccount.current_balance.toFixed(2)})，确认继续？`)) {
      return;
    }
  }
  
  if (forceProtectionBalance && forceProtectionBalance >= currentAccount.current_balance) {
    showStatus('强制保护金额应小于当前余额', 'error');
    return;
  }
  
  try {
    showStatus('正在保存配置...', 'info');
    
    const response = await axios.put(`/api/simulated/accounts/${currentAccount.id}/auto-trade-config`, {
      max_position_value: maxPositionValue,
      single_trade_limit: singleTradeLimit,
      position_splits: positionSplits,
      force_protection_balance: forceProtectionBalance,
      auto_trading_enabled: autoTradingEnabled
    });
    
    // 更新当前账户信息
    currentAccount.max_position_value = maxPositionValue;
    currentAccount.single_trade_limit = singleTradeLimit;
    currentAccount.position_splits = positionSplits;
    currentAccount.force_protection_balance = forceProtectionBalance;
    currentAccount.auto_trading_enabled = autoTradingEnabled;
    
    showStatus('自动交易配置已保存' + (autoTradingEnabled ? '，自动交易已启动' : ''), 'success');
    closeAutoTradeConfigModal();
    
    // 如果启用了自动交易，立即执行一次
    if (autoTradingEnabled) {
      setTimeout(() => {
        executeAutoTradeWithConfig();
      }, 1000);
    }
  } catch (error) {
    showStatus('保存配置失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 使用配置执行自动交易
async function executeAutoTradeWithConfig() {
  if (!currentAccount || !currentAccount.auto_trading_enabled) {
    return;
  }
  
  try {
    showStatus('正在执行自动交易...', 'info');
    const response = await axios.post('/api/simulated/auto-trade-all', {
      account_id: currentAccount.id,
      strategy_id: 1, // 使用策略ID 1
      single_trade_limit: currentAccount.single_trade_limit,
      max_position_value: currentAccount.max_position_value,
      position_splits: currentAccount.position_splits,
      force_protection_balance: currentAccount.force_protection_balance
    });
    
    const result = response.data;
    const tradesCount = result.trades?.length || 0;
    
    let message = `自动交易完成！`;
    if (tradesCount > 0) {
      message += ` 执行了 ${tradesCount} 个交易`;
    } else {
      message += ` 当前无符合条件的交易信号`;
    }
    
    if (result.protection_triggered) {
      message += ' ⚠️ 保护机制已触发，账户已锁定';
    }
    
    showStatus(message, tradesCount > 0 ? 'success' : 'info');
    refreshAccountData();
  } catch (error) {
    showStatus('自动交易失败: ' + (error.response?.data?.error || error.message), 'error');
  }
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

// ==================== 策略触发信号买卖池功能 ====================

// 加载信号池
async function loadSignalPool() {
  console.log('📊 [前端] 开始加载信号池数据...');
  try {
    const response = await axios.get('/api/signal-pool/recent', {
      params: {
        timeframe: '5m',
        klineCount: 3
      },
      timeout: 30000 // 30秒超时
    });
    
    console.log('📊 [前端] API响应状态:', response.status);
    console.log('📊 [前端] API响应数据:', response.data);
    
    if (response.data.success) {
      const { signals, summary } = response.data.data;
      console.log(`✅ [前端] 成功获取 ${signals.length} 个信号`);
      // 保存原始信号数据
      signalPoolData.originalSignals = signals;
      signalPoolData.summary = summary;
      // 应用筛选并渲染
      applySignalFilters();
    } else {
      const errorMsg = response.data.error || '未知错误';
      console.error('❌ [前端] 加载信号池失败:', errorMsg);
      if (response.data.details) {
        console.error('错误详情:', response.data.details);
      }
      showSignalPoolError('加载失败: ' + errorMsg);
    }
  } catch (error) {
    console.error('❌ [前端] 加载信号池异常:', error);
    
    let errorMessage = '网络错误或API异常';
    if (error.response) {
      // 服务器返回了错误响应
      errorMessage = `服务器错误 (${error.response.status}): ${error.response.data?.error || error.response.statusText}`;
      console.error('服务器响应:', error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '请求超时或服务器无响应，请检查后端服务是否运行';
      console.error('请求详情:', error.request);
    } else {
      // 请求配置出错
      errorMessage = '请求配置错误: ' + error.message;
    }
    
    showSignalPoolError(errorMessage);
  }
}

// 应用信号池筛选器
function applySignalFilters() {
  console.log('🔍 [筛选] 开始应用筛选条件');
  
  // 检查数据是否加载
  if (!signalPoolData.originalSignals || signalPoolData.originalSignals.length === 0) {
    console.warn('⚠️ [筛选] 没有可筛选的信号数据，originalSignals为空');
    alert('请先加载信号数据再进行筛选！');
    return;
  }
  
  // 获取筛选条件
  const filterLevelHigh = document.getElementById('filterLevelHigh').checked;
  const filterLevelMedium = document.getElementById('filterLevelMedium').checked;
  const filterLevelLow = document.getElementById('filterLevelLow').checked;
  const filterTypeLong = document.getElementById('filterTypeLong').checked;
  const filterTypeShort = document.getElementById('filterTypeShort').checked;
  
  console.log('📋 [筛选] 筛选条件:', {
    levelHigh: filterLevelHigh,
    levelMedium: filterLevelMedium,
    levelLow: filterLevelLow,
    typeLong: filterTypeLong,
    typeShort: filterTypeShort,
    originalSignalsCount: signalPoolData.originalSignals.length
  });
  
  // 筛选信号
  const filteredSignals = signalPoolData.originalSignals.filter(signal => {
    // 获取策略优先级（不是币种等级）
    const priority = signal.strategy_priority || 'medium';
    
    // 优先级筛选（基于策略的优先级，不是币种等级）
    let levelPass = false;
    if (filterLevelHigh && priority === 'high') levelPass = true;
    if (filterLevelMedium && priority === 'medium') levelPass = true;
    if (filterLevelLow && priority === 'low') levelPass = true;
    
    // 如果所有等级都没勾选，则不显示任何信号
    if (!filterLevelHigh && !filterLevelMedium && !filterLevelLow) {
      levelPass = false;
    }
    
    // 类型筛选
    let typePass = false;
    if (filterTypeLong && signal.signal_type === 'BUY') typePass = true;
    if (filterTypeShort && signal.signal_type === 'SELL') typePass = true;
    
    // 如果所有类型都没勾选，则不显示任何信号
    if (!filterTypeLong && !filterTypeShort) {
      typePass = false;
    }
    
    return levelPass && typePass;
  });
  
  console.log(`✅ [筛选] 筛选完成: ${signalPoolData.originalSignals.length} → ${filteredSignals.length} 个信号`);
  
  // 重新计算统计数据
  const filteredSummary = calculateSignalSummary(filteredSignals);
  
  // 🔥 重要：先更新活跃策略配置（基于筛选后的信号）
  renderActiveStrategies(filteredSignals);
  
  // 渲染筛选后的信号
  renderSignalPool(filteredSignals, filteredSummary);
}

// 计算信号统计
function calculateSignalSummary(signals) {
  const summary = {
    total: signals.length,
    buy_count: 0,
    sell_count: 0,
    open_count: 0,
    close_count: 0,
    buy_open_count: 0,
    buy_close_count: 0,
    sell_open_count: 0,
    sell_close_count: 0,
    latest_update: signals.length > 0 ? signals[0].time : new Date().toISOString()
  };
  
  signals.forEach(signal => {
    if (signal.signal_type === 'BUY') {
      summary.buy_count++;
      if (signal.action === 'OPEN') {
        summary.buy_open_count++;
      } else {
        summary.buy_close_count++;
      }
    } else {
      summary.sell_count++;
      if (signal.action === 'OPEN') {
        summary.sell_open_count++;
      } else {
        summary.sell_close_count++;
      }
    }
    
    if (signal.action === 'OPEN') {
      summary.open_count++;
    } else {
      summary.close_count++;
    }
  });
  
  return summary;
}

// 渲染活跃策略配置
function renderActiveStrategies(signals) {
  // 提取所有唯一的策略配置
  const strategiesMap = new Map();
  
  signals.forEach(signal => {
    if (signal.strategy_config && !strategiesMap.has(signal.strategy_name)) {
      console.log(`📋 [策略配置] ${signal.strategy_name}:`, signal.strategy_config);
      strategiesMap.set(signal.strategy_name, {
        name: signal.strategy_name,
        priority: signal.strategy_priority,
        config: signal.strategy_config
      });
    }
  });
  
  console.log(`📊 [策略配置] 共显示 ${strategiesMap.size} 个策略配置`);
  
  const container = document.getElementById('activeStrategiesConfig');
  const listEl = document.getElementById('strategiesConfigList');
  
  if (strategiesMap.size === 0) {
    container.classList.add('hidden');
    return;
  }
  
  container.classList.remove('hidden');
  
  // 渲染策略配置卡片
  listEl.innerHTML = Array.from(strategiesMap.values()).map(strategy => {
    const config = strategy.config;
    const priorityBadge = getLevelBadge(strategy.priority);
    
    return `
      <div class="bg-white rounded-lg p-4 border-2 border-indigo-200 shadow-md hover:shadow-lg transition">
        <!-- 策略标题 -->
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <div class="flex items-center">
            <i class="fas fa-chess-knight mr-2 text-indigo-600"></i>
            <div class="font-bold text-gray-900 text-sm">${strategy.name}</div>
          </div>
          ${priorityBadge}
        </div>
        
        <!-- 配置详情 -->
        <div class="space-y-2">
          <!-- 持仓管理 -->
          <div class="bg-blue-50 rounded p-2">
            <div class="text-xs font-semibold text-blue-700 mb-1 flex items-center">
              <i class="fas fa-coins mr-1"></i>持仓管理
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.position_splits ? `<div class="flex justify-between"><span><i class="fas fa-layer-group mr-1 text-blue-500"></i>分批次数:</span><span class="font-semibold">${config.position_splits}次</span></div>` : '<div class="text-gray-400">未配置分批</div>'}
              ${config.split_interval_pct ? `<div class="flex justify-between"><span><i class="fas fa-arrows-alt-h mr-1 text-green-500"></i>加仓间隔:</span><span class="font-semibold">${config.split_interval_pct}%</span></div>` : ''}
              ${config.max_position_size ? `<div class="flex justify-between"><span><i class="fas fa-percentage mr-1 text-purple-500"></i>最大仓位:</span><span class="font-semibold">${config.max_position_size}%</span></div>` : ''}
              ${config.max_holding_periods ? `<div class="flex justify-between"><span><i class="fas fa-clock mr-1 text-orange-500"></i>持仓周期:</span><span class="font-semibold">${config.max_holding_periods}期</span></div>` : ''}
            </div>
          </div>
          
          <!-- 风控参数 -->
          <div class="bg-green-50 rounded p-2">
            <div class="text-xs font-semibold text-green-700 mb-1 flex items-center">
              <i class="fas fa-shield-alt mr-1"></i>风控参数
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.stop_loss_pct ? `<div class="flex justify-between"><span><i class="fas fa-arrow-down mr-1 text-red-500"></i>止损:</span><span class="font-semibold text-red-600">${config.stop_loss_pct}%</span></div>` : '<div class="text-gray-400">未设置止损</div>'}
              ${config.take_profit_pct ? `<div class="flex justify-between"><span><i class="fas fa-arrow-up mr-1 text-green-500"></i>止盈:</span><span class="font-semibold text-green-600">${config.take_profit_pct}%</span></div>` : '<div class="text-gray-400">未设置止盈</div>'}
            </div>
          </div>
          
          <!-- 买卖点配置 -->
          <div class="bg-yellow-50 rounded p-2">
            <div class="text-xs font-semibold text-yellow-700 mb-1 flex items-center">
              <i class="fas fa-key mr-1"></i>买卖点配置
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              <!-- 买点信号 -->
              ${config.entry_signal_type ? `
                <div class="mb-2">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-green-600"><i class="fas fa-arrow-up mr-1"></i>买点:</span>
                    <span class="font-mono text-xs bg-green-100 px-2 py-0.5 rounded border border-green-300">${config.entry_signal_type}</span>
                  </div>
                  ${config.entry_price_type ? `<div class="flex justify-between text-xs"><span class="text-gray-500">价格类型:</span><span class="font-semibold">${
                    config.entry_price_type === 'high' ? '最高价' :
                    config.entry_price_type === 'low' ? '最低价' :
                    config.entry_price_type === 'open' ? '开盘价' :
                    config.entry_price_type === 'close' ? '收盘价' :
                    config.entry_price_type === 'specified' ? '指定价格' : '不限'
                  }</span></div>` : ''}
                  ${config.entry_specified_price ? `<div class="flex justify-between text-xs"><span class="text-gray-500">指定价格:</span><span class="font-semibold text-blue-600">$${config.entry_specified_price}</span></div>` : ''}
                </div>
              ` : '<div class="text-gray-400 mb-2">未配置买点</div>'}
              
              <!-- 卖点信号 -->
              ${config.exit_signal_type || config.exit_signals_json ? `
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-red-600"><i class="fas fa-arrow-down mr-1"></i>卖点:</span>
                    ${config.exit_signals_json ? `<span class="font-mono text-xs bg-red-100 px-2 py-0.5 rounded border border-red-300">${(() => {
                      try {
                        const exits = JSON.parse(config.exit_signals_json);
                        return exits.length + '个';
                      } catch(e) {
                        return config.exit_signal_type || '未配置';
                      }
                    })()}</span>` : `<span class="font-mono text-xs bg-red-100 px-2 py-0.5 rounded border border-red-300">${config.exit_signal_type}</span>`}
                  </div>
                  ${config.exit_signals_json ? `<div class="text-xs text-gray-600 pl-2">${(() => {
                    try {
                      const exits = JSON.parse(config.exit_signals_json);
                      return exits.map(e => '• ' + e).join('<br>');
                    } catch(e) {
                      return config.exit_signal_type || '';
                    }
                  })()}</div>` : ''}
                  ${config.exit_price_type ? `<div class="flex justify-between text-xs mt-1"><span class="text-gray-500">价格类型:</span><span class="font-semibold">${
                    config.exit_price_type === 'unlimited' ? '不限' :
                    config.exit_price_type === 'specified' ? '指定价格' : config.exit_price_type
                  }</span></div>` : ''}
                  ${config.exit_specified_price ? `<div class="flex justify-between text-xs"><span class="text-gray-500">指定价格:</span><span class="font-semibold text-blue-600">$${config.exit_specified_price}</span></div>` : ''}
                </div>
              ` : '<div class="text-gray-400">未配置卖点</div>'}
            </div>
          </div>
          
          <!-- 币种筛选条件 -->
          <div class="bg-purple-50 rounded p-2">
            <div class="text-xs font-semibold text-purple-700 mb-1 flex items-center">
              <i class="fas fa-filter mr-1"></i>币种筛选
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.allowed_coin_levels ? `<div class="flex justify-between"><span>允许等级:</span><span class="font-semibold">${(() => {
                try {
                  const levels = JSON.parse(config.allowed_coin_levels);
                  return levels.join(', ') + '级';
                } catch(e) {
                  return config.allowed_coin_levels;
                }
              })()}</span></div>` : '<div class="text-gray-400">未设置币种等级限制</div>'}
              ${config.include_historical_levels !== null && config.include_historical_levels !== undefined ? `<div class="flex justify-between"><span>包含历史等级:</span><span class="font-semibold">${config.include_historical_levels ? '是' : '否'}</span></div>` : ''}
            </div>
          </div>
          
          <!-- 开仓涨幅条件 -->
          <div class="bg-pink-50 rounded p-2">
            <div class="text-xs font-semibold text-pink-700 mb-1 flex items-center">
              <i class="fas fa-chart-line mr-1"></i>开仓涨幅条件
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.daily_gain_condition_value !== null && config.daily_gain_condition_value !== undefined ? `
                <div class="flex justify-between">
                  <span>当天涨幅:</span>
                  <span class="font-semibold">${
                    config.daily_gain_condition_operator === 'greater_than' ? '> ' :
                    config.daily_gain_condition_operator === 'less_than' ? '< ' :
                    config.daily_gain_condition_operator === 'greater_equal' ? '≥ ' :
                    config.daily_gain_condition_operator === 'less_equal' ? '≤ ' : ''
                  }${config.daily_gain_condition_value}%</span>
                </div>
              ` : '<div class="text-gray-400">未设置涨幅条件</div>'}
            </div>
          </div>
          
          <!-- 策略描述 -->
          ${config.description ? `
          <div class="bg-gray-50 rounded p-2">
            <div class="text-xs font-semibold text-gray-700 mb-1 flex items-center">
              <i class="fas fa-info-circle mr-1"></i>策略说明
            </div>
            <div class="text-xs text-gray-600">
              ${config.description}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 渲染信号池
function renderSignalPool(signals, summary) {
  // 提取活跃策略配置
  renderActiveStrategies(signals);
  
  // 更新统计数据 - 层级结构：方向 > 操作
  document.getElementById('buySignalCount').textContent = summary.buy_count || 0;
  document.getElementById('sellSignalCount').textContent = summary.sell_count || 0;
  document.getElementById('totalSignalCount').textContent = summary.total || 0;
  
  // 做多信号细分
  document.getElementById('buyOpenCount').textContent = summary.buy_open_count || 0;
  document.getElementById('buyCloseCount').textContent = summary.buy_close_count || 0;
  
  // 做空信号细分
  document.getElementById('sellOpenCount').textContent = summary.sell_open_count || 0;
  document.getElementById('sellCloseCount').textContent = summary.sell_close_count || 0;
  
  // 总计细分
  document.getElementById('totalOpenCount').textContent = summary.open_count || 0;
  document.getElementById('totalCloseCount').textContent = summary.close_count || 0;
  
  document.getElementById('signalPoolLastUpdate').textContent = 
    '更新于 ' + new Date(summary.latest_update).toLocaleTimeString('zh-CN');
  
  // 渲染信号列表
  const tbody = document.getElementById('signalPoolTable');
  
  if (signals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-info-circle mr-2"></i>暂无策略触发信号
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = signals.map(signal => {
    // 信号类型颜色和图标
    const signalTypeClass = signal.signal_type === 'BUY' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
    
    const signalTypeIcon = signal.signal_type === 'BUY'
      ? '<i class="fas fa-arrow-up"></i>'
      : '<i class="fas fa-arrow-down"></i>';
    
    // 操作类型（开仓/平仓）
    const action = signal.action || 'OPEN'; // 默认为开仓
    const actionClass = action === 'OPEN' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-orange-100 text-orange-800';
    
    const actionIcon = action === 'OPEN'
      ? '<i class="fas fa-sign-in-alt"></i>'
      : '<i class="fas fa-sign-out-alt"></i>';
    
    const actionText = action === 'OPEN' ? '开仓' : '平仓';
    
    const time = new Date(signal.time).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // 获取策略优先级（不是币种等级）
    const priority = signal.strategy_priority || 'medium';
    const levelBadge = getLevelBadge(priority);
    
    // 生成唯一ID用于按钮绑定
    const signalId = 'signal_' + (signal.timestamp || Date.now()) + '_' + Math.random().toString(36).substr(2, 9);
    
    // 完整的信号描述
    const fullSignalText = `${signal.signal_type === 'BUY' ? '做多' : '做空'} · ${actionText}`;
    
    return `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
          ${time}
        </td>
        <td class="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-800">
          ${signal.symbol}
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          ${levelBadge}
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex flex-col gap-1">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${signalTypeClass}">
              ${signalTypeIcon} ${signal.signal_type === 'BUY' ? '做多' : '做空'}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${actionClass}">
              ${actionIcon} ${actionText}
            </span>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-700">
          ${signal.strategy_name}
        </td>
        <td class="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-800">
          $${signal.price.toFixed(4)}
        </td>
        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
          第${signal.kline_index}根
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">
          ${signal.reason}
        </td>
        <td class="px-4 py-3 text-xs text-gray-500">
          <div class="space-y-1">
            ${signal.indicators.rsi ? `<div>RSI: <span class="font-semibold">${signal.indicators.rsi.toFixed(2)}</span>${signal.indicators.rsi_threshold ? ` (阈值:${signal.indicators.rsi_threshold})` : ''}</div>` : ''}
            ${signal.indicators.change ? `<div>涨幅: <span class="font-semibold">${typeof signal.indicators.change === 'number' ? signal.indicators.change.toFixed(2) + '%' : signal.indicators.change}</span>${signal.indicators.change_threshold ? ` (阈值:${signal.indicators.change_threshold}%)` : ''}</div>` : ''}
            ${signal.indicators.convergence_count ? `<div>收敛: <span class="font-semibold">${signal.indicators.convergence_count}次</span>/${signal.indicators.check_range}根</div>` : ''}
          </div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <button 
            class="execute-signal-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition"
            data-signal='${JSON.stringify(signal).replace(/'/g, "&apos;")}'
          >
            <i class="fas fa-bolt mr-1"></i>执行
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  // 使用事件委托绑定执行按钮事件（更可靠的方式）
  // 先移除旧的事件监听器（如果存在）
  const oldHandler = tbody._executeHandler;
  if (oldHandler) {
    tbody.removeEventListener('click', oldHandler);
  }
  
  // 创建新的事件处理器
  const newHandler = (e) => {
    const btn = e.target.closest('.execute-signal-btn');
    if (btn) {
      try {
        const signalData = JSON.parse(btn.dataset.signal.replace(/&apos;/g, "'"));
        openExecuteSignalModal(signalData);
      } catch (error) {
        console.error('❌ 解析信号数据失败:', error);
        showStatus('信号数据解析失败', 'error');
      }
    }
  };
  
  // 绑定新的事件监听器
  tbody.addEventListener('click', newHandler);
  tbody._executeHandler = newHandler; // 保存引用以便后续移除
}

// 显示信号池错误
function showSignalPoolError(message) {
  const tbody = document.getElementById('signalPoolTable');
  tbody.innerHTML = `
    <tr>
      <td colspan="10" class="px-6 py-8 text-center text-red-500">
        <i class="fas fa-exclamation-triangle mr-2"></i>${message}
      </td>
    </tr>
  `;
}

// ==================== 历史查询功能 ====================

// 查询历史信号
async function loadHistorySignals() {
  try {
    const startDate = document.getElementById('signalStartDate').value;
    const endDate = document.getElementById('signalEndDate').value;
    
    if (!startDate || !endDate) {
      showSignalPoolError('请选择开始和结束日期');
      return;
    }
    
    const tbody = document.getElementById('signalPoolTable');
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-spinner fa-spin mr-2"></i>加载历史数据中...
        </td>
      </tr>
    `;
    
    const response = await axios.get('/api/signal-pool/history', {
      params: {
        startDate,
        endDate,
        limit: 1000
      }
    });
    
    if (response.data.success) {
      const { signals, summary } = response.data.data;
      renderSignalPool(signals, {
        ...summary,
        latest_update: new Date().toISOString()
      });
      
      // 更新模式标签
      document.getElementById('signalPoolModeLabel').textContent = 
        `(历史查询: ${startDate} ~ ${endDate})`;
    } else {
      showSignalPoolError('查询失败: ' + response.data.error);
    }
  } catch (error) {
    console.error('查询历史信号异常:', error);
    showSignalPoolError('查询失败: ' + (error.response?.data?.error || error.message));
  }
}

// 保存当前信号到历史记录
async function saveSignalsToHistory(signals) {
  try {
    await axios.post('/api/signal-pool/save', { signals });
    console.log('信号已保存到历史记录');
  } catch (error) {
    console.error('保存信号历史失败:', error);
  }
}

// 修改加载信号池函数，添加自动保存
async function loadSignalPoolWithSave() {
  try {
    const response = await axios.get('/api/signal-pool/recent', {
      params: {
        timeframe: '5m',
        klineCount: 3
      }
    });
    
    if (response.data.success) {
      const { signals, summary } = response.data.data;
      
      // 🔥 FIX: 保存原始信号数据，以便筛选功能可以使用
      signalPoolData.originalSignals = signals;
      signalPoolData.summary = summary;
      
      // 应用筛选并渲染（而不是直接渲染）
      applySignalFilters();
      
      // 🔥 PERFORMANCE FIX: 只在手动刷新时保存历史，自动刷新时不保存
      // 自动保存会导致每30秒一次POST请求，严重影响性能
      // if (signals.length > 0) {
      //   await saveSignalsToHistory(signals);
      // }
    } else {
      console.error('加载信号池失败:', response.data.error);
      showSignalPoolError('加载失败: ' + response.data.error);
    }
  } catch (error) {
    console.error('加载信号池异常:', error);
    showSignalPoolError('网络错误或API异常');
  }
}

// 快捷日期设置
function setQuickDate(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  document.getElementById('signalEndDate').value = endDate.toISOString().split('T')[0];
  document.getElementById('signalStartDate').value = startDate.toISOString().split('T')[0];
}

// 初始化日期控件（设置默认值为今天）
function initDateControls() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('signalStartDate').value = today;
  document.getElementById('signalEndDate').value = today;
}

// ==================== 策略库整合功能 ====================

// 全局变量：选中的策略列表（支持多选）
let selectedBacktestStrategies = new Map(); // key: strategy_id, value: strategy对象
let allAvailableStrategies = []; // 存储所有可用策略

// 加载策略库（改为复选框）
async function loadBacktestStrategyLibrary() {
  try {
    const response = await axios.get('/api/strategies');
    if (response.data.success) {
      allAvailableStrategies = response.data.strategies.filter(s => s.is_enabled);
      renderBacktestStrategyCheckboxes(allAvailableStrategies);
    }
  } catch (error) {
    console.error('加载策略库失败:', error);
    const container = document.getElementById('strategyCheckboxContainer');
    if (container) {
      container.innerHTML = '<div class="text-sm text-red-500 text-center py-4">加载失败，请刷新重试</div>';
    }
  }
}

// 渲染策略复选框列表
function renderBacktestStrategyCheckboxes(strategies) {
  const container = document.getElementById('strategyCheckboxContainer');
  if (!container) return;
  
  if (strategies.length === 0) {
    container.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">暂无可用策略，请先在策略库中创建</div>';
    return;
  }
  
  // 按类型分组
  const longStrategies = strategies.filter(s => s.strategy_type === 'long');
  const shortStrategies = strategies.filter(s => s.strategy_type === 'short');
  
  let html = '';
  
  // 做多策略组
  if (longStrategies.length > 0) {
    html += '<div class="mb-3"><h5 class="text-xs font-bold text-green-700 mb-2">📈 做多策略</h5>';
    longStrategies.forEach(strategy => {
      html += renderStrategyCheckboxItem(strategy);
    });
    html += '</div>';
  }
  
  // 做空策略组
  if (shortStrategies.length > 0) {
    html += '<div><h5 class="text-xs font-bold text-red-700 mb-2">📉 做空策略</h5>';
    shortStrategies.forEach(strategy => {
      html += renderStrategyCheckboxItem(strategy);
    });
    html += '</div>';
  }
  
  container.innerHTML = html;
  
  // 绑定所有复选框的change事件
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', handleStrategyCheckboxChange);
  });
}

// 渲染单个策略复选框
function renderStrategyCheckboxItem(strategy) {
  const entryLabel = strategy.entry_signal_type || '未设置';
  const exitLabel = strategy.exit_signal_type || '未设置';
  
  return `
    <label class="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-blue-200">
      <input type="checkbox" 
             class="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" 
             data-strategy-id="${strategy.id}"
             data-strategy='${JSON.stringify(strategy).replace(/'/g, "&apos;")}'>
      <div class="flex-1 text-xs">
        <div class="font-semibold text-gray-800">${strategy.strategy_name}</div>
        <div class="text-gray-600">买：${entryLabel} | 卖：${exitLabel}</div>
      </div>
    </label>
  `;
}

// 处理策略复选框变化
function handleStrategyCheckboxChange(e) {
  const checkbox = e.target;
  const strategyId = checkbox.dataset.strategyId;
  
  try {
    const strategy = JSON.parse(checkbox.dataset.strategy.replace(/&apos;/g, "'"));
    
    if (checkbox.checked) {
      // 添加到选中列表
      selectedBacktestStrategies.set(strategyId, strategy);
    } else {
      // 从选中列表移除
      selectedBacktestStrategies.delete(strategyId);
    }
    
    // 更新汇总显示
    updateSelectedStrategiesSummary();
  } catch (error) {
    console.error('解析策略数据失败:', error);
  }
}

// 更新已选策略汇总
function updateSelectedStrategiesSummary() {
  const summaryDiv = document.getElementById('selectedStrategiesSummary');
  const countSpan = document.getElementById('selectedStrategyCount');
  const listDiv = document.getElementById('selectedStrategiesList');
  
  if (!summaryDiv || !countSpan || !listDiv) return;
  
  const count = selectedBacktestStrategies.size;
  countSpan.textContent = count;
  
  if (count === 0) {
    summaryDiv.classList.add('hidden');
    return;
  }
  
  summaryDiv.classList.remove('hidden');
  
  // 渲染已选策略列表
  let html = '';
  selectedBacktestStrategies.forEach((strategy, id) => {
    const typeColor = strategy.strategy_type === 'long' ? 'text-green-700' : 'text-red-700';
    const typeIcon = strategy.strategy_type === 'long' ? '📈' : '📉';
    const entryLabel = strategy.entry_signal_type || '未设置';
    const exitLabel = strategy.exit_signal_type || '未设置';
    
    html += `
      <div class="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
        <div class="flex-1">
          <div class="font-semibold ${typeColor}">${typeIcon} ${strategy.strategy_name}</div>
          <div class="text-gray-600 mt-1">
            <span>📈 ${entryLabel}</span> | <span>📉 ${exitLabel}</span>
          </div>
        </div>
        <button type="button" 
                onclick="removeSelectedStrategy('${id}')" 
                class="text-red-500 hover:text-red-700 ml-2">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  
  listDiv.innerHTML = html;
}

// 移除已选策略
function removeSelectedStrategy(strategyId) {
  // 取消勾选复选框
  const checkbox = document.querySelector(`input[data-strategy-id="${strategyId}"]`);
  if (checkbox) {
    checkbox.checked = false;
  }
  
  // 从列表移除
  selectedBacktestStrategies.delete(strategyId);
  
  // 更新汇总
  updateSelectedStrategiesSummary();
}

// 全选策略
function selectAllStrategies() {
  const checkboxes = document.querySelectorAll('#strategyCheckboxContainer input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    if (!checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    }
  });
}

// 清空所有选择
function clearAllStrategies() {
  const checkboxes = document.querySelectorAll('#strategyCheckboxContainer input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
    }
  });
}

// 初始化策略库整合
function initBacktestStrategyIntegration() {
  // 加载策略库
  loadBacktestStrategyLibrary();
  
  // 绑定全选按钮
  const selectAllBtn = document.getElementById('selectAllStrategiesBtn');
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', selectAllStrategies);
  }
  
  // 绑定清空按钮
  const clearAllBtn = document.getElementById('clearAllStrategiesBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllStrategies);
  }
}

// 在DOMContentLoaded中调用初始化
document.addEventListener('DOMContentLoaded', () => {
  // ... 其他初始化代码 ...
  initBacktestStrategyIntegration();
});

// ==================== 交易日志系统 ====================

// 交易日志全局变量
let tradeLogs = []; // 所有交易日志
let currentLogTab = 'simulated'; // 当前查看的日志类型
let closeAllPassword = '123456'; // 默认清仓密码

// 币种等级映射（示例数据）
const COIN_LEVELS = {
  'BTC': 'high',
  'ETH': 'high',
  'BNB': 'medium',
  'SOL': 'medium',
  'DOGE': 'low',
  'XRP': 'low',
  // 可以根据实际情况添加更多
};

// 获取币种等级
function getCoinLevel(symbol) {
  // 移除USDT后缀
  const cleanSymbol = symbol.replace('USDT', '');
  return COIN_LEVELS[cleanSymbol] || 'medium';
}

// 获取等级显示标签
function getLevelBadge(level) {
  const badges = {
    'high': '<span class="px-2 py-1 text-xs rounded bg-red-100 text-red-700 font-medium">高</span>',
    'medium': '<span class="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 font-medium">中</span>',
    'low': '<span class="px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-medium">低</span>'
  };
  return badges[level] || badges.medium;
}

// 记录交易日志
function logTrade(tradeData) {
  const log = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type: currentAccount ? 'simulated' : 'live', // simulated 或 live
    ...tradeData
  };
  
  tradeLogs.unshift(log); // 添加到开头
  
  // 只保留最近1000条日志
  if (tradeLogs.length > 1000) {
    tradeLogs = tradeLogs.slice(0, 1000);
  }
  
  // 保存到localStorage
  saveTradeLogs();
  
  // 更新显示
  refreshTradeLogsDisplay();
  refreshLogStatistics();
}

// 保存交易日志到localStorage
function saveTradeLogs() {
  try {
    localStorage.setItem('trade_logs', JSON.stringify(tradeLogs));
  } catch (error) {
    console.error('保存交易日志失败:', error);
  }
}

// 从localStorage加载交易日志
function loadTradeLogs() {
  try {
    const saved = localStorage.getItem('trade_logs');
    if (saved) {
      tradeLogs = JSON.parse(saved);
    }
  } catch (error) {
    console.error('加载交易日志失败:', error);
    tradeLogs = [];
  }
}

// 刷新交易日志显示
function refreshTradeLogsDisplay() {
  const tbody = document.getElementById('tradeLogsTable');
  if (!tbody) return;
  
  // 筛选当前类型的日志
  const filteredLogs = tradeLogs.filter(log => log.type === currentLogTab);
  
  if (filteredLogs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-inbox mr-2"></i>暂无${currentLogTab === 'simulated' ? '模拟' : '实盘'}交易日志
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filteredLogs.map(log => {
    const profitClass = log.profit >= 0 ? 'text-green-600' : 'text-red-600';
    const profitIcon = log.profit >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-3 py-3 text-xs text-gray-700">
          ${new Date(log.timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </td>
        <td class="px-3 py-3 text-sm font-medium text-gray-900">${log.symbol}</td>
        <td class="px-3 py-3 text-xs text-gray-600">${log.strategy || '-'}</td>
        <td class="px-3 py-3">
          ${log.direction === 'long' 
            ? '<span class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">做多</span>'
            : '<span class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">做空</span>'}
        </td>
        <td class="px-3 py-3 text-xs">
          <div>$${log.openPrice?.toFixed(2) || '-'}</div>
          <div class="text-gray-500">${log.openQty?.toFixed(4) || '-'}</div>
        </td>
        <td class="px-3 py-3 text-xs">
          <div>$${log.openFilledPrice?.toFixed(2) || '-'}</div>
          <div class="text-gray-500">${log.openFilledQty?.toFixed(4) || '-'}</div>
        </td>
        <td class="px-3 py-3 text-xs">
          <div>$${log.closePrice?.toFixed(2) || '-'}</div>
          <div class="text-gray-500">${log.closeQty?.toFixed(4) || '-'}</div>
        </td>
        <td class="px-3 py-3 text-xs">
          <div>$${log.closeFilledPrice?.toFixed(2) || '-'}</div>
          <div class="text-gray-500">${log.closeFilledQty?.toFixed(4) || '-'}</div>
        </td>
        <td class="px-3 py-3 text-sm font-bold ${profitClass}">
          <i class="fas ${profitIcon} mr-1"></i>
          $${Math.abs(log.profit || 0).toFixed(2)}
        </td>
        <td class="px-3 py-3 text-sm font-medium text-gray-900">
          $${log.balance?.toFixed(2) || '-'}
        </td>
      </tr>
    `;
  }).join('');
}

// 刷新日志统计数据
function refreshLogStatistics() {
  if (!currentAccount) return;
  
  // 获取当前账户的日志
  const accountLogs = tradeLogs.filter(log => 
    log.type === 'simulated' && log.accountId === currentAccount.id
  );
  
  // 计算整体盈亏
  const totalProfitLoss = accountLogs.reduce((sum, log) => sum + (log.profit || 0), 0);
  
  // 计算3天盈亏
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const threeDayLogs = accountLogs.filter(log => new Date(log.timestamp) >= threeDaysAgo);
  const threeDayProfitLoss = threeDayLogs.reduce((sum, log) => sum + (log.profit || 0), 0);
  
  // 计算7天盈亏
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sevenDayLogs = accountLogs.filter(log => new Date(log.timestamp) >= sevenDaysAgo);
  const sevenDayProfitLoss = sevenDayLogs.reduce((sum, log) => sum + (log.profit || 0), 0);
  
  // 更新显示
  document.getElementById('logAccountBalance').textContent = `$${currentAccount.balance.toFixed(2)}`;
  
  const totalEl = document.getElementById('logTotalProfitLoss');
  totalEl.textContent = `$${totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}`;
  totalEl.className = `text-xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`;
  
  const threeDayEl = document.getElementById('log3DayProfitLoss');
  threeDayEl.textContent = `$${threeDayProfitLoss >= 0 ? '+' : ''}${threeDayProfitLoss.toFixed(2)}`;
  threeDayEl.className = `text-xl font-bold ${threeDayProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`;
  
  const sevenDayEl = document.getElementById('log7DayProfitLoss');
  sevenDayEl.textContent = `$${sevenDayProfitLoss >= 0 ? '+' : ''}${sevenDayProfitLoss.toFixed(2)}`;
  sevenDayEl.className = `text-xl font-bold ${sevenDayProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`;
}

// 日志Tab切换
function switchLogTab(tab) {
  currentLogTab = tab;
  
  const simulatedBtn = document.getElementById('logTabSimulated');
  const liveBtn = document.getElementById('logTabLive');
  
  if (tab === 'simulated') {
    simulatedBtn.className = 'px-4 py-2 rounded-lg text-sm font-medium transition bg-indigo-600 text-white';
    liveBtn.className = 'px-4 py-2 rounded-lg text-sm font-medium transition bg-gray-200 text-gray-700 hover:bg-gray-300';
  } else {
    simulatedBtn.className = 'px-4 py-2 rounded-lg text-sm font-medium transition bg-gray-200 text-gray-700 hover:bg-gray-300';
    liveBtn.className = 'px-4 py-2 rounded-lg text-sm font-medium transition bg-indigo-600 text-white';
  }
  
  refreshTradeLogsDisplay();
}

// ==================== 一键清仓功能 ====================

// 打开一键清仓模态框
function openCloseAllModal() {
  console.log('🔴 [一键清仓] 点击了一键清仓按钮');
  console.log('当前账户:', currentAccount);
  console.log('当前持仓:', currentPositions);
  
  if (!currentAccount) {
    console.warn('⚠️ [一键清仓] 未选择账户');
    showStatus('请先选择账户', 'error');
    return;
  }
  
  if (currentPositions.length === 0) {
    console.warn('⚠️ [一键清仓] 无持仓');
    showStatus('当前没有持仓需要平仓', 'info');
    return;
  }
  
  console.log(`📋 [一键清仓] 准备平仓 ${currentPositions.length} 个持仓`);
  
  // 显示将要平仓的持仓列表
  const listEl = document.getElementById('closeAllPositionsList');
  if (!listEl) {
    console.error('❌ [一键清仓] 找不到 closeAllPositionsList 元素');
    return;
  }
  
  listEl.innerHTML = `
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <p class="text-sm font-medium text-yellow-800 mb-2">
        <i class="fas fa-list mr-2"></i>将要平仓的持仓（${currentPositions.length}个）:
      </p>
      <div class="space-y-1">
        ${currentPositions.map(pos => `
          <div class="text-xs text-yellow-700 flex justify-between">
            <span>${pos.symbol} ${pos.side === 'long' ? '做多' : '做空'}</span>
            <span>数量: ${pos.quantity} | 开仓价: $${pos.entryPrice}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // 清空密码输入
  const passwordInput = document.getElementById('closeAllPassword');
  if (passwordInput) {
    passwordInput.value = '';
  }
  
  // 显示模态框
  const modal = document.getElementById('closeAllModal');
  if (!modal) {
    console.error('❌ [一键清仓] 找不到 closeAllModal 元素');
    return;
  }
  
  modal.classList.remove('hidden');
  console.log('✅ [一键清仓] 模态框已显示');
}

// 关闭一键清仓模态框
function closeCloseAllModal() {
  document.getElementById('closeAllModal').classList.add('hidden');
}

// 确认一键清仓
async function confirmCloseAllPositions() {
  console.log('🔐 [一键清仓] 开始确认清仓操作');
  
  const passwordInput = document.getElementById('closeAllPassword');
  if (!passwordInput) {
    console.error('❌ [一键清仓] 找不到密码输入框');
    showStatus('系统错误：找不到密码输入框', 'error');
    return;
  }
  
  const password = passwordInput.value;
  console.log(`🔐 [一键清仓] 输入密码长度: ${password.length}, 期望密码: ${closeAllPassword}`);
  
  // 验证密码
  if (password !== closeAllPassword) {
    console.warn('⚠️ [一键清仓] 密码错误');
    showStatus('密码错误，请重新输入', 'error');
    passwordInput.value = '';
    passwordInput.focus();
    return;
  }
  
  console.log('✅ [一键清仓] 密码正确，开始执行清仓');
  
  try {
    // 逐个平仓
    console.log(`📊 [一键清仓] 开始平仓 ${currentPositions.length} 个持仓`);
    for (const position of currentPositions) {
      // 模拟市价平仓
      const currentPrice = position.entryPrice * (1 + (Math.random() - 0.5) * 0.01); // 模拟市场价格波动
      
      const profit = position.side === 'long' 
        ? (currentPrice - position.entryPrice) * position.quantity * position.leverage
        : (position.entryPrice - currentPrice) * position.quantity * position.leverage;
      
      const fee = currentPrice * position.quantity * currentAccount.tradingFeeRate;
      const netProfit = profit - fee;
      
      // 更新账户余额
      currentAccount.balance += netProfit;
      
      // 记录交易日志
      logTrade({
        accountId: currentAccount.id,
        symbol: position.symbol,
        strategy: '一键清仓',
        direction: position.side,
        openPrice: position.entryPrice,
        openQty: position.quantity,
        openFilledPrice: position.entryPrice,
        openFilledQty: position.quantity,
        closePrice: currentPrice,
        closeQty: position.quantity,
        closeFilledPrice: currentPrice,
        closeFilledQty: position.quantity,
        profit: netProfit,
        balance: currentAccount.balance
      });
    }
    
    // 清空持仓
    currentPositions = [];
    
    // 保存账户
    saveAccounts();
    
    // 更新显示
    refreshAccountData();
    
    // 关闭模态框
    closeCloseAllModal();
    
    showStatus('✅ 一键清仓成功，已平仓所有持仓', 'success');
  } catch (error) {
    console.error('一键清仓失败:', error);
    showStatus('一键清仓失败: ' + error.message, 'error');
  }
}

// ==================== 信号执行功能 ====================

let currentExecutingSignal = null;

// 打开执行信号模态框
function openExecuteSignalModal(signal) {
  if (!currentAccount) {
    showStatus('请先选择账户', 'error');
    return;
  }
  
  currentExecutingSignal = signal;
  
  // 获取账户的自动交易配置
  const autoConfig = currentAccount.auto_trading_config || {};
  const maxPositionValue = autoConfig.max_position_value || currentAccount.max_position_value;
  const singleTradeLimit = autoConfig.single_trade_limit || currentAccount.single_trade_limit;
  const positionSplits = autoConfig.position_splits || currentAccount.position_splits || 1;
  const forceProtection = autoConfig.force_protection_balance || currentAccount.force_protection_balance;
  
  // 获取策略配置
  const strategyConfig = signal.strategy_config || {};
  const leverage = strategyConfig.leverage || 1; // 默认1倍杠杆
  const stopLoss = strategyConfig.stop_loss_pct;
  const takeProfit = strategyConfig.take_profit_pct;
  
  // 计算建议交易金额
  let suggestedAmount = 100;
  if (singleTradeLimit) {
    suggestedAmount = singleTradeLimit;
  } else if (maxPositionValue && positionSplits) {
    suggestedAmount = Math.floor(maxPositionValue / positionSplits);
  }
  
  // 显示信号详情
  const detailsEl = document.getElementById('executeSignalDetails');
  detailsEl.innerHTML = `
    <!-- 基本信号信息 -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 mb-4">
      <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <i class="fas fa-signal mr-2 text-blue-600"></i>信号详情
      </h4>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-600">币种:</span>
          <span class="font-bold text-gray-900 ml-2">${signal.symbol}</span>
        </div>
        <div>
          <span class="text-gray-600">信号:</span>
          ${signal.signal_type === 'BUY' 
            ? '<span class="ml-2 px-2 py-1 rounded bg-green-100 text-green-700 font-medium text-xs">做多</span>'
            : '<span class="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 font-medium text-xs">做空</span>'}
        </div>
        <div>
          <span class="text-gray-600">操作:</span>
          ${signal.action === 'OPEN'
            ? '<span class="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium text-xs">开仓</span>'
            : '<span class="ml-2 px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium text-xs">平仓</span>'}
        </div>
        <div>
          <span class="text-gray-600">策略:</span>
          <span class="font-medium text-gray-900 ml-2">${signal.strategy_name}</span>
        </div>
        <div>
          <span class="text-gray-600">当前价格:</span>
          <span class="font-bold text-gray-900 ml-2">$${signal.price.toFixed(4)}</span>
        </div>
        <div>
          <span class="text-gray-600">杠杆倍数:</span>
          <span class="font-bold text-purple-600 ml-2">${leverage}x</span>
        </div>
        <div class="col-span-2">
          <span class="text-gray-600">信号原因:</span>
          <span class="text-gray-700 ml-2 text-xs">${signal.reason}</span>
        </div>
      </div>
    </div>
    
    <!-- 策略风控参数 -->
    ${stopLoss || takeProfit ? `
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 mb-4">
      <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <i class="fas fa-shield-alt mr-2 text-green-600"></i>策略风控
      </h4>
      <div class="grid grid-cols-2 gap-3 text-sm">
        ${stopLoss ? `
        <div class="flex items-center">
          <i class="fas fa-arrow-down text-red-500 mr-2"></i>
          <span class="text-gray-600">止损:</span>
          <span class="font-bold text-red-600 ml-2">${stopLoss}%</span>
        </div>
        ` : ''}
        ${takeProfit ? `
        <div class="flex items-center">
          <i class="fas fa-arrow-up text-green-500 mr-2"></i>
          <span class="text-gray-600">止盈:</span>
          <span class="font-bold text-green-600 ml-2">${takeProfit}%</span>
        </div>
        ` : ''}
        ${strategyConfig.position_splits ? `
        <div class="flex items-center">
          <i class="fas fa-layer-group text-blue-500 mr-2"></i>
          <span class="text-gray-600">分批:</span>
          <span class="font-bold text-blue-600 ml-2">${strategyConfig.position_splits}次</span>
        </div>
        ` : ''}
        ${strategyConfig.split_interval_pct ? `
        <div class="flex items-center">
          <i class="fas fa-percentage text-indigo-500 mr-2"></i>
          <span class="text-gray-600">加仓间隔:</span>
          <span class="font-bold text-indigo-600 ml-2">${strategyConfig.split_interval_pct}%</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    <!-- 账户配置信息 -->
    ${maxPositionValue || singleTradeLimit ? `
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
      <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <i class="fas fa-cog mr-2 text-purple-600"></i>账户配置
      </h4>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-600">当前余额:</span>
          <span class="font-bold text-green-600 ml-2">$${currentAccount.balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        ${maxPositionValue ? `
        <div>
          <span class="text-gray-600">持仓上限:</span>
          <span class="font-bold text-gray-900 ml-2">$${maxPositionValue.toLocaleString('en-US')}</span>
        </div>
        ` : ''}
        ${singleTradeLimit ? `
        <div>
          <span class="text-gray-600">单次上限:</span>
          <span class="font-bold text-blue-600 ml-2">$${singleTradeLimit.toLocaleString('en-US')}</span>
        </div>
        ` : ''}
        ${positionSplits > 1 ? `
        <div>
          <span class="text-gray-600">分批次数:</span>
          <span class="font-bold text-indigo-600 ml-2">${positionSplits}次</span>
        </div>
        ` : ''}
        ${forceProtection ? `
        <div>
          <span class="text-gray-600">保护金额:</span>
          <span class="font-bold text-red-600 ml-2">$${forceProtection.toLocaleString('en-US')}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
  `;
  
  // 设置建议交易金额
  document.getElementById('executeTradeAmount').value = suggestedAmount;
  
  // 显示模态框
  document.getElementById('executeSignalModal').classList.remove('hidden');
}

// 关闭执行信号模态框
function closeExecuteSignalModal() {
  document.getElementById('executeSignalModal').classList.add('hidden');
  currentExecutingSignal = null;
}

// 确认执行信号
async function confirmExecuteSignal() {
  if (!currentExecutingSignal || !currentAccount) {
    showStatus('执行信号失败', 'error');
    return;
  }
  
  const amount = parseFloat(document.getElementById('executeTradeAmount').value);
  
  if (!amount || amount <= 0) {
    showStatus('请输入有效的交易金额', 'error');
    return;
  }
  
  try {
    const signal = currentExecutingSignal;
    showStatus('正在执行交易...', 'info');
    
    // 获取杠杆倍数
    const strategyConfig = signal.strategy_config || {};
    const leverage = strategyConfig.leverage || 1;
    
    // 计算交易数量
    const quantity = amount / signal.price;
    
    // 调用后端API执行交易
    const tradeData = {
      account_id: currentAccount.id,
      symbol: signal.symbol,
      position_type: signal.signal_type === 'BUY' ? 'LONG' : 'SHORT',
      entry_price: signal.price,
      quantity: quantity,
      leverage: leverage, // 添加杠杆倍数
      signal_source: signal.strategy_name || 'SIGNAL_POOL',
      notes: `信号池执行: ${signal.reason || signal.strategy_name} | 杠杆: ${leverage}x`
    };
    
    console.log('🔄 [信号池执行] 提交交易数据:', tradeData);
    
    const response = await axios.post('/api/simulated/trades/open', tradeData);
    
    console.log('✅ [信号池执行] 交易成功:', response.data);
    showStatus('交易执行成功！', 'success');
    
    // 关闭模态框
    closeExecuteSignalModal();
    
    // 刷新账户数据
    await refreshAccountData();
    
  } catch (error) {
    console.error('❌ [信号池执行] 交易失败:', error);
    showStatus('执行信号失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ==================== 初始化新功能 ====================

// 初始化交易日志系统
function initTradeLogsSystem() {
  console.log('🔧 [Init] 开始初始化交易日志系统...');
  
  // 加载日志
  loadTradeLogs();
  
  // 绑定Tab切换
  const logTabSimulated = document.getElementById('logTabSimulated');
  const logTabLive = document.getElementById('logTabLive');
  
  if (logTabSimulated) {
    logTabSimulated.addEventListener('click', () => switchLogTab('simulated'));
    console.log('✅ [Init] 已绑定模拟交易日志Tab');
  } else {
    console.warn('⚠️ [Init] 找不到 logTabSimulated 元素');
  }
  
  if (logTabLive) {
    logTabLive.addEventListener('click', () => switchLogTab('live'));
    console.log('✅ [Init] 已绑定实盘交易日志Tab');
  } else {
    console.warn('⚠️ [Init] 找不到 logTabLive 元素');
  }
  
  // 绑定一键清仓按钮
  const closeAllBtn = document.getElementById('closeAllPositionsBtn');
  console.log('🔍 [Init] 查找一键清仓按钮:', closeAllBtn);
  if (closeAllBtn) {
    closeAllBtn.addEventListener('click', (e) => {
      console.log('🖱️ [Event] 一键清仓按钮被点击', e);
      openCloseAllModal();
    });
    console.log('✅ [Init] 已绑定一键清仓按钮');
  } else {
    console.error('❌ [Init] 找不到 closeAllPositionsBtn 元素');
    console.log('📝 [Debug] 当前页面所有带id的button元素:', 
      Array.from(document.querySelectorAll('button[id]')).map(b => b.id)
    );
  }
  
  // 初始显示
  refreshTradeLogsDisplay();
  refreshLogStatistics();
  
  console.log('✅ [Init] 交易日志系统初始化完成');
}

// ========================================
// 🆕 策略配置面板功能（方案B）
// ========================================

// 全局变量：存储所有策略配置
let allStrategiesData = [];
let showingAllStrategies = false; // 默认显示活跃信号策略

// 加载所有策略配置
async function loadAllStrategiesConfig() {
  console.log('📊 [策略配置] 开始加载所有策略...');
  try {
    const response = await API.get('/api/strategies/all', {
      priority: API_PRIORITY.HIGH,
      cache: true
    });
    
    if (response.data.success) {
      allStrategiesData = response.data.strategies || [];
      console.log(`✅ [策略配置] 成功加载 ${allStrategiesData.length} 个策略`);
      
      // 如果当前显示的是全部策略模式，则渲染
      if (showingAllStrategies) {
        renderAllStrategiesPanel();
      }
    } else {
      console.error('❌ [策略配置] 加载失败:', response.data.error);
    }
  } catch (error) {
    console.error('❌ [策略配置] 加载异常:', error);
  }
}

// 渲染全部策略配置面板
function renderAllStrategiesPanel() {
  console.log('📋 [策略配置] 渲染全部策略面板');
  
  const container = document.getElementById('activeStrategiesConfig');
  const listEl = document.getElementById('strategiesConfigList');
  
  if (allStrategiesData.length === 0) {
    listEl.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500">
        <i class="fas fa-exclamation-circle text-3xl mb-2"></i>
        <p>暂无策略配置</p>
        <p class="text-sm mt-1">请先在数据库中初始化策略</p>
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }
  
  container.classList.remove('hidden');
  
  // 渲染所有策略卡片
  listEl.innerHTML = allStrategiesData.map(strategy => {
    const priorityBadge = getLevelBadge(strategy.priority);
    
    // 构建配置对象
    const config = {
      position_splits: strategy.position_splits,
      split_interval_pct: strategy.split_interval_pct,
      max_position_size: strategy.max_position_size,
      max_holding_periods: strategy.max_holding_periods,
      stop_loss_pct: strategy.stop_loss_pct,
      take_profit_pct: strategy.take_profit_pct,
      entry_signal_type: strategy.entry_signal_type,
      entry_price_type: strategy.entry_price_type,
      entry_specified_price: strategy.entry_specified_price,
      exit_signal_type: strategy.exit_signal_type,
      exit_signals_json: strategy.exit_signals_json,
      exit_price_type: strategy.exit_price_type,
      exit_specified_price: strategy.exit_specified_price,
      allowed_coin_levels: strategy.allowed_coin_levels,
      include_historical_levels: strategy.include_historical_levels,
      daily_gain_condition_operator: strategy.daily_gain_condition_operator,
      daily_gain_condition_value: strategy.daily_gain_condition_value
    };
    
    return `
      <div class="bg-white rounded-lg p-4 border-2 border-indigo-200 shadow-md hover:shadow-lg transition">
        <!-- 策略标题 -->
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <div class="flex items-center">
            <i class="fas fa-chess-knight mr-2 text-indigo-600"></i>
            <div class="font-bold text-gray-900 text-sm">${strategy.strategy_name}</div>
            <span class="ml-2 text-xs px-2 py-0.5 rounded ${
              strategy.strategy_type === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }">${strategy.strategy_type === 'long' ? '做多' : '做空'}</span>
          </div>
          ${priorityBadge}
        </div>
        
        ${strategy.description ? `
          <div class="mb-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <i class="fas fa-info-circle mr-1 text-blue-500"></i>${strategy.description}
          </div>
        ` : ''}
        
        <!-- 配置详情 -->
        <div class="space-y-2">
          <!-- 持仓管理 -->
          <div class="bg-blue-50 rounded p-2">
            <div class="text-xs font-semibold text-blue-700 mb-1 flex items-center">
              <i class="fas fa-coins mr-1"></i>持仓管理
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.position_splits ? `<div class="flex justify-between"><span><i class="fas fa-layer-group mr-1 text-blue-500"></i>分批次数:</span><span class="font-semibold">${config.position_splits}次</span></div>` : '<div class="text-gray-400">未配置分批</div>'}
              ${config.split_interval_pct ? `<div class="flex justify-between"><span><i class="fas fa-arrows-alt-h mr-1 text-green-500"></i>加仓间隔:</span><span class="font-semibold">${config.split_interval_pct}%</span></div>` : ''}
              ${config.max_position_size ? `<div class="flex justify-between"><span><i class="fas fa-percentage mr-1 text-purple-500"></i>最大仓位:</span><span class="font-semibold">${config.max_position_size}%</span></div>` : ''}
              ${config.max_holding_periods ? `<div class="flex justify-between"><span><i class="fas fa-clock mr-1 text-orange-500"></i>持仓周期:</span><span class="font-semibold">${config.max_holding_periods}期</span></div>` : ''}
            </div>
          </div>
          
          <!-- 风控参数 -->
          <div class="bg-green-50 rounded p-2">
            <div class="text-xs font-semibold text-green-700 mb-1 flex items-center">
              <i class="fas fa-shield-alt mr-1"></i>风控参数
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.stop_loss_pct ? `<div class="flex justify-between"><span><i class="fas fa-arrow-down mr-1 text-red-500"></i>止损:</span><span class="font-semibold text-red-600">${config.stop_loss_pct}%</span></div>` : '<div class="text-gray-400">未设置止损</div>'}
              ${config.take_profit_pct ? `<div class="flex justify-between"><span><i class="fas fa-arrow-up mr-1 text-green-500"></i>止盈:</span><span class="font-semibold text-green-600">${config.take_profit_pct}%</span></div>` : '<div class="text-gray-400">未设置止盈</div>'}
            </div>
          </div>
          
          <!-- 买卖点配置 -->
          <div class="bg-yellow-50 rounded p-2">
            <div class="text-xs font-semibold text-yellow-700 mb-1 flex items-center">
              <i class="fas fa-key mr-1"></i>买卖点配置
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              <!-- 买点信号 -->
              ${config.entry_signal_type ? `
                <div class="mb-2">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-green-600"><i class="fas fa-arrow-up mr-1"></i>买点:</span>
                    <span class="font-mono text-xs bg-green-100 px-2 py-0.5 rounded border border-green-300">${config.entry_signal_type}</span>
                  </div>
                  ${config.entry_price_type ? `<div class="flex justify-between text-xs"><span class="text-gray-500">价格类型:</span><span class="font-semibold">${
                    config.entry_price_type === 'high' ? '最高价' :
                    config.entry_price_type === 'low' ? '最低价' :
                    config.entry_price_type === 'open' ? '开盘价' :
                    config.entry_price_type === 'close' ? '收盘价' :
                    config.entry_price_type === 'specified' ? '指定价格' : '不限'
                  }</span></div>` : ''}
                  ${config.entry_specified_price ? `<div class="flex justify-between text-xs"><span class="text-gray-500">指定价格:</span><span class="font-semibold text-blue-600">$${config.entry_specified_price}</span></div>` : ''}
                </div>
              ` : '<div class="text-gray-400 mb-2">未配置买点</div>'}
              
              <!-- 卖点信号 -->
              ${config.exit_signal_type || config.exit_signals_json ? `
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-red-600"><i class="fas fa-arrow-down mr-1"></i>卖点:</span>
                    ${config.exit_signals_json ? `<span class="font-mono text-xs bg-red-100 px-2 py-0.5 rounded border border-red-300">${(() => {
                      try {
                        const exits = JSON.parse(config.exit_signals_json);
                        return exits.length + '个';
                      } catch(e) {
                        return config.exit_signal_type || '未配置';
                      }
                    })()}</span>` : `<span class="font-mono text-xs bg-red-100 px-2 py-0.5 rounded border border-red-300">${config.exit_signal_type}</span>`}
                  </div>
                  ${config.exit_signals_json ? `<div class="text-xs text-gray-600 pl-2">${(() => {
                    try {
                      const exits = JSON.parse(config.exit_signals_json);
                      return exits.map(e => '• ' + e).join('<br>');
                    } catch(e) {
                      return config.exit_signal_type || '';
                    }
                  })()}</div>` : ''}
                  ${config.exit_price_type ? `<div class="flex justify-between text-xs mt-1"><span class="text-gray-500">价格类型:</span><span class="font-semibold">${
                    config.exit_price_type === 'unlimited' ? '不限' :
                    config.exit_price_type === 'specified' ? '指定价格' : config.exit_price_type
                  }</span></div>` : ''}
                  ${config.exit_specified_price ? `<div class="flex justify-between text-xs"><span class="text-gray-500">指定价格:</span><span class="font-semibold text-blue-600">$${config.exit_specified_price}</span></div>` : ''}
                </div>
              ` : '<div class="text-gray-400">未配置卖点</div>'}
            </div>
          </div>
          
          <!-- 币种筛选条件 -->
          <div class="bg-purple-50 rounded p-2">
            <div class="text-xs font-semibold text-purple-700 mb-1 flex items-center">
              <i class="fas fa-filter mr-1"></i>币种筛选
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.allowed_coin_levels ? `<div class="flex justify-between"><span>允许等级:</span><span class="font-semibold">${(() => {
                try {
                  const levels = JSON.parse(config.allowed_coin_levels);
                  return levels.join(', ') + '级';
                } catch(e) {
                  return config.allowed_coin_levels;
                }
              })()}</span></div>` : '<div class="text-gray-400">未设置币种等级限制</div>'}
              ${config.include_historical_levels !== null && config.include_historical_levels !== undefined ? `<div class="flex justify-between"><span>包含历史等级:</span><span class="font-semibold">${config.include_historical_levels ? '是' : '否'}</span></div>` : ''}
            </div>
          </div>
          
          <!-- 开仓涨幅条件 -->
          <div class="bg-pink-50 rounded p-2">
            <div class="text-xs font-semibold text-pink-700 mb-1 flex items-center">
              <i class="fas fa-chart-line mr-1"></i>开仓涨幅条件
            </div>
            <div class="space-y-1 text-xs text-gray-700">
              ${config.daily_gain_condition_operator && config.daily_gain_condition_value !== null ? `
                <div class="flex justify-between">
                  <span>当天涨幅:</span>
                  <span class="font-semibold">${config.daily_gain_condition_operator === '>' ? '>' : config.daily_gain_condition_operator === '<' ? '<' : config.daily_gain_condition_operator === '>=' ? '≥' : config.daily_gain_condition_operator === '<=' ? '≤' : '='} ${config.daily_gain_condition_value}%</span>
                </div>
              ` : '<div class="text-gray-400">未设置涨幅条件</div>'}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 切换显示模式（活跃信号 vs 全部策略）
function toggleStrategyDisplayMode() {
  showingAllStrategies = !showingAllStrategies;
  
  const toggleBtn = document.getElementById('toggleStrategyModeBtn');
  const modeLabel = document.getElementById('strategyModeLabel');
  
  if (showingAllStrategies) {
    // 切换到"全部策略"模式
    toggleBtn.innerHTML = '<i class="fas fa-signal mr-2"></i>切换到活跃信号';
    toggleBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    toggleBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
    modeLabel.innerHTML = '<i class="fas fa-list mr-2"></i>策略配置总览（所有策略）';
    
    // 渲染全部策略
    renderAllStrategiesPanel();
  } else {
    // 切换到"活跃信号"模式
    toggleBtn.innerHTML = '<i class="fas fa-cogs mr-2"></i>查看全部策略';
    toggleBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
    toggleBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    modeLabel.innerHTML = '<i class="fas fa-fire mr-2"></i>活跃策略配置（当前有信号）';
    
    // 渲染活跃信号策略
    if (signalPoolData.originalSignals && signalPoolData.originalSignals.length > 0) {
      renderActiveStrategies(signalPoolData.originalSignals);
    }
  }
  
  console.log(`🔄 [策略配置] 切换显示模式: ${showingAllStrategies ? '全部策略' : '活跃信号'}`);
}

// 初始化策略配置面板功能
function initStrategyConfigPanel() {
  console.log('🎯 [策略配置] 初始化策略配置面板功能');
  
  // 绑定切换按钮
  const toggleBtn = document.getElementById('toggleStrategyModeBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleStrategyDisplayMode);
    console.log('✅ [策略配置] 已绑定切换按钮');
  } else {
    console.warn('⚠️  [策略配置] 找不到切换按钮');
  }
  
  // 加载所有策略配置
  loadAllStrategiesConfig();
}

