// 全局状态
let positions = [];
let currentEditId = null;
let autoRefreshInterval = null;
let countdown = 30;
let countdownInterval = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadPositions();
  
  // 绑定按钮事件
  document.getElementById('addPositionBtn').addEventListener('click', openAddModal);
  document.getElementById('checkAlertsBtn').addEventListener('click', checkAlerts);
  document.getElementById('refreshBtn').addEventListener('click', loadPositions);
  document.getElementById('positionForm').addEventListener('submit', savePosition);
  
  // 启动自动刷新（30秒）
  startAutoRefresh();
});

// 启动自动刷新
function startAutoRefresh() {
  // 设置30秒自动刷新
  autoRefreshInterval = setInterval(() => {
    loadPositions();
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

// 加载持仓列表
async function loadPositions() {
  try {
    showStatus('加载中...', 'info');
    const response = await axios.get('/api/positions');
    positions = response.data.positions || [];
    
    renderPositions();
    updateStats();
    showStatus('数据加载成功', 'success');
    
    // 重置倒计时
    resetCountdown();
    
    // 2秒后隐藏状态消息
    setTimeout(() => {
      document.getElementById('statusMessage').classList.add('hidden');
    }, 2000);
  } catch (error) {
    console.error('加载持仓失败:', error);
    showStatus('加载失败: ' + error.message, 'error');
  }
}

// 渲染持仓列表
function renderPositions() {
  const tbody = document.getElementById('positionsTable');
  
  if (positions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-inbox mr-2"></i>暂无持仓数据，点击"添加持仓"开始追踪
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = positions.map(pos => {
    const isLong = pos.position_type === 'LONG';
    const directionBadge = isLong 
      ? '<span class="long-badge">多单 🟢</span>' 
      : '<span class="short-badge">空单 🔴</span>';
    
    // 计算盈亏 (需要获取当前价格，暂时显示为 -)
    const profitDisplay = pos.current_price 
      ? calculateProfit(pos) 
      : '<span class="text-gray-400">-</span>';
    
    const currentPriceDisplay = pos.current_price 
      ? `$${pos.current_price.toFixed(4)}` 
      : '<span class="text-gray-400">-</span>';
    
    const quantityDisplay = pos.quantity > 0 
      ? pos.quantity.toFixed(4) 
      : '<span class="text-gray-400">-</span>';
    
    const stopLossDisplay = pos.stop_loss 
      ? `$${pos.stop_loss.toFixed(4)}` 
      : '<span class="text-gray-400">-</span>';
    
    const takeProfitDisplay = pos.take_profit 
      ? `$${pos.take_profit.toFixed(4)}` 
      : '<span class="text-gray-400">-</span>';
    
    // 预警状态
    const alertStatus = pos.alert_count > 0 
      ? `<span class="${isLong ? 'alert-top' : 'alert-bottom'} alert-badge">${pos.alert_count}次预警</span>`
      : '<span class="text-gray-400">无预警</span>';
    
    const entryTime = new Date(pos.entry_time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <tr class="position-row">
        <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${pos.symbol}</td>
        <td class="px-6 py-4 whitespace-nowrap">${directionBadge}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">$${pos.entry_price.toFixed(4)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">${currentPriceDisplay}</td>
        <td class="px-6 py-4 whitespace-nowrap">${profitDisplay}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">${quantityDisplay}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-700">
          <div class="text-sm">${stopLossDisplay} / ${takeProfitDisplay}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">${alertStatus}</td>
        <td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">${entryTime}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <button onclick="editPosition(${pos.id})" class="text-blue-600 hover:text-blue-800 mr-3">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="closePosition(${pos.id})" class="text-green-600 hover:text-green-800 mr-3">
            <i class="fas fa-check-circle"></i>
          </button>
          <button onclick="deletePosition(${pos.id})" class="text-red-600 hover:text-red-800">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 计算盈亏
function calculateProfit(pos) {
  if (!pos.current_price) return '<span class="text-gray-400">-</span>';
  
  let profitPercent;
  if (pos.position_type === 'LONG') {
    profitPercent = ((pos.current_price - pos.entry_price) / pos.entry_price * 100);
  } else {
    profitPercent = ((pos.entry_price - pos.current_price) / pos.entry_price * 100);
  }
  
  const profitClass = profitPercent >= 0 ? 'profit-positive' : 'profit-negative';
  const prefix = profitPercent >= 0 ? '+' : '';
  
  return `<span class="${profitClass}">${prefix}${profitPercent.toFixed(2)}%</span>`;
}

// 更新统计卡片
function updateStats() {
  const activePositions = positions.filter(p => p.status === 'ACTIVE');
  const longPositions = activePositions.filter(p => p.position_type === 'LONG');
  const shortPositions = activePositions.filter(p => p.position_type === 'SHORT');
  const totalAlerts = positions.reduce((sum, p) => sum + (p.alert_count || 0), 0);
  
  document.getElementById('activeCount').textContent = activePositions.length;
  document.getElementById('longCount').textContent = longPositions.length;
  document.getElementById('shortCount').textContent = shortPositions.length;
  document.getElementById('alertCount').textContent = totalAlerts;
}

// 打开添加模态框
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = '添加持仓';
  document.getElementById('positionForm').reset();
  document.getElementById('positionId').value = '';
  document.getElementById('positionModal').classList.remove('hidden');
}

// 打开编辑模态框
function editPosition(id) {
  const position = positions.find(p => p.id === id);
  if (!position) return;
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = '编辑持仓';
  document.getElementById('positionId').value = id;
  document.getElementById('symbol').value = position.symbol;
  document.getElementById('positionType').value = position.position_type;
  document.getElementById('entryPrice').value = position.entry_price;
  document.getElementById('quantity').value = position.quantity || '';
  document.getElementById('stopLoss').value = position.stop_loss || '';
  document.getElementById('takeProfit').value = position.take_profit || '';
  document.getElementById('notes').value = position.notes || '';
  
  document.getElementById('positionModal').classList.remove('hidden');
}

// 关闭模态框
function closePositionModal() {
  document.getElementById('positionModal').classList.add('hidden');
  document.getElementById('positionForm').reset();
  currentEditId = null;
}

// 保存持仓
async function savePosition(e) {
  e.preventDefault();
  
  const positionData = {
    symbol: document.getElementById('symbol').value.trim().toUpperCase(),
    position_type: document.getElementById('positionType').value,
    entry_price: parseFloat(document.getElementById('entryPrice').value),
    quantity: parseFloat(document.getElementById('quantity').value) || 0,
    stop_loss: parseFloat(document.getElementById('stopLoss').value) || null,
    take_profit: parseFloat(document.getElementById('takeProfit').value) || null,
    notes: document.getElementById('notes').value.trim() || null
  };
  
  try {
    if (currentEditId) {
      // 更新持仓
      await axios.put(`/api/positions/${currentEditId}`, positionData);
      showStatus('持仓更新成功', 'success');
    } else {
      // 添加持仓
      await axios.post('/api/positions', positionData);
      showStatus('持仓添加成功', 'success');
    }
    
    closePositionModal();
    loadPositions();
  } catch (error) {
    console.error('保存持仓失败:', error);
    showStatus('保存失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 平仓
async function closePosition(id) {
  if (!confirm('确认平仓？此操作不可撤销。')) return;
  
  const currentPrice = prompt('请输入平仓价格:');
  if (!currentPrice) return;
  
  try {
    await axios.post(`/api/positions/${id}/close`, {
      closed_price: parseFloat(currentPrice)
    });
    showStatus('平仓成功', 'success');
    loadPositions();
  } catch (error) {
    console.error('平仓失败:', error);
    showStatus('平仓失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 删除持仓
async function deletePosition(id) {
  if (!confirm('确认删除此持仓记录？此操作不可撤销。')) return;
  
  try {
    await axios.delete(`/api/positions/${id}`);
    showStatus('删除成功', 'success');
    loadPositions();
  } catch (error) {
    console.error('删除失败:', error);
    showStatus('删除失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// 检查预警
async function checkAlerts() {
  const btn = document.getElementById('checkAlertsBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>检查中...';
  
  try {
    showStatus('正在检查预警条件...', 'info');
    const response = await axios.get('/api/positions/check-alerts');
    
    if (response.data.success) {
      const { alerts, telegram } = response.data;
      
      if (alerts.length === 0) {
        showStatus('暂无触发预警条件的持仓', 'info');
      } else {
        const message = `检查完成！触发${alerts.length}个预警，已发送${telegram.sent}/${telegram.total}条TG消息`;
        showStatus(message, 'success');
      }
      
      // 刷新持仓列表
      setTimeout(loadPositions, 1000);
    } else {
      showStatus('检查失败: ' + response.data.error, 'error');
    }
  } catch (error) {
    console.error('检查预警失败:', error);
    showStatus('检查失败: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-bell mr-2"></i>检查预警';
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
