// Merged Trading Management Center JavaScript
// Combines Signal Library and Coin Priority Management

// ===== Main Tab Switching =====
function switchMainTab(tabName) {
    // Hide all main tab contents
    document.querySelectorAll('#signalsContent, #coinPriorityContent').forEach(el => {
        el.classList.remove('active');
    });
    
    // Remove active class from all main tabs
    document.querySelectorAll('#signalsTab, #coinPriorityTab').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show selected main tab content
    document.getElementById(`${tabName}Content`).classList.add('active');
    
    // Add active class to selected main tab
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load data if needed
    if (tabName === 'coinPriority') {
        loadCoinPriority();
        loadLevelHistory();
    }
}

// ===== Coin Priority Sub-Tab Switching =====
function switchCoinTab(subTabName) {
    // Hide all sub-tab contents
    document.querySelectorAll('#detailsSubContent, #rulesSubContent, #supportSubContent, #historySubContent').forEach(el => {
        el.classList.remove('active');
    });
    
    // Remove active class from all sub-tabs
    document.querySelectorAll('#detailsTab, #rulesTab, #supportTab, #historyTab').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show selected sub-tab content
    document.getElementById(`${subTabName}SubContent`).classList.add('active');
    
    // Add active class to selected sub-tab
    document.getElementById(`${subTabName}Tab`).classList.add('active');
    
    // Load specific data if needed
    if (subTabName === 'support') {
        loadSupportLines();
    } else if (subTabName === 'history') {
        loadLevelHistory();
    } else if (subTabName === 'rules') {
        loadTradingRules();
    }
}

// ===== Signal Library Variables =====
let currentSignalType = null; // 'long' or 'short'
let editingSignalId = null;
let allSymbols = []; // 所有币种列表
let tipsPanelOpen = false; // 操作提示面板是否打开

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadSignalStatistics();
    loadLongSignals();
    loadShortSignals();
    loadLevelHistory();
    
    // Setup event listeners
    document.getElementById('addLongSignalBtn')?.addEventListener('click', () => openSignalModal('long'));
    document.getElementById('addShortSignalBtn')?.addEventListener('click', () => openSignalModal('short'));
    document.getElementById('closeModalBtn')?.addEventListener('click', closeSignalModal);
    document.getElementById('signalForm')?.addEventListener('submit', handleSignalSubmit);
    
    // Close modal on background click
    document.getElementById('signalModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'signalModal') {
            closeSignalModal();
        }
    });
    
    // Auto-refresh level history every 5 minutes
    setInterval(loadLevelHistory, 5 * 60 * 1000);
});

// Load signal statistics
async function loadSignalStatistics() {
    try {
        const [longResponse, shortResponse] = await Promise.all([
            fetch('/api/signals/long'),
            fetch('/api/signals/short')
        ]);
        
        const longSignals = await longResponse.json();
        const shortSignals = await shortResponse.json();
        
        const longCount = Array.isArray(longSignals) ? longSignals.length : 0;
        const shortCount = Array.isArray(shortSignals) ? shortSignals.length : 0;
        
        document.getElementById('longSignalCount').textContent = longCount;
        document.getElementById('shortSignalCount').textContent = shortCount;
        document.getElementById('totalSignalCount').textContent = longCount + shortCount;
    } catch (error) {
        console.error('Failed to load signal statistics:', error);
        document.getElementById('longSignalCount').textContent = '0';
        document.getElementById('shortSignalCount').textContent = '0';
        document.getElementById('totalSignalCount').textContent = '0';
    }
}

// Load long signals
async function loadLongSignals() {
    const listContainer = document.getElementById('longSignalsList');
    listContainer.innerHTML = '<div class="text-center py-4">加载中...</div>';
    
    try {
        const response = await fetch('/api/signals/long');
        if (!response.ok) throw new Error('Failed to load long signals');
        
        const signals = await response.json();
        
        if (!Array.isArray(signals) || signals.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-4 text-gray-500">暂无做多信号</div>';
            return;
        }
        
        listContainer.innerHTML = signals.map(signal => renderSignalCard(signal, 'long')).join('');
        
        // Attach event listeners
        signals.forEach(signal => {
            // 交易操作按钮
            document.getElementById(`open-${signal.id}`)?.addEventListener('click', () => openPositionFromSignal(signal, 'long'));
            document.getElementById(`close-${signal.id}`)?.addEventListener('click', () => closePositionFromSignal(signal, 'long'));
            // 管理按钮
            document.getElementById(`edit-${signal.id}`)?.addEventListener('click', () => editSignal(signal));
            document.getElementById(`delete-${signal.id}`)?.addEventListener('click', () => deleteSignal(signal.id, signal.signal_name));
            document.getElementById(`toggle-${signal.id}`)?.addEventListener('change', (e) => toggleSignal(signal.id, e.target.checked));
        });
    } catch (error) {
        console.error('Failed to load long signals:', error);
        listContainer.innerHTML = '<div class="text-center py-4 text-red-500">加载失败</div>';
    }
}

// Load short signals
async function loadShortSignals() {
    const listContainer = document.getElementById('shortSignalsList');
    listContainer.innerHTML = '<div class="text-center py-4">加载中...</div>';
    
    try {
        const response = await fetch('/api/signals/short');
        if (!response.ok) throw new Error('Failed to load short signals');
        
        const signals = await response.json();
        
        if (!Array.isArray(signals) || signals.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-4 text-gray-500">暂无做空信号</div>';
            return;
        }
        
        listContainer.innerHTML = signals.map(signal => renderSignalCard(signal, 'short')).join('');
        
        // Attach event listeners
        signals.forEach(signal => {
            // 交易操作按钮
            document.getElementById(`open-${signal.id}`)?.addEventListener('click', () => openPositionFromSignal(signal, 'short'));
            document.getElementById(`close-${signal.id}`)?.addEventListener('click', () => closePositionFromSignal(signal, 'short'));
            // 管理按钮
            document.getElementById(`edit-${signal.id}`)?.addEventListener('click', () => editSignal(signal));
            document.getElementById(`delete-${signal.id}`)?.addEventListener('click', () => deleteSignal(signal.id, signal.signal_name));
            document.getElementById(`toggle-${signal.id}`)?.addEventListener('change', (e) => toggleSignal(signal.id, e.target.checked));
        });
    } catch (error) {
        console.error('Failed to load short signals:', error);
        listContainer.innerHTML = '<div class="text-center py-4 text-red-500">加载失败</div>';
    }
}

