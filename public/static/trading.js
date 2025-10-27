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
