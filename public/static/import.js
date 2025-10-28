// 全局变量
let parsedData = [];
let currentDate = '';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  today.setHours(today.getHours() + 8); // 转换为北京时间
  const dateStr = today.toISOString().split('T')[0];
  document.getElementById('importDate').value = dateStr;
  currentDate = dateStr;
});

// 解析并预览数据
function parseAndPreview() {
  const dateInput = document.getElementById('importDate').value;
  const dataInput = document.getElementById('dataInput').value.trim();
  
  if (!dateInput) {
    showError('请选择日期');
    return;
  }
  
  if (!dataInput) {
    showError('请输入数据');
    return;
  }
  
  currentDate = dateInput;
  
  try {
    // 解析数据
    const lines = dataInput.split('\n').filter(line => line.trim());
    parsedData = [];
    
    for (let line of lines) {
      // 支持Tab或逗号分隔
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      
      if (parts.length < 7) {
        showError(`数据格式错误，每行至少需要7个字段，当前行：${line}`);
        return;
      }
      
      const coin = {
        symbol: parts[0].trim(),
        high_price: parseFloat(parts[1].trim()),
        low_price: parseFloat(parts[2].trim()),
        total_surges: parseInt(parts[3].trim()) || 0,
        total_crashes: parseInt(parts[4].trim()) || 0,
        new_high_count: parseInt(parts[5].trim()) || 0,
        new_low_count: parseInt(parts[6].trim()) || 0
      };
      
      // 验证数据
      if (!coin.symbol || isNaN(coin.high_price) || isNaN(coin.low_price)) {
        showError(`数据格式错误：${line}`);
        return;
      }
      
      parsedData.push(coin);
    }
    
    // 显示预览
    renderPreview();
    document.getElementById('previewSection').classList.remove('hidden');
    
  } catch (error) {
    showError('解析数据失败：' + error.message);
  }
}

// 渲染预览表格
function renderPreview() {
  const tbody = document.getElementById('previewTableBody');
  
  tbody.innerHTML = parsedData.map((coin, index) => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="py-3 px-3 font-bold text-gray-800">${coin.symbol}</td>
      <td class="py-3 px-3 text-center text-green-600">${coin.high_price.toFixed(6)}</td>
      <td class="py-3 px-3 text-center text-red-600">${coin.low_price.toFixed(6)}</td>
      <td class="py-3 px-3 text-center">${coin.total_surges}</td>
      <td class="py-3 px-3 text-center">${coin.total_crashes}</td>
      <td class="py-3 px-3 text-center">${coin.new_high_count}</td>
      <td class="py-3 px-3 text-center">${coin.new_low_count}</td>
    </tr>
  `).join('');
}

// 提交数据
async function submitData() {
  if (parsedData.length === 0) {
    showError('没有可导入的数据');
    return;
  }
  
  try {
    showLoading('正在导入数据...');
    
    // 准备更新数据
    const updates = parsedData.map(coin => ({
      symbol: coin.symbol,
      total_surges: coin.total_surges,
      total_crashes: coin.total_crashes,
      new_high_count: coin.new_high_count,
      new_low_count: coin.new_low_count
    }));
    
    // 发送到服务器
    const response = await fetch('/api/correct/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        date: currentDate, 
        updates 
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess(`成功导入 ${parsedData.length} 条数据！`);
      
      // 同时更新价格极值
      await updatePriceExtremes(parsedData);
      
      // 清空输入
      setTimeout(() => {
        document.getElementById('dataInput').value = '';
        document.getElementById('previewSection').classList.add('hidden');
        parsedData = [];
      }, 2000);
    } else {
      showError('导入失败：' + result.error);
    }
  } catch (error) {
    showError('导入失败：' + error.message);
  }
}

// 更新价格极值
async function updatePriceExtremes(coins) {
  for (const coin of coins) {
    try {
      // 更新最高价
      await fetch('/api/price/extreme/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: coin.symbol,
          type: 'high',
          price: coin.high_price
        })
      });
      
      // 更新最低价
      await fetch('/api/price/extreme/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: coin.symbol,
          type: 'low',
          price: coin.low_price
        })
      });
    } catch (error) {
      console.error(`更新 ${coin.symbol} 价格极值失败:`, error);
    }
  }
}

// 取消预览
function cancelPreview() {
  document.getElementById('previewSection').classList.add('hidden');
  parsedData = [];
}

// 清空输入
function clearInput() {
  document.getElementById('dataInput').value = '';
  document.getElementById('previewSection').classList.add('hidden');
  parsedData = [];
}

// 显示加载状态
function showLoading(message) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.className = 'bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded';
  statusDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-spinner fa-spin mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  statusDiv.classList.remove('hidden');
}

// 显示成功消息
function showSuccess(message) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded';
  statusDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-check-circle mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  statusDiv.classList.remove('hidden');
  
  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 3000);
}

// 显示错误消息
function showError(message) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.className = 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded';
  statusDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-exclamation-circle mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  statusDiv.classList.remove('hidden');
  
  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 5000);
}