// Render signal card
function renderSignalCard(signal, type) {
    const categoryNames = {
        'convergence': '趋同收敛',
        'macd_cross': 'MACD交叉',
        'rsi_oversold': 'RSI超卖',
        'rsi_overbought': 'RSI超买',
        'sar_signal': 'SAR信号',
        'action_hint': '操作提示',
        'volume_spike': '成交量突破',
        'support_resistance': '支撑/阻力',
        'custom': '自定义'
    };
    
    const bgColor = type === 'long' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'long' ? 'border-green-200' : 'border-red-200';
    const badgeColor = type === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    
    let conditions = {};
    try {
        conditions = typeof signal.conditions === 'string' ? JSON.parse(signal.conditions) : signal.conditions;
    } catch (e) {
        conditions = {};
    }
    
    // 根据信号类型确定开仓/平仓按钮的颜色和文字
    const openBtnColor = type === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
    const closeBtnColor = type === 'long' ? 'bg-green-700 hover:bg-green-800' : 'bg-red-700 hover:bg-red-800';
    const openBtnText = type === 'long' ? '开多仓' : '开空仓';
    const closeBtnText = type === 'long' ? '平多仓' : '平空仓';
    const directionIcon = type === 'long' ? 'fa-arrow-up' : 'fa-arrow-down';
    
    return `
        <div class="border ${borderColor} ${bgColor} rounded-lg p-4 mb-3">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-lg font-semibold">${signal.signal_name}</h3>
                        <span class="px-2 py-1 ${badgeColor} rounded text-xs">${categoryNames[signal.category] || signal.category}</span>
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">优先级: ${signal.priority}</span>
                    </div>
                    ${signal.description ? `<p class="text-sm text-gray-600 mb-2">${signal.description}</p>` : ''}
                    ${signal.success_rate ? `<div class="text-xs text-gray-500 mt-1">成功率: ${(signal.success_rate * 100).toFixed(1)}%</div>` : ''}
                </div>
                <div class="flex items-center gap-2 ml-4">
                    <!-- 交易操作按钮 -->
                    <button id="open-${signal.id}" class="${openBtnColor} text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition flex items-center gap-1" title="${openBtnText}">
                        <i class="fas fa-plus-circle"></i>
                        <i class="fas ${directionIcon}"></i>
                        <span>${openBtnText}</span>
                    </button>
                    <button id="close-${signal.id}" class="${closeBtnColor} text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition flex items-center gap-1" title="${closeBtnText}">
                        <i class="fas fa-times-circle"></i>
                        <i class="fas ${directionIcon}"></i>
                        <span>${closeBtnText}</span>
                    </button>
                    <!-- 分隔线 -->
                    <div class="h-8 w-px bg-gray-300 mx-1"></div>
                    <!-- 管理按钮 -->
                    <label class="relative inline-flex items-center cursor-pointer" title="启用/禁用">
                        <input type="checkbox" id="toggle-${signal.id}" class="sr-only peer" ${signal.is_enabled ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button id="edit-${signal.id}" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">编辑</button>
                    <button id="delete-${signal.id}" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">删除</button>
                </div>
            </div>
        </div>
    `;
}

// Load coin level history
async function loadLevelHistory() {
    const tableBody = document.getElementById('levelHistoryTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">加载中...</td></tr>';
    
    try {
        const response = await fetch('/api/coin-levels');
        if (!response.ok) throw new Error('Failed to load level history');
        
        const history = await response.json();
        
        if (!Array.isArray(history) || history.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">暂无等级记录</td></tr>';
            return;
        }
        
        tableBody.innerHTML = history.map(record => {
            const reachedDate = new Date(record.reached_at);
            const expiredDate = new Date(record.expired_at);
            const now = new Date();
            const isExpired = now > expiredDate;
            const statusText = isExpired ? '已过期' : '有效';
            const statusClass = isExpired ? 'text-gray-500' : 'text-green-600 font-semibold';
            
            return `
                <tr class="${isExpired ? 'opacity-50' : ''}">
                    <td class="font-medium">${record.symbol}</td>
                    <td class="text-center">
                        <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">等级 ${record.level}</span>
                    </td>
                    <td class="text-sm text-gray-600">${reachedDate.toLocaleString('zh-CN')}</td>
                    <td class="text-sm text-gray-600">${expiredDate.toLocaleString('zh-CN')}</td>
                    <td class="text-center ${statusClass}">${statusText}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load level history:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">加载失败</td></tr>';
    }
}

// Open signal modal
function openSignalModal(type) {
    currentSignalType = type;
    editingSignalId = null;
    
    const modal = document.getElementById('signalModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('signalForm');
    
    title.textContent = type === 'long' ? '新增做多信号' : '新增做空信号';
    form.reset();
    document.getElementById('signalPriority').value = '50';
    document.getElementById('signalEnabled').checked = true;
    
    modal.classList.remove('hidden');
}

// Close signal modal
function closeSignalModal() {
    const modal = document.getElementById('signalModal');
    modal.classList.add('hidden');
    currentSignalType = null;
    editingSignalId = null;
}

// Edit signal
function editSignal(signal) {
    currentSignalType = signal.signal_type;
    editingSignalId = signal.id;
    
    const modal = document.getElementById('signalModal');
    const title = document.getElementById('modalTitle');
    
    title.textContent = signal.signal_type === 'long' ? '编辑做多信号' : '编辑做空信号';
    
    document.getElementById('signalName').value = signal.signal_name;
    document.getElementById('signalCategory').value = signal.category;
    document.getElementById('signalDescription').value = signal.description || '';
    document.getElementById('signalPriority').value = signal.priority;
    document.getElementById('signalEnabled').checked = signal.is_enabled === 1;
    
    let conditionsStr = '';
    try {
        const conditions = typeof signal.conditions === 'string' ? JSON.parse(signal.conditions) : signal.conditions;
        conditionsStr = JSON.stringify(conditions, null, 2);
    } catch (e) {
        conditionsStr = signal.conditions || '{}';
    }
    document.getElementById('signalConditions').value = conditionsStr;
    
    modal.classList.remove('hidden');
}

// Handle signal form submit
async function handleSignalSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('signalName').value.trim();
    const category = document.getElementById('signalCategory').value;
    const description = document.getElementById('signalDescription').value.trim();
    const priority = parseInt(document.getElementById('signalPriority').value);
    const enabled = document.getElementById('signalEnabled').checked;
    const conditionsStr = document.getElementById('signalConditions').value.trim();
    
    // Validate
    if (!name) {
        alert('请输入信号名称');
        return;
    }
    
    if (!category) {
        alert('请选择信号分类');
        return;
    }
    
    if (priority < 0 || priority > 100) {
        alert('优先级必须在 0-100 之间');
        return;
    }
    
    // Validate JSON
    let conditions = {};
    try {
        conditions = conditionsStr ? JSON.parse(conditionsStr) : {};
    } catch (e) {
        alert('条件配置格式错误，请输入有效的 JSON');
        return;
    }
    
    const signalData = {
        signal_type: currentSignalType,
        signal_name: name,
        category: category,
        description: description || null,
        conditions: JSON.stringify(conditions),
        priority: priority,
        is_enabled: enabled ? 1 : 0
    };
    
    try {
        let response;
        if (editingSignalId) {
            // Update existing signal
            response = await fetch(`/api/signals/${editingSignalId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signalData)
            });
        } else {
            // Create new signal
            response = await fetch('/api/signals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signalData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save signal');
        }
        
        closeSignalModal();
        loadSignalStatistics();
        
        if (currentSignalType === 'long') {
            loadLongSignals();
        } else {
            loadShortSignals();
        }
        
        alert(editingSignalId ? '信号更新成功' : '信号创建成功');
        
        // 🔄 重要：信号创建/更新成功后，触发策略库下拉框刷新
        // 如果策略模态框是打开的，自动刷新信号列表
        const strategyModal = document.getElementById('strategyModal');
        if (strategyModal && !strategyModal.classList.contains('hidden')) {
            const strategyType = document.getElementById('strategyType')?.value || 'long';
            console.log('🔄 信号已更新，自动刷新策略库下拉框，策略类型:', strategyType);
            if (typeof loadSignalsToDropdown === 'function') {
                loadSignalsToDropdown(strategyType);
            }
        }
    } catch (error) {
        console.error('Failed to save signal:', error);
        alert('保存失败: ' + error.message);
    }
}

