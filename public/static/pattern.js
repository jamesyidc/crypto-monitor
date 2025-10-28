// 当前选中的tab
let currentTab = 'surge';

// 交易规则数据
let allRules = [];
let ruleChanges = {}; // 记录修改的规则

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadPatterns('surge');
});

// 切换Tab
function switchTab(tab) {
  currentTab = tab;
  
  // 更新Tab样式
  document.getElementById('tabSurge').className = 'px-6 py-3 font-bold text-gray-500 hover:text-green-600';
  document.getElementById('tabCrash').className = 'px-6 py-3 font-bold text-gray-500 hover:text-red-600';
  document.getElementById('tabRules').className = 'px-6 py-3 font-bold text-gray-500 hover:text-blue-600';
  
  document.getElementById('surgeContent').classList.add('hidden');
  document.getElementById('crashContent').classList.add('hidden');
  document.getElementById('rulesContent').classList.add('hidden');
  
  if (tab === 'surge') {
    document.getElementById('tabSurge').className = 'px-6 py-3 font-bold text-green-600 border-b-2 border-green-600';
    document.getElementById('surgeContent').classList.remove('hidden');
    loadPatterns(tab);
  } else if (tab === 'crash') {
    document.getElementById('tabCrash').className = 'px-6 py-3 font-bold text-red-600 border-b-2 border-red-600';
    document.getElementById('crashContent').classList.remove('hidden');
    loadPatterns(tab);
  } else if (tab === 'rules') {
    document.getElementById('tabRules').className = 'px-6 py-3 font-bold text-blue-600 border-b-2 border-blue-600';
    document.getElementById('rulesContent').classList.remove('hidden');
    loadTradingRules();
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch('/api/pattern/stats');
    const data = await response.json();
    
    if (data.success) {
      const { surge, crash } = data.stats;
      
      // 起涨统计
      document.getElementById('surgeTotal').textContent = surge.total || 0;
      document.getElementById('surgeAvgChange').textContent = surge.avg_change ? `+${surge.avg_change.toFixed(2)}%` : '-';
      document.getElementById('surgeV1').textContent = `${surge.volume_surge_count || 0} (${((surge.volume_surge_count / surge.total) * 100).toFixed(1)}%)`;
      document.getElementById('surgeBreakout').textContent = `${surge.breakout_count || 0} (${((surge.breakout_count / surge.total) * 100).toFixed(1)}%)`;
      document.getElementById('surgeContinuous').textContent = `${surge.continuous_count || 0} (${((surge.continuous_count / surge.total) * 100).toFixed(1)}%)`;
      
      // 起跌统计
      document.getElementById('crashTotal').textContent = crash.total || 0;
      document.getElementById('crashAvgChange').textContent = crash.avg_change ? `${crash.avg_change.toFixed(2)}%` : '-';
      document.getElementById('crashV1').textContent = `${crash.volume_surge_count || 0} (${((crash.volume_surge_count / crash.total) * 100).toFixed(1)}%)`;
      document.getElementById('crashBreakout').textContent = `${crash.breakout_count || 0} (${((crash.breakout_count / crash.total) * 100).toFixed(1)}%)`;
      document.getElementById('crashContinuous').textContent = `${crash.continuous_count || 0} (${((crash.continuous_count / crash.total) * 100).toFixed(1)}%)`;
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 加载模式列表
async function loadPatterns(type) {
  const contentId = type === 'surge' ? 'surgeContent' : 'crashContent';
  const content = document.getElementById(contentId);
  
  content.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin text-3xl mb-4"></i><p>加载中...</p></div>';
  
  try {
    const response = await fetch(`/api/pattern/${type}`);
    const data = await response.json();
    
    if (data.success && data.patterns.length > 0) {
      content.innerHTML = data.patterns.map(p => renderPattern(p, type)).join('');
    } else {
      content.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-inbox text-3xl mb-4"></i><p>暂无数据，请先点击"重新分析"</p></div>';
    }
  } catch (error) {
    console.error('加载模式失败:', error);
    content.innerHTML = '<div class="text-center py-8 text-red-500"><i class="fas fa-exclamation-triangle text-3xl mb-4"></i><p>加载失败</p></div>';
  }
}

// 渲染单个模式卡片
function renderPattern(pattern, type) {
  const isGreen = type === 'surge';
  const colorClass = isGreen ? 'green' : 'red';
  const iconClass = isGreen ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
  const features = pattern.features;
  
  // 时间格式化
  const startTime = new Date(pattern.start_time).toLocaleString('zh-CN');
  const endTime = new Date(pattern.end_time).toLocaleString('zh-CN');
  
  return `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <h3 class="text-xl font-bold text-${colorClass}-600">
            <i class="fas ${iconClass} mr-2"></i>${pattern.symbol}
          </h3>
          <span class="text-2xl font-bold text-${colorClass}-600">
            ${pattern.total_change >= 0 ? '+' : ''}${pattern.total_change.toFixed(2)}%
          </span>
        </div>
        <div class="text-sm text-gray-500">
          ${pattern.kline_count} 根K线
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div><span class="text-gray-500">起始时间:</span> ${startTime}</div>
        <div><span class="text-gray-500">结束时间:</span> ${endTime}</div>
      </div>
      
      <div class="border-t pt-4">
        <h4 class="font-bold text-gray-700 mb-3">特征详情</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <!-- 成交量特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">V1成交量</div>
            <div class="font-bold ${features.has_volume_v1 ? 'text-red-600' : 'text-gray-400'}">
              ${features.volume_v1_count > 0 ? `✓ ${features.volume_v1_count}次` : '无'}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">V2成交量</div>
            <div class="font-bold ${features.volume_v2_count > 0 ? 'text-orange-600' : 'text-gray-400'}">
              ${features.volume_v2_count > 0 ? `✓ ${features.volume_v2_count}次` : '无'}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">成交量倍数</div>
            <div class="font-bold">${features.volume_surge_ratio}x</div>
          </div>
          
          <!-- 形态特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">${isGreen ? '阳线数量' : '阴线数量'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.green_count : features.red_count} / ${pattern.kline_count}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">连续同向</div>
            <div class="font-bold">
              ${isGreen ? features.continuous_green : features.continuous_red}根
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">平均涨跌幅</div>
            <div class="font-bold text-${colorClass}-600">${features.avg_change}%</div>
          </div>
          
          <!-- 价格特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">${isGreen ? '最大单根涨幅' : '最大单根跌幅'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.max_single_change : features.min_single_change}%
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">${isGreen ? '突破幅度' : '跌破幅度'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.breakout_percent : features.crash_percent}%
            </div>
          </div>
          
          <!-- 初期特征 -->
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">初期3根变化</div>
            <div class="font-bold text-${colorClass}-600">${features.early_change}%</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">初期成交量</div>
            <div class="font-bold ${features.early_volume_surge ? 'text-red-600' : 'text-gray-400'}">
              ${features.early_volume_surge ? '✓ 放量' : '无放量'}
            </div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-gray-500 text-xs mb-1">初期${isGreen ? '阳线' : '阴线'}</div>
            <div class="font-bold text-${colorClass}-600">
              ${isGreen ? features.early_green_count : features.early_red_count} / 3
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 重新分析
async function analyzePatterns() {
  const btn = document.getElementById('analyzeBtn');
  const originalText = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析中...';
  
  try {
    const response = await fetch('/api/pattern/analyze', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      alert(`分析完成！\n起涨模式: ${data.results.surge} 个\n起跌模式: ${data.results.crash} 个`);
      loadStats();
      loadPatterns(currentTab);
    } else {
      alert('分析失败: ' + data.error);
    }
  } catch (error) {
    console.error('分析失败:', error);
    alert('分析失败: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ==================== 交易规则相关函数 ====================

// 加载交易规则
async function loadTradingRules() {
  try {
    // 加载规则列表
    const rulesResponse = await fetch('/api/trading-rules');
    const rulesData = await rulesResponse.json();
    
    if (rulesData.success) {
      allRules = rulesData.rules;
      renderRulesTable();
    }
    
    // 加载统计信息
    const statsResponse = await fetch('/api/trading-rules/stats');
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      renderRulesStats(statsData.stats);
    }
    
    // 清空未保存的修改
    ruleChanges = {};
    
  } catch (error) {
    console.error('加载交易规则失败:', error);
    document.getElementById('rulesTableBody').innerHTML = `
      <tr><td colspan="6" class="text-center py-8 text-red-500">
        <i class="fas fa-exclamation-triangle mr-2"></i>加载失败: ${error.message}
      </td></tr>
    `;
  }
}

// 渲染统计信息
function renderRulesStats(stats) {
  document.getElementById('statsTotal').textContent = stats.total || 0;
  document.getElementById('statsTradingAllowed').textContent = stats.trading_allowed || 0;
  document.getElementById('statsLongAllowed').textContent = stats.long_allowed || 0;
  document.getElementById('statsShortAllowed').textContent = stats.short_allowed || 0;
  document.getElementById('statsTradingDisabled').textContent = stats.trading_disabled || 0;
}

// 渲染规则表格
function renderRulesTable() {
  const tbody = document.getElementById('rulesTableBody');
  
  tbody.innerHTML = allRules.map((rule, index) => {
    const tradingAllowed = rule.trading_allowed === 1;
    const longAllowed = rule.long_allowed === 1;
    const shortAllowed = rule.short_allowed === 1;
    
    // 状态描述
    let statusText = '';
    let statusClass = '';
    if (!tradingAllowed) {
      statusText = '❌ 禁止交易';
      statusClass = 'text-red-600 font-bold';
    } else if (longAllowed && shortAllowed) {
      statusText = '✅ 双向交易';
      statusClass = 'text-green-600 font-bold';
    } else if (longAllowed) {
      statusText = '📈 仅做多';
      statusClass = 'text-blue-600 font-bold';
    } else if (shortAllowed) {
      statusText = '📉 仅做空';
      statusClass = 'text-orange-600 font-bold';
    } else {
      statusText = '⚠️ 配置异常';
      statusClass = 'text-yellow-600 font-bold';
    }
    
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-3 px-4 font-bold text-gray-700">${rule.symbol}</td>
        <td class="py-3 px-4 text-center">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${tradingAllowed ? 'checked' : ''} 
                   onchange="toggleRule('${rule.symbol}', 'trading_allowed', this.checked)"
                   class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </td>
        <td class="py-3 px-4 text-center">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${longAllowed ? 'checked' : ''} 
                   ${!tradingAllowed ? 'disabled' : ''}
                   onchange="toggleRule('${rule.symbol}', 'long_allowed', this.checked)"
                   class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${!tradingAllowed ? 'opacity-50' : ''} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </td>
        <td class="py-3 px-4 text-center">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${shortAllowed ? 'checked' : ''} 
                   ${!tradingAllowed ? 'disabled' : ''}
                   onchange="toggleRule('${rule.symbol}', 'short_allowed', this.checked)"
                   class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer ${!tradingAllowed ? 'opacity-50' : ''} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </td>
        <td class="py-3 px-4 text-sm text-gray-600">
          <input type="text" 
                 value="${rule.notes || ''}" 
                 onchange="updateRuleNotes('${rule.symbol}', this.value)"
                 placeholder="添加备注..."
                 class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
        </td>
        <td class="py-3 px-4 text-center ${statusClass}">${statusText}</td>
      </tr>
    `;
  }).join('');
}

// 切换规则开关
function toggleRule(symbol, field, value) {
  if (!ruleChanges[symbol]) {
    ruleChanges[symbol] = { symbol };
  }
  ruleChanges[symbol][field] = value ? 1 : 0;
  
  // 如果禁止交易，自动禁用做多做空
  if (field === 'trading_allowed' && !value) {
    ruleChanges[symbol].long_allowed = 0;
    ruleChanges[symbol].short_allowed = 0;
  }
  
  // 更新本地数据
  const rule = allRules.find(r => r.symbol === symbol);
  if (rule) {
    rule[field] = value ? 1 : 0;
    if (field === 'trading_allowed' && !value) {
      rule.long_allowed = 0;
      rule.short_allowed = 0;
    }
  }
  
  // 重新渲染表格
  renderRulesTable();
  
  console.log('规则修改:', ruleChanges);
}

// 更新规则备注
function updateRuleNotes(symbol, notes) {
  if (!ruleChanges[symbol]) {
    ruleChanges[symbol] = { symbol };
  }
  ruleChanges[symbol].notes = notes;
  
  console.log('备注修改:', ruleChanges);
}

// 保存所有更改
async function saveAllRules() {
  const changesCount = Object.keys(ruleChanges).length;
  
  if (changesCount === 0) {
    alert('没有需要保存的更改');
    return;
  }
  
  const confirmed = confirm(`即将保存 ${changesCount} 个币种的规则修改，是否继续？`);
  if (!confirmed) return;
  
  try {
    const updates = Object.values(ruleChanges);
    
    const response = await fetch('/api/trading-rules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      ruleChanges = {};
      loadTradingRules(); // 重新加载
    } else {
      alert('保存失败: ' + data.error);
    }
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败: ' + error.message);
  }
}

// 快速设置 - 重置所有规则
async function quickSetReset() {
  const confirmed = confirm('即将重置所有币种为默认规则（允许所有交易），是否继续？');
  if (!confirmed) return;
  
  try {
    const response = await fetch('/api/trading-rules/reset', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      loadTradingRules();
    } else {
      alert('操作失败: ' + data.error);
    }
  } catch (error) {
    console.error('操作失败:', error);
    alert('操作失败: ' + error.message);
  }
}

// 快速设置 - 禁止所有交易
async function quickSetDisableAll() {
  const confirmed = confirm('即将禁止所有币种的交易，是否继续？');
  if (!confirmed) return;
  
  try {
    const response = await fetch('/api/trading-rules/disable-all', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      loadTradingRules();
    } else {
      alert('操作失败: ' + data.error);
    }
  } catch (error) {
    console.error('操作失败:', error);
    alert('操作失败: ' + error.message);
  }
}

// 快速设置 - 仅允许做多
async function quickSetLongOnly() {
  const confirmed = confirm('即将设置所有币种为仅允许做多，是否继续？');
  if (!confirmed) return;
  
  try {
    const response = await fetch('/api/trading-rules/long-only', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      loadTradingRules();
    } else {
      alert('操作失败: ' + data.error);
    }
  } catch (error) {
    console.error('操作失败:', error);
    alert('操作失败: ' + error.message);
  }
}

// 快速设置 - 仅允许做空
async function quickSetShortOnly() {
  const confirmed = confirm('即将设置所有币种为仅允许做空，是否继续？');
  if (!confirmed) return;
  
  try {
    const response = await fetch('/api/trading-rules/short-only', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      loadTradingRules();
    } else {
      alert('操作失败: ' + data.error);
    }
  } catch (error) {
    console.error('操作失败:', error);
    alert('操作失败: ' + error.message);
  }
}
