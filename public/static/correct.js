// 当前数据
let currentData = [];
let currentRounds = [];
let currentDate = '';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  // 设置默认日期为今天（北京时间）
  const today = new Date();
  today.setHours(today.getHours() + 8); // 转换为北京时间
  const dateStr = today.toISOString().split('T')[0];
  document.getElementById('dateInput').value = dateStr;
  
  // 自动加载今天的数据
  loadData();
});

// 加载指定日期的数据
async function loadData() {
  const dateInput = document.getElementById('dateInput').value;
  if (!dateInput) {
    showError('请选择日期');
    return;
  }
  
  currentDate = dateInput;
  document.getElementById('dataStatus').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>加载中...';
  
  try {
    // 并行加载每日统计和轮次统计
    const [dailyResponse, roundsResponse] = await Promise.all([
      fetch(`/api/correct/data?date=${dateInput}`),
      fetch(`/api/correct/rounds?date=${dateInput}`)
    ]);
    
    const dailyData = await dailyResponse.json();
    const roundsData = await roundsResponse.json();
    
    if (dailyData.success) {
      currentData = dailyData.data;
      renderTable(currentData);
      updateTotals(currentData);
    }
    
    if (roundsData.success) {
      currentRounds = roundsData.rounds;
      renderRoundsTable(currentRounds);
      updateRoundsTotals(currentRounds);
    }
    
    if (dailyData.success && roundsData.success) {
      document.getElementById('dataStatus').innerHTML = `<i class="fas fa-check-circle text-green-600 mr-1"></i>加载成功 (${currentData.length}条币种, ${currentRounds.length}轮)`;
    } else {
      showError('部分数据加载失败');
      document.getElementById('dataStatus').innerHTML = `<i class="fas fa-exclamation-triangle text-yellow-600 mr-1"></i>部分数据加载失败`;
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    showError('加载数据失败: ' + error.message);
    document.getElementById('dataStatus').innerHTML = `<i class="fas fa-times-circle text-red-600 mr-1"></i>加载失败`;
  }
}

// 渲染表格
function renderTable(data) {
  const tbody = document.getElementById('dataTableBody');
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p>该日期暂无数据</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = data.map(coin => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="py-3 px-3 font-bold text-gray-800">${coin.symbol}</td>
      <td class="py-3 px-3 text-center">
        <input 
          type="number" 
          value="${coin.total_surges || 0}" 
          data-symbol="${coin.symbol}" 
          data-field="total_surges"
          min="0"
          class="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </td>
      <td class="py-3 px-3 text-center">
        <input 
          type="number" 
          value="${coin.total_crashes || 0}" 
          data-symbol="${coin.symbol}" 
          data-field="total_crashes"
          min="0"
          class="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </td>
      <td class="py-3 px-3 text-center">
        <input 
          type="number" 
          value="${coin.new_high_count || 0}" 
          data-symbol="${coin.symbol}" 
          data-field="new_high_count"
          min="0"
          class="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </td>
      <td class="py-3 px-3 text-center">
        <input 
          type="number" 
          value="${coin.new_low_count || 0}" 
          data-symbol="${coin.symbol}" 
          data-field="new_low_count"
          min="0"
          class="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </td>
    </tr>
  `).join('');
  
  // 添加输入监听，实时更新总计
  const inputs = tbody.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('change', updateTotalsFromInputs);
  });
}

// 渲染轮次表格
function renderRoundsTable(rounds) {
  const tbody = document.getElementById('roundsTableBody');
  
  if (rounds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p>该日期暂无轮次数据</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = rounds.map(round => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="py-3 px-3 font-mono text-sm">${round.round_time}</td>
      <td class="py-3 px-3 text-center text-green-600">${round.green_count || 0}</td>
      <td class="py-3 px-3 text-center text-red-600">${round.red_count || 0}</td>
      <td class="py-3 px-3 text-center text-blue-600">${round.surge_count || 0}</td>
      <td class="py-3 px-3 text-center text-orange-600">${round.crash_count || 0}</td>
      <td class="py-3 px-3 text-center">
        <input 
          type="number" 
          value="${round.risk_alert_count || 0}" 
          data-round-time="${round.round_time}" 
          data-field="risk_alert_count"
          min="0"
          class="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </td>
    </tr>
  `).join('');
  
  // 添加输入监听，实时更新总计
  const inputs = tbody.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('change', updateRoundsTotalsFromInputs);
  });
}

// 从输入框实时计算总数
function updateTotalsFromInputs() {
  const inputs = document.querySelectorAll('#dataTableBody input[type="number"]');
  
  let totalSurges = 0;
  let totalCrashes = 0;
  let totalNewHighs = 0;
  let totalNewLows = 0;
  
  inputs.forEach(input => {
    const field = input.getAttribute('data-field');
    const value = parseInt(input.value) || 0;
    
    if (field === 'total_surges') totalSurges += value;
    else if (field === 'total_crashes') totalCrashes += value;
    else if (field === 'new_high_count') totalNewHighs += value;
    else if (field === 'new_low_count') totalNewLows += value;
  });
  
  document.getElementById('totalSurges').textContent = totalSurges;
  document.getElementById('totalCrashes').textContent = totalCrashes;
  document.getElementById('totalNewHighs').textContent = totalNewHighs;
  document.getElementById('totalNewLows').textContent = totalNewLows;
}

