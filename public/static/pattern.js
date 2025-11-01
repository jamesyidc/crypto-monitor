// Signal Library Management JavaScript
// Manages long signals, short signals, and coin level history

let currentSignalType = null; // 'long' or 'short'
let editingSignalId = null;

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
                    <div class="text-xs text-gray-500">
                        ${Object.keys(conditions).length > 0 ? `<div class="mt-1">条件: ${JSON.stringify(conditions, null, 2).substring(0, 100)}...</div>` : ''}
                        ${signal.success_rate ? `<div class="mt-1">成功率: ${(signal.success_rate * 100).toFixed(1)}%</div>` : ''}
                    </div>
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