// Delete signal
async function deleteSignal(signalId, signalName) {
    if (!confirm(`确定要删除信号 "${signalName}" 吗？此操作不可恢复。`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/signals/${signalId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete signal');
        }
        
        loadSignalStatistics();
        loadLongSignals();
        loadShortSignals();
        
        alert('信号删除成功');
    } catch (error) {
        console.error('Failed to delete signal:', error);
        alert('删除失败: ' + error.message);
    }
}

// Toggle signal enabled/disabled
async function toggleSignal(signalId, enabled) {
    try {
        const response = await fetch(`/api/signals/${signalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_enabled: enabled ? 1 : 0 })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to toggle signal');
        }
        
        // Optional: Show subtle feedback
        console.log(`Signal ${signalId} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('Failed to toggle signal:', error);
        alert('切换失败: ' + error.message);
        // Revert checkbox state
        const checkbox = document.getElementById(`toggle-${signalId}`);
        if (checkbox) checkbox.checked = !enabled;
    }
}

// ========================================
// 交易操作函数
// ========================================

// 根据信号开仓
async function openPositionFromSignal(signal, direction) {
    const directionText = direction === 'long' ? '做多' : '做空';
    
    // 确认对话框
    const confirmed = confirm(
        `确认根据信号开仓？\n\n` +
        `信号: ${signal.signal_name}\n` +
        `方向: ${directionText}\n` +
        `分类: ${signal.category}\n` +
        `优先级: ${signal.priority}\n\n` +
        `此操作将打开实盘交易页面执行开仓操作。`
    );
    
    if (!confirmed) return;
    
    try {
        // 将信号信息存储到 localStorage，供实盘交易页面使用
        const tradingData = {
            signal: signal,
            direction: direction,
            timestamp: Date.now()
        };
        localStorage.setItem('pendingTrade', JSON.stringify(tradingData));
        
        // 跳转到实盘交易页面
        window.location.href = `/live-trading?signal=${signal.id}&direction=${direction}`;
        
    } catch (error) {
        console.error('开仓失败:', error);
        alert('开仓失败: ' + error.message);
    }
}

// 根据信号平仓
async function closePositionFromSignal(signal, direction) {
    const directionText = direction === 'long' ? '多' : '空';
    
    // 确认对话框
    const confirmed = confirm(
        `确认根据信号平仓？\n\n` +
        `信号: ${signal.signal_name}\n` +
        `方向: 平${directionText}仓\n\n` +
        `将平掉所有${directionText}仓持仓。\n` +
        `此操作不可撤销！`
    );
    
    if (!confirmed) return;
    
    try {
        // 将信号信息存储到 localStorage
        const tradingData = {
            signal: signal,
            action: 'close',
            direction: direction,
            timestamp: Date.now()
        };
        localStorage.setItem('pendingTrade', JSON.stringify(tradingData));
        
        // 跳转到实盘交易页面
        window.location.href = `/live-trading?signal=${signal.id}&action=close&direction=${direction}`;
        
    } catch (error) {
        console.error('平仓失败:', error);
        alert('平仓失败: ' + error.message);
    }
}
// Coin Priority Management JavaScript

let allCoins = [];
let currentLevelFilter = null;
let coinLevelHistory = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadCoinPriority();
    loadLevelHistory();
    
    // Setup form submission
    document.getElementById('editForm')?.addEventListener('submit', handleSupportLineSubmit);
});

// Switch between tabs
function switchTab(tabName) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
    
    // Show selected content
    document.getElementById(`${tabName}Content`).classList.remove('hidden');
    
    // Add active class to selected tab
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load specific data if needed
    if (tabName === 'support') {
        loadSupportLines();
    } else if (tabName === 'priority') {
        loadLevelHistory();
    }
}

