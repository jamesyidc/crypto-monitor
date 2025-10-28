// 特征库管理系统 - 策略池
// 包含：全局交易策略、交易规则、支撑线管理、币种优先级

let currentTab = 'strategies';
let strategiesData = [];
let rulesData = [];
let supportData = [];
let priorityData = [];
let modifiedRules = new Set();
let modifiedSupport = new Set();

// ========================================
// 页面初始化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // 加载全局策略卡片
  loadStrategiesCard();
  // 默认加载策略详情标签
  switchTab('strategies');
});

// ========================================
// 标签切换
// ========================================

function switchTab(tab) {
  currentTab = tab;
  
  // 更新标签样式
  document.querySelectorAll('[id^="tab"]').forEach(btn => {
    btn.className = 'px-6 py-3 font-bold text-gray-500';
  });
  
  // 隐藏所有内容
  document.getElementById('strategiesContent').classList.add('hidden');
  document.getElementById('rulesContent').classList.add('hidden');
  document.getElementById('supportContent').classList.add('hidden');
  document.getElementById('priorityContent').classList.add('hidden');
  document.getElementById('consecutiveContent').classList.add('hidden');
  
  if (tab === 'strategies') {
    document.getElementById('tabStrategies').className = 'px-6 py-3 font-bold text-purple-600 border-b-2 border-purple-600';
    document.getElementById('strategiesContent').classList.remove('hidden');
    loadStrategiesDetail();
  } else if (tab === 'rules') {
    document.getElementById('tabRules').className = 'px-6 py-3 font-bold text-blue-600 border-b-2 border-blue-600';
    document.getElementById('rulesContent').classList.remove('hidden');
    loadTradingRules();
  } else if (tab === 'support') {
    document.getElementById('tabSupport').className = 'px-6 py-3 font-bold text-green-600 border-b-2 border-green-600';
    document.getElementById('supportContent').classList.remove('hidden');
    loadSupportLines();
  } else if (tab === 'priority') {
    document.getElementById('tabPriority').className = 'px-6 py-3 font-bold text-orange-600 border-b-2 border-orange-600';
    document.getElementById('priorityContent').classList.remove('hidden');
    loadPriority();
  } else if (tab === 'consecutive') {
    document.getElementById('tabConsecutive').className = 'px-6 py-3 font-bold text-red-600 border-b-2 border-red-600';
    document.getElementById('consecutiveContent').classList.remove('hidden');
    loadConsecutiveRise();
  }
}

// ========================================
// 全局交易策略管理
// ========================================

async function loadStrategiesCard() {
  try {
    const response = await fetch('/api/trading-strategies');
    const data = await response.json();
    
    if (data.success) {
      strategiesData = data.strategies;
      renderStrategiesCard(strategiesData);
    }
  } catch (error) {
    console.error('加载策略失败:', error);
    showError('加载策略失败');
  }
}

function renderStrategiesCard(strategies) {
  const grid = document.getElementById('strategiesGrid');
  
  if (!strategies || strategies.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-8">暂无策略配置</div>';
    return;
  }
  
  const strategyIcons = {
    'SIGNAL_BASED': 'fa-bolt',
    'RSI': 'fa-chart-line',
    'MACD': 'fa-wave-square',
    'MA': 'fa-arrows-alt-h'
  };
  
  grid.innerHTML = strategies.map(s => `
    <div class="bg-white/20 backdrop-blur rounded-lg p-4 hover:bg-white/30 transition cursor-pointer" onclick="viewStrategyDetail(${s.id})">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <i class="fas ${strategyIcons[s.strategy_type] || 'fa-cog'} text-2xl"></i>
          <span class="font-bold">${s.strategy_name}</span>
        </div>
        <div class="text-xs px-2 py-1 rounded ${s.is_active ? 'bg-green-500' : 'bg-gray-500'}">
          ${s.is_active ? '启用' : '禁用'}
        </div>
      </div>
      <p class="text-sm text-white/80">${s.description || '暂无描述'}</p>
      <div class="mt-2 text-xs text-white/60">
        类型: ${s.strategy_type}
      </div>
    </div>
  `).join('');
}