// 从轮次输入框实时计算风险提示总数
function updateRoundsTotalsFromInputs() {
  const inputs = document.querySelectorAll('#roundsTableBody input[type="number"]');
  let totalRiskAlerts = 0;
  
  inputs.forEach(input => {
    const value = parseInt(input.value) || 0;
    totalRiskAlerts += value;
  });
  
  document.getElementById('totalRiskAlerts').textContent = totalRiskAlerts;
}

// 更新总计显示
function updateTotals(data) {
  const totalSurges = data.reduce((sum, coin) => sum + (coin.total_surges || 0), 0);
  const totalCrashes = data.reduce((sum, coin) => sum + (coin.total_crashes || 0), 0);
  const totalNewHighs = data.reduce((sum, coin) => sum + (coin.new_high_count || 0), 0);
  const totalNewLows = data.reduce((sum, coin) => sum + (coin.new_low_count || 0), 0);
  
  document.getElementById('totalSurges').textContent = totalSurges;
  document.getElementById('totalCrashes').textContent = totalCrashes;
  document.getElementById('totalNewHighs').textContent = totalNewHighs;
  document.getElementById('totalNewLows').textContent = totalNewLows;
}

// 更新轮次统计总计
function updateRoundsTotals(rounds) {
  const totalRiskAlerts = rounds.reduce((sum, round) => sum + (round.risk_alert_count || 0), 0);
  document.getElementById('totalRiskAlerts').textContent = totalRiskAlerts;
}

// 保存所有修改
async function saveAllData() {
  if (!currentDate) {
    showError('请先加载数据');
    return;
  }
  
  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.innerHTML;
  
  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
    
    // 收集每日统计数据
    const dailyInputs = document.querySelectorAll('#dataTableBody input[type="number"]');
    const dailyUpdates = [];
    
    dailyInputs.forEach(input => {
      const symbol = input.getAttribute('data-symbol');
      const field = input.getAttribute('data-field');
      const value = parseInt(input.value) || 0;
      
      let update = dailyUpdates.find(u => u.symbol === symbol);
      if (!update) {
        update = { symbol, date: currentDate };
        dailyUpdates.push(update);
      }
      
      update[field] = value;
    });
    
    // 收集轮次风险提示数据
    const roundInputs = document.querySelectorAll('#roundsTableBody input[type="number"]');
    const roundUpdates = [];
    
    roundInputs.forEach(input => {
      const roundTime = input.getAttribute('data-round-time');
      const value = parseInt(input.value) || 0;
      roundUpdates.push({ round_time: roundTime, risk_alert_count: value });
    });
    
    // 并行发送两个更新请求
    const promises = [];
    
    if (dailyUpdates.length > 0) {
      promises.push(
        fetch('/api/correct/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: currentDate, updates: dailyUpdates })
        })
      );
    }
    
    if (roundUpdates.length > 0) {
      promises.push(
        fetch('/api/correct/rounds/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: roundUpdates })
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));
    
    const allSuccess = results.every(r => r.success);
    
    if (allSuccess) {
      showSuccess(`保存成功！已更新 ${dailyUpdates.length} 个币种数据和 ${roundUpdates.length} 个轮次数据`);
      // 不自动刷新，保持用户编辑的数据
      // setTimeout(() => loadData(), 500);
    } else {
      showError('保存失败: ' + results.find(r => !r.success)?.error);
    }
  } catch (error) {
    console.error('保存失败:', error);
    showError('保存失败: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

// 清空今日数据
async function resetToday() {
  const dateInput = document.getElementById('dateInput').value;
  if (!dateInput) {
    showError('请选择日期');
    return;
  }
  
  if (!confirm(`确定要清空 ${dateInput} 的所有统计数据吗？此操作不可撤销！`)) {
    return;
  }
  
  const resetBtn = document.getElementById('resetBtn');
  const originalText = resetBtn.innerHTML;
  
  try {
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>清空中...';
    
    const response = await fetch('/api/correct/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateInput })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('数据已清空！');
      // 清空操作后需要重新加载数据
      setTimeout(() => loadData(), 500);
    } else {
      showError('清空失败: ' + data.error);
    }
  } catch (error) {
    console.error('清空失败:', error);
    showError('清空失败: ' + error.message);
  } finally {
    resetBtn.disabled = false;
    resetBtn.innerHTML = originalText;
  }
}

// 显示成功消息
function showSuccess(message) {
  showMessage(message, 'success');
}

// 显示错误消息
function showError(message) {
  showMessage(message, 'error');
}

// 显示消息
function showMessage(message, type) {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`;
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
