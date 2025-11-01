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
                        <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">备注</th>
                        <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">更新时间</th>
                    </tr>
                </thead>
                <tbody>
                    ${lines.map(line => {
                        const distance = line.current_price && line.support_price ? 
                            (((line.current_price - line.support_price) / line.support_price) * 100).toFixed(2) : '-';
                        const distanceClass = parseFloat(distance) > 0 ? 'text-red-600' : 'text-green-600';
                        
                        return `
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="px-4 py-3 font-bold">${line.symbol}</td>
                                <td class="px-4 py-3 text-center font-mono">${line.support_price}</td>
                                <td class="px-4 py-3 text-center font-mono">${line.current_price || '-'}</td>
                                <td class="px-4 py-3 text-center ${distanceClass} font-semibold">${distance}%</td>
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