async function loadStrategiesDetail() {
  try {
    const response = await fetch('/api/trading-strategies');
    const data = await response.json();
    
    if (data.success) {
      strategiesData = data.strategies;
      renderStrategiesDetail(strategiesData);
    }
  } catch (error) {
    console.error('加载策略详情失败:', error);
    showError('加载策略详情失败');
  }
}

function renderStrategiesDetail(strategies) {
  const container = document.getElementById('strategiesDetailList');
  
  if (!strategies || strategies.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-gray-500">暂无策略配置</div>';
    return;
  }
  
  const strategyIcons = {
    'SIGNAL_BASED': 'fa-bolt',
    'RSI': 'fa-chart-line',
    'MACD': 'fa-wave-square',
    'MA': 'fa-arrows-alt-h'
  };
  
  const strategyColors = {
    'SIGNAL_BASED': 'blue',
    'RSI': 'green',
    'MACD': 'purple',
    'MA': 'orange'
  };
  
  container.innerHTML = strategies.map(s => {
    const color = strategyColors[s.strategy_type] || 'gray';
    let config = {};
    try {
      config = s.config ? JSON.parse(s.config) : {};
    } catch (e) {
      config = {};
    }
    
    return `
      <div class="border-l-4 border-${color}-500 bg-${color}-50 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <i class="fas ${strategyIcons[s.strategy_type] || 'fa-cog'} text-${color}-600 text-xl"></i>
              <h3 class="text-lg font-bold text-gray-800">${s.strategy_name}</h3>
              <span class="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">${s.strategy_type}</span>
            </div>
            <p class="text-sm text-gray-600 mb-3">${s.description || '暂无描述'}</p>
            
            ${Object.keys(config).length > 0 ? `
              <div class="bg-white rounded p-3 mb-2">
                <div class="text-xs font-bold text-gray-500 mb-2">策略配置：</div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  ${Object.entries(config).map(([key, value]) => `
                    <div class="bg-gray-50 px-2 py-1 rounded">
                      <span class="text-gray-500">${key}:</span>
                      <span class="font-bold text-gray-800">${Array.isArray(value) ? value.join(', ') : value}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            <div class="text-xs text-gray-500">
              创建时间: ${new Date(s.created_at).toLocaleString('zh-CN')}
              ${s.updated_at !== s.created_at ? ` | 更新: ${new Date(s.updated_at).toLocaleString('zh-CN')}` : ''}
            </div>
          </div>
          
          <div class="flex flex-col items-end gap-2 ml-4">
            <button 
              onclick="toggleStrategy(${s.id}, ${s.is_active ? 0 : 1})"
              class="px-4 py-2 rounded font-bold transition ${s.is_active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}">
              <i class="fas ${s.is_active ? 'fa-pause' : 'fa-play'} mr-1"></i>
              ${s.is_active ? '禁用' : '启用'}
            </button>
            <button 
              onclick="editStrategy(${s.id})"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition">
              <i class="fas fa-edit mr-1"></i>编辑
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleStrategy(id, isActive) {
  if (!confirm(`确定要${isActive ? '启用' : '禁用'}此策略吗？`)) return;
  
  try {
    const response = await fetch(`/api/trading-strategies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess(`策略已${isActive ? '启用' : '禁用'}`);
      await loadStrategiesCard();
      await loadStrategiesDetail();
    } else {
      showError(data.error || '操作失败');
    }
  } catch (error) {
    console.error('切换策略状态失败:', error);
    showError('操作失败');
  }
}

function editStrategy(id) {
  const strategy = strategiesData.find(s => s.id === id);
  if (!strategy) return;
  
  const config = strategy.config ? JSON.parse(strategy.config) : {};
  const configStr = JSON.stringify(config, null, 2);
  
  const newConfig = prompt(`编辑策略配置 (JSON格式):\n\n策略: ${strategy.strategy_name}`, configStr);
  if (!newConfig || newConfig === configStr) return;
  
  try {
    JSON.parse(newConfig); // 验证JSON格式
    updateStrategyConfig(id, newConfig);
  } catch (e) {
    alert('JSON格式错误！请检查后重试。');
  }
}

async function updateStrategyConfig(id, config) {
  try {
    const response = await fetch(`/api/trading-strategies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess('策略配置已更新');
      await loadStrategiesCard();
      await loadStrategiesDetail();
    } else {
      showError(data.error || '更新失败');
    }
  } catch (error) {
    console.error('更新策略配置失败:', error);
    showError('更新失败');
  }
}

function viewStrategyDetail(id) {
  switchTab('strategies');
  // 平滑滚动到对应策略
  setTimeout(() => {
    const element = document.querySelector(`[onclick*="toggleStrategy(${id}"]`)?.closest('.border-l-4');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-purple-300');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-purple-300');
      }, 2000);
    }
  }, 100);
}

// ========================================
// 交易规则管理
// ========================================

async function loadTradingRules() {
  try {
    const response = await fetch('/api/trading-rules');
    const data = await response.json();
    
    if (data.success) {
      rulesData = data.rules;
      renderRulesTable(rulesData);
      await loadRulesStats();
    }
  } catch (error) {
    console.error('加载交易规则失败:', error);
    showError('加载交易规则失败');
  }
}

async function loadRulesStats() {
  try {
    const response = await fetch('/api/trading-rules/stats');
    const data = await response.json();
    
    if (data.success && data.stats) {
      const stats = data.stats;
      document.getElementById('statsTotal').textContent = stats.total || 0;
      document.getElementById('statsTradingAllowed').textContent = stats.trading_allowed || 0;
      document.getElementById('statsLongAllowed').textContent = stats.long_allowed || 0;
      document.getElementById('statsShortAllowed').textContent = stats.short_allowed || 0;
      document.getElementById('statsTradingDisabled').textContent = stats.trading_disabled || 0;
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

function renderRulesTable(rules) {
  const tbody = document.getElementById('rulesTableBody');
  
  tbody.innerHTML = rules.map(rule => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="py-3 px-4 font-bold">${rule.symbol}</td>
      <td class="py-3 px-4 text-center">
        <input type="checkbox" 
               ${rule.trading_allowed ? 'checked' : ''} 
               onchange="toggleRule('${rule.symbol}', 'trading_allowed')"
               class="w-5 h-5 text-green-600 cursor-pointer" />
      </td>
      <td class="py-3 px-4 text-center">
        <input type="checkbox" 
               ${rule.long_allowed ? 'checked' : ''} 
               onchange="toggleRule('${rule.symbol}', 'long_allowed')"
               class="w-5 h-5 text-blue-600 cursor-pointer" />
      </td>
      <td class="py-3 px-4 text-center">
        <input type="checkbox" 
               ${rule.short_allowed ? 'checked' : ''} 
               onchange="toggleRule('${rule.symbol}', 'short_allowed')"
               class="w-5 h-5 text-orange-600 cursor-pointer" />
      </td>
      <td class="py-3 px-4">
        <input type="text" 
               value="${rule.notes || ''}" 
               onchange="updateRuleNote('${rule.symbol}', this.value)"
               class="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
               placeholder="备注..." />
      </td>
      <td class="py-3 px-4 text-center">
        <button onclick="saveRule('${rule.symbol}')" 
                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">
          保存
        </button>
      </td>
    </tr>
  `).join('');
}

function toggleRule(symbol, field) {
  const rule = rulesData.find(r => r.symbol === symbol);
  if (rule) {
    rule[field] = rule[field] ? 0 : 1;
    modifiedRules.add(symbol);
  }
}

function updateRuleNote(symbol, note) {
  const rule = rulesData.find(r => r.symbol === symbol);
  if (rule) {
    rule.notes = note;
    modifiedRules.add(symbol);
  }
}

async function saveRule(symbol) {
  const rule = rulesData.find(r => r.symbol === symbol);
  if (!rule) return;
  
  try {
    const response = await fetch(`/api/trading-rules/${symbol}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trading_allowed: rule.trading_allowed,
        long_allowed: rule.long_allowed,
        short_allowed: rule.short_allowed,
        notes: rule.notes
      })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess(`${symbol} 规则已保存`);
      modifiedRules.delete(symbol);
      await loadRulesStats();
    } else {
      showError(`保存失败: ${data.error}`);
    }
  } catch (error) {
    console.error('保存规则失败:', error);
    showError('保存规则失败');
  }
}

async function saveAllRules() {
  if (modifiedRules.size === 0) {
    showInfo('没有需要保存的更改');
    return;
  }
  
  const updates = Array.from(modifiedRules).map(symbol => {
    const rule = rulesData.find(r => r.symbol === symbol);
    return {
      symbol: rule.symbol,
      trading_allowed: rule.trading_allowed,
      long_allowed: rule.long_allowed,
      short_allowed: rule.short_allowed,
      notes: rule.notes
    };
  });
  
  try {
    const response = await fetch('/api/trading-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess(`已保存 ${modifiedRules.size} 个规则`);
      modifiedRules.clear();
      await loadRulesStats();
    } else {
      showError(`保存失败: ${data.error}`);
    }
  } catch (error) {
    console.error('批量保存失败:', error);
    showError('批量保存失败');
  }
}

async function quickSetReset() {
  if (!confirm('确定要重置所有规则为允许所有交易吗？')) return;
  
  try {
    const response = await fetch('/api/trading-rules/reset', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showSuccess('已重置所有规则');
      await loadTradingRules();
    }
  } catch (error) {
    showError('重置失败');
  }
}

async function quickSetDisableAll() {
  if (!confirm('确定要禁止所有币种交易吗？')) return;
  
  try {
    const response = await fetch('/api/trading-rules/disable-all', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showSuccess('已禁止所有交易');
      await loadTradingRules();
    }
  } catch (error) {
    showError('操作失败');
  }
}

async function quickSetLongOnly() {
  if (!confirm('确定要设置为仅允许做多吗？')) return;
  
  try {
    const response = await fetch('/api/trading-rules/long-only', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showSuccess('已设置为仅允许做多');
      await loadTradingRules();
    }
  } catch (error) {
    showError('操作失败');
  }
}

async function quickSetShortOnly() {
  if (!confirm('确定要设置为仅允许做空吗？')) return;
  
  try {
    const response = await fetch('/api/trading-rules/short-only', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showSuccess('已设置为仅允许做空');
      await loadTradingRules();
    }
  } catch (error) {
    showError('操作失败');
  }
}

// ========================================
// 支撑线管理
// ========================================

async function loadSupportLines() {
  try {
    // 并行加载支撑线和机会
    const [supportResponse, opportunitiesResponse, marketResponse] = await Promise.all([
      fetch('/api/support-lines'),
      fetch('/api/support-lines/opportunities'),
      fetch('/api/trading-rules/market-strategy')
    ]);
    
    const supportData = await supportResponse.json();
    const opportunitiesData = await opportunitiesResponse.json();
    const marketData = await marketResponse.json();
    
    if (supportData.success) {
      document.getElementById('supportTotal').textContent = supportData.count;
    }
    
    if (opportunitiesData.success) {
      document.getElementById('supportOpportunities').textContent = opportunitiesData.total_opportunities;
      document.getElementById('supportNearCount').textContent = opportunitiesData.near_support_count;
    }
    
    if (marketData.success) {
      document.getElementById('marketStrategy').textContent = marketData.strategy;
    }
    
    await renderSupportTable();
  } catch (error) {
    console.error('加载支撑线失败:', error);
    showError('加载支撑线失败');
  }
}

async function renderSupportTable() {
  try {
    // 获取等级1-2的币种
    const priorityResponse = await fetch('/api/coin-priority');
    const priorityData = await priorityResponse.json();
    
    const level12Coins = priorityData.coins.filter(c => c.level <= 2);
    
    // 获取当前价格
    const dashboardResponse = await fetch('/api/dashboard');
    const dashboardData = await dashboardResponse.json();
    const priceMap = {};
    dashboardData.coinDetails.forEach(coin => {
      priceMap[coin.symbol] = coin.price;
    });
    
    // 获取支撑线
    const supportResponse = await fetch('/api/support-lines');
    const supportData = await supportResponse.json();
    const supportMap = {};
    supportData.lines.forEach(line => {
      supportMap[line.symbol] = line;
    });
    
    const tbody = document.getElementById('supportTableBody');
    tbody.innerHTML = level12Coins.map(coin => {
      const currentPrice = priceMap[coin.symbol] || 0;
      const supportLine = supportMap[coin.symbol];
      const supportPrice = supportLine?.support_price || 0;
      const distance = supportPrice > 0 ? ((currentPrice - supportPrice) / supportPrice * 100) : 0;
      const isNear = Math.abs(distance) <= 1;
      
      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 ${isNear ? 'bg-green-50' : ''}">
          <td class="py-3 px-4 font-bold">${coin.symbol}</td>
          <td class="py-3 px-4 text-center">
            <span class="px-2 py-1 rounded ${coin.level === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
              等级${coin.level}
            </span>
          </td>
          <td class="py-3 px-4 text-center font-mono">${currentPrice.toFixed(4)}</td>
          <td class="py-3 px-4 text-center">
            <input type="number" 
                   value="${supportPrice}" 
                   onchange="updateSupportPrice('${coin.symbol}', this.value)"
                   class="w-24 px-2 py-1 border border-gray-300 rounded text-center" 
                   placeholder="支撑价..." 
                   step="0.01" />
          </td>
          <td class="py-3 px-4 text-center">
            <span class="font-mono ${isNear ? 'text-green-600 font-bold' : distance > 0 ? 'text-blue-600' : 'text-red-600'}">
              ${distance > 0 ? '+' : ''}${distance.toFixed(2)}%
            </span>
          </td>
          <td class="py-3 px-4 text-center">
            ${isNear ? '<span class="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">低吸机会</span>' : 
              distance < -5 ? '<span class="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">远低于支撑</span>' :
              distance > 5 ? '<span class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">高于支撑</span>' :
              '<span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">正常</span>'}
          </td>
          <td class="py-3 px-4">
            <input type="text" 
                   value="${supportLine?.notes || ''}" 
                   onchange="updateSupportNote('${coin.symbol}', this.value)"
                   class="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                   placeholder="备注..." />
          </td>
          <td class="py-3 px-4 text-center">
            <button onclick="saveSupport('${coin.symbol}')" 
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs mr-1">
              保存
            </button>
            ${supportLine ? `
              <button onclick="deleteSupport('${coin.symbol}')" 
                      class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">
                删除
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('渲染支撑线表格失败:', error);
  }
}

function updateSupportPrice(symbol, price) {
  // 标记为已修改
  if (!supportData.find(s => s.symbol === symbol)) {
    supportData.push({ symbol, support_price: parseFloat(price) });
  } else {
    const item = supportData.find(s => s.symbol === symbol);
    item.support_price = parseFloat(price);
  }
  modifiedSupport.add(symbol);
}

function updateSupportNote(symbol, note) {
  let item = supportData.find(s => s.symbol === symbol);
  if (!item) {
    item = { symbol, notes: note };
    supportData.push(item);
  } else {
    item.notes = note;
  }
  modifiedSupport.add(symbol);
}

async function saveSupport(symbol) {
  const item = supportData.find(s => s.symbol === symbol);
  if (!item || !item.support_price) {
    showError('请输入支撑价格');
    return;
  }
  
  try {
    const response = await fetch('/api/support-lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: symbol,
        support_price: item.support_price,
        notes: item.notes || ''
      })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess(`${symbol} 支撑线已保存`);
      modifiedSupport.delete(symbol);
      await loadSupportLines();
    } else {
      showError(`保存失败: ${data.error}`);
    }
  } catch (error) {
    console.error('保存支撑线失败:', error);
    showError('保存支撑线失败');
  }
}

async function deleteSupport(symbol) {
  if (!confirm(`确定要删除 ${symbol} 的支撑线吗？`)) return;
  
  try {
    const response = await fetch(`/api/support-lines/${symbol}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess(`${symbol} 支撑线已删除`);
      await loadSupportLines();
    }
  } catch (error) {
    showError('删除失败');
  }
}

async function saveAllSupport() {
  if (modifiedSupport.size === 0) {
    showInfo('没有需要保存的更改');
    return;
  }
  
  const lines = Array.from(modifiedSupport).map(symbol => {
    const item = supportData.find(s => s.symbol === symbol);
    return {
      symbol: item.symbol,
      support_price: item.support_price,
      notes: item.notes || ''
    };
  }).filter(line => line.support_price > 0);
  
  try {
    const response = await fetch('/api/support-lines/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines })
    });
    
    const data = await response.json();
    if (data.success) {
      showSuccess(`已保存 ${lines.length} 个支撑线`);
      modifiedSupport.clear();
      await loadSupportLines();
    }
  } catch (error) {
    showError('批量保存失败');
  }
}

async function clearAllSupport() {
  if (!confirm('确定要清零今天的所有支撑线吗？此操作不可撤销！')) return;
  
  try {
    const response = await fetch('/api/support-lines/clear', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showSuccess(`已清零 ${data.count} 个支撑线`);
      await loadSupportLines();
    }
  } catch (error) {
    showError('清零失败');
  }
}

async function checkOpportunities() {
  try {
    const response = await fetch('/api/support-lines/opportunities');
    const data = await response.json();
    
    if (data.success) {
      if (data.near_support_count === 0) {
        showInfo('当前没有低吸机会');
      } else {
        showSuccess(`发现 ${data.near_support_count} 个低吸机会！`);
        // 刷新表格高亮显示
        await renderSupportTable();
      }
    }
  } catch (error) {
    showError('检查失败');
  }
}

// ========================================
// 币种优先级管理
// ========================================

async function loadPriority() {
  try {
    const [priorityResponse, rulesResponse, supportResponse] = await Promise.all([
      fetch('/api/coin-priority'),
      fetch('/api/trading-rules'),
      fetch('/api/support-lines')
    ]);
    
    const priorityData = await priorityResponse.json();
    const rulesData = await rulesResponse.json();
    const supportData = await supportResponse.json();
    
    // 统计各等级数量
    const levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    priorityData.coins.forEach(coin => {
      if (coin.level <= 4) levels[coin.level]++;
      else levels[5]++;
    });
    
    document.getElementById('level1Count').textContent = levels[1];
    document.getElementById('level2Count').textContent = levels[2];
    document.getElementById('level3Count').textContent = levels[3];
    document.getElementById('level4Count').textContent = levels[4];
    document.getElementById('level5Count').textContent = levels[5];
    
    // 渲染表格
    renderPriorityTable(priorityData.coins, rulesData.rules, supportData.lines);
  } catch (error) {
    console.error('加载优先级失败:', error);
    showError('加载优先级失败');
  }
}

function renderPriorityTable(coins, rules, supportLines) {
  const tbody = document.getElementById('priorityTableBody');
  
  const rulesMap = {};
  rules.forEach(rule => {
    rulesMap[rule.symbol] = rule;
  });
  
  const supportMap = {};
  supportLines.forEach(line => {
    supportMap[line.symbol] = line;
  });
  
  tbody.innerHTML = coins.map(coin => {
    const rule = rulesMap[coin.symbol];
    const support = supportMap[coin.symbol];
    
    const levelColor = coin.level === 1 ? 'yellow' : 
                       coin.level === 2 ? 'green' :
                       coin.level === 3 ? 'blue' :
                       coin.level === 4 ? 'orange' : 'gray';
    
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-3 px-4 font-bold">${coin.symbol}</td>
        <td class="py-3 px-4 text-center">
          <span class="px-3 py-1 bg-${levelColor}-100 text-${levelColor}-800 rounded font-bold">
            等级 ${coin.level}
          </span>
        </td>
        <td class="py-3 px-4 text-center font-mono">${(coin.low_ratio || 0).toFixed(2)}%</td>
        <td class="py-3 px-4 text-center font-mono">${(coin.high_ratio || 0).toFixed(2)}%</td>
        <td class="py-3 px-4 text-center">
          ${rule?.trading_allowed ? 
            '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">允许交易</span>' :
            '<span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">禁止交易</span>'}
        </td>
        <td class="py-3 px-4 text-center">
          ${support ? 
            `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">${support.support_price}</span>` :
            '<span class="text-gray-400 text-xs">未设置</span>'}
        </td>
        <td class="py-3 px-4 text-center">
          <button onclick="switchTab('support')" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs">
            设置支撑线
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ========================================
// 工具函数
// ========================================

function showSuccess(message) {
  showToast(message, 'success');
}

function showError(message) {
  showToast(message, 'error');
}

function showInfo(message) {
  showToast(message, 'info');
}

function showToast(message, type) {
  const bgColor = type === 'success' ? 'bg-green-500' : 
                  type === 'error' ? 'bg-red-500' : 
                  'bg-blue-500';
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'error' ? 'fa-exclamation-circle' : 
               'fa-info-circle';
  
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

// ========================================
// 连续上涨占优统计
// ========================================

let currentThreshold = 40;

async function loadConsecutiveRise() {
  try {
    await loadConsecutiveOverview();
    await loadConsecutiveTable(currentThreshold);
  } catch (error) {
    console.error('加载连续上涨统计失败:', error);
    showError('加载失败');
  }
}

async function loadConsecutiveOverview() {
  try {
    const response = await fetch('/api/consecutive-rise/overview');
    const data = await response.json();
    
    if (data.success && data.overview) {
      const overview = data.overview;
      document.getElementById('above40Count').textContent = overview.above_40 || 0;
      document.getElementById('above60Count').textContent = overview.above_60 || 0;
      document.getElementById('above80Count').textContent = overview.above_80 || 0;
      document.getElementById('maxStreakOverall').textContent = overview.max_streak_overall || 0;
    }
  } catch (error) {
    console.error('加载连续上涨概览失败:', error);
  }
}

async function loadConsecutiveTable(threshold = 40) {
  try {
    const response = await fetch(`/api/consecutive-rise/above-threshold?threshold=${threshold}`);
    const data = await response.json();
    
    if (data.success) {
      renderConsecutiveTable(data.coins);
    }
  } catch (error) {
    console.error('加载连续上涨表格失败:', error);
    showError('加载表格失败');
  }
}

function renderConsecutiveTable(coins) {
  const tbody = document.getElementById('consecutiveTableBody');
  
  if (!coins || coins.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">暂无数据</td></tr>';
    return;
  }
  
  tbody.innerHTML = coins.map(coin => {
    const isCurrentlyRising = coin.current_streak > 0;
    const highRatio = coin.last_high_ratio ? coin.last_high_ratio.toFixed(2) : '-';
    const lowRatio = coin.last_low_ratio ? coin.last_low_ratio.toFixed(2) : '-';
    
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-3 px-4 font-bold">${coin.symbol}</td>
        <td class="py-3 px-4 text-center">
          <span class="text-xl font-bold text-red-600">${coin.max_streak || 0}</span>
          <span class="text-xs text-gray-500">根</span>
        </td>
        <td class="py-3 px-4 text-center text-sm text-gray-600">
          ${coin.max_streak_start_time || '-'}
        </td>
        <td class="py-3 px-4 text-center text-sm text-gray-600">
          ${coin.max_streak_end_time || '-'}
        </td>
        <td class="py-3 px-4 text-center">
          ${isCurrentlyRising 
            ? `<span class="text-lg font-bold text-green-600">${coin.current_streak}</span>` 
            : '<span class="text-gray-400">0</span>'}
          <span class="text-xs text-gray-500">根</span>
        </td>
        <td class="py-3 px-4 text-center font-bold text-blue-600">
          ${highRatio}%
        </td>
        <td class="py-3 px-4 text-center font-bold text-orange-600">
          ${lowRatio}%
        </td>
        <td class="py-3 px-4 text-center">
          ${isCurrentlyRising 
            ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">进行中</span>' 
            : '<span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">已中断</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function changeThreshold(threshold) {
  currentThreshold = parseInt(threshold);
  loadConsecutiveTable(currentThreshold);
}

async function updateConsecutiveStats() {
  if (!confirm('确定要更新连续上涨统计吗？此操作会计算所有币种的连续天数。')) return;
  
  try {
    showInfo('正在更新统计...');
    
    const response = await fetch('/api/consecutive-rise/update', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess(`已更新 ${data.processedCoins} 个币种的统计数据`);
      await loadConsecutiveRise();
    } else {
      showError(data.error || '更新失败');
    }
  } catch (error) {
    console.error('更新连续上涨统计失败:', error);
    showError('更新失败');
  }
}