// Load coin priority data
async function loadCoinPriority() {
    try {
        const response = await fetch('/api/coin-priority');
        if (!response.ok) throw new Error('Failed to load coin priority');
        
        const data = await response.json();
        allCoins = data.coins || [];
        
        updateLevelDistribution();
        renderCoinTable();
    } catch (error) {
        console.error('Error loading coin priority:', error);
        document.getElementById('coinTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle mr-2"></i>加载失败: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Update level distribution counts
function updateLevelDistribution() {
    const levelCounts = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    };
    
    allCoins.forEach(coin => {
        const level = coin.level || 6;
        if (level >= 5) {
            levelCounts[5]++;
        } else if (level >= 1 && level <= 4) {
            levelCounts[level]++;
        }
    });
    
    document.getElementById('level1Count').textContent = levelCounts[1];
    document.getElementById('level2Count').textContent = levelCounts[2];
    document.getElementById('level3Count').textContent = levelCounts[3];
    document.getElementById('level4Count').textContent = levelCounts[4];
    document.getElementById('level5Count').textContent = levelCounts[5];
}

// Filter coins by level
function filterByLevel(level) {
    currentLevelFilter = currentLevelFilter === level ? null : level;
    
    // Update active state
    document.querySelectorAll('.level-box').forEach(box => {
        box.classList.remove('active');
    });
    
    if (currentLevelFilter !== null) {
        document.querySelector(`.level-box[onclick*="${level}"]`).classList.add('active');
    }
    
    renderCoinTable();
}

// Render coin table
function renderCoinTable() {
    const tbody = document.getElementById('coinTableBody');
    
    let filteredCoins = allCoins;
    if (currentLevelFilter !== null) {
        if (currentLevelFilter === 5) {
            filteredCoins = allCoins.filter(coin => (coin.level || 6) >= 5);
        } else {
            filteredCoins = allCoins.filter(coin => coin.level === currentLevelFilter);
        }
    }
    
    // Update filter label
    const filterText = currentLevelFilter === null ? '全部' : `等级 ${currentLevelFilter}${currentLevelFilter === 5 ? '+' : ''}`;
    document.getElementById('currentFilter').textContent = filterText;
    
    if (filteredCoins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    暂无数据
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredCoins.map(coin => {
        const level = coin.level || 6;
        const levelClass = level >= 5 ? 'level-5' : `level-${level}`;
        const levelText = level >= 5 ? `等级 ${level}` : `等级 ${level}`;
        
        // Check if coin reached level 2 in past 7 days
        const reachedLevel2 = checkLevel2History(coin.symbol);
        const canUseSupportLine = level <= 2 || reachedLevel2;
        
        const tradingStatus = coin.is_tradable === 0 ? 
            '<span class="text-red-600">未设置</span>' : 
            '<span class="text-green-600">允许交易</span>';
        
        const supportLineStatus = canUseSupportLine ? 
            '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>可用</span>' :
            '<span class="text-gray-400"><i class="fas fa-ban mr-1"></i>不可用</span>';
        
        return `
            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                <td class="px-4 py-3 font-bold text-gray-800">${coin.symbol}</td>
                <td class="px-4 py-3 text-center">
                    <span class="level-badge ${levelClass}">${levelText}</span>
                    ${reachedLevel2 ? '<div class="text-xs text-green-600 mt-1"><i class="fas fa-history mr-1"></i>7天内达到过2级</div>' : ''}
                </td>
                <td class="px-4 py-3 text-center">${coin.extreme_low_ratio?.toFixed(2) || '-'}%</td>
                <td class="px-4 py-3 text-center">${coin.extreme_high_ratio?.toFixed(2) || '-'}%</td>
                <td class="px-4 py-3 text-center">${tradingStatus}</td>
                <td class="px-4 py-3 text-center">${supportLineStatus}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="openEditModal('${coin.symbol}')" class="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm transition" ${!canUseSupportLine ? 'disabled title="币种等级不足，无法设置支撑线"' : ''}>
                        <i class="fas fa-edit mr-1"></i>设置支撑线
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Check if coin reached level 2 in past 7 days
function checkLevel2History(symbol) {
    if (!coinLevelHistory || coinLevelHistory.length === 0) return false;
    
    const history = coinLevelHistory.find(h => h.symbol === symbol && h.level <= 2 && h.is_active === 1);
    return !!history;
}

// Load level history
async function loadLevelHistory() {
    try {
        const response = await fetch('/api/coin-levels');
        if (!response.ok) throw new Error('Failed to load level history');
        
        coinLevelHistory = await response.json();
        
        // Filter level 2 history
        const level2History = coinLevelHistory.filter(h => h.level <= 2);
        
        // Render level 2 history table
        renderLevel2History(level2History);
        
        // Render all history table
        renderAllHistory(coinLevelHistory);
        
        // Update coin table to show which coins have level 2 history
        renderCoinTable();
    } catch (error) {
        console.error('Error loading level history:', error);
    }
}

// Render level 2 history table
function renderLevel2History(history) {
    const tbody = document.getElementById('level2HistoryBody');
    
    if (!history || history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    暂无过去7天达到2级的币种
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.map(record => {
        const reachedDate = new Date(record.reached_at);
        const expiredDate = new Date(record.expired_at);
        const now = new Date();
        const isExpired = now > expiredDate;
        const isActive = record.is_active === 1;
        
        const statusText = isExpired || !isActive ? '已过期' : '有效';
        const statusClass = isExpired || !isActive ? 'text-gray-500' : 'text-green-600 font-semibold';
        
        return `
            <tr class="${isExpired || !isActive ? 'opacity-50' : ''}">
                <td class="px-4 py-3 font-bold">${record.symbol}</td>
                <td class="px-4 py-3 text-center">
                    <span class="level-badge level-${record.level}">等级 ${record.level}</span>
                </td>
                <td class="px-4 py-3 text-center text-sm text-gray-600">${reachedDate.toLocaleString('zh-CN')}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-600">${expiredDate.toLocaleString('zh-CN')}</td>
                <td class="px-4 py-3 text-center ${statusClass}">${statusText}</td>
            </tr>
        `;
    }).join('');
}

// Render all history table
function renderAllHistory(history) {
    const tbody = document.getElementById('allHistoryBody');
    
    if (!history || history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    暂无等级历史记录
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.map(record => {
        const reachedDate = new Date(record.reached_at);
        const expiredDate = new Date(record.expired_at);
        const now = new Date();
        const daysRemaining = Math.ceil((expiredDate - now) / (1000 * 60 * 60 * 24));
        const isExpired = now > expiredDate || record.is_active === 0;
        
        const statusText = isExpired ? '已过期' : '有效';
        const statusClass = isExpired ? 'text-gray-500' : 'text-green-600 font-semibold';
        const daysText = isExpired ? '-' : `${daysRemaining}天`;
        
        const levelClass = record.level >= 5 ? 'level-5' : `level-${record.level}`;
        
        return `
            <tr class="${isExpired ? 'opacity-50' : ''}">
                <td class="px-4 py-3 font-bold">${record.symbol}</td>
                <td class="px-4 py-3 text-center">
                    <span class="level-badge ${levelClass}">等级 ${record.level}</span>
                </td>
                <td class="px-4 py-3 text-center text-sm text-gray-600">${reachedDate.toLocaleString('zh-CN')}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-600">${expiredDate.toLocaleString('zh-CN')}</td>
                <td class="px-4 py-3 text-center text-sm ${isExpired ? 'text-gray-500' : 'text-blue-600 font-semibold'}">${daysText}</td>
                <td class="px-4 py-3 text-center ${statusClass}">${statusText}</td>
            </tr>
        `;
    }).join('');
}

// Load support lines
async function loadSupportLines() {
    try {
        const response = await fetch('/api/support-lines');
        if (!response.ok) throw new Error('Failed to load support lines');
        
        const data = await response.json();
        const lines = data.lines || [];
        
        renderSupportLines(lines);
    } catch (error) {
        console.error('Error loading support lines:', error);
        document.getElementById('supportLinesTable').innerHTML = `
            <p class="text-center text-red-500 py-8">
                <i class="fas fa-exclamation-triangle mr-2"></i>加载失败: ${error.message}
            </p>
        `;
    }
}

// Render support lines table
function renderSupportLines(lines) {
    const container = document.getElementById('supportLinesTable');
    
    if (lines.length === 0) {
        container.innerHTML = `
            <p class="text-center text-gray-500 py-8">
                暂无支撑线设置
            </p>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-purple-50 border-b-2 border-purple-200">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">币种</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">支撑价格</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">当前价格</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">距离支撑</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">操作提示</th>
                        <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">备注</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">更新时间</th>
                    </tr>
                </thead>
                <tbody>
                    ${lines.map(line => {
                        const distance = line.current_price && line.support_price ? 
                            (((line.current_price - line.support_price) / line.support_price) * 100).toFixed(2) : '-';
                        const distanceClass = parseFloat(distance) > 0 ? 'text-red-600' : 'text-green-600';
                        
                        // 操作提示: 距离支撑线小于0.5%时显示"支撑买入"
                        let operationHint = '-';
                        const distanceNum = parseFloat(distance);
                        if (!isNaN(distanceNum) && distanceNum < 0.5) {
                            operationHint = '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm"><i class="fas fa-arrow-up mr-1"></i>支撑买入</span>';
                        }
                        
                        return `
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="px-4 py-3 font-bold">${line.symbol}</td>
                                <td class="px-4 py-3 text-center font-mono">${line.support_price}</td>
                                <td class="px-4 py-3 text-center font-mono">${line.current_price || '-'}</td>
                                <td class="px-4 py-3 text-center ${distanceClass} font-semibold">${distance}%</td>
                                <td class="px-4 py-3 text-center">${operationHint}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">${line.notes || '-'}</td>
                                <td class="px-4 py-3 text-center text-sm text-gray-600">
                                    ${new Date(line.updated_at).toLocaleString('zh-CN')}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Open edit modal for support line
function openEditModal(symbol) {
    const coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) return;
    
    // Check if allowed to set support line
    const level = coin.level || 6;
    const reachedLevel2 = checkLevel2History(symbol);
    
    if (level > 2 && !reachedLevel2) {
        alert('该币种等级不足（需要等级≤2或过去7天内达到过2级），无法设置支撑线');
        return;
    }
    
    document.getElementById('editSymbol').value = symbol;
    document.getElementById('editSymbolDisplay').value = symbol;
    document.getElementById('editSupportPrice').value = '';
    document.getElementById('editNotes').value = '';
    
    document.getElementById('editModal').classList.remove('hidden');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Handle support line form submission
async function handleSupportLineSubmit(e) {
    e.preventDefault();
    
    const symbol = document.getElementById('editSymbol').value;
    const supportPrice = parseFloat(document.getElementById('editSupportPrice').value);
    const notes = document.getElementById('editNotes').value.trim();
    
    if (!symbol || !supportPrice || supportPrice <= 0) {
        alert('请输入有效的支撑价格');
        return;
    }
    
    try {
        const response = await fetch('/api/support-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol,
                support_price: supportPrice,
                notes: notes || null
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to set support line');
        }
        
        alert(`${symbol} 的支撑线已设置为 ${supportPrice}`);
        closeEditModal();
        
        // Refresh support lines if on that tab
        if (!document.getElementById('supportContent').classList.contains('hidden')) {
            loadSupportLines();
        }
    } catch (error) {
        console.error('Error setting support line:', error);
        alert('设置失败: ' + error.message);
    }
}

// Refresh all data
async function refreshData() {
    await loadCoinPriority();
    await loadLevelHistory();
    
    if (!document.getElementById('supportContent').classList.contains('hidden')) {
        await loadSupportLines();
    }
    
    alert('数据已刷新');
}

// ===== K线操作提示导入功能 =====

// 显示导入对话框
async function showImportDialog() {
    document.getElementById('importModal').classList.remove('hidden');
    document.getElementById('importProgress').classList.add('hidden');
    document.getElementById('importResult').classList.add('hidden');
    
    // 加载币种列表
    try {
        const response = await fetch('/api/coins');
        const coins = await response.json();
        allSymbols = coins.map(c => c.symbol);
        
        // 渲染币种复选框
        const container = document.getElementById('symbolCheckboxes');
        container.innerHTML = allSymbols.map(symbol => `
            <label class="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" value="${symbol}" class="symbol-checkbox">
                <span class="text-sm font-medium">${symbol}</span>
            </label>
        `).join('');
        
        // 添加全选/取消全选
        const selectAllDiv = document.createElement('div');
        selectAllDiv.className = 'col-span-3 flex gap-2 mb-2';
        selectAllDiv.innerHTML = `
            <button onclick="selectAllSymbols()" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                全选
            </button>
            <button onclick="deselectAllSymbols()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm">
                取消全选
            </button>
        `;
        container.insertBefore(selectAllDiv, container.firstChild);
        
    } catch (error) {
        console.error('加载币种列表失败:', error);
        document.getElementById('symbolCheckboxes').innerHTML = `
            <div class="col-span-3 text-center text-red-500">
                加载失败: ${error.message}
            </div>
        `;
    }
}

// 关闭导入对话框
function closeImportDialog() {
    document.getElementById('importModal').classList.add('hidden');
}

// 全选币种
function selectAllSymbols() {
    document.querySelectorAll('.symbol-checkbox').forEach(cb => cb.checked = true);
}

// 取消全选
function deselectAllSymbols() {
    document.querySelectorAll('.symbol-checkbox').forEach(cb => cb.checked = false);
}

// 开始导入
async function startImport() {
    // 获取选中的币种
    const selectedSymbols = Array.from(document.querySelectorAll('.symbol-checkbox:checked'))
        .map(cb => cb.value);
    
    if (selectedSymbols.length === 0) {
        alert('请至少选择一个币种');
        return;
    }
    
    // 获取参数
    const timeframe = document.getElementById('importTimeframe').value;
    const limit = parseInt(document.getElementById('importLimit').value);
    
    // 显示进度
    document.getElementById('importProgress').classList.remove('hidden');
    document.getElementById('importResult').classList.add('hidden');
    document.getElementById('startImportBtn').disabled = true;
    document.getElementById('startImportBtn').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>导入中...';
    
    try {
        // 调用导入API
        const response = await fetch('/api/signals/import-from-kline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                symbols: selectedSymbols,
                timeframe: timeframe,
                limit: limit
            })
        });
        
        const result = await response.json();
        
        // 更新进度条
        document.getElementById('importProgressBar').style.width = '100%';
        document.getElementById('importStatus').textContent = '导入完成！';
        
        // 显示结果
        if (result.success) {
            document.getElementById('importResult').classList.remove('hidden');
            document.getElementById('importResult').innerHTML = `
                <div class="bg-green-50 border-l-4 border-green-500 p-4">
                    <p class="text-green-800 font-bold mb-2">
                        <i class="fas fa-check-circle mr-2"></i>${result.message}
                    </p>
                    <div class="text-sm text-green-700 space-y-1">
                        <p>• 做多信号：${result.imported.long} 个</p>
                        <p>• 做空信号：${result.imported.short} 个</p>
                        <p>• 总计：${result.imported.total} 个</p>
                    </div>
                    <div class="mt-3 text-xs text-green-600">
                        <p>${result.explanation.long}</p>
                        <p>${result.explanation.short}</p>
                    </div>
                </div>
            `;
            
            // 刷新信号列表
            await loadSignalStatistics();
            await loadLongSignals();
            await loadShortSignals();
            
            // 3秒后关闭对话框
            setTimeout(() => {
                closeImportDialog();
            }, 3000);
        } else {
            throw new Error(result.error || '导入失败');
        }
        
    } catch (error) {
        console.error('导入失败:', error);
        document.getElementById('importResult').classList.remove('hidden');
        document.getElementById('importResult').innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-4">
                <p class="text-red-800 font-bold">
                    <i class="fas fa-exclamation-triangle mr-2"></i>导入失败
                </p>
                <p class="text-sm text-red-700 mt-2">${error.message}</p>
            </div>
        `;
    } finally {
        document.getElementById('startImportBtn').disabled = false;
        document.getElementById('startImportBtn').innerHTML = '<i class="fas fa-play mr-2"></i>开始导入';
    }
}

// ===== Operation Tips Templates Functions =====

// 操作提示关键字模板定义
const operationTipTemplates = [
    // 做多信号 - 买点（开多仓）
    { keyword: '抄底做多', type: 'long', category: '买点', description: '超卖反弹信号，适合做多开仓' },
    { keyword: '低吸', type: 'long', category: '买点', description: 'RSI低位信号，适合做多开仓' },
    { keyword: '注意启动', type: 'long', category: '买点', description: '震荡收敛后启动信号，适合做多开仓' },
    { keyword: '次日主升', type: 'long', category: '买点', description: '预期主升浪信号，适合做多开仓' },
    { keyword: '支撑买入', type: 'long', category: '买点', description: '价格接近支撑线（0.5%范围内），适合做多开仓' },
    { keyword: '空头陷阱', type: 'long', category: '买点', description: '涨跌幅>-3%，V1成交量，当天下跌，反弹机会，适合做多开仓' },
    
    // 做多信号 - 卖点（平多仓）
    { keyword: '顶部做空', type: 'long', category: '卖点', description: '超买见顶信号，适合做多平仓' },
    { keyword: '高抛', type: 'long', category: '卖点', description: 'RSI高位信号，适合做多平仓' },
    { keyword: '波段高点', type: 'long', category: '卖点', description: '波段顶部信号，适合做多平仓' },
    { keyword: '通用卖点', type: 'long', category: '卖点', description: 'RSI超买通用卖出信号，适合做多平仓' },
    { keyword: '止盈止损', type: 'long', category: '卖点', description: '风控信号，适合做多平仓' },
    { keyword: '急杀诱多', type: 'long', category: '卖点', description: '涨跌幅>-2%，V1成交量，当天涨幅3%-10%，警惕回调，适合做多平仓' },
    
    // 做空信号 - 买点（开空仓）
    { keyword: '顶部做空', type: 'short', category: '买点', description: '超买见顶信号，适合做空开仓' },
    { keyword: '高抛', type: 'short', category: '买点', description: 'RSI高位信号，适合做空开仓' },
    { keyword: '波段高点', type: 'short', category: '买点', description: '波段顶部信号，适合做空开仓' },
    { keyword: '注意回落', type: 'short', category: '买点', description: '震荡发散后回落信号，适合做空开仓' },
    { keyword: '急杀诱多', type: 'short', category: '买点', description: '涨跌幅>-2%，V1成交量，当天涨幅3%-10%，警惕回调，适合做空开仓' },
    
    // 做空信号 - 卖点（平空仓）
    { keyword: '抄底做多', type: 'short', category: '卖点', description: '超卖反弹信号，适合做空平仓' },
    { keyword: '低吸', type: 'short', category: '卖点', description: 'RSI低位信号，适合做空平仓' },
    { keyword: '波段低点', type: 'short', category: '卖点', description: '波段底部信号，适合做空平仓' },
    { keyword: '通用买点', type: 'short', category: '卖点', description: 'RSI超卖通用买入信号，适合做空平仓' },
    { keyword: '止盈止损', type: 'short', category: '卖点', description: '风控信号，适合做空平仓' },
    { keyword: '支撑买入', type: 'short', category: '卖点', description: '价格接近支撑线（0.5%范围内），适合做空平仓' },
    { keyword: '空头陷阱', type: 'short', category: '卖点', description: '涨跌幅>-3%，V1成交量，当天下跌，反弹机会，适合做空平仓' }
];

// 切换操作提示模板面板显示/隐藏
function toggleTipsPanel() {
    const panel = document.getElementById('tipsPanel');
    const toggleText = document.getElementById('tipsPanelToggleText');
    
    tipsPanelOpen = !tipsPanelOpen;
    
    if (tipsPanelOpen) {
        panel.style.display = 'block';
        toggleText.textContent = '隐藏模板列表';
        renderOperationTipTemplates(); // 渲染模板列表
    } else {
        panel.style.display = 'none';
        toggleText.textContent = '查看模板列表';
    }
}

// 全局变量：存储已导入的信号名称
let importedSignalNames = new Set();

// 渲染操作提示关键字模板列表
async function renderOperationTipTemplates() {
    const container = document.getElementById('tipsListContainer');
    
    // 先获取已存在的信号列表
    await updateImportedSignalsCache();
    
    const html = operationTipTemplates.map((template, index) => {
        const isBuyPoint = template.category === '买点';
        const isLongSignal = template.type === 'long';
        
        // 检查是否已导入
        const signalName = `${template.keyword}（${template.category}）`;
        const isImported = importedSignalNames.has(signalName);
        
        // 根据信号类型和买卖点确定颜色
        let bgClass, borderClass, textClass, iconClass, btnClass;
        
        if (isLongSignal) {
            // 做多信号：买点=绿色，卖点=橙色
            bgClass = isBuyPoint ? 'bg-green-50' : 'bg-orange-50';
            borderClass = isBuyPoint ? 'border-green-200' : 'border-orange-200';
            textClass = isBuyPoint ? 'text-green-700' : 'text-orange-700';
            iconClass = isBuyPoint ? 'fa-arrow-up' : 'fa-arrow-down';
            btnClass = isBuyPoint ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700';
        } else {
            // 做空信号：买点=红色，卖点=蓝色
            bgClass = isBuyPoint ? 'bg-red-50' : 'bg-blue-50';
            borderClass = isBuyPoint ? 'border-red-200' : 'border-blue-200';
            textClass = isBuyPoint ? 'text-red-700' : 'text-blue-700';
            iconClass = isBuyPoint ? 'fa-arrow-down' : 'fa-arrow-up';
            btnClass = isBuyPoint ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
        }
        
        const signalTypeText = isLongSignal ? '做多' : '做空';
        
        // 导入状态标签和按钮
        let statusBadge = '';
        let importButton = '';
        
        if (isImported) {
            statusBadge = `
                <span class="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-300">
                    <i class="fas fa-check-circle mr-1 text-green-500"></i>已导入
                </span>
            `;
            importButton = `
                <button 
                    disabled
                    class="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap cursor-not-allowed opacity-60"
                    title="该模板已导入"
                >
                    <i class="fas fa-check mr-1"></i>已导入
                </button>
            `;
        } else {
            statusBadge = `
                <span class="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                    <i class="fas fa-circle mr-1 text-yellow-500" style="font-size: 6px;"></i>未导入
                </span>
            `;
            importButton = `
                <button 
                    onclick="importSingleTemplate(${index})"
                    class="${btnClass} text-white px-4 py-2 rounded-lg transition text-sm font-bold whitespace-nowrap"
                    title="导入此模板到特征库"
                >
                    <i class="fas fa-plus mr-1"></i>导入
                </button>
            `;
        }
        
        return `
            <div class="border-2 ${borderClass} ${bgClass} rounded-lg p-4 hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <i class="fas ${iconClass} ${textClass} text-xl"></i>
                            <span class="font-bold text-lg text-gray-800">${template.keyword}</span>
                            <span class="px-3 py-1 ${bgClass} ${textClass} rounded-full text-xs font-bold border ${borderClass}">
                                ${signalTypeText}${template.category}
                            </span>
                            ${statusBadge}
                        </div>
                        <p class="text-sm text-gray-600 ml-8">${template.description}</p>
                    </div>
                    <div class="ml-4">
                        ${importButton}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// 更新已导入信号的缓存
async function updateImportedSignalsCache() {
    try {
        // 获取做多信号
        const longResponse = await fetch('/api/signals/long');
        const longSignals = longResponse.ok ? await longResponse.json() : [];
        
        // 获取做空信号
        const shortResponse = await fetch('/api/signals/short');
        const shortSignals = shortResponse.ok ? await shortResponse.json() : [];
        
        // 合并并提取信号名称
        const allSignals = [...longSignals, ...shortSignals];
        importedSignalNames = new Set(allSignals.map(s => s.signal_name));
        
        console.log('📊 已缓存已导入的信号:', importedSignalNames.size, '个');
    } catch (error) {
        console.error('❌ 更新导入信号缓存失败:', error);
        importedSignalNames = new Set();
    }
}

// 导入单个模板到特征库
async function importSingleTemplate(index) {
    const template = operationTipTemplates[index];
    
    try {
        // 根据分类确定入场/出场类型
        const entryExit = template.category === '买点' ? 'entry' : 'exit';
        
        const signalData = {
            signal_type: template.type,
            signal_name: `${template.keyword}（${template.category}）`,
            category: 'action_hint',
            description: template.description,
            entry_exit: entryExit,
            conditions: JSON.stringify({
                operation_tip_keyword: template.keyword,
                signal_category: template.category,
                template_type: 'predefined'
            }),
            priority: 'medium',
            is_enabled: true
        };
        
        const response = await fetch('/api/signals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signalData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', `成功导入模板: ${template.keyword}`);
            await loadSignalStatistics();
            await loadLongSignals();
            await loadShortSignals();
            // 重新渲染模板列表以更新导入状态
            await renderOperationTipTemplates();
        } else {
            showNotification('error', `导入失败: ${result.error}`);
        }
        
    } catch (error) {
        console.error('导入模板失败:', error);
        showNotification('error', `导入失败: ${error.message}`);
    }
}

// 一键导入所有操作提示模板
async function importOperationTipTemplates() {
    const confirmed = confirm(`确认要导入所有 ${operationTipTemplates.length} 个操作提示关键字模板吗？`);
    if (!confirmed) return;
    
    try {
        let successCount = 0;
        let failCount = 0;
        
        for (const template of operationTipTemplates) {
            try {
                // 根据分类确定入场/出场类型
                const entryExit = template.category === '买点' ? 'entry' : 'exit';
                
                const signalData = {
                    signal_type: template.type,
                    signal_name: `${template.keyword}（${template.category}）`,
                    category: 'action_hint',
                    description: template.description,
                    entry_exit: entryExit,
                    conditions: JSON.stringify({
                        operation_tip_keyword: template.keyword,
                        signal_category: template.category,
                        template_type: 'predefined'
                    }),
                    priority: 'medium',
                    is_enabled: true
                };
                
                const response = await fetch('/api/signals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(signalData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`导入 ${template.keyword} 失败:`, result.error);
                }
                
            } catch (error) {
                failCount++;
                console.error(`导入 ${template.keyword} 失败:`, error);
            }
        }
        
        // 显示结果
        if (successCount > 0) {
            showNotification('success', `成功导入 ${successCount} 个模板${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
            await loadSignalStatistics();
            await loadLongSignals();
            await loadShortSignals();
            // 重新渲染模板列表以更新导入状态
            await renderOperationTipTemplates();
        } else {
            showNotification('error', `导入失败，所有模板均未成功导入`);
        }
        
    } catch (error) {
        console.error('批量导入模板失败:', error);
        showNotification('error', `批量导入失败: ${error.message}`);
    }
}

// 🔄 从K线数据同步操作提示到模板库
async function syncOperationTipsFromKline() {
    try {
        showNotification('info', '正在同步K线操作提示数据...');
        
        // 获取K线数据中的所有唯一操作提示
        const response = await fetch('/api/kline/operation-tips/unique');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '获取操作提示失败');
        }
        
        const klineOperationTips = result.operation_tips || [];
        console.log('📊 从K线数据获取到的操作提示:', klineOperationTips);
        
        // 获取现有模板中的关键字
        const existingKeywords = new Set(operationTipTemplates.map(t => t.keyword));
        
        // 找出新增的操作提示（不在模板中的）
        const newOperationTips = klineOperationTips.filter(tip => !existingKeywords.has(tip));
        
        if (newOperationTips.length === 0) {
            showNotification('info', '所有K线操作提示已存在于模板库中，无需同步');
            return;
        }
        
        // 自动判断新操作提示的类型和分类
        // 规则：包含"做多"/"低吸"/"抄底" = long买点，包含"做空"/"高抛"/"顶部" = short买点
        //      包含"卖点"/"止盈"/"止损" = 卖点
        const newTemplates = newOperationTips.map(tip => {
            let type = 'long'; // 默认做多
            let category = '买点'; // 默认买点
            
            // 判断信号类型
            if (tip.includes('做空') || tip.includes('高抛') || tip.includes('顶部')) {
                type = 'short';
            }
            
            // 判断信号分类
            if (tip.includes('卖点') || tip.includes('止盈') || tip.includes('止损') || tip.includes('平仓')) {
                category = '卖点';
            }
            
            return {
                keyword: tip,
                type: type,
                category: category,
                description: `从K线数据自动同步的${category}信号`
            };
        });
        
        // 添加到模板数组
        operationTipTemplates.push(...newTemplates);
        
        // 重新渲染模板列表
        renderOperationTipTemplates();
        
        showNotification('success', `成功同步 ${newTemplates.length} 个新操作提示到模板库`);
        
    } catch (error) {
        console.error('❌ 同步操作提示失败:', error);
        showNotification('error', `同步失败: ${error.message}`);
    }
}

// 清空所有信号 - 显示自定义确认对话框
function clearAllSignals() {
    showClearConfirmDialog();
}

// 显示清空确认对话框
function showClearConfirmDialog() {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    overlay.id = 'clearConfirmOverlay';
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 animate-scale-in';
    dialog.innerHTML = `
        <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">⚠️ 危险操作警告</h3>
            <p class="text-gray-600 mb-6">
                此操作将<span class="text-red-600 font-bold">永久删除所有信号</span>，且无法恢复！<br>
                您确定要清空所有信号吗？
            </p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeClearConfirmDialog()" class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition">
                    <i class="fas fa-times mr-2"></i>取消
                </button>
                <button onclick="showSecondConfirm()" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition">
                    <i class="fas fa-trash-alt mr-2"></i>继续
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeClearConfirmDialog();
        }
    });
}

// 显示第二次确认
function showSecondConfirm() {
    const overlay = document.getElementById('clearConfirmOverlay');
    const dialog = overlay.querySelector('div.bg-white');
    
    dialog.innerHTML = `
        <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-600 mb-4">
                <i class="fas fa-exclamation-circle text-white text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-red-600 mb-2">🔴 最后确认</h3>
            <p class="text-gray-600 mb-6">
                这是最后一次确认！<br>
                点击"确定删除"将<span class="text-red-600 font-bold">立即永久删除</span>所有信号数据！
            </p>
            <div class="flex gap-3 justify-center">
                <button onclick="closeClearConfirmDialog()" class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition">
                    <i class="fas fa-times mr-2"></i>我再想想
                </button>
                <button onclick="executeClearAllSignals()" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition animate-pulse">
                    <i class="fas fa-trash-alt mr-2"></i>确定删除
                </button>
            </div>
        </div>
    `;
}

// 关闭确认对话框
function closeClearConfirmDialog() {
    const overlay = document.getElementById('clearConfirmOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// 执行清空操作
async function executeClearAllSignals() {
    closeClearConfirmDialog();
    
    // 显示加载提示
    showNotification('info', '正在清空所有信号...');
    
    try {
        const response = await fetch('/api/signals', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', `✅ 已清空所有信号（共删除 ${result.deletedCount} 个）`);
            
            // 刷新页面数据
            await loadSignalStatistics();
            await loadLongSignals();
            await loadShortSignals();
        } else {
            showNotification('error', `清空失败: ${result.error}`);
        }
        
    } catch (error) {
        console.error('清空所有信号失败:', error);
        showNotification('error', `清空失败: ${error.message}`);
    }
}

// 显示通知消息
function showNotification(type, message) {
    const notification = document.createElement('div');
    let bgColor, icon;
    
    if (type === 'success') {
        bgColor = 'bg-green-500';
        icon = 'fa-check-circle';
    } else if (type === 'info') {
        bgColor = 'bg-blue-500';
        icon = 'fa-info-circle';
    } else {
        bgColor = 'bg-red-500';
        icon = 'fa-exclamation-circle';
    }
    
    notification.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${icon} text-xl"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== Manual Level History Functions =====

// 显示手动添加等级历史对话框
function showAddHistoryDialog() {
    document.getElementById('addHistoryModal').classList.remove('hidden');
    document.getElementById('addHistoryForm').reset();
    
    // 设置默认时间为当前时间
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    document.getElementById('historyReachedTime').value = localDateTime;
}

// 关闭手动添加等级历史对话框
function closeAddHistoryDialog() {
    document.getElementById('addHistoryModal').classList.add('hidden');
}

// 处理手动添加等级历史表单提交
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addHistoryForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddLevelHistory();
        });
    }
});

// 执行添加等级历史
async function handleAddLevelHistory() {
    let symbol = document.getElementById('historySymbol').value.trim().toUpperCase();
    const level = parseInt(document.getElementById('historyLevel').value);
    const reachedTimeInput = document.getElementById('historyReachedTime').value;
    
    if (!symbol || !level) {
        showNotification('error', '请填写必填项');
        return;
    }
    
    // 自动添加USDT后缀（如果用户没有输入交易对）
    if (!symbol.includes('USDT') && !symbol.includes('BTC') && !symbol.includes('ETH')) {
        symbol = symbol + 'USDT';
    }
    
    try {
        // 转换时间为ISO格式
        let reachedTime;
        if (reachedTimeInput) {
            reachedTime = new Date(reachedTimeInput).toISOString();
        } else {
            reachedTime = new Date().toISOString();
        }
        
        const response = await fetch('/api/coin-priority/level-history/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: symbol,
                level: level,
                reached_time: reachedTime
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', `✅ 成功添加 ${symbol} 的等级${level}历史记录`);
            closeAddHistoryDialog();
            
            // 刷新等级历史列表
            await loadLevelHistory();
        } else {
            showNotification('error', `添加失败: ${result.error}`);
        }
        
    } catch (error) {
        console.error('添加等级历史失败:', error);
        showNotification('error', `添加失败: ${error.message}`);
    }
}

// ===== 自动刷新支撑线价格 (每5分钟) =====
let supportLineRefreshInterval = null;

function startSupportLineAutoRefresh() {
    // 清除现有定时器（如果有）
    if (supportLineRefreshInterval) {
        clearInterval(supportLineRefreshInterval);
    }
    
    // 设置5分钟刷新一次
    supportLineRefreshInterval = setInterval(async () => {
        // 只在支撑线标签页激活时刷新
        const supportTab = document.getElementById('supportSubContent');
        if (supportTab && supportTab.classList.contains('active')) {
            console.log('🔄 自动刷新支撑线价格...');
            await loadSupportLines();
        }
    }, 5 * 60 * 1000); // 5分钟 = 300000毫秒
    
    console.log('✅ 支撑线自动刷新已启动 (每5分钟)');
}

// 页面加载完成后启动自动刷新
document.addEventListener('DOMContentLoaded', () => {
    startSupportLineAutoRefresh();
});

// ===== 交易规则管理 =====
let tradingRulesData = [];

// 加载交易规则
async function loadTradingRules() {
    try {
        const response = await fetch('/api/trading-rules');
        if (!response.ok) throw new Error('Failed to load trading rules');
        
        const data = await response.json();
        tradingRulesData = data.rules || [];
        
        renderTradingRulesTable(tradingRulesData);
    } catch (error) {
        console.error('Error loading trading rules:', error);
        document.getElementById('tradingRulesTable').innerHTML = `
            <p class="text-center text-red-500 py-8">
                <i class="fas fa-exclamation-triangle mr-2"></i>加载失败: ${error.message}
            </p>
        `;
    }
}

// 渲染交易规则表格
function renderTradingRulesTable(rules) {
    const container = document.getElementById('tradingRulesTable');
    
    if (rules.length === 0) {
        container.innerHTML = `
            <p class="text-center text-gray-500 py-8">
                暂无交易规则数据
            </p>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full" id="tradingRulesTableElement">
                <thead class="bg-blue-50 border-b-2 border-blue-200">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">币种</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">允许交易</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">允许开多</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">允许开空</th>
                        <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">备注</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${rules.map(rule => {
                        const tradingAllowed = rule.trading_allowed === 1;
                        const longAllowed = rule.long_allowed === 1;
                        const shortAllowed = rule.short_allowed === 1;
                        
                        return `
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition" data-symbol="${rule.symbol}">
                                <td class="px-4 py-3 font-bold">${rule.symbol}</td>
                                <td class="px-4 py-3 text-center">
                                    <button onclick="toggleTradingRule('${rule.symbol}', 'trading')" 
                                        class="px-3 py-1 rounded text-sm font-semibold transition ${tradingAllowed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
                                        ${tradingAllowed ? '<i class="fas fa-check-circle"></i> 可用' : '<i class="fas fa-times-circle"></i> 不可用'}
                                    </button>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <button onclick="toggleTradingRule('${rule.symbol}', 'long')" 
                                        class="px-3 py-1 rounded text-sm font-semibold transition ${longAllowed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
                                        ${longAllowed ? '<i class="fas fa-arrow-up"></i> 允许' : '<i class="fas fa-ban"></i> 禁止'}
                                    </button>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <button onclick="toggleTradingRule('${rule.symbol}', 'short')" 
                                        class="px-3 py-1 rounded text-sm font-semibold transition ${shortAllowed ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
                                        ${shortAllowed ? '<i class="fas fa-arrow-down"></i> 允许' : '<i class="fas fa-ban"></i> 禁止'}
                                    </button>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600">${rule.notes || '默认允许所有交易'}</td>
                                <td class="px-4 py-3 text-center">
                                    <button onclick="saveTradingRule('${rule.symbol}')" 
                                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition">
                                        <i class="fas fa-save mr-1"></i>保存
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 切换交易规则（只在前端修改，不保存）
function toggleTradingRule(symbol, type) {
    const rule = tradingRulesData.find(r => r.symbol === symbol);
    if (!rule) return;
    
    if (type === 'trading') {
        rule.trading_allowed = rule.trading_allowed === 1 ? 0 : 1;
    } else if (type === 'long') {
        rule.long_allowed = rule.long_allowed === 1 ? 0 : 1;
    } else if (type === 'short') {
        rule.short_allowed = rule.short_allowed === 1 ? 0 : 1;
    }
    
    // 重新渲染表格
    renderTradingRulesTable(tradingRulesData);
}

// 保存单个交易规则
async function saveTradingRule(symbol) {
    const rule = tradingRulesData.find(r => r.symbol === symbol);
    if (!rule) return;
    
    try {
        const response = await fetch(`/api/trading-rules/${symbol}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trading_allowed: rule.trading_allowed,
                long_allowed: rule.long_allowed,
                short_allowed: rule.short_allowed,
                notes: rule.notes || undefined
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', `✅ ${symbol} 交易规则保存成功`);
            // 不重新加载，保持当前状态
        } else {
            showNotification('error', `保存失败: ${result.error}`);
        }
    } catch (error) {
        console.error('保存交易规则失败:', error);
        showNotification('error', `保存失败: ${error.message}`);
    }
}

// 批量更新交易规则
async function batchUpdateTradingRules(action) {
    let confirmMessage = '';
    let endpoint = '';
    
    if (action === 'enable_all') {
        confirmMessage = '确认要将所有币种设置为【允许交易、允许开多、允许开空】吗？';
        endpoint = '/api/trading-rules/reset';
    } else if (action === 'long_only') {
        confirmMessage = '确认要将所有币种设置为【允许交易、仅允许开多、禁止开空】吗？';
        endpoint = '/api/trading-rules/long-only';
    } else if (action === 'disable_all') {
        confirmMessage = '确认要将所有币种设置为【禁止交易、禁止开多、禁止开空】吗？';
        endpoint = '/api/trading-rules/disable-all';
    }
    
    if (!confirm(confirmMessage)) return;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', `✅ 批量更新成功: ${result.message}`);
            await loadTradingRules();
        } else {
            showNotification('error', `批量更新失败: ${result.error}`);
        }
    } catch (error) {
        console.error('批量更新失败:', error);
        showNotification('error', `批量更新失败: ${error.message}`);
    }
}
